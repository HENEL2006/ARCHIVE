import { getHomeService } from "../../services/user/homeService.js";

export const loadHomePage = async (req, res) => {
  try {
    const { newArrivals, topSellingProducts, categories } =
      await getHomeService();

    res.render("user/home", {
      newArrivals,
      topSellingProducts,
      categories,
    });
  } catch (error) {
    console.error("Home page error:", error);

    res.redirect("/products?error=Unable%20to%20load%20home%20page");
  }
};
