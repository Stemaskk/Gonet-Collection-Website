// /api/contact.js
const nodemailer = require("nodemailer");
const qs = require("querystring");

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (c) => (data += c));
        req.on("end", () => {
            try {
                const ct = req.headers["content-type"] || "";
                if (ct.includes("application/json")) return resolve(JSON.parse(data || "{}"));
                if (ct.includes("application/x-www-form-urlencoded")) return resolve(qs.parse(data));
                resolve({});
            } catch (e) { reject(e); }
        });
    });
}

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const body = await readBody(req);
        const email = String(body.email || "").trim();
        const first_name = String(body.first_name || "").trim();
        const message = String(body.message || "").trim();
        const hp = String(body.website || ""); // honeypot

        if (hp) return res.status(200).json({ ok: true }); // bot: silently ok
        if (!email || !message) return res.status(400).json({ error: "Missing required fields" });

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT || 465),
            secure: String(process.env.SMTP_SECURE || "true") === "true",
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });

        const to = process.env.TO_EMAIL || "gonet@goodonetable.com";
        const from = process.env.FROM_EMAIL || process.env.SMTP_USER;

        await transporter.sendMail({
            to,
            from,
            replyTo: email,
            subject: `GONET Website Contact — ${first_name || "New Message"}`,
            text:
                `From: ${first_name || "(no name)"} <${email}>
----------------------------------------

${message}

----------------------------------------
IP: ${req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown"}`,
        });

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error("contact api error:", err);
        return res.status(500).json({ error: "Email failed" });
    }
};