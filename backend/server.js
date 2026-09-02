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
// CORS — allow Vercel frontend + localhost
// ==========================================

const ALLOWED_ORIGINS = [
    "https://ansora-bvsivpv9p-homelander436-ins-projects.vercel.app",
    "https://ansora-sim.vercel.app",
    "http://localhost:3000",
    "http://localhost:5500",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5500"
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Render health checks)
        if (!origin) return callback(null, true);

        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }

        // Also allow any vercel.app subdomain for preview deployments
        if (/\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }

        console.warn("[CORS] Blocked origin:", origin);
        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false
}));

app.use(express.json());


// ==========================================
// OTP STORAGE (in-memory)
// ==========================================

const otpStore = {};


// ==========================================
// EMAIL CONFIGURATION CHECK
// ==========================================

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER) {
    console.error("[CONFIG] FATAL: EMAIL_USER environment variable is missing.");
}

if (!EMAIL_PASS) {
    console.error("[CONFIG] FATAL: EMAIL_PASS environment variable is missing.");
}

if (EMAIL_USER && EMAIL_PASS) {
    console.log("[CONFIG] Email credentials loaded for:", EMAIL_USER);
}


// ==========================================
// GMAIL TRANSPORTER
// ==========================================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    },
    connectionTimeout: 10000,   // 10 seconds to connect
    greetingTimeout: 10000,     // 10 seconds for SMTP greeting
    socketTimeout: 15000        // 15 seconds for socket
});


// ==========================================
// VERIFY TRANSPORTER ON STARTUP
// ==========================================

if (EMAIL_USER && EMAIL_PASS) {
    transporter.verify(function (error) {
        if (error) {
            console.error("[EMAIL] Transporter verification FAILED:", error.message);
        } else {
            console.log("[EMAIL] Transporter is ready. Gmail SMTP connection verified.");
        }
    });
} else {
    console.error("[EMAIL] Skipping transporter verification — credentials missing.");
}


// ==========================================
// OTP GENERATION
// ==========================================

function generateOTP() {
    return crypto.randomInt(100000, 1000000).toString();
}


// ==========================================
// HEALTH CHECK (root)
// ==========================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SkillBridge OTP server is running."
    });
});


// ==========================================
// HEALTH CHECK (detailed)
// ==========================================

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        server: "running",
        emailConfigured: !!(EMAIL_USER && EMAIL_PASS),
        emailUser: EMAIL_USER ? EMAIL_USER.replace(/(.{2}).*(@.*)/, "$1***$2") : "NOT SET"
    });
});


// ==========================================
// SEND OTP
// ==========================================

app.post("/send-otp", async (req, res) => {

    console.log("[OTP] Request received — send-otp");

    // ------------------------------------------
    // Guard: Email credentials must be configured
    // ------------------------------------------

    if (!EMAIL_USER || !EMAIL_PASS) {
        console.error("[OTP] Cannot send — EMAIL_USER or EMAIL_PASS is not configured on the server.");
        return res.status(503).json({
            success: false,
            message: "Email service is not configured. Please contact the administrator."
        });
    }


    // ------------------------------------------
    // Validate email
    // ------------------------------------------

    const email = req.body?.email?.trim().toLowerCase();

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required."
        });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address."
        });
    }


    // ------------------------------------------
    // Rate limiting — 1 OTP per 30 seconds
    // ------------------------------------------

    const existing = otpStore[email];
    if (existing) {
        const secondsSinceLast = (Date.now() - (existing.createdAt || 0)) / 1000;
        if (secondsSinceLast < 30) {
            const wait = Math.ceil(30 - secondsSinceLast);
            return res.status(429).json({
                success: false,
                message: `Please wait ${wait} seconds before requesting a new OTP.`
            });
        }
    }


    // ------------------------------------------
    // Generate OTP
    // ------------------------------------------

    const otp = generateOTP();
    console.log("[OTP] OTP generated for:", email);


    // ------------------------------------------
    // Store OTP
    // ------------------------------------------

    otpStore[email] = {
        otp: otp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,  // 5 minutes
        attempts: 0
    };

    console.log("[OTP] OTP stored with 5-minute expiry");


    // ------------------------------------------
    // Send Email — with explicit timeout
    // ------------------------------------------

    console.log("[OTP] Sending email...");

    const sendTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Email send timeout after 20 seconds")), 20000)
    );

    try {

        await Promise.race([
            transporter.sendMail({
                from: `"SkillBridge" <${EMAIL_USER}>`,
                to: email,
                subject: "Your SkillBridge Verification Code",
                text: `Your SkillBridge verification code is: ${otp}\n\nThis code is valid for 5 minutes. Do not share it with anyone.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #f7f7f7;">
                        <div style="background: white; padding: 30px; border-radius: 10px; border-top: 4px solid #C9A227;">
                            <h2 style="margin-bottom: 10px; color: #0B0B0D;">SkillBridge</h2>
                            <p style="color: #555;">Hello,</p>
                            <p style="color: #555;">Your email verification code is:</p>
                            <div style="font-size: 40px; font-weight: bold; letter-spacing: 12px; margin: 25px 0; color: #C9A227; font-family: monospace;">
                                ${otp}
                            </div>
                            <p style="color: #555;">This code is valid for <strong>5 minutes</strong>.</p>
                            <p style="color: #555;">Do not share this code with anyone.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="color: #999; font-size: 12px;">This email was sent by SkillBridge. If you did not request this, please ignore it.</p>
                        </div>
                    </div>
                `
            }),
            sendTimeout
        ]);

        console.log("[OTP] Email sent successfully to:", email);

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully."
        });

    } catch (error) {

        // Clean up stored OTP since email failed
        delete otpStore[email];

        const safeError = error.message || "Unknown error";
        console.error("[OTP] Email sending FAILED:", safeError);

        // Detect specific error types for better logging
        if (safeError.includes("Invalid login") || safeError.includes("535") || safeError.includes("Username and Password")) {
            console.error("[OTP] Root cause: Gmail authentication failed — check EMAIL_USER and EMAIL_PASS in Render environment variables.");
        } else if (safeError.includes("timeout") || safeError.includes("ETIMEDOUT") || safeError.includes("ECONNREFUSED")) {
            console.error("[OTP] Root cause: Gmail SMTP connection timed out or refused.");
        }

        return res.status(500).json({
            success: false,
            message: "Failed to send verification code. Please try again."
        });
    }

});


// ==========================================
// VERIFY OTP
// ==========================================

app.post("/verify-otp", (req, res) => {

    console.log("[OTP] Request received — verify-otp");

    try {

        const email = req.body?.email?.trim().toLowerCase();
        const otp = req.body?.otp?.trim();

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required."
            });
        }

        const storedData = otpStore[email];

        if (!storedData) {
            console.log("[OTP] No OTP record found for:", email);
            return res.status(400).json({
                success: false,
                message: "OTP not found. Please request a new code."
            });
        }

        // Check expiry
        if (Date.now() > storedData.expiresAt) {
            delete otpStore[email];
            console.log("[OTP] OTP expired for:", email);
            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new code."
            });
        }

        // Check attempts
        if (storedData.attempts >= 5) {
            delete otpStore[email];
            console.log("[OTP] Too many attempts for:", email);
            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Please request a new OTP."
            });
        }

        // Check OTP
        if (storedData.otp !== otp) {
            storedData.attempts++;
            console.log("[OTP] Wrong OTP attempt", storedData.attempts, "for:", email);
            return res.status(400).json({
                success: false,
                message: `Invalid code. ${5 - storedData.attempts} attempts remaining.`
            });
        }

        // OTP correct — clean up immediately (single-use)
        delete otpStore[email];

        console.log("[OTP] OTP verified successfully for:", email);

        return res.status(200).json({
            success: true,
            message: "Email verified successfully."
        });

    } catch (error) {

        console.error("[OTP] Verification error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to verify OTP. Please try again."
        });
    }

});


// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found."
    });
});


// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "CORS: Origin not allowed."
        });
    }
    console.error("[SERVER] Unhandled error:", err.message);
    return res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});


// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] SkillBridge backend running on port ${PORT}`);
});