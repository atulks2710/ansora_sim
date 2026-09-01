import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { requireAuth } from './auth-guard.js';
import { uploadImageToCloudinary } from './cloudinary.js';

let currentUser = null;
let currentProfile = null;

document.addEventListener('DOMContentLoaded', () => {
    requireAuth(async (user, profileData) => {
        currentUser = user;
        currentProfile = profileData;
        
        // Update header details
        const nameEl = document.getElementById('portfolio-name');
        if (nameEl) nameEl.textContent = profileData.name || profileData.fullName || "Student";
        
        const roleEl = document.getElementById('portfolio-role');
        if (roleEl) roleEl.textContent = `${(profileData.targetRole || 'Full-Stack Developer').toUpperCase()} • Industry Readiness: ${profileData.readiness || 84}%`;

        const avatarImg = document.getElementById('portfolio-avatar');
        if (avatarImg) {
            avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'Student')}&background=C9A227&color=fff&size=150`;
        }
        
        await loadVerifiedSkills();
        await loadPortfolio();
    });

    const certUploadInput = document.getElementById('cert-upload');
    if (certUploadInput) {
        certUploadInput.addEventListener('change', handleUpload);
    }
});

async function loadVerifiedSkills() {
    const passportContainer = document.getElementById('verified-passport-container');
    const badgeCount = document.getElementById('verified-skills-count-badge');
    if (!passportContainer) return;

    try {
        // 1. Fetch from canonical verified_skills collection
        const vQuery = query(collection(db, "verified_skills"), where("studentId", "==", currentUser.uid));
        const snap = await getDocs(vQuery);

        const verifiedList = [];
        snap.forEach(d => {
            verifiedList.push({ id: d.id, ...d.data() });
        });

        // 2. Also check profile skillsVerified map
        const profileVerified = currentProfile?.skillsVerified || {};
        Object.entries(profileVerified).forEach(([skill, details]) => {
            if (!verifiedList.some(v => v.skill === skill)) {
                verifiedList.push({
                    skill: skill,
                    score: details.score || 90,
                    companyName: details.companyName || "Industry Partner",
                    verifiedAt: details.verifiedAt || new Date().toISOString(),
                    verificationStatus: "Verified"
                });
            }
        });

        if (badgeCount) {
            badgeCount.textContent = `${verifiedList.length} Skills Verified`;
        }

        if (verifiedList.length === 0) {
            passportContainer.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px dashed var(--border-color);">
                    <i class="fa-solid fa-shield-halved text-accent" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <h3 style="font-size: 1.1rem; color: var(--text-primary); margin-bottom: 0.25rem;">No Verified Skills Yet</h3>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">Skills are verified when an industry partner completes your Competency Evaluation during internships, live projects, or technical interviews.</p>
                </div>
            `;
            return;
        }

        passportContainer.innerHTML = '';
        verifiedList.forEach(v => {
            const dateStr = v.verifiedAt?.toMillis 
                ? new Date(v.verifiedAt.toMillis()).toLocaleDateString()
                : (typeof v.verifiedAt === 'string' ? new Date(v.verifiedAt).toLocaleDateString() : 'Verified Recently');

            const card = document.createElement('div');
            card.style.cssText = `
                background: var(--bg-card);
                border: 1px solid rgba(201, 162, 39, 0.3);
                border-radius: 12px;
                padding: 1.25rem;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            `;

            card.innerHTML = `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0;">${v.skill}</h3>
                        <span style="background: rgba(16, 185, 129, 0.15); color: var(--success); font-size: 0.75rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; border: 1px solid var(--success);">
                            <i class="fa-solid fa-certificate"></i> VERIFIED
                        </span>
                    </div>

                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                        <i class="fa-solid fa-building text-accent"></i> Verified by: <strong style="color: var(--text-primary);">${v.companyName || 'Industry Partner'}</strong>
                    </div>

                    <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.04); padding: 6px 10px; border-radius: 6px; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.8rem; color: var(--text-secondary);">Competency Score:</span>
                        <strong style="color: var(--accent-blue); font-size: 0.95rem;">${v.score}%</strong>
                    </div>
                </div>

                <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-secondary);">
                    <span>📅 ${dateStr}</span>
                    <span style="color: var(--accent-blue); cursor: pointer;" onclick="alert('Digital Skill Credential Provenance:\\n\\nSkill: ${v.skill}\\nScore: ${v.score}%\\nVerifier: ${v.companyName}\\nVerification ID: ${v.id || 'SB-PROV-9021'}\\nStatus: Verified on SkillBridge Trust Ledger')">View Provenance →</span>
                </div>
            `;
            passportContainer.appendChild(card);
        });

    } catch (e) {
        console.error("Error loading verified skills:", e);
    }
}

async function loadPortfolio() {
    const certsContainer = document.getElementById('certs-container');
    const projectsContainer = document.getElementById('projects-container');
    if (!certsContainer) return;
    
    certsContainer.innerHTML = '<p class="text-secondary">Loading certifications...</p>';

    try {
        const q = query(collection(db, "students", currentUser.uid, "portfolio"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            certsContainer.innerHTML = '<p class="text-secondary">No certifications uploaded yet.</p>';
            if (projectsContainer) {
                projectsContainer.innerHTML = `
                    <div style="padding: 1rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;">
                        <h4 style="margin:0 0 4px 0; color:var(--text-primary);">Cloud Native Distributed Ledger Simulator</h4>
                        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:6px;">High-throughput microservices architecture with Redis cache and Node.js.</p>
                        <span class="skill-tag have" style="display:inline-block; font-size:0.75rem;">Node.js</span>
                        <span class="skill-tag have" style="display:inline-block; font-size:0.75rem;">Docker</span>
                    </div>
                `;
            }
            return;
        }

        certsContainer.innerHTML = '';
        if (projectsContainer) projectsContainer.innerHTML = '';
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            renderPortfolioItem(certsContainer, data);
        });
    } catch (e) {
        console.error("Error loading portfolio:", e);
        certsContainer.innerHTML = '<p class="text-danger">Error loading portfolio items.</p>';
    }
}

function renderPortfolioItem(container, data) {
    const card = document.createElement('div');
    card.className = 'cert-card';
    card.style.cssText = 'display:flex; align-items:center; gap:12px; padding:10px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; margin-bottom:8px;';
    
    let imgHtml = data.imageUrl 
        ? `<img src="${data.imageUrl}" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover;">`
        : `<i class="fa-solid fa-certificate text-accent" style="font-size:24px;"></i>`;

    const dateStr = data.createdAt?.toMillis ? new Date(data.createdAt.toMillis()).toLocaleDateString() : 'Just now';

    card.innerHTML = `
        <div class="cert-icon">${imgHtml}</div>
        <div class="cert-info" style="flex:1;">
            <h4 style="margin:0 0 2px 0; font-size:0.95rem; color:var(--text-primary);">${data.title}</h4>
            <p style="margin:0; font-size:0.75rem; color:var(--text-secondary);">Uploaded ${dateStr}</p>
        </div>
        <div class="verified-badge" style="background: rgba(16, 185, 129, 0.15); color: var(--success); font-size:0.75rem; padding:4px 8px; border-radius:4px;">
            <i class="fa-solid fa-check"></i> Linked
        </div>
    `;
    
    container.appendChild(card);
}

async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const uploadStatus = document.getElementById('upload-status');
    const certsContainer = document.getElementById('certs-container');

    try {
        uploadStatus.style.display = 'block';
        uploadStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading to Cloudinary...';
        
        // 1. Upload to Cloudinary
        const imageUrl = await uploadImageToCloudinary(file);
        
        uploadStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving credential...';

        // 2. Save metadata to Firestore
        const title = prompt("Enter credential/certificate title:", file.name) || "Technical Certification";
        
        const docData = {
            title: title,
            imageUrl: imageUrl,
            type: "certification",
            createdAt: new Date()
        };

        await addDoc(collection(db, "students", currentUser.uid, "portfolio"), docData);
        
        uploadStatus.style.display = 'none';
        alert("Certificate successfully linked to your profile!");
        await loadPortfolio();
    } catch (error) {
        console.error("Upload error:", error);
        uploadStatus.innerHTML = `<span class="text-danger">Upload failed: ${error.message}</span>`;
    }
}
