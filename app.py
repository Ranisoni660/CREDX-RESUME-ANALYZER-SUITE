import pdfplumber
import pandas as pd
from flask import Flask, request, jsonify, render_template, send_from_directory
import re
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Load data files
def load_data():
    job_roles = pd.read_csv('job_roles_final.csv')
    skills_courses = pd.read_csv('skills_courses.csv', on_bad_lines='skip', engine='python')
    return job_roles, skills_courses

job_roles_df, skills_courses_df = load_data()

# Extract text from PDF
def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text.lower()
    except Exception as e:
        print(f"Error extracting text: {e}")
        return ""

# Clean and split CSV fields
def parse_field(field):
    if pd.isna(field):
        return []
    return [item.strip().lower() for item in str(field).split(',')]

# Analyze resume against job role
def analyze_resume(resume_text, job_role, jd_text=""):
    job_data = job_roles_df[job_roles_df['job_role'].str.lower() == job_role.lower()]
    if job_data.empty:
        return None
    
    row = job_data.iloc[0]
    required_skills = parse_field(row['skills'])
    keywords = parse_field(row['keywords'])
    
    # Combine resume and JD text for analysis if JD is provided
    analysis_text = resume_text
    if jd_text:
        analysis_text += " " + jd_text.lower()
    
    # Match skills and keywords
    matched_skills = [skill for skill in required_skills if re.search(r'\b' + re.escape(skill) + r'\b', analysis_text)]
    matched_keywords = [kw for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', analysis_text)]
    missing_skills = [skill for skill in required_skills if skill not in matched_skills]
    
    # Calculate match score (weighted 70% skills, 30% keywords)
    skill_score = len(matched_skills) / len(required_skills) * 70 if required_skills else 0
    keyword_score = len(matched_keywords) / len(keywords) * 30 if keywords else 0
    match_score = min(round(skill_score + keyword_score), 100)
    
    # Get recommendations
    recommendations = generate_recommendations(match_score, missing_skills)
    
    # Get related courses
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

# Generate recommendations
def generate_recommendations(score, missing_skills):
    base_recommendations = [
        "Add Quantifiable Achievements: Include specific metrics and numbers to demonstrate impact.",
        "Include Missing Technical Skills: Add relevant tools and technologies mentioned in the job description.",
        "Optimize for ATS: Use standard section headers and simple formatting.",
        "Add Relevant Keywords: Naturally incorporate industry-specific terms throughout your resume.",
        "Include Relevant Projects: Showcase 2-3 projects with descriptions of tools used and outcomes.",
        "Improve Skills Section: Create a dedicated technical skills section.",
        "Enhance Professional Summary: Write a compelling summary that aligns with job requirements.",
        "Add Certifications: Include relevant certifications that demonstrate qualifications."
    ]
    
    if score >= 85:
        return base_recommendations[:3] + ["Your resume is already strong! Just minor tweaks needed."]
    elif score >= 70:
        return base_recommendations[:5] + [f"Consider learning: {', '.join(missing_skills[:3])}"]
    else:
        return base_recommendations + [
            f"Priority Skills to Learn: {', '.join(missing_skills[:5])}",
            "Consider taking courses or certifications to bridge skill gaps"
        ]

# Get recommended courses
def get_recommended_courses(missing_skills):
    courses = {'free': [], 'paid': []}
    
    # Always include soft skills courses
    soft_skills = skills_courses_df[skills_courses_df['sector'] == 'Non-Tech']
    for _, row in soft_skills.iterrows():
        if pd.notna(row['free_course']):
            courses['free'].append({
                'skill': 'Soft Skills',
                'course': row['free_course'],
                'platform': 'Various'
            })
        if pd.notna(row['paid_course_1']):
            courses['paid'].append({
                'skill': 'Soft Skills',
                'course': row['paid_course_1'],
                'platform': 'Various'
            })
    
    # Add technical courses for missing skills
    for skill in missing_skills:
        skill_courses = skills_courses_df[skills_courses_df['skill'].str.lower() == skill.lower()]
        if not skill_courses.empty:
            row = skill_courses.iloc[0]
            if pd.notna(row['free_course']):
                courses['free'].append({
                    'skill': skill,
                    'course': row['free_course'],
                    'platform': row['sector']
                })
            for i in range(1, 4):
                paid_course = row.get(f'paid_course_{i}')
                if pd.notna(paid_course):
                    courses['paid'].append({
                        'skill': skill,
                        'course': paid_course,
                        'platform': row['sector']
                    })
    
    return courses

# API Endpoints
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
        return jsonify({'error': 'No selected file'}), 400
    
    if not resume_file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are supported'}), 400
    
    # Save the file temporarily
    filename = secure_filename(resume_file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    resume_file.save(filepath)
    
    try:
        # Extract text and analyze
        resume_text = extract_text_from_pdf(filepath)
        result = analyze_resume(resume_text, job_role, jd_text)
        
        if not result:
            return jsonify({'error': 'Job role not found'}), 404
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up the uploaded file
        if os.path.exists(filepath):
            os.remove(filepath)

if __name__ == '__main__':
    app.run(debug=True)