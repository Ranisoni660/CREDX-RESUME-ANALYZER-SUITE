# CREDX-RESUME-ANALYZER-SUITE
AI-Powered Resume Analyzer
Team: Buzzers

    Rushikesh Gore

    Ranisoni (You)

Overview

The AI-Powered Resume Analyzer is a Flask-based web application that evaluates resumes and provides detailed feedback to help candidates improve their chances of passing Applicant Tracking Systems (ATS) and landing interviews. The analyzer checks for common issues in resumes, provides a match score, and offers personalized recommendations for improvement.
Features

    Resume Analysis: Evaluates resumes based on key sections (Profile Summary, Work Experience, Education, Skills).

    ATS Compatibility Check: Ensures resumes are optimized for Applicant Tracking Systems.

    Detailed Reports: Provides a structured report with scores, grades, issue breakdowns, and recommendations.

    Interactive UI: Visual score gauges, categorized issue counts, and improvement suggestions.

    Bulk Analysis: Option to analyze multiple resumes at once for recruiters or hiring managers.

Technologies Used

    Backend: Flask (Python)

    Frontend: HTML, CSS, JavaScript (with Chart.js for visualizations)

    Libraries: pdfplumber (for PDF text extraction), pandas (for data handling)

    Data: Predefined job roles and skills datasets (job_roles_final.csv, skills_courses.csv)

How It Works

    User Uploads Resume: The user uploads a PDF resume and selects a target job role.

    Text Extraction: The system extracts text from the resume.

    Analysis: The resume is analyzed against the selected job role's requirements.

    Report Generation: The system generates a detailed report with:

        Overall match score

        Resume grade

        Categorized issues

        Personalized recommendations

        Suggested courses for skill gaps

Key Checks Performed
Category	Common Issues Flagged
Work Experience	Irrelevant job titles, inconsistent role progression, no metrics, outdated tools
Education	Missing degree, institution, graduation year
Profile Summary	Lack of clarity, no value proposition, use of buzzwords
Skills Section	No skills, outdated tech, missing role-specific terms
ATS Issues	Wrong file format, graphics-heavy resumes, lack of section headers
Scoring Guide
Section	Weight
Profile Summary	15%
Experience Quality	35%
Skills Relevance	20%
Education Completeness	15%
ATS Compatibility	15%
Setup Instructions

    Clone the Repository:
    bash

git clone <repository-url>
cd <repository-folder>

Install Dependencies:
bash

pip install -r requirements.txt

Run the Application:
bash

    python app.py

    Access the Application:
    Open a web browser and navigate to http://localhost:5000.

File Structure

    app.py: Flask application and API endpoints.

    static/script.js: Frontend logic for resume analysis and UI interactions.

    static/styles.css: CSS styles for the application.

    templates/index.html: HTML template for the main page.

    job_roles_final.csv: Dataset of job roles, categories, and required skills.

    skills_courses.csv: Dataset of skills and recommended courses.

    requirements.txt: Python dependencies.

Sample Output

The application returns a structured JSON report (or renders an HTML report) with:
json

{
  "overall_score": 76,
  "resume_grade": "C",
  "summary": "As a UI/UX designer with over 6 years of experience...",
  "issues": {
    "work_experience": {
      "irrelevant_titles": 1,
      "career_gaps_or_inconsistencies": 3
    },
    "education": {
      "missing_details": 2
    },
    "profile_summary": {
      "buzzwords": 2
    }
  },
  "recommendations": [
    "Refine your profile summary to highlight specific accomplishments.",
    "Add missing education details including degree name and graduation year.",
    "Avoid using generic buzzwords like 'team player' and 'dynamic professional'.",
    "Ensure your work titles align with your targeted job role.",
    "Clarify job transitions to address any career progression concerns."
  ]
}

Evaluation Criteria
Criteria	Weight
Accuracy of issue detection	35%
Relevance of suggestions	25%
Resume parsing robustness	15%
UI and output clarity	15%
Bonus (grammar checking, etc.)	10%
Stretch Goals (Optional)

    Integrate grammar or readability scoring.

    Highlight improvements inline in resume text.

    Compare resume to target job role.

    Add downloadable report (PDF).

Submission Checklist

    Flask app (app.py)

    Resume parsing and analysis logic

    Sample resume and output report

    README.md (this file) with setup steps and scoring criteria

    Optional: UI templates or PDF export

Team Buzzers
Rushikesh Gore & Ranisoni
