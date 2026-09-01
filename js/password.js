// ==========================================
// SKILLBRIDGE - PASSWORD PAGE
// ==========================================

// ------------------------------------------
// FIREBASE CONFIG
// ------------------------------------------

import {
    auth,
    db
} from "./firebase-config.js";


import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ------------------------------------------
// ROLE ROUTER
// ------------------------------------------

import {
    redirectByRole
} from "./role-router.js";


// ==========================================
// GET SIGNUP DATA
// ==========================================

const signupData =
    JSON.parse(
        sessionStorage.getItem("signupData")
    );


// ------------------------------------------
// CHECK SIGNUP DATA
// ------------------------------------------

if (
    !signupData ||
    !signupData.email ||
    !signupData.name ||
    !signupData.role
) {

    alert(
        "Signup information is missing. Please start again."
    );

    window.location.href =
        "signup.html";
}


// ==========================================
// GET HTML ELEMENTS
// ==========================================

const passwordForm =
    document.getElementById("passwordForm");


const passwordInput =
    document.getElementById("password");


const confirmPasswordInput =
    document.getElementById("confirmPassword");


const passwordMessage =
    document.getElementById("passwordMessage");


const matchMessage =
    document.getElementById("matchMessage");


const createAccountButton =
    document.getElementById(
        "createAccountButton"
    );


// ==========================================
// PASSWORD REQUIREMENT ELEMENTS
// ==========================================

const lengthRequirement =
    document.getElementById("length");


const uppercaseRequirement =
    document.getElementById("uppercase");


const lowercaseRequirement =
    document.getElementById("lowercase");


const numberRequirement =
    document.getElementById("number");


const specialRequirement =
    document.getElementById("special");


// ==========================================
// PASSWORD VALIDATION
// ==========================================

function checkPassword(password) {

    const rules = {

        length:
            password.length >= 8,

        uppercase:
            /[A-Z]/.test(password),

        lowercase:
            /[a-z]/.test(password),

        number:
            /[0-9]/.test(password),

        special:
            /[^A-Za-z0-9]/.test(password)

    };


    // --------------------------------------
    // Update requirement UI
    // --------------------------------------

    updateRequirement(
        lengthRequirement,
        rules.length
    );


    updateRequirement(
        uppercaseRequirement,
        rules.uppercase
    );


    updateRequirement(
        lowercaseRequirement,
        rules.lowercase
    );


    updateRequirement(
        numberRequirement,
        rules.number
    );


    updateRequirement(
        specialRequirement,
        rules.special
    );


    return rules;
}


// ==========================================
// UPDATE REQUIREMENT UI
// ==========================================

function updateRequirement(
    element,
    isValid
) {

    if (!element) {
        return;
    }


    if (isValid) {

        element.classList.add("valid");

        const icon =
            element.querySelector("span");

        if (icon) {
            icon.textContent = "✓";
        }

    } else {

        element.classList.remove("valid");

        const icon =
            element.querySelector("span");

        if (icon) {
            icon.textContent = "✓";
        }

    }

}


// ==========================================
// PASSWORD INPUT
// ==========================================

passwordInput.addEventListener(
    "input",
    () => {

        checkPassword(
            passwordInput.value
        );

        checkPasswordMatch();

    }
);


// ==========================================
// CONFIRM PASSWORD INPUT
// ==========================================

confirmPasswordInput.addEventListener(
    "input",
    () => {

        checkPasswordMatch();

    }
);


// ==========================================
// PASSWORD MATCH
// ==========================================

function checkPasswordMatch() {

    const password =
        passwordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;


    // Nothing typed yet

    if (!confirmPassword) {

        matchMessage.textContent = "";

        matchMessage.className =
            "match-message";

        return false;
    }


    // Passwords match

    if (
        password === confirmPassword
    ) {

        matchMessage.textContent =
            "Passwords match.";

        matchMessage.className =
            "match-message success";

        return true;
    }


    // Passwords don't match

    matchMessage.textContent =
        "Passwords do not match.";

    matchMessage.className =
        "match-message error";

    return false;

}


// ==========================================
// SHOW / HIDE PASSWORD
// ==========================================

const showPasswordButtons =
    document.querySelectorAll(
        ".show-password"
    );


showPasswordButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const targetId =
                    button.dataset.target;


                const target =
                    document.getElementById(
                        targetId
                    );


                if (!target) {
                    return;
                }


                if (
                    target.type ===
                    "password"
                ) {

                    target.type =
                        "text";

                    button.textContent =
                        "Hide";

                } else {

                    target.type =
                        "password";

                    button.textContent =
                        "Show";

                }

            }
        );

    }
);


// ==========================================
// CREATE ACCOUNT
// ==========================================

passwordForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        // Clear previous message

        passwordMessage.textContent = "";


        const password =
            passwordInput.value;


        const confirmPassword =
            confirmPasswordInput.value;


        // ==================================
        // CHECK PASSWORD REQUIREMENTS
        // ==================================

        const rules =
            checkPassword(password);


        const passwordIsValid =
            rules.length &&
            rules.uppercase &&
            rules.lowercase &&
            rules.number &&
            rules.special;


        if (!passwordIsValid) {

            passwordMessage.textContent =
                "Please satisfy all password requirements.";

            return;

        }


        // ==================================
        // CHECK PASSWORD MATCH
        // ==================================

        if (
            password !==
            confirmPassword
        ) {

            passwordMessage.textContent =
                "Passwords do not match.";

            return;

        }


        // ==================================
        // SHOW LOADING
        // ==================================

        createAccountButton.disabled =
            true;


        createAccountButton.querySelector(
            "span"
        ).textContent =
            "Creating Account...";


        try {

            // ==================================
            // CREATE FIREBASE ACCOUNT
            // ==================================

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    signupData.email,
                    password
                );


            const user =
                userCredential.user;


            // ==================================
            // SAVE DISPLAY NAME
            // ==================================

            await updateProfile(
                user,
                {
                    displayName:
                        signupData.name
                }
            );


            // ==================================
            // SAVE USER PROFILE TO FIRESTORE
            // ==================================

            await setDoc(
                doc(
                    db,
                    "users",
                    user.uid
                ),
                {

                    name:
                        signupData.name,

                    email:
                        signupData.email,

                    role:
                        signupData.role,

                    photoURL:
                        "",

                    profileCompleted:
                        false,

                    emailVerified:
                        true,

                    createdAt:
                        serverTimestamp()

                }
            );


            // ==================================
            // REMOVE TEMP SIGNUP DATA
            // ==================================

            sessionStorage.removeItem(
                "signupData"
            );


            // ==================================
            // SUCCESS MESSAGE
            // ==================================

            passwordMessage.textContent =
                "Account created successfully!";

            passwordMessage.className =
                "password-message success";


            // ==================================
            // REDIRECT BY ROLE
            // ==================================

            setTimeout(
                () => {

                    redirectByRole(
                        signupData.role
                    );

                },
                700
            );

        }


        catch (error) {

            console.error(
                "Firebase account creation error:",
                error
            );


            // ==================================
            // FIREBASE ERROR HANDLING
            // ==================================

            switch (error.code) {


                case "auth/email-already-in-use":

                    passwordMessage.textContent =
                        "This email is already registered. Please login.";

                    break;


                case "auth/invalid-email":

                    passwordMessage.textContent =
                        "The email address is invalid.";

                    break;


                case "auth/weak-password":

                    passwordMessage.textContent =
                        "Firebase rejected this password as too weak.";

                    break;


                case "auth/network-request-failed":

                    passwordMessage.textContent =
                        "Network error. Please check your internet connection.";

                    break;


                default:

                    passwordMessage.textContent =
                        error.message ||
                        "Unable to create your account.";

            }


            passwordMessage.className =
                "password-message error";


            // Enable button again

            createAccountButton.disabled =
                false;


            createAccountButton.querySelector(
                "span"
            ).textContent =
                "Create Account";

        }

    }
);