// ======================================================
// FIREBASE CLOUD FUNCTIONS
// ======================================================

const { onRequest } = require("firebase-functions/v2/https");
const nodemailer = require("nodemailer");


// ======================================================
// GMAIL CONFIGURATION
// ======================================================

// FOR EDUCATIONAL / LOCAL TESTING ONLY
//
// Do NOT upload a real password to GitHub.
//
// Use your Gmail address and Gmail App Password here.

const EMAIL_USER = "Ansoracreativeagency@gmail.com";

const EMAIL_PASS = "ymbtugqgcanqnwab";


// ======================================================
// CREATE EMAIL TRANSPORTER
// ======================================================

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        user: EMAIL_USER,

        pass: EMAIL_PASS

    }

});


// ======================================================
// SEND OTP
// ======================================================

exports.sendOTP = onRequest(

    {
        cors: true
    },

    async (req, res) => {


        // ------------------------------------------------
        // ONLY POST REQUESTS
        // ------------------------------------------------

        if (req.method !== "POST") {

            return res.status(405).json({

                success: false,

                message: "Method not allowed"

            });

        }


        try {


            // ------------------------------------------------
            // GET DATA FROM FRONTEND
            // ------------------------------------------------

            const {

                email,

                otp

            } = req.body;


            // ------------------------------------------------
            // VALIDATE DATA
            // ------------------------------------------------

            if (!email || !otp) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email and OTP are required"

                });

            }


            console.log(
                `Sending OTP to: ${email}`
            );


            // ------------------------------------------------
            // EMAIL CONTENT
            // ------------------------------------------------

            const mailOptions = {

                from:
                    `"SkillBridge" <${EMAIL_USER}>`,

                to: email,

                subject:
                    "SkillBridge - Email Verification OTP",


                html: `

                    <!DOCTYPE html>

                    <html>

                    <head>

                        <meta charset="UTF-8">

                    </head>


                    <body style="
                        margin:0;
                        padding:0;
                        background:#f4f4f4;
                        font-family:Arial, sans-serif;
                    ">


                        <div style="
                            max-width:600px;
                            margin:40px auto;
                            background:white;
                            padding:40px;
                            border-radius:12px;
                            box-sizing:border-box;
                        ">


                            <h1 style="
                                margin:0 0 10px 0;
                                font-size:30px;
                                color:#111;
                            ">

                                SKILL<span style="
                                    color:#d6a500;
                                ">BRIDGE</span>

                            </h1>


                            <p style="
                                color:#666;
                                font-size:16px;
                            ">

                                Email Verification

                            </p>


                            <hr style="
                                border:none;
                                border-top:1px solid #eee;
                                margin:25px 0;
                            ">


                            <p style="
                                color:#333;
                                font-size:16px;
                                line-height:1.6;
                            ">

                                Welcome to SkillBridge.

                                Use the verification code
                                below to continue creating
                                your account.

                            </p>


                            <div style="
                                margin:30px 0;
                                padding:25px;
                                text-align:center;
                                background:#f7f7f7;
                                border-radius:10px;
                            ">


                                <div style="
                                    font-size:13px;
                                    color:#777;
                                    margin-bottom:10px;
                                    letter-spacing:1px;
                                ">

                                    YOUR VERIFICATION CODE

                                </div>


                                <div style="
                                    font-size:38px;
                                    font-weight:bold;
                                    letter-spacing:8px;
                                    color:#111;
                                ">

                                    ${otp}

                                </div>


                            </div>


                            <p style="
                                color:#666;
                                font-size:14px;
                                line-height:1.6;
                            ">

                                Please do not share this
                                verification code with anyone.

                                If you did not request this
                                code, you can safely ignore
                                this email.

                            </p>


                            <hr style="
                                border:none;
                                border-top:1px solid #eee;
                                margin:30px 0 20px 0;
                            ">


                            <p style="
                                color:#999;
                                font-size:12px;
                                margin:0;
                            ">

                                © 2026 SkillBridge

                            </p>


                        </div>


                    </body>

                    </html>

                `

            };


            // ------------------------------------------------
            // SEND EMAIL
            // ------------------------------------------------

            await transporter.sendMail(
                mailOptions
            );


            // ------------------------------------------------
            // SUCCESS
            // ------------------------------------------------

            console.log(
                `OTP successfully sent to ${email}`
            );


            return res.status(200).json({

                success: true,

                message:
                    "OTP sent successfully"

            });


        }


        catch (error) {


            // ------------------------------------------------
            // ERROR
            // ------------------------------------------------

            console.error(
                "Error sending OTP:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to send OTP",

                error:
                    error.message

            });

        }

    }

);