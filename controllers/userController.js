import User from "../models/User.js";
import Address from "../models/address.js";
import {
  addAddressService,
  deleteAddressService,
  editAddressService,
  forgotPasswordUser,
  getUserAddresses,
  loginUser,
  resendUserOtp,
  resetUserPassword,
  setDefaultAddressService,
  signupUser,
  verifyUserOtp,
} from "../services/userService.js";

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
    req.session.toast = "OTP SENT SUCCESSFULLY";

    res.redirect("/verify-otp");
  } catch (error) {
    res.render("user/signup", {
      error: error.message,
    });
    console.log(error);
  }
};

export const loadOtp = (req, res) => {
  res.render("user/otp", {
    email: req.session.email,
    error: null,
  });
};

export const verifyOtp = async (req, res) => {
  try {
    const enteredOtp = req.body.otp.join("");

    const userId =
      req.session.otpPurpose === "signup"
        ? req.session.userId
        : req.session.resetUserId;

    await verifyUserOtp(userId, enteredOtp);

    if (req.session.otpPurpose === "signup") {
      req.session.toast = "AUTHENTICATION COMPLETE";

      delete req.session.email;
      delete req.session.userId;
      delete req.session.otpPurpose;

      return res.redirect("/login");
    }

    if (req.session.otpPurpose === "forgot-password") {
      req.session.toast = "OTP VERIFIED";

      return res.redirect("/reset-password");
    }
  } catch (error) {
    res.render("user/otp", {
      email: req.session.email || req.session.resetEmail,
      error: error.message,
    });
  }
};

export const resendOtp = async (req, res) => {
  try {
    await resendUserOtp(req.session.userId, req.session.email);

    req.session.toast = "NEW OTP SENT";

    res.redirect("/verify-otp");
  } catch (error) {
    res.render("user/otp", {
      email: req.session.email,
      error: error.message,
    });
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

export const loadHomePage = (req, res) => {
  res.render("user/home", {
    error: null,
  });
};

export const loadProfilePage = async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render("user/profile", {
    user,
    error: null,
  });
};

export const loadAddressPage = async (req, res) => {
  const addresses = await getUserAddresses(req.session.userId);
  res.render("user/address", {
    addresses,
    error: null,
  });
};

export const loadAddAddress = (req, res) => {
  res.render("user/addAddress", {
    errors: {},
    oldData: {},
  });
};

export const addAddress = async (req, res) => {
  try {
    await addAddressService(req.session.userId, req.body);

    req.session.toast = "ADDRESS ADDED";

    res.redirect("/address");
  } catch (error) {
    console.log(error);
    res.render("user/addAddress", {
      errors: {},
      oldData: req.body,
      error: error.message,
    });
  }
};

export const loadEditAddress = async (req, res) => {
  const address = await Address.findById(req.params.id);
  res.render("user/editAddress", {
    address,
    oldData: {},
    errors: {},
  });
};

export const editAddress = async (req, res) => {
  try {
    await editAddressService(req.params.id, req.session.userId, req.body);

    req.session.toast = "ADDRESS UPDATED";

    res.redirect("/address");
  } catch (error) {
    console.log(error);
    res.redirect("/address");
  }
};

export const setAsDefault = async (req, res) => {
  try {
    await setDefaultAddressService(req.params.id, req.session.userId);

    req.session.toast = "DEFAULT ADDRESS UPDATED";

    res.redirect("/address");
  } catch (error) {
    console.log(error);
    res.redirect("/address");
  }
};

export const deleteAddress = async (req, res) => {
  try {
    await deleteAddressService(req.params.id, req.session.userId);

    req.session.toast = "ADDRESS DELETED";

    res.redirect("/address");
  } catch (error) {
    console.log(error);
    res.redirect("/address");
  }
};

export const loadAccountSettings = async(req,res)=>{
  const user = await User.findById(req.session.userId)
  res.render("user/accountSettings",{
    user,
  })
}

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/home");
    }

    res.clearCookie("connet.sid");
    res.redirect("/login");
  });
};
