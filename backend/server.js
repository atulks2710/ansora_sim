// ==========================================
// SKILLBRIDGE OTP BACKEND
// Uses Brevo HTTP API for email (HTTPS port 443)
// Render free tier blocks all outbound SMTP
// ==========================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const https = require("https");

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
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        if (/\.vercel\.app$/.test(origin)) return callback(null, true);
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
// CONFIGURATION CHECK
// ==========================================

const EMAIL_USER  = process.env.EMAIL_USER;
const BREVO_KEY   = process.env.BREVO_API_KEY;

if (!EMAIL_USER)  console.error("[CONFIG] FATAL: EMAIL_USER is not set.");
if (!BREVO_KEY)   console.error("[CONFIG] FATAL: BREVO_API_KEY is not set.");

if (EMAIL_USER && BREVO_KEY) {
    console.log("[CONFIG] Brevo email service configured for sender:", EMAIL_USER);
}


// ==========================================
// SEND EMAIL VIA BREVO HTTP API
// (Uses HTTPS port 443 — allowed on Render free)
// ==========================================

function sendBrevoEmail(toEmail, otp) {
    return new Promise((resolve, reject) => {

        const htmlContent = `
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
        `;

        const payload = JSON.stringify({
            sender: { name: "SkillBridge", email: EMAIL_USER },
            to: [{ email: toEmail }],
            subject: "Your SkillBridge Verification Code",
            htmlContent: htmlContent,
            textContent: `Your SkillBridge verification code is: ${otp}. This code is valid for 5 minutes. Do not share it with anyone.`
        });

        const options = {
            hostname: "api.brevo.com",
            port: 443,
            path: "/v3/smtp/email",
            method: "POST",
            headers: {
                "api-key": BREVO_KEY,
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, statusCode: res.statusCode });
                } else {
                    reject(new Error(`Brevo API returned ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on("error", reject);

        req.setTimeout(20000, () => {
            req.destroy(new Error("Brevo API request timed out after 20 seconds"));
        });

        req.write(payload);
        req.end();
    });
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
        emailProvider: "Brevo HTTP API",
        emailConfigured: !!(EMAIL_USER && BREVO_KEY),
        emailUser: EMAIL_USER
            ? EMAIL_USER.replace(/(.{2}).*(@.*)/, "$1***$2")
            : "NOT SET",
        brevoKeySet: !!BREVO_KEY
    });
});


// ==========================================
// SEND OTP
// ==========================================

app.post("/send-otp", async (req, res) => {

    console.log("[OTP] Request received — send-otp");

    // Guard: credentials must be set
    if (!EMAIL_USER || !BREVO_KEY) {
        console.error("[OTP] Cannot send — EMAIL_USER or BREVO_API_KEY is not configured.");
        return res.status(503).json({
            success: false,
            message: "Email service is not configured. Please contact the administrator."
        });
    }

    // Validate email
    const email = req.body?.email?.trim().toLowerCase();

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }

    // Rate limiting — 1 OTP per 30 seconds per email
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

    // Generate and store OTP
    const otp = generateOTP();
    console.log("[OTP] OTP generated for:", email);

    otpStore[email] = {
        otp: otp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0
    };

    console.log("[OTP] OTP stored with 5-minute expiry");
    console.log("[OTP] Sending email via Brevo...");

    try {

        await sendBrevoEmail(email, otp);
        console.log("[OTP] Email sent successfully via Brevo to:", email);

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully."
        });

    } catch (error) {

        delete otpStore[email];

        const safeError = error.message || "Unknown error";
        console.error("[OTP] Brevo email send FAILED:", safeError);

        if (safeError.includes("401") || safeError.includes("unauthorized")) {
            console.error("[OTP] Root cause: Invalid BREVO_API_KEY — check Render environment variable.");
        } else if (safeError.includes("400")) {
            console.error("[OTP] Root cause: Sender email not verified in Brevo, or bad request.");
        } else if (safeError.includes("timeout")) {
            console.error("[OTP] Root cause: Brevo API request timed out.");
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
        const otp   = req.body?.otp?.trim();

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

        if (Date.now() > storedData.expiresAt) {
            delete otpStore[email];
            console.log("[OTP] OTP expired for:", email);
            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new code."
            });
        }

        if (storedData.attempts >= 5) {
            delete otpStore[email];
            console.log("[OTP] Too many attempts for:", email);
            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Please request a new OTP."
            });
        }

        if (storedData.otp !== otp) {
            storedData.attempts++;
            console.log("[OTP] Wrong OTP attempt", storedData.attempts, "for:", email);
            return res.status(400).json({
                success: false,
                message: `Invalid code. ${5 - storedData.attempts} attempts remaining.`
            });
        }

        // Correct — single-use, delete immediately
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
    res.status(404).json({ success: false, message: "Endpoint not found." });
});


// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({ success: false, message: "CORS: Origin not allowed." });
    }
    console.error("[SERVER] Unhandled error:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error." });
});


// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] SkillBridge backend running on port ${PORT}`);
});