// =====================================================
// SKILLBRIDGE - INSTITUTION DASHBOARD JS
// Real-Time Industry Demand, Cohort Skill Gap Analysis & Placement Outcomes
// Connected to Cloud Firestore
// =====================================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// =====================================================
// STATE STORE
// =====================================================
let currentUser = null;
let currentProfile = {
    name: "Institution Administrator",
    fullName: "Indian Institute of Information Technology",
    email: "",
    role: "institution",
    designation: "Dean of Industry Partnerships & Training",
    department: "Computer Science & Engineering",
    institution: "IIIT",
    bio: "Institution Portal for Industry Demand Analysis, Curriculum Skill Gap Bridging, Student Placement Outcomes, and Collaborative Programs.",
    qualifications: [],
    expertise: ["Curriculum Engineering", "Industry-Academia Partnerships"],
    researchInterests: [],
    publications: []
};

let opportunities = [];
let applications = [];
let studentsList = [];
let liveProjects = [];
let liveChallenges = [];
let skillGapAnalysis = [];

// =====================================================
// INIT & FIREBASE AUTH SYNC
// =====================================================
document.addEventListener("DOMContentLoaded", async () => {
    initSidebarNavigation();
    initModals();
    initFilters();

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    currentProfile = {
                        ...currentProfile,
                        ...userData,
                        name: userData.institutionName || userData.fullName || userData.name || "Institution Partner",
                        email: user.email,
                        role: userData.role || currentProfile.role
                    };
                } else {
                    currentProfile.name = user.displayName || "Institution Partner";
                    currentProfile.email = user.email;
                }

                await syncAllFirestoreData();
            } catch (err) {
                console.warn("Institution Firestore sync notice:", err);
            }
        } else {
            // Demo fallback for instant presentation preview
            await syncAllFirestoreData();
        }
        updateUserUI();
        renderAll();
    });

    // Logout Handler
    const logoutBtn = document.getElementById("logoutButton");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await signOut(auth);
            } catch (e) {}
            window.location.href = "../login.html";
        });
    }

    // Sidebar Mobile Toggle
    const menuBtn = document.getElementById("menuButton");
    const sidebar = document.getElementById("sidebar");
    if (menuBtn && sidebar) {
        menuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }
});

// =====================================================
// DATA SYNC & SKILL GAP ENGINE
// =====================================================
async function syncAllFirestoreData() {
    try {
        // 1. Opportunities
        const oppsSnap = await getDocs(collection(db, "opportunities"));
        const opps = [];
        oppsSnap.forEach(d => opps.push({ id: d.id, ...d.data() }));
        opportunities = opps;

        // 2. Applications
        const appsSnap = await getDocs(collection(db, "applications"));
        const apps = [];
        appsSnap.forEach(d => apps.push({ id: d.id, ...d.data() }));
        applications = apps;

        // 3. Students Cohort
        const studentsQuery = query(collection(db, "users"), where("role", "==", "student"));
        const studentsSnap = await getDocs(studentsQuery);
        const students = [];
        studentsSnap.forEach(d => students.push({ id: d.id, ...d.data() }));
        studentsList = students;

        // 4. Projects & Challenges
        const projSnap = await getDocs(collection(db, "projects"));
        const projs = [];
        projSnap.forEach(d => projs.push({ id: d.id, ...d.data() }));
        liveProjects = projs;

        const chalSnap = await getDocs(collection(db, "challenges"));
        const chals = [];
        chalSnap.forEach(d => chals.push({ id: d.id, ...d.data() }));
        liveChallenges = chals;

    } catch (e) {
        console.warn("Notice: Syncing with default dataset", e);
    }

    // Ensure fallback demo items if DB is fresh
    if (opportunities.length === 0) {
        opportunities = [
            {
                id: "opp_inst_1",
                title: "Full-Stack Software Engineer (Apprentice)",
                organization: "HyperScale Tech Labs",
                companyName: "HyperScale Tech Labs",
                type: "internship",
                mode: "Hybrid",
                duration: "6 Months",
                stipend: "₹35,000 / month",
                domain: "Software Engineering",
                skills: ["React", "Node.js", "Firebase", "TypeScript"],
                description: "Industry internship for top student talent in modern web systems."
            },
            {
                id: "opp_inst_2",
                title: "AI Systems Faculty Development Program (FDP)",
                organization: "National AI Council & TechCorp",
                type: "fdp",
                mode: "Online",
                duration: "2 Weeks",
                stipend: "Sponsored",
                domain: "Artificial Intelligence",
                skills: ["Python", "PyTorch", "Deep Learning"],
                description: "Faculty training on enterprise LLM deployment and modern neural architecture."
            },
            {
                id: "opp_inst_3",
                title: "Cloud Native DevOps Immersion",
                organization: "Apex Cloud Networks",
                type: "training",
                mode: "Hybrid",
                duration: "4 Weeks",
                stipend: "Free for Partner Institutions",
                domain: "Cloud & DevOps",
                skills: ["Cloud", "Docker", "Kubernetes"],
                description: "Campus-wide technical immersion on microservices and cloud infrastructure."
            }
        ];
    }

    if (studentsList.length === 0) {
        studentsList = [
            { id: "s1", name: "Priya Sharma", university: "IIIT", degree: "B.Tech CSE", readiness: 88, skills: { React: 90, "Node.js": 84, Cloud: 55, Python: 78 } },
            { id: "s2", name: "Rahul Verma", university: "IIIT", degree: "B.Tech CSE", readiness: 82, skills: { React: 85, Python: 88, SQL: 80, Docker: 45 } },
            { id: "s3", name: "Aman Gupta", university: "IIIT", degree: "B.Tech IT", readiness: 79, skills: { "Node.js": 80, JavaScript: 85, Cloud: 40 } },
            { id: "s4", name: "Ananya Iyer", university: "IIIT", degree: "B.Tech CSE", readiness: 91, skills: { Python: 92, PyTorch: 88, MachineLearning: 85 } }
        ];
    }

    computeSkillGapAnalysis();
}

/**
 * Computes canonical Skill Gaps between Industry Demand and Student Cohort Readiness
 */
function computeSkillGapAnalysis() {
    const demandCount = {};
    let totalDemandPointers = 0;

    // Aggregate required skills across all opportunities and projects
    opportunities.forEach(o => {
        const sks = o.skills || [];
        sks.forEach(s => {
            demandCount[s] = (demandCount[s] || 0) + 1;
            totalDemandPointers++;
        });
    });

    liveProjects.forEach(p => {
        const sks = p.skillsRequired || [];
        sks.forEach(s => {
            demandCount[s] = (demandCount[s] || 0) + 1;
            totalDemandPointers++;
        });
    });

    // Default key skills if demand count is small
    const keySkills = ["React", "Node.js", "Python", "Cloud", "Docker", "Problem Solving", "SQL", "Machine Learning"];
    keySkills.forEach(k => {
        if (!demandCount[k]) demandCount[k] = 2;
    });

    const gaps = [];

    Object.keys(demandCount).forEach(skillName => {
        // Compute average student score in this skill
        let totalStudentScore = 0;
        let studentsHavingScore = 0;

        studentsList.forEach(st => {
            const score = st.skills ? (st.skills[skillName] || 0) : 0;
            if (score > 0) {
                totalStudentScore += score;
                studentsHavingScore++;
            }
        });

        const cohortAverage = studentsHavingScore > 0 
            ? Math.round(totalStudentScore / studentsHavingScore) 
            : 45;

        const industryTarget = 85; // Industry benchmark
        const gapValue = Math.max(0, industryTarget - cohortAverage);

        let recommendation = "Curriculum Aligned";
        let priority = "Low";

        if (gapValue >= 35) {
            recommendation = "Host Intensive Industry Bootcamp";
            priority = "Critical";
        } else if (gapValue >= 20) {
            recommendation = "Schedule Expert Guest Lectures & Lab Assignments";
            priority = "High";
        } else if (gapValue >= 10) {
            recommendation = "Add Practical Capstone Project";
            priority = "Medium";
        }

        gaps.push({
            skill: skillName,
            industryTarget: industryTarget,
            cohortProficiency: cohortAverage,
            gap: gapValue,
            priority: priority,
            recommendation: recommendation,
            industryDemandRank: demandCount[skillName]
        });
    });

    // Sort by largest gap first
    gaps.sort((a, b) => b.gap - a.gap);
    skillGapAnalysis = gaps;
}

// =====================================================
// UI RENDERERS
// =====================================================
function updateUserUI() {
    const name = currentProfile.fullName || currentProfile.name || "Institution";
    const initial = name.charAt(0).toUpperCase();

    const welcomeEl = document.getElementById("welcomeName");
    if (welcomeEl) welcomeEl.textContent = name;

    const topNameEl = document.getElementById("topName");
    if (topNameEl) topNameEl.textContent = name;

    const topInitEl = document.getElementById("topInitial");
    if (topInitEl) topInitEl.textContent = initial;

    const topRoleEl = document.getElementById("topRole");
    if (topRoleEl) topRoleEl.textContent = currentProfile.designation || "Institution Portal";

    const instDeptEl = document.getElementById("profileDeptText");
    if (instDeptEl) instDeptEl.textContent = `${currentProfile.department} · ${currentProfile.institution}`;

    const profileNameEl = document.getElementById("profCardName");
    if (profileNameEl) profileNameEl.textContent = name;

    const profileBioEl = document.getElementById("profCardBio");
    if (profileBioEl) profileBioEl.textContent = currentProfile.bio;
}

function renderAll() {
    renderStats();
    renderSkillGapMatrix();
    renderOpportunityCards();
    renderApplicationsTable();
    renderCohortTable();
}

function renderStats() {
    const totalOpps = opportunities.length;
    const activeApps = applications.length;
    const hiredApps = applications.filter(a => a.status === "Hired" || a.status === "Selected").length;
    
    // Compute cohort average readiness
    const avgReadiness = studentsList.length > 0 
        ? Math.round(studentsList.reduce((acc, s) => acc + (s.readiness || 75), 0) / studentsList.length)
        : 82;

    const s1 = document.getElementById("statTotalOpps");
    if (s1) s1.textContent = totalOpps;

    const s2 = document.getElementById("statActiveApps");
    if (s2) s2.textContent = activeApps;

    const s3 = document.getElementById("statAccepted");
    if (s3) s3.textContent = hiredApps;

    const s4 = document.getElementById("statPubs");
    if (s4) s4.textContent = `${avgReadiness}%`;

    const s4Label = document.getElementById("statPubsLabel");
    if (s4Label) s4Label.textContent = "Cohort Avg Readiness";

    const oppCountEl = document.getElementById("navOppCount");
    if (oppCountEl) oppCountEl.textContent = totalOpps;

    const appCountEl = document.getElementById("navAppCount");
    if (appCountEl) appCountEl.textContent = activeApps;
}

function renderSkillGapMatrix() {
    const container = document.getElementById("skillGapContainer");
    if (!container) return;

    container.innerHTML = `
        <div style="background:var(--white); border:1px solid var(--grey-200); border-radius:12px; padding:20px; margin-bottom:24px; box-shadow:var(--shadow-sm);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <div>
                    <h3 style="font-size:16px; font-weight:800; color:var(--black); margin:0;">📊 Campus Skill Gap & Industry Demand Radar</h3>
                    <p style="font-size:12px; color:var(--grey-600); margin:4px 0 0 0;">Identifies real competency discrepancies between Industry Hiring Needs and Student Cohort Readiness.</p>
                </div>
                <button class="btn btn-gold btn-sm" onclick="window.generateTrainingPlan()">⚡ Generate Training Roadmap</button>
            </div>

            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">
                    <thead>
                        <tr style="border-bottom:2px solid var(--grey-200); color:var(--grey-600); font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">
                            <th style="padding:10px;">Competency</th>
                            <th style="padding:10px;">Industry Benchmark</th>
                            <th style="padding:10px;">Cohort Average</th>
                            <th style="padding:10px;">Skill Gap</th>
                            <th style="padding:10px;">Priority</th>
                            <th style="padding:10px;">Recommended Institutional Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${skillGapAnalysis.map(g => {
                            const badgeColor = g.priority === "Critical" ? "badge-red" : (g.priority === "High" ? "badge-orange" : "badge-green");
                            const gapColor = g.gap > 20 ? "var(--red)" : (g.gap > 10 ? "var(--orange)" : "var(--green)");

                            return `
                                <tr style="border-bottom:1px solid var(--grey-100);">
                                    <td style="padding:12px 10px; font-weight:700; color:var(--black);">${g.skill}</td>
                                    <td style="padding:12px 10px; color:var(--grey-600);">${g.industryTarget}% min</td>
                                    <td style="padding:12px 10px; font-weight:700; color:var(--black);">${g.cohortProficiency}%</td>
                                    <td style="padding:12px 10px; font-weight:800; color:${gapColor};">-${g.gap}%</td>
                                    <td style="padding:12px 10px;"><span class="badge ${badgeColor}">${g.priority}</span></td>
                                    <td style="padding:12px 10px; color:var(--grey-600); font-size:12px;">${g.recommendation}</td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderCohortTable() {
    const tableBody = document.getElementById("cohortTableBody");
    if (!tableBody) return;

    if (!studentsList.length) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--grey-500)">No student records found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = studentsList.map(s => {
        const name = s.fullName || s.name || "Student Candidate";
        const email = s.email || "student@institution.edu";
        const readiness = s.readiness || 80;
        const readinessColor = readiness >= 85 ? "var(--green)" : (readiness >= 75 ? "var(--gold)" : "var(--orange)");

        return `
            <tr style="border-bottom:1px solid var(--grey-100);">
                <td style="padding:12px 10px;">
                    <div style="font-weight:700; color:var(--black);">${name}</div>
                    <div style="font-size:11px; color:var(--grey-500);">${email}</div>
                </td>
                <td style="padding:12px 10px; color:var(--grey-600);">${s.degree || "B.Tech CSE"}</td>
                <td style="padding:12px 10px; font-weight:800; color:${readinessColor};">${readiness}% Readiness</td>
                <td style="padding:12px 10px;">
                    <div style="display:flex; gap:4px; flex-wrap:wrap;">
                        ${Object.keys(s.skills || {}).slice(0, 3).map(sk => `<span class="skill-tag" style="font-size:10px;">${sk}</span>`).join("")}
                    </div>
                </td>
                <td style="padding:12px 10px;">
                    <button class="btn btn-outline btn-sm" onclick="alert('Student Competency Dossier: ${name}\\n\\nReadiness Score: ${readiness}%\\nSkills: ${Object.entries(s.skills || {}).map(([k,v]) => `${k} (${v}%)`).join(', ')}')">View Dossier</button>
                </td>
            </tr>
        `;
    }).join("");
}

// Render Opportunity Cards
function renderOpportunityCards(filterType = "all", searchQuery = "", domainQuery = "") {
    const containers = [
        { id: "allOppGrid", type: "all" },
        { id: "fdpGrid", type: "fdp" },
        { id: "internshipGrid", type: "internship" },
        { id: "trainingGrid", type: "training" },
        { id: "workshopGrid", type: "workshops" },
        { id: "consultancyGrid", type: "consultancy" },
        { id: "researchGrid", type: "research" },
        { id: "guestGrid", type: "guest" },
        { id: "mentorshipGrid", type: "mentorship" }
    ];

    containers.forEach(({ id, type }) => {
        const grid = document.getElementById(id);
        if (!grid) return;

        let filtered = opportunities;
        if (type !== "all") {
            filtered = filtered.filter(o => o.type === type);
        } else if (filterType !== "all") {
            filtered = filtered.filter(o => o.type === filterType);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(o =>
                (o.title && o.title.toLowerCase().includes(q)) ||
                (o.organization && o.organization.toLowerCase().includes(q)) ||
                (o.domain && o.domain.toLowerCase().includes(q))
            );
        }

        if (!filtered.length) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1">
                    <div class="empty-title">No Opportunities Posted Yet</div>
                    <div class="empty-desc">Industry programs and campus engagements will appear here live.</div>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(opp => {
            const badgeClass = opp.type === "fdp" ? "badge-gold" : (opp.type === "internship" ? "badge-black" : "badge-green");
            const typeLabel = (opp.type || "Program").toUpperCase();
            const stipendOrFee = opp.stipend || opp.fee || "";

            return `
                <div class="opp-card">
                    <div class="opp-header">
                        <div>
                            <div class="opp-title">${opp.title || opp.role}</div>
                            <div class="opp-org">${opp.organization || opp.companyName || "Industry Partner"}</div>
                        </div>
                        <span class="badge ${badgeClass}">${typeLabel}</span>
                    </div>
                    <div class="opp-meta">
                        ${opp.mode ? `<span class="meta-item">${opp.mode}</span>` : ""}
                        ${opp.duration ? `<span class="meta-item">⏱️ ${opp.duration}</span>` : ""}
                        ${opp.location ? `<span class="meta-item">📍 ${opp.location}</span>` : ""}
                    </div>
                    ${stipendOrFee ? `<div style="font-size:12px;font-weight:700;color:var(--green)">💰 ${stipendOrFee}</div>` : ""}
                    <p style="font-size:12px;color:var(--grey-600);line-height:1.6;margin:4px 0">${opp.description || ""}</p>
                    ${opp.skills && opp.skills.length ? `<div class="opp-skills">${opp.skills.map(s => `<span class="skill-tag">${s}</span>`).join("")}</div>` : ""}
                    <div class="opp-footer">
                        <span class="deadline-text">📅 ${opp.deadline || "Active"}</span>
                        <button class="btn btn-outline btn-sm" onclick="alert('Viewing opportunity: ${opp.title || opp.role}\\n\\nOrganization: ${opp.organization || opp.companyName}\\nRequired Skills: ${(opp.skills || []).join(', ')}')">View Details</button>
                    </div>
                </div>
            `;
        }).join("");
    });
}

function renderApplicationsTable() {
    const tableBody = document.getElementById("applicationsTableBody");
    if (!tableBody) return;

    if (!applications.length) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--grey-500)">No candidate applications found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = applications.map(app => {
        const studentName = app.studentName || "Student Candidate";
        const oppTitle = app.opportunityTitle || app.role || "Software Engineering Role";
        const compName = app.companyName || app.company || "Industry Partner";
        const status = app.status || "Applied";

        let statusClass = "badge-gray";
        if (status === "Hired" || status === "Selected") statusClass = "badge-green";
        else if (status === "Shortlisted") statusClass = "badge-blue";
        else if (status === "Interviewing") statusClass = "badge-purple";
        else if (status === "Evaluated") statusClass = "badge-gold";

        return `
            <tr style="border-bottom:1px solid var(--grey-100);">
                <td style="padding:12px 10px; font-weight:700; color:var(--black);">${studentName}</td>
                <td style="padding:12px 10px; color:var(--grey-600);">${oppTitle}</td>
                <td style="padding:12px 10px; color:var(--black); font-weight:600;">${compName}</td>
                <td style="padding:12px 10px; color:var(--gold); font-weight:800;">${app.matchScore || 85}%</td>
                <td style="padding:12px 10px;"><span class="badge ${statusClass}">${status.toUpperCase()}</span></td>
                <td style="padding:12px 10px;">
                    <button class="btn btn-outline btn-sm" onclick="alert('Placement Record:\\n\\nCandidate: ${studentName}\\nRole: ${oppTitle}\\nCompany: ${compName}\\nCurrent Stage: ${status}')">Inspect</button>
                </td>
            </tr>
        `;
    }).join("");
}

// =====================================================
// INTERACTIVE HELPERS
// =====================================================
window.generateTrainingPlan = function() {
    const criticalGaps = skillGapAnalysis.filter(g => g.gap >= 20);
    const planText = criticalGaps.map(g => `• ${g.skill} (Gap: ${g.gap}%): ${g.recommendation}`).join("\n");
    alert(`Recommended Institutional Skill-Bridging Plan:\n\n${planText || "All core skills are currently aligned with industry demand!"}\n\nGenerated automatically from live Industry Job & Project requisitions.`);
};

function initSidebarNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const section = item.getAttribute("data-section");
            if (!section) return;

            navItems.forEach(n => n.classList.remove("active"));
            item.classList.add("active");

            document.querySelectorAll(".section-panel").forEach(p => p.classList.remove("active"));
            const targetPanel = document.getElementById(`sec-${section}`);
            if (targetPanel) targetPanel.classList.add("active");
        });
    });
}

function initModals() {
    window.closeAllModals = function() {
        document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
    };
}

function initFilters() {
    const searchInput = document.getElementById("oppSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            renderOpportunityCards("all", e.target.value);
        });
    }
}
