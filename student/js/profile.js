import { db, auth } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    setDoc,
    doc, 
    getDoc, 
    updateDoc, 
    query, 
    where, 
    onSnapshot,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { requireAuth } from './auth-guard.js';

let currentUser = null;
let currentProfile = null;
let allAcademicians = [];
let myMentorshipRequests = [];

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', () => {
    requireAuth(async (user, profileData) => {
        currentUser = user;
        currentProfile = profileData;
        
        populateProfileForm();
        initEventListeners();
        await loadAcademicians();
        initMentorshipRequestsListener();
        initStudentNotifications();
    });
});

function populateProfileForm() {
    if (!currentProfile) return;

    const name = currentProfile.fullName || currentProfile.name || currentUser?.displayName || "";
    const email = currentUser?.email || currentProfile.email || "";
    const inst = currentProfile.institution || currentProfile.institutionName || currentProfile.college || "IIIT";
    const degree = currentProfile.degree || currentProfile.department || "B.Tech Computer Science & Engineering";
    const targetRole = currentProfile.targetRole || currentProfile.careerGoal || "Full Stack Developer";
    const bio = currentProfile.bio || "";

    let skillsText = "";
    if (Array.isArray(currentProfile.skillsArray)) {
        skillsText = currentProfile.skillsArray.join(", ");
    } else if (currentProfile.skills && typeof currentProfile.skills === "object") {
        skillsText = Object.keys(currentProfile.skills).join(", ");
    } else if (typeof currentProfile.skills === "string") {
        skillsText = currentProfile.skills;
    } else {
        skillsText = "Python, React, Node.js, Cloud, Machine Learning";
    }

    document.getElementById("student-name").value = name;
    document.getElementById("student-email").value = email;
    document.getElementById("student-institution").value = inst;
    document.getElementById("student-degree").value = degree;
    document.getElementById("student-target-role").value = targetRole;
    document.getElementById("student-skills").value = skillsText;
    document.getElementById("student-bio").value = bio;

    updateProfileSummaryCard(name, inst, degree);
}

function updateProfileSummaryCard(name, inst, degree) {
    const cardName = document.getElementById("card-student-name");
    const cardInst = document.getElementById("card-student-institution");
    const cardDegree = document.getElementById("card-student-degree");
    const summaryInst = document.getElementById("summary-inst-name");
    const instTitle = document.getElementById("inst-badge-text");
    const initialEl = document.getElementById("avatar-initial");

    if (cardName) cardName.textContent = name || "Student";
    if (cardInst) cardInst.textContent = inst || "Institution";
    if (cardDegree) cardDegree.textContent = degree || "Degree";
    if (summaryInst) summaryInst.textContent = inst || "Institution";
    if (instTitle) instTitle.textContent = inst || "Institution";
    if (initialEl) initialEl.textContent = (name || "S").charAt(0).toUpperCase();
}

function initEventListeners() {
    // Save Profile Form
    const profileForm = document.getElementById("profile-form");
    if (profileForm) {
        profileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await saveProfile();
        });
    }

    // Filter Controls
    const skillSearch = document.getElementById("skill-search");
    if (skillSearch) {
        skillSearch.addEventListener("input", () => renderFacultyGrid());
    }

    const scopeFilter = document.getElementById("scope-filter");
    if (scopeFilter) {
        scopeFilter.addEventListener("change", () => renderFacultyGrid());
    }

    // Mentorship Form Submit
    const mentorshipForm = document.getElementById("mentorship-request-form");
    if (mentorshipForm) {
        mentorshipForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await submitMentorshipRequest();
        });
    }

    // Logout Button
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
            } catch (err) {}
            window.location.href = "../../login.html";
        });
    }
}

async function saveProfile() {
    if (!currentUser) return;

    const saveBtn = document.getElementById("save-profile-btn");
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
    }

    const name = document.getElementById("student-name").value.trim();
    const inst = document.getElementById("student-institution").value.trim() || "IIIT";
    const degree = document.getElementById("student-degree").value.trim();
    const targetRole = document.getElementById("student-target-role").value.trim();
    const rawSkills = document.getElementById("student-skills").value.trim();
    const bio = document.getElementById("student-bio").value.trim();

    const skillsArray = rawSkills.split(",").map(s => s.trim()).filter(Boolean);

    try {
        const userRef = doc(db, "users", currentUser.uid);
        const updatedFields = {
            name: name,
            fullName: name,
            institution: inst,
            institutionName: inst,
            degree: degree,
            targetRole: targetRole,
            skillsArray: skillsArray,
            bio: bio,
            updatedAt: serverTimestamp()
        };

        await updateDoc(userRef, updatedFields);

        currentProfile = {
            ...currentProfile,
            ...updatedFields
        };

        updateProfileSummaryCard(name, inst, degree);
        alert(`✅ Profile updated successfully!\n\nConnected Institution set to: ${inst}`);
        
        renderFacultyGrid();

    } catch (err) {
        console.error("Failed to save student profile:", err);
        alert("Failed to save profile: " + err.message);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Profile & Update Faculty Feed`;
        }
    }
}

// Load Academicians from Firestore
async function loadAcademicians() {
    let list = [];
    try {
        // Query users with role == academician
        const q = query(collection(db, "users"), where("role", "==", "academician"));
        const snap = await getDocs(q);
        snap.forEach(d => {
            list.push({ id: d.id, ...d.data() });
        });

        // Also query academicians sub-collection
        const acadSnap = await getDocs(collection(db, "academicians"));
        acadSnap.forEach(d => {
            const data = d.data();
            const existingIdx = list.findIndex(a => a.id === d.id);
            if (existingIdx >= 0) {
                list[existingIdx] = { ...list[existingIdx], ...data };
            } else {
                list.push({ id: d.id, ...data });
            }
        });

    } catch (e) {
        console.warn("Notice: Fetching academicians notice:", e);
    }

    // Demo fallback academicians if list is small, matching IIIT & partner institutions
    const demoAcademicians = [
        {
            id: "acad_demo_1",
            name: "Dr. Rajesh Kumar",
            fullName: "Dr. Rajesh Kumar",
            designation: "Senior Professor & HOD",
            department: "Computer Science & Engineering",
            institution: "IIIT",
            institutionName: "Indian Institute of Information Technology",
            qualifications: [
                "Ph.D in Artificial Intelligence (IIT Delhi - 2017)",
                "M.Tech in Software Systems (IIIT - 2012)",
                "B.Tech Computer Engineering (2008)"
            ],
            expertise: ["Machine Learning", "Python", "Deep Learning", "Data Structures", "PyTorch"],
            skills: ["Python", "Machine Learning", "Deep Learning", "Data Structures", "PyTorch"],
            publications: [
                "Advanced Deep Learning for Real-Time Edge Processing (IEEE 2024)",
                "Scalable AI Pipeline Engineering & Neural Compression (ACM 2023)"
            ],
            bio: "Over 15 years of academic and industrial research experience in AI systems, computer vision, and neural model compression."
        },
        {
            id: "acad_demo_2",
            name: "Prof. Ananya Sen",
            fullName: "Prof. Ananya Sen",
            designation: "Associate Professor",
            department: "Cloud Systems & DevOps",
            institution: "IIIT",
            institutionName: "Indian Institute of Information Technology",
            qualifications: [
                "Ph.D in Distributed Systems (IISc Bangalore - 2019)",
                "M.S in Computer Science (2015)"
            ],
            expertise: ["Cloud", "Docker", "Kubernetes", "Node.js", "System Design"],
            skills: ["Cloud", "Docker", "Kubernetes", "Node.js", "System Design"],
            publications: [
                "Microservice Orchestration Patterns for High-Throughput Portals (IEEE 2024)"
            ],
            bio: "Specializes in cloud-native microservices, DevOps pipelines, containerized deployments, and high-performance backend infrastructure."
        },
        {
            id: "acad_demo_3",
            name: "Dr. Vikramaditya Joshi",
            fullName: "Dr. Vikramaditya Joshi",
            designation: "Dean of Industry Research & Projects",
            department: "Information Technology",
            institution: "IIIT",
            institutionName: "Indian Institute of Information Technology",
            qualifications: [
                "Ph.D in Cybersecurity & Full-Stack Systems (2018)",
                "M.Tech IT (2013)"
            ],
            expertise: ["React", "JavaScript", "Cybersecurity", "Full Stack", "Web Architecture"],
            skills: ["React", "JavaScript", "Cybersecurity", "Full Stack", "Web Architecture"],
            publications: [
                "Zero-Knowledge Authentication Mechanisms in Web Systems (2024)"
            ],
            bio: "Leads campus-wide industry immersion projects, capstone research guidance, and secure software development labs."
        },
        {
            id: "acad_demo_4",
            name: "Prof. Sunita Rao",
            fullName: "Prof. Sunita Rao",
            designation: "Professor of Data Science",
            department: "Data Engineering",
            institution: "IIT Delhi",
            institutionName: "Indian Institute of Technology Delhi",
            qualifications: [
                "Ph.D in Big Data Analytics (IIT Bombay)",
                "M.Tech CSE"
            ],
            expertise: ["Python", "SQL", "Data Analytics", "Machine Learning"],
            skills: ["Python", "SQL", "Data Analytics", "Machine Learning"],
            publications: [
                "Predictive Analytics on Large Scale Educational Datasets (2023)"
            ],
            bio: "Focuses on big data engineering, SQL query optimization, and enterprise machine learning deployments."
        }
    ];

    // Combine loaded with demo fallbacks without duplicates
    demoAcademicians.forEach(demo => {
        if (!list.some(a => a.id === demo.id || a.name === demo.name)) {
            list.push(demo);
        }
    });

    allAcademicians = list;
    renderFacultyGrid();
}

function renderFacultyGrid() {
    const grid = document.getElementById("faculty-grid");
    const summaryCount = document.getElementById("summary-faculty-count");
    if (!grid) return;

    grid.innerHTML = "";

    const userInst = (currentProfile?.institution || currentProfile?.institutionName || "IIIT").trim().toLowerCase();
    const scope = document.getElementById("scope-filter")?.value || "my";
    const searchQuery = (document.getElementById("skill-search")?.value || "").trim().toLowerCase();

    let filtered = allAcademicians;

    // Filter by Institution
    if (scope === "my") {
        filtered = filtered.filter(a => {
            const inst = (a.institution || a.institutionName || a.college || "").trim().toLowerCase();
            return inst.includes(userInst) || userInst.includes(inst) || (userInst === "iiit" && inst.includes("iiit"));
        });
    }

    // Filter by Skill / Keyword Search
    if (searchQuery) {
        filtered = filtered.filter(a => {
            const nameMatch = (a.name || a.fullName || "").toLowerCase().includes(searchQuery);
            const deptMatch = (a.department || a.designation || "").toLowerCase().includes(searchQuery);
            const instMatch = (a.institution || a.institutionName || "").toLowerCase().includes(searchQuery);
            
            let skillsList = [];
            if (Array.isArray(a.skills)) skillsList = a.skills;
            else if (Array.isArray(a.expertise)) skillsList = a.expertise;
            else if (typeof a.skills === "object") skillsList = Object.keys(a.skills);

            const skillMatch = skillsList.some(s => String(s).toLowerCase().includes(searchQuery));
            return nameMatch || deptMatch || instMatch || skillMatch;
        });
    }

    if (summaryCount) {
        summaryCount.textContent = `${filtered.length} Faculty Member(s)`;
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 3rem 1.5rem; text-align: center; background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-color);">
                <i class="fa-solid fa-graduation-cap" style="font-size: 2.5rem; color: var(--ansora-strategic-gold); margin-bottom: 1rem;"></i>
                <h3 style="margin-bottom: 0.5rem;">No Faculty Members Found</h3>
                <p class="text-secondary" style="font-size: 0.9rem; max-width: 450px; margin: 0 auto 1rem;">
                    No academicians matched your search criteria for <strong>${scope === 'my' ? currentProfile?.institution || 'your institution' : 'all institutions'}</strong>.
                </p>
                <button class="btn-action btn-sm" onclick="document.getElementById('scope-filter').value='all'; document.getElementById('skill-search').value=''; window.renderFacultyGrid();">
                    <i class="fa-solid fa-globe"></i> View All Partner Institutions
                </button>
            </div>
        `;
        return;
    }

    filtered.forEach(fac => {
        const card = document.createElement("div");
        card.className = "faculty-card";

        const name = fac.fullName || fac.name || "Faculty Member";
        const designation = fac.designation || "Faculty & Researcher";
        const dept = fac.department || "Computer Science & Engineering";
        const inst = fac.institutionName || fac.institution || "Academic Institution";
        const initial = name.replace("Dr. ", "").replace("Prof. ", "").charAt(0).toUpperCase();

        // Extract skills cleanly as strings
        let rawSkills = [];
        if (Array.isArray(fac.skills) && fac.skills.length > 0) rawSkills = fac.skills;
        else if (Array.isArray(fac.expertise) && fac.expertise.length > 0) rawSkills = fac.expertise;
        else if (typeof fac.skills === "object" && fac.skills !== null) rawSkills = Object.keys(fac.skills);
        else rawSkills = ["Computer Science", "Machine Learning", "System Architecture"];

        const skillsArr = rawSkills.map(sk => {
            if (typeof sk === "string") return sk;
            if (sk && typeof sk === "object") return sk.name || sk.skill || sk.title || sk.topic || "Expertise";
            return String(sk);
        });

        // Qualifications snippet
        let qualSnippet = "Ph.D & Advanced Academic Requisitions";
        if (Array.isArray(fac.qualifications) && fac.qualifications.length > 0) {
            qualSnippet = fac.qualifications[0];
        } else if (typeof fac.qualifications === "string") {
            qualSnippet = fac.qualifications;
        }

        // Check request status with this faculty member
        const acceptedReq = myMentorshipRequests.find(r => 
            (r.academicianId === fac.id || r.mentorId === fac.id || r.recipientId === fac.id) &&
            (r.status === "Accepted" || r.status === "accepted" || r.status === "active")
        );

        const pendingReq = myMentorshipRequests.find(r => 
            (r.academicianId === fac.id || r.mentorId === fac.id || r.recipientId === fac.id) &&
            (r.status === "Pending" || r.status === "pending")
        );

        let actionBtnHtml = '';
        if (acceptedReq) {
            const reqId = acceptedReq.requestId || acceptedReq.id;
            const altId = (acceptedReq.id && acceptedReq.id !== reqId) ? acceptedReq.id : (acceptedReq.mentorshipId || '');
            const topic = acceptedReq.skillRequested || acceptedReq.topic || 'Mentorship Guidance';

            actionBtnHtml = `
                <button type="button" class="btn-primary-small" style="flex:1; font-size:0.8rem; padding:0.6rem; background:var(--ansora-strategic-gold, #c9a227); color:white; font-weight:700; cursor:pointer;" onclick="window.openStudentMentorshipChat('${reqId}', '${escapeHTML(name)}', '${escapeHTML(topic)}', '${fac.id}', '${altId}')">
                    <i class="fa-solid fa-comments"></i> Chat
                </button>
            `;
        } else if (pendingReq) {
            actionBtnHtml = `
                <button type="button" class="btn-action" style="flex:1; font-size:0.8rem; padding:0.6rem; opacity:0.85;" disabled title="Mentorship request sent, awaiting faculty review.">
                    <i class="fa-solid fa-hourglass-half"></i> Pending
                </button>
            `;
        } else {
            actionBtnHtml = `
                <button type="button" class="btn-primary-small" style="flex:1; font-size:0.8rem; padding:0.6rem;" onclick="window.openMentorshipModalById('${fac.id}')">
                    <i class="fa-solid fa-bolt"></i> Mentorship
                </button>
            `;
        }

        card.innerHTML = `
            <div>
                <div class="faculty-header">
                    <div class="faculty-avatar">${initial}</div>
                    <div>
                        <div class="faculty-name">${escapeHTML(name)}</div>
                        <div class="faculty-dept">${escapeHTML(designation)} · ${escapeHTML(dept)}</div>
                        <span class="faculty-inst">🏛️ ${escapeHTML(inst)}</span>
                    </div>
                </div>

                <div class="faculty-qualifications">
                    <i class="fa-solid fa-user-graduate text-accent"></i> <strong>Qualifications:</strong> ${escapeHTML(qualSnippet)}
                </div>

                <div class="faculty-skills">
                    ${skillsArr.slice(0, 5).map(sk => `<span class="skill-pill">${escapeHTML(sk)}</span>`).join("")}
                </div>
            </div>

            <div class="faculty-actions">
                <button class="btn-action" style="flex:1; font-size:0.8rem; padding:0.6rem;" onclick="window.viewAcademicianDossier('${fac.id}')">
                    <i class="fa-solid fa-graduation-cap"></i> Qualifications
                </button>
                ${actionBtnHtml}
            </div>
        `;

        grid.appendChild(card);
    });
}
window.renderFacultyGrid = renderFacultyGrid;

// Qualifications Dossier Modal
window.viewAcademicianDossier = function(facId) {
    const fac = allAcademicians.find(a => a.id === facId);
    if (!fac) return;

    const modal = document.getElementById("dossier-modal");
    if (!modal) return;

    const name = fac.fullName || fac.name || "Faculty Member";
    const initial = name.replace("Dr. ", "").replace("Prof. ", "").charAt(0).toUpperCase();
    const designation = fac.designation || "Faculty Member";
    const dept = fac.department || "Computer Science";
    const inst = fac.institutionName || fac.institution || "Academic Institution";

    document.getElementById("modal-dossier-name").textContent = name;
    document.getElementById("modal-dossier-dept").textContent = `${designation} · ${dept}`;
    document.getElementById("modal-dossier-inst").textContent = inst;
    document.getElementById("modal-dossier-avatar").textContent = initial;

    // Qualifications list
    const qualContainer = document.getElementById("modal-dossier-qualifications");
    if (qualContainer) {
        let qualHtml = "• Ph.D in Computer Science & Artificial Intelligence";
        if (Array.isArray(fac.qualifications) && fac.qualifications.length > 0) {
            qualHtml = fac.qualifications.map(q => `• ${q}`).join("<br>");
        } else if (typeof fac.qualifications === "string") {
            qualHtml = fac.qualifications;
        }
        qualContainer.innerHTML = qualHtml;
    }

    // Skills
    const skillsContainer = document.getElementById("modal-dossier-skills");
    if (skillsContainer) {
        let rawSkills = Array.isArray(fac.skills) ? fac.skills : (Array.isArray(fac.expertise) ? fac.expertise : ["Computer Science"]);
        let skillsArr = rawSkills.map(s => typeof s === 'string' ? s : (s?.name || s?.skill || s?.title || "Expertise"));
        skillsContainer.innerHTML = skillsArr.map(s => `<span class="skill-pill" style="font-size:0.8rem; background:rgba(201, 162, 39, 0.12); color:var(--ansora-deep-black); border-color:var(--ansora-strategic-gold);">${escapeHTML(s)}</span>`).join("");
    }

    // Publications
    const pubContainer = document.getElementById("modal-dossier-publications");
    if (pubContainer) {
        let pubHtml = "• Published multiple peer-reviewed research papers in high-impact journals.";
        if (Array.isArray(fac.publications) && fac.publications.length > 0) {
            pubHtml = fac.publications.map(p => `• ${p}`).join("<br>");
        }
        pubContainer.innerHTML = pubHtml;
    }

    // Bio
    const bioEl = document.getElementById("modal-dossier-bio");
    if (bioEl) {
        bioEl.textContent = fac.bio || "No detailed biography provided for this faculty member.";
    }

    // Request button in modal
    const reqBtn = document.getElementById("modal-dossier-request-btn");
    if (reqBtn) {
        const acceptedReq = myMentorshipRequests.find(r => 
            (r.academicianId === fac.id || r.mentorId === fac.id || r.recipientId === fac.id) &&
            (r.status === "Accepted" || r.status === "accepted" || r.status === "active")
        );

        if (acceptedReq) {
            const reqId = acceptedReq.requestId || acceptedReq.id;
            const altId = (acceptedReq.id && acceptedReq.id !== reqId) ? acceptedReq.id : (acceptedReq.mentorshipId || '');
            const topic = acceptedReq.skillRequested || acceptedReq.topic || 'Mentorship Guidance';

            reqBtn.style.background = "var(--ansora-strategic-gold, #c9a227)";
            reqBtn.innerHTML = '<i class="fa-solid fa-comments"></i> Chat with Mentor';
            reqBtn.onclick = () => {
                window.closeDossierModal();
                window.openStudentMentorshipChat(reqId, name, topic, fac.id, altId);
            };
        } else {
            reqBtn.style.background = "";
            reqBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> Request Mentorship';
            reqBtn.onclick = () => {
                window.closeDossierModal();
                window.openMentorshipModal(fac.id, name, inst);
            };
        }
    }

    modal.classList.add("active");
};

window.closeDossierModal = function() {
    const modal = document.getElementById("dossier-modal");
    if (modal) modal.classList.remove("active");
};

// Mentorship Modal
window.openMentorshipModalById = function(facId) {
    const fac = allAcademicians.find(a => a.id === facId);
    if (!fac) return;
    const name = fac.fullName || fac.name || "Faculty Member";
    const inst = fac.institutionName || fac.institution || "Academic Institution";
    window.openMentorshipModal(fac.id, name, inst);
};

window.openMentorshipModal = function(facId, facName, facInst) {
    const modal = document.getElementById("mentorship-modal");
    if (!modal) return;

    document.getElementById("req-faculty-id").value = facId;
    document.getElementById("req-faculty-name").textContent = facName;
    document.getElementById("req-faculty-inst").textContent = facInst;
    document.getElementById("req-skill").value = "";
    document.getElementById("req-message").value = "";

    modal.classList.add("active");
};

window.closeMentorshipModal = function() {
    const modal = document.getElementById("mentorship-modal");
    if (modal) modal.classList.remove("active");
};

async function submitMentorshipRequest() {
    if (!currentUser) return;

    const facId = document.getElementById("req-faculty-id").value;
    const facName = document.getElementById("req-faculty-name").textContent;
    const facInst = document.getElementById("req-faculty-inst").textContent;
    const skill = document.getElementById("req-skill").value.trim();
    const message = document.getElementById("req-message").value.trim();

    if (!skill || !message) {
        alert("Please fill in both the target skill and message for mentorship.");
        return;
    }

    try {
        const studentName = currentProfile.fullName || currentProfile.name || currentUser.displayName || "Student Candidate";
        const studentInst = currentProfile.institution || currentProfile.institutionName || "IIIT";
        const studentDegree = currentProfile.degree || "B.Tech CSE";

        const reqRef = doc(collection(db, "mentorship_requests"));
        const requestId = reqRef.id;

        const payload = {
            id: requestId,
            requestId: requestId,
            studentId: currentUser.uid,
            menteeId: currentUser.uid,
            senderId: currentUser.uid,
            studentName: studentName,
            senderName: studentName,
            studentEmail: currentUser.email || "",
            studentDegree: studentDegree,
            studentInstitution: studentInst,
            academicianId: facId,
            mentorId: facId,
            recipientId: facId,
            academicianName: facName,
            mentorName: facName,
            academicianInstitution: facInst,
            organization: facInst,
            skillRequested: skill,
            topic: skill,
            title: `Mentorship Request: ${skill}`,
            message: message,
            status: "Pending",
            direction: "incoming",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Write to mentorship_requests collection with explicit requestId
        await setDoc(reqRef, payload);

        // Also write to mentorships collection with explicit requestId for academician module synchronization
        await setDoc(doc(db, "mentorships", requestId), {
            ...payload,
            status: "pending"
        });

        // Trigger Notification for the Academician
        await addDoc(collection(db, "notifications"), {
            userId: facId,
            recipientId: facId,
            academicianId: facId,
            targetRole: "academician",
            title: "New 1-on-1 Mentorship Requisition",
            message: `${studentName} from ${studentInst} has requested mentorship for "${skill}".`,
            type: "mentorship",
            read: false,
            createdAt: serverTimestamp()
        });

        window.closeMentorshipModal();
        alert(`⚡ Mentorship Request Sent!\n\nYour request for guidance on "${skill}" has been submitted to ${facName}.`);

    } catch (err) {
        console.error("Failed to submit mentorship request:", err);
        alert("Failed to submit mentorship request: " + err.message);
    }
}

// Sent Mentorship Requests Realtime Listener
function initMentorshipRequestsListener() {
    if (!currentUser) return;

    try {
        const q = query(
            collection(db, "mentorship_requests"),
            where("studentId", "==", currentUser.uid)
        );

        onSnapshot(q, (snap) => {
            myMentorshipRequests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            renderMentorshipTable();
            renderFacultyGrid();
        }, (err) => {
            console.warn("Mentorship requests listener notice:", err);
        });

    } catch (e) {
        console.warn("Could not listen to mentorship requests:", e);
    }
}

function renderMentorshipTable() {
    const tableBody = document.getElementById("mentorship-requests-table");
    const reqCount = document.getElementById("summary-requests-count");

    if (reqCount) reqCount.textContent = `${myMentorshipRequests.length} Sent`;

    if (!tableBody) return;

    if (!tableBody.dataset.listenerAttached) {
        tableBody.dataset.listenerAttached = "true";
        tableBody.addEventListener("click", (e) => {
            const btn = e.target.closest(".student-open-chat-btn");
            if (btn) {
                const reqId = btn.dataset.reqId;
                const altId = btn.dataset.altId;
                const mentorName = btn.dataset.mentorName;
                const skill = btn.dataset.skill;
                const mentorId = btn.dataset.mentorId;
                window.openStudentMentorshipChat(reqId, mentorName, skill, mentorId, altId);
            }
        });
    }

    if (myMentorshipRequests.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-secondary);">
                    No mentorship requests submitted yet. Use <strong>⚡ Request Mentorship</strong> on any faculty card above to initiate guidance requests.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = myMentorshipRequests.map(req => {
        const facName = req.academicianName || "Faculty Member";
        const facInst = req.academicianInstitution || "Institution";
        const skill = req.skillRequested || "Mentorship Guidance";
        const msg = req.message || "";
        const status = req.status || "Pending";
        const mentorId = req.academicianId || req.mentorId || "";
        const targetReqId = req.requestId || req.id;
        const altReqId = (req.id && req.id !== targetReqId) ? req.id : (req.mentorshipId || "");

        let statusBadge = `<span class="status-pill" style="display:inline-block; background:rgba(201, 162, 39, 0.15); color:var(--ansora-strategic-gold); padding:4px 8px; border-radius:6px; font-weight:700; font-size:0.75rem;">⏳ ${status}</span>`;
        let chatBtn = '';

        if (status === "Accepted" || status === "active" || status === "accepted") {
            statusBadge = `<span class="status-pill" style="display:inline-block; background:rgba(16, 185, 129, 0.15); color:var(--success); padding:4px 8px; border-radius:6px; font-weight:700; font-size:0.75rem;">✅ Approved</span>`;
            chatBtn = `
                <button type="button" class="btn-primary-small student-open-chat-btn" data-req-id="${targetReqId}" data-alt-id="${altReqId}" data-mentor-name="${escapeHTML(facName)}" data-skill="${escapeHTML(skill)}" data-mentor-id="${mentorId}" style="padding:4px 10px; font-size:0.75rem; margin-left:6px; cursor:pointer;">
                    <i class="fa-solid fa-comments"></i> Chat
                </button>
            `;
        } else if (status === "Rejected") {
            statusBadge = `<span class="status-pill" style="display:inline-block; background:rgba(239, 68, 68, 0.15); color:var(--danger); padding:4px 8px; border-radius:6px; font-weight:700; font-size:0.75rem;">❌ Rejected</span>`;
        }

        const dateStr = req.createdAt ? new Date(req.createdAt.seconds ? req.createdAt.seconds * 1000 : req.createdAt).toLocaleDateString() : "Just now";

        return `
            <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:10px; font-weight:700; color:var(--ansora-deep-black);">${escapeHTML(facName)}</td>
                <td style="padding:10px; color:var(--text-secondary);">${escapeHTML(facInst)}</td>
                <td style="padding:10px; font-weight:700; color:var(--ansora-strategic-gold);">${escapeHTML(skill)}</td>
                <td style="padding:10px; color:var(--ansora-graphite); font-size:0.85rem; max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHTML(msg)}">${escapeHTML(msg)}</td>
                <td style="padding:10px; vertical-align:middle;">${statusBadge} ${chatBtn}</td>
                <td style="padding:10px; color:var(--text-secondary); font-size:0.8rem;">${dateStr}</td>
            </tr>
        `;
    }).join("");
}

// Real-time Student Notifications Listener & Modal Handler
function initStudentNotificationsListener() {
    if (!currentUser) return;

    const notifBtn = document.getElementById("student-notification-bell");
    const notifModal = document.getElementById("student-notifications-modal");

    if (notifBtn && notifModal) {
        notifBtn.addEventListener("click", () => {
            notifModal.classList.add("active");
        });
    }

    try {
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", currentUser.uid)
        );

        onSnapshot(q, (snap) => {
            const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            notifs.sort((a, b) => {
                const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
                const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
                return tB - tA;
            });

            const unreadCount = notifs.filter(n => n.read === false).length;
            const notifBadge = document.getElementById("student-notif-badge");
            if (notifBadge) {
                if (unreadCount > 0) {
                    notifBadge.textContent = unreadCount;
                    notifBadge.style.display = "inline-block";
                } else {
                    notifBadge.style.display = "none";
                }
            }

            renderStudentNotifications(notifs);
        });

    } catch (e) {
        console.warn("Notice student notification listener:", e);
    }
}

function renderStudentNotifications(notifs) {
    const container = document.getElementById("student-notifications-list");
    if (!container) return;

    if (notifs.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:2rem; color:var(--text-secondary);">
                <i class="fa-regular fa-bell-slash" style="font-size:2rem; margin-bottom:0.5rem; color:var(--ansora-strategic-gold);"></i>
                <p style="margin:0;">No notifications yet. Updates regarding your mentorship requests and applications will appear here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notifs.map(n => {
        const title = n.title || "Notification";
        const msg = n.message || "";
        const read = n.read === true;
        const dateStr = n.createdAt ? (n.createdAt.toDate ? n.createdAt.toDate().toLocaleString() : new Date(n.createdAt).toLocaleString()) : "Recently";

        return `
            <div style="background:${read ? 'var(--ansora-soft-grey)' : 'rgba(201, 162, 39, 0.08)'}; border:1px solid ${read ? 'var(--border-color)' : 'var(--ansora-strategic-gold)'}; border-radius:8px; padding:12px 16px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
                <div style="flex:1;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                        <strong style="font-size:0.95rem; color:var(--ansora-deep-black);">${escapeHTML(title)}</strong>
                        ${!read ? '<span style="background:var(--ansora-strategic-gold); color:white; font-size:0.65rem; font-weight:800; padding:2px 6px; border-radius:4px;">NEW</span>' : ''}
                    </div>
                    <p style="margin:0; font-size:0.85rem; color:var(--ansora-graphite); line-height:1.4;">${escapeHTML(msg)}</p>
                    <span style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px; display:block;">${dateStr}</span>
                </div>
                ${!read ? `
                    <button onclick="window.markStudentNotificationRead('${n.id}')" class="btn-action" style="padding:4px 8px; font-size:0.75rem;">Mark Read</button>
                ` : ''}
            </div>
        `;
    }).join("");
}

window.markStudentNotificationRead = async function(notifId) {
    try {
        await updateDoc(doc(db, "notifications", notifId), { read: true });
    } catch(e) {
        console.error("Failed to mark notification read:", e);
    }
};

window.closeStudentNotifModal = function() {
    const modal = document.getElementById("student-notifications-modal");
    if (modal) modal.classList.remove("active");
};

// =====================================================
// STUDENT REAL-TIME MENTORSHIP CHAT & PHOTO ATTACHMENT
// =====================================================

let studentChatUnsubscribe = null;
let activeStudentMentorshipId = null;
let activeStudentMentorId = null;
let studentAttachedPhotoBase64 = null;

function compressImageFile(file, maxWidth = 800, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL("image/jpeg", quality);
                resolve(dataUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

window.openStudentMentorshipChat = function(mentorshipId, mentorName, topic, mentorId, altId) {
    activeStudentMentorshipId = mentorshipId;
    activeStudentMentorId = mentorId || "";

    const modal = document.getElementById("student-chat-modal");
    if (!modal) return;

    document.getElementById("student-chat-mentor-name").textContent = mentorName || "Faculty Mentor";
    document.getElementById("student-chat-mentor-initial").textContent = (mentorName || "F").charAt(0).toUpperCase();
    document.getElementById("student-chat-topic").textContent = topic ? `Topic: ${topic}` : "Accepted 1-on-1 Mentorship";

    modal.classList.add("active");

    initStudentChatListeners();
    subscribeStudentChat(mentorshipId, altId);
};

window.closeStudentChatModal = function() {
    const modal = document.getElementById("student-chat-modal");
    if (modal) modal.classList.remove("active");

    if (studentChatUnsubscribe) {
        studentChatUnsubscribe();
        studentChatUnsubscribe = null;
    }
};

function subscribeStudentChat(mentorshipId, altId) {
    if (studentChatUnsubscribe) {
        studentChatUnsubscribe();
        studentChatUnsubscribe = null;
    }

    const box = document.getElementById("student-chat-messages-box");
    if (!box) return;

    box.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-secondary);">Loading messages...</div>`;

    const candidateIds = new Set();
    if (mentorshipId) candidateIds.add(mentorshipId);
    if (altId && altId !== "undefined") candidateIds.add(altId);

    // Look up matching mentorship request in student's state
    const matched = myMentorshipRequests.find(r => 
        (r.academicianId === activeStudentMentorId || r.mentorId === activeStudentMentorId || r.recipientId === activeStudentMentorId)
    );
    if (matched) {
        if (matched.id) candidateIds.add(matched.id);
        if (matched.requestId) candidateIds.add(matched.requestId);
        if (matched.mentorshipId) candidateIds.add(matched.mentorshipId);
    }

    const idList = Array.from(candidateIds).filter(Boolean);

    const messagesMap = new Map();

    const updateUI = () => {
        const sortedMsgs = Array.from(messagesMap.values()).sort((a, b) => {
            const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
            const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
            return tA - tB;
        });
        renderStudentChatMessages(sortedMsgs);
    };

    const unsubs = [];

    // 1. Subscribe by each candidate mentorship ID
    idList.forEach(id => {
        try {
            const q = query(collection(db, "mentorship_chats"), where("mentorshipId", "==", id));
            const unsub = onSnapshot(q, (snap) => {
                snap.docs.forEach(doc => {
                    messagesMap.set(doc.id, { id: doc.id, ...doc.data() });
                });
                updateUI();
            }, (err) => {
                console.warn(`Snapshot notice for ID ${id}:`, err);
            });
            unsubs.push(unsub);
        } catch(e) {}
    });

    // 2. Subscribe by studentId == currentUser.uid as a fallback for any cross-chat
    if (currentUser?.uid) {
        try {
            const qStudent = query(collection(db, "mentorship_chats"), where("studentId", "==", currentUser.uid));
            const unsubStudent = onSnapshot(qStudent, (snap) => {
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    if (!activeStudentMentorId || data.academicianId === activeStudentMentorId || data.mentorId === activeStudentMentorId || data.senderId === activeStudentMentorId) {
                        messagesMap.set(doc.id, { id: doc.id, ...data });
                    }
                });
                updateUI();
            }, () => {});
            unsubs.push(unsubStudent);
        } catch(e) {}
    }

    studentChatUnsubscribe = () => {
        unsubs.forEach(fn => fn && fn());
    };
}

function renderStudentChatMessages(msgs) {
    const box = document.getElementById("student-chat-messages-box");
    if (!box) return;

    if (msgs.length === 0) {
        box.innerHTML = `
            <div style="text-align:center; margin:auto; padding:2rem; color:var(--text-secondary);">
                <i class="fa-solid fa-comments" style="font-size:2rem; margin-bottom:8px; color:var(--ansora-strategic-gold);"></i>
                <p style="margin:0; font-weight:700; color:var(--ansora-deep-black);">Mentorship Workspace Connected</p>
                <p style="margin:4px 0 0; font-size:0.85rem;">Send a message or share photos with your mentor.</p>
            </div>
        `;
        return;
    }

    box.innerHTML = msgs.map(m => {
        const isMe = m.senderId === currentUser?.uid;
        const timeStr = m.createdAt ? (m.createdAt.toDate ? m.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})) : "Just now";

        const imageHTML = m.imageUrl ? `
            <img src="${escapeHTML(m.imageUrl)}" style="max-width: 100%; max-height: 240px; border-radius: 8px; margin-top: 6px; display: block; cursor: pointer; border: 1px solid rgba(0,0,0,0.1);" onclick="window.open('${escapeHTML(m.imageUrl)}', '_blank')" title="Click to open full photo">
        ` : '';

        const textHTML = m.text ? `<div style="font-size: 0.92rem; line-height: 1.4; word-break: break-word;">${escapeHTML(m.text)}</div>` : '';

        if (isMe) {
            return `
                <div style="align-self: flex-end; max-width: 75%; background: var(--ansora-strategic-gold, #c9a227); color: #ffffff; padding: 10px 14px; border-radius: 14px 14px 2px 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">
                    ${textHTML}
                    ${imageHTML}
                    <div style="font-size: 0.7rem; color: rgba(255,255,255,0.85); text-align: right; margin-top: 4px;">${timeStr}</div>
                </div>
            `;
        } else {
            return `
                <div style="align-self: flex-start; max-width: 75%; background: #ffffff; color: var(--ansora-deep-black); padding: 10px 14px; border-radius: 14px 14px 14px 2px; border: 1px solid var(--border-color); box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--ansora-strategic-gold); margin-bottom: 2px;">${escapeHTML(m.senderName || 'Faculty Mentor')}</div>
                    ${textHTML}
                    ${imageHTML}
                    <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 4px;">${timeStr}</div>
                </div>
            `;
        }
    }).join("");

    box.scrollTop = box.scrollHeight;
}

function initStudentChatListeners() {
    const photoInput = document.getElementById("student-photo-input");
    const photoBtn = document.getElementById("student-photo-trigger-btn");
    const previewBar = document.getElementById("student-photo-preview-bar");
    const previewImg = document.getElementById("student-photo-preview-img");
    const removeBtn = document.getElementById("student-remove-photo-btn");
    const chatForm = document.getElementById("student-chat-form");

    if (photoBtn && photoInput && !photoBtn.dataset.listenerAttached) {
        photoBtn.dataset.listenerAttached = "true";
        photoBtn.addEventListener("click", () => photoInput.click());
    }

    if (photoInput && !photoInput.dataset.listenerAttached) {
        photoInput.dataset.listenerAttached = "true";
        photoInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                studentAttachedPhotoBase64 = await compressImageFile(file);
                if (previewImg) previewImg.src = studentAttachedPhotoBase64;
                if (previewBar) previewBar.style.display = "flex";
            } catch(err) {
                console.error("Photo compression failed:", err);
                alert("Could not load image.");
            }
        });
    }

    if (removeBtn && !removeBtn.dataset.listenerAttached) {
        removeBtn.dataset.listenerAttached = "true";
        removeBtn.addEventListener("click", () => {
            studentAttachedPhotoBase64 = null;
            if (photoInput) photoInput.value = "";
            if (previewBar) previewBar.style.display = "none";
        });
    }

    if (chatForm && !chatForm.dataset.listenerAttached) {
        chatForm.dataset.listenerAttached = "true";
        chatForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const input = document.getElementById("student-chat-input-text");
            const text = input ? input.value.trim() : "";

            if ((!text && !studentAttachedPhotoBase64) || !activeStudentMentorshipId || !currentUser) return;

            const messageText = text;
            const photoData = studentAttachedPhotoBase64;

            if (input) input.value = "";
            studentAttachedPhotoBase64 = null;
            if (photoInput) photoInput.value = "";
            if (previewBar) previewBar.style.display = "none";

            try {
                await addDoc(collection(db, "mentorship_chats"), {
                    mentorshipId: activeStudentMentorshipId,
                    studentId: currentUser.uid,
                    academicianId: activeStudentMentorId,
                    mentorId: activeStudentMentorId,
                    senderId: currentUser.uid,
                    senderName: currentProfile?.fullName || currentProfile?.name || currentUser.displayName || "Student Candidate",
                    senderRole: "student",
                    text: messageText,
                    imageUrl: photoData || null,
                    createdAt: serverTimestamp()
                });

                if (activeStudentMentorId) {
                    await addDoc(collection(db, "notifications"), {
                        userId: activeStudentMentorId,
                        recipientId: activeStudentMentorId,
                        academicianId: activeStudentMentorId,
                        targetRole: "academician",
                        title: `New Mentorship Message from ${currentProfile?.fullName || 'Student'}`,
                        message: photoData ? '📷 [Photo Attached] ' + (messageText || '') : messageText.substring(0, 90),
                        type: "chat",
                        read: false,
                        createdAt: serverTimestamp()
                    });
                }
            } catch(err) {
                console.error("Failed to send student chat message:", err);
                alert("Failed to send message: " + err.message);
            }
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStudentChatListeners);
} else {
    initStudentChatListeners();
}
