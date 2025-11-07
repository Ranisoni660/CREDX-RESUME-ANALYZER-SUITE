import pdfplumber
import pandas as pd
from flask import Flask, request, jsonify, render_template, send_from_directory
import re
import os
from werkzeug.utils import secure_filename
import tempfile

app = Flask(__name__)

# === CONFIGURATION ===
# Use persistent disk on Render/Railway, fallback to local
if os.environ.get('RENDER') or os.environ.get('RAILWAY_STATIC_URL'):
    UPLOAD_FOLDER = '/opt/render/project/src/uploads' if os.environ.get('RENDER') else '/app/uploads'
else:
    UPLOAD_FOLDER = 'uploads'

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file

# === LOAD DATA ===
def load_data():
    try:
        job_roles = pd.read_csv('job_roles_final.csv')
        skills_courses = pd.read_csv('skills_courses.csv', on_bad_lines='skip', engine='python')
        return job_roles, skills_courses
    except Exception as e:
        print(f"Error loading CSV files: {e}")
        return pd.DataFrame(), pd.DataFrame()

job_roles_df, skills_courses_df = load_data()

# === PDF TEXT EXTRACTION ===
def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.lower()
    except Exception as e:
        print(f"Error extracting text: {e}")
        return ""

# === HELPER: Parse CSV fields ===
def parse_field(field):
    if pd.isna(field) or not field:
        return []
    return [item.strip().lower() for item in str(field).split(',') if item.strip()]

# === ANALYZE RESUME ===
def analyze_resume(resume_text, job_role, jd_text=""):
    job_data = job_roles_df[job_roles_df['job_role'].str.lower() == job_role.lower()]
    if job_data.empty:
        return None

    row = job_data.iloc[0]
    required_skills = parse_field(row['skills'])
    keywords = parse_field(row['keywords'])

    analysis_text = resume_text
    if jd_text:
        analysis_text += " " + jd_text.lower()

    # Match skills & keywords (word boundaries)
    matched_skills = [s for s in required_skills if re.search(r'\b' + re.escape(s) + r'\b', analysis_text)]
    matched_keywords = [k for k in keywords if re.search(r'\b' + re.escape(k) + r'\b', analysis_text)]
    missing_skills = [s for s in required_skills if s not in matched_skills]

    # Scoring
    skill_score = (len(matched_skills) / len(required_skills) * 70) if required_skills else 0
    keyword_score = (len(matched_keywords) / len(keywords) * 30) if keywords else 0
    match_score = min(round(skill_score + keyword_score), 100)

    recommendations = generate_recommendations(match_score, missing_skills)
    courses = get_recommended_courses(missing_skills)

    return {
        'match_score': match_score,
        'matched_skills': matched_skills,
        'missing_skills': missing_skills,
        'keywords_used': matched_keywords,
        'recommendations': recommendations,
        'courses': courses,
        'job_description': row.to_dict()
    }

# === RECOMMENDATIONS ===
def generate_recommendations(score, missing_skills):
    tips = [
        "Add quantifiable achievements (e.g., 'Increased sales by 30%')",
        "Use standard section headers: Experience, Education, Skills",
        "Include 2–3 relevant projects with tech stack and results",
        "Add certifications (e.g., AWS, Google Data Analytics)",
        "Tailor resume to job description keywords",
        "Keep resume to 1 page (or 2 for senior roles)",
        "Use action verbs: Developed, Led, Optimized, Built"
    ]

    if score >= 90:
        return ["Excellent match! Your resume is highly competitive."] + tips[:2]
    elif score >= 75:
        return [f"Great fit! Focus on: {', '.join(missing_skills[:2])}"] + tips[:4]
    elif score >= 50:
        return [f"Moderate match. Add these skills: {', '.join(missing_skills[:4])}"] + tips
    else:
        return [f"Needs improvement. Priority: {', '.join(missing_skills[:5] or ['core skills'])}",
                "Consider rebuilding resume with job-specific keywords"] + tips

# === COURSES ===
def get_recommended_courses(missing_skills):
    courses = {'free': [], 'paid': []}

    # Soft skills
    soft = skills_courses_df[skills_courses_df['sector'].str.contains('Non-Tech|Soft', na=False)]
    for _, row in soft.iterrows():
        if pd.notna(row.get('free_course')):
            courses['free'].append({'skill': 'Communication & Leadership', 'course': row['free_course'], 'platform': 'Coursera'})
        if pd.notna(row.get('paid_course_1')):
            courses['paid'].append({'skill': 'Professional Skills', 'course': row['paid_course_1'], 'platform': 'LinkedIn'})

    # Technical skills
    for skill in missing_skills[:10]:
        matches = skills_courses_df[skills_courses_df['skill'].str.lower() == skill.lower()]
        if not matches.empty:
            r = matches.iloc[0]
            if pd.notna(r.get('free_course')):
                courses['free'].append({'skill': skill.title(), 'course': r['free_course'], 'platform': r.get('sector', 'Online')})
            for i in range(1, 5):
                pc = r.get(f'paid_course_{i}')
                if pd.notna(pc):
                    courses['paid'].append({'skill': skill.title(), 'course': pc, 'platform': r.get('sector', 'Premium')})

    return courses

# === ROUTES ===
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/job_roles', methods=['GET'])
def get_job_roles():
    categories = job_roles_df[['category', 'subcategory', 'job_role']].drop_duplicates()
    return jsonify(categories.to_dict('records'))

@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'resume' not in request.files:
        return jsonify({'error': 'No resume file uploaded'}), 400

    resume_file = request.files['resume']
    job_role = request.form.get('job_role')
    jd_text = request.form.get('job_description', '')

    if not job_role:
        return jsonify({'error': 'Job role is required'}), 400
    if resume_file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if not resume_file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    filename = secure_filename(resume_file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    resume_file.save(filepath)

    try:
        resume_text = extract_text_from_pdf(filepath)
        if len(resume_text.strip()) < 100:
            return jsonify({'error': 'Could not extract text from PDF. Try a text-based PDF.'}), 400

        result = analyze_resume(resume_text, job_role, jd_text)
        if not result:
            return jsonify({'error': 'Job role not found in database'}), 404

        return jsonify(result)

    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({'error': 'Analysis failed. Please try again.'}), 500
    finally:
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except:
                pass

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
