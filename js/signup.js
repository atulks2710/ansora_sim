// ==========================================
// SKILLBRIDGE SIGNUP
// ==========================================

const API_URL = "http://localhost:5000";


// ==========================================
// ELEMENTS
// ==========================================

const signupForm =
    document.getElementById("signupForm");

const nameInput =
    document.getElementById("fullName");

const emailInput =
    document.getElementById("email");

const roleInput =
    document.getElementById("role");

const continueButton =
    document.getElementById("continueButton");

const loading =
    document.getElementById("loading");

const nameError =
    document.getElementById("nameError");

const emailError =
    document.getElementById("emailError");

const roleError =
    document.getElementById("roleError");


// ==========================================
// CHECK ELEMENTS
// ==========================================

if (!signupForm) {
    console.error("signupForm not found.");
}

if (!nameInput) {
    console.error("fullName input not found.");
}

if (!emailInput) {
    console.error("email input not found.");
}

if (!roleInput) {
    console.error("role input not found.");
}

if (!continueButton) {
    console.error("continueButton not found.");
}


// ==========================================
// EMAIL VALIDATION
// ==========================================

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


// ==========================================
// SHOW ERROR
// ==========================================

function showError(element, message) {

    if (element) {
        element.textContent = message;
    }

}


// ==========================================
// CLEAR ERRORS
// ==========================================

function clearErrors() {

    showError(nameError, "");
    showError(emailError, "");
    showError(roleError, "");

}


// ==========================================
// LOADING STATE
// ==========================================

function setLoading(isLoading) {

    if (continueButton) {

        continueButton.disabled = isLoading;

        const buttonText =
            continueButton.querySelector("span");

        if (buttonText) {

            buttonText.textContent =
                isLoading
                    ? "Sending OTP..."
                    : "Continue with OTP";

        }

    }


    if (loading) {

        if (isLoading) {

            loading.classList.add("show");

        } else {

            loading.classList.remove("show");

        }

    }

}


// ==========================================
// SIGNUP FORM
// ==========================================

signupForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        clearErrors();


        // ======================================
        // GET VALUES
        // ======================================

        const name =
            nameInput.value.trim();

        const email =
            emailInput.value
                .trim()
                .toLowerCase();

        const role =
            roleInput.value
                .trim()
                .toLowerCase();


        // ======================================
        // NAME
        // ======================================

        if (!name) {

            showError(
                nameError,
                "Please enter your full name."
            );

            nameInput.focus();

            return;

        }


        // ======================================
        // EMAIL
        // ======================================

        if (!email) {

            showError(
                emailError,
                "Please enter your email address."
            );

            emailInput.focus();

            return;

        }


        if (!isValidEmail(email)) {

            showError(
                emailError,
                "Please enter a valid email address."
            );

            emailInput.focus();

            return;

        }


        // ======================================
        // ROLE
        // ======================================

        if (!role) {

            showError(
                roleError,
                "Please select your role."
            );

            roleInput.focus();

            return;

        }


        // ======================================
        // START LOADING
        // ======================================

        setLoading(true);


        try {

            console.log(
                "Sending OTP request..."
            );

            console.log(
                "API:",
                `${API_URL}/send-otp`
            );


            // ======================================
            // SEND OTP
            // ======================================

            const response =
                await fetch(
                    `${API_URL}/send-otp`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                email: email
                            })
                    }
                );


            // ======================================
            // READ RESPONSE
            // ======================================

            const data =
                await response.json();


            // ======================================
            // CHECK RESPONSE
            // ======================================

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Unable to send OTP."
                );

            }


            console.log(
                "OTP sent successfully."
            );


            // ======================================
            // SAVE SIGNUP DATA
            // ======================================

            sessionStorage.setItem(
                "signupData",

                JSON.stringify({

                    name:
                        name,

                    email:
                        email,

                    role:
                        role

                })
            );


            // ======================================
            // CLEAR PREVIOUS VERIFICATION
            // ======================================

            sessionStorage.removeItem(
                "emailVerified"
            );


            // ======================================
            // MOVE TO OTP PAGE
            // ======================================

            window.location.href =
                "otp.html";

        }


        catch (error) {

            console.error(
                "Signup error:",
                error
            );


            let message =
                error.message ||
                "Unable to send OTP.";


            // ======================================
            // NETWORK ERROR
            // ======================================

            if (
                error instanceof TypeError
            ) {

                message =
                    "Unable to connect to the OTP server. Make sure server.js is running.";

            }


            showError(
                emailError,
                message
            );


            setLoading(false);

        }

    }
);