// ==========================================================================
// ANSORA — INDUSTRY PORTAL CORE REAL-TIME LOGIC & FIRESTORE ENGINE
// Talent Intelligence + Academic Collaboration Workspace
// Connected to Firebase Authentication & Cloud Firestore (Real-Time)
// ==========================================================================

import {
    auth,
    db
} from "../../js/firebase-config.js";

import {
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ==========================================================================
// APPLICATION REAL-TIME STATE STORE
// ==========================================================================
const state = {
    currentUser: null,
    company: {
        name: "Loading...",
        sector: "Software & IT Solutions",
        expertise: ["AI/ML", "Cloud Computing", "Software Engineering"],
        tech: ["JavaScript", "Python", "React", "Node.js"],
        interests: ["Internships", "Jobs", "Live Projects", "Mentorship", "Workshops"]
    },
    opportunities: [],
    rawStudents: [],
    candidates: [],
    pipelineStatuses: {},
    institutions: [],
    liveProjects: [],
    challenges: [],
    activityLog: [],
    currentOppFilter: "all",
    unsubscribers: []
};

// ==========================================================================
// AUTHENTICATION & REAL-TIME FIRESTORE SUBSCRIPTIONS
// ==========================================================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    state.currentUser = user;
    initRealtimeData(user);
});

function initRealtimeData(user) {
    // Unsubscribe from previous listeners if any
    state.unsubscribers.forEach(unsub => {
        try { unsub(); } catch (e) { /* noop */ }
    });
    state.unsubscribers = [];

    // 1. Company Profile Real-Time Sync
    const userDocRef = doc(db, "users", user.uid);
    const unsubCompany = onSnapshot(userDocRef, (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            if (data.role && data.role !== "industry") {
                redirectWrongRole(data.role);
                return;
            }

            state.company = {
                name: data.companyName || data.name || user.displayName || "My Organization",
                sector: data.sector || "Software & IT Solutions",
                expertise: Array.isArray(data.expertise) ? data.expertise : (data.expertise ? data.expertise.split(",").map(s => s.trim()).filter(Boolean) : ["AI/ML", "Cloud Computing", "Software Engineering"]),
                tech: Array.isArray(data.tech) ? data.tech : (data.tech ? data.tech.split(",").map(s => s.trim()).filter(Boolean) : ["JavaScript", "Python", "React", "Node.js"]),
                interests: Array.isArray(data.interests) ? data.interests : ["Internships", "Jobs", "Live Projects", "Mentorship", "Workshops"]
            };

            updateCompanyUI();
            recalculateTalentMatches();
            renderSkillIntelligence();
        } else {
            // First time login - initialize industry doc in Firestore
            const initialDoc = {
                name: user.displayName || "My Organization",
                companyName: user.displayName || "My Organization",
                email: user.email || "",
                role: "industry",
                sector: "Software & IT Solutions",
                expertise: ["AI/ML", "Cloud Computing", "Software Engineering"],
                tech: ["JavaScript", "Python", "React", "Node.js"],
                interests: ["Internships", "Jobs", "Live Projects", "Mentorship", "Workshops"],
                createdAt: serverTimestamp()
            };
            setDoc(userDocRef, initialDoc, { merge: true });
        }
    }, (error) => {
        console.error("Company profile subscription error:", error);
    });
    state.unsubscribers.push(unsubCompany);

    // 2. Opportunities Real-Time Listener
    const oppsRef = collection(db, "opportunities");
    const unsubOpps = onSnapshot(oppsRef, (snap) => {
        state.opportunities = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        })).sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt || 0).getTime());
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt || 0).getTime());
            return timeB - timeA;
        });

        renderAllOpportunities(state.currentOppFilter);
        renderDashboardOpportunities();
        updateKpis();
        recalculateTalentMatches();
        renderSkillIntelligence();
    }, (error) => {
        console.error("Opportunities subscription error:", error);
    });
    state.unsubscribers.push(unsubOpps);

    // 3. Talent Pipeline Statuses Listener (Candidate Stage Progression)
    const pipelineRef = collection(db, `companies/${user.uid}/pipeline`);
    const unsubPipeline = onSnapshot(pipelineRef, (snap) => {
        const statuses = {};
        snap.docs.forEach(d => {
            statuses[d.id] = d.data().status;
        });
        state.pipelineStatuses = statuses;
        recalculateTalentMatches();
    }, (error) => {
        console.error("Pipeline subscription error:", error);
    });
    state.unsubscribers.push(unsubPipeline);

    // 4. Students Real-Time Listener (Firestore "users" where role == "student")
    const studentsQuery = query(collection(db, "users"), where("role", "==", "student"));
    const unsubStudents = onSnapshot(studentsQuery, (snap) => {
        state.rawStudents = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));
        recalculateTalentMatches();
        renderSkillIntelligence();
    }, (error) => {
        console.error("Students subscription error:", error);
    });
    state.unsubscribers.push(unsubStudents);

    // 5. Live Projects Real-Time Listener
    const projRef = collection(db, "projects");
    const unsubProjects = onSnapshot(projRef, (snap) => {
        state.liveProjects = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        })).sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });
        renderLiveProjects();
        updateKpis();
    }, (error) => {
        console.error("Projects subscription error:", error);
    });
    state.unsubscribers.push(unsubProjects);

    // 6. Challenges Real-Time Listener
    const chalRef = collection(db, "challenges");
    const unsubChallenges = onSnapshot(chalRef, (snap) => {
        state.challenges = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        })).sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });
        renderChallenges();
        updateKpis();
    }, (error) => {
        console.error("Challenges subscription error:", error);
    });
    state.unsubscribers.push(unsubChallenges);

    // 7. Academic Partners Real-Time Listener
    const instQuery = query(collection(db, "users"), where("role", "==", "institution"));
    const unsubInsts = onSnapshot(instQuery, (snap) => {
        const registeredInsts = snap.docs.map(d => ({
            id: d.id,
            name: d.data().institutionName || d.data().name || "Academic Institution",
            location: d.data().location || "India",
            relationship: d.data().relationship || "Active Partner",
            studentsEngaged: d.data().studentsCount || 0,
            projects: d.data().projectsCount || 0,
            internships: d.data().internshipsCount || 0,
            workshops: d.data().workshopsCount || 0,
            strengths: Array.isArray(d.data().strengths) ? d.data().strengths : ["Computer Science", "Engineering"],
            matchingStudents: d.data().matchingStudents || 0,
            avgSkill: d.data().avgSkill || "78%"
        }));

        state.registeredInstitutions = registeredInsts;
        mergeAndRenderInstitutions();
    }, (error) => {
        console.error("Institutions subscription error:", error);
    });
    state.unsubscribers.push(unsubInsts);

    const partnersRef = collection(db, `companies/${user.uid}/academic_partners`);
    const unsubPartners = onSnapshot(partnersRef, (snap) => {
        state.customPartners = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));
        mergeAndRenderInstitutions();
    }, (error) => {
        console.error("Academic partners subscription error:", error);
    });
    state.unsubscribers.push(unsubPartners);

    // 8. Activity Stream Real-Time Listener
    const actQuery = query(
        collection(db, `companies/${user.uid}/activities`),
        orderBy("createdAt", "desc"),
        limit(20)
    );
    const unsubActivities = onSnapshot(actQuery, (snap) => {
        state.activityLog = snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            time: formatActivityTime(d.data().createdAt)
        }));
        renderDashboardActivityFeed();
    }, (error) => {
        console.warn("Activities realtime error:", error);
    });
    state.unsubscribers.push(unsubActivities);
}

function mergeAndRenderInstitutions() {
    const allMap = new Map();
    (state.registeredInstitutions || []).forEach(inst => allMap.set(inst.id, inst));
    (state.customPartners || []).forEach(p => allMap.set(p.id, p));
    state.institutions = Array.from(allMap.values());
    renderAcademicPartners();
    renderInstitutionTalent();
}

function formatActivityTime(timestamp) {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}

// ==========================================================================
// DYNAMIC TALENT MATCHING ENGINE (REAL-TIME FIRESTORE DATA)
// ==========================================================================
function recalculateTalentMatches() {
    const companyTech = (state.company.tech || []).map(t => t.toLowerCase());
    const companyExpertise = (state.company.expertise || []).map(e => e.toLowerCase());

    // Gather all skills required by current active opportunities
    const opportunitySkills = new Set();
    state.opportunities.forEach(opp => {
        (opp.skills || []).forEach(s => opportunitySkills.add(s.toLowerCase()));
    });

    const targetSkillSet = new Set([...companyTech, ...companyExpertise, ...opportunitySkills]);
    if (targetSkillSet.size === 0) {
        ["javascript", "python", "react", "node.js", "git"].forEach(s => targetSkillSet.add(s));
    }

    state.candidates = state.rawStudents.map(student => {
        // Extract student skills from Firestore
        let studentSkills = [];
        if (Array.isArray(student.skills)) {
            studentSkills = student.skills.map(s => {
                if (typeof s === "string") {
                    return { name: s, score: 85 };
                }
                return { name: s.name || s.skill || "Skill", score: s.score || s.proficiency || 80 };
            });
        }

        const studentSkillNames = studentSkills.map(s => s.name.toLowerCase());
        let matches = 0;
        const totalTarget = Math.max(1, targetSkillSet.size);

        targetSkillSet.forEach(target => {
            if (studentSkillNames.some(sn => sn.includes(target) || target.includes(sn))) {
                matches++;
            }
        });

        // Calculate dynamic match rate
        let matchRate = Math.min(99, Math.max(65, Math.round((matches / Math.min(5, totalTarget)) * 100)));
        if (studentSkills.length === 0) {
            matchRate = 60;
            studentSkills = [
                { name: "Problem Solving", score: 80 },
                { name: "Computer Science", score: 75 }
            ];
        }

        // Build skill breakdown
        const skillsBreakdown = studentSkills.map(s => {
            const isAligned = targetSkillSet.has(s.name.toLowerCase()) || s.score >= 80;
            return {
                name: s.name,
                score: s.score,
                required: 80,
                status: isAligned ? "aligned" : "gap"
            };
        });

        const strongest = studentSkills
            .slice()
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(s => s.name);

        const gaps = skillsBreakdown.filter(s => s.status === "gap").map(s => s.name);
        const primaryGap = gaps.length > 0
            ? `${gaps[0]} (Develop proficiency for enterprise benchmarks)`
            : "None (Exceeds baseline competency benchmarks)";

        const initials = getInitials(student.name || "Student");
        const status = state.pipelineStatuses[student.id] || "Recommended";

        return {
            id: student.id,
            name: student.name || "Student Candidate",
            initials: initials,
            university: student.college || student.university || "Academic Institute",
            degree: `${student.course || "B.Tech Computer Science"} ${student.year ? `(Year ${student.year})` : ""}`.trim(),
            targetRole: student.targetRole || "Software Engineering Specialist",
            matchRate: matchRate,
            status: status,
            verifiedSkillsCount: studentSkills.length,
            projectsCount: Array.isArray(student.projects) ? student.projects.length : 2,
            internshipsCount: student.internshipsCount || 0,
            skills: skillsBreakdown,
            strongest: strongest.length > 0 ? strongest : ["Core Stack", "Problem Solving"],
            primaryGap: primaryGap,
            summary: student.bio || `Student specializing in ${student.course || "Computer Science"} at ${student.college || "University"}. Verified competency across key frameworks.`,
            projects: Array.isArray(student.projects) && student.projects.length > 0 ? student.projects : [
                { title: "Academic Capstone Project", tech: studentSkills.map(s => s.name).slice(0, 3).join(", ") || "Full-Stack" }
            ]
        };
    }).sort((a, b) => b.matchRate - a.matchRate);

    renderTalentList();
    renderDashboardTalentHighlight();
    updateKpis();
}

function getInitials(name) {
    if (!name) return "ST";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ==========================================================================
// ACTIVITY LOGGING (FIRESTORE REAL-TIME AUDIT STREAM)
// ==========================================================================
async function logActivity(icon, title, desc, tag) {
    if (!state.currentUser) return;
    try {
        await addDoc(collection(db, `companies/${state.currentUser.uid}/activities`), {
            icon: icon || "⚡",
            title: title,
            desc: desc,
            tag: tag || "Update",
            createdAt: serverTimestamp()
        });
    } catch (e) {
        console.warn("Failed to log activity to Firestore:", e);
    }
}

// ==========================================================================
// UI INITIALIZATION & EVENT LISTENERS
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initCommandCenter();
    initOpportunities();
    initTalentDiscovery();
    initSkillIntelligence();
    initLiveProjects();
    initProjectProgressModal();
    initChallengeLeaderboardModal();
    initAcademicPartners();
    initCampusDriveModal();
    initCompanyProfile();
    initAiExtractor();
    initEvaluationModal();
    initSkillPassportModal();
    initGlobalSearch();
    initModalBackdropListeners();
    initMobileMenu();
});

// Toast notification helper
function showToast(message) {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>✓</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%)";
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// ==========================================================================
// NAVIGATION & WORKFLOW STEPPER
// ==========================================================================
function switchSection(targetSection) {
    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
    const sections = document.querySelectorAll(".dashboard-section");
    const pageHeading = document.getElementById("pageHeading");

    const sectionTitles = {
        dashboard: "Executive Collaboration Dashboard",
        opportunities: "Define Business Need & Opportunities",
        talent: "Talent Discovery & Verified Skill Passport",
        intelligence: "Industry Skill Intelligence & Demand",
        projects: "Live Industry Projects & Challenges",
        collaboration: "Academic Partners Collaboration CRM",
        profile: "Company Skill DNA & Profile"
    };

    navItems.forEach(n => {
        if (n.dataset.section === targetSection) n.classList.add("active");
        else n.classList.remove("active");
    });

    sections.forEach(s => s.classList.remove("active"));
    const activeSec = document.getElementById(`section-${targetSection}`);
    if (activeSec) activeSec.classList.add("active");

    if (pageHeading && sectionTitles[targetSection]) {
        pageHeading.textContent = sectionTitles[targetSection];
    }

    const stepMap = {
        dashboard: 1,
        opportunities: 2,
        talent: 3,
        projects: 4,
        intelligence: 6,
        collaboration: 7,
        profile: 1
    };
    const activeStepNum = stepMap[targetSection] || 1;
    for (let i = 1; i <= 7; i++) {
        const stepEl = document.getElementById(`flowStep${i}`);
        if (stepEl) {
            if (i === activeStepNum) stepEl.classList.add("active");
            else stepEl.classList.remove("active");
        }
    }

    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("open");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

window.switchSection = switchSection;

function initNavigation() {
    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            switchSection(item.dataset.section);
        });
    });

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            showToast("Signing out...");
            try {
                await signOut(auth);
                window.location.href = "../index.html";
            } catch (err) {
                console.error("Sign out error:", err);
                window.location.href = "../index.html";
            }
        });
    }
}

window.navigateFlowStep = function(targetSection, action) {
    switchSection(targetSection);

    if (action === "openModal") {
        setTimeout(() => {
            const modal = document.getElementById("opportunityModal");
            if (modal) modal.classList.add("active");
        }, 150);
    } else if (action === "extractor") {
        setTimeout(() => {
            const box = document.getElementById("aiExtractorBox");
            if (box) box.scrollIntoView({ behavior: "smooth" });
            const prompt = document.getElementById("aiPromptInput");
            if (prompt) prompt.focus();
        }, 150);
    } else if (action === "evaluate") {
        setTimeout(() => {
            const modal = document.getElementById("evaluateModal");
            if (modal) modal.classList.add("active");
        }, 150);
    } else if (action === "shortlisted") {
        setTimeout(() => {
            const filter = document.getElementById("talentStatusFilter");
            if (filter) {
                filter.value = "Shortlisted";
                renderTalentList();
            }
        }, 150);
    }
};

// ==========================================================================
// 1. COMMAND CENTER (DASHBOARD)
// ==========================================================================
function getDynamicGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function updateCompanyUI() {
    const bannerName = document.getElementById("bannerCompanyName");
    const sidebarName = document.getElementById("sidebarCompanyName");
    const avatar = document.getElementById("sidebarCompanyAvatar");
    const welcomeHeading = document.querySelector(".command-welcome h2");

    if (welcomeHeading) {
        welcomeHeading.innerHTML = `${getDynamicGreeting()}, <span id="bannerCompanyName">${state.company.name}</span>`;
    } else if (bannerName) {
        bannerName.textContent = state.company.name;
    }

    if (sidebarName) sidebarName.textContent = state.company.name;
    if (avatar) avatar.textContent = state.company.name.substring(0, 3).toUpperCase();

    // Populate Company Profile Form if available
    const dnaName = document.getElementById("dnaCompanyName");
    const dnaSector = document.getElementById("dnaSector");
    const dnaExpertise = document.getElementById("dnaExpertise");
    const dnaTech = document.getElementById("dnaTech");

    if (dnaName && !dnaName.dataset.userModified) dnaName.value = state.company.name;
    if (dnaSector && !dnaSector.dataset.userModified) dnaSector.value = state.company.sector;
    if (dnaExpertise && !dnaExpertise.dataset.userModified) dnaExpertise.value = state.company.expertise.join(", ");
    if (dnaTech && !dnaTech.dataset.userModified) dnaTech.value = state.company.tech.join(", ");

    // Sync interest checkboxes
    const checkboxes = document.querySelectorAll('#companyDnaForm input[name="interest"]');
    checkboxes.forEach(cb => {
        cb.checked = (state.company.interests || []).includes(cb.value);
    });
}

function updateKpis() {
    const kpiOpp = document.getElementById("kpiOpportunities");
    const kpiApp = document.getElementById("kpiApplications");
    const kpiMatch = document.getElementById("kpiMatches");
    const kpiProj = document.getElementById("kpiProjects");

    if (kpiOpp) kpiOpp.textContent = state.opportunities.length;
    if (kpiApp) {
        const totalApps = state.opportunities.reduce((acc, curr) => acc + (curr.applicantsCount || 0), 0);
        kpiApp.textContent = totalApps;
    }
    if (kpiMatch) {
        kpiMatch.textContent = state.candidates.length;
    }
    if (kpiProj) {
        kpiProj.textContent = state.liveProjects.length + state.challenges.length;
    }
}

function initCommandCenter() {
    updateCompanyUI();
    updateKpis();
    renderDashboardTalentHighlight();
    renderDashboardOpportunities();
    renderDashboardActivityFeed();
}

function renderDashboardActivityFeed() {
    const container = document.getElementById("dashboardActivityFeed");
    if (!container) return;
    container.innerHTML = "";

    if (state.activityLog.length === 0) {
        container.innerHTML = `
            <div style="padding: 18px; text-align: center; color: var(--text-muted); font-size: 12px;">
                No recent activity recorded yet. Actions in the workspace will stream here in real time.
            </div>
        `;
        return;
    }

    state.activityLog.slice(0, 5).forEach(item => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";
        row.style.padding = "10px 14px";
        row.style.background = "var(--soft-grey)";
        row.style.borderRadius = "6px";
        row.style.border = "1px solid var(--border)";
        row.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:16px;">${item.icon || "⚡"}</span>
                <div>
                    <strong style="font-size:12px;color:var(--deep-black);">${item.title}</strong>
                    <div style="font-size:11px;color:var(--text-muted);">${item.desc}</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="badge badge-soft">${item.tag || "Activity"}</span>
                <span style="font-size:11px;color:var(--text-muted);">${item.time}</span>
            </div>
        `;
        container.appendChild(row);
    });
}

function renderDashboardTalentHighlight() {
    const container = document.getElementById("dashboardTalentGrid");
    if (!container) return;
    container.innerHTML = "";

    if (state.candidates.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); font-size: 12px; background: var(--soft-grey); border-radius: 6px; border: 1px dashed var(--border);">
                No verified students registered in the platform yet. As students create profiles, they will automatically match here.
            </div>
        `;
        return;
    }

    state.candidates.slice(0, 2).forEach(cand => {
        container.appendChild(createTalentCard(cand));
    });
}

function renderDashboardOpportunities() {
    const container = document.getElementById("dashboardOpportunitiesList");
    if (!container) return;
    container.innerHTML = "";

    if (state.opportunities.length === 0) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px; background: var(--soft-grey); border-radius: 6px; border: 1px dashed var(--border);">
                No opportunities defined yet. Click <strong>Define Business Need</strong> to create your first opening.
            </div>
        `;
        return;
    }

    state.opportunities.slice(0, 4).forEach(opp => {
        const div = document.createElement("div");
        div.style.padding = "14px";
        div.style.background = "var(--soft-grey)";
        div.style.borderRadius = "6px";
        div.style.marginBottom = "10px";
        div.style.border = "1px solid var(--border)";
        div.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                    <strong style="font-size:13px;color:var(--deep-black);">${opp.title}</strong>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${opp.type} • ${opp.location}</div>
                </div>
                <span class="badge badge-gold">${opp.matchesCount || 0} Matches</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:11px;color:var(--graphite);">
                <span>${opp.applicantsCount || 0} Applicants</span>
                <span style="font-weight:700;color:var(--strategic-gold);">${opp.compensation}</span>
            </div>
        `;
        container.appendChild(div);
    });
}

// ==========================================================================
// 2. OPPORTUNITIES MODULE (REAL-TIME FIRESTORE CRUD)
// ==========================================================================
function initOpportunities() {
    renderAllOpportunities("all");

    const tabs = document.querySelectorAll(".opp-type-tab");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            state.currentOppFilter = tab.dataset.filter;
            renderAllOpportunities(state.currentOppFilter);
        });
    });

    const openBtn = document.getElementById("openCreateOpportunityBtn");
    const manualBtn = document.getElementById("manualCreateOppBtn");
    const modal = document.getElementById("opportunityModal");
    const closeBtn = document.getElementById("closeOppModalBtn");
    const cancelBtn = document.getElementById("cancelOppModalBtn");
    const form = document.getElementById("opportunityForm");

    const openModal = () => { if (modal) modal.classList.add("active"); };
    const closeModal = () => { if (modal) modal.classList.remove("active"); };

    if (openBtn) openBtn.addEventListener("click", openModal);
    if (manualBtn) manualBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!state.currentUser) return;

            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Publishing to Firestore...";
            }

            const title = document.getElementById("oppTitleInput").value.trim();
            const type = document.getElementById("oppTypeSelect").value;
            const duration = document.getElementById("oppDurationInput").value.trim();
            const location = document.getElementById("oppLocationInput").value.trim();
            const compensation = document.getElementById("oppCompensationInput").value.trim() || "Competitive Stipend";
            const skills = document.getElementById("oppSkillsInput").value.split(",").map(s => s.trim()).filter(Boolean);
            const description = document.getElementById("oppDescInput").value.trim();

            const newOpp = {
                title: title,
                type: type,
                duration: duration,
                location: location,
                compensation: compensation,
                skills: skills,
                description: description,
                status: "Active",
                applicantsCount: 0,
                matchesCount: 0,
                companyId: state.currentUser.uid,
                companyName: state.company.name,
                createdAt: serverTimestamp()
            };

            try {
                await addDoc(collection(db, "opportunities"), newOpp);
                await logActivity("💼", "New Need Defined", `Published: ${title} (${type})`, "Opportunity");
                closeModal();
                form.reset();
                showToast(`Published: ${title}! Matching verified talent found.`);
            } catch (error) {
                console.error("Failed to publish opportunity:", error);
                alert("Failed to save opportunity to Firestore: " + error.message);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Publish Opportunity to Network";
                }
            }
        });
    }
}

function renderAllOpportunities(filter) {
    const grid = document.getElementById("allOpportunitiesGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const list = filter === "all" ? state.opportunities : state.opportunities.filter(o => o.type === filter);

    if (list.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 40px; text-align: center;">
                <div style="font-size:32px;margin-bottom:10px;">📂</div>
                <h3 style="font-size:16px;color:var(--deep-black);">No Opportunities in this Category</h3>
                <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Define a new business need to automatically discover verified academic talent from Firestore.</p>
                <button class="btn-primary-action" style="margin-top:14px;" onclick="document.getElementById('openCreateOpportunityBtn').click()">+ Define Business Need</button>
            </div>
        `;
        return;
    }

    list.forEach(opp => {
        const card = document.createElement("div");
        card.className = "job-card";
        card.innerHTML = `
            <div class="job-card-header">
                <div>
                    <h3 class="job-title">${opp.title}</h3>
                    <span class="job-type">${opp.type} • ${opp.duration || "Flexible"}</span>
                </div>
                <span class="badge badge-gold">${opp.matchesCount || 0} Match Candidates</span>
            </div>

            <p style="font-size:12px;color:var(--graphite);line-height:1.6;margin:8px 0;">${opp.description || "No description provided."}</p>

            <div class="job-meta">
                <span>📍 ${opp.location || "Remote / Hybrid"}</span>
                <span>💰 ${opp.compensation || "Competitive"}</span>
            </div>

            <div class="job-skills">
                ${(opp.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join("")}
            </div>

            <div class="job-footer">
                <span class="job-applicants-count">${opp.applicantsCount || 0} Applicants</span>
                <button class="btn-view-job" onclick="window.exploreTalentForOpportunity('${opp.id}')">Explore Talent Matches →</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.exploreTalentForOpportunity = function(oppId) {
    const opp = state.opportunities.find(o => o.id === oppId);
    if (!opp) return;

    switchSection("talent");

    const skillSelect = document.getElementById("talentSkillFilter");
    if (skillSelect && opp.skills && opp.skills.length > 0) {
        const primarySkill = opp.skills[0];
        let optionFound = false;
        Array.from(skillSelect.options).forEach(opt => {
            if (opt.value.toLowerCase() === primarySkill.toLowerCase()) {
                skillSelect.value = opt.value;
                optionFound = true;
            }
        });
        if (!optionFound) skillSelect.value = "all";
    }

    renderTalentList();
    showToast(`Showing verified matches for: ${opp.title}`);
};

// AI Extractor Presets
window.setAiSamplePrompt = function(preset) {
    const promptInput = document.getElementById("aiPromptInput");
    if (!promptInput) return;

    if (preset === "react") {
        promptInput.value = "Looking for a React developer who can work with Node.js, Git and REST APIs for a cloud simulation dashboard.";
    } else if (preset === "aiml") {
        promptInput.value = "Seeking an AI Systems Engineer with PyTorch, Python, Docker, and Machine Learning experience for high-throughput model inference.";
    } else if (preset === "cloud") {
        promptInput.value = "Hiring a Cloud Infrastructure Apprentice proficient in AWS, Docker, Kubernetes, and automated CI/CD pipelines.";
    }

    const extractBtn = document.getElementById("extractSkillsBtn");
    if (extractBtn) extractBtn.click();
};

function initAiExtractor() {
    const extractBtn = document.getElementById("extractSkillsBtn");
    const promptInput = document.getElementById("aiPromptInput");
    const resultsBox = document.getElementById("aiExtractedResults");
    const roleTag = document.getElementById("suggestedRoleTag");
    const tagsContainer = document.getElementById("extractedSkillsTags");
    const applyBtn = document.getElementById("applyExtractedToModalBtn");

    if (!extractBtn || !promptInput) return;

    let extractedData = null;

    extractBtn.addEventListener("click", () => {
        const text = promptInput.value.trim();
        if (!text) {
            promptInput.focus();
            return;
        }

        const skillLibrary = [
            "React", "JavaScript", "TypeScript", "Node.js", "Python", "PyTorch", "TensorFlow",
            "Docker", "AWS", "Kubernetes", "FastAPI", "SQL", "PostgreSQL", "Git", "REST APIs",
            "Machine Learning", "NLP", "Cybersecurity", "Cloud Architecture", "Data Engineering"
        ];

        const detected = [];
        skillLibrary.forEach(skill => {
            const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "i");
            if (regex.test(text)) {
                detected.push(skill);
            }
        });

        if (detected.length === 0) {
            detected.push("Problem Solving", "Software Engineering", "Core Stack");
        }

        let suggestedRole = "Full-Stack Software Engineer";
        if (detected.includes("PyTorch") || detected.includes("Machine Learning") || detected.includes("NLP")) {
            suggestedRole = "AI/ML Systems Engineer";
        } else if (detected.includes("AWS") || detected.includes("Docker") || detected.includes("Kubernetes")) {
            suggestedRole = "Cloud Infrastructure Specialist";
        } else if (detected.includes("React") || detected.includes("JavaScript")) {
            suggestedRole = "Frontend / Web Systems Engineer";
        }

        extractedData = {
            role: suggestedRole,
            skills: detected,
            prompt: text
        };

        if (roleTag) roleTag.textContent = suggestedRole;
        if (tagsContainer) {
            tagsContainer.innerHTML = detected.map(s => `<span class="badge badge-gold">✓ ${s}</span>`).join("");
        }

        if (resultsBox) resultsBox.classList.add("active");
        showToast("Extracted competencies successfully!");
    });

    if (applyBtn) {
        applyBtn.addEventListener("click", () => {
            if (!extractedData) return;
            const modal = document.getElementById("opportunityModal");
            const titleInput = document.getElementById("oppTitleInput");
            const skillsInput = document.getElementById("oppSkillsInput");
            const descInput = document.getElementById("oppDescInput");

            if (titleInput) titleInput.value = extractedData.role;
            if (skillsInput) skillsInput.value = extractedData.skills.join(", ");
            if (descInput) descInput.value = extractedData.prompt;

            if (modal) modal.classList.add("active");
        });
    }
}

// ==========================================================================
// 3. TALENT DISCOVERY & EXPLAINABLE MATCHING (REAL-TIME STUDENTS)
// ==========================================================================
function initTalentDiscovery() {
    renderTalentList();

    const skillFilter = document.getElementById("talentSkillFilter");
    const matchFilter = document.getElementById("talentMatchFilter");
    const statusFilter = document.getElementById("talentStatusFilter");

    [skillFilter, matchFilter, statusFilter].forEach(el => {
        if (el) el.addEventListener("change", renderTalentList);
    });

    const drawer = document.getElementById("explainMatchDrawer");
    const closeBtn = document.getElementById("closeDrawerBtn");
    const closeActionBtn = document.getElementById("drawerCloseActionBtn");

    const closeDrawer = () => { if (drawer) drawer.classList.remove("open"); };
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    if (closeActionBtn) closeActionBtn.addEventListener("click", closeDrawer);
}

function renderTalentList() {
    const grid = document.getElementById("mainTalentGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const skillVal = document.getElementById("talentSkillFilter")?.value || "all";
    const matchVal = parseInt(document.getElementById("talentMatchFilter")?.value || "0", 10) || 0;
    const statusVal = document.getElementById("talentStatusFilter")?.value || "all";
    const searchVal = document.getElementById("globalSearchInput")?.value.toLowerCase().trim() || "";

    let filtered = state.candidates.filter(c => {
        if (skillVal !== "all" && !c.skills.some(s => s.name.toLowerCase() === skillVal.toLowerCase())) return false;
        if (matchVal > 0 && c.matchRate < matchVal) return false;
        if (statusVal !== "all" && c.status !== statusVal) return false;
        if (searchVal) {
            const matchesName = c.name.toLowerCase().includes(searchVal);
            const matchesUniv = c.university.toLowerCase().includes(searchVal);
            const matchesSkills = c.skills.some(s => s.name.toLowerCase().includes(searchVal));
            if (!matchesName && !matchesUniv && !matchesSkills) return false;
        }
        return true;
    });

    const countLabel = document.getElementById("talentMatchCountLabel");
    if (countLabel) countLabel.textContent = `Showing ${filtered.length} verified candidate profiles from Firestore`;

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 40px; text-align: center;">
                <div style="font-size:32px;margin-bottom:10px;">🔍</div>
                <h3 style="font-size:16px;color:var(--deep-black);">No Matching Talent Found</h3>
                <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">${state.rawStudents.length === 0 ? "No student accounts found in Firestore. Students registered in the Student Portal will appear here live." : "Try adjusting your skill filter, search query, or match threshold."}</p>
            </div>
        `;
        return;
    }

    filtered.forEach(cand => {
        grid.appendChild(createTalentCard(cand));
    });
}

function getTalentActionButtons(cand) {
    if (cand.status === "Hired") {
        return `<span class="badge badge-success" style="padding: 6px 10px; font-size:11px; font-weight:700;">✓ Hired & Placed</span>`;
    }
    if (cand.status === "Interviewing") {
        return `<button class="btn-primary-action" style="padding: 6px 10px; font-size: 11px;" onclick="window.advanceCandidateStage('${cand.id}', 'Hired')">💼 Offer & Hire</button>`;
    }
    if (cand.status === "Shortlisted") {
        return `<button class="btn-secondary-action" style="padding: 6px 10px; font-size: 11px;" onclick="window.advanceCandidateStage('${cand.id}', 'Interviewing')">📅 Schedule Interview</button>`;
    }
    return `<button class="btn-shortlist-action" onclick="window.advanceCandidateStage('${cand.id}', 'Shortlisted')">Shortlist</button>`;
}

function createTalentCard(cand) {
    const card = document.createElement("div");
    card.className = "talent-card";
    card.innerHTML = `
        <div class="talent-card-top">
            <div class="talent-identity">
                <div class="talent-avatar">${cand.initials}</div>
                <div>
                    <h3 class="talent-name">${cand.name}</h3>
                    <div class="talent-college">${cand.university}</div>
                </div>
            </div>
            <span class="match-badge-pill">⚡ ${cand.matchRate}% Match</span>
        </div>

        <div class="match-progress-wrap">
            <div class="match-progress-label">
                <span>Skill Match Index</span>
                <span>${cand.matchRate}%</span>
            </div>
            <div class="match-progress-bar">
                <div class="match-progress-fill" style="width: ${cand.matchRate}%"></div>
            </div>
        </div>

        <div class="candidate-skill-breakdown">
            ${cand.skills.slice(0, 4).map(s => `
                <div class="skill-score-item">
                    <span class="skill-name">${s.name}</span>
                    <span class="score-val ${s.status === 'gap' ? 'warning' : ''}">${s.score} ${s.status === 'aligned' ? '✓' : '⚠'}</span>
                </div>
            `).join("")}
        </div>

        <div class="talent-evidence-row">
            <span>Verified: <strong>${cand.verifiedSkillsCount} Skills</strong></span>
            <span>Projects: <strong>${cand.projectsCount}</strong></span>
            <span>Internships: <strong>${cand.internshipsCount}</strong></span>
        </div>

        <div class="talent-card-actions">
            <button class="btn-explain-match" onclick="window.explainCandidateMatch('${cand.id}')">
                Why this candidate?
            </button>
            <button class="btn-explain-match" style="flex:0 0 auto;padding:0 10px;" onclick="window.viewSkillPassport('${cand.id}')" title="View Skill Passport">
                🎖️ Passport
            </button>
            ${getTalentActionButtons(cand)}
        </div>
    `;
    return card;
}

window.explainCandidateMatch = function(candidateId) {
    const cand = state.candidates.find(c => c.id === candidateId);
    if (!cand) return;

    const drawer = document.getElementById("explainMatchDrawer");
    const nameEl = document.getElementById("drawerCandidateName");
    const contentEl = document.getElementById("drawerContent");
    const shortlistBtn = document.getElementById("drawerShortlistBtn");

    if (nameEl) nameEl.textContent = `${cand.name} • Match Explanation`;

    if (contentEl) {
        contentEl.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                <div>
                    <h4 style="font-size:16px;font-weight:800;color:var(--deep-black);">${cand.name}</h4>
                    <p style="font-size:12px;color:var(--text-muted);">${cand.degree} • ${cand.university}</p>
                </div>
                <div class="match-badge-pill" style="font-size:14px;padding:6px 12px;">${cand.matchRate}% Match</div>
            </div>

            <p style="font-size:13px;color:var(--graphite);line-height:1.6;">${cand.summary}</p>

            <h4 style="font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--deep-black);margin-top:24px;">
                Side-by-Side Competency Comparison
            </h4>

            <div class="side-by-side-comparison">
                <div class="comp-row">
                    <span>Competency</span>
                    <span>Required</span>
                    <span>Candidate</span>
                </div>
                ${cand.skills.map(s => `
                    <div class="comp-row">
                        <strong>${s.name}</strong>
                        <span style="color:var(--text-muted);">${s.required}% min</span>
                        <strong style="color:${s.status === 'aligned' ? 'var(--success)' : 'var(--warning)'};">${s.score}% ${s.status === 'aligned' ? '✓' : '⚠'}</strong>
                    </div>
                `).join("")}
            </div>

            <div class="explain-summary-box">
                <strong>Strongest Alignment:</strong>
                <p>${cand.strongest.join(", ")}</p>
                <strong style="margin-top:8px;">Primary Competency Gap:</strong>
                <p>${cand.primaryGap}</p>
            </div>
        `;
    }

    if (shortlistBtn) {
        shortlistBtn.onclick = () => {
            window.advanceCandidateStage(cand.id, "Shortlisted");
            drawer.classList.remove("open");
        };
    }

    if (drawer) drawer.classList.add("open");
};

window.viewSkillPassport = function(candidateId) {
    const cand = state.candidates.find(c => c.id === candidateId);
    if (!cand) return;

    const modal = document.getElementById("skillPassportModal");
    const content = document.getElementById("passportModalContent");
    const shortlistBtn = document.getElementById("passportShortlistBtn");

    if (content) {
        content.innerHTML = `
            <div style="display:flex;align-items:center;gap:14px;padding-bottom:16px;border-bottom:1px solid var(--border);margin-bottom:18px;">
                <div class="talent-avatar" style="width:52px;height:52px;font-size:16px;">${cand.initials}</div>
                <div>
                    <h3 style="font-size:18px;font-weight:800;color:var(--deep-black);">${cand.name}</h3>
                    <div style="font-size:12px;color:var(--text-muted);">${cand.degree} • ${cand.university}</div>
                    <span class="badge badge-success" style="margin-top:4px;">✓ University Verified Competency</span>
                </div>
            </div>

            <h4 style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--deep-black);margin-bottom:10px;">
                Verified Competency Radar
            </h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;">
                ${cand.skills.map(s => `
                    <div style="padding:10px;background:var(--soft-grey);border-radius:4px;display:flex;justify-content:space-between;align-items:center;font-size:12px;">
                        <strong>${s.name}</strong>
                        <span style="color:var(--strategic-gold);font-weight:800;">${s.score}% / 100</span>
                    </div>
                `).join("")}
            </div>

            <h4 style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--deep-black);margin-bottom:10px;">
                Project & Real-World Evidence
            </h4>
            <div style="display:flex;flex-direction:column;gap:8px;">
                ${(cand.projects || []).map(p => `
                    <div style="padding:12px;border:1px solid var(--border);border-radius:4px;">
                        <strong style="font-size:13px;color:var(--deep-black);">${p.title}</strong>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Stack: ${p.tech}</div>
                    </div>
                `).join("")}
            </div>
        `;
    }

    if (shortlistBtn) {
        shortlistBtn.onclick = () => {
            window.advanceCandidateStage(cand.id, "Shortlisted");
            if (modal) modal.classList.remove("active");
        };
    }

    if (modal) modal.classList.add("active");
};

function initSkillPassportModal() {
    const modal = document.getElementById("skillPassportModal");
    const closeBtn = document.getElementById("closePassportModalBtn");
    const actionCloseBtn = document.getElementById("closePassportActionBtn");

    const closeModal = () => { if (modal) modal.classList.remove("active"); };
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (actionCloseBtn) actionCloseBtn.addEventListener("click", closeModal);
}

window.advanceCandidateStage = async function(candidateId, nextStage) {
    if (!state.currentUser) return;
    const cand = state.candidates.find(c => c.id === candidateId);
    const candName = cand ? cand.name : "Candidate";

    try {
        // 1. Update company pipeline
        await setDoc(doc(db, `companies/${state.currentUser.uid}/pipeline`, candidateId), {
            status: nextStage,
            candidateName: candName,
            updatedAt: serverTimestamp()
        }, { merge: true });

        // 2. Update canonical applications collection in Firestore
        try {
            const appsQuery = query(
                collection(db, "applications"),
                where("studentId", "==", candidateId)
            );
            const appSnaps = await getDocs(appsQuery);
            appSnaps.forEach(async (appDoc) => {
                await updateDoc(doc(db, "applications", appDoc.id), {
                    status: nextStage,
                    updatedAt: serverTimestamp()
                });

                // Also sync to student's local applications subcollection
                try {
                    await setDoc(doc(db, "students", candidateId, "applications", appDoc.id), {
                        status: nextStage,
                        updatedAt: serverTimestamp()
                    }, { merge: true });
                } catch (e) {}
            });
        } catch (appErr) {
            console.warn("Applications sync notice:", appErr);
        }

        if (nextStage === "Shortlisted") {
            await logActivity("⚡", "Candidate Shortlisted", `Shortlisted ${candName}`, "Shortlisted");
            showToast(`Shortlisted ${candName} for hiring pipeline!`);
        } else if (nextStage === "Interviewing") {
            await logActivity("📅", "Interview Scheduled", `Interview invitation queued for ${candName}`, "Interviewing");
            showToast(`Scheduled technical interview with ${candName}!`);
        } else if (nextStage === "Hired") {
            await logActivity("🎉", "Candidate Hired", `Placement confirmed for ${candName}!`, "Placement");
            showToast(`🎉 Congratulations! ${candName} is now hired & placed!`);
        }
    } catch (err) {
        console.error("Failed to update candidate pipeline stage:", err);
        showToast("Pipeline update error: " + err.message);
    }
};

window.shortlistCandidate = function(candidateId) {
    window.advanceCandidateStage(candidateId, "Shortlisted");
};

// ==========================================================================
// 4. SKILL INTELLIGENCE & DEMAND/SUPPLY (DYNAMIC FIRESTORE METRICS)
// ==========================================================================
function initSkillIntelligence() {
    renderSkillIntelligence();

    const select = document.getElementById("intelligenceSkillSelect");
    if (select) {
        select.addEventListener("change", (e) => {
            renderSkillGapAnalysis(e.target.value);
        });
    }
}

function renderSkillIntelligence() {
    renderDemandTrends();
    const select = document.getElementById("intelligenceSkillSelect");
    const selectedSkill = select ? select.value : "Python";
    renderSkillGapAnalysis(selectedSkill);
    renderInstitutionTalent();
}

function renderDemandTrends() {
    const container = document.getElementById("skillDemandTrendsList");
    if (!container) return;
    container.innerHTML = "";

    // Calculate real-time skill demand from posted opportunities
    const skillCounts = {};
    state.opportunities.forEach(opp => {
        (opp.skills || []).forEach(skill => {
            const normalized = skill.trim();
            skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
        });
    });

    const defaultSkills = ["Python", "React", "Cloud Computing", "AI/ML", "Docker", "Cybersecurity"];
    defaultSkills.forEach(s => {
        if (!skillCounts[s]) skillCounts[s] = 1;
    });

    const sortedSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    sortedSkills.forEach(([skillName, count]) => {
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "center";
        div.style.padding = "12px 14px";
        div.style.borderBottom = "1px solid var(--border)";
        div.innerHTML = `
            <span style="font-size:13px;font-weight:700;color:var(--deep-black);">${skillName}</span>
            <div style="display:flex;align-items:center;gap:12px;">
                <span class="badge badge-soft">${count > 1 ? 'High Demand' : 'Active Need'}</span>
                <strong style="font-size:13px;color:var(--strategic-gold);">${count} ${count === 1 ? 'Opening' : 'Openings'}</strong>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderSkillGapAnalysis(skillName) {
    const container = document.getElementById("demandSupplyGapResult");
    if (!container) return;

    // Count student talent possessing this skill
    let availableCount = 0;
    let advancedCount = 0;
    let intermediateCount = 0;
    let beginnerCount = 0;

    state.candidates.forEach(cand => {
        const found = cand.skills.find(s => s.name.toLowerCase().includes(skillName.toLowerCase()));
        if (found) {
            availableCount++;
            if (found.score >= 85) advancedCount++;
            else if (found.score >= 70) intermediateCount++;
            else beginnerCount++;
        }
    });

    // Count industry demand from active opportunities
    let demandCount = 0;
    state.opportunities.forEach(opp => {
        if ((opp.skills || []).some(s => s.toLowerCase().includes(skillName.toLowerCase()))) {
            demandCount += (opp.applicantsCount || 10) + 5;
        }
    });
    if (demandCount === 0) demandCount = Math.max(10, availableCount + 5);

    const gap = Math.max(0, demandCount - availableCount);
    const fillPercent = demandCount > 0 ? Math.min(100, Math.round((availableCount / demandCount) * 100)) : 100;

    container.innerHTML = `
        <div style="background:var(--soft-grey);border-radius:6px;padding:18px;border:1px solid var(--border);margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <strong style="font-size:14px;color:var(--deep-black);">${skillName} Talent Availability</strong>
                <span class="badge ${gap > 0 ? 'badge-gold' : 'badge-success'}">${gap > 0 ? `Gap: ${gap} Candidates` : 'Balanced Supply'}</span>
            </div>

            <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:12px;margin:12px 0;">
                <div style="background:var(--pure-white);padding:12px;border-radius:4px;border:1px solid var(--border);">
                    <small style="color:var(--text-muted);font-size:10px;text-transform:uppercase;font-weight:700;display:block;">Industry Requirement</small>
                    <strong style="font-size:20px;color:var(--deep-black);">${demandCount}</strong>
                </div>
                <div style="background:var(--pure-white);padding:12px;border-radius:4px;border:1px solid var(--border);">
                    <small style="color:var(--text-muted);font-size:10px;text-transform:uppercase;font-weight:700;display:block;">Verified Available Talent</small>
                    <strong style="font-size:20px;color:var(--strategic-gold);">${availableCount}</strong>
                </div>
            </div>

            <div style="margin:12px 0;">
                <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;margin-bottom:4px;">
                    <span style="color:var(--graphite);">Talent Pipeline Fulfillment</span>
                    <span style="color:var(--deep-black);">${fillPercent}% Fulfilled</span>
                </div>
                <div class="match-progress-bar" style="height:8px;">
                    <div class="match-progress-fill" style="width: ${fillPercent}%; background: ${fillPercent < 70 ? 'var(--warning)' : 'var(--strategic-gold)'};"></div>
                </div>
            </div>

            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--graphite);margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
                <span>Advanced: <strong>${advancedCount}</strong></span>
                <span>Intermediate: <strong>${intermediateCount}</strong></span>
                <span>Beginner: <strong>${beginnerCount}</strong></span>
            </div>
        </div>

        <button class="btn-primary-action" style="width:100%;justify-content:center;" onclick="switchSection('collaboration')">
            🤝 Launch Academic Bootcamp to Close ${skillName} Gap →
        </button>
    `;
}

function renderInstitutionTalent() {
    const tbody = document.getElementById("institutionTalentTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (state.institutions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);">
                    No academic institutions registered yet. Connect a college using the Academic Partners CRM.
                </td>
            </tr>
        `;
        return;
    }

    state.institutions.forEach(inst => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <strong>${inst.name}</strong>
                <div style="font-size:11px;color:var(--text-muted);">${inst.location}</div>
            </td>
            <td><strong>${inst.matchingStudents || 0} verified students</strong></td>
            <td><span class="badge badge-gold">${inst.avgSkill || "78%"}</span></td>
            <td>${(inst.strengths || []).map(s => `<span class="skill-tag">${s}</span>`).join("")}</td>
            <td>
                <button class="btn-secondary-action" onclick="window.partnerWithCollege('${inst.id}')">
                    Partner & Drive
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.partnerWithCollege = function(instId) {
    const inst = state.institutions.find(i => i.id === instId);
    if (!inst) return;

    const modal = document.getElementById("campusDriveModal");
    const titleEl = document.getElementById("campusDriveModalTitle");
    const instIdInput = document.getElementById("driveInstId");

    if (titleEl) titleEl.textContent = `Schedule Engagement with ${inst.name}`;
    if (instIdInput) instIdInput.value = inst.id;

    if (modal) modal.classList.add("active");
};

function initCampusDriveModal() {
    const modal = document.getElementById("campusDriveModal");
    const closeBtn = document.getElementById("closeCampusDriveModalBtn");
    const cancelBtn = document.getElementById("cancelCampusDriveModalBtn");
    const form = document.getElementById("campusDriveForm");

    const closeModal = () => { if (modal) modal.classList.remove("active"); };

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!state.currentUser) return;

            const instId = document.getElementById("driveInstId").value;
            const driveType = document.getElementById("driveTypeSelect").value;
            const driveDate = document.getElementById("driveDateInput").value;
            const driveRole = document.getElementById("driveRoleInput").value;
            const cohortSize = parseInt(document.getElementById("driveCohortInput").value, 10) || 50;
            const notes = document.getElementById("driveNotesInput").value;

            const inst = state.institutions.find(i => i.id === instId);
            const instName = inst ? inst.name : "Academic Partner";

            try {
                await addDoc(collection(db, `companies/${state.currentUser.uid}/campus_drives`), {
                    instId: instId,
                    instName: instName,
                    driveType: driveType,
                    driveDate: driveDate,
                    driveRole: driveRole,
                    cohortSize: cohortSize,
                    notes: notes,
                    status: "Scheduled",
                    createdAt: serverTimestamp()
                });

                await logActivity("🤝", driveType, `Scheduled with ${instName} for ${driveDate}`, "Campus Drive");
                closeModal();
                form.reset();
                showToast(`Engagement confirmed: ${driveType} with ${instName}!`);
            } catch (err) {
                console.error("Failed to schedule campus drive:", err);
                alert("Failed to schedule drive in Firestore: " + err.message);
            }
        });
    }
}

// ==========================================================================
// 5. LIVE PROJECTS & CHALLENGES (REAL-TIME FIRESTORE CRUD)
// ==========================================================================
function initLiveProjects() {
    renderLiveProjects();
    renderChallenges();

    const projBtn = document.getElementById("openCreateProjectBtn");
    const chalBtn = document.getElementById("openCreateChallengeBtn");
    const projModal = document.getElementById("projectModal");
    const chalModal = document.getElementById("challengeModal");
    const closeProjBtn = document.getElementById("closeProjModalBtn");
    const cancelProjBtn = document.getElementById("cancelProjModalBtn");
    const closeChalBtn = document.getElementById("closeChalModalBtn");
    const cancelChalBtn = document.getElementById("cancelChalModalBtn");
    const projForm = document.getElementById("projectForm");
    const chalForm = document.getElementById("challengeForm");

    const openProjModal = () => {
        const select = document.getElementById("projCollegeSelect");
        if (select) {
            if (state.institutions.length === 0) {
                select.innerHTML = `<option value="Open to All Partner Institutions">Open to All Partner Institutions</option>`;
            } else {
                select.innerHTML = state.institutions.map(i => `<option value="${i.name}">${i.name} (${i.location})</option>`).join("") +
                    `<option value="Open to All Partner Institutions">Open to All Partner Institutions</option>`;
            }
        }
        if (projModal) projModal.classList.add("active");
    };
    const closeProjModal = () => { if (projModal) projModal.classList.remove("active"); };
    const openChalModal = () => { if (chalModal) chalModal.classList.add("active"); };
    const closeChalModal = () => { if (chalModal) chalModal.classList.remove("active"); };

    if (projBtn) projBtn.addEventListener("click", openProjModal);
    if (closeProjBtn) closeProjBtn.addEventListener("click", closeProjModal);
    if (cancelProjBtn) cancelProjBtn.addEventListener("click", closeProjModal);

    if (chalBtn) chalBtn.addEventListener("click", openChalModal);
    if (closeChalBtn) closeChalBtn.addEventListener("click", closeChalModal);
    if (cancelChalBtn) cancelChalBtn.addEventListener("click", closeChalModal);

    if (projForm) {
        projForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!state.currentUser) return;

            const title = document.getElementById("projTitleInput").value.trim();
            const college = document.getElementById("projCollegeSelect").value;
            const duration = document.getElementById("projDurationInput").value.trim() || "8 weeks";
            const teamSize = document.getElementById("projTeamSizeInput").value.trim() || "3-4 Students";
            const skills = document.getElementById("projSkillsInput").value.split(",").map(s => s.trim()).filter(Boolean);
            const outcome = document.getElementById("projOutcomeInput").value.trim();

            const newProject = {
                title: title,
                skills: skills.length > 0 ? skills : ["Problem Solving", "Software Engineering"],
                duration: duration,
                teamSize: teamSize,
                outcome: outcome || "Production Prototype",
                assignedCollege: college,
                status: "In Progress",
                progress: 15,
                companyId: state.currentUser.uid,
                companyName: state.company.name,
                team: [],
                milestones: [
                    { id: "m1", title: "M1: Architecture Review & Technical Spec", status: "In Review", date: "Phase 1" },
                    { id: "m2", title: "M2: Core Module Implementation & API Build", status: "Pending", date: "Phase 2" },
                    { id: "m3", title: "M3: Production Verification & Milestone Defense", status: "Pending", date: "Phase 3" }
                ],
                createdAt: serverTimestamp()
            };

            try {
                await addDoc(collection(db, "projects"), newProject);
                await logActivity("🔬", "Live Project Posted", `Assigned: ${title} to ${college}`, "Project");
                closeProjModal();
                projForm.reset();
                showToast(`Published Live Project: ${title} assigned to ${college}!`);
            } catch (err) {
                console.error("Failed to save project:", err);
                alert("Failed to save project to Firestore: " + err.message);
            }
        });
    }

    if (chalForm) {
        chalForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!state.currentUser) return;

            const title = document.getElementById("chalTitleInput").value.trim();
            const skills = document.getElementById("chalSkillsInput").value.split(",").map(s => s.trim()).filter(Boolean);
            const deadline = document.getElementById("chalDeadlineInput").value.trim() || "Oct 2026";
            const problem = document.getElementById("chalProblemInput").value.trim();

            const newChallenge = {
                title: title,
                problem: problem,
                skills: skills.length > 0 ? skills : ["System Design", "Algorithm"],
                submissionsCount: 0,
                deadline: deadline,
                status: "Active",
                companyId: state.currentUser.uid,
                companyName: state.company.name,
                submissions: [],
                createdAt: serverTimestamp()
            };

            try {
                await addDoc(collection(db, "challenges"), newChallenge);
                await logActivity("🏆", "Challenge Launched", `New Challenge: ${title}`, "Hackathon");
                closeChalModal();
                chalForm.reset();
                showToast(`Launched Campus Challenge: ${title}!`);
            } catch (err) {
                console.error("Failed to save challenge:", err);
                alert("Failed to save challenge to Firestore: " + err.message);
            }
        });
    }
}

function renderLiveProjects() {
    const projContainer = document.getElementById("liveProjectsList");
    if (!projContainer) return;
    projContainer.innerHTML = "";

    if (state.liveProjects.length === 0) {
        projContainer.innerHTML = `
            <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 12px; background: var(--soft-grey); border-radius: 6px; border: 1px dashed var(--border);">
                No live projects sponsored yet. Click <strong>+ Post Industry Project</strong> to partner with a student engineering cohort.
            </div>
        `;
        return;
    }

    state.liveProjects.forEach(proj => {
        const card = document.createElement("div");
        card.style.background = "var(--soft-grey)";
        card.style.border = "1px solid var(--border)";
        card.style.borderRadius = "6px";
        card.style.padding = "18px";
        card.style.marginBottom = "14px";
        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                <div>
                    <strong style="font-size:14px;color:var(--deep-black);">${proj.title}</strong>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Assigned: <strong>${proj.assignedCollege}</strong> (${proj.teamSize})</div>
                </div>
                <span class="badge badge-gold">${proj.status}</span>
            </div>

            <div class="match-progress-wrap" style="margin:10px 0 12px;">
                <div class="match-progress-label">
                    <span>Milestone Execution</span>
                    <span>${proj.progress || 15}%</span>
                </div>
                <div class="match-progress-bar">
                    <div class="match-progress-fill" style="width: ${proj.progress || 15}%"></div>
                </div>
            </div>

            <div style="margin:8px 0;">
                ${(proj.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join("")}
            </div>

            <div style="font-size:11px;color:var(--graphite);margin-top:8px;line-height:1.5;">
                <strong>Expected Outcome:</strong> ${proj.outcome}
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:10px;border-top:1px solid var(--border);">
                <span style="font-size:11px;color:var(--text-muted);">Team: <strong>${(proj.team || []).length || 2} Students</strong></span>
                <button class="btn-view-job" onclick="window.viewProjectProgress('${proj.id}')">View Progress & Team →</button>
            </div>
        `;
        projContainer.appendChild(card);
    });
}

function renderChallenges() {
    const chalContainer = document.getElementById("industryChallengesList");
    if (!chalContainer) return;
    chalContainer.innerHTML = "";

    if (state.challenges.length === 0) {
        chalContainer.innerHTML = `
            <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 12px; background: var(--soft-grey); border-radius: 6px; border: 1px dashed var(--border);">
                No campus challenges posted yet. Click <strong>+ New Challenge</strong> to crowdsource problem solving across universities.
            </div>
        `;
        return;
    }

    state.challenges.forEach(chal => {
        const card = document.createElement("div");
        card.style.background = "var(--soft-grey)";
        card.style.border = "1px solid var(--border)";
        card.style.borderRadius = "6px";
        card.style.padding = "18px";
        card.style.marginBottom = "14px";
        card.innerHTML = `
            <strong style="font-size:14px;color:var(--deep-black);">${chal.title}</strong>
            <p style="font-size:12px;color:var(--graphite);margin:8px 0;line-height:1.5;">${chal.problem}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:11px;color:var(--text-muted);">
                <span>${chal.submissionsCount || 0} Student Submissions</span>
                <button class="btn-view-job" onclick="window.viewChallengeLeaderboard('${chal.id}')">Evaluate Solutions →</button>
            </div>
        `;
        chalContainer.appendChild(card);
    });
}

window.viewChallengeLeaderboard = function(challengeId) {
    const chal = state.challenges.find(c => c.id === challengeId) || state.challenges[0];
    if (!chal) return;

    const modal = document.getElementById("challengeLeaderboardModal");
    const titleEl = document.getElementById("leaderboardChallengeTitle");
    const content = document.getElementById("challengeLeaderboardContent");

    if (titleEl) titleEl.textContent = `Leaderboard: ${chal.title}`;

    if (content) {
        const subs = chal.submissions && chal.submissions.length > 0 ? chal.submissions : [];

        content.innerHTML = `
            <div style="background:var(--soft-grey);padding:14px;border-radius:6px;margin-bottom:16px;border:1px solid var(--border);">
                <div style="font-size:12px;color:var(--deep-black);font-weight:700;">Problem Benchmark:</div>
                <p style="font-size:12px;color:var(--graphite);margin-top:2px;">${chal.problem}</p>
                <div style="display:flex;gap:12px;margin-top:8px;font-size:11px;color:var(--text-muted);">
                    <span>Skills: <strong>${(chal.skills || []).join(", ")}</strong></span>
                    <span>Submissions: <strong>${chal.submissionsCount || subs.length}</strong></span>
                </div>
            </div>

            <h4 style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--deep-black);margin-bottom:10px;">
                Verified Student Submissions (Automated Benchmark Ranking)
            </h4>

            <div style="display:flex;flex-direction:column;gap:10px;">
                ${subs.length === 0 ? `
                    <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px;">
                        No submissions uploaded yet by students for this challenge.
                    </div>
                ` : subs.map(sub => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:var(--pure-white);border:1px solid var(--border);border-radius:6px;">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <strong style="font-size:16px;">${sub.rank ? sub.rank.split(" ")[0] : "🏅"}</strong>
                            <div>
                                <strong style="font-size:13px;color:var(--deep-black);">${sub.studentName}</strong>
                                <div style="font-size:11px;color:var(--text-muted);">${sub.college}</div>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:14px;">
                            <div style="text-align:right;">
                                <strong style="font-size:13px;color:var(--strategic-gold);">${sub.score} F1</strong>
                                <div style="font-size:10px;color:var(--text-muted);">${sub.latency} latency</div>
                            </div>
                            <button class="btn-primary-action" style="padding:6px 12px;font-size:11px;" onclick="window.shortlistChallengeWinner('${sub.studentName}')">
                                🎖️ Shortlist Candidate
                            </button>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
    }

    if (modal) modal.classList.add("active");
};

window.shortlistChallengeWinner = function(studentName) {
    const cand = state.candidates.find(c => c.name.toLowerCase() === studentName.toLowerCase());
    if (cand) {
        window.advanceCandidateStage(cand.id, "Shortlisted");
    } else {
        logActivity("🏆", "Challenge Winner Shortlisted", `Shortlisted ${studentName} from challenge leaderboard`, "Shortlisted");
        showToast(`Shortlisted ${studentName} for hiring pipeline!`);
    }
    const modal = document.getElementById("challengeLeaderboardModal");
    if (modal) modal.classList.remove("active");
};

function initChallengeLeaderboardModal() {
    const modal = document.getElementById("challengeLeaderboardModal");
    const closeBtn = document.getElementById("closeLeaderboardModalBtn");
    const closeActionBtn = document.getElementById("closeLeaderboardActionBtn");

    const closeModal = () => { if (modal) modal.classList.remove("active"); };
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (closeActionBtn) closeActionBtn.addEventListener("click", closeModal);
}

window.viewProjectProgress = function(projectId) {
    const proj = state.liveProjects.find(p => p.id === projectId);
    if (!proj) return;

    const modal = document.getElementById("projectProgressModal");
    const titleEl = document.getElementById("progressProjectTitle");
    const content = document.getElementById("projectProgressModalContent");
    const approveBtn = document.getElementById("progressApproveMilestoneBtn");
    const evalBtn = document.getElementById("progressEvaluateTeamBtn");

    if (titleEl) titleEl.textContent = proj.title;

    if (content) {
        const teamList = proj.team && proj.team.length > 0 ? proj.team : state.candidates.slice(0, 2);
        const milestones = proj.milestones || [
            { id: "m1", title: "M1: Phase 1 Deliverable", status: "Completed", date: "Phase 1" },
            { id: "m2", title: "M2: Phase 2 Deliverable", status: "In Review", date: "Phase 2" }
        ];

        content.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border);margin-bottom:16px;">
                <div>
                    <span style="font-size:12px;color:var(--text-muted);">Institution: <strong>${proj.assignedCollege}</strong></span>
                    <div style="font-size:12px;color:var(--graphite);margin-top:2px;">Duration: ${proj.duration} • Team Size: ${proj.teamSize}</div>
                </div>
                <span class="badge badge-gold">${proj.status}</span>
            </div>

            <div style="background:var(--soft-grey);padding:14px;border-radius:6px;margin-bottom:18px;border:1px solid var(--border);">
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:700;margin-bottom:8px;">
                    <span style="color:var(--deep-black);">Overall Completion Rate</span>
                    <span style="color:var(--strategic-gold);font-weight:800;">${proj.progress || 15}%</span>
                </div>
                <div class="match-progress-bar" style="height:8px;">
                    <div class="match-progress-fill" style="width: ${proj.progress || 15}%"></div>
                </div>
            </div>

            <h4 style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--deep-black);margin-bottom:10px;">
                Milestone Deliverables & Timeline
            </h4>
            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
                ${milestones.map((m) => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--pure-white);border:1px solid var(--border);border-radius:4px;">
                        <div>
                            <strong style="font-size:12px;color:var(--deep-black);">${m.title}</strong>
                            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Target: ${m.date || "Scheduled"}</div>
                        </div>
                        <span class="badge ${m.status === 'Completed' ? 'badge-success' : (m.status === 'In Review' ? 'badge-gold' : 'badge-soft')}">
                            ${m.status === 'Completed' ? '✓ Completed' : (m.status === 'In Review' ? '⚡ In Review' : '⏳ Pending')}
                        </span>
                    </div>
                `).join("")}
            </div>

            <h4 style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--deep-black);margin-bottom:10px;">
                Assigned Student Engineering Team
            </h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:10px;margin-bottom:16px;">
                ${teamList.length === 0 ? '<p style="font-size:12px;color:var(--text-muted);">No student team members assigned yet.</p>' : teamList.map(member => `
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid var(--border);border-radius:4px;background:var(--pure-white);">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div class="talent-avatar" style="width:34px;height:34px;font-size:11px;">${member.initials || 'ST'}</div>
                            <div>
                                <strong style="font-size:12px;color:var(--deep-black);display:block;">${member.name}</strong>
                                <small style="font-size:11px;color:var(--text-muted);">${member.role || "Developer"}</small>
                            </div>
                        </div>
                        <button class="btn-explain-match" style="padding:4px 8px;font-size:11px;" onclick="window.viewSkillPassport('${member.id || 'cand-1'}')">
                            Passport 🎖️
                        </button>
                    </div>
                `).join("")}
            </div>
        `;
    }

    if (approveBtn) {
        approveBtn.onclick = async () => {
            if (!proj.milestones || proj.milestones.length === 0) return;
            const inReview = proj.milestones.find(m => m.status === "In Review");
            const pending = proj.milestones.find(m => m.status === "Pending");

            let newProgress = proj.progress || 15;
            let updatedMilestones = [...proj.milestones];

            if (inReview) {
                inReview.status = "Completed";
                newProgress = Math.min(100, newProgress + 30);
                if (pending) pending.status = "In Review";
            } else if (pending) {
                pending.status = "Completed";
                newProgress = Math.min(100, newProgress + 30);
            }

            try {
                await updateDoc(doc(db, "projects", proj.id), {
                    milestones: updatedMilestones,
                    progress: newProgress,
                    status: newProgress >= 100 ? "Completed" : "In Progress",
                    updatedAt: serverTimestamp()
                });
                await logActivity("🚀", "Project Milestone Approved", `Approved milestone on ${proj.title}`, "Milestone");
                showToast("Milestone approved and updated in Firestore!");
                if (modal) modal.classList.remove("active");
            } catch (err) {
                console.error("Failed to approve milestone:", err);
                showToast("Failed to update milestone: " + err.message);
            }
        };
    }

    if (evalBtn) {
        evalBtn.onclick = () => {
            if (modal) modal.classList.remove("active");
            const evalModal = document.getElementById("evaluateModal");
            const evalContext = document.getElementById("evalContext");
            if (evalContext) evalContext.value = `Live Project: ${proj.title}`;
            if (evalModal) evalModal.classList.add("active");
        };
    }

    if (modal) modal.classList.add("active");
};

function initProjectProgressModal() {
    const modal = document.getElementById("projectProgressModal");
    const closeBtn = document.getElementById("closeProgressModalBtn");
    const closeActionBtn = document.getElementById("closeProgressActionBtn");

    const closeModal = () => { if (modal) modal.classList.remove("active"); };
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (closeActionBtn) closeActionBtn.addEventListener("click", closeModal);
}

// ==========================================================================
// 6. ACADEMIC PARTNERS CRM (REAL-TIME FIRESTORE CRUD)
// ==========================================================================
function initAcademicPartners() {
    renderAcademicPartners();

    const addPartnerBtn = document.getElementById("openAddPartnerBtn");
    const partnerModal = document.getElementById("partnerModal");
    const closePartnerBtn = document.getElementById("closePartnerModalBtn");
    const cancelPartnerBtn = document.getElementById("cancelPartnerModalBtn");
    const partnerForm = document.getElementById("partnerForm");

    const openPartnerModal = () => { if (partnerModal) partnerModal.classList.add("active"); };
    const closePartnerModal = () => { if (partnerModal) partnerModal.classList.remove("active"); };

    if (addPartnerBtn) addPartnerBtn.addEventListener("click", openPartnerModal);
    if (closePartnerBtn) closePartnerBtn.addEventListener("click", closePartnerModal);
    if (cancelPartnerBtn) cancelPartnerBtn.addEventListener("click", closePartnerModal);

    if (partnerForm) {
        partnerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!state.currentUser) return;

            const name = document.getElementById("partnerNameInput").value.trim();
            const location = document.getElementById("partnerLocationInput").value.trim();
            const relationship = document.getElementById("partnerRelationshipSelect").value;
            const students = parseInt(document.getElementById("partnerEstStudentsInput").value, 10) || 50;
            const strengths = document.getElementById("partnerStrengthsInput").value.split(",").map(s => s.trim()).filter(Boolean);

            const newPartner = {
                name: name,
                location: location,
                relationship: relationship,
                studentsEngaged: 0,
                projects: 0,
                internships: 0,
                workshops: 0,
                strengths: strengths.length > 0 ? strengths : ["Computer Science", "Software Systems"],
                matchingStudents: students,
                avgSkill: "78%",
                companyId: state.currentUser.uid,
                createdAt: serverTimestamp()
            };

            try {
                await addDoc(collection(db, `companies/${state.currentUser.uid}/academic_partners`), newPartner);
                await logActivity("🤝", "New Academic Partner", `Connected ${name} (${location})`, "Partnership");
                closePartnerModal();
                partnerForm.reset();
                showToast(`Connected ${name} (${location}) to Academic Partners!`);
            } catch (err) {
                console.error("Failed to connect partner:", err);
                alert("Failed to save partner to Firestore: " + err.message);
            }
        });
    }
}

function renderAcademicPartners() {
    const grid = document.getElementById("academicPartnersGrid");
    if (!grid) return;
    grid.innerHTML = "";

    if (state.institutions.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 32px; text-align: center; color: var(--text-muted); font-size: 12px; background: var(--soft-grey); border-radius: 6px; border: 1px dashed var(--border);">
                No academic partners connected yet. Click <strong>+ Connect New College</strong> to establish university partnerships.
            </div>
        `;
        return;
    }

    state.institutions.forEach(inst => {
        const card = document.createElement("div");
        card.className = "partner-card";
        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
                <div>
                    <h3 style="font-size:15px;font-weight:800;color:var(--deep-black);">${inst.name}</h3>
                    <span style="font-size:11px;color:var(--text-muted);">${inst.location}</span>
                </div>
                <span class="badge badge-gold">${inst.relationship}</span>
            </div>

            <div class="partner-metrics-grid">
                <div class="partner-metric-item">
                    <small>Students Engaged</small>
                    <strong>${inst.studentsEngaged || 0}</strong>
                </div>
                <div class="partner-metric-item">
                    <small>Active Internships</small>
                    <strong>${inst.internships || 0}</strong>
                </div>
                <div class="partner-metric-item">
                    <small>Live Projects</small>
                    <strong>${inst.projects || 0}</strong>
                </div>
                <div class="partner-metric-item">
                    <small>Workshops & Talks</small>
                    <strong>${inst.workshops || 0}</strong>
                </div>
            </div>

            <div style="margin:12px 0;">
                <small style="font-size:10px;color:var(--text-muted);text-transform:uppercase;font-weight:700;display:block;margin-bottom:6px;">Institutional Talent Potential</small>
                ${(inst.strengths || []).map(s => `<span class="skill-tag">${s}</span>`).join("")}
            </div>

            <button class="btn-secondary-action" style="width:100%;justify-content:center;margin-top:10px;" onclick="window.partnerWithCollege('${inst.id}')">
                Schedule Campus Drive / Workshop →
            </button>
        `;
        grid.appendChild(card);
    });
}

// ==========================================================================
// 7. COMPANY PROFILE (SKILL DNA) FIRESTORE SYNC
// ==========================================================================
function initCompanyProfile() {
    const form = document.getElementById("companyDnaForm");
    if (!form) return;

    ['dnaCompanyName', 'dnaSector', 'dnaExpertise', 'dnaTech'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", () => {
                el.dataset.userModified = "true";
            });
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!state.currentUser) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Saving to Firestore...";
        }

        const name = document.getElementById("dnaCompanyName").value.trim();
        const sector = document.getElementById("dnaSector").value.trim();
        const expertise = document.getElementById("dnaExpertise").value.split(",").map(s => s.trim()).filter(Boolean);
        const tech = document.getElementById("dnaTech").value.split(",").map(s => s.trim()).filter(Boolean);

        const interests = [];
        document.querySelectorAll('#companyDnaForm input[name="interest"]:checked').forEach(cb => {
            interests.push(cb.value);
        });

        try {
            await setDoc(doc(db, "users", state.currentUser.uid), {
                name: name,
                companyName: name,
                sector: sector,
                expertise: expertise,
                tech: tech,
                interests: interests,
                updatedAt: serverTimestamp()
            }, { merge: true });

            try {
                await updateProfile(state.currentUser, { displayName: name });
            } catch (err) {
                console.warn("Auth displayName update error:", err);
            }

            state.company.name = name;
            state.company.sector = sector;
            state.company.expertise = expertise;
            state.company.tech = tech;
            state.company.interests = interests;

            updateCompanyUI();
            recalculateTalentMatches();

            await logActivity("🏢", "Skill DNA Updated", `${name} profile and tech stack synchronized`, "Company");
            showToast("Company Skill DNA saved successfully to Firestore!");
        } catch (error) {
            console.error("Failed to update company profile:", error);
            alert("Failed to save profile: " + error.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Save Industry Skill DNA";
            }
        }
    });
}

// ==========================================================================
// 8. INDUSTRY EVALUATION MODAL (FIRESTORE REAL-TIME AUDIT)
// ==========================================================================
function initEvaluationModal() {
    const openBtn = document.getElementById("openEvaluateModalBtn");
    const modal = document.getElementById("evaluateModal");
    const closeBtn = document.getElementById("closeEvaluateModalBtn");
    const cancelBtn = document.getElementById("cancelEvaluateModalBtn");
    const studentSelect = document.getElementById("evalStudentSelect");
    const form = document.getElementById("evaluationForm");

    const openModal = () => {
        if (studentSelect) {
            if (state.candidates.length === 0) {
                studentSelect.innerHTML = `<option value="">No registered students found</option>`;
            } else {
                studentSelect.innerHTML = state.candidates.map(c => `<option value="${c.id}">${c.name} (${c.university})</option>`).join("");
            }
        }
        if (modal) modal.classList.add("active");
    };

    const closeModal = () => { if (modal) modal.classList.remove("active"); };

    if (openBtn) openBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    const sliders = [
        { id: "sliderTech", valId: "valTechScore" },
        { id: "sliderProblem", valId: "valProblemScore" },
        { id: "sliderTeam", valId: "valTeamScore" },
        { id: "sliderProf", valId: "valProfScore" }
    ];

    sliders.forEach(s => {
        const sliderEl = document.getElementById(s.id);
        const valEl = document.getElementById(s.valId);
        if (sliderEl && valEl) {
            sliderEl.addEventListener("input", (e) => {
                valEl.textContent = `${parseFloat(e.target.value).toFixed(1)} / 5.0`;
            });
        }
    });

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!state.currentUser) return;

            const studentId = studentSelect?.value;
            if (!studentId) {
                alert("Please select a student to evaluate.");
                return;
            }

            const cand = state.candidates.find(c => c.id === studentId);
            const candName = cand ? cand.name : "Student";
            const context = document.getElementById("evalContext")?.value || "Internship / Project";
            const remarks = document.getElementById("evalRemarks")?.value || "";

            const techScore = parseFloat(document.getElementById("sliderTech")?.value || "4.5");
            const problemScore = parseFloat(document.getElementById("sliderProblem")?.value || "4.0");
            const teamScore = parseFloat(document.getElementById("sliderTeam")?.value || "4.5");
            const profScore = parseFloat(document.getElementById("sliderProf")?.value || "4.5");

            try {
                const overallScoreAvg = ((techScore + problemScore + teamScore + profScore) / 4).toFixed(1);
                const overallPercentage = Math.round(((techScore + problemScore + teamScore + profScore) / 20) * 100);
                const companyName = state.company?.name || state.currentUser.displayName || "Industry Partner";
                const primarySkill = (cand && cand.skills && cand.skills.length > 0) ? cand.skills[0].name : "Software Engineering";

                // 1. Record evaluation in canonical "evaluations" collection
                const evalDocRef = await addDoc(collection(db, "evaluations"), {
                    studentId: studentId,
                    studentName: candName,
                    companyId: state.currentUser.uid,
                    companyName: companyName,
                    context: context,
                    techScore: techScore,
                    problemScore: problemScore,
                    teamScore: teamScore,
                    profScore: profScore,
                    overallScore: overallScoreAvg,
                    overallPercentage: overallPercentage,
                    verifiedSkills: [primarySkill, "Problem Solving"],
                    remarks: remarks,
                    evaluatedAt: serverTimestamp(),
                    createdAt: serverTimestamp()
                });

                // Also record in company evaluations subcollection
                await addDoc(collection(db, `companies/${state.currentUser.uid}/evaluations`), {
                    studentId: studentId,
                    studentName: candName,
                    context: context,
                    techScore: techScore,
                    problemScore: problemScore,
                    teamScore: teamScore,
                    profScore: profScore,
                    overallScore: overallScoreAvg,
                    remarks: remarks,
                    createdAt: serverTimestamp()
                });

                // 2. Record Verified Skill in canonical "verified_skills" collection (Provenance)
                await addDoc(collection(db, "verified_skills"), {
                    studentId: studentId,
                    studentName: candName,
                    skill: primarySkill,
                    score: overallPercentage,
                    companyId: state.currentUser.uid,
                    companyName: companyName,
                    evaluationId: evalDocRef.id,
                    context: context,
                    verificationStatus: "Verified",
                    verifiedAt: serverTimestamp()
                });

                // 3. Update student profile in users and students collections
                const studentUpdate = {
                    [`skillsVerified.${primarySkill}`]: {
                        score: overallPercentage,
                        companyName: companyName,
                        evaluationId: evalDocRef.id,
                        verifiedAt: new Date().toISOString(),
                        verificationStatus: "Verified"
                    },
                    [`skills.${primarySkill}`]: Math.max(overallPercentage, 85),
                    readiness: Math.min(overallPercentage + 2, 98)
                };

                try {
                    await updateDoc(doc(db, "users", studentId), studentUpdate);
                    await updateDoc(doc(db, "students", studentId), studentUpdate);
                } catch (userErr) {
                    console.warn("Notice: student profile update fallback", userErr);
                }

                // 4. Update canonical applications collection
                try {
                    const appsQuery = query(
                        collection(db, "applications"),
                        where("studentId", "==", studentId)
                    );
                    const appSnaps = await getDocs(appsQuery);
                    appSnaps.forEach(async (appDoc) => {
                        await updateDoc(doc(db, "applications", appDoc.id), {
                            status: "Evaluated",
                            evaluationScore: overallPercentage,
                            evaluationId: evalDocRef.id,
                            updatedAt: serverTimestamp()
                        });
                    });
                } catch (appErr) {}

                // 5. Update candidate pipeline status
                await setDoc(doc(db, `companies/${state.currentUser.uid}/pipeline`, studentId), {
                    status: "Evaluated",
                    evaluationScore: overallScoreAvg,
                    evaluationPercentage: overallPercentage,
                    updatedAt: serverTimestamp()
                }, { merge: true });

                await logActivity("⭐", "Verified Competency Evaluation", `Recorded ratings for ${candName} (${context})`, "Evaluation");
                closeModal();
                form.reset();
                showToast(`Verified Competency Evidence recorded for ${candName}!`);
            } catch (err) {
                console.error("Failed to save evaluation:", err);
                alert("Failed to save evaluation to Firestore: " + err.message);
            }
        });
    }
}

// ==========================================================================
// 9. GLOBAL SEARCH & MODAL BACKDROPS
// ==========================================================================
function initGlobalSearch() {
    const searchInput = document.getElementById("globalSearchInput");
    if (!searchInput) return;

    searchInput.addEventListener("input", () => {
        renderTalentList();
    });
}

function initModalBackdropListeners() {
    const modals = [
        document.getElementById("opportunityModal"),
        document.getElementById("evaluateModal"),
        document.getElementById("skillPassportModal"),
        document.getElementById("projectModal"),
        document.getElementById("challengeModal"),
        document.getElementById("partnerModal"),
        document.getElementById("projectProgressModal"),
        document.getElementById("challengeLeaderboardModal"),
        document.getElementById("campusDriveModal")
    ];

    modals.forEach(m => {
        if (m) {
            m.addEventListener("click", (e) => {
                if (e.target === m) m.classList.remove("active");
            });
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            modals.forEach(m => { if (m) m.classList.remove("active"); });
            const drawer = document.getElementById("explainMatchDrawer");
            if (drawer) drawer.classList.remove("open");
        }
    });
}

// ==========================================================================
// 10. MOBILE MENU TOGGLE
// ==========================================================================
function initMobileMenu() {
    const toggle = document.getElementById("mobileToggle");
    const sidebar = document.getElementById("sidebar");

    if (toggle && sidebar) {
        toggle.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }
}

// ==========================================================================
// ROLE ROUTING UTILITY
// ==========================================================================
function redirectWrongRole(role) {
    switch (role) {
        case "student":
            window.location.href = "../student/student-home.html";
            break;
        case "academician":
            window.location.href = "../academician/academician-home.html";
            break;
        case "institution":
            window.location.href = "../institution/institution-home.html";
            break;
        default:
            window.location.href = "../login.html";
    }
}
