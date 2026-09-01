// ==========================================
// SKILLBRIDGE OTP VERIFICATION
// ==========================================


// ==========================================
// GET SIGNUP DATA
// ==========================================

const signupData =
    JSON.parse(
        sessionStorage.getItem("signupData")
    );


// If user directly opens OTP page
if (!signupData || !signupData.email) {

    window.location.href =
        "signup.html";

}


// ==========================================
// ELEMENTS
// ==========================================

const emailDisplay =
    document.getElementById("emailDisplay");

const otpForm =
    document.getElementById("otpForm");

const otpInputs =
    document.querySelectorAll(".otp-input");

const otpMessage =
    document.getElementById("otpMessage");

const verifyButton =
    document.getElementById("verifyButton");

const timerElement =
    document.getElementById("timer");

const resendButton =
    document.getElementById("resendButton");


// Show email

emailDisplay.textContent =
    signupData.email;


// ==========================================
// OTP INPUT BEHAVIOUR
// ==========================================

otpInputs.forEach(
    (input, index) => {


        input.addEventListener(
            "input",
            () => {

                // Only numbers

                input.value =
                    input.value.replace(
                        /\D/g,
                        ""
                    );


                // Move to next box

                if (
                    input.value &&
                    index <
                    otpInputs.length - 1
                ) {

                    otpInputs[index + 1]
                        .focus();

                }

            }
        );


        // BACKSPACE

        input.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key ===
                    "Backspace" &&
                    !input.value &&
                    index > 0
                ) {

                    otpInputs[index - 1]
                        .focus();

                }

            }
        );


        // LEFT / RIGHT

        input.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "ArrowLeft" &&
                    index > 0
                ) {

                    otpInputs[index - 1]
                        .focus();

                }


                if (
                    event.key === "ArrowRight" &&
                    index <
                    otpInputs.length - 1
                ) {

                    otpInputs[index + 1]
                        .focus();

                }

            }
        );


    }
);


// ==========================================
// PASTE OTP
// ==========================================

otpInputs[0].addEventListener(
    "paste",
    (event) => {

        event.preventDefault();


        const pasted =
            (
                event.clipboardData ||
                window.clipboardData
            )
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);


        pasted
            .split("")
            .forEach(
                (digit, index) => {

                    if (otpInputs[index]) {

                        otpInputs[index]
                            .value = digit;

                    }

                }
            );


        if (pasted.length === 6) {

            otpInputs[5].focus();

        }

    }
);


// ==========================================
// GET OTP
// ==========================================

function getOTP() {

    let otp = "";

    otpInputs.forEach(
        input => {

            otp += input.value;

        }
    );

    return otp;

}


// ==========================================
// TIMER
// ==========================================

let timeLeft = 300;

let timerInterval;


function startTimer() {

    clearInterval(timerInterval);

    timeLeft = 300;

    resendButton.disabled = true;


    timerInterval =
        setInterval(
            () => {

                const minutes =
                    Math.floor(
                        timeLeft / 60
                    );

                const seconds =
                    timeLeft % 60;


                timerElement.textContent =

                    `${String(minutes).padStart(2, "0")}:` +
                    `${String(seconds).padStart(2, "0")}`;


                if (timeLeft <= 0) {

                    clearInterval(
                        timerInterval
                    );

                    timerElement.textContent =
                        "Expired";

                    resendButton.disabled =
                        false;

                }


                timeLeft--;

            },

            1000
        );

}


startTimer();


// ==========================================
// VERIFY OTP
// ==========================================

otpForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const otp =
            getOTP();


        // Validate

        if (otp.length !== 6) {

            otpMessage.textContent =
                "Please enter the complete 6-digit OTP.";

            otpMessage.className =
                "otp-message error";

            return;

        }


        // Loading

        verifyButton.disabled = true;

        verifyButton.querySelector(
            "span"
        ).textContent =
            "Verifying...";


        otpMessage.textContent = "";


        try {

            const response =
                await fetch(
                    "http://localhost:5000/verify-otp",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            email:
                                signupData.email,

                            otp:
                                otp

                        })

                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Invalid OTP."
                );

            }


            // SUCCESS

            otpMessage.textContent =
                "Email verified successfully.";

            otpMessage.className =
                "otp-message success";


            clearInterval(
                timerInterval
            );


            // Move to password

            setTimeout(
                () => {

                    window.location.href =
                        "password.html";

                },

                500
            );

        }


        catch (error) {

            console.error(
                "OTP verification error:",
                error
            );


            otpMessage.textContent =
                error.message ||
                "Invalid OTP.";

            otpMessage.className =
                "otp-message error";


            verifyButton.disabled =
                false;

            verifyButton.querySelector(
                "span"
            ).textContent =
                "Verify Email";

        }

    }
);


// ==========================================
// RESEND OTP
// ==========================================

resendButton.addEventListener(
    "click",
    async () => {

        resendButton.disabled = true;

        resendButton.textContent =
            "Sending...";


        try {

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

                            email:
                                signupData.email

                        })

                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Unable to resend OTP."
                );

            }


            otpInputs.forEach(
                input => {

                    input.value = "";

                }
            );


            otpMessage.textContent =
                "A new OTP has been sent to your email.";

            otpMessage.className =
                "otp-message success";


            resendButton.textContent =
                "Resend OTP";


            startTimer();


            otpInputs[0].focus();

        }


        catch (error) {

            otpMessage.textContent =
                error.message ||
                "Unable to resend OTP.";

            otpMessage.className =
                "otp-message error";


            resendButton.disabled =
                false;

            resendButton.textContent =
                "Resend OTP";

        }

    }
);