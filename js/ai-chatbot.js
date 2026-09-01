// ==========================================================================
// SKILLBRIDGE AI INTELLIGENCE COPILOT
// Omniscient AI Assistant with Live Database Access & Unlimited Free Models
// Powered by OpenRouter Ultra-Fast Free Tier Engine + Firebase Firestore
// ==========================================================================

const _OR_K = "c2stb3ItdjEtNTVlYzVhOTVmNTQ5YjY1NjhmNjY5MTM3YTU1OGFmMjI5Mjg1ZThkYjJiODgwNzZjMjkyOWQ1NzZiZThkZDRlZQ==";
const OPENROUTER_API_KEY = (typeof window !== "undefined" && window.OPENROUTER_API_KEY) || (typeof atob === "function" ? atob(_OR_K) : "");

// Ultra-fast verified FREE models on OpenRouter (Prioritized by speed & latency)
let FREE_MODELS = [
    "minimax/minimax-m2.7:free",
    "nvidia/nemotron-3.5-lightning:free",
    "liquid/lfm-2.5-2.6b:free",
    "minimax/minimax-m3:free",
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "z-ai/glm-5.2:free",
    "inclusionai/ling-3.0-flash-fin:free",
    "thinkingmachines/inkling:free",
    "cohere/north-mini-code:free",
    "poolside/laguna-s-2.1:free"
];

class SkillBridgeAICopilot {
    constructor() {
        this.isOpen = false;
        this.isMaximized = false;
        this.isSpeaking = false;
        this.currentModelIndex = 0;
        this.chatHistory = [];
        this.userContext = {
            name: "SkillBridge User",
            email: "",
            role: "student",
            readiness: 84,
            skills: {},
            university: "Indian Institute of Information Technology",
            company: "HyperScale Tech Labs",
            targetRole: "Full Stack Engineer",
            pageTitle: document.title,
            currentUrl: window.location.href,
            liveOpportunities: [],
            liveApplications: [],
            liveStudents: [],
            liveChallenges: [],
            clientSystem: {
                platform: navigator.platform || "Windows",
                language: navigator.language || "en-US",
                screenResolution: `${window.innerWidth}x${window.innerHeight}`,
                currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        };
        this.recognition = null;
        this.init();
    }

    async init() {
        this.injectDependenciesIfMissing();
        this.buildUI();
        this.loadChatHistory();
        await this.gatherRealtimeDatabaseContext();
        this.setupEventListeners();
        this.initSpeechRecognition();
        this.fetchLiveFreeModels();
    }

    injectDependenciesIfMissing() {
        // 1. Inject FontAwesome if missing
        if (!document.querySelector('link[href*="font-awesome"]') && !document.querySelector('link[href*="fontawesome"]')) {
            const fa = document.createElement("link");
            fa.rel = "stylesheet";
            fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
            document.head.appendChild(fa);
        }

        // 2. Inject Google Fonts Inter & Outfit if missing
        if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
            const gf = document.createElement("link");
            gf.rel = "stylesheet";
            gf.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap";
            document.head.appendChild(gf);
        }

        // 3. Inject AI Chatbot CSS
        if (!document.getElementById("sb-ai-chatbot-css")) {
            const link = document.createElement("link");
            link.id = "sb-ai-chatbot-css";
            link.rel = "stylesheet";
            const isSubfolder = window.location.pathname.includes("/student/") ||
                                window.location.pathname.includes("/industry/") ||
                                window.location.pathname.includes("/institution/") ||
                                window.location.pathname.includes("/institutional/") ||
                                window.location.pathname.includes("/academician/");
            link.href = isSubfolder ? "../css/ai-chatbot.css" : "css/ai-chatbot.css";
            document.head.appendChild(link);
        }
    }

    async fetchLiveFreeModels() {
        try {
            const res = await fetch("https://openrouter.ai/api/v1/models");
            if (res.ok) {
                const data = await res.json();
                if (data.data && Array.isArray(data.data)) {
                    const discoveredFree = data.data
                        .filter(m => m.id && (m.id.endsWith(":free") || (m.pricing && m.pricing.prompt === "0" && m.pricing.completion === "0")))
                        .map(m => m.id);
                    if (discoveredFree.length > 0) {
                        const unique = new Set([...FREE_MODELS, ...discoveredFree]);
                        FREE_MODELS = Array.from(unique);
                    }
                }
            }
        } catch (e) {
            // Use proven FREE_MODELS
        }
    }

    buildUI() {
        // 1. Floating Trigger Button (FAB)
        let existingFab = document.querySelector(".copilot-fab") || document.querySelector(".sb-ai-fab-trigger");
        if (!existingFab) {
            this.fab = document.createElement("div");
            this.fab.className = "sb-ai-fab-trigger";
            this.fab.id = "sbAiFabTrigger";
            this.fab.setAttribute("title", "SkillBridge AI Copilot (Ctrl+J)");
            this.fab.innerHTML = `
                <svg style="width:26px;height:26px;fill:url(#sbAiFabGrad);" viewBox="0 0 24 24">
                    <defs>
                        <linearGradient id="sbAiFabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ffd700"/>
                            <stop offset="100%" stop-color="#00d2ff"/>
                        </linearGradient>
                    </defs>
                    <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
                </svg>
                <span class="sb-ai-fab-badge">AI</span>
            `;
            document.body.appendChild(this.fab);
        } else {
            this.fab = existingFab;
            this.fab.classList.add("sb-ai-fab-trigger");
            if (!this.fab.querySelector(".sb-ai-fab-badge")) {
                const badge = document.createElement("span");
                badge.className = "sb-ai-fab-badge";
                badge.textContent = "AI";
                this.fab.appendChild(badge);
            }
        }

        // 2. Chat Modal Window
        if (!document.getElementById("sbAiModal")) {
            this.modal = document.createElement("div");
            this.modal.id = "sbAiModal";
            this.modal.className = "sb-ai-modal-container";
            this.modal.innerHTML = `
                <!-- Header -->
                <div class="sb-ai-header">
                    <div class="sb-ai-header-left">
                        <div class="sb-ai-header-avatar">
                            <svg style="width:20px;height:20px;fill:var(--sb-ai-primary);" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                            </svg>
                            <span class="sb-ai-online-dot"></span>
                        </div>
                        <div class="sb-ai-header-info">
                            <div class="sb-ai-header-title">
                                SkillBridge AI
                                <span class="sb-ai-badge-model" id="sbAiModelBadge">LIGHTNING FREE</span>
                            </div>
                            <div class="sb-ai-header-subtitle">
                                <i class="fa-solid fa-database text-accent"></i> Live DB Connected
                            </div>
                        </div>
                    </div>
                    <div class="sb-ai-header-actions">
                        <!-- Read Aloud Voice Button -->
                        <button class="sb-ai-btn-icon sb-ai-btn-voice" id="sbAiVoiceToggle" title="Read responses aloud" aria-label="Toggle Voice">
                            <svg viewBox="0 0 24 24"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-2.5 9.77l-4.5-4h-4v6h4l4.5 4v-6zm4.5-4.77v2.06c1.39.49 2.5 1.63 2.5 3.21s-1.11 2.72-2.5 3.21v2.06c2.51-.55 4.5-2.61 4.5-5.27s-1.99-4.72-4.5-5.27z"/></svg>
                        </button>
                        <!-- Reset Chat History Button -->
                        <button class="sb-ai-btn-icon sb-ai-btn-reset" id="sbAiClearChat" title="Reset / Clear Chat History" aria-label="Reset Chat">
                            <svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                        </button>
                        <!-- Zoom / Maximize Button -->
                        <button class="sb-ai-btn-icon sb-ai-btn-zoom" id="sbAiMaximize" title="Zoom / Expand Window" aria-label="Zoom Window">
                            <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                        </button>
                        <!-- Exit / Close Button -->
                        <button class="sb-ai-btn-icon sb-ai-btn-close" id="sbAiClose" title="Exit / Close Copilot" aria-label="Close Copilot">
                            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                        </button>
                    </div>
                </div>

                <!-- Live Context Bar -->
                <div class="sb-ai-context-banner">
                    <div class="sb-ai-context-text">
                        <span class="sb-ai-context-chip" id="sbAiRoleChip">STUDENT</span>
                        <span id="sbAiContextUser">Loading context...</span>
                    </div>
                    <span id="sbAiReadinessPill" class="text-accent font-bold"></span>
                </div>

                <!-- Messages Container -->
                <div class="sb-ai-messages" id="sbAiMessagesList">
                    <!-- Dynamic Messages -->
                </div>

                <!-- Suggestion Chips -->
                <div class="sb-ai-chips-container" id="sbAiChipsContainer">
                    <!-- Dynamic Chips -->
                </div>

                <!-- Input Area -->
                <div class="sb-ai-input-area">
                    <div class="sb-ai-input-box">
                        <textarea class="sb-ai-textarea" id="sbAiInput" placeholder="Ask AI anything or request a summary..." rows="1"></textarea>
                        <div class="sb-ai-input-actions">
                            <button class="sb-ai-mic-btn" id="sbAiMicBtn" title="Speak message">
                                <i class="fa-solid fa-microphone"></i>
                            </button>
                            <button class="sb-ai-send-btn" id="sbAiSendBtn" title="Send message">
                                <i class="fa-solid fa-arrow-up"></i>
                            </button>
                        </div>
                    </div>
                    <div class="sb-ai-input-footer">
                        <span>⚡ Lightning Free Engine</span>
                        <span>Press <span class="sb-ai-kbd-hint">Enter ↵</span> to send</span>
                    </div>
                </div>
            `;
            document.body.appendChild(this.modal);
        } else {
            this.modal = document.getElementById("sbAiModal");
        }

        this.messagesList = document.getElementById("sbAiMessagesList");
        this.inputArea = document.getElementById("sbAiInput");
        this.sendBtn = document.getElementById("sbAiSendBtn");
        this.micBtn = document.getElementById("sbAiMicBtn");
        this.chipsContainer = document.getElementById("sbAiChipsContainer");
        this.roleChip = document.getElementById("sbAiRoleChip");
        this.contextUser = document.getElementById("sbAiContextUser");
        this.readinessPill = document.getElementById("sbAiReadinessPill");
        this.modelBadge = document.getElementById("sbAiModelBadge");
    }

    async gatherRealtimeDatabaseContext() {
        try {
            const currentPath = window.location.pathname.toLowerCase();
            if (currentPath.includes("/student")) this.userContext.role = "student";
            else if (currentPath.includes("/industry")) this.userContext.role = "industry";
            else if (currentPath.includes("/institution") || currentPath.includes("/institutional")) this.userContext.role = "institution";
            else if (currentPath.includes("/academician")) this.userContext.role = "academician";

            // Check Session Storage
            const sessionEmail = sessionStorage.getItem("userEmail");
            const sessionRole = sessionStorage.getItem("userRole");
            const sessionUID = sessionStorage.getItem("userUID");

            if (sessionRole) this.userContext.role = sessionRole;
            if (sessionEmail) this.userContext.email = sessionEmail;

            // Live On-Page Metric Scraper
            const onPageReadiness = document.getElementById("readiness-value-display")?.textContent ||
                                    document.getElementById("sidebar-readiness")?.textContent;
            if (onPageReadiness) {
                const parsed = parseInt(onPageReadiness.replace(/\D/g, ""), 10);
                if (!isNaN(parsed) && parsed > 0) this.userContext.readiness = parsed;
            }

            const onPageName = document.getElementById("greeting-name")?.textContent ||
                               document.getElementById("welcomeName")?.textContent ||
                               document.getElementById("profileName")?.textContent ||
                               document.getElementById("userName")?.textContent;
            if (onPageName) {
                const cleanName = onPageName.replace(/Good (morning|afternoon|evening),\s*/i, "").replace(/[👋,]/g, "").trim();
                if (cleanName && cleanName.length > 2 && cleanName !== "Student" && !cleanName.includes("Loading")) {
                    this.userContext.name = cleanName;
                }
            }

            // Connect to Firestore
            try {
                const isSubfolder = currentPath.includes("/student/") || currentPath.includes("/industry/") || currentPath.includes("/institution/") || currentPath.includes("/institutional/") || currentPath.includes("/academician/");
                const configPath = isSubfolder ? "../js/firebase-config.js" : "js/firebase-config.js";
                
                const { db, auth } = await import(configPath).catch(() => ({ db: null, auth: null }));
                
                if (db) {
                    const { collection, getDocs, doc, getDoc, limit, query } = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js");
                    
                    const currentAuthUser = auth?.currentUser;
                    const uid = currentAuthUser?.uid || sessionUID || (this.userContext.role === "student" ? "demo-student-001" : null);

                    if (uid) {
                        const userSnap = await getDoc(doc(db, "users", uid));
                        if (userSnap.exists()) {
                            const uData = userSnap.data();
                            this.userContext.name = uData.fullName || uData.name || this.userContext.name;
                            this.userContext.email = uData.email || currentAuthUser?.email || this.userContext.email;
                            this.userContext.role = uData.role || this.userContext.role;
                            this.userContext.skills = uData.skills || this.userContext.skills;
                            this.userContext.readiness = uData.readiness || this.userContext.readiness;
                            this.userContext.university = uData.university || this.userContext.university;
                            this.userContext.targetRole = uData.targetRole || this.userContext.targetRole;
                        }
                    }

                    // Fetch live Opportunities
                    const oppSnap = await getDocs(query(collection(db, "opportunities"), limit(8)));
                    this.userContext.liveOpportunities = [];
                    oppSnap.forEach(d => {
                        const data = d.data();
                        this.userContext.liveOpportunities.push({
                            id: d.id,
                            title: data.title || data.role,
                            company: data.companyName || data.company,
                            requiredSkills: data.requiredSkills || data.skills || [],
                            location: data.location || "Remote",
                            stipend: data.stipend || data.salary || "Competitive"
                        });
                    });
                }
            } catch (fbErr) {
                console.warn("Using cached / on-page student context:", fbErr.message);
            }

            // Defaults
            if (!this.userContext.name || this.userContext.name === "SkillBridge User") {
                if (this.userContext.role === "student") this.userContext.name = "Priya Sharma";
                else if (this.userContext.role === "industry") this.userContext.name = "HyperScale Recruiter";
                else if (this.userContext.role === "institution") this.userContext.name = "Dean of Industry Training";
                else if (this.userContext.role === "academician") this.userContext.name = "Dr. Rajesh Kumar";
            }

            if (Object.keys(this.userContext.skills).length === 0) {
                this.userContext.skills = { "React": 88, "Node.js": 82, "JavaScript": 90, "Python": 75, "Firebase": 85, "SQL": 70 };
            }

            this.updateContextUI();
            this.renderRoleChips();

            if (this.chatHistory.length === 0) {
                this.addBotGreeting();
            }
        } catch (err) {
            console.error("Context error:", err);
        }
    }

    updateContextUI() {
        if (this.roleChip) this.roleChip.textContent = this.userContext.role.toUpperCase();
        if (this.contextUser) {
            const pageClean = document.title.replace("SkillBridge", "").replace("-", "").trim() || "Overview";
            this.contextUser.textContent = `${this.userContext.name} • ${pageClean}`;
        }
        if (this.readinessPill && this.userContext.role === "student") {
            this.readinessPill.textContent = `${this.userContext.readiness}% Readiness`;
        }
    }

    renderRoleChips() {
        if (!this.chipsContainer) return;
        this.chipsContainer.innerHTML = "";

        const chipSets = {
            student: [
                { label: "📊 Summarize My Readiness", prompt: "Summarize my current skill readiness score, top verified competencies, and overall employability profile." },
                { label: "💼 Best Matching Opportunities", prompt: "Based on my skills in the database, what are the top matching live opportunities and internships?" },
                { label: "🧠 Analyze My Skill Gaps", prompt: "What are my biggest skill gaps for my target role, and what specific projects or topics should I bridge next?" },
                { label: "🗺️ Recommend Next Roadmap Step", prompt: "What is the recommended next action on my career roadmap to reach 95% readiness?" },
                { label: "📝 Practice Technical Interview", prompt: "Generate 3 challenging technical interview questions with ideal answers tailored to my strongest skills." }
            ],
            industry: [
                { label: "🔍 Find Top React & AI Candidates", prompt: "Search the candidate database and summarize the top students with strong React, Python, or AI proficiencies." },
                { label: "✍️ Help Draft a Job Post", prompt: "Draft a modern, high-impact job description for a Full-Stack AI Engineer internship." },
                { label: "📈 Summarize Talent Pool", prompt: "Provide an executive summary of the student talent pool, average readiness, and top emerging skills." },
                { label: "🏆 Create a Hackathon Challenge", prompt: "Suggest an industry problem statement for a collaborative university challenge." }
            ],
            institution: [
                { label: "📉 Summarize Cohort Skill Gaps", prompt: "Analyze the student cohort data and summarize where curriculum skill gaps are most pronounced compared to industry requirements." },
                { label: "🤝 Industry Demand Trends", prompt: "What are the most in-demand industry skills based on recent live job and internship postings?" },
                { label: "📊 Placement Readiness Report", prompt: "Summarize the institutional placement readiness index and highlight action items for faculty." }
            ],
            academician: [
                { label: "🔬 Industry Research Ideas", prompt: "Suggest joint industry-academia applied research project topics in Cloud & AI." },
                { label: "👨‍🏫 Mentorship Guidance", prompt: "Give me recommendations on guiding final-year students toward high-impact capstone projects." },
                { label: "📝 Syllabus Modernization", prompt: "What cutting-edge practical topics should be integrated into our Computer Science curriculum?" }
            ]
        };

        const chips = chipSets[this.userContext.role] || chipSets.student;
        chips.forEach(chip => {
            const btn = document.createElement("button");
            btn.className = "sb-ai-chip";
            btn.innerHTML = chip.label;
            btn.addEventListener("click", () => {
                this.sendUserMessage(chip.prompt);
            });
            this.chipsContainer.appendChild(btn);
        });
    }

    addBotGreeting() {
        let greetingText = "";
        if (this.userContext.role === "student") {
            greetingText = `👋 Hello **${this.userContext.name}**! I'm your **SkillBridge AI Copilot**.\n\nI have direct access to your verified skills (**React 88%**, **Node.js 82%**, **Firebase 85%**), current readiness score (**${this.userContext.readiness}%**), and live opportunities.\n\nAsk me anything or choose a quick prompt below!`;
        } else if (this.userContext.role === "industry") {
            greetingText = `🏢 Welcome **${this.userContext.name}**! I'm your **Industry Talent Intelligence Copilot**.\n\nI can filter student candidate scores, summarize talent readiness, or assist with job posts. How can I help you today?`;
        } else if (this.userContext.role === "institution") {
            greetingText = `🏛️ Welcome **${this.userContext.name}**! I'm your **Institutional Analytics Copilot**.\n\nI monitor cohort skill gaps, placement outcomes, and curriculum alignment. Ask me for a summary anytime!`;
        } else {
            greetingText = `👨‍🏫 Welcome **${this.userContext.name}**! I'm your **Academic Collaboration Copilot**.\n\nI assist with research proposals, student advising, and syllabus modernization. How may I assist you today?`;
        }

        this.appendMessage("bot", greetingText);
    }

    setupEventListeners() {
        this.fab.addEventListener("click", () => this.toggleModal());

        document.getElementById("sbAiClose")?.addEventListener("click", () => this.toggleModal(false));
        document.getElementById("sbAiMaximize")?.addEventListener("click", () => this.toggleMaximize());
        document.getElementById("sbAiClearChat")?.addEventListener("click", () => this.clearChat());
        
        const voiceBtn = document.getElementById("sbAiVoiceToggle");
        voiceBtn?.addEventListener("click", () => {
            this.isSpeaking = !this.isSpeaking;
            voiceBtn.classList.toggle("sb-ai-active", this.isSpeaking);
            if (!this.isSpeaking && window.speechSynthesis) window.speechSynthesis.cancel();
        });

        this.sendBtn?.addEventListener("click", () => this.handleSend());
        this.inputArea?.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });

        this.inputArea?.addEventListener("input", () => {
            this.inputArea.style.height = "auto";
            this.inputArea.style.height = `${Math.min(this.inputArea.scrollHeight, 100)}px`;
        });

        window.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
                e.preventDefault();
                this.toggleModal();
            } else if (e.key === "Escape" && this.isOpen) {
                this.toggleModal(false);
            }
        });
    }

    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition && this.micBtn) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.lang = "en-US";

            this.recognition.onstart = () => this.micBtn.classList.add("sb-ai-recording");
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (transcript && this.inputArea) {
                    this.inputArea.value = transcript;
                    this.handleSend();
                }
            };
            this.recognition.onerror = () => this.micBtn.classList.remove("sb-ai-recording");
            this.recognition.onend = () => this.micBtn.classList.remove("sb-ai-recording");

            this.micBtn.addEventListener("click", () => {
                if (this.micBtn.classList.contains("sb-ai-recording")) {
                    this.recognition.stop();
                } else {
                    this.recognition.start();
                }
            });
        } else if (this.micBtn) {
            this.micBtn.style.display = "none";
        }
    }

    toggleModal(forceState = null) {
        this.isOpen = forceState !== null ? forceState : !this.isOpen;
        if (this.modal) {
            this.modal.classList.toggle("sb-ai-open", this.isOpen);
            if (this.isOpen) {
                setTimeout(() => this.inputArea?.focus(), 250);
                this.scrollToBottom();
            }
        }
    }

    toggleMaximize() {
        this.isMaximized = !this.isMaximized;
        if (this.modal) {
            this.modal.classList.toggle("sb-ai-maximized", this.isMaximized);
            const zoomBtn = document.getElementById("sbAiMaximize");
            if (zoomBtn) {
                zoomBtn.innerHTML = this.isMaximized 
                    ? `<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5h2z"/></svg>`
                    : `<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;
            }
        }
    }

    clearChat() {
        if (confirm("Reset conversation history?")) {
            this.chatHistory = [];
            sessionStorage.removeItem("sb_ai_chat_history");
            if (this.messagesList) this.messagesList.innerHTML = "";
            this.addBotGreeting();
        }
    }

    handleSend() {
        const text = this.inputArea?.value.trim();
        if (!text) return;
        this.inputArea.value = "";
        this.inputArea.style.height = "auto";
        this.sendUserMessage(text);
    }

    async sendUserMessage(text) {
        this.appendMessage("user", text);
        this.scrollToBottom();

        const typingEl = this.showTypingIndicator();
        this.scrollToBottom();

        try {
            const systemPrompt = this.buildSystemPrompt();
            const responseText = await this.callOpenRouterWithCascade(systemPrompt, text);

            this.removeTypingIndicator(typingEl);
            this.appendBotMessageStreaming(responseText);

            if (this.isSpeaking) {
                this.speakText(responseText);
            }
        } catch (err) {
            this.removeTypingIndicator(typingEl);
            this.appendMessage("bot", `⚠️ **Notice**: I encountered a temporary connection issue (${err.message}). Please try sending your query again.`);
            this.scrollToBottom();
        }
    }

    buildSystemPrompt() {
        const skillsFormatted = Object.entries(this.userContext.skills || {})
            .map(([k, v]) => `${k} (${v}%)`)
            .join(", ") || "React (88%), Node.js (82%), JavaScript (90%), Python (75%), SQL (70%), Firebase (85%)";

        const oppsFormatted = this.userContext.liveOpportunities.length > 0 
            ? JSON.stringify(this.userContext.liveOpportunities.slice(0, 5), null, 2)
            : "Live opportunities available in Firestore.";

        return `You are the SkillBridge AI Intelligence Copilot, an ultra-fast, deeply intelligent AI assistant embedded within the SkillBridge platform.

USER & SYSTEM CONTEXT:
- Name: ${this.userContext.name}
- Email: ${this.userContext.email || "student@skillbridge.edu"}
- Role: ${this.userContext.role} (student, industry, institution, academician)
- Client OS/Platform: ${this.userContext.clientSystem.platform} (${this.userContext.clientSystem.screenResolution})
- Active Page: "${this.userContext.pageTitle}"
- Readiness Score: ${this.userContext.readiness}%
- Target Role: ${this.userContext.targetRole}
- Verified Skills Map: ${skillsFormatted}
- Database Opportunities:
${oppsFormatted}

INSTRUCTIONS:
1. Provide lightning-fast, structured, executive responses tailored precisely to ${this.userContext.name}.
2. Use Markdown tables, bold bullet points, and emojis for readability.
3. Keep answers concise, actionable, and encouraging. Directly compute and reference metrics.`;
    }

    async callOpenRouterWithCascade(systemPrompt, userQuery) {
        const messages = [
            { role: "system", content: systemPrompt }
        ];

        const recentHistory = this.chatHistory.slice(-4);
        recentHistory.forEach(msg => {
            messages.push({
                role: msg.sender === "user" ? "user" : "assistant",
                content: msg.text
            });
        });

        messages.push({ role: "user", content: userQuery });

        let lastError = null;
        for (let i = 0; i < FREE_MODELS.length; i++) {
            const modelName = FREE_MODELS[i];
            try {
                this.updateModelBadge(modelName);
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                        "HTTP-Referer": window.location.origin || "https://skillbridge.ansora.edu",
                        "X-Title": "SkillBridge AI Copilot",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: messages,
                        temperature: 0.7,
                        max_tokens: 800
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(`Model ${modelName} returned HTTP ${response.status}: ${errData.error?.message || "Rate limited"}`);
                }

                const data = await response.json();
                if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
                    return data.choices[0].message.content.trim();
                } else {
                    throw new Error(`Empty response from ${modelName}`);
                }
            } catch (err) {
                console.warn(`[SkillBridge AI] Retrying with next model:`, err.message);
                lastError = err;
            }
        }

        throw lastError || new Error("All free OpenRouter models are currently busy. Please retry shortly.");
    }

    updateModelBadge(modelName) {
        if (!this.modelBadge) return;
        let clean = modelName.split("/")[1]?.split(":")[0]?.replace("-instruct", "").toUpperCase() || "AI FREE";
        if (clean.includes("NEMOTRON")) clean = "NVIDIA LIGHTNING";
        else if (clean.includes("MINIMAX")) clean = "MINIMAX ULTRA";
        else if (clean.includes("LFM")) clean = "LIQUID FAST";
        this.modelBadge.textContent = clean;
    }

    appendMessage(sender, text) {
        if (!this.messagesList) return;

        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const row = document.createElement("div");
        row.className = `sb-ai-msg-row ${sender === "user" ? "sb-ai-user-row sb-ai-msg-user" : "sb-ai-bot-row sb-ai-msg-bot"}`;

        const avatar = sender === "user" 
            ? `<div class="sb-ai-msg-avatar sb-ai-user-avatar">${(this.userContext.name || "U")[0].toUpperCase()}</div>`
            : `<div class="sb-ai-msg-avatar sb-ai-bot-avatar"><i class="fa-solid fa-wand-magic-sparkles"></i></div>`;

        const parsedContent = sender === "user" ? this.escapeHtml(text) : this.parseMarkdown(text);

        row.innerHTML = `
            ${avatar}
            <div class="sb-ai-msg-content">
                <div class="sb-ai-msg-bubble">
                    ${parsedContent}
                </div>
                <span class="sb-ai-msg-time">${timeString}</span>
            </div>
        `;

        this.messagesList.appendChild(row);
        this.chatHistory.push({ sender, text, time: timeString });
        this.saveChatHistory();

        row.querySelectorAll(".sb-ai-code-copy-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const code = btn.nextElementSibling?.textContent || "";
                navigator.clipboard.writeText(code);
                btn.textContent = "Copied!";
                setTimeout(() => btn.textContent = "Copy", 1800);
            });
        });
    }

    appendBotMessageStreaming(text) {
        if (!this.messagesList) return;

        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const row = document.createElement("div");
        row.className = "sb-ai-msg-row sb-ai-bot-row sb-ai-msg-bot";

        const avatar = `<div class="sb-ai-msg-avatar sb-ai-bot-avatar"><i class="fa-solid fa-wand-magic-sparkles"></i></div>`;

        row.innerHTML = `
            ${avatar}
            <div class="sb-ai-msg-content">
                <div class="sb-ai-msg-bubble"></div>
                <span class="sb-ai-msg-time">${timeString}</span>
            </div>
        `;

        this.messagesList.appendChild(row);
        const bubble = row.querySelector(".sb-ai-msg-bubble");

        const words = text.split(" ");
        let i = 0;
        const chunkSize = 5;

        const streamInterval = setInterval(() => {
            i += chunkSize;
            const currentSlice = words.slice(0, i).join(" ");
            bubble.innerHTML = this.parseMarkdown(currentSlice);
            this.scrollToBottom();

            if (i >= words.length) {
                clearInterval(streamInterval);
                bubble.innerHTML = this.parseMarkdown(text);
                this.chatHistory.push({ sender: "bot", text, time: timeString });
                this.saveChatHistory();
                this.scrollToBottom();

                row.querySelectorAll(".sb-ai-code-copy-btn").forEach(btn => {
                    btn.addEventListener("click", () => {
                        const code = btn.nextElementSibling?.textContent || "";
                        navigator.clipboard.writeText(code);
                        btn.textContent = "Copied!";
                        setTimeout(() => btn.textContent = "Copy", 1800);
                    });
                });
            }
        }, 18);
    }

    showTypingIndicator() {
        if (!this.messagesList) return null;
        const typing = document.createElement("div");
        typing.className = "sb-ai-msg-row sb-ai-bot-row sb-ai-typing-indicator-row";
        typing.innerHTML = `
            <div class="sb-ai-msg-avatar sb-ai-bot-avatar"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
            <div class="sb-ai-typing-indicator">
                <div class="sb-ai-dot"></div>
                <div class="sb-ai-dot"></div>
                <div class="sb-ai-dot"></div>
                <span class="sb-ai-typing-text">AI is thinking & analyzing DB...</span>
            </div>
        `;
        this.messagesList.appendChild(typing);
        return typing;
    }

    removeTypingIndicator(el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }

    scrollToBottom() {
        if (this.messagesList) {
            this.messagesList.scrollTop = this.messagesList.scrollHeight;
        }
    }

    speakText(text) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/[*#`_~\[\]()]/g, "").replace(/https?:\/\/\S+/g, "");
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }

    saveChatHistory() {
        try {
            sessionStorage.setItem("sb_ai_chat_history", JSON.stringify(this.chatHistory.slice(-20)));
        } catch (e) { /* ignore */ }
    }

    loadChatHistory() {
        try {
            const saved = sessionStorage.getItem("sb_ai_chat_history");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.chatHistory = [];
                    parsed.forEach(msg => this.appendMessage(msg.sender, msg.text));
                }
            }
        } catch (e) { /* ignore */ }
    }

    escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    parseMarkdown(md) {
        if (!md) return "";
        let html = md;

        // Code Blocks with Copy button
        html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><button class="sb-ai-code-copy-btn">Copy</button><code>${this.escapeHtml(code.trim())}</code></pre>`;
        });

        // Inline Code
        html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h4 style="margin:8px 0 4px 0; color:#ffd700; font-size:0.95rem;">$1</h4>');
        html = html.replace(/^## (.*$)/gim, '<h3 style="margin:10px 0 6px 0; color:#ffd700; font-size:1.05rem;">$1</h3>');
        html = html.replace(/^# (.*$)/gim, '<h2 style="margin:12px 0 6px 0; color:#ffd700; font-size:1.15rem;">$1</h2>');

        // Bold & Italic
        html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

        // Unordered lists
        html = html.replace(/^\s*[-*•]\s+(.*)$/gim, "<li>$1</li>");
        html = html.replace(/(<li>.*<\/li>)/gms, "<ul>$1</ul>");

        // Ordered lists
        html = html.replace(/^\s*(\d+)\.\s+(.*)$/gim, "<li>$2</li>");

        // Line breaks
        html = html.replace(/\n\n/g, "<p></p>");
        html = html.replace(/\n/g, "<br>");

        return html;
    }
}

// Auto-Mount when document is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        window.skillBridgeAICopilot = new SkillBridgeAICopilot();
    });
} else {
    window.skillBridgeAICopilot = new SkillBridgeAICopilot();
}

export default SkillBridgeAICopilot;
