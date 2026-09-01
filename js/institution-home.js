// =====================================================
// SKILLBRIDGE - INSTITUTION & ACADEMICIAN DASHBOARD JS
// Firebase Auth + Live Post & Upload Engine (Mock Cleared)
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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// =====================================================
// STATE STORE (Cleaned of mock data)
// =====================================================
let currentUser = null;
let currentProfile = {
    name: "Faculty / Institution",
    fullName: "Faculty / Institution",
    email: "",
    role: "institution",
    designation: "Department Administrator",
    department: "Computer Science & Engineering",
    institution: "Institution",
    bio: "Institution and Academic Portal for publishing programs, research collaborations, FDPs, and managing faculty applications.",
    qualifications: [],
    expertise: ["Academic Administration", "Program Management"],
    researchInterests: [],
    subjects: [],
    publications: [],
    links: {
        linkedin: "",
        researchgate: "",
        google_scholar: ""
    }
};

let opportunities = [];
let applications = [];

// =====================================================
// INIT & FIREBASE AUTH SYNC
// =====================================================
document.addEventListener("DOMContentLoaded", async () => {
    initLocalState();
    initSidebarNavigation();
    initModals();
    initFilters();

    // Firebase Auth State Listener
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            try {
                // Fetch user profile from Firestore
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    currentProfile = {
                        ...currentProfile,
                        ...userData,
                        name: userData.fullName || userData.name || user.email.split("@")[0],
                        email: user.email,
                        role: userData.role || currentProfile.role,
                        institution: userData.institution || currentProfile.institution,
                        department: userData.department || currentProfile.department,
                        designation: userData.designation || currentProfile.designation
                    };
                } else {
                    currentProfile.name = user.displayName || user.email.split("@")[0];
                    currentProfile.email = user.email;
                }

                // Sync live opportunities & applications from Firestore
                await syncFromFirestore();
            } catch (err) {
                console.warn("Firestore sync status (persisting to local storage):", err);
            }
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
            } catch (e) {
                console.error("Sign out error", e);
            }
            window.location.href = "login.html";
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
// LOCAL STATE (CLEAN)
// =====================================================
function initLocalState() {
    // Clear old mock data if stored previously
    const isMockCleared = localStorage.getItem("sb_institution_mock_cleared_v2");
    if (!isMockCleared) {
        localStorage.removeItem("sb_institution_opportunities");
        localStorage.removeItem("sb_institution_applications");
        localStorage.setItem("sb_institution_mock_cleared_v2", "true");
        opportunities = [];
        applications = [];
    } else {
        const storedOpps = localStorage.getItem("sb_institution_opportunities");
        try { opportunities = storedOpps ? JSON.parse(storedOpps) : []; } catch (e) { opportunities = []; }

        const storedApps = localStorage.getItem("sb_institution_applications");
        try { applications = storedApps ? JSON.parse(storedApps) : []; } catch (e) { applications = []; }
    }
}

function saveLocalState() {
    localStorage.setItem("sb_institution_opportunities", JSON.stringify(opportunities));
    localStorage.setItem("sb_institution_applications", JSON.stringify(applications));
    localStorage.setItem("sb_institution_profile", JSON.stringify(currentProfile));
}

async function syncFromFirestore() {
    if (!currentUser) return;
    try {
        const oppsSnap = await getDocs(collection(db, "opportunities"));
        if (!oppsSnap.empty) {
            const fireOpps = [];
            oppsSnap.forEach(d => fireOpps.push({ id: d.id, ...d.data() }));
            if (fireOpps.length) {
                opportunities = fireOpps;
                saveLocalState();
            }
        }

        const appsSnap = await getDocs(collection(db, "applications"));
        if (!appsSnap.empty) {
            const fireApps = [];
            appsSnap.forEach(d => fireApps.push({ id: d.id, ...d.data() }));
            if (fireApps.length) {
                applications = fireApps;
                saveLocalState();
            }
        }
    } catch (e) {
        console.warn("Using offline opportunities store");
    }
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
    renderOpportunityCards();
    renderApplicationsTable();
    renderProfilePublications();
}

function renderStats() {
    const totalOpps = opportunities.length;
    const activeApps = applications.length;
    const acceptedApps = applications.filter(a => a.status === "Accepted").length;
    const pubsCount = (currentProfile.publications || []).length;

    const s1 = document.getElementById("statTotalOpps");
    if (s1) s1.textContent = totalOpps;

    const s2 = document.getElementById("statActiveApps");
    if (s2) s2.textContent = activeApps;

    const s3 = document.getElementById("statAccepted");
    if (s3) s3.textContent = acceptedApps;

    const s4 = document.getElementById("statPubs");
    if (s4) s4.textContent = pubsCount;

    // Sidebar counts
    const oppCountEl = document.getElementById("navOppCount");
    if (oppCountEl) oppCountEl.textContent = totalOpps;

    const appCountEl = document.getElementById("navAppCount");
    if (appCountEl) appCountEl.textContent = activeApps;
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

        if (domainQuery) {
            filtered = filtered.filter(o => o.domain === domainQuery);
        }

        if (!filtered.length) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1">
                    <div class="empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <div class="empty-title">No Opportunities Posted Yet</div>
                    <div class="empty-desc">Click "Post Opportunity" to publish your first program or collaboration call.</div>
                    <button class="btn btn-gold btn-sm" onclick="window.openPostModal('${type !== "all" ? type : "fdp"}')">+ Post New Opportunity</button>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(opp => {
            const badgeClass = {
                fdp: "badge-gold",
                internship: "badge-black",
                research: "badge-purple",
                consultancy: "badge-blue",
                training: "badge-green",
                workshops: "badge-orange",
                guest: "badge-gold",
                mentorship: "badge-purple"
            }[opp.type] || "badge-gray";

            const typeLabel = (opp.type || "Program").toUpperCase();
            const stipendOrFee = opp.fee || opp.stipend || opp.funding || opp.budget || opp.honorarium || "";

            return `
                <div class="opp-card">
                    <div class="opp-header">
                        <div style="display:flex;align-items:center;gap:12px">
                            <div class="opp-org-logo">${opp.orgInitials || (opp.organization ? opp.organization.slice(0, 2).toUpperCase() : "IN")}</div>
                            <div>
                                <div class="opp-title">${opp.title}</div>
                                <div class="opp-org">${opp.organization || "Institution"}</div>
                            </div>
                        </div>
                        <span class="badge ${badgeClass}">${typeLabel}</span>
                    </div>
                    <div class="opp-meta">
                        ${opp.mode ? `<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect></svg>${opp.mode}</span>` : ""}
                        ${opp.duration ? `<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>${opp.duration}</span>` : ""}
                        ${opp.domain ? `<span class="badge badge-gray">${opp.domain}</span>` : ""}
                    </div>
                    ${stipendOrFee ? `<div style="font-size:12px;font-weight:700;color:var(--green)">💰 ${stipendOrFee}</div>` : ""}
                    <p style="font-size:12px;color:var(--grey-600);line-height:1.6;margin:2px 0">${opp.description || ""}</p>
                    ${opp.attachmentName ? `<div style="font-size:11.5px;color:var(--blue);display:flex;align-items:center;gap:5px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg> Attachment: ${opp.attachmentName}</div>` : ""}
                    ${opp.skills && opp.skills.length ? `<div class="opp-skills">${opp.skills.map(s => `<span class="skill-tag">${s}</span>`).join("")}</div>` : ""}
                    <div class="opp-footer">
                        ${opp.deadline ? `<span class="deadline-text">📅 Deadline: ${opp.deadline}</span>` : "<span></span>"}
                        <div style="display:flex;gap:8px">
                            <button class="btn btn-outline btn-sm" onclick="window.viewOppDetails('${opp.id}')">Details</button>
                            <button class="btn btn-primary btn-sm" onclick="window.openApplyModal('${opp.id}')">Apply / Register</button>
                            <button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red-bg)" onclick="window.deleteOpp('${opp.id}')" title="Delete Opportunity">✕</button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    });
}

// Render Applications Table
function renderApplicationsTable() {
    const tableBody = document.getElementById("applicationsTableBody");
    if (!tableBody) return;

    if (!applications.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:36px;color:var(--grey-500)">
                    No applications submitted yet. Browse opportunities and click "Apply / Register" to track them here.
                </td>
            </tr>
        `;
        return;
    }

    const statusBadge = (s) => {
        switch (s) {
            case "Accepted": return `<span class="badge badge-green">Accepted</span>`;
            case "Shortlisted": return `<span class="badge badge-gold">Shortlisted</span>`;
            case "Under Review": return `<span class="badge badge-orange">Under Review</span>`;
            default: return `<span class="badge badge-gray">${s || "Applied"}</span>`;
        }
    };

    tableBody.innerHTML = applications.map(app => `
        <tr>
            <td>
                <strong style="color:var(--black);font-size:13px">${app.title}</strong>
                <div style="font-size:11px;color:var(--grey-500)">${app.organization}</div>
                ${app.attachmentName ? `<div style="font-size:10.5px;color:var(--blue)">📎 ${app.attachmentName}</div>` : ""}
            </td>
            <td><span class="badge badge-gray">${app.type}</span></td>
            <td>${app.appliedDate}</td>
            <td>${statusBadge(app.status)}</td>
            <td style="font-size:11.5px;color:var(--grey-700)">${app.nextStep || "Application Submitted"}</td>
            <td>
                <button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red-bg)" onclick="window.withdrawApp('${app.id}')">Withdraw</button>
            </td>
        </tr>
    `).join("");
}

// Render Publications
function renderProfilePublications() {
    const list = document.getElementById("profilePubsList");
    if (!list) return;

    const pubs = currentProfile.publications || [];
    if (!pubs.length) {
        list.innerHTML = `
            <div style="text-align:center;padding:24px;color:var(--grey-500);font-size:13px">
                No publications added yet. Click "Add Paper" to document your research papers.
            </div>
        `;
        return;
    }

    list.innerHTML = pubs.map(p => `
        <div style="padding:14px;background:var(--grey-100);border-radius:8px;border-left:3px solid var(--gold);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
            <div>
                <div style="font-size:13px;font-weight:700;color:var(--black)">${p.title}</div>
                <div style="font-size:11.5px;color:var(--grey-600);margin-top:3px">${p.journal} · ${p.year} · <span class="badge badge-gray" style="font-size:9px">${p.type}</span></div>
            </div>
            <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="window.deletePub('${p.id}')">✕</button>
        </div>
    `).join("");
}

// =====================================================
// SIDEBAR & SECTION NAVIGATION
// =====================================================
function initSidebarNavigation() {
    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
    const sections = document.querySelectorAll(".dashboard-section");

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const targetSectionId = item.getAttribute("data-section");
            if (!targetSectionId) return;

            navItems.forEach(n => n.classList.remove("active"));
            item.classList.add("active");

            sections.forEach(sec => sec.classList.remove("active"));
            const targetSec = document.getElementById(`sec-${targetSectionId}`);
            if (targetSec) {
                targetSec.classList.add("active");
                window.scrollTo({ top: 0, behavior: "smooth" });
            }

            const sidebar = document.getElementById("sidebar");
            if (sidebar) sidebar.classList.remove("open");
        });
    });
}

// =====================================================
// MODALS & POST / UPLOAD ENGINE
// =====================================================
function initModals() {
    // 1. Post Opportunity Form
    const postForm = document.getElementById("postOpportunityForm");
    if (postForm) {
        postForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // File attachment handle
            const fileInput = document.getElementById("oppAttachmentFile");
            const attachmentName = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0].name : "";

            const newOpp = {
                id: "opp_" + Date.now(),
                title: document.getElementById("oppTitle").value.trim(),
                type: document.getElementById("oppType").value,
                organization: document.getElementById("oppOrg").value.trim() || currentProfile.institution || "Institution",
                orgInitials: (document.getElementById("oppOrg").value.trim() || currentProfile.institution || "IN").slice(0, 2).toUpperCase(),
                domain: document.getElementById("oppDomain").value.trim(),
                mode: document.getElementById("oppMode").value,
                duration: document.getElementById("oppDuration").value.trim(),
                deadline: document.getElementById("oppDeadline").value.trim(),
                fee: document.getElementById("oppFee").value.trim(),
                description: document.getElementById("oppDesc").value.trim(),
                skills: document.getElementById("oppSkills").value.split(",").map(s => s.trim()).filter(Boolean),
                attachmentName: attachmentName,
                createdAt: new Date().toISOString()
            };

            opportunities.unshift(newOpp);
            saveLocalState();

            // Firestore upload
            if (currentUser) {
                try {
                    await addDoc(collection(db, "opportunities"), {
                        ...newOpp,
                        createdById: currentUser.uid,
                        createdAt: serverTimestamp()
                    });
                } catch (err) {
                    console.warn("Stored locally", err);
                }
            }

            closeAllModals();
            postForm.reset();
            renderAll();
            showToast("Opportunity published successfully!");
        });
    }

    // 2. Apply / Upload Application Form
    const applyForm = document.getElementById("applyModalForm");
    if (applyForm) {
        applyForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const oppId = document.getElementById("applyOppId").value;
            const opp = opportunities.find(o => o.id === oppId);
            if (!opp) return;

            const docInput = document.getElementById("applyDocAttachment");
            const docAttachmentName = docInput && docInput.files && docInput.files[0] ? docInput.files[0].name : "";

            const newApp = {
                id: "app_" + Date.now(),
                opportunityId: opp.id,
                title: opp.title,
                organization: opp.organization,
                type: (opp.type || "Program").toUpperCase(),
                appliedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                status: "Applied",
                nextStep: "Application submitted. Under initial screening.",
                statement: document.getElementById("applyStatement").value.trim(),
                portfolioLink: document.getElementById("applyPortfolioLink").value.trim(),
                attachmentName: docAttachmentName,
                applicantName: currentProfile.fullName || currentProfile.name,
                applicantEmail: currentProfile.email
            };

            applications.unshift(newApp);
            saveLocalState();

            // Save to Firestore
            if (currentUser) {
                try {
                    await addDoc(collection(db, "applications"), {
                        ...newApp,
                        userId: currentUser.uid,
                        createdAt: serverTimestamp()
                    });
                } catch (err) {
                    console.warn("Stored locally", err);
                }
            }

            closeAllModals();
            applyForm.reset();
            renderAll();
            showToast(`Application submitted for "${opp.title}"!`);
        });
    }

    // 3. Edit Profile Form
    const editProfForm = document.getElementById("editProfileForm");
    if (editProfForm) {
        editProfForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            currentProfile.fullName = document.getElementById("editName").value.trim();
            currentProfile.designation = document.getElementById("editDesig").value.trim();
            currentProfile.department = document.getElementById("editDept").value.trim();
            currentProfile.institution = document.getElementById("editInst").value.trim();
            currentProfile.bio = document.getElementById("editBio").value.trim();

            saveLocalState();

            if (currentUser) {
                try {
                    await updateDoc(doc(db, "users", currentUser.uid), {
                        fullName: currentProfile.fullName,
                        designation: currentProfile.designation,
                        department: currentProfile.department,
                        institution: currentProfile.institution,
                        bio: currentProfile.bio,
                        updatedAt: serverTimestamp()
                    });
                } catch (err) {
                    console.warn("Profile updated locally", err);
                }
            }

            closeAllModals();
            updateUserUI();
            showToast("Profile updated successfully!");
        });
    }

    // 4. Add Publication Form
    const addPubForm = document.getElementById("addPubForm");
    if (addPubForm) {
        addPubForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (!currentProfile.publications) currentProfile.publications = [];
            const newPub = {
                id: "pub_" + Date.now(),
                title: document.getElementById("pubTitle").value.trim(),
                journal: document.getElementById("pubJournal").value.trim(),
                year: document.getElementById("pubYear").value.trim(),
                type: document.getElementById("pubType").value
            };
            currentProfile.publications.unshift(newPub);
            saveLocalState();
            closeAllModals();
            addPubForm.reset();
            renderProfilePublications();
            renderStats();
            showToast("Publication added to portfolio!");
        });
    }
}

// Global actions
window.openPostModal = function(defaultType = "fdp") {
    const modal = document.getElementById("postOpportunityModal");
    if (!modal) return;
    const typeSelect = document.getElementById("oppType");
    if (typeSelect) typeSelect.value = defaultType;
    modal.classList.add("open");
};

window.openApplyModal = function(oppId) {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return;

    document.getElementById("applyOppId").value = opp.id;
    document.getElementById("applyOppTitleText").textContent = opp.title;
    document.getElementById("applyOppOrgText").textContent = `${opp.organization} · ${opp.domain || ""}`;

    const modal = document.getElementById("applyModal");
    if (modal) modal.classList.add("open");
};

window.viewOppDetails = function(oppId) {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return;

    document.getElementById("detailModalTitle").textContent = opp.title;
    document.getElementById("detailModalBody").innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <div class="opp-org-logo" style="width:48px;height:48px;font-size:15px">${opp.orgInitials || (opp.organization ? opp.organization.slice(0, 2).toUpperCase() : "IN")}</div>
            <div>
                <div style="font-size:15px;font-weight:700;color:var(--black)">${opp.organization || "Institution"}</div>
                <div style="font-size:12px;color:var(--grey-500)">${opp.mode} · ${opp.duration || ""}</div>
            </div>
        </div>
        <p style="font-size:13px;color:var(--grey-700);line-height:1.7;margin-bottom:18px">${opp.description || "No description provided."}</p>
        <div class="grid-2" style="margin-bottom:16px;gap:10px">
            <div style="padding:10px 14px;background:var(--grey-100);border-radius:6px"><div style="font-size:10px;font-weight:700;color:var(--grey-500)">DOMAIN</div><div style="font-size:12.5px;font-weight:600">${opp.domain || "General"}</div></div>
            <div style="padding:10px 14px;background:var(--grey-100);border-radius:6px"><div style="font-size:10px;font-weight:700;color:var(--grey-500)">DEADLINE</div><div style="font-size:12.5px;font-weight:600;color:var(--red)">${opp.deadline || "Open"}</div></div>
        </div>
        ${opp.attachmentName ? `<div style="margin-bottom:14px;padding:10px 14px;background:var(--blue-bg);border-radius:6px;font-size:12px;color:var(--blue);font-weight:600">📎 Attached Brochure / Document: ${opp.attachmentName}</div>` : ""}
        ${opp.skills && opp.skills.length ? `<div style="margin-bottom:14px"><div style="font-size:11px;font-weight:700;color:var(--grey-700);margin-bottom:6px">SKILLS & TOPICS</div><div class="opp-skills">${opp.skills.map(s => `<span class="skill-tag">${s}</span>`).join("")}</div></div>` : ""}
    `;

    document.getElementById("detailApplyBtn").onclick = () => {
        closeAllModals();
        window.openApplyModal(opp.id);
    };

    const modal = document.getElementById("opportunityDetailModal");
    if (modal) modal.classList.add("open");
};

window.deleteOpp = function(oppId) {
    if (confirm("Are you sure you want to delete this opportunity?")) {
        opportunities = opportunities.filter(o => o.id !== oppId);
        saveLocalState();
        renderAll();
        showToast("Opportunity deleted.");
    }
};

window.deletePub = function(pubId) {
    if (confirm("Delete this publication?")) {
        currentProfile.publications = (currentProfile.publications || []).filter(p => p.id !== pubId);
        saveLocalState();
        renderProfilePublications();
        renderStats();
        showToast("Publication removed.");
    }
};

window.openEditProfileModal = function() {
    document.getElementById("editName").value = currentProfile.fullName || currentProfile.name || "";
    document.getElementById("editDesig").value = currentProfile.designation || "";
    document.getElementById("editDept").value = currentProfile.department || "";
    document.getElementById("editInst").value = currentProfile.institution || "";
    document.getElementById("editBio").value = currentProfile.bio || "";

    const modal = document.getElementById("editProfileModal");
    if (modal) modal.classList.add("open");
};

window.openAddPubModal = function() {
    const modal = document.getElementById("addPubModal");
    if (modal) modal.classList.add("open");
};

window.withdrawApp = function(appId) {
    if (confirm("Are you sure you want to withdraw this application?")) {
        applications = applications.filter(a => a.id !== appId);
        saveLocalState();
        renderAll();
        showToast("Application withdrawn.");
    }
};

window.closeAllModals = function() {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("open"));
};

// =====================================================
// FILTERS
// =====================================================
function initFilters() {
    const searchInput = document.getElementById("globalSearchInput");
    const domainSelect = document.getElementById("globalDomainSelect");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            renderOpportunityCards("all", searchInput.value.trim(), domainSelect ? domainSelect.value : "");
        });
    }

    if (domainSelect) {
        domainSelect.addEventListener("change", () => {
            renderOpportunityCards("all", searchInput ? searchInput.value.trim() : "", domainSelect.value);
        });
    }

    const subTabs = document.querySelectorAll("#oppCategoryTabs .tab-btn");
    subTabs.forEach(btn => {
        btn.addEventListener("click", () => {
            subTabs.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const type = btn.getAttribute("data-type");
            renderOpportunityCards(type, searchInput ? searchInput.value.trim() : "", domainSelect ? domainSelect.value : "");
        });
    });
}

// =====================================================
// TOAST HELPER
// =====================================================
function showToast(message) {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2" width="18" height="18">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3500);
}
