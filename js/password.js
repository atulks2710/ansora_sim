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

let signupData = null;

try {

    signupData = JSON.parse(
        sessionStorage.getItem("signupData")
    );

} catch (error) {

    console.error(
        "Could not read signup data:",
        error
    );

}


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
    signupData.role
        .toString()
        .trim()
        .toLowerCase();


// ==========================================
// ELEMENTS
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
// CHECK ELEMENTS
// ==========================================

if (!passwordForm) {
    console.error("passwordForm not found.");
}

if (!passwordInput) {
    console.error("password input not found.");
}

if (!confirmPasswordInput) {
    console.error("confirmPassword input not found.");
}

if (!createAccountButton) {
    console.error("createAccountButton not found.");
}


// ==========================================
// PASSWORD REQUIREMENTS
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
    valid
) {

    if (!element) {
        return;
    }


    if (valid) {

        element.classList.add("valid");

    } else {

        element.classList.remove("valid");

    }

}


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


    if (
        password ===
        confirmPassword
    ) {

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
// CONFIRM PASSWORD
// ==========================================

confirmPasswordInput.addEventListener(
    "input",
    () => {

        checkPasswordMatch();

    }
);


// ==========================================
// SHOW / HIDE PASSWORD
// ==========================================

document
    .querySelectorAll(".show-password")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const target =
                    document.getElementById(
                        button.dataset.target
                    );


                if (!target) {
                    return;
                }


                if (
                    target.type === "password"
                ) {

                    target.type = "text";

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

    });


// ==========================================
// ROLE REDIRECT
// ==========================================

function redirectByRole(role) {

    const normalizedRole =
        role
            .toString()
            .trim()
            .toLowerCase();


    console.log(
        "Final signup role:",
        normalizedRole
    );


    switch (normalizedRole) {

        case "student":

            console.log(
                "Redirecting to student..."
            );

            window.location.href =
                "student/student-home.html";

            break;


        case "academician":

            console.log(
                "Redirecting to academician..."
            );

            window.location.href =
                "academician/academician-home.html";

            break;


        case "industry":

            console.log(
                "Redirecting to industry..."
            );

            window.location.href =
                "industry/index.html";

            break;


        case "institution":

            console.log(
                "Redirecting to institution..."
            );

            window.location.href =
                "institution/institution-home.html";

            break;


        default:

            throw new Error(
                `Unknown role: ${normalizedRole}`
            );

    }

}


// ==========================================
// CREATE ACCOUNT
// ==========================================

passwordForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        console.log(
            "Create Account button clicked."
        );


        passwordMessage.textContent =
            "";

        passwordMessage.className =
            "password-message";


        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        // ======================================
        // VALIDATE PASSWORD
        // ======================================

        const rules =
            checkPassword(password);


        const valid =
            rules.length &&
            rules.uppercase &&
            rules.lowercase &&
            rules.number &&
            rules.special;


        if (!valid) {

            passwordMessage.textContent =
                "Please satisfy all password requirements.";

            passwordMessage.className =
                "password-message error";

            return;

        }


        // ======================================
        // CONFIRM PASSWORD
        // ======================================

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


        // ======================================
        // LOADING
        // ======================================

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

            // ======================================
            // CREATE FIREBASE AUTH ACCOUNT
            // ======================================

            console.log(
                "Creating Firebase Authentication account..."
            );


            const credential =
                await createUserWithEmailAndPassword(
                    auth,
                    signupData.email,
                    password
                );


            const user =
                credential.user;


            console.log(
                "Firebase Auth account created."
            );

            console.log(
                "UID:",
                user.uid
            );


            // ======================================
            // UPDATE DISPLAY NAME
            // ======================================

            await updateProfile(
                user,
                {
                    displayName:
                        signupData.name
                }
            );


            console.log(
                "Display name updated."
            );


            // ======================================
            // CREATE FIRESTORE USER DOCUMENT
            // ======================================

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            await setDoc(
                userRef,
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
                        true,

                    createdAt:
                        serverTimestamp()

                }
            );


            console.log(
                "Firestore user document created."
            );


            // ======================================
            // SAVE SESSION
            // ======================================

            sessionStorage.setItem(
                "userUID",
                user.uid
            );


            sessionStorage.setItem(
                "userEmail",
                user.email
            );


            sessionStorage.setItem(
                "userRole",
                userRole
            );


            // ======================================
            // SUCCESS MESSAGE
            // ======================================

            passwordMessage.textContent =
                "Account created successfully.";

            passwordMessage.className =
                "password-message success";


            console.log(
                "Signup completed successfully."
            );


            // ======================================
            // REMOVE TEMP DATA
            // ======================================

            sessionStorage.removeItem(
                "signupData"
            );


            // ======================================
            // REDIRECT
            // ======================================

            setTimeout(
                () => {

                    console.log(
                        "Starting role redirect..."
                    );


                    try {

                        redirectByRole(
                            userRole
                        );

                    }

                    catch (redirectError) {

                        console.error(
                            "Redirect error:",
                            redirectError
                        );


                        passwordMessage.textContent =
                            "Account created, but the selected role page could not be opened.";

                        passwordMessage.className =
                            "password-message error";


                        createAccountButton.disabled =
                            false;


                        if (buttonText) {

                            buttonText.textContent =
                                "Create Account";

                        }

                    }

                },
                700
            );

        }


        catch (error) {

            console.error(
                "================================"
            );

            console.error(
                "ACCOUNT CREATION ERROR"
            );

            console.error(
                "Code:",
                error.code
            );

            console.error(
                "Message:",
                error.message
            );

            console.error(
                "Full error:",
                error
            );

            console.error(
                "================================"
            );


            // ======================================
            // FIREBASE ERRORS
            // ======================================

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
                        "The password is too weak.";

                    break;


                case "auth/network-request-failed":

                    passwordMessage.textContent =
                        "Network error. Please check your internet connection.";

                    break;


                case "permission-denied":

                    passwordMessage.textContent =
                        "Firebase Authentication succeeded, but Firestore permission was denied.";

                    break;


                default:

                    passwordMessage.textContent =
                        error.message ||
                        "Unable to create account.";

            }


            passwordMessage.className =
                "password-message error";


            createAccountButton.disabled =
                false;


            if (buttonText) {

                buttonText.textContent =
                    "Create Account";

            }

        }

    }
);