import { auth, db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// ROLE BASED PAGE ROUTING
// =====================================================

const rolePages = {

    student: "student/student-home.html",

    academician: "academician/academician-home.html",

    industry: "industry/index.html",

    institution: "institution/institution-home.html"

};


// =====================================================
// CHECK LOGGED-IN USER
// =====================================================

auth.onAuthStateChanged(async (user) => {

    if (!user) {

        console.log("No user logged in.");

        window.location.href = "login.html";

        return;
    }


    try {

        // Get user's Firestore document
        const userRef = doc(db, "users", user.uid);

        const userSnap = await getDoc(userRef);


        if (!userSnap.exists()) {

            console.error("User document not found.");

            alert("User profile not found.");

            return;
        }


        const userData = userSnap.data();

        const role = userData.role;


        console.log("Logged-in user:", user.email);

        console.log("User role:", role);


        // =================================================
        // CHECK ROLE
        // =================================================

        if (!role) {

            alert("Your account does not have a role assigned.");

            return;
        }


        const normalizedRole =
            role.toString().trim().toLowerCase();


        // =================================================
        // REDIRECT
        // =================================================

        if (rolePages[normalizedRole]) {

            window.location.href =
                rolePages[normalizedRole];

        } else {

            console.error(
                "Unknown user role:",
                normalizedRole
            );

            alert("Invalid user role.");

        }


    } catch (error) {

        console.error(
            "Error checking user role:",
            error
        );

        alert(
            "Unable to determine your account role."
        );

    }

});