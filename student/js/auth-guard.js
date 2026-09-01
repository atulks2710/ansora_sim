import { db, auth } from './firebase-config.js';
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

/**
 * Standard SkillBridge Student Auth Guard
 * Connects to real Firebase Auth user or URL param / fallback demo user.
 * Synchronizes with Firestore 'users' and 'students' collections.
 * @param {Function} callback - Called with (user, profileData)
 */
export async function requireAuth(callback) {
    try {
        onAuthStateChanged(auth, async (authUser) => {
            const urlParams = new URLSearchParams(window.location.search);
            let targetUid = authUser ? authUser.uid : urlParams.get('uid');
            let targetName = authUser ? (authUser.displayName || authUser.email?.split('@')[0]) : urlParams.get('name');
            let targetEmail = authUser ? authUser.email : (urlParams.get('email') || "student@ansora.com");
            let isDemo = false;

            if (!targetUid) {
                console.log("No logged-in user or uid passed in URL. Using demo student context.");
                targetUid = "demo-student-001";
                targetName = "Priya Sharma";
                targetEmail = "priya.student@skillbridge.edu";
                isDemo = true;
            }

            const mockUser = {
                uid: targetUid,
                email: targetEmail,
                displayName: targetName || "Student"
            };

            // Check users collection first (canonical)
            const userRef = doc(db, "users", targetUid);
            let userSnap = await getDoc(userRef);

            // Also check students collection for backward compatibility
            const studentRef = doc(db, "students", targetUid);
            let studentSnap = await getDoc(studentRef);

            let profileData = null;

            if (userSnap.exists()) {
                profileData = userSnap.data();
            } else if (studentSnap.exists()) {
                profileData = studentSnap.data();
            }

            if (!profileData) {
                profileData = {
                    uid: targetUid,
                    name: mockUser.displayName,
                    fullName: mockUser.displayName,
                    email: mockUser.email,
                    role: "student",
                    targetRole: "fullstack",
                    university: "Indian Institute of Information Technology",
                    degree: "B.Tech Computer Science",
                    gradYear: "2026",
                    readiness: 84,
                    onboardingComplete: true,
                    skills: {
                        "React": 88,
                        "Node.js": 82,
                        "JavaScript": 90,
                        "Python": 75,
                        "SQL": 70,
                        "Firebase": 85,
                        "Problem Solving": 80
                    },
                    skillsVerified: {
                        "React": {
                            score: 92,
                            companyName: "HyperScale Tech Labs",
                            verifiedAt: new Date().toISOString(),
                            verificationStatus: "Verified"
                        }
                    },
                    breakdown: [
                        { label: "Technical Skills", value: 86 },
                        { label: "Role Alignment", value: 88 },
                        { label: "Industry Evidence", value: 80 },
                        { label: "Problem Solving", value: 82 }
                    ],
                    createdAt: serverTimestamp()
                };

                await setDoc(userRef, profileData, { merge: true });
                await setDoc(studentRef, profileData, { merge: true });
            }

            // Keep both users and students synced
            if (!profileData.skills) profileData.skills = {};
            if (!profileData.skillsVerified) profileData.skillsVerified = {};

            callback(mockUser, profileData);
        });
    } catch (error) {
        console.error("Error fetching user profile in auth-guard:", error);
    }
}
