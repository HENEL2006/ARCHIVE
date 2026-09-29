import User from "../../models/User.js";
import bcrypt from "bcrypt";
import { isPasswordValid } from "../../public/JS/passwordValidation.js";
import cloudinary from "../../config/cloudinary.js";



export const updateProfileService = async (userId, username) => {
  if (!username || username.trim().length < 3) {
    throw new Error("USERNAME MUST BE AT LEAST 3 CHARACTERS");
  }

  await User.findByIdAndUpdate(
    userId,
    { username: username.trim() },
    { new: true },
  );

  return true;
};

export const changePasswordService = async (
  userId,
  currentPassword,
  newPassword,
  confirmPassword,
) => {
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new Error("ALL FIELDS REQUIRED");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("USER NOT FOUND");
  }
  if (user.isBlocked) {
    throw new Error("YOUR ACCOUNT HAS BEEN BLOCKED");
  }

  const isCurrentPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.password,
  );

  if (!isCurrentPasswordCorrect) {
    throw new Error("CURRENT PASSWORD IS INCORRECT");
  }

  if (!isPasswordValid(newPassword)) {
    throw new Error("INVALID PASSWORD FORMAT");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("PASSWORDS DO NOT MATCH");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.findByIdAndUpdate(userId, {
    password: hashedPassword,
  });

  return true;
};

export const removeProfileImageService = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("USER NOT FOUND");
  }

  if (user.googleId) {
    throw new Error("GOOGLE ACCOUNT CANNOT CHANGE PASSWORD");
  }

  if (!user.profileImage) {
    throw new Error("NO PROFILE IMAGE");
  }

  if (user.profileImagePublicId) {
    await cloudinary.uploader.destroy(user.profileImagePublicId);
  }

  user.profileImage = "";
  user.profileImagePublicId = "";

  await user.save();
};

