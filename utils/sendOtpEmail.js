import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendOtpEmail = async (email,otp)=>{
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
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