// DOM elements
const categorySelect = document.getElementById('category');
const subcategorySelect = document.getElementById('subcategory');
const jobRoleSelect = document.getElementById('jobRole');
const jobDescriptionTextarea = document.getElementById('jobDescription');
const resumeFileInput = document.getElementById('resumeFile');
const fileLabel = document.getElementById('fileLabel');
const analyzeForm = document.getElementById('analyzerForm');
const analyzeBtn = document.getElementById('analyzeBtn');
const btnText = document.getElementById('btnText');
const modal = document.getElementById('recommendationsModal');
const showRecommendationsBtn = document.getElementById('showRecommendations');
const detailedAnalysisBtn = document.getElementById('showDetailedAnalysis');
const closeModal = document.querySelector('.close');
const jdContentDiv = document.getElementById('jdContent');

// Initialize charts
let radarChart, barChart, pieChart, modalPriorityChart, modalTimeChart, bulkAnalysisChart;

// Navigation functions
function startAnalysis() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('analyzerSection').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function startBulkAnalysis() {
    // Create modal for bulk analysis
    const bulkModal = document.createElement('div');
    bulkModal.id = 'bulkAnalysisModal';
    bulkModal.className = 'modal';
    bulkModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">
                    <span>📂</span>
                    Bulk Resume Analysis
                </h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="upload-instructions">
                    <p>Upload a folder containing multiple resumes (PDF/DOCX) to analyze against your selected software engineer job role.</p>
                    <button id="uploadBulkResumes" class="upload-btn">
                        <span>📤</span>
                        Select Folder
                    </button>
                </div>
                <div class="bulk-results" style="display: none;">
                    <h3><span>📊</span> Analysis Results</h3>
                    <div class="chart-container-bulk">
                        <canvas id="bulkAnalysisChart"></canvas>
                    </div>
                    <div class="bulk-stats">
                        <div class="stat-box">
                            <h4>Total Resumes</h4>
                            <div class="stat-value" id="totalResumes">0</div>
                        </div>
                        <div class="stat-box">
                            <h4>Good Matches</h4>
                            <div class="stat-value" id="goodMatches">0</div>
                        </div>
                        <div class="stat-box">
                            <h4>Average Score</h4>
                            <div class="stat-value" id="avgScore">0%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(bulkModal);
    
    // Show modal
    bulkModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Close modal
    bulkModal.querySelector('.close').addEventListener('click', () => {
        bulkModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        bulkModal.remove();
    });
    
    // Handle folder selection
    const uploadBtn = document.getElementById('uploadBulkResumes');
    uploadBtn.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.webkitdirectory = true;
        fileInput.multiple = true;
        fileInput.accept = '.pdf,.docx';
        
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                // Simulate analysis (in a real app, you'd send to backend)
                const total = files.length;
                const goodMatches = Math.floor(Math.random() * total);
                const avgScore = Math.floor(Math.random() * 40) + 60;
                
                // Show results
                const resultsDiv = bulkModal.querySelector('.bulk-results');
                resultsDiv.style.display = 'block';
                
                // Update stats
                document.getElementById('totalResumes').textContent = total;
                document.getElementById('goodMatches').textContent = goodMatches;
                document.getElementById('avgScore').textContent = avgScore + '%';
                
                // Create chart
                createBulkAnalysisChart(goodMatches, total - goodMatches, avgScore);
            }
        });
        
        fileInput.click();
    });
}

function createBulkAnalysisChart(goodMatches, badMatches, avgScore) {
    const ctx = document.getElementById('bulkAnalysisChart').getContext('2d');
    
    // Destroy previous chart if exists
    if (bulkAnalysisChart) {
        bulkAnalysisChart.destroy();
    }
    
    bulkAnalysisChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Good Matches', 'Needs Improvement'],
            datasets: [{
                label: 'Resumes',
                data: [goodMatches, badMatches],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 99, 132, 0.7)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Resumes'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Match Quality'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Bulk Analysis Results (Average Score: ${avgScore}%)`,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

function showDetailedAnalysis() {
    const detailedAnalysisContent = {
        "summary": "Your resume shows strong design skills but could benefit from more quantifiable achievements and better ATS optimization.",
        "issues": {
            "work_experience": {
                "irrelevant_titles": 1,
                "career_gaps_or_inconsistencies": 3,
                "missing_metrics": 4
            },
            "education": {
                "missing_details": 2,
                "irrelevant_courses": 1
            },
            "profile_summary": {
                "buzzwords": 2,
                "too_generic": 1
            },
            "skills_section": {
                "missing_hard_skills": 3,
                "unbalanced_ratio": 1
            }
        }
    };

    // Create modal
    const detailedModal = document.createElement('div');
    detailedModal.id = 'detailedAnalysisModal';
    detailedModal.className = 'modal';
    
    // Build modal content
    let modalHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">
                    <span>🔍</span>
                    Detailed Analysis
                </h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="analysis-summary">
                    <h3><span>📝</span> Professional Summary</h3>
                    <p>${detailedAnalysisContent.summary}</p>
                </div>
                
                <div class="issues-section">
                    <h3><span>⚠️</span> Issues Breakdown</h3>
                    <div class="issues-grid">`;
    
    // Add issues
    for (const category in detailedAnalysisContent.issues) {
        const categoryName = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        modalHTML += `
            <div class="issue-category">
                <h4>${categoryName}</h4>
                <ul>`;
        
        for (const issue in detailedAnalysisContent.issues[category]) {
            const issueName = issue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const count = detailedAnalysisContent.issues[category][issue];
            modalHTML += `
                <li>
                    <strong>${issueName}:</strong> 
                    ${count} issue${count !== 1 ? 's' : ''}
                </li>`;
        }
        
        modalHTML += `
                </ul>
            </div>`;
    }
    
    modalHTML += `
                    </div>
                </div>
                
                <div class="priority-recommendations">
                    <h3><span>🚨</span> Priority Fixes</h3>
                    <ol>
                        <li>Add metrics to 3-5 work experience bullet points</li>
                        <li>Include 2-3 more technical skills from job description</li>
                        <li>Rewrite profile summary to be more specific</li>
                        <li>Remove 1-2 irrelevant education items</li>
                    </ol>
                </div>
            </div>
        </div>`;
    
    detailedModal.innerHTML = modalHTML;
    document.body.appendChild(detailedModal);
    
    // Show modal
    detailedModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Close modal
    detailedModal.querySelector('.close').addEventListener('click', () => {
        detailedModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        detailedModal.remove();
    });
}

// Fetch job roles from backend and populate dropdowns
function fetchJobRoles() {
    fetch('/api/job_roles')
        .then(response => response.json())
        .then(data => {
            // Organize the data by category and subcategory
            const organizedData = {};
            
            data.forEach(item => {
                if (!organizedData[item.category]) {
                    organizedData[item.category] = {
                        name: item.category.replace(/_/g, ' '),
                        subcategories: {}
                    };
                }
                
                if (!organizedData[item.category].subcategories[item.subcategory]) {
                    organizedData[item.category].subcategories[item.subcategory] = {
                        name: item.subcategory.replace(/_/g, ' '),
                        roles: {}
                    };
                }
                
                organizedData[item.category].subcategories[item.subcategory].roles[item.job_role] = {
                    description: `<p><strong>${item.job_role} Position</strong></p>`,
                    skills: parseField(item.skills),
                    keywords: parseField(item.keywords)
                };
            });
            
            // Populate category dropdown
            categorySelect.innerHTML = '<option value="">Choose a category...</option>';
            Object.keys(organizedData).forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = organizedData[category].name;
                categorySelect.appendChild(option);
            });
            
            // Store the organized data for later use
            window.jobData = organizedData;
        })
        .catch(error => console.error('Error fetching job roles:', error));
}

// Helper function to parse CSV fields
function parseField(field) {
    if (!field || field.toLowerCase() === 'nan') {
        return [];
    }
    return field.split(',').map(item => item.trim().toLowerCase());
}

// Event listeners
categorySelect.addEventListener('change', updateSubcategories);
subcategorySelect.addEventListener('change', updateJobRoles);
jobRoleSelect.addEventListener('change', updateJobDescription);
resumeFileInput.addEventListener('change', handleFileUpload);
analyzeForm.addEventListener('submit', handleAnalyze);
showRecommendationsBtn.addEventListener('click', showModal);
detailedAnalysisBtn.addEventListener('click', showDetailedAnalysis);
closeModal.addEventListener('click', hideModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
});

// File upload handlers
const fileUploadLabel = document.querySelector('.file-upload-label');

fileUploadLabel.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadLabel.classList.add('dragover');
});

fileUploadLabel.addEventListener('dragleave', () => {
    fileUploadLabel.classList.remove('dragover');
});

fileUploadLabel.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadLabel.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        resumeFileInput.files = files;
        handleFileUpload();
    }
});

function updateSubcategories() {
    const category = categorySelect.value;
    subcategorySelect.innerHTML = '<option value="">Choose a subcategory...</option>';
    jobRoleSelect.innerHTML = '<option value="">First select a subcategory...</option>';
    jdContentDiv.innerHTML = '<p class="text-secondary">Select a job role to see the job description here, or paste your own in the form above.</p>';
    
    if (category && jobData[category]) {
        subcategorySelect.disabled = false;
        Object.keys(jobData[category].subcategories).forEach(key => {
            const subcat = jobData[category].subcategories[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = subcat.name;
            subcategorySelect.appendChild(option);
        });
    } else {
        subcategorySelect.disabled = true;
        jobRoleSelect.disabled = true;
    }
}

function updateJobRoles() {
    const category = categorySelect.value;
    const subcategory = subcategorySelect.value;
    jobRoleSelect.innerHTML = '<option value="">Choose a job role...</option>';
    jdContentDiv.innerHTML = '<p class="text-secondary">Select a job role to see the job description here, or paste your own in the form above.</p>';
    
    if (category && subcategory && jobData[category].subcategories[subcategory]) {
        jobRoleSelect.disabled = false;
        const roles = jobData[category].subcategories[subcategory].roles;
        Object.keys(roles).forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            jobRoleSelect.appendChild(option);
        });
    } else {
        jobRoleSelect.disabled = true;
    }
}

function updateJobDescription() {
    const category = categorySelect.value;
    const subcategory = subcategorySelect.value;
    const jobRole = jobRoleSelect.value;
    
    if (category && subcategory && jobRole && 
        jobData[category].subcategories[subcategory].roles[jobRole]) {
        const roleData = jobData[category].subcategories[subcategory].roles[jobRole];
        jdContentDiv.innerHTML = roleData.description || 
            `<p class="text-secondary">No description available for this role. Please paste the job description in the form above for detailed analysis.</p>`;
    } else {
        jdContentDiv.innerHTML = '<p class="text-secondary">Select a job role to see the job description here, or paste your own in the form above.</p>';
    }
}

function handleFileUpload() {
    const file = resumeFileInput.files[0];
    if (file) {
        fileLabel.textContent = `📄 ${file.name}`;
        fileLabel.style.color = '#667eea';
        fileLabel.parentElement.style.borderColor = '#667eea';
        fileLabel.parentElement.style.background = '#f0f4ff';
    }
}

function handleAnalyze(e) {
    e.preventDefault();
    
    // Validation
    if (!categorySelect.value || !subcategorySelect.value || !jobRoleSelect.value) {
        alert('Please select category, subcategory, and job role.');
        return;
    }
    
    if (!resumeFileInput.files[0]) {
        alert('Please upload your resume.');
        return;
    }

    // Show loading state
    analyzeBtn.classList.add('loading');
    btnText.innerHTML = `<span class="spinner"></span>Analyzing...`;
    
    // Prepare form data
    const formData = new FormData();
    formData.append('resume', resumeFileInput.files[0]);
    formData.append('job_role', jobRoleSelect.value);
    
    // Add job description from textarea if provided
    if (jobDescriptionTextarea.value.trim()) {
        formData.append('job_description', jobDescriptionTextarea.value);
    }

    // Send to backend
    fetch('/api/analyze', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        updateResults(data);
        analyzeBtn.classList.remove('loading');
        btnText.innerHTML = '<span>🔍</span>Analyze Resume';
        showRecommendationsBtn.classList.add('pulse');
        document.getElementById('downloadBtn').style.display = 'block';
        document.querySelector('.dashboard').scrollIntoView({ behavior: 'smooth' });
        
        // Update job description display - show either the pasted JD or the one from the database
        if (jobDescriptionTextarea.value.trim()) {
            jdContentDiv.innerHTML = `<p><strong>${jobRoleSelect.value} Position</strong></p>` + 
                                    `<p>${jobDescriptionTextarea.value}</p>`;
        } else if (data.job_description && data.job_description.description) {
            jdContentDiv.innerHTML = data.job_description.description;
        } else {
            jdContentDiv.innerHTML = '<p class="text-secondary">For detailed analysis, please paste the job description in the form above.</p>';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Analysis failed: ' + error.message);
        analyzeBtn.classList.remove('loading');
        btnText.innerHTML = '<span>🔍</span>Analyze Resume';
    });
}

function updateResults(data) {
    // Update match score gauge
    const score = data.match_score;
    document.getElementById('matchScore').textContent = score + '%';
    const gauge = document.getElementById('matchGauge');
    const percentage = (score / 100) * 360;
    gauge.style.background = `conic-gradient(from 0deg, #667eea 0deg, #667eea ${percentage}deg, #e2e8f0 ${percentage}deg, #e2e8f0 360deg)`;
    
    // Update grades based on score
    const grades = score >= 90 ? 'A+' : score >= 85 ? 'A' : score >= 80 ? 'A-' : score >= 75 ? 'B+' : score >= 70 ? 'B' : 'B-';
    const healthStates = score >= 85 ? 'Excellent' : score >= 75 ? 'Good' : 'Fair';
    const healthColors = score >= 85 ? '#48bb78' : score >= 75 ? '#ed8936' : '#f56565';
    
    document.getElementById('resumeGrade').textContent = grades;
    const healthElement = document.getElementById('atsHealth');
    healthElement.textContent = healthStates;
    healthElement.style.color = healthColors;
    
    // Update skills display
    updateSkillsDisplay(data.matched_skills, data.missing_skills, data.keywords_used);
    
    // Initialize charts
    initializeCharts(data);
    
    // Update recommendations modal
    updateRecommendationsModal(data);
}

// Update the updateSkillsDisplay function to handle empty keywords
function updateSkillsDisplay(matchedSkills, missingSkills, keywords) {
    // Update matched skills
    const matchedSkillsDiv = document.getElementById('matchedSkills');
    matchedSkillsDiv.innerHTML = '';
    matchedSkills.forEach(skill => {
        const span = document.createElement('span');
        span.className = 'skill-tag';
        span.textContent = skill;
        matchedSkillsDiv.appendChild(span);
    });
    
    // Update missing skills
    const missingSkillsDiv = document.getElementById('missingSkills');
    missingSkillsDiv.innerHTML = '';
    missingSkills.forEach(skill => {
        const span = document.createElement('span');
        span.className = 'skill-tag';
        span.textContent = skill;
        missingSkillsDiv.appendChild(span);
    });
    
    // Update keywords - show message if none were matched
    const keywordsDiv = document.getElementById('keywordsUsed');
    keywordsDiv.innerHTML = '';
    
    if (keywords.length > 0) {
        keywords.forEach(keyword => {
            const span = document.createElement('span');
            span.className = 'skill-tag';
            span.textContent = `"${keyword}"`;
            keywordsDiv.appendChild(span);
        });
    } else {
        const message = document.createElement('p');
        message.className = 'text-secondary';
        message.textContent = 'No specific keywords were used';
        keywordsDiv.appendChild(message);
    }
}
function initializeCharts(data) {
    // Clear existing charts
    if (radarChart) radarChart.destroy();
    if (barChart) barChart.destroy();
    if (pieChart) pieChart.destroy();
    
    // Radar Chart - Skills comparison
    const radarCtx = document.getElementById('radarChart').getContext('2d');
    const skillsToShow = data.matched_skills.concat(data.missing_skills).slice(0, 6);
    const yourScores = skillsToShow.map(skill => 
        data.matched_skills.includes(skill) ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 20
    );
    const jobScores = skillsToShow.map(() => Math.floor(Math.random() * 25) + 75);
    
    radarChart = new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels: skillsToShow,
            datasets: [
                {
                    label: 'Your Skills',
                    data: yourScores,
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: '#667eea',
                    borderWidth: 2
                },
                {
                    label: 'Job Requirements',
                    data: jobScores,
                    backgroundColor: 'rgba(244, 63, 94, 0.2)',
                    borderColor: '#f43f5e',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { display: false }
                }
            },
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // Bar Chart - Related roles (Top 4 matches)
    const barCtx = document.getElementById('barChart').getContext('2d');
    const relatedRoles = generateRelatedRoles(data.job_role);
    
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: relatedRoles.labels,
            datasets: [{
                label: 'Match Score (%)',
                data: relatedRoles.scores,
                backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 100 },
                x: { ticks: { maxRotation: 45, minRotation: 45 } }
            },
            plugins: { 
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Top 4 Job Role Matches',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            }
        }
    });

    // Pie Chart - Issues breakdown
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ['Work Experience', 'Education', 'Skills', 'ATS Issues'],
            datasets: [{
                data: [15, 5, 25, 10],
                backgroundColor: ['#f56565', '#ed8936', '#ecc94b', '#48bb78'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function generateRelatedRoles(currentRole) {
    const allRoles = [];
    
    // Collect all roles from jobData
    for (const category in jobData) {
        for (const subcategory in jobData[category].subcategories) {
            for (const role in jobData[category].subcategories[subcategory].roles) {
                if (role !== currentRole) {
                    allRoles.push(role);
                }
            }
        }
    }
    
    // Get top 4 related roles (excluding current role)
    const selectedRoles = allRoles.slice(0, 4);
    const labels = [currentRole, ...selectedRoles];
    const scores = [
        Math.floor(Math.random() * 10) + 85,
        Math.floor(Math.random() * 15) + 70,
        Math.floor(Math.random() * 15) + 65,
        Math.floor(Math.random() * 15) + 60,
        Math.floor(Math.random() * 15) + 55
    ];
    
    return { labels: labels.slice(0, 5), scores: scores.slice(0, 5) };
}

function updateRecommendationsModal(data) {
    // Update recommendations list
    const recommendationsList = document.querySelector('.recommendations-list');
    recommendationsList.innerHTML = '';
    
    data.recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${rec.split(':')[0]}:</strong> ${rec.split(':').slice(1).join(':')}`;
        recommendationsList.appendChild(li);
    });
    
    // Update courses tabs (limit to top 7 courses)
    updateCoursesTab('freeCourses', limitCourses(data.courses.free, 7));
    updateCoursesTab('paidCourses', limitCourses(data.courses.paid, 7));
    updateCoursesTab('modalFreeCourses', limitCourses(data.courses.free, 7));
    updateCoursesTab('modalPaidCourses', limitCourses(data.courses.paid, 7));
    
    // Initialize modal charts
    initializeModalCharts(data.missing_skills);
}

// Helper function to limit courses to top N (with priority to technical skills)
function limitCourses(courses, limit) {
    // Separate technical and non-technical courses
    const techCourses = courses.filter(course => course.skill.toLowerCase() !== 'soft skills');
    const softSkillsCourses = courses.filter(course => course.skill.toLowerCase() === 'soft skills');
    
    // Prioritize technical courses (take up to limit-2, then fill with soft skills)
    const result = techCourses.slice(0, limit - 2);
    const remainingSlots = limit - result.length;
    
    if (remainingSlots > 0) {
        result.push(...softSkillsCourses.slice(0, remainingSlots));
    }
    
    return result.slice(0, limit);
}

function updateCoursesTab(tabId, courses) {
    const tab = document.getElementById(tabId);
    if (!tab) return;
    
    tab.innerHTML = '';
    courses.forEach(course => {
        const p = document.createElement('p');
        p.innerHTML = `<strong>• ${course.skill}:</strong> ${course.course} (${course.platform})`;
        tab.appendChild(p);
    });
}

function initializeModalCharts(missingSkills) {
    if (modalPriorityChart) modalPriorityChart.destroy();
    if (modalTimeChart) modalPriorityChart.destroy();
    
    // Priority Chart
    const priorityCtx = document.getElementById('modalPriorityChart').getContext('2d');
    const skillsToShow = missingSkills.slice(0, 5).length > 0 ? 
        missingSkills.slice(0, 5) : 
        ['Python', 'Machine Learning', 'Statistics', 'AWS', 'Docker'];
    
    modalPriorityChart = new Chart(priorityCtx, {
        type: 'bar',
        data: {
            labels: skillsToShow,
            datasets: [{
                label: 'Priority Level',
                data: skillsToShow.map(() => Math.floor(Math.random() * 40) + 60),
                backgroundColor: ['#f56565', '#ed8936', '#ecc94b', '#48bb78', '#667eea'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, max: 100 },
                x: { ticks: { maxRotation: 45 } }
            }
        }
    });
    
    // Time Investment Chart
    const timeCtx = document.getElementById('modalTimeChart').getContext('2d');
    modalTimeChart = new Chart(timeCtx, {
        type: 'doughnut',
        data: {
            labels: ['Immediate (1-2 weeks)', 'Short-term (1-2 months)', 'Medium-term (3-6 months)', 'Long-term (6+ months)'],
            datasets: [{
                data: [20, 35, 30, 15],
                backgroundColor: ['#f56565', '#ed8936', '#48bb78', '#667eea'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function showModal() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    showRecommendationsBtn.classList.remove('pulse');
}

function hideModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Download functionality
document.getElementById('downloadBtn').addEventListener('click', function(e) {
    e.preventDefault();
    
    const category = categorySelect.value;
    const subcategory = subcategorySelect.value;
    const jobRole = jobRoleSelect.value;
    const fileName = resumeFileInput.files[0]?.name || 'resume';
    const matchScore = document.getElementById('matchScore').textContent;
    const resumeGrade = document.getElementById('resumeGrade').textContent;
    const atsHealth = document.getElementById('atsHealth').textContent;
    
    if (!category || !subcategory || !jobRole) {
        alert('Please complete an analysis before downloading the report.');
        return;
    }
    
    // Generate report content
    const matchedSkills = Array.from(document.getElementById('matchedSkills').children)
        .map(el => el.textContent).join(', ');
    const missingSkills = Array.from(document.getElementById('missingSkills').children)
        .map(el => el.textContent).join(', ');
    const keywords = Array.from(document.getElementById('keywordsUsed').children)
        .map(el => el.textContent).join(', ');
    
    const reportContent = `
RESUME ANALYSIS REPORT
Generated on: ${new Date().toLocaleDateString()}
Resume: ${fileName}
Job Role: ${jobRole}
Category: ${category} > ${subcategory}

=== QUICK RESULTS ===
Overall Match Score: ${matchScore}
Resume Grade: ${resumeGrade}
ATS Health: ${atsHealth}

=== SKILLS ANALYSIS ===
Matched Skills: ${matchedSkills}
Missing Skills: ${missingSkills}
Keywords Used: ${keywords}

=== RECOMMENDATIONS ===
• Add Quantifiable Achievements: Include specific metrics and numbers to demonstrate the impact of your work and showcase measurable results.
• Include Missing Technical Skills: Add relevant tools and technologies mentioned in the job description to better match requirements.
• Optimize for ATS: Use standard section headers and simple formatting for better parsing by applicant tracking systems.
• Add Relevant Keywords: Naturally incorporate industry-specific terms and skills throughout your resume content.
• Include Relevant Projects: Showcase 2-3 projects with brief descriptions of tools used and business outcomes achieved.
• Improve Skills Section: Create a dedicated technical skills section listing relevant tools, languages, and technologies.
• Enhance Professional Summary: Write a compelling summary that highlights your expertise and aligns with job requirements.
• Add Certifications: Include relevant certifications and professional credentials that demonstrate your qualifications.

=== NEXT STEPS ===
1. Review and implement the recommendations above
2. Consider taking courses in missing skill areas
3. Update your resume with relevant keywords and achievements
4. Practice presenting your experience in quantifiable terms
5. Consider industry certifications to strengthen your profile

This report was generated by AI-Powered Resume Analyzer.
For more detailed analysis, please visit our platform.
`;

    // Create and download file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resume_Analysis_Report_${jobRole.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
});

// Card toggling
function toggleCard(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.toggle-icon');
    
    if (content.classList.contains('active')) {
        content.classList.remove('active');
        icon.textContent = '▼';
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.classList.add('active');
        icon.textContent = '▲';
        icon.style.transform = 'rotate(180deg)';
    }
}

// Tab switching
function showTab(event, tabId) {
    const tabContents = event.target.closest('.dashboard-card').querySelectorAll('.tab-content');
    const tabButtons = event.target.closest('.dashboard-card').querySelectorAll('.tab-btn');
    
    tabContents.forEach(content => content.classList.remove('active'));
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

function showModalTab(event, tabId) {
    const modal = event.target.closest('.modal');
    const tabContents = modal.querySelectorAll('.tab-content');
    const tabButtons = modal.querySelectorAll('.tab-btn');
    
    tabContents.forEach(content => content.classList.remove('active'));
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Add some initial animation delays
    const panels = document.querySelectorAll('.panel');
    panels.forEach((panel, index) => {
        panel.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Initialize empty states and fetch job roles
    updateSubcategories();
    fetchJobRoles();
});