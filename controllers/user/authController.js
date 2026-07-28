import User from "../../models/User.js";
import passport from "passport";
import {
  signupUser,
  loginUser,
  forgotPasswordUser,
  resetUserPassword,
} from "../../services/user/authService.js";

export const googleCallback = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || user.isBlocked) {
      req.session.destroy(() => {
        return res.redirect("/login");
      });
      return;
    }

    req.session.userId = user._id;
    req.session.isAuthenticated = true;
    req.session.toast = "WELCOME";

    req.session.cookie.maxAge = 1000 * 60 * 60;

    res.redirect("/home");
  } catch (error) {
    console.log(error);
    res.redirect("/login");
  }
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

export const loadSignup = (req, res) => {
  res.render("user/signup", {
    error: null,
  });
};

export const signup = async (req, res) => {
  try {
    const user = await signupUser(req.body);

    req.session.userId = user._id;
    req.session.email = user.email;
    req.session.otpPurpose = "signup";
    req.session.otpExpiry = Date.now() + 3 * 60 * 1000;
    req.session.toast = "OTP SENT SUCCESSFULLY";

    res.redirect("/verify-otp");
  } catch (error) {
    res.render("user/signup", {
      error: error.message,
    });
    console.log(error);
  }
};

export const loadLogin = (req, res) => {
  res.render("user/login", {
    error: null,
  });
};

export const login = async (req, res) => {
  try {
    const user = await loginUser(req.body);

    req.session.userId = user._id;
    req.session.isAuthenticated = true;

    if (req.body.remember) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
    } else {
      req.session.cookie.maxAge = 1000 * 60 * 60;
    }

    req.session.toast = "AUTHENTICATED";

    res.redirect("/home");
  } catch (error) {
    res.render("user/login", {
      error: error.message,
    });
  }
};

export const loadForgotPassword = (req, res) => {
  res.render("user/forgotPassword", {
    error: null,
  });
};

export const forgotPassword = async (req, res) => {
  try {
    const user = await forgotPasswordUser(req.body.email);

    req.session.resetUserId = user._id;
    req.session.resetEmail = user.email;
    req.session.otpPurpose = "forgot-password";
    req.session.otpExpiry = Date.now() + 3 * 60 * 1000;
    req.session.toast = "RESET CODE SENT";

    res.redirect("/verify-otp");
  } catch (error) {
    res.render("user/forgotPassword", {
      error: error.message,
    });
  }
};

export const loadResetPassword = (req, res) => {
  res.render("user/resetPassword", {
    error: null,
  });
};

export const resetPassword = async (req, res) => {
  try {
    await resetUserPassword(
      req.session.resetUserId,
      req.body.password,
      req.body.confirmPassword,
    );

    req.session.toast = "PASSWORD UPDATED";

    delete req.session.resetUserId;
    delete req.session.resetEmail;
    delete req.session.otpPurpose;

    res.redirect("/login");
  } catch (error) {
    res.render("user/resetPassword", {
      error: error.message,
    });
  }
};

export const logout = (req, res) => {
  delete req.session.userId;
  delete req.session.isAuthenticated;
  req.session.toast = "LOGGED OUT";

  res.redirect("/login");
};
