import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    doc, 
    getDoc,
    setDoc, 
    updateDoc, 
    increment, 
    serverTimestamp,
    query,
    where 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { requireAuth } from './auth-guard.js';

let currentUser = null;
let currentProfile = null;
let existingApplications = new Map(); // oppId -> application doc
let allItems = []; // Contains opportunities + collaborations

document.addEventListener('DOMContentLoaded', () => {
    requireAuth(async (user, profileData) => {
        currentUser = user;
        currentProfile = profileData;
        await loadExistingApplications();
        await initOpportunities();
        setupFilterTabs();
    });
});

async function loadExistingApplications() {
    try {
        if (!currentUser) return;
        const appsQuery = query(collection(db, "applications"), where("studentId", "==", currentUser.uid));
        const snap = await getDocs(appsQuery);
        snap.forEach(d => {
            const data = d.data();
            if (data.opportunityId) {
                existingApplications.set(data.opportunityId, { id: d.id, ...data });
            }
        });
    } catch (e) {
        console.warn("Could not preload applications:", e);
    }
}

/**
 * Standard Explainable Match Score Algorithm
 */
function calculateExplainableMatch(studentSkills = {}, requiredSkills = [], readiness = 75) {
    if (!requiredSkills || requiredSkills.length === 0) {
        return {
            matchScore: 85,
            matchedSkills: Object.keys(studentSkills).slice(0, 3),
            skillGaps: [],
            reason: "General role alignment based on overall student competency profile."
        };
    }

    const matched = [];
    const gaps = [];
    let totalScoreOfMatched = 0;

    requiredSkills.forEach(req => {
        const studentScore = studentSkills[req] || 0;
        if (studentScore >= 55) {
            matched.push({ name: req, score: studentScore });
            totalScoreOfMatched += studentScore;
        } else {
            gaps.push(req);
        }
    });

    const techRatio = matched.length / requiredSkills.length;
    const avgScore = matched.length > 0 ? (totalScoreOfMatched / matched.length) : 50;

    const techComponent = techRatio * 40;
    const profComponent = (avgScore / 100) * 25;
    const roleComponent = (matched.length > 0 ? 18 : 10);
    const readinessComponent = (readiness / 100) * 15;

    const rawScore = Math.round(techComponent + profComponent + roleComponent + readinessComponent);
    const finalScore = Math.max(35, Math.min(rawScore, 98));

    let reason = `High technical alignment in ${matched.map(m => m.name).join(", ") || "core stack"}.`;
    if (gaps.length > 0) {
        reason += ` Recommended bridge learning: ${gaps.slice(0, 2).join(", ")}.`;
    }

    return {
        matchScore: finalScore,
        matchedSkills: matched.map(m => m.name),
        skillGaps: gaps,
        reason: reason
    };
}

async function initOpportunities() {
    const oppGrid = document.getElementById('opp-grid');
    if (!oppGrid) return;
    
    oppGrid.innerHTML = '<p class="text-secondary p-4"><i class="fa-solid fa-spinner fa-spin text-accent"></i> Loading live opportunities and collaborations from Firestore...</p>';

    let opportunities = [];

    // 1. Fetch industry opportunities
    try {
        const querySnapshot = await getDocs(collection(db, "opportunities"));
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            opportunities.push({ 
                id: docSnap.id, 
                ...data,
                isCollaboration: false,
                companyId: data.companyId || data.ownerId || data.institutionId || '',
                role: data.title || data.role || "Software Engineering Role",
                company: data.companyName || data.company || "Industry Partner",
                location: data.location || "Hybrid / Remote",
                duration: data.duration || "6 Months",
                stipend: data.stipend || data.compensation || "Competitive / Standard",
                type: data.type || "Internship",
                deadline: data.deadline || "Open until filled",
                skills: Array.isArray(data.skills) ? data.skills : ["React", "Node.js", "Firebase"]
            });
        });
    } catch (e) {
        console.error("Error fetching opportunities from Firebase:", e);
    }

    // 2. Fetch academician collaborations
    let collaborations = [];
    try {
        const collabSnap = await getDocs(collection(db, "collaborations"));
        collabSnap.forEach((docSnap) => {
            const cdata = docSnap.data();
            collaborations.push({
                id: docSnap.id,
                ...cdata,
                isCollaboration: true,
                role: cdata.title || "Academic Collaboration Proposal",
                company: cdata.organization || cdata.institution || "Academic Institution",
                location: "Academic R&D",
                duration: (cdata.startDate || cdata.endDate) ? `${cdata.startDate || ''} to ${cdata.endDate || 'Ongoing'}` : "Flexible Timeline",
                stipend: "Academic Grant / R&D Project",
                type: "Academic Collaboration",
                deadline: "Open for Collaboration",
                academicianId: cdata.academicianId || cdata.ownerId || "",
                academicianName: cdata.academicianName || cdata.partnerContact || "Academician Faculty",
                description: cdata.description || "No description provided.",
                responsibilities: cdata.responsibilities || ""
            });
        });
    } catch (e) {
        console.warn("Could not fetch academician collaborations for student view:", e);
    }

    // 3. Fetch approved campus recruitment drives and workshops
    let approvedDrives = [];
    try {
        const drivesSnap = await getDocs(collection(db, "campus_drives"));
        drivesSnap.forEach((docSnap) => {
            const ddata = docSnap.data();
            if (ddata.status === "Accepted") {
                approvedDrives.push({
                    id: docSnap.id,
                    ...ddata,
                    isCampusDrive: true,
                    role: `${ddata.driveType || "Campus Drive"}: ${ddata.driveRole || "Technical Immersion"}`,
                    company: ddata.companyName || "Industry Partner",
                    location: ddata.location || "Campus Venue / Hybrid",
                    duration: ddata.driveDate ? `Scheduled Date: ${ddata.driveDate}` : "Flexible Timeline",
                    stipend: `Target Cohort: ${ddata.cohortSize || 50} Students`,
                    type: "Campus Drive / Workshop",
                    deadline: "Campus Drive Approved by Institution",
                    description: `Approved by Institution (${ddata.institutionName || 'IIIT'}). Notes: ${ddata.notes || 'Participation open to eligible students.'}`,
                    skills: ["Campus Placement", "Technical Workshop"]
                });
            }
        });
    } catch (e) {
        console.warn("Could not fetch campus drives for student view:", e);
    }

    allItems = [...opportunities, ...collaborations, ...approvedDrives];
    renderOpportunitiesGrid(allItems);
}

function setupFilterTabs() {
    const filterBtns = document.querySelectorAll('.opp-filters .filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            const filterType = e.currentTarget.getAttribute('data-type') || 'all';
            filterOpportunities(filterType);
        });
    });
}

function filterOpportunities(filterType) {
    if (filterType === 'all') {
        renderOpportunitiesGrid(allItems);
    } else if (filterType === 'Academic Collaboration') {
        const filtered = allItems.filter(item => item.isCollaboration || item.type === 'Academic Collaboration');
        renderOpportunitiesGrid(filtered);
    } else if (filterType === 'Campus Drive') {
        const filtered = allItems.filter(item => item.isCampusDrive || (item.type || '').toLowerCase().includes('campus drive'));
        renderOpportunitiesGrid(filtered);
    } else {
        const filtered = allItems.filter(item => !item.isCollaboration && !item.isCampusDrive && (item.type || '').toLowerCase().includes(filterType.toLowerCase()));
        renderOpportunitiesGrid(filtered);
    }
}

function renderOpportunitiesGrid(items) {
    const oppGrid = document.getElementById('opp-grid');
    if (!oppGrid) return;

    oppGrid.innerHTML = '';

    if (!items || items.length === 0) {
        oppGrid.innerHTML = '<p class="text-secondary p-4" style="grid-column: 1/-1; text-align: center;">No opportunities found for the selected filter.</p>';
        return;
    }

    items.forEach(opp => {
        const card = document.createElement('div');
        card.className = 'opp-card';

        if (opp.isCollaboration) {
            // Render Academician Collaboration Card
            card.innerHTML = `
                <div class="match-badge" style="background: linear-gradient(135deg, #d4af37, #aa7c11); color: #000; font-weight:800;">R&D COLLAB</div>
                <div class="opp-header">
                    <h2 class="opp-role">${opp.role}</h2>
                    <div class="opp-company" style="color: var(--accent); font-weight: 700;">👨‍🏫 ${opp.academicianName} • ${opp.company}</div>
                </div>
                
                <div class="deadline-alert soon"><i class="fa-solid fa-graduation-cap"></i> Academician Collaboration Request</div>
                
                <div class="opp-meta">
                    <div><i class="fa-solid fa-location-dot"></i> ${opp.location}</div>
                    <div><i class="fa-regular fa-clock"></i> ${opp.duration}</div>
                    <div><i class="fa-solid fa-layer-group"></i> ${opp.type}</div>
                </div>
                
                <div class="opp-match-reason">
                    <div class="reason-title">Collaboration Overview & Scope</div>
                    <p style="font-size: 0.85rem; margin-bottom: 0.6rem; color: var(--text-primary); line-height:1.4;">${opp.description}</p>
                    ${opp.responsibilities ? `<p style="font-size: 0.8rem; color: var(--text-secondary);"><strong>Focus / Responsibilities:</strong> ${opp.responsibilities}</p>` : ''}
                </div>
                
                <div class="opp-actions" style="flex-direction:column; gap:8px;">
                    <button class="btn-action btn-full" style="justify-content:center; gap:8px;" onclick="window.viewAcademicianPortfolio('${opp.academicianId}')">
                        <i class="fa-solid fa-id-badge"></i> View Academician Portfolio
                    </button>
                    <button class="btn-primary-small btn-full" style="justify-content:center;" onclick="alert('Collaboration Proposal: ${opp.role}\\nFaculty: ${opp.academicianName}\\nScope: ${opp.responsibilities || opp.description}')">
                        Express Interest
                    </button>
                </div>
            `;
        } else {
            // Render Standard Industry Opportunity Card
            const studentSkills = currentProfile?.skills || {};
            const matchResult = calculateExplainableMatch(studentSkills, opp.skills, currentProfile?.readiness || 80);
            
            const haveHtml = matchResult.matchedSkills.map(s => `<span class="skill-tag have"><i class="fa-solid fa-check"></i> ${s}</span>`).join('');
            const missHtml = matchResult.skillGaps.map(s => `<span class="skill-tag miss"><i class="fa-solid fa-triangle-exclamation"></i> ${s}</span>`).join('');
            
            let deadlineHtml = '';
            if (opp.deadlineStatus === 'urgent') {
                deadlineHtml = `<div class="deadline-alert urgent"><i class="fa-solid fa-circle-exclamation"></i> 🔴 Priority Hiring - ${opp.deadline} left</div>`;
            } else {
                deadlineHtml = `<div class="deadline-alert soon"><i class="fa-solid fa-clock"></i> 🟠 Application Window: ${opp.deadline}</div>`;
            }

            const isAlreadyApplied = existingApplications.has(opp.id);
            const resolvedCompanyId = opp.companyId || opp.ownerId || opp.institutionId || 'system';

            card.innerHTML = `
                <div class="match-badge">${matchResult.matchScore}% MATCH</div>
                <div class="opp-header">
                    <h2 class="opp-role">${opp.role}</h2>
                    <div class="opp-company">${opp.company}</div>
                </div>
                
                ${deadlineHtml}
                
                <div class="opp-meta">
                    <div><i class="fa-solid fa-location-dot"></i> ${opp.location}</div>
                    <div><i class="fa-regular fa-clock"></i> ${opp.duration}</div>
                    <div><i class="fa-solid fa-money-bill"></i> ${opp.stipend}</div>
                    <div><i class="fa-solid fa-layer-group"></i> ${opp.type}</div>
                </div>
                
                <div class="opp-match-reason">
                    <div class="reason-title">SkillDNA Match Analysis</div>
                    <p style="font-size: 0.85rem; margin-bottom: 0.8rem; color: var(--text-primary);">${matchResult.reason}</p>
                    <div class="skills-list">
                        ${haveHtml}
                        ${missHtml}
                    </div>
                </div>
                
                <div class="opp-actions">
                    <button class="btn-action btn-full" onclick="alert('${opp.role} at ${opp.company}\\n\\nRequired Competencies: ${opp.skills.join(', ')}\\nLocation: ${opp.location}\\nCompensation: ${opp.stipend}')">View Details</button>
                    <button class="btn-full ${isAlreadyApplied ? 'btn-done' : 'btn-primary-small btn-apply'}" 
                        data-opp-id="${opp.id}" 
                        data-opp-title="${opp.role}" 
                        data-comp-id="${resolvedCompanyId}" 
                        data-comp-name="${opp.company}"
                        data-match="${matchResult.matchScore}"
                        data-matched="${encodeURIComponent(JSON.stringify(matchResult.matchedSkills))}"
                        data-gaps="${encodeURIComponent(JSON.stringify(matchResult.skillGaps))}"
                        ${isAlreadyApplied ? 'disabled' : ''}>
                        ${isAlreadyApplied ? '✓ Applied' : 'Apply Now'}
                    </button>
                </div>
            `;
        }
        
        oppGrid.appendChild(card);
    });

    // Attach click listeners to Apply buttons for industry opportunities
    document.querySelectorAll('.btn-apply').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const btnEl = e.currentTarget;
            if (btnEl.disabled) return;

            const oppId = btnEl.getAttribute('data-opp-id');
            const oppTitle = btnEl.getAttribute('data-opp-title');
            const compId = btnEl.getAttribute('data-comp-id') || 'system';
            const compName = btnEl.getAttribute('data-comp-name');

            const matchScore = parseInt(btnEl.getAttribute('data-match'), 10) || 85;
            const matchedSkills = JSON.parse(decodeURIComponent(btnEl.getAttribute('data-matched') || '[]'));
            const skillGaps = JSON.parse(decodeURIComponent(btnEl.getAttribute('data-gaps') || '[]'));

            btnEl.textContent = 'Submitting...';
            btnEl.disabled = true;

            try {
                const studentName = currentProfile?.name || currentProfile?.fullName || currentUser.displayName || "Student Candidate";
                const studentEmail = currentUser.email || currentProfile?.email || "student@skillbridge.edu";

                const applicationData = {
                    studentId: currentUser.uid,
                    studentName: studentName,
                    studentEmail: studentEmail,
                    university: currentProfile?.university || "Indian Institute of Information Technology",
                    degree: currentProfile?.degree || "B.Tech Computer Science",
                    gradYear: currentProfile?.gradYear || "2026",
                    opportunityId: oppId,
                    opportunityTitle: oppTitle,
                    companyId: compId,
                    ownerId: compId,
                    institutionId: compId,
                    companyName: compName,
                    matchScore: matchScore,
                    matchedSkills: matchedSkills,
                    skillGaps: skillGaps,
                    studentSkills: currentProfile?.skills || {},
                    status: "Applied",
                    appliedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };

                const appDocRef = await addDoc(collection(db, "applications"), applicationData);
                const appId = appDocRef.id;

                await setDoc(doc(db, "students", currentUser.uid, "applications", appId), {
                    id: appId,
                    oppId: oppId,
                    role: oppTitle,
                    company: compName,
                    companyId: compId,
                    status: "Applied",
                    matchScore: matchScore,
                    appliedAt: serverTimestamp()
                });

                try {
                    const oppDocRef = doc(db, "opportunities", oppId);
                    await updateDoc(oppDocRef, {
                        applicantsCount: increment(1)
                    });
                } catch (err) {
                    // Ignore demo opportunity
                }

                existingApplications.set(oppId, { id: appId, ...applicationData });

                btnEl.textContent = '✓ Applied';
                btnEl.classList.remove('btn-primary-small');
                btnEl.classList.add('btn-done');
                btnEl.disabled = true;

                alert(`Application successfully submitted for "${oppTitle}" at ${compName}!\n\nYour application is now visible to the industry hiring team with an explainable Match Score of ${matchScore}%.`);
            } catch (err) {
                console.error("Error submitting application:", err);
                alert("Failed to submit application: " + err.message);
                btnEl.textContent = 'Apply Now';
                btnEl.disabled = false;
            }
        });
    });
}

window.viewAcademicianPortfolio = async function(academicianId) {
    if (!academicianId) {
        alert("Academician profile ID is missing for this collaboration proposal.");
        return;
    }

    try {
        let isPublic = false;
        const acadRef = doc(db, "academicians", academicianId);
        const acadSnap = await getDoc(acadRef);

        if (acadSnap.exists()) {
            const data = acadSnap.data();
            isPublic = 
                data.settings?.portfolioVisible === true ||
                data.portfolioSettings?.publicPortfolio === true ||
                data.portfolioSettings?.portfolioVisible === true ||
                data.portfolioVisible === true ||
                data.isPublicPortfolio === true ||
                data.isPortfolioPublic === true;
        } else {
            const userRef = doc(db, "users", academicianId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const udata = userSnap.data();
                isPublic = 
                    udata.settings?.portfolioVisible === true ||
                    udata.portfolioSettings?.publicPortfolio === true ||
                    udata.portfolioVisible === true ||
                    udata.isPublicPortfolio === true;
            }
        }

        if (isPublic) {
            window.open(`../academician/portfolio/portfolio.html?uid=${academicianId}&public=1`, '_blank');
        } else {
            alert("🔒 Portfolio Privacy Notice\n\nThis Academician has set their portfolio to Private.\nViewing is restricted unless the Academician enables public portfolio access in settings.");
        }
    } catch (err) {
        console.error("Failed to check Academician portfolio privacy status:", err);
        alert("Could not check portfolio privacy status: " + err.message);
    }
};
