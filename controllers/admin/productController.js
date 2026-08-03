import Category from "../../models/category.js";
import {
  addProductService,
  deleteProductService,
  getProductByIdService,
  getProductService,
  toggleProductStatusService,
  updateProductService,
} from "../../services/admin/productService.js";

export const loadProducts = async (req, res) => {
  try {
    const { products, categories, pagination, stats } = await getProductService(
      req.query,
    );

    res.render("admin/products", {
      activePage: "products",
      products,
      categories,
      pagination,
      query: req.query,
      stats,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/dashboard");
  }
};

export const loadaddProduct = async (req, res) => {
  const categories = await Category.find({ isListed: true });

  res.render("admin/addProduct", {
    activePage: "products",
    categories,
    formData: {},
    errors: {},
  });
};

export const addProduct = async (req, res) => {
  console.log(req.body)
  console.log(req.files)
  try {
    await addProductService(req.body, req.files);
    req.session.toast = {
      type: "success",
      message: "PRODUCT ADDED SUCCESSFULLY",
    };
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    const categories = await Category.find({ isListed: true });
    res.render("admin/addProduct", {
      activePage: "products",
      categories,
      formData: req.body,
      errors: {
        general: error.message,
      },
      toast: {
        type: "error",
        message: error.message,
      },
    });
  }
};

export const toggleProductStatus = async (req, res) => {
  try {
    const product = await toggleProductStatusService(req.params.id);

    req.session.toast = {
      type: "success",
      message: product.isListed
        ? "PRODUCT LISTED SUCCESSFULLY"
        : "PRODUCT UNLISTED SUCCESSFULLY",
    };
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    req.session.toast = {
      type: "error",
      message: error.message,
    };
    res.redirect("/admin/products");
  }
};

export const loadEditProduct = async (req, res) => {
  try {
    const product = await getProductByIdService(req.params.id);

    const categories = await Category.find({ isListed: true });

    res.render("admin/editProduct", {
      activePage: "products",
      product,
      categories,
      errors: {},
      formData: {},
    });
  } catch (error) {
    console.log(error);
    req.session.toast = {
      type: "error",
      message: error.message,
    };
    res.redirect("/admin/products");
  }
};

export const updateProduct = async (req, res) => {
  try {
    await updateProductService(req.params.id, req.body, req.files);

    req.session.toast = {
      type: "success",
      message: "PRODUCT UPDATED SUCCESSFULLY",
    };
    return res.redirect("/admin/products");
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect(`/admin/products/${req.params.id}/edit`);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await deleteProductService(req.params.id);

    req.session.toast = {
      type: "success",
      message: "PRODUCT DELETED SUCCESSFULLY",
    };
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    req.session.toast = {
      type: "error",
      message: error.message,
    };
    res.redirect("/admin/products");
  }
};
