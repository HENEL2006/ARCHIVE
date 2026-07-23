import User from "../models/User.js";

export const isLoggedIn = async (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  try {
    const user = await User.findById(req.session.userId);

    if (!user) {
      req.session.destroy(() => {});
      return res.redirect("/login");
    }

    if (user.isBlocked) {
      req.session.destroy(() => {});
      return res.redirect("/login");
    }
    if(user.isDeleted){
      req.session.destroy(()=>{
        return res.redirect("/login");
      })
    }

    next();
  } catch (error) {
    console.log(error);
    req.session.destroy(() => {});
    return res.redirect("/login");
  }
};

export const isLoggedOut = (req, res, next) => {
  if (req.session.userId && req.session.isAuthenticated) {
    return res.redirect("/home");
  }
  next();
};

export const canAccessOtp = (req, res, next) => {
  if (!req.session.otpPurpose) {
    return res.redirect("/signup");
  }

  next();
};

export const adminAuth = (req, res, next) => {
  if (!req.session.isAdminAuthenticated) {
    return res.redirect("/admin/login");
  }
  next();
};

export const adminGuest = (req, res, next) => {
  if (req.session.isAdminAuthenticated) {
    return res.redirect("/admin/dashboard");
  }
  next();
};
