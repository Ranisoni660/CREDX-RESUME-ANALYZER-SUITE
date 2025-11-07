# app.py - CREDX RESUME ANALYZER SUITE (Advanced NLP Version)
import os
import re
import nltk
import spacy
import pdfplumber
import pandas as pd
from docx import Document
from PyPDF2 import PdfReader
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from werkzeug.utils import secure_filename
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# === FLASK SETUP ===
app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

# === ENVIRONMENT & PATHS ===
if os.environ.get('RENDER'):
    UPLOAD_FOLDER = '/opt/render/project/src/uploads'
    NLTK_DATA_PATH = '/opt/render/project/src/nltk_data'
else:
    UPLOAD_FOLDER = 'uploads'
    NLTK_DATA_PATH = 'nltk_data'

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(NLTK_DATA_PATH, exist_ok=True)

# === NLTK SETUP ===
nltk.data.path.append(NLTK_DATA_PATH)
nltk.download('punkt', download_dir=NLTK_DATA_PATH, quiet=True)
nltk.download('stopwords', download_dir=NLTK_DATA_PATH, quiet=True)
nltk.download('wordnet', download_dir=NLTK_DATA_PATH, quiet=True)
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# === SPACY SETUP ===
try:
    nlp = spacy.load("en_core_web_sm")
except:
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# === LOAD DATA ===
def load_data():
    try:
        job_roles = pd.read_csv('job_roles_final.csv')
        skills_courses = pd.read_csv('skills_courses.csv', on_bad_lines='skip', engine='python')
        return job_roles, skills_courses
    except Exception as e:
        print(f"Error loading data: {e}")
        return pd.DataFrame(), pd.DataFrame()

job_roles_df, skills_courses_df = load_data()

# === TEXT EXTRACTION ===
def extract_text(file_path):
    text = ""
    _, ext = os.path.splitext(file_path)
    ext = ext.lower()

    try:
        if ext == '.pdf':
            # Try pdfplumber first
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            if len(text.strip()) < 100:
                # Fallback to PyPDF2
                reader = PdfReader(file_path)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        
        elif ext in ['.docx', '.doc']:
            doc = Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        
        return text.lower().strip()
    except Exception as e:
        print(f"Extraction error: {e}")
        return ""

# === SMART SKILL MATCHING ===
def extract_skills_from_text(text, known_skills):
    stop_words = set(stopwords.words('english'))
    tokens = word_tokenize(text)
    tokens = [t.lower() for t in tokens if t.isalpha() and t.lower() not in stop_words]

    # spaCy NER for technical entities
    doc = nlp(text)
    ner_skills = [ent.text.lower() for ent in doc.ents if ent.label_ in ['PRODUCT', 'ORG', 'TECH']]

    # Direct match + fuzzy
    matched = set()
    for skill in known_skills:
        skill_lower = skill.lower()
        if any(re.search(r'\b' + re.escape(skill_lower) + r'\b', t) for t in tokens + ner_skills):
            matched.add(skill)
        elif any(skill_lower in token or token in skill_lower for token in tokens):
            matched.add(skill)

    return list(matched)

# === COSINE SIMILARITY SCORE ===
def calculate_similarity(text1, text2):
    if not text1 or not text2:
        return 0
    vectorizer = TfidfVectorizer(stop_words='english')
    try:
        tfidf = vectorizer.fit_transform([text1, text2])
        similarity = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        return round(similarity * 100, 2)
    except:
        return 0

# === MAIN ANALYSIS ===
def analyze_resume(resume_text, job_role, jd_text=""):
    if job_roles_df.empty:
        return None

    job_data = job_roles_df[job_roles_df['job_role'].str.lower() == job_role.lower()]
    if job_data.empty:
        return None

    row = job_data.iloc[0]
    required_skills = [s.strip() for s in str(row['skills']).split(',') if s.strip()]
    keywords = [k.strip().lower() for k in str(row['keywords']).split(',') if k.strip()]

    full_text = resume_text + " " + jd_text.lower()
    matched_skills = extract_skills_from_text(full_text, required_skills)
    missing_skills = [s for s in required_skills if s.lower() not in [m.lower() for m in matched_skills]]

    # Similarity score
    jd_similarity = calculate_similarity(resume_text, jd_text) if jd_text else 0
    skill_match_ratio = len(matched_skills) / len(required_skills) if required_skills else 0
    final_score = round((skill_match_ratio * 70) + (jd_similarity * 0.3), 0)
    final_score = min(max(int(final_score), 0), 100)

    return {
        'match_score': final_score,
        'matched_skills': matched_skills,
        'missing_skills': missing_skills,
        'keywords_found': [k for k in keywords if k in full_text],
        'similarity_score': jd_similarity,
        'recommendations': generate_recommendations(final_score, missing_skills),
        'courses': get_courses(missing_skills),
        'job_info': {
            'title': row['job_role'],
            'category': row['category'],
            'salary_range': row.get('salary_range', 'N/A')
        }
    }

def generate_recommendations(score, missing):
    tips = [
        "Add 2–3 projects with GitHub links",
        "Use action verbs: Built, Led, Optimized",
        "Include certifications (AWS, Google, etc.)",
        "Quantify achievements: 'Reduced latency by 40%'"
    ]
    if score >= 85:
        return ["Outstanding match! Apply now."] + tips[:2]
    elif score >= 70:
        return [f"Strong — add: {', '.join(missing[:3])}"] + tips
    else:
        return [f"Improve by learning: {', '.join(missing[:5])}"] + tips

def get_courses(skills):
    courses = {'free': [], 'paid': []}
    for skill in skills[:10]:
        match = skills_courses_df[skills_courses_df['skill'].str.lower() == skill.lower()]
        if not match.empty:
            r = match.iloc[0]
            if pd.notna(r.get('free_course')):
                courses['free'].append({'skill': skill.title(), 'course': r['free_course']})
            for i in range(1, 4):
                pc = r.get(f'paid_course_{i}')
                if pd.notna(pc):
                    courses['paid'].append({'skill': skill.title(), 'course': pc})
    return courses

# === ROUTES ===
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/job_roles')
def get_roles():
    if job_roles_df.empty:
        return jsonify([])
    data = job_roles_df[['category', 'subcategory', 'job_role']].drop_duplicates()
    return jsonify(data.to_dict('records'))

@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'resume' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['resume']
    job_role = request.form.get('job_role')
    jd_text = request.form.get('job_description', '')

    if not all([file, job_role, file.filename]):
        return jsonify({'error': 'Missing data'}), 400

    if not file.filename.lower().endswith(('.pdf', '.docx', '.doc')):
        return jsonify({'error': 'Only PDF/DOCX allowed'}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        text = extract_text(filepath)
        if len(text) < 200:
            return jsonify({'error': 'Could not extract text. Use text-based PDF/DOCX.'}), 400

        result = analyze_resume(text, job_role, jd_text)
        if not result:
            return jsonify({'error': 'Job role not found'}), 404

        return jsonify(result)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Analysis failed'}), 500
    finally:
        if os.path.exists(filepath):
            try: os.remove(filepath)
            except: pass

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
