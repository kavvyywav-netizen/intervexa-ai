"use strict";

/* =========================================
INTERVEXA AI — APPLICATION
Stage 1: Interactive Frontend
Storage: Browser Local Storage
========================================= */

const STORAGE_KEY = "intervexa_app_v1";

/* ---------- QUESTION BANK ---------- */

const QUESTION_BANK = {
HR: [
"Tell me about yourself.",
"What are your greatest strengths?",
"What is one weakness you are working to improve?",
"Why should we hire you?",
"Where do you see yourself in five years?",
"Why do you want to join our company?",
"How do you handle pressure?",
"What motivates you to do your best work?"
],

Technical: [
    "Explain the difference between a list and a tuple in Python.",
    "What is object-oriented programming?",
    "What is the difference between SQL and NoSQL databases?",
    "Explain the difference between HTML, CSS, and JavaScript.",
    "What is an API, and why is it useful?",
    "Explain the difference between a stack and a queue.",
    "What is the purpose of version control?",
    "How would you debug a program that is not working?"
],

Behavioural: [
    "Tell me about a time you solved a difficult problem.",
    "Describe a situation where you worked in a team.",
    "Tell me about a time you made a mistake. What did you learn?",
    "How do you handle disagreements with teammates?",
    "Describe a time you had to meet a tight deadline.",
    "Tell me about a challenge you overcame.",
    "How do you respond to constructive criticism?",
    "Describe a time you took initiative."
],

Resume: [
    "Walk me through your resume.",
    "Which project are you most proud of, and why?",
    "What skills did you develop during your internship?",
    "Explain a challenge you faced in one of your projects.",
    "How does your experience prepare you for this role?",
    "What would you improve about your most recent project?",
    "Which technical skill are you currently improving?",
    "What makes you a suitable candidate for this position?"
]

};

/* ---------- APPLICATION STATE ---------- */

function loadAppData() {
try {
const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
        const parsed = JSON.parse(saved);

        if (parsed && typeof parsed === "object") {
            return {
                sessions: Array.isArray(parsed.sessions)
                    ? parsed.sessions : [],
                theme: parsed.theme === "light" ? "light" : "dark"
            };
        }
    }
} catch (error) {
    console.warn("Could not load saved data:", error);
}

return {
    sessions: [],
    theme: "dark"
};

}

const appData = loadAppData();

let currentPage = "dashboard";
let currentInterview = null;
let currentQuestionIndex = 0;
let currentAnswers = [];
let currentQuestions = [];
let resumeText = "";

/* ---------- DOM HELPERS ---------- */

function getElement(id) {
return document.getElementById(id);
}

function saveAppData() {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
} catch (error) {
console.warn("Could not save application data:", error);
showToast("Your browser could not save this update.");
}
}

function escapeHTML(value) {
return String(value).replace(/[&<>"']/g, function (character) {
const replacements = {
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
};

    return replacements[character];
});

}

function showToast(message) {
const toast = getElement("toast");

if (!toast) {
    console.log(message);
    return;
}

toast.textContent = message;
toast.classList.add("show");

clearTimeout(showToast.timer);

showToast.timer = setTimeout(function () {
    toast.classList.remove("show");
}, 2600);

}

function setText(id, value) {
const element = getElement(id);

if (element) {
    element.textContent = value;
}

}

/* ---------- NAVIGATION ---------- */

const PAGE_TITLES = {
dashboard: "Dashboard",
interviews: "Mock Interviews",
resume: "Resume Analyzer",
questions: "Question Bank",
progress: "My Progress",
history: "Interview History",
practice: "Practice Interview"
};

function navigateTo(page) {
if (!PAGE_TITLES[page]) {
page = "dashboard";
}

currentPage = page;

const dashboard = getElement("dashboardPage");
const dynamicPage = getElement("dynamicPage");

if (dashboard) {
    dashboard.hidden = page !== "dashboard";
}

if (dynamicPage) {
    dynamicPage.hidden = page === "dashboard";
}

document.querySelectorAll("[data-page]").forEach(function (button) {
    button.classList.toggle(
        "active",
        button.dataset.page === page
    );
});

setText("breadcrumbTitle", PAGE_TITLES[page]);

closeSidebar();

if (page !== "dashboard") {
    renderPage(page);
}

window.scrollTo({
    top: 0,
    behavior: "smooth"
});

}

function renderPage(page) {
const container = getElement("dynamicContent");

if (!container) return;

container.replaceChildren();

switch (page) {
    case "interviews":
        renderInterviews(container);
        break;

    case "resume":
        renderResumeAnalyzer(container);
        break;

    case "questions":
        renderQuestionBank(container);
        break;

    case "progress":
        renderProgress(container);
        break;

    case "history":
        renderHistory(container);
        break;

    case "practice":
        renderPractice(container);
        break;

    default:
        container.textContent = "Page not found.";
}

}

/* ---------- DASHBOARD ---------- */

function getCompletedSessions() {
return appData.sessions.filter(function (session) {
return session.completed;
});
}

function calculateAverageScore() {
const sessions = getCompletedSessions();

if (sessions.length === 0) return 0;

const total = sessions.reduce(function (sum, session) {
    return sum + Number(session.score || 0);
}, 0);

return Math.round(total / sessions.length);

}

function calculateQuestionCount() {
return getCompletedSessions().reduce(function (total, session) {
return total + Number(session.questionCount || 0);
}, 0);
}

function updateDashboard() {
const sessions = getCompletedSessions();
const average = calculateAverageScore();
const questionCount = calculateQuestionCount();

setText("sessionCount", sessions.length);
setText("averageScore", average);
setText("scoreSuffix", "%");
setText("questionCount", questionCount);
setText("readinessScore", average + "%");

const readinessBar = getElement("readinessBar");

if (readinessBar) {
    readinessBar.style.width = average + "%";
}

const activity = getElement("recentActivity");

if (activity) {
    activity.replaceChildren();

    if (sessions.length === 0) {
        const message = document.createElement("p");
        message.textContent =
            "No interviews yet. Start your first practice session!";
        activity.appendChild(message);
    } else {
        sessions.slice(-4).reverse().forEach(function (session) {
            const row = document.createElement("div");
            row.className = "activity-item";

            const title = document.createElement("strong");
            title.textContent = session.type + " Interview";

            const details = document.createElement("p");
            details.textContent =
                session.role + " · Score: " + session.score + "%";

            row.append(title, details);
            activity.appendChild(row);
        });
    }
}

}

/* ---------- INTERVIEW SELECTION ---------- */

function renderInterviews(container) {
container.innerHTML = `
<section class="page-section">
<h2>Choose Your Interview</h2>
<p>Select a category and practise at your own pace.</p>

        <div class="interview-grid">
            ${Object.keys(QUESTION_BANK).map(function (type) {
                const descriptions = {
                    HR: "Build confidence in HR interviews.",
                    Technical: "Test your technical knowledge.",
                    Behavioural: "Practise real-world situations.",
                    Resume: "Prepare to discuss your experience."
                };

                return `
                    <article class="interview-card">
                        <h3>${type} Interview</h3>
                        <p>${descriptions[type]}</p>
                        <button class="primary-btn"
                            data-start-type="${type}">
                            Start Practice
                        </button>
                    </article>
                `;
            }).join("")}
        </div>

        <div class="form-card">
            <h3>Custom Practice</h3>

            <label for="jobRole">Target job role</label>
            <input id="jobRole" type="text"
                placeholder="e.g. Data Analyst">

            <label for="interviewType">Interview category</label>
            <select id="interviewType">
                <option value="HR">HR</option>
                <option value="Technical">Technical</option>
                <option value="Behavioural">Behavioural</option>
                <option value="Resume">Resume</option>
            </select>

            <label for="questionLimit">Number of questions</label>
            <select id="questionLimit">
                <option value="5">5 questions</option>
                <option value="8">8 questions</option>
                <option value="3">3 questions</option>
            </select>

            <button class="primary-btn" id="customStart">
                Begin Interview
            </button>
        </div>
    </section>
`;

container.querySelectorAll("[data-start-type]").forEach(function (button) {
    button.addEventListener("click", function () {
        startInterview(button.dataset.startType);
    });
});

const customStart = getElement("customStart");

if (customStart) {
    customStart.addEventListener("click", function () {
        const role = getElement("jobRole").value.trim() || "General";

        const type = getElement("interviewType").value;
        const limit = Number(getElement("questionLimit").value);

        startInterview(type, role, limit);
    });
}

}

function startInterview(type, role, limit) {
if (!QUESTION_BANK[type]) {
showToast("Please select a valid interview category.");
return;
}

const questions = QUESTION_BANK[type].slice();

// Shuffle questions to make repeated practice more varied.
for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
}

currentInterview = {
    type: type,
    role: role || "General",
    startedAt: new Date().toISOString()
};

currentQuestions = questions.slice(0, limit || 5);
currentQuestionIndex = 0;
currentAnswers = [];

navigateTo("practice");

}

/* ---------- PRACTICE ROOM ---------- */

function renderPractice(container) {
if (!currentInterview || currentQuestions.length === 0) {
container.innerHTML = "<section class="page-section"> <h2>No Active Interview</h2> <p>Choose an interview category to get started.</p> <button class="primary-btn" id="goInterviews"> Explore Interviews </button> </section>";

    getElement("goInterviews").addEventListener("click", function () {
        navigateTo("interviews");
    });

    return;
}

if (currentQuestionIndex >= currentQuestions.length) {
    finishInterview();
    return;
}

const question = currentQuestions[currentQuestionIndex];

container.innerHTML = `
    <section class="page-section practice-room">
        <div class="practice-top">
            <span class="badge">${escapeHTML(currentInterview.type)}</span>
            <span>Question ${currentQuestionIndex + 1}
                of ${currentQuestions.length}</span>
        </div>

        <h2>${escapeHTML(currentInterview.role)} Interview</h2>

        <div class="question-card">
            <h3>${escapeHTML(question)}</h3>
        </div>

        <label for="answerInput">Your answer</label>
        <textarea id="answerInput" rows="8"
            placeholder="Structure your answer clearly. Include examples when possible..."></textarea>

        <p class="muted">
            Tip: Explain your point clearly and use a real example when relevant.
        </p>

        <div class="button-row">
            <button class="secondary-btn" id="cancelInterview">
                Exit Practice
            </button>
            <button class="primary-btn" id="submitAnswer">
                ${currentQuestionIndex === currentQuestions.length - 1
                    ? "Finish Interview"
                    : "Submit & Continue"}
            </button>
        </div>

        <p class="muted">
            Frontend practice mode: AI-powered evaluation will be added
            when the backend is connected.
        </p>
    </section>
`;

getElement("submitAnswer").addEventListener("click", submitAnswer);

getElement("cancelInterview").addEventListener("click", function () {
    if (confirm("Exit this interview? Your unfinished session will not be saved.")) {
        currentInterview = null;
        navigateTo("interviews");
    }
});

}

function submitAnswer() {
const input = getElement("answerInput");

if (!input) return;

const answer = input.value.trim();

if (answer.length < 10) {
    showToast("Write a little more before continuing.");
    input.focus();
    return;
}

currentAnswers.push({
    question: currentQuestions[currentQuestionIndex],
    answer: answer
});

currentQuestionIndex++;

renderPractice(getElement("dynamicContent"));

}

function estimatePracticeScore() {
if (currentAnswers.length === 0) return 0;

let total = 0;

currentAnswers.forEach(function (item) {
    const words = item.answer.split(/\s+/).filter(Boolean).length;

    // This is only a basic answer-length estimate, not AI evaluation.
    let score = 30;

    if (words >= 20) score += 20;
    if (words >= 40) score += 15;
    if (words >= 60) score += 10;

    if (/\b(example|because|result|learned|achieved|improved|therefore)\b/i
        .test(item.answer)) {
        score += 10;
    }

    if (/\b(I|my|we|our)\b/i.test(item.answer)) {
        score += 5;
    }

    total += Math.min(score, 90);
});

return Math.round(total / currentAnswers.length);

}

function finishInterview() {
const score = estimatePracticeScore();

const session = {
    id: Date.now(),
    type: currentInterview.type,
    role: currentInterview.role,
    date: new Date().toISOString(),
    score: score,
    questionCount: currentAnswers.length,
    answers: currentAnswers,
    completed: true
};

appData.sessions.push(session);
saveAppData();

currentInterview = null;
currentQuestions = [];
currentAnswers = [];
currentQuestionIndex = 0;

updateDashboard();

const container = getElement("dynamicContent");

container.innerHTML = `
    <section class="page-section result-card">
        <h2>Practice Completed!</h2>
        <p>You completed your practice interview. Keep going!</p>

        <div class="score-display">
            <strong>${score}%</strong>
            <span>Practice estimate</span>
        </div>

        <p>
            This score is based on basic answer-length checks only.
            It is not an AI assessment of your answer quality.
        </p>

        <h3>Next steps</h3>
        <ul>
            <li>Keep your answers structured and relevant.</li>
            <li>Use specific examples from your projects or experience.</li>
            <li>Practise speaking clearly and confidently.</li>
        </ul>

        <div class="button-row">
            <button class="primary-btn" id="practiceAgain">
                Practise Again
            </button>

            <button class="secondary-btn" id="viewProgress">
                View Progress
            </button>
        </div>
    </section>
`;

setText("breadcrumbTitle", "Interview Results");

getElement("practiceAgain").addEventListener("click", function () {
    navigateTo("interviews");
});

getElement("viewProgress").addEventListener("click", function () {
    navigateTo("progress");
});

}

/* ---------- QUESTION BANK ---------- */

function renderQuestionBank(container) {
container.innerHTML = `
<section class="page-section">
<h2>Interview Question Bank</h2>
<p>Explore common questions before your next interview.</p>

        <input id="questionSearch" type="search"
            placeholder="Search questions...">

        <select id="questionCategory">
            <option value="All">All Categories</option>
            <option value="HR">HR</option>
            <option value="Technical">Technical</option>
            <option value="Behavioural">Behavioural</option>
            <option value="Resume">Resume</option>
        </select>

        <div id="questionResults"></div>
    </section>
`;

const search = getElement("questionSearch");
const category = getElement("questionCategory");

function updateQuestions() {
    const term = search.value.toLowerCase();
    const selectedCategory = category.value;
    const results = getElement("questionResults");

    results.replaceChildren();

    Object.keys(QUESTION_BANK).forEach(function (type) {
        if (selectedCategory !== "All" && type !== selectedCategory) {
            return;
        }

        const matches = QUESTION_BANK[type].filter(function (question) {
            return question.toLowerCase().includes(term);
        });

        if (matches.length === 0) return;

        const heading = document.createElement("h3");
        heading.textContent = type;
        results.appendChild(heading);

        matches.forEach(function (question, index) {
            const card = document.createElement("article");
            card.className = "question-card";

            const text = document.createElement("p");
            text.textContent = (index + 1) + ". " + question;

            card.appendChild(text);
            results.appendChild(card);
        });
    });

    if (!results.children.length) {
        const empty = document.createElement("p");
        empty.textContent = "No matching questions found.";
        results.appendChild(empty);
    }
}

search.addEventListener("input", updateQuestions);
category.addEventListener("change", updateQuestions);

updateQuestions();

}

/* ---------- RESUME ANALYZER ---------- */

function renderResumeAnalyzer(container) {
container.innerHTML = `
<section class="page-section">
<h2>Resume Analyzer</h2>
<p>
Paste your resume text to run a basic browser-based keyword check.
This is not an AI review or a true ATS compatibility test.
</p>

        <label for="resumeRole">Target job role</label>
        <input id="resumeRole" type="text"
            placeholder="e.g. Data Analyst">

        <label for="resumeInput">Resume text</label>
        <textarea id="resumeInput" rows="12"
            placeholder="Paste the text from your resume here..."></textarea>

        <div class="button-row">
            <button class="secondary-btn" id="clearResume">
                Clear
            </button>

            <button class="primary-btn" id="analyzeResume">
                Check Resume
            </button>
        </div>

        <div id="resumeResults"></div>
    </section>
`;

getElement("clearResume").addEventListener("click", function () {
    getElement("resumeInput").value = "";
    getElement("resumeResults").replaceChildren();
    resumeText = "";
});

getElement("analyzeResume").addEventListener("click", analyzeResume);

}

function analyzeResume() {
const input = getElement("resumeInput");
const roleInput = getElement("resumeRole");
const results = getElement("resumeResults");

resumeText = input.value.trim();

if (resumeText.length < 40) {
    showToast("Please paste more resume text first.");
    input.focus();
    return;
}

const role = roleInput.value.trim().toLowerCase();
const text = resumeText.toLowerCase();

const generalKeywords = [
    "education",
    "skills",
    "project",
    "experience",
    "communication",
    "teamwork",
    "problem solving",
    "certification"
];

const roleKeywords = {
    "data analyst": [
        "python", "sql", "excel", "power bi",
        "tableau", "statistics", "data visualization"
    ],
    "web developer": [
        "html", "css", "javascript", "api",
        "git", "responsive", "frontend"
    ],
    "software developer": [
        "programming", "python", "java", "sql",
        "git", "testing", "data structures"
    ],
    "generative ai developer": [
        "python", "llm", "prompt engineering",
        "api", "machine learning", "rag", "generative ai"
    ]
};

const keywords = generalKeywords.concat(
    roleKeywords[role] || []
);

const found = keywords.filter(function (keyword) {
    return text.includes(keyword);
});

const missing = keywords.filter(function (keyword) {
    return !text.includes(keyword);
});

const percentage = Math.round((found.length / keywords.length) * 100);

results.innerHTML = `
    <div class="result-card">
        <h3>Keyword Check Results</h3>

        <div class="score-display">
            <strong>${percentage}%</strong>
            <span>Keyword coverage</span>
        </div>

        <p>
            Resume length: ${resumeText.length} characters.
        </p>

        <h4>Keywords found</h4>
        <p>${escapeHTML(found.join(", ") || "None found")}</p>

        <h4>Keywords not found</h4>
        <p>${escapeHTML(missing.join(", ") || "None")}</p>

        <p>
            Include a keyword only when it accurately reflects your skills
            or experience. This percentage is not an ATS score.
        </p>
    </div>
`;

showToast("Basic resume keyword check completed.");

}

/* ---------- PROGRESS ---------- */

function renderProgress(container) {
const sessions = getCompletedSessions();
const average = calculateAverageScore();
const questions = calculateQuestionCount();

const best = sessions.length
    ? Math.max.apply(null, sessions.map(function (session) {
        return session.score;
    }))
    : 0;

const types = {};

sessions.forEach(function (session) {
    types[session.type] = (types[session.type] || 0) + 1;
});

container.innerHTML = `
    <section class="page-section">
        <h2>Your Progress</h2>
        <p>Track your practice activity and consistency.</p>

        <div class="stats-grid">
            <article class="stat-card">
                <h3>Completed Sessions</h3>
                <strong>${sessions.length}</strong>
            </article>

            <article class="stat-card">
                <h3>Average Estimate</h3>
                <strong>${average}%</strong>
            </article>

            <article class="stat-card">
                <h3>Questions Answered</h3>
                <strong>${questions}</strong>
            </article>

            <article class="stat-card">
                <h3>Best Estimate</h3>
                <strong>${best}%</strong>
            </article>
        </div>

        <div class="form-card">
            <h3>Practice by Category</h3>

            ${Object.keys(QUESTION_BANK).map(function (type) {
                return `
                    <p>
                        <strong>${type}:</strong>
                        ${types[type] || 0} completed sessions
                    </p>
                `;
            }).join("")}
        </div>

        <p class="muted">
            Scores are local practice estimates, not AI-generated feedback.
        </p>

        <button class="primary-btn" id="progressPractice">
            Start Another Interview
        </button>
    </section>
`;

getElement("progressPractice").addEventListener("click", function () {
    navigateTo("interviews");
});

}

/* ---------- HISTORY ---------- */

function renderHistory(container) {
const sessions = getCompletedSessions().slice().reverse();

container.innerHTML = `
    <section class="page-section">
        <h2>Interview History</h2>
        <p>Your completed practice sessions are saved on this device.</p>

        <div id="historyList"></div>

        <button class="secondary-btn" id="clearHistory">
            Clear History
        </button>
    </section>
`;

const list = getElement("historyList");

if (sessions.length === 0) {
    const message = document.createElement("p");
    message.textContent = "No completed interviews yet.";
    list.appendChild(message);
} else {
    sessions.forEach(function (session) {
        const card = document.createElement("article");
        card.className = "activity-item";

        const title = document.createElement("h3");
        title.textContent = session.type + " Interview";

        const details = document.createElement("p");

        const date = new Date(session.date);

        details.textContent =
            session.role + " · " +
            session.questionCount + " questions · " +
            session.score + "% practice estimate · " +
            (Number.isNaN(date.getTime())
                ? "Unknown date"
                : date.toLocaleDateString());

        card.append(title, details);
        list.appendChild(card);
    });
}

getElement("clearHistory").addEventListener("click", function () {
    if (!confirm("Delete all saved interview history from this browser?")) {
        return;
    }

    appData.sessions = [];
    saveAppData();
    updateDashboard();
    renderHistory(container);
    showToast("Interview history cleared.");
});

}

/* ---------- THEME ---------- */

function applyTheme() {
document.body.classList.toggle(
"light-mode",
appData.theme === "light"
);

const button = getElement("themeButton");

if (button) {
    button.textContent =
        appData.theme === "light" ? "🌙" : "☀️";

    button.setAttribute(
        "aria-label",
        appData.theme === "light"
            ? "Switch to dark mode"
            : "Switch to light mode"
    );
}

}

function toggleTheme() {
appData.theme = appData.theme === "light" ? "dark" : "light";

saveAppData();
applyTheme();

showToast(
    appData.theme === "light"
        ? "Light mode enabled."
        : "Dark mode enabled."
);

}

/* ---------- MOBILE SIDEBAR ---------- */

function openSidebar() {
document.body.classList.add("sidebar-open");
}

function closeSidebar() {
document.body.classList.remove("sidebar-open");
}

function setupSidebar() {
const menuButton = getElement("menuButton");

if (menuButton) {
    menuButton.addEventListener("click", function () {
        document.body.classList.toggle("sidebar-open");
    });
}

document.addEventListener("click", function (event) {
    if (
        document.body.classList.contains("sidebar-open") &&
        !event.target.closest(".sidebar") &&
        !event.target.closest("#menuButton")
    ) {
        closeSidebar();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeSidebar();
    }
});

}

/* ---------- EVENT BINDINGS ---------- */

function setupNavigation() {
document.querySelectorAll("[data-page]").forEach(function (button) {
button.addEventListener("click", function () {
navigateTo(button.dataset.page);
});
});

const startButton = getElement("startInterview");

if (startButton) {
    startButton.addEventListener("click", function () {
        navigateTo("interviews");
    });
}

const quickPractice = getElement("quickPractice");

if (quickPractice) {
    quickPractice.addEventListener("click", function () {
        startInterview("HR", "General", 5);
    });
}

document.querySelectorAll("[data-interview]").forEach(function (card) {
    card.addEventListener("click", function (event) {
        if (event.target.closest("button, a")) {
            return;
        }

        startInterview(card.dataset.interview);
    });
});

document.querySelectorAll("[data-goto]").forEach(function (button) {
    button.addEventListener("click", function () {
        navigateTo(button.dataset.goto);
    });
});

const themeButton = getElement("themeButton");

if (themeButton) {
    themeButton.addEventListener("click", toggleTheme);
}

}

/* ---------- INITIALIZATION ---------- */

function initializeApp() {
applyTheme();
setupNavigation();
setupSidebar();
updateDashboard();

const dashboard = getElement("dashboardPage");
const dynamicPage = getElement("dynamicPage");

if (dashboard) dashboard.hidden = false;
if (dynamicPage) dynamicPage.hidden = true;

navigateTo("dashboard");

console.log("Intervexa AI initialized successfully.");

}

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", initializeApp);
} else {
initializeApp();
}
