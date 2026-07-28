

export const loadDashboard = (req, res) => {
  res.render("admin/dashboard", {
    activePage: "dashboard",
  });
};
