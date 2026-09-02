// ==========================================
// SKILLBRIDGE SIGNUP
// ==========================================

const API_URL = (typeof window !== "undefined" && window.API_URL) 
    ? window.API_URL 
    : (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
        ? "http://localhost:5000" 
        : "https://ansora-sim-e5ny.onrender.com");


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


        // ======================================
        // FETCH WITH TIMEOUT (25 seconds)
        // ======================================

        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => {
            controller.abort();
        }, 25000);


        try {

            console.log("Sending OTP request to:", `${API_URL}/send-otp`);


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
                            }),

                        signal: controller.signal
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


            console.log("OTP sent successfully.");


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
                "Unable to send verification code. Please try again.";


            // ======================================
            // TIMEOUT ERROR
            // ======================================

            if (
                error.name === "AbortError"
            ) {

                message =
                    "Request timed out. The server took too long to respond. Please try again.";

            }


            // ======================================
            // NETWORK ERROR
            // ======================================

            else if (
                error instanceof TypeError &&
                error.message.includes("fetch")
            ) {

                message =
                    "Cannot connect to the server. Please check your internet connection and try again.";

            }


            // ======================================
            // SERVER ERROR MESSAGE
            // ======================================

            else if (error.message) {

                message = error.message;

            }


            showError(
                emailError,
                message
            );

        }


        // ======================================
        // ALWAYS STOP SPINNER
        // ======================================

        finally {

            clearTimeout(fetchTimeout);
            setLoading(false);

        }

    }
);