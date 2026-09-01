// ==========================================
// EDUBRIDGE — AUTH GUARD (Faculty Module)
// ==========================================

/**
 * DEV_MODE = true  → No Firebase, no redirects. All pages load with
 *                    mock data. Use for local development/preview.
 * DEV_MODE = false → Full Firebase auth + role check.
 *                    Set to false when connecting real backend.
 */
const DEV_MODE = true;

const MOCK_USER = {
  uid: "dev_user",
  role: "academician",
  name: "Dr. Priya Nair",
  fullName: "Dr. Priya Nair",
  designation: "Associate Professor",
  department: "Computer Science & Engineering",
  institution: "ABC Institute of Technology"
};

/**
 * Guards a page: requires authenticated academician.
 * Returns the user data on success.
 */
export async function requireFacultyAuth() {

  // ── DEV MODE: instant return, no Firebase loaded ──
  if (DEV_MODE) {
    updateUIFromAuth(MOCK_USER);
    return MOCK_USER;
  }

  // ── PRODUCTION MODE: dynamic import so Firebase only loads here ──
  const { auth, db } = await import("../../js/firebase-config.js");
  const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js");
  const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js");

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();

      if (!user) {
        window.location.href = "../../login.html";
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (!snap.exists()) {
          window.location.href = "../../login.html";
          return;
        }

        const userData = snap.data();

        if (userData.role !== "academician") {
          window.location.href = "../../index.html";
          return;
        }

        updateUIFromAuth(userData);
        resolve({ uid: user.uid, ...userData });

      } catch (error) {
        console.error("Auth guard error:", error);
        // Network/Firestore error — fall through with mock
        updateUIFromAuth(MOCK_USER);
        resolve(MOCK_USER);
      }
    });
  });
}

/**
 * Update UI elements that show user name/role
 */
function updateUIFromAuth(userData) {
  const name = userData.name || userData.fullName || "Faculty";
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = name);
  document.querySelectorAll("[data-user-initials]").forEach(el => el.textContent = initials);
  document.querySelectorAll("[data-user-dept]").forEach(el => el.textContent = userData.department || "");
  document.querySelectorAll("[data-user-designation]").forEach(el => el.textContent = userData.designation || "");
}

/**
 * Logout
 */
export async function logoutFaculty() {
  if (DEV_MODE) {
    window.location.href = "../../index.html";
    return;
  }
  const { auth } = await import("../../js/firebase-config.js");
  const { signOut } = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js");
  await signOut(auth);
  window.location.href = "../../login.html";
}
