import User from "../../models/User.js";
import Otp from "../../models/Otp.js";
import { sendOtpEmail } from "../../utils/sendOtpEmail.js";
import Referral from "../../models/referral.js";

export const verifyUserOtp = async (userId, enteredOtp) => {
  const otpDoc = await Otp.findOne({ userId });

  if (!otpDoc) {
    throw new Error("OTP NOT FOUND");
  }

  const otpAge = Date.now() - otpDoc.createdAt.getTime();

  if (otpAge > 3 * 60 * 1000) {
    await Otp.deleteOne({ userId });
    throw new Error("OTP EXPIRED, PLEASE REQUEST A NEW OTP");
  }

  if (otpDoc.otp.toString() !== enteredOtp.toString()) {
    throw new Error("INVALID OTP");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isVerified: true },
    { new: true },
  );

  if (user.referredBy) {
    const existingReferral = await Referral.findOne({
      referredUser: user._id,
    });

    if (!existingReferral) {
      const referrer = await User.findById(user.referredBy).select(
        "referralCode",
      );

      if (referrer) {
        await Referral.create({
          referrer: referrer._id,
          referredUser: user._id,
          referralCode: referrer.referralCode,
          status: "PENDING",
        });
      }
    }
  }

  await Otp.deleteOne({ userId });

  return true;
};

export const resendUserOtp = async (userId, email) => {
  await Otp.deleteMany({ userId });

  const generatedOtp = Math.floor(100000 + Math.random() * 900000);
  console.log(generatedOtp);

  await Otp.create({
    userId,
    otp: generatedOtp.toString(),
  });

  await sendOtpEmail(email, generatedOtp);
  return true;
};

export const sendEmailChangeOtp = async (userId, newEmail) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("USER NOT FOUND");
  }

  if (user.googleId) {
    throw new Error("GOOGLE ACCOUNT EMAIL CANNOT BE CHANGED");
  }

  if (!newEmail) {
    throw new Error("EMAIL REQUIRED");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(newEmail)) {
    throw new Error("INVAILD EMAIL ADDRESS");
  }

  const existingUser = await User.findOne({ email: newEmail });

  if (existingUser) {
    throw new Error("EMAIL ALREADY EXISTS");
  }

  await Otp.deleteMany({
    userId,
  });

  const generateOtp = Math.floor(100000 + Math.random() * 900000);
  console.log(generateOtp);

  await Otp.create({
    userId,
    otp: generateOtp.toString(),
  });

  await sendOtpEmail(newEmail, generateOtp);

  return true;
};

export const verifyEmailChangeOtp = async (userId, newEmail, enteredOtp) => {
  const otpDoc = await Otp.findOne({ userId });

  if (!otpDoc) {
    throw new Error("OTP NOT FOUND");
  }

  const otpAge = Date.now() - otpDoc.createdAt.getTime();

  if (otpAge > 3 * 60 * 1000) {
    await Otp.deleteOne({ userId });
    throw new Error("OTP EXPIRED");
  }

  if (otpDoc.otp.toString() !== enteredOtp.toString()) {
    throw new Error("INVALID OTP");
  }

  await User.findByIdAndUpdate(userId, {
    email: newEmail,
  });

  await Otp.deleteOne({ userId });

  return true;
};
