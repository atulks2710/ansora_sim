// ==========================================
// SKILLBRIDGE - PASSWORD PAGE
// ==========================================


// ==========================================
// FIREBASE
// ==========================================

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


// ==========================================
// GET SIGNUP DATA
// ==========================================

const signupData = JSON.parse(
    sessionStorage.getItem("signupData")
);


// ==========================================
// CHECK SIGNUP DATA
// ==========================================

if (
    !signupData ||
    !signupData.email ||
    !signupData.name ||
    !signupData.role
) {

    alert(
        "Signup information is missing. Please start again."
    );

    window.location.href = "signup.html";

    throw new Error("Missing signup data.");
}


// ==========================================
// NORMALIZE ROLE
// ==========================================

const userRole =
    signupData.role.toString().trim().toLowerCase();


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
    document.getElementById("createAccountButton");


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

    } else {

        element.classList.remove("valid");

    }


    const icon =
        element.querySelector("span");


    if (icon) {

        icon.textContent =
            isValid ? "✓" : "✓";

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


    if (!confirmPassword) {

        matchMessage.textContent = "";

        matchMessage.className =
            "match-message";

        return false;

    }


    if (password === confirmPassword) {

        matchMessage.textContent =
            "Passwords match.";

        matchMessage.className =
            "match-message success";

        return true;

    }


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
// ROLE-BASED REDIRECT
// ==========================================

function redirectAfterSignup(role) {

    const normalizedRole =
        role.toString().trim().toLowerCase();


    console.log(
        "Redirecting user with role:",
        normalizedRole
    );


    switch (normalizedRole) {


        // ==================================
        // STUDENT
        // ==================================

        case "student":

            window.location.href =
                "student/student-home.html";

            break;


        // ==================================
        // ACADEMICIAN
        // ==================================

        case "academician":

            window.location.href =
                "academician/academician-home.html";

            break;


        // ==================================
        // INDUSTRY
        // ==================================

        case "industry":

            window.location.href =
                "industry/index.html";

            break;


        // ==================================
        // INSTITUTION
        // ==================================

        case "institution":

            window.location.href =
                "institution/institution-home.html";

            break;


        // ==================================
        // INVALID ROLE
        // ==================================

        default:

            console.error(
                "Unknown role:",
                normalizedRole
            );

            passwordMessage.textContent =
                "Account created, but the selected role is invalid.";

            passwordMessage.className =
                "password-message error";

            createAccountButton.disabled =
                false;

            createAccountButton.querySelector(
                "span"
            ).textContent =
                "Create Account";

    }

}


// ==========================================
// CREATE ACCOUNT
// ==========================================

passwordForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        passwordMessage.textContent = "";

        passwordMessage.className =
            "password-message";


        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        // ==================================
        // CHECK PASSWORD
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

            passwordMessage.className =
                "password-message error";

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

            passwordMessage.className =
                "password-message error";

            return;

        }


        // ==================================
        // SHOW LOADING
        // ==================================

        createAccountButton.disabled =
            true;


        const buttonText =
            createAccountButton.querySelector(
                "span"
            );


        if (buttonText) {

            buttonText.textContent =
                "Creating Account...";

        }


        try {

            // ==================================
            // CREATE FIREBASE AUTH ACCOUNT
            // ==================================

            console.log(
                "Creating Firebase account..."
            );


            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    signupData.email,
                    password
                );


            const user =
                userCredential.user;


            console.log(
                "Firebase account created:",
                user.uid
            );


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


            console.log(
                "Display name saved."
            );


            // ==================================
            // SAVE USER TO FIRESTORE
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
                        userRole,

                    photoURL:
                        "",

                    profileCompleted:
                        false,

                    emailVerified:
                        false,

                    createdAt:
                        serverTimestamp()

                }
            );


            console.log(
                "User profile saved to Firestore."
            );


            // ==================================
            // SAVE LOGIN DATA
            // ==================================

            sessionStorage.setItem(
                "userRole",
                userRole
            );

            sessionStorage.setItem(
                "userEmail",
                user.email
            );


            // ==================================
            // REMOVE TEMP SIGNUP DATA
            // ==================================

            sessionStorage.removeItem(
                "signupData"
            );


            // ==================================
            // SUCCESS
            // ==================================

            passwordMessage.textContent =
                "Account created successfully! Redirecting...";

            passwordMessage.className =
                "password-message success";


            console.log(
                "Signup completed successfully."
            );


            // ==================================
            // REDIRECT
            // ==================================

            setTimeout(
                () => {

                    redirectAfterSignup(
                        userRole
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
            // ERROR HANDLING
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


                case "permission-denied":

                case "firestore/permission-denied":

                    passwordMessage.textContent =
                        "Account created, but Firestore permission was denied.";

                    break;


                default:

                    passwordMessage.textContent =
                        error.message ||
                        "Unable to create your account.";

            }


            passwordMessage.className =
                "password-message error";


            // ==================================
            // ENABLE BUTTON
            // ==================================

            createAccountButton.disabled =
                false;


            if (buttonText) {

                buttonText.textContent =
                    "Create Account";

            }

        }

    }
);