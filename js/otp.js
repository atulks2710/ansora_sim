// ==========================================
// SKILLBRIDGE OTP VERIFICATION
// ==========================================

const API_URL = "http://localhost:5000";


// ==========================================
// GET SIGNUP DATA
// ==========================================

let signupData = null;

try {

    signupData =
        JSON.parse(
            sessionStorage.getItem("signupData")
        );

} catch (error) {

    console.error(
        "Unable to read signup data:",
        error
    );

}


// ==========================================
// CHECK SIGNUP DATA
// ==========================================

if (
    !signupData ||
    !signupData.email
) {

    alert(
        "Signup information is missing. Please start again."
    );

    window.location.href =
        "signup.html";

    throw new Error(
        "Missing signup data."
    );

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


// ==========================================
// SHOW EMAIL
// ==========================================

if (emailDisplay) {

    emailDisplay.textContent =
        signupData.email;

}


// ==========================================
// OTP INPUT BEHAVIOUR
// ==========================================

otpInputs.forEach(
    (input, index) => {


        // ======================================
        // INPUT
        // ======================================

        input.addEventListener(
            "input",
            () => {

                input.value =
                    input.value
                        .replace(/\D/g, "")
                        .slice(0, 1);


                if (
                    input.value &&
                    index <
                        otpInputs.length - 1
                ) {

                    otpInputs[
                        index + 1
                    ].focus();

                }

            }
        );


        // ======================================
        // KEYBOARD NAVIGATION
        // ======================================

        input.addEventListener(
            "keydown",
            (event) => {


                // BACKSPACE

                if (
                    event.key === "Backspace" &&
                    !input.value &&
                    index > 0
                ) {

                    otpInputs[
                        index - 1
                    ].focus();

                }


                // LEFT ARROW

                if (
                    event.key === "ArrowLeft" &&
                    index > 0
                ) {

                    otpInputs[
                        index - 1
                    ].focus();

                }


                // RIGHT ARROW

                if (
                    event.key === "ArrowRight" &&
                    index <
                        otpInputs.length - 1
                ) {

                    otpInputs[
                        index + 1
                    ].focus();

                }

            }
        );

    }
);


// ==========================================
// PASTE OTP
// ==========================================

if (otpInputs.length > 0) {

    otpInputs[0].addEventListener(
        "paste",
        (event) => {

            event.preventDefault();


            const clipboardData =
                event.clipboardData;


            if (!clipboardData) {
                return;
            }


            const pasted =
                clipboardData
                    .getData("text")
                    .replace(/\D/g, "")
                    .slice(
                        0,
                        otpInputs.length
                    );


            pasted
                .split("")
                .forEach(
                    (digit, index) => {

                        if (
                            otpInputs[index]
                        ) {

                            otpInputs[index]
                                .value =
                                digit;

                        }

                    }
                );


            if (
                pasted.length ===
                otpInputs.length
            ) {

                otpInputs[
                    otpInputs.length - 1
                ].focus();

            }

        }
    );

}


// ==========================================
// GET OTP
// ==========================================

function getOTP() {

    let otp = "";


    otpInputs.forEach(
        input => {

            otp +=
                input.value;

        }
    );


    return otp;

}


// ==========================================
// TIMER
// ==========================================

let timeLeft = 300;

let timerInterval = null;


function updateTimer() {

    const minutes =
        Math.floor(
            timeLeft / 60
        );

    const seconds =
        timeLeft % 60;


    if (timerElement) {

        timerElement.textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    }

}


function startTimer() {

    clearInterval(
        timerInterval
    );


    timeLeft = 300;


    updateTimer();


    if (resendButton) {

        resendButton.disabled =
            true;

    }


    timerInterval =
        setInterval(
            () => {

                timeLeft--;


                if (
                    timeLeft <= 0
                ) {

                    clearInterval(
                        timerInterval
                    );


                    timeLeft = 0;


                    if (timerElement) {

                        timerElement.textContent =
                            "Expired";

                    }


                    if (resendButton) {

                        resendButton.disabled =
                            false;

                    }


                    return;

                }


                updateTimer();

            },
            1000
        );

}


startTimer();


// ==========================================
// VERIFY BUTTON LOADING
// ==========================================

function setVerifyLoading(
    loading
) {

    if (!verifyButton) {
        return;
    }


    verifyButton.disabled =
        loading;


    const buttonText =
        verifyButton.querySelector(
            "span"
        );


    if (buttonText) {

        buttonText.textContent =
            loading
                ? "Verifying..."
                : "Verify Email";

    }

}


// ==========================================
// VERIFY OTP
// ==========================================

otpForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const otp =
            getOTP();


        // ======================================
        // VALIDATE OTP
        // ======================================

        if (
            otp.length !==
            otpInputs.length
        ) {

            otpMessage.textContent =
                "Please enter the complete 6-digit OTP.";

            otpMessage.className =
                "otp-message error";

            return;

        }


        // ======================================
        // LOADING
        // ======================================

        setVerifyLoading(true);


        otpMessage.textContent =
            "";

        otpMessage.className =
            "otp-message";


        try {

            console.log(
                "Verifying OTP..."
            );


            // ======================================
            // VERIFY OTP
            // ======================================

            const response =
                await fetch(
                    `${API_URL}/verify-otp`,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                email:
                                    signupData.email,

                                otp:
                                    otp

                            })

                    }
                );


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
                    "Invalid OTP."
                );

            }


            // ======================================
            // SUCCESS
            // ======================================

            console.log(
                "OTP verified successfully."
            );


            otpMessage.textContent =
                "Email verified successfully.";

            otpMessage.className =
                "otp-message success";


            // ======================================
            // SAVE VERIFICATION STATUS
            // ======================================

            sessionStorage.setItem(
                "emailVerified",
                "true"
            );


            // ======================================
            // STOP TIMER
            // ======================================

            clearInterval(
                timerInterval
            );


            // ======================================
            // MOVE TO PASSWORD PAGE
            // ======================================

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


            setVerifyLoading(false);

        }

    }
);


// ==========================================
// RESEND OTP
// ==========================================

resendButton.addEventListener(
    "click",
    async () => {

        resendButton.disabled =
            true;

        resendButton.textContent =
            "Sending...";


        otpMessage.textContent =
            "";

        otpMessage.className =
            "otp-message";


        try {

            console.log(
                "Requesting new OTP..."
            );


            // ======================================
            // SEND NEW OTP
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

                                email:
                                    signupData.email

                            })

                    }
                );


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
                    "Unable to resend OTP."
                );

            }


            // ======================================
            // CLEAR OLD OTP
            // ======================================

            otpInputs.forEach(
                input => {

                    input.value = "";

                }
            );


            // ======================================
            // SUCCESS
            // ======================================

            otpMessage.textContent =
                "A new OTP has been sent to your email.";

            otpMessage.className =
                "otp-message success";


            // ======================================
            // RESET TIMER
            // ======================================

            startTimer();


            // ======================================
            // FOCUS FIRST INPUT
            // ======================================

            if (
                otpInputs.length > 0
            ) {

                otpInputs[0].focus();

            }


            resendButton.textContent =
                "Resend OTP";

        }


        catch (error) {

            console.error(
                "Resend OTP error:",
                error
            );


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