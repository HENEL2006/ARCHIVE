import { getDashboardService } from "../../services/admin/dashboardService.js";

export const loadDashboard = async (req, res) => {
  try {
    const range = req.query.range || "thisWeek";

    const dashboardData = await getDashboardService(range);

    return res.render("admin/dashboard", {
      ...dashboardData,
      activePage: "dashboard",
    });
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect("/admin/dashboard");
  }
};
