// ==========================================
// SKILLBRIDGE LOGIN
// ==========================================


// ==========================================
// FIREBASE
// ==========================================

import {
    auth,
    db
} from "./firebase-config.js";


import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    sendPasswordResetEmail
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    doc,
    getDoc
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ==========================================
// ELEMENTS
// ==========================================

const loginForm =
    document.getElementById("loginForm");


const emailInput =
    document.getElementById("email");


const passwordInput =
    document.getElementById("password");


const loginButton =
    document.getElementById("loginButton");


const loginMessage =
    document.getElementById("loginMessage");


const emailError =
    document.getElementById("emailError");


const passwordError =
    document.getElementById("passwordError");


const togglePassword =
    document.getElementById("togglePassword");


const rememberMe =
    document.getElementById("rememberMe");


const loginLoading =
    document.getElementById("loginLoading");


const forgotPassword =
    document.getElementById("forgotPassword");


// ==========================================
// SHOW / HIDE PASSWORD
// ==========================================

togglePassword.addEventListener(
    "click",
    () => {

        if (
            passwordInput.type ===
            "password"
        ) {

            passwordInput.type =
                "text";

            togglePassword.textContent =
                "Hide";

        } else {

            passwordInput.type =
                "password";

            togglePassword.textContent =
                "Show";

        }

    }
);


// ==========================================
// EMAIL VALIDATION
// ==========================================

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        // Clear previous messages

        emailError.textContent = "";

        passwordError.textContent = "";

        loginMessage.textContent = "";

        loginMessage.className =
            "login-message";


        const email =
            emailInput.value.trim();


        const password =
            passwordInput.value;


        // ==================================
        // VALIDATE EMAIL
        // ==================================

        if (!email) {

            emailError.textContent =
                "Please enter your email address.";

            emailInput.focus();

            return;

        }


        if (!isValidEmail(email)) {

            emailError.textContent =
                "Please enter a valid email address.";

            emailInput.focus();

            return;

        }


        // ==================================
        // VALIDATE PASSWORD
        // ==================================

        if (!password) {

            passwordError.textContent =
                "Please enter your password.";

            passwordInput.focus();

            return;

        }


        try {

            // ==================================
            // LOADING
            // ==================================

            loginButton.disabled =
                true;


            loginLoading.classList.add(
                "show"
            );


            loginButton.querySelector(
                "span"
            ).textContent =
                "Signing in...";


            // ==================================
            // REMEMBER ME
            // ==================================

            await setPersistence(
                auth,

                rememberMe.checked
                    ? browserLocalPersistence
                    : browserSessionPersistence

            );


            // ==================================
            // FIREBASE LOGIN
            // ==================================

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            // ==================================
            // GET USER PROFILE
            // ==================================

            const userDoc =
                await getDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    )
                );


            if (!userDoc.exists()) {

                throw new Error(
                    "Your account profile could not be found."
                );

            }


            const userData =
                userDoc.data();


            const role =
                userData.role;


            // ==================================
            // SUCCESS
            // ==================================

            loginMessage.textContent =
                "Login successful.";

            loginMessage.className =
                "login-message success";


            // ==================================
            // ROLE ROUTING
            // ==================================

            setTimeout(
                () => {

                    switch (role) {

                        case "student":

                            window.location.href =
                                "student/student-home.html";

                            break;


                        case "academician":

                            window.location.href = "academician/academician-home.html";

                            break;


                        case "industry":

                            window.location.href =
                                "industry/index.html";

                            break;


                        case "institution":

                            window.location.href =
                                "institution/institution-home.html";

                            break;


                        default:

                            window.location.href =
                                "index.html";

                    }

                },

                500
            );

        }


        catch (error) {

            console.error(
                "Login error:",
                error
            );


            // ==================================
            // FIREBASE ERRORS
            // ==================================

            switch (error.code) {


                case "auth/invalid-credential":

                    loginMessage.textContent =
                        "Incorrect email or password.";

                    break;


                case "auth/invalid-email":

                    emailError.textContent =
                        "Invalid email address.";

                    break;


                case "auth/user-not-found":

                    emailError.textContent =
                        "No account found with this email.";

                    break;


                case "auth/wrong-password":

                    passwordError.textContent =
                        "Incorrect password.";

                    break;


                case "auth/too-many-requests":

                    loginMessage.textContent =
                        "Too many failed attempts. Please try again later.";

                    break;


                default:

                    loginMessage.textContent =
                        error.message ||
                        "Unable to login.";

            }


            loginMessage.classList.add(
                "error"
            );


            loginButton.disabled =
                false;


            loginButton.querySelector(
                "span"
            ).textContent =
                "Login to SkillBridge";

        }


        finally {

            loginLoading.classList.remove(
                "show"
            );

        }

    }
);


// ==========================================
// FORGOT PASSWORD
// ==========================================

forgotPassword.addEventListener(
    "click",
    async (event) => {

        event.preventDefault();


        const email =
            emailInput.value.trim();


        if (!email) {

            emailError.textContent =
                "Enter your email first.";

            emailInput.focus();

            return;

        }


        if (!isValidEmail(email)) {

            emailError.textContent =
                "Enter a valid email address.";

            emailInput.focus();

            return;

        }


        try {

            await sendPasswordResetEmail(
                auth,
                email
            );


            loginMessage.textContent =
                "Password reset email sent. Check your inbox.";

            loginMessage.className =
                "login-message success";

        }


        catch (error) {

            console.error(
                "Password reset error:",
                error
            );


            if (
                error.code ===
                "auth/user-not-found"
            ) {

                emailError.textContent =
                    "No account found with this email.";

            }

            else {

                loginMessage.textContent =
                    "Unable to send reset email.";

                loginMessage.className =
                    "login-message error";

            }

        }

    }
);