// ==========================================
// SKILLBRIDGE OTP BACKEND
// ==========================================

require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const crypto = require("crypto");

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());


// ==========================================
// OTP STORAGE
// ==========================================

// Stores OTP separately for each email.
//
// Example:
//
// {
//     "student1@gmail.com": {
//         otp: "123456",
//         expiresAt: 123456789,
//         attempts: 0
//     }
// }

const otpStore = {};


// ==========================================
// EMAIL CONFIGURATION CHECK
// ==========================================

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {

    console.warn(
        "WARNING: EMAIL_USER or EMAIL_PASS is missing."
    );

}


// ==========================================
// GMAIL TRANSPORTER
// ==========================================

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS

    }

});


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {

    res.json({

        success: true,

        message:
            "SkillBridge OTP server is running."

    });

});


// ==========================================
// HEALTH CHECK FOR RENDER
// ==========================================

app.get("/health", (req, res) => {

    res.status(200).json({

        success: true,

        message: "OK"

    });

});


// ==========================================
// GENERATE OTP
// ==========================================

function generateOTP() {

    return crypto
        .randomInt(100000, 1000000)
        .toString();

}


// ==========================================
// SEND OTP
// ==========================================

app.post("/send-otp", async (req, res) => {

    try {

        const email =
            req.body.email
                ?.trim()
                .toLowerCase();


        // ======================================
        // VALIDATE EMAIL
        // ======================================

        if (!email) {

            return res.status(400).json({

                success: false,

                message:
                    "Email is required."

            });

        }


        // ======================================
        // BASIC EMAIL VALIDATION
        // ======================================

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailPattern.test(email)) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide a valid email address."

            });

        }


        // ======================================
        // GENERATE OTP
        // ======================================

        const otp =
            generateOTP();


        // ======================================
        // SAVE OTP
        // ======================================

        otpStore[email] = {

            otp: otp,

            expiresAt:
                Date.now() +
                5 * 60 * 1000,

            attempts: 0

        };


        console.log(
            `Generated OTP for ${email}`
        );


        // ======================================
        // SEND EMAIL
        // ======================================

        await transporter.sendMail({

            from:
                `"SkillBridge" <${process.env.EMAIL_USER}>`,

            to:
                email,

            subject:
                "Your SkillBridge Verification OTP",

            text:
                `Your SkillBridge verification OTP is ${otp}. This OTP is valid for 5 minutes. Do not share this OTP with anyone.`,

            html: `

                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: auto;
                    padding: 30px;
                    background: #f7f7f7;
                ">

                    <div style="
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                    ">

                        <h2 style="
                            margin-bottom: 20px;
                        ">
                            SkillBridge
                        </h2>


                        <p>
                            Hello,
                        </p>


                        <p>
                            Your email verification code is:
                        </p>


                        <div style="
                            font-size: 36px;
                            font-weight: bold;
                            letter-spacing: 10px;
                            margin: 25px 0;
                        ">
                            ${otp}
                        </div>


                        <p>
                            This OTP is valid for
                            <strong>5 minutes</strong>.
                        </p>


                        <p>
                            Please do not share this
                            verification code with anyone.
                        </p>


                        <hr>


                        <p style="
                            color: #777;
                            font-size: 13px;
                        ">
                            This email was sent by SkillBridge.
                        </p>

                    </div>

                </div>

            `

        });


        // ======================================
        // SUCCESS
        // ======================================

        console.log(
            `OTP sent successfully to ${email}`
        );


        return res.status(200).json({

            success: true,

            message:
                "OTP sent successfully."

        });

    }


    catch (error) {

        console.error(
            "Email sending error:",
            error
        );


        // Remove OTP if email failed

        const email =
            req.body.email
                ?.trim()
                .toLowerCase();


        if (email) {

            delete otpStore[email];

        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to send OTP. Please try again."

        });

    }

});


// ==========================================
// VERIFY OTP
// ==========================================

app.post("/verify-otp", (req, res) => {

    try {

        const email =
            req.body.email
                ?.trim()
                .toLowerCase();


        const otp =
            req.body.otp
                ?.trim();


        // ======================================
        // VALIDATE INPUT
        // ======================================

        if (!email || !otp) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and OTP are required."

            });

        }


        // ======================================
        // FIND STORED OTP
        // ======================================

        const storedData =
            otpStore[email];


        if (!storedData) {

            return res.status(400).json({

                success: false,

                message:
                    "OTP not found. Please request a new OTP."

            });

        }


        // ======================================
        // CHECK EXPIRY
        // ======================================

        if (
            Date.now() >
            storedData.expiresAt
        ) {

            delete otpStore[email];


            return res.status(400).json({

                success: false,

                message:
                    "OTP expired. Please request a new OTP."

            });

        }


        // ======================================
        // CHECK ATTEMPTS
        // ======================================

        if (
            storedData.attempts >= 5
        ) {

            delete otpStore[email];


            return res.status(429).json({

                success: false,

                message:
                    "Too many incorrect attempts. Please request a new OTP."

            });

        }


        // ======================================
        // CHECK OTP
        // ======================================

        if (
            storedData.otp !== otp
        ) {

            storedData.attempts++;


            return res.status(400).json({

                success: false,

                message:
                    "Invalid OTP."

            });

        }


        // ======================================
        // OTP CORRECT
        // ======================================

        delete otpStore[email];


        console.log(
            `OTP verified successfully for ${email}`
        );


        return res.status(200).json({

            success: true,

            message:
                "Email verified successfully."

        });

    }


    catch (error) {

        console.error(
            "OTP verification error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to verify OTP."

        });

    }

});


// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message:
            "Endpoint not found."

    });

});


// ==========================================
// SERVER
// ==========================================

const PORT =
    process.env.PORT || 10000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `SkillBridge server running on port ${PORT}`
        );

    }
);