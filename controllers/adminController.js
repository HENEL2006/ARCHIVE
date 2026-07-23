import {
  adminLoginService,
  getCustomersService,
  updateUserStatusService,
} from "../services/adminService.js";

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

export const loadDashboard = (req, res) => {
  res.render("admin/dashboard",{
    activePage: "dashboard",
  });
};

export const loadCustomers = async (req, res) => {
  try {
    const search = req.query.search || "";
    const status = req.query.status || "";
    const sort = req.query.sort || "newest";
    const fromDate = req.query.fromDate || "";
    const toDate = req.query.toDate || "";

    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const result = await getCustomersService(
      search,
      status,
      sort,
      page,
      limit,
      fromDate,
      toDate,
    );

    const startIndex = result.totalUsers === 0 ? 0 : (page - 1) * limit + 1;

    const endIndex = Math.min(page * limit, result.totalUsers);

    res.render("admin/customers", {
      users: result.users,
      totalUsers: result.totalUsers,
      totalPages: result.totalPages,
      currentPage: page,
      startIndex,
      endIndex,
      search,
      status,
      sort,
      fromDate,
      toDate,
      totalCustomers: result.totalCustomers,
      activeCustomers: result.activeCustomers,
      newCustomers: result.newCustomers,
      activePage: "customers",
    });
  } catch (error) {
    console.log(error);

    res.render("admin/customers", {
      users: [],
      totalUsers: 0,
      totalPages: 1,
      currentPage: 1,
      startIndex: 0,
      endIndex: 0,
      search: "",
      status: "",
      sort: "newest",
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const user = await updateUserStatusService(req.params.id);

    req.session.toast = user.isBlocked ? "USER BLOCKED" : "USER UNBLOCKED";

    res.redirect("/admin/customers");
  } catch (error) {
    console.log(error);

    req.session.toast = error.message;

    res.redirect("/admin/customers");
  }
};

export const adminLogout = (req, res) => {
  delete req.session.adminId;
  delete req.session.isAdminAuthenticated;
  req.session.toast = "LOGGED OUT";

  res.redirect("/admin/login");
};
