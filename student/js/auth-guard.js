import { db, auth } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

/**
 * Strict Student Auth Guard
 * - Requires a real Firebase-authenticated user.
 * - Requires users/{uid} to exist.
 * - Requires role === "student".
 * - Does not create demo users or profiles.
 */
export function requireAuth(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "../../login.html";
            return;
        }

        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                console.error("Student profile not found for UID:", user.uid);
                alert("Your SkillBridge profile was not found.");
                await auth.signOut();
                window.location.href = "../../login.html";
                return;
            }

            const profileData = userSnap.data();
            const role = String(profileData.role || "").trim().toLowerCase();

            if (role !== "student") {
                console.error("Wrong role for student portal:", role);
                window.location.href = "../../role-router.html";
                return;
            }

            if (!profileData.skills || typeof profileData.skills !== "object") {
                profileData.skills = {};
            }

            if (!profileData.skillsVerified || typeof profileData.skillsVerified !== "object") {
                profileData.skillsVerified = {};
            }

            callback(user, profileData);

        } catch (error) {
            console.error("Error checking student authentication:", error);
            alert("Unable to load your student profile.");
        }
    });
}
