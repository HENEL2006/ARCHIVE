import {
  verifyUserOtp,
  resendUserOtp,
  sendEmailChangeOtp,
  verifyEmailChangeOtp,
} from "../../services/user/otpService.js";

export const loadOtp = (req, res) => {
  res.render("user/otp", {
    email:
      req.session.email || req.session.resetEmail || req.session.pendingEmail,
    otpExpiry: req.session.otpExpiry,
    error: null,
  });
};

export const verifyOtp = async (req, res) => {
  try {
    const enteredOtp = req.body.otp.join("");

    if (req.session.otpPurpose === "signup") {
      await verifyUserOtp(req.session.userId, enteredOtp);

      req.session.toast = "AUTHENTICATION COMPLETE";

      delete req.session.email;
      delete req.session.userId;
      delete req.session.otpPurpose;
      delete req.session.otpExpiry;

      return res.redirect("/login");
    }

    if (req.session.otpPurpose === "forgot-password") {
      await verifyUserOtp(req.session.resetUserId, enteredOtp);

      delete req.session.otpExpiry;

      req.session.toast = "OTP VERIFIED";

      return res.redirect("/reset-password");
    }

    if (req.session.otpPurpose === "change-email") {
      await verifyEmailChangeOtp(
        req.session.userId,
        req.session.pendingEmail,
        enteredOtp,
      );

      delete req.session.pendingEmail;
      delete req.session.email;
      delete req.session.otpPurpose;
      delete req.session.otpExpiry;

      req.session.toast = "EMAIL UPDATED";

      return res.redirect("/account-settings");
    }
  } catch (error) {
    res.render("user/otp", {
      email:
        req.session.email || req.session.resetEmail || req.session.pendingEmail,
      otpExpiry: req.session.otpExpiry,
      error: error.message,
    });
  }
};

export const resendOtp = async (req, res) => {
  try {
    if (req.session.otpPurpose === "signup") {
      await resendUserOtp(req.session.userId, req.session.email);
    } else if (req.session.otpPurpose === "forgot-password") {
      await resendUserOtp(req.session.resetUserId, req.session.resetEmail);
    } else if (req.session.otpPurpose === "change-email") {
      await resendUserOtp(req.session.userId, req.session.pendingEmail);
    }

    req.session.otpExpiry = Date.now() + 3 * 60 * 1000;

    req.session.toast = "NEW OTP SENT";

    return res.redirect("/verify-otp");
  } catch (error) {
    res.render("user/otp", {
      email:
        req.session.email || req.session.resetEmail || req.session.pendingEmail,
      error: error.message,
    });
  }
};