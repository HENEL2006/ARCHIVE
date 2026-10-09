import bcrypt from "bcrypt";
import User from "../../models/User.js";

import { sendEmailChangeOtp } from "../../services/user/otpService.js";

import {
  updateProfileService,
  changePasswordService,
} from "../../services/user/profileService.js";

export const loadAccountSettings = async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render("user/accountSettings", {
    user,
    passwordError: null,
    oldData: {},
    activePage: "account",
  });
};

export const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const user = await User.findById(req.session.userId);
    if (!user || !user.password) {
      return res.status(400).json({ success: false, message: "User not found or using OAuth" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Error verifying password:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const sendChangeEmailOtp = async (req, res) => {
  try {
    await sendEmailChangeOtp(req.session.userId, req.body.email);

    req.session.pendingEmail = req.body.email;
    req.session.otpPurpose = "change-email";
    req.session.otpExpiry = Date.now() + 3 * 60 * 1000;
    req.session.toast = "OTP SENT";

    return res.redirect("/verify-otp");
  } catch (error) {
    console.log(error);
    req.session.toast = error.message;
    return res.redirect("/account-settings");
  }
};

export const updateProfile = async (req, res) => {
  try {
    await updateProfileService(req.session.userId, req.body.username);

    req.session.toast = "PROFILE UPDATED";

    return res.redirect("/account-settings");
  } catch (error) {
    req.session.toast = error.message;
    return res.redirect("/account-settings");
  }
};

export const changePassword = async (req, res) => {
  try {
    await changePasswordService(
      req.session.userId,
      req.body.currentPassword,
      req.body.password,
      req.body.confirmPassword,
    );

    req.session.toast = "PASSWORD UPDATED";

    return res.redirect("/account-settings");
  } catch (error) {
    console.log(error);
    const user = await User.findById(req.session.userId);

    return res.render("user/accountSettings", {
      user,
      passwordError: error.message,
      oldData: req.body,
    });
  }
};
