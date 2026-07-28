import { adminLoginService } from "../../services/admin/authService.js";

export const loadLogin = (req, res) => {
  res.render("admin/login", {
    error: null,
  });
};

export const adminLogin = async (req, res) => {
  try {
    const admin = await adminLoginService(req.body.email, req.body.password);

    req.session.adminId = admin._id;
    req.session.isAdminAuthenticated = true;
    req.session.toast = "WELCOME ADMIN";

    return res.redirect("/admin/dashboard");
  } catch (error) {
    return res.render("admin/login", {
      error: error.message,
    });
  }
};

export const adminLogout = (req, res) => {
  delete req.session.adminId;
  delete req.session.isAdminAuthenticated;
  req.session.toast = "LOGGED OUT";

  res.redirect("/admin/login");
};
