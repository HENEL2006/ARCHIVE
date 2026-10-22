import nodemailer from "nodemailer";

export const sendOtpEmail = async (email, otp) => {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();

  if (!user || !pass) {
    throw new Error(
      `Email credentials missing: EMAIL_USER=${!!user}, EMAIL_PASS=${!!pass}`,
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: user,
    to: email,
    subject: "ARCHIVE Email Verification",
    html: `
      <h2>Welcome to ARCHIVE</h2>
      <p>Your verification code is:</p>
      <h1>${otp}</h1>
      <p>This code expires in 5 minutes.</p>
    `,
  });
};
