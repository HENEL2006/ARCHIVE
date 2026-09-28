import User from "../../models/User.js";
import bcrypt from "bcrypt";
import Otp from "../../models/Otp.js";
import { sendOtpEmail } from "../../utils/sendOtpEmail.js";
import { isPasswordValid } from "../../public/JS/passwordValidation.js";
import passport from "passport";
import generateReferralCode from "../../utils/generateReferralCode.js";

export const signupUser = async (userData) => {
  const { username, email, password, confirmPassword, referralCode } = userData;

  if (!username || !email || !password || !confirmPassword) {
    throw new Error("ALL FIELDS REQUIRED");
  }

  const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

  if (!nameRegex.test(username.trim())) {
    throw new Error("NAME CAN ONLY CONTAIN LETTERS AND SPACES");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new Error("INVALID EMAIL ADDRESS");
  }

  if (!isPasswordValid(password)) {
    throw new Error("INVALID PASSWORD FORMAT");
  }

  if (username.trim().length < 3) {
    throw new Error("USERNAME MUST BE AT LEAST 3 CHARACTERS");
  }

  if (password !== confirmPassword) {
    throw new Error("PASSWORDS DO NOT MATCH");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.isVerified) {
      throw new Error("USER ALREADY EXISTS");
    }

    await Otp.deleteMany({
      userId: existingUser._id,
    });

    await User.deleteOne({
      _id: existingUser._id,
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(hashedPassword);

  const generatedReferralCode = await generateReferralCode();

  const newUserData = {
    username,
    email,
    password: hashedPassword,
    isVerified: false,
    referralCode: generatedReferralCode,
  };

  if (referralCode) {
    const referrer = await User.findOne({
      referralCode: referralCode.trim().toUpperCase(),
      isDeleted: false,
      isBlocked: false,
    });

    if (!referrer) {
      throw new Error("INVALID REFERRAL CODE");
    }

    newUserData.referredBy = referrer._id;
  }

  const user = await User.create(newUserData);

  user.customerId = `CUS-${user._id.toString().slice(-6).toUpperCase()}`;
  await user.save();

  const generatedOtp = Math.floor(100000 + Math.random() * 900000);
  console.log(generatedOtp);

  await Otp.create({
    userId: user._id,
    otp: generatedOtp.toString(),
  });

  await sendOtpEmail(email, generatedOtp);

  return user;
};

export const loginUser = async (loginData) => {
  const { email, password } = loginData;

  const user = await User.findOne({ email });

  if (!email || !password) {
    throw new Error("ALL FIELDS REQUIRED");
  }
  if (!user) {
    throw new Error("USER NOT FOUND");
  }

  if (user.isDeleted) {
    throw new Error("THIS ACCOUNT HAS BEEN DELETED");
  }

  if (user.isBlocked) {
    throw new Error("YOUR ACCOUNT HAS BEEN BLOCKED");
  }

  if (!user.isVerified) {
    throw new Error("PLEASE VERIFY THE EMAIL");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new Error("INVAID PASSWORD");
  }
  return user;
};

export const forgotPasswordUser = async (email) => {
  const user = await User.findOne({ email });

  if (!email) {
    throw new Error("EMAIL REQUIRED");
  }
  if (!user) {
    throw new Error("USER NOT FOUND");
  }

  if (user.isBlocked) {
    throw new Error("YOUR ACCOUNT HAS BEEN BLOCKED");
  }

  await Otp.deleteMany({
    userId: user._id,
  });

  const generatedOtp = Math.floor(100000 + Math.random() * 900000);
  console.log(generatedOtp);

  await Otp.create({
    userId: user._id,
    otp: generatedOtp.toString(),
  });

  await sendOtpEmail(user.email, generatedOtp);

  return user;
};

export const resetUserPassword = async (userId, password, confirmPassword) => {
  if (password !== confirmPassword) {
    throw new Error("PASSWORDS DO NOT MATCH");
  }
  if (!isPasswordValid(password)) {
    throw new Error("INVALID PASSWORD FORMAT");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.findByIdAndUpdate(userId, { password: hashedPassword });

  return true;
};

export const googleAuthCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      req.session.toast = info?.message || "GOOGLE LOGIN FAILED";
      return res.redirect("/login");
    }

    req.user = user;
    next();
  })(req, res, next);
};
