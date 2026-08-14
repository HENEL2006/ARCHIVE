import {
  getProductDetailsService,
  getProductService,
} from "../../services/user/productService.js";

export const loadProducts = async (req, res) => {
  try {
    const {
      products,
      brands,
      categories,
      selectedCategory,
      wishlistIds,
      pagination,
    } = await getProductService(req.query, req.session.userId);

    res.render("user/productListing", {
      products,
      categories,
      brands,
      pagination,
      selectedCategory,
      wishlistIds,
      query: req.query,
      activePage: "shop",
    });
  } catch (error) {
    console.log(error);
    req.session.toast = {
      type: null,
      message: error.message,
    };
    res.redirect("/");
  }
};

export const loadProductDetails = async (req, res) => {
  try {
    const { product, totalStock, relatedProducts, categories } =
      await getProductDetailsService(req.params.slug);

    res.render("user/productDetails", {
      product,
      totalStock,
      relatedProducts,
      categories,
      activePage: "shop",
    });
  } catch (error) {
    console.log(error);
    req.session.toast = {
      type: "error",
      message: error.message,
    };

    res.redirect("/products");
  }
};
