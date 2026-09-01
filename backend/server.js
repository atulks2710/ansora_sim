require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { Resend } = require("resend");

const app = express();


// ==========================================
// CONFIGURATION
// ==========================================

const PORT = process.env.PORT || 5000;

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;


// ==========================================
// CHECK ENVIRONMENT VARIABLES
// ==========================================

if (!RESEND_API_KEY) {
    console.error("ERROR: RESEND_API_KEY is missing.");
}

if (!EMAIL_FROM) {
    console.error("ERROR: EMAIL_FROM is missing.");
}


// ==========================================
// RESEND
// ==========================================

const resend = new Resend(RESEND_API_KEY);


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());


// ==========================================
// OTP STORAGE
// ==========================================

const otpStore = {};


// ==========================================
// GENERATE OTP
// ==========================================

function generateOTP() {

    return crypto
        .randomInt(100000, 1000000)
        .toString();

}


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "SkillBridge OTP server is running."
    });

});


// ==========================================
// SEND OTP
// ==========================================

app.post("/send-otp", async (req, res) => {

    try {

        const email =
            String(req.body.email || "")
                .trim()
                .toLowerCase();


        // --------------------------------------
        // CHECK EMAIL
        // --------------------------------------

        if (!email) {

            return res.status(400).json({

                success: false,

                message:
                    "Email is required."

            });

        }


        // --------------------------------------
        // GENERATE OTP
        // --------------------------------------

        const otp =
            generateOTP();


        // --------------------------------------
        // STORE OTP
        // --------------------------------------

        otpStore[email] = {

            otp: otp,

            expiresAt:
                Date.now() +
                5 * 60 * 1000,

            attempts: 0

        };


        // --------------------------------------
        // SEND EMAIL
        // --------------------------------------

        const { data, error } =
            await resend.emails.send({

                from: EMAIL_FROM,

                to: [email],

                subject:
                    "Your SkillBridge Verification Code",

                html: `

                    <div style="
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: auto;
                        padding: 30px;
                        color: #222;
                    ">

                        <h1>
                            SkillBridge
                        </h1>

                        <p>
                            Hello,
                        </p>

                        <p>
                            Your verification code is:
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
                            Do not share this code
                            with anyone.
                        </p>

                        <hr>

                        <p style="
                            color: #777;
                            font-size: 13px;
                        ">

                            This email was sent by
                            SkillBridge.

                        </p>

                    </div>

                `

            });


        // --------------------------------------
        // RESEND ERROR
        // --------------------------------------

        if (error) {

            console.error(
                "Resend email error:",
                error
            );


            delete otpStore[email];


            return res.status(500).json({

                success: false,

                message:
                    "Failed to send OTP."

            });

        }


        // --------------------------------------
        // SUCCESS
        // --------------------------------------

        console.log(
            `OTP sent successfully to ${email}`
        );


        res.json({

            success: true,

            message:
                "OTP sent successfully."

        });

    }


    catch (error) {

        console.error(
            "Send OTP error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to send OTP."

        });

    }

});


// ==========================================
// VERIFY OTP
// ==========================================

app.post("/verify-otp", (req, res) => {

    try {

        const email =
            String(req.body.email || "")
                .trim()
                .toLowerCase();

        const otp =
            String(req.body.otp || "")
                .trim();


        // --------------------------------------
        // CHECK INPUT
        // --------------------------------------

        if (!email || !otp) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and OTP are required."

            });

        }


        // --------------------------------------
        // GET STORED OTP
        // --------------------------------------

        const storedData =
            otpStore[email];


        if (!storedData) {

            return res.status(400).json({

                success: false,

                message:
                    "OTP not found. Please request a new OTP."

            });

        }


        // --------------------------------------
        // CHECK EXPIRY
        // --------------------------------------

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


        // --------------------------------------
        // CHECK ATTEMPTS
        // --------------------------------------

        if (
            storedData.attempts >= 5
        ) {

            delete otpStore[email];


            return res.status(400).json({

                success: false,

                message:
                    "Too many incorrect attempts. Please request a new OTP."

            });

        }


        // --------------------------------------
        // CHECK OTP
        // --------------------------------------

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


        // --------------------------------------
        // OTP CORRECT
        // --------------------------------------

        delete otpStore[email];


        res.json({

            success: true,

            message:
                "Email verified successfully."

        });

    }


    catch (error) {

        console.error(
            "Verify OTP error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to verify OTP."

        });

    }

});


// ==========================================
// START SERVER
// ==========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `SkillBridge OTP server running on port ${PORT}`
        );

    }
);