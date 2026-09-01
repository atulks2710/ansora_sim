import { db } from './firebase-config.js';
import { doc, updateDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { requireAuth } from './auth-guard.js';

let currentUser = null;
let currentProfile = null;
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let score = 0;

// Standard Built-in Skill Assessment Question Bank (Mapped to Industry Competency Framework)
const QUESTION_BANK = {
    fullstack: [
        {
            id: "fs_1",
            category: "React",
            skill: "React",
            text: "In React 18, what is the primary purpose of the `useTransition` hook?",
            options: [
                { id: "A", text: "To perform animations and CSS layout transitions" },
                { id: "B", text: "To mark state updates as non-urgent transitions that can be interrupted" },
                { id: "C", text: "To navigate between routes asynchronously" },
                { id: "D", text: "To cache expensive calculations between renders" }
            ],
            correct: "B"
        },
        {
            id: "fs_2",
            category: "Node.js",
            skill: "Node.js",
            text: "How does the Node.js Event Loop handle asynchronous I/O operations without blocking the main execution thread?",
            options: [
                { id: "A", text: "By spawning a new OS thread for every incoming HTTP connection" },
                { id: "B", text: "By offloading I/O tasks to libuv worker pool or kernel async APIs and processing callbacks in phases" },
                { id: "C", text: "By pausing JavaScript code until the file or socket responds" },
                { id: "D", text: "By compiling JavaScript into synchronous C++ binaries at runtime" }
            ],
            correct: "B"
        },
        {
            id: "fs_3",
            category: "JavaScript",
            skill: "JavaScript",
            text: "What will `console.log(typeof NaN)` and `console.log(NaN === NaN)` output in modern JavaScript?",
            options: [
                { id: "A", text: "'undefined' and true" },
                { id: "B", text: "'number' and false" },
                { id: "C", text: "'NaN' and true" },
                { id: "D", text: "'object' and false" }
            ],
            correct: "B"
        },
        {
            id: "fs_4",
            category: "Cloud",
            skill: "Cloud",
            text: "Which architectural pattern is best suited for decoupling microservices communicating via asynchronous event streams?",
            options: [
                { id: "A", text: "Synchronous REST over HTTP/1.1" },
                { id: "B", text: "Publish/Subscribe message broker (e.g., Kafka / Google Cloud Pub/Sub)" },
                { id: "C", text: "Direct database table sharing across services" },
                { id: "D", text: "Monolithic shared memory buffers" }
            ],
            correct: "B"
        },
        {
            id: "fs_5",
            category: "Problem Solving",
            skill: "Problem Solving",
            text: "What is the optimal time complexity to find the median of two sorted arrays of size m and n using binary search partitioning?",
            options: [
                { id: "A", text: "O(m + n)" },
                { id: "B", text: "O(log(min(m, n)))" },
                { id: "C", text: "O(m * n)" },
                { id: "D", text: "O(1)" }
            ],
            correct: "B"
        }
    ],
    aiml: [
        {
            id: "ai_1",
            category: "Python",
            skill: "Python",
            text: "Which Python data structure provides O(1) average time complexity for both insertion and lookup?",
            options: [
                { id: "A", text: "list" },
                { id: "B", text: "dict (hash map)" },
                { id: "C", text: "tuple" },
                { id: "D", text: "linked list" }
            ],
            correct: "B"
        },
        {
            id: "ai_2",
            category: "Machine Learning",
            skill: "Machine Learning",
            text: "What technique is specifically designed to prevent overfitting in deep neural networks by randomly zeroing activations during training?",
            options: [
                { id: "A", text: "Batch Normalization" },
                { id: "B", text: "Dropout" },
                { id: "C", text: "Gradient Clipping" },
                { id: "D", text: "Learning Rate Decay" }
            ],
            correct: "B"
        },
        {
            id: "ai_3",
            category: "PyTorch",
            skill: "PyTorch",
            text: "In PyTorch, why must `optimizer.zero_grad()` typically be called before `loss.backward()` in a training loop?",
            options: [
                { id: "A", text: "To reset model weights to zero" },
                { id: "B", text: "Because PyTorch accumulates gradients by default across backward passes" },
                { id: "C", text: "To allocate GPU VRAM" },
                { id: "D", text: "To update the learning rate scheduler" }
            ],
            correct: "B"
        },
        {
            id: "ai_4",
            category: "Data Engineering",
            skill: "SQL",
            text: "Which SQL window function ranks rows with gaps in rank values when ties occur?",
            options: [
                { id: "A", text: "DENSE_RANK()" },
                { id: "B", text: "RANK()" },
                { id: "C", text: "ROW_NUMBER()" },
                { id: "D", text: "NTILE()" }
            ],
            correct: "B"
        },
        {
            id: "ai_5",
            category: "Problem Solving",
            skill: "Problem Solving",
            text: "What is the primary trade-off when using dimensionality reduction like PCA before training a classifier?",
            options: [
                { id: "A", text: "Faster training and noise reduction vs potential loss of non-linear variance and interpretability" },
                { id: "B", text: "Guaranteed 100% accuracy improvement" },
                { id: "C", text: "Higher memory consumption" },
                { id: "D", text: "Requires all categorical variables" }
            ],
            correct: "A"
        }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    requireAuth(async (user, profileData) => {
        currentUser = user;
        currentProfile = profileData;
        loadQuestions();
    });

    const btnNext = document.getElementById('btn-next');
    if (btnNext) {
        btnNext.addEventListener('click', handleNextQuestion);
    }
});

function loadQuestions() {
    const roleKey = (currentProfile?.targetRole === "aiml" || currentProfile?.targetRole === "ai_ml") ? "aiml" : "fullstack";
    questions = QUESTION_BANK[roleKey] || QUESTION_BANK.fullstack;
    currentQuestionIndex = 0;
    userAnswers = {};
    score = 0;

    renderQuestion();
}

function renderQuestion() {
    if (currentQuestionIndex >= questions.length) {
        finishAssessment();
        return;
    }

    const q = questions[currentQuestionIndex];
    const counterEl = document.getElementById('question-counter');
    const textEl = document.getElementById('question-text');
    const optionsList = document.getElementById('options-list');

    if (counterEl) counterEl.textContent = `Question ${currentQuestionIndex + 1} / ${questions.length} • Domain: ${q.category}`;
    if (textEl) textEl.textContent = q.text;

    if (optionsList) {
        optionsList.innerHTML = '';
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.type = 'button';
            btn.onclick = () => selectOption(btn, opt.id);

            btn.innerHTML = `
                <div class="option-letter">${opt.id}</div>
                <div class="option-text">${opt.text}</div>
            `;
            optionsList.appendChild(btn);
        });
    }
}

function selectOption(btn, selectedOptionId) {
    document.querySelectorAll('.option-btn').forEach(el => el.classList.remove('selected'));
    btn.classList.add('selected');
    userAnswers[questions[currentQuestionIndex].id] = selectedOptionId;
}

function handleNextQuestion() {
    const currentQ = questions[currentQuestionIndex];
    if (!userAnswers[currentQ.id]) {
        alert("Please select an answer to proceed.");
        return;
    }

    if (userAnswers[currentQ.id] === currentQ.correct) {
        score++;
    }

    currentQuestionIndex++;
    renderQuestion();
}

async function finishAssessment() {
    const percentage = Math.round((score / questions.length) * 100);
    const container = document.querySelector('.assessment-container');

    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color);">
                <i class="fa-solid fa-spinner fa-spin text-accent" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Analyzing & Verifying Skill DNA...</h2>
                <p style="color: var(--text-secondary);">Updating Industry Matching Engine in Firestore...</p>
            </div>
        `;
    }

    try {
        const newSkills = { ...(currentProfile.skills || {}) };

        questions.forEach(q => {
            const isCorrect = userAnswers[q.id] === q.correct;
            const currentScore = newSkills[q.skill] || 60;
            if (isCorrect) {
                newSkills[q.skill] = Math.min(currentScore + 12, 98);
            } else {
                newSkills[q.skill] = Math.max(currentScore - 4, 50);
            }
        });

        const skillValues = Object.values(newSkills);
        const newReadiness = skillValues.length > 0 ? Math.round(skillValues.reduce((a, b) => a + b, 0) / skillValues.length) : percentage;

        let bestDomain = "Full Stack Development";
        let highestScore = -1;
        for (const [domain, s] of Object.entries(newSkills)) {
            if (s > highestScore) {
                highestScore = s;
                bestDomain = domain;
            }
        }

        const breakdown = [
            { label: "Technical Skills", value: Math.min(newReadiness + 3, 98) },
            { label: "Role Alignment", value: Math.min(newReadiness + 5, 96) },
            { label: "Industry Evidence", value: Math.min(newReadiness - 2, 95) },
            { label: "Problem Solving", value: newSkills["Problem Solving"] || 80 }
        ];

        const updatedData = {
            skills: newSkills,
            readiness: newReadiness,
            breakdown: breakdown,
            lastAssessedAt: serverTimestamp(),
            assessmentScore: percentage
        };

        const userDocRef = doc(db, "users", currentUser.uid);
        const studentDocRef = doc(db, "students", currentUser.uid);

        await setDoc(userDocRef, updatedData, { merge: true });
        await setDoc(studentDocRef, updatedData, { merge: true });

        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color);">
                    <i class="fa-solid fa-circle-check text-success" style="font-size: 3.5rem; color: var(--success); margin-bottom: 1rem;"></i>
                    <h1 style="font-size: 1.8rem; margin-bottom: 0.5rem;">Skill Assessment Complete!</h1>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">Your Skill DNA and Industry Match Index have been updated live.</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr; gap: 1rem; max-width: 380px; margin: 0 auto 2rem;">
                        <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px; display:flex; justify-content:space-between; align-items:center;">
                            <span>Assessment Score:</span>
                            <strong class="text-accent" style="font-size:1.2rem;">${percentage}%</strong>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px; display:flex; justify-content:space-between; align-items:center;">
                            <span>New Industry Readiness:</span>
                            <strong class="text-accent" style="font-size:1.2rem;">${newReadiness}%</strong>
                        </div>
                        <div style="background: rgba(201,162,39,0.1); border: 1px solid var(--accent-blue); padding: 1rem; border-radius: 10px; display:flex; justify-content:space-between; align-items:center;">
                            <span>Top Evaluated Domain:</span>
                            <strong class="text-accent">${bestDomain}</strong>
                        </div>
                    </div>
                    
                    <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
                        <button class="btn-primary-small" style="padding: 0.8rem 1.6rem; font-size: 1rem;" onclick="window.location.href='opportunities.html'">Explore Matched Opportunities →</button>
                        <button class="btn-action" style="padding: 0.8rem 1.6rem; font-size: 1rem;" onclick="window.location.href='student-home.html'">Back to Dashboard</button>
                    </div>
                </div>
            `;
        }
    } catch (e) {
        console.error("Error saving assessment results:", e);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color);">
                    <i class="fa-solid fa-triangle-exclamation text-danger" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                    <h2>Error Saving Results</h2>
                    <p style="color: var(--text-secondary);">${e.message}</p>
                    <button class="btn-primary-small" style="padding: 0.8rem 1.6rem; margin-top: 1rem;" onclick="window.location.reload()">Try Again</button>
                </div>
            `;
        }
    }
}
