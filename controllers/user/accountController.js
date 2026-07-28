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
  });
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
