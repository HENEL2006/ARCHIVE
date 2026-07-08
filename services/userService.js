import User from "../models/User.js";
import Address from "../models/address.js";
import bcrypt from "bcrypt";
import Otp from "../models/Otp.js";
import { sendOtpEmail } from "../utils/sendOtpEmail.js";
import { isPasswordValid } from "../public/JS/passwordValidation.js";

export const signupUser = async (userData) => {
  const { username, email, password, confirmPassword, referralCode } = userData;

  if (!username || !email || !password || !confirmPassword) {
    throw new Error("ALL FIELDS REQUIRED");
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

  const newUserData = {
    username,
    email,
    password: hashedPassword,
    isVerified: false,
  };

  if (referralCode) {
    newUserData.referralCode = referralCode;
  }

  const user = await User.create(newUserData);

  const generatedOtp = Math.floor(100000 + Math.random() * 900000);
  console.log(generatedOtp);

  await Otp.create({
    userId: user._id,
    otp: generatedOtp.toString(),
  });

  await sendOtpEmail(email, generatedOtp);

  return user;
};

export const verifyUserOtp = async (userId, enteredOtp) => {
  const otpDoc = await Otp.findOne({ userId });

  if (!otpDoc) {
    throw new Error("OTP NOT FOUND");
  }

  const otpAge = Date.now() - otpDoc.createdAt.getTime();

  if (otpAge > 5 * 60 * 1000) {
    await Otp.deleteOne({ userId });
    throw new Error("OTP EXPIRED, PLEASE REQUEST A NEW OTP");
  }

  if (otpDoc.otp.toString() !== enteredOtp.toString()) {
    throw new Error("INVALID OTP");
  }

  await User.findByIdAndUpdate(userId, { isVerified: true }, { new: true });

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

export const loginUser = async (loginData) => {
  const { email, password } = loginData;

  const user = await User.findOne({ email });

  if (!email || !password) {
    throw new Error("ALL FIELDS REQUIRED");
  }
  if (!user) {
    throw new Error("USER NOT FOUND");
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
    throw new Error("INVAILD PASSWORD FORMAT");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.findByIdAndUpdate(userId, { password: hashedPassword });

  return true;
};

export const getUserAddresses = async (userId) => {
  return await Address.find({ userId }).sort({
    isDefault: -1,
    createdAt: -1,
  });
};

export const addAddressService = async (userId, data) => {
  data.isDefault = data.isDefault === "on";

  if (data.isDefault) {
    await Address.updateMany({ userId }, { isDefault: false });
  }

  await Address.create({
    ...data,
    userId,
  });
};

export const editAddressService = async (id, userId, data) => {
  data.isDefault = data.isDefault === "on";

  if (data.isDefault) {
    await Address.updateMany({ userId }, { isDefault: false });
  }

  await Address.findOneAndUpdate({ _id: id, userId }, data, { new: true });
};

export const setDefaultAddressService = async (id, userId) => {
  await Address.updateMany({ userId }, { isDefault: false });

  await Address.findOneAndUpdate({ _id: id, userId }, { isDefault: true });
};

export const deleteAddressService = async (id, userId) => {
  const address = await Address.findOne({
    _id: id,
    userId,
  });

  if (!address) {
    return;
  }

  const wasDefault = address.isDefault;

  await Address.deleteOne({
    _id: id,
    userId,
  });

  if (wasDefault) {
    const anotherAddress = await Address.findOne({
      userId,
    }).sort({ createdAt: -1 });

    if (anotherAddress) {
      anotherAddress.isDefault = true;
      await anotherAddress.save();
    }
  }
};
