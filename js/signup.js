// ==========================================
// SKILLBRIDGE SIGNUP
// ==========================================

const API_URL =
    "https://ansora-sim.onrender.com";


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
// EMAIL VALIDATION
// ==========================================

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


// ==========================================
// LOADING STATE
// ==========================================

function setLoading(isLoading) {

    continueButton.disabled =
        isLoading;


    const buttonText =
        continueButton.querySelector("span");


    if (buttonText) {

        buttonText.textContent =
            isLoading
                ? "Sending OTP..."
                : "Continue with OTP";

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
// SUBMIT
// ==========================================

signupForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        // ======================================
        // CLEAR ERRORS
        // ======================================

        nameError.textContent = "";
        emailError.textContent = "";
        roleError.textContent = "";


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
        // NAME VALIDATION
        // ======================================

        if (!name) {

            nameError.textContent =
                "Please enter your full name.";

            nameInput.focus();

            return;

        }


        // ======================================
        // EMAIL VALIDATION
        // ======================================

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


        // ======================================
        // ROLE VALIDATION
        // ======================================

        if (!role) {

            roleError.textContent =
                "Please select your role.";

            roleInput.focus();

            return;

        }


        // ======================================
        // LOADING
        // ======================================

        setLoading(true);


        try {

            console.log(
                "Requesting OTP from Render..."
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

            const text =
                await response.text();


            let data = null;


            try {

                data =
                    JSON.parse(text);

            } catch {

                throw new Error(
                    "The OTP server returned an invalid response."
                );

            }


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
            // CLEAR OLD VERIFICATION STATE
            // ======================================

            sessionStorage.removeItem(
                "emailVerified"
            );


            // ======================================
            // GO TO OTP PAGE
            // ======================================

            window.location.href =
                "otp.html";

        }


        catch (error) {

            console.error(
                "Signup/OTP error:",
                error
            );


            let errorMessage =
                error.message ||
                "Unable to send OTP.";


            // ======================================
            // NETWORK ERROR
            // ======================================

            if (
                error instanceof TypeError
            ) {

                errorMessage =
                    "Unable to connect to the OTP server. Please try again.";

            }


            emailError.textContent =
                errorMessage;


            setLoading(false);

        }

    }
);