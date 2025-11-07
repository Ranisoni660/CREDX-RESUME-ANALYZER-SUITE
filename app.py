import pdfplumber
import pandas as pd
from flask import Flask, request, jsonify, render_template
import re
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

# === AUTO DETECT ENVIRONMENT ===
if os.environ.get('RENDER'):
    UPLOAD_FOLDER = '/opt/render/project/src/uploads'
elif os.environ.get('RAILWAY_STATIC_URL'):
    UPLOAD_FOLDER = '/app/uploads'
else:
    UPLOAD_FOLDER = 'uploads'

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB

# === LOAD DATA ===
def load_data():
    try:
        job_roles = pd.read_csv('job_roles_final.csv')
        skills_courses = pd.read_csv('skills_courses.csv', on_bad_lines='skip', engine='python')
        return job_roles, skills_courses
    except Exception as e:
        print(f"CSV load error: {e}")
        return pd.DataFrame(), pd.DataFrame()

job_roles_df, skills_courses_df = load_data()

# === PDF EXTRACTION ===
def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.lower().strip()
    except Exception as e:
        print(f"PDF error: {e}")
        return ""

# === HELPER ===
def parse_field(field):
    if pd.isna(field) or not field:
        return []
    return [item.strip().lower() for item in str(field).split(',') if item.strip()]

# === ANALYSIS ===
def analyze_resume(resume_text, job_role, jd_text=""):
    if job_roles_df.empty:
        return None

    job_data = job_roles_df[job_roles_df['job_role'].str.lower() == job_role.lower()]
    if job_data.empty:
        return None

    row = job_data.iloc[0]
    required_skills = parse_field(row['skills'])
    keywords = parse_field(row['keywords'])

    full_text = resume_text + " " + jd_text.lower()

    matched_skills = [s for s in required_skills if re.search(r'\b' + re.escape(s) + r'\b', full_text)]
    matched_keywords = [k for k in keywords if re.search(r'\b' + re.escape(k) + r'\b', full_text)]
    missing_skills = [s for s in required_skills if s not in matched_skills]

    skill_score = (len(matched_skills) / max(len(required_skills), 1)) * 70
    keyword_score = (len(matched_keywords) / max(len(keywords), 1)) * 30
    match_score = min(round(skill_score + keyword_score), 100)

    return {
        'match_score': match_score,
        'matched_skills': matched_skills,
        'missing_skills': missing_skills,
        'keywords_used': matched_keywords,
        'recommendations': generate_recommendations(match_score, missing_skills),
        'courses': get_recommended_courses(missing_skills),
        'job_description': row.to_dict()
    }

def generate_recommendations(score, missing):
    tips = [
        "Add numbers to achievements (e.g., 'Boosted sales 40%')",
        "Use exact job description keywords",
        "Include GitHub/projects with links",
        "Add relevant certifications",
        "Keep formatting simple for ATS"
    ]
    if score >= 85:
        return ["Excellent! Ready to apply."] + tips[:2]
    elif score >= 70:
        return [f"Strong — learn: {', '.join(missing[:3])}"] + tips[:3]
    else:
        return [f"Add top skills: {', '.join(missing[:5] or ['Python, SQL'])}"] + tips

def get_recommended_courses(missing):
    courses = {'free': [], 'paid': []}
    for skill in missing[:8]:
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
def get_job_roles():
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

    if not job_role or not file or file.filename == '':
        return jsonify({'error': 'Missing data'}), 400
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'PDF only'}), 400

    filename = secure_filename(file.filename)
    path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(path)

    try:
        text = extract_text_from_pdf(path)
        if len(text) < 200:
            return jsonify({'error': 'Could not read PDF text. Use text-based PDF.'}), 400

        result = analyze_resume(text, job_role, jd_text)
        if not result:
            return jsonify({'error': 'Job role not found'}), 404

        return jsonify(result)

    except Exception as e:
        print(e)
        return jsonify({'error': 'Server error'}), 500
    finally:
        try:
            os.remove(path)
        except:
            pass

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
