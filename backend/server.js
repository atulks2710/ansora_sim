require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json());


// ==========================================
// OTP STORAGE
// ==========================================

const otpStore = {};


// ==========================================
// EMAIL TRANSPORTER
// ==========================================

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }

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

    const { email } = req.body;


    if (!email) {

        return res.status(400).json({
            success: false,
            message: "Email is required"
        });

    }


    // Generate OTP on SERVER

    const otp = generateOTP();


    // Store OTP

    otpStore[email] = {

        otp: otp,

        expiresAt:
            Date.now() + 5 * 60 * 1000,

        attempts: 0

    };


    try {

        await transporter.sendMail({

            from:
                `"Ansora" <${process.env.EMAIL_USER}>`,

            to: email,

            subject:
                "Your Ansora OTP",

            html: `

                <div style="
                    font-family: Arial;
                    padding: 30px;
                ">

                    <h2>Ansora</h2>

                    <p>
                        Your verification code is:
                    </p>

                    <h1 style="
                        letter-spacing: 8px;
                    ">
                        ${otp}
                    </h1>

                    <p>
                        This OTP is valid for
                        <b>5 minutes</b>.
                    </p>

                    <p>
                        Do not share this OTP with anyone.
                    </p>

                </div>

            `

        });


        console.log(
            `OTP sent to ${email}`
        );


        res.json({

            success: true,

            message:
                "OTP sent successfully"

        });

    }

    catch (error) {

        console.error(
            "Email error:",
            error
        );


        delete otpStore[email];


        res.status(500).json({

            success: false,

            message:
                "Failed to send OTP"

        });

    }

});


// ==========================================
// VERIFY OTP
// ==========================================

app.post("/verify-otp", (req, res) => {

    const { email, otp } = req.body;


    if (!email || !otp) {

        return res.status(400).json({

            success: false,

            message:
                "Email and OTP are required"

        });

    }


    const storedData =
        otpStore[email];


    if (!storedData) {

        return res.status(400).json({

            success: false,

            message:
                "OTP not found. Please request a new OTP."

        });

    }


    // Check expiry

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


    // Check OTP

    if (storedData.otp !== otp) {

        storedData.attempts++;


        return res.status(400).json({

            success: false,

            message:
                "Invalid OTP"

        });

    }


    // OTP correct

    delete otpStore[email];


    res.json({

        success: true,

        message:
            "Email verified successfully"

    });

});


// ==========================================
// SERVER
// ==========================================

const PORT =
    process.env.PORT || 5000;


app.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});