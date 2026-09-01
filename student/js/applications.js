import { db } from './firebase-config.js';
import { collection, query, where, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { requireAuth } from './auth-guard.js';

let currentUser = null;
let unsubscribeApps = null;

function normalizeApplicationStatus(status) {
    const value = String(status || "Applied").trim().toLowerCase();
    const map = {
        "applied": "Applied",
        "in review": "In Review",
        "under review": "In Review",
        "shortlisted": "Shortlisted",
        "interview": "Interviewing",
        "interviewing": "Interviewing",
        "interview scheduled": "Interviewing",
        "evaluated": "Evaluated",
        "hired": "Hired",
        "offered": "Hired",
        "selected": "Hired",
        "rejected": "Rejected"
    };
    return map[value] || status || "Applied";
}

document.addEventListener('DOMContentLoaded', () => {
    requireAuth(async (user, profileData) => {
        currentUser = user;
        listenToLiveApplications();
    });
});

function listenToLiveApplications() {
    const grid = document.getElementById('apps-grid');
    if (!grid) return;
    
    grid.innerHTML = '<p class="text-secondary p-4"><i class="fa-solid fa-spinner fa-spin text-accent"></i> Connecting to live application pipeline...</p>';

    if (unsubscribeApps) {
        unsubscribeApps();
    }

    try {
        const appsQuery = query(
            collection(db, "applications"),
            where("studentId", "==", currentUser.uid)
        );

        unsubscribeApps = onSnapshot(appsQuery, (snapshot) => {
            if (snapshot.empty) {
                // Fallback check demo applications
                renderEmptyApplications(grid);
                return;
            }

            const appsList = [];
            snapshot.forEach(docSnap => {
                appsList.push({ id: docSnap.id, ...docSnap.data() });
            });

            // Sort newest first
            appsList.sort((a, b) => {
                const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : (new Date(a.appliedAt || 0).getTime());
                const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : (new Date(b.appliedAt || 0).getTime());
                return timeB - timeA;
            });

            renderApplications(grid, appsList);
        }, (err) => {
            console.error("Applications real-time listener error:", err);
            renderEmptyApplications(grid);
        });

    } catch (e) {
        console.error("Error setting up applications listener:", e);
        renderEmptyApplications(grid);
    }
}

function renderEmptyApplications(grid) {
    grid.innerHTML = `
        <div class="card" style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px;">
            <i class="fa-solid fa-paper-plane text-accent" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">No Active Applications Yet</h2>
            <p class="text-secondary" style="margin-bottom: 1.5rem;">Explore industry opportunities matched with your Skill DNA and apply directly to industry partners.</p>
            <button class="btn-primary-small" onclick="window.location.href='opportunities.html'">Explore Matched Opportunities →</button>
        </div>
    `;
}

function renderApplications(grid, appsList) {
    grid.innerHTML = '';
    
    appsList.forEach(app => {
        const card = document.createElement('div');
        card.className = 'opp-card';
        card.style.position = 'relative';

        const dateStr = app.appliedAt?.toMillis 
            ? new Date(app.appliedAt.toMillis()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
            : 'Recent';

        // Stage status styling
        let statusBadgeHtml = '';
        const status = normalizeApplicationStatus(app.status);

        if (status === 'Applied' || status === 'In Review') {
            statusBadgeHtml = `<div class="match-badge" style="background: #eab308; color: #000;"><i class="fa-regular fa-clock"></i> APPLIED</div>`;
        } else if (status === 'Shortlisted') {
            statusBadgeHtml = `<div class="match-badge" style="background: #3b82f6; color: #fff;"><i class="fa-solid fa-list-check"></i> SHORTLISTED</div>`;
        } else if (status === 'Interviewing' || status === 'Interview Scheduled') {
            statusBadgeHtml = `<div class="match-badge" style="background: #a855f7; color: #fff;"><i class="fa-solid fa-video"></i> INTERVIEWING</div>`;
        } else if (status === 'Evaluated') {
            statusBadgeHtml = `<div class="match-badge" style="background: #06b6d4; color: #fff;"><i class="fa-solid fa-award"></i> EVALUATED & VERIFIED</div>`;
        } else if (status === 'Hired' || status === 'Offered' || status === 'Selected') {
            statusBadgeHtml = `<div class="match-badge" style="background: #10b981; color: #fff;"><i class="fa-solid fa-circle-check"></i> HIRED & PLACED</div>`;
        } else {
            statusBadgeHtml = `<div class="match-badge" style="background: #ef4444; color: #fff;"><i class="fa-solid fa-xmark"></i> ${status.toUpperCase()}</div>`;
        }

        const matchPill = app.matchScore ? `<span style="font-size:0.8rem; font-weight:700; color:var(--accent-blue); background:rgba(201,162,39,0.15); padding:3px 8px; border-radius:4px;">⚡ ${app.matchScore}% Match</span>` : '';

        const matchedTags = Array.isArray(app.matchedSkills) && app.matchedSkills.length > 0 
            ? `<div style="margin-top:0.8rem; font-size:0.8rem; color:var(--text-secondary);">Matched Skills: ${app.matchedSkills.map(s => `<span class="skill-tag have" style="display:inline-block; padding:2px 6px; font-size:0.75rem; margin:2px;"><i class="fa-solid fa-check"></i> ${s}</span>`).join('')}</div>`
            : '';

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                ${statusBadgeHtml}
                ${matchPill}
            </div>

            <div class="opp-header" style="margin-top: 1.2rem;">
                <h2 class="opp-role" style="font-size: 1.25rem;">${app.opportunityTitle || app.role || "Software Engineering Role"}</h2>
                <div class="opp-company" style="font-size: 1rem; color: var(--accent-blue);">${app.companyName || app.company || "Industry Partner"}</div>
            </div>
            
            <div class="opp-meta" style="margin-top: 1rem;">
                <div><i class="fa-solid fa-calendar"></i> Applied: ${dateStr}</div>
                <div><i class="fa-solid fa-diagram-project"></i> Application ID: <span style="font-family:monospace; font-size:0.75rem;">${app.id.slice(0, 8)}</span></div>
            </div>

            ${matchedTags}
            
            <div class="opp-actions" style="margin-top: auto; padding-top: 1rem;">
                <button class="btn-action btn-full" onclick="showApplicationTimeline('${app.id}', '${escape(app.opportunityTitle || 'Opportunity')}', '${escape(app.companyName || 'Company')}', '${status}')">
                    <i class="fa-solid fa-timeline"></i> Track Pipeline Status
                </button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

window.showApplicationTimeline = function(appId, role, company, currentStatus) {
    const unescapedRole = unescape(role);
    const unescapedCompany = unescape(company);

    const stages = ["Applied", "Shortlisted", "Interviewing", "Evaluated", "Hired"];
    const normalizedStatus = normalizeApplicationStatus(currentStatus);
    const currentIndex = stages.indexOf(normalizedStatus) !== -1 ? stages.indexOf(normalizedStatus) : 0;

    let timelineText = `Application Pipeline for: ${unescapedRole} at ${unescapedCompany}\n\nCurrent Stage: ${normalizedStatus.toUpperCase()}\n\n`;
    stages.forEach((stg, i) => {
        const mark = i <= currentIndex ? "✓ [COMPLETED/ACTIVE]" : "○ [PENDING]";
        timelineText += `${mark} Stage ${i + 1}: ${stg}\n`;
    });

    if (normalizedStatus === "Hired") {
        timelineText += "\n🎉 Congratulations! You have received a formal offer & placement from the industry partner.";
    } else if (normalizedStatus === "Evaluated") {
        timelineText += "\n🎖️ The industry team has completed your Competency Evaluation and verified your skills in your Skill Passport!";
    }

    alert(timelineText);
};
