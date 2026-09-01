import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    doc, 
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

document.addEventListener('DOMContentLoaded', () => {
    requireAuth(async (user, profileData) => {
        currentUser = user;
        currentProfile = profileData;
        await loadExistingApplications();
        await initOpportunities();
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
 * @param {Object} studentSkills - Student's skill map (e.g. { "React": 88, "Node.js": 80 })
 * @param {Array} requiredSkills - List of required skills from opportunity
 * @param {number} readiness - Student overall readiness index (0-100)
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

    // Explainable Weights:
    // Technical Match: 40%
    // Proficiency Level: 25%
    // Role & Project Alignment: 20%
    // Student Readiness Factor: 15%
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
    
    oppGrid.innerHTML = '<p class="text-secondary p-4"><i class="fa-solid fa-spinner fa-spin text-accent"></i> Loading live industry opportunities from Firestore...</p>';

    let opportunities = [];

    try {
        const querySnapshot = await getDocs(collection(db, "opportunities"));
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            opportunities.push({ 
                id: docSnap.id, 
                ...data,
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

    // Default Seed/Demo Opportunities if Firestore collection is totally empty
    if (opportunities.length === 0) {
        opportunities = [
            {
                id: "opp_canonical_1",
                role: "Full-Stack Software Engineer (Apprentice)",
                company: "HyperScale Tech Labs",
                companyId: "comp_hyperscale",
                location: "Bengaluru, India (Hybrid)",
                duration: "6 Months",
                stipend: "₹35,000 / month",
                type: "Internship",
                deadline: "7 days",
                deadlineStatus: "urgent",
                skills: ["React", "Node.js", "Firebase", "TypeScript"]
            },
            {
                id: "opp_canonical_2",
                role: "AI / ML Systems Engineering Intern",
                company: "Cognitive Matrix AI",
                companyId: "comp_cognitive",
                location: "Hyderabad, India (Remote)",
                duration: "6 Months",
                stipend: "₹45,000 / month",
                type: "Internship",
                deadline: "14 days",
                deadlineStatus: "soon",
                skills: ["Python", "PyTorch", "Machine Learning", "Docker"]
            },
            {
                id: "opp_canonical_3",
                role: "Cloud Infrastructure Specialist",
                company: "Apex Cloud Networks",
                companyId: "comp_apex",
                location: "Pune, India (Hybrid)",
                duration: "3 Months",
                stipend: "₹30,000 / month",
                type: "Project",
                deadline: "20 days",
                deadlineStatus: "soon",
                skills: ["Cloud", "Docker", "Problem Solving", "SQL"]
            }
        ];
    }

    oppGrid.innerHTML = '';
    
    opportunities.forEach(opp => {
        const studentSkills = currentProfile?.skills || {};
        const matchResult = calculateExplainableMatch(studentSkills, opp.skills, currentProfile?.readiness || 80);

        const card = document.createElement('div');
        card.className = 'opp-card';
        
        const haveHtml = matchResult.matchedSkills.map(s => `<span class="skill-tag have"><i class="fa-solid fa-check"></i> ${s}</span>`).join('');
        const missHtml = matchResult.skillGaps.map(s => `<span class="skill-tag miss"><i class="fa-solid fa-triangle-exclamation"></i> ${s}</span>`).join('');
        
        let deadlineHtml = '';
        if (opp.deadlineStatus === 'urgent') {
            deadlineHtml = `<div class="deadline-alert urgent"><i class="fa-solid fa-circle-exclamation"></i> 🔴 Priority Hiring - ${opp.deadline} left</div>`;
        } else {
            deadlineHtml = `<div class="deadline-alert soon"><i class="fa-solid fa-clock"></i> 🟠 Application Window: ${opp.deadline}</div>`;
        }

        const isAlreadyApplied = existingApplications.has(opp.id);

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
                    data-comp-id="${opp.companyId || 'comp_general'}" 
                    data-comp-name="${opp.company}"
                    data-match="${matchResult.matchScore}"
                    data-matched="${encodeURIComponent(JSON.stringify(matchResult.matchedSkills))}"
                    data-gaps="${encodeURIComponent(JSON.stringify(matchResult.skillGaps))}"
                    ${isAlreadyApplied ? 'disabled' : ''}>
                    ${isAlreadyApplied ? '✓ Applied' : 'Apply Now'}
                </button>
            </div>
        `;
        
        oppGrid.appendChild(card);
    });

    // Attach click listeners to Apply buttons
    document.querySelectorAll('.btn-apply').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const btnEl = e.currentTarget;
            if (btnEl.disabled) return;

            const oppId = btnEl.getAttribute('data-opp-id');
            const oppTitle = btnEl.getAttribute('data-opp-title');
            const compId = btnEl.getAttribute('data-comp-id');
            const compName = btnEl.getAttribute('data-comp-name');
            const matchScore = parseInt(btnEl.getAttribute('data-match'), 10) || 85;
            const matchedSkills = JSON.parse(decodeURIComponent(btnEl.getAttribute('data-matched') || '[]'));
            const skillGaps = JSON.parse(decodeURIComponent(btnEl.getAttribute('data-gaps') || '[]'));

            btnEl.textContent = 'Submitting...';
            btnEl.disabled = true;

            try {
                const studentName = currentProfile?.name || currentProfile?.fullName || currentUser.displayName || "Student Candidate";
                const studentEmail = currentUser.email || currentProfile?.email || "student@skillbridge.edu";

                // 1. Create canonical application record in Firestore "applications" collection
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

                // 2. Also save to student's subcollection for instant local lookup
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

                // 3. Increment applicant count on opportunity if doc exists in Firestore
                try {
                    const oppDocRef = doc(db, "opportunities", oppId);
                    await updateDoc(oppDocRef, {
                        applicantsCount: increment(1)
                    });
                } catch (err) {
                    // Opportunity might be a demo item, ignore
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
