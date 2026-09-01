// ==========================================
// SKILLBRIDGE SIGNUP
// ==========================================


// FORM

const signupForm =
    document.getElementById("signupForm");


// INPUTS

const nameInput =
    document.getElementById("fullName");

const emailInput =
    document.getElementById("email");

const roleInput =
    document.getElementById("role");


// BUTTON

const continueButton =
    document.getElementById(
        "continueButton"
    );


// LOADING

const loading =
    document.getElementById("loading");


// ERRORS

const nameError =
    document.getElementById("nameError");

const emailError =
    document.getElementById("emailError");

const roleError =
    document.getElementById("roleError");


// ==========================================
// SUBMIT
// ==========================================

signupForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        // Clear errors

        nameError.textContent = "";

        emailError.textContent = "";

        roleError.textContent = "";


        // Get values

        const name =
            nameInput.value.trim();

        const email =
            emailInput.value.trim();

        const role =
            roleInput.value;


        // ==================================
        // NAME VALIDATION
        // ==================================

        if (!name) {

            nameError.textContent =
                "Please enter your full name.";

            nameInput.focus();

            return;

        }


        // ==================================
        // EMAIL VALIDATION
        // ==================================

        if (!email) {

            emailError.textContent =
                "Please enter your email address.";

            emailInput.focus();

            return;

        }


        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailPattern.test(email)) {

            emailError.textContent =
                "Please enter a valid email address.";

            emailInput.focus();

            return;

        }


        // ==================================
        // ROLE VALIDATION
        // ==================================

        if (!role) {

            roleError.textContent =
                "Please select your role.";

            roleInput.focus();

            return;

        }


        try {

            // =================================
            // LOADING
            // =================================

            continueButton.disabled =
                true;

            continueButton.querySelector(
                "span"
            ).textContent =
                "Sending OTP...";


            loading.classList.add(
                "show"
            );


            // =================================
            // SEND OTP
            // =================================

            const response =
                await fetch(
                    "http://localhost:5000/send-otp",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            email: email

                        })

                    }
                );


            const data =
                await response.json();


            // =================================
            // CHECK SERVER RESPONSE
            // =================================

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Unable to send OTP."
                );

            }


            // =================================
            // SAVE SIGNUP DATA
            // =================================

            sessionStorage.setItem(

                "signupData",

                JSON.stringify({

                    name: name,

                    email: email,

                    role: role

                })

            );


            // =================================
            // GO TO OTP
            // =================================

            window.location.href =
                "otp.html";

        }


        catch (error) {

            console.error(
                "Signup error:",
                error
            );


            emailError.textContent =
                error.message ||
                "Unable to send OTP. Please try again.";

            continueButton.disabled =
                false;


            continueButton.querySelector(
                "span"
            ).textContent =
                "Continue with OTP";


            loading.classList.remove(
                "show"
            );

        }

    }
);