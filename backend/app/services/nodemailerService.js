import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const useRealEmail = () =>
  process.env.USE_REAL_EMAIL === "true" || process.env.USE_REAL_EMAIL === "1";

// For local/mock use
export const MOCK_OTP = "1234";

function getSmtpConfig() {
  const user = String(process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim();

  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
    hasCredentials: Boolean(user && pass),
  };
}

function getTransporter() {
  const smtp = getSmtpConfig();
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth,
  });
}

// Load and compile templates
const templatesDir = path.join(__dirname, "..", "templates");
const partialsDir = path.join(templatesDir, "partials");

// Register partials
if (fs.existsSync(partialsDir)) {
  const partialFiles = fs.readdirSync(partialsDir);
  partialFiles.forEach((file) => {
    if (file.endsWith(".hbs")) {
      const partialName = path.basename(file, ".hbs");
      const template = fs.readFileSync(path.join(partialsDir, file), "utf8");
      Handlebars.registerPartial(partialName, template);
    }
  });
}

/**
 * Compile a template with layout
 */
function compileTemplate(templateName, data) {
  const layoutPath = path.join(templatesDir, "layout.hbs");
  const templatePath = path.join(templatesDir, `${templateName}.hbs`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template ${templateName} not found`);
  }

  const templateSource = fs.readFileSync(templatePath, "utf8");
  const body = Handlebars.compile(templateSource)(data);

  if (fs.existsSync(layoutPath)) {
    const layoutSource = fs.readFileSync(layoutPath, "utf8");
    return Handlebars.compile(layoutSource)({ ...data, body });
  }

  return body;
}

/**
 * Send OTP via Email
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.otp - The OTP code
 * @param {string} params.purpose - Purpose of the OTP (e.g., 'customer_signup')
 * @param {number} [params.expiresInMinutes=5] - Expiry time in minutes
 */
export async function sendOtpEmail({ to, otp, purpose, expiresInMinutes = 5 }) {
  const appName = process.env.APP_NAME || "Zeppe";
  const purposeText = purpose.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const smtp = getSmtpConfig();

  if (!useRealEmail()) {
    console.log(`
---------------------------------------
[MOCK EMAIL OTP]
To: ${to}
OTP: ${otp}
Purpose: ${purposeText}
Expires In: ${expiresInMinutes} mins
---------------------------------------
    `);
    return;
  }

  if (!smtp.hasCredentials) {
    const warning = "Real email mode is enabled but SMTP credentials are missing.";
    if (process.env.NODE_ENV === "production") {
      throw new Error(`${warning} Set SMTP_USER/SMTP_PASS (or EMAIL_USER/EMAIL_PASS).`);
    }

    console.warn(`${warning} Falling back to mock OTP email in non-production.`);
    console.log(`
---------------------------------------
[MOCK EMAIL OTP - SMTP MISCONFIGURED]
To: ${to}
OTP: ${otp}
Purpose: ${purposeText}
Expires In: ${expiresInMinutes} mins
---------------------------------------
    `);
    return;
  }

  const from = process.env.SMTP_FROM || `"${appName}" <${smtp.auth.user}>`;

  try {
    const html = compileTemplate("otp", {
      appName,
      year: new Date().getFullYear(),
      otp,
      purposeText,
      expiresInMinutes,
    });

    const mailOptions = {
      from,
      to,
      subject: `${otp} is your ${appName} verification code`,
      html,
    };

    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Nodemailer Error:", error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
