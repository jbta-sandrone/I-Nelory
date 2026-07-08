import nodemailer from "nodemailer";

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const fromEmail = process.env.FROM_EMAIL || "I-Nelory <no-reply@i-nelory.app>";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 465),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export const sendVerificationEmail = async (to: string, token: string) => {
  const verificationUrl = `${clientUrl}/verify-email?token=${token}`;

  console.log("Sending verification email to:", to);

  try {
    const result = await transporter.sendMail({
      from: fromEmail,
      to,
      subject: "Verify your I-Nelory account",
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="color: #047857;">Verify your email</h2>
        <p>Thanks for signing up for I-Nelory. Please verify your email address to continue.</p>
        <p><a href="${verificationUrl}" style="display:inline-block;padding:12px 20px;background:#047857;color:white;text-decoration:none;border-radius:999px;">Verify Email</a></p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
      </div>
    `,
    });

    console.log("Verification email successfully sent to:", to, result);
    return result;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
};
