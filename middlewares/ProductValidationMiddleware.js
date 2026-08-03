import { productValidationSchema } from "../validators/productValidator.js";
import Category from "../models/category.js";

export const productValidationMiddleware = async (req, res, next) => {
  const { error, value } = productValidationSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  const errors = {};

  // Joi validation errors
  if (error) {
    error.details.forEach((err) => {
      errors[err.path[0]] = err.message;
    });
  }

  // Image validation
  if (!req.files || req.files.length < 3) {
    errors.images = "UPLOAD AT LEAST THREE PRODUCT IMAGEs";
  }

  if (req.files && req.files.length > 5) {
    errors.images = "MAXIMUM 5 IMAGES ARE ALLOWED";
  }

  // Size & Stock validation
  const sizes = Array.isArray(req.body.sizes)
    ? req.body.sizes
    : req.body.sizes
      ? [req.body.sizes]
      : [];

  const stocks = Array.isArray(req.body.stocks)
    ? req.body.stocks
    : req.body.stocks
      ? [req.body.stocks]
      : [];

  // Number of sizes and stocks should match
  if (sizes.length !== stocks.length) {
    errors.variants = "SIZE AND STOCK COUNT MUST MATCH";
  }

  // Duplicate size check
  const uniqueSizes = new Set(sizes);

  if (uniqueSizes.size !== sizes.length) {
    errors.sizes = "SIZE VARIANTS MUST BE UNIQUE";
  }

  // Stock validation
  if (stocks.some((stock) => Number(stock) < 1)) {
    errors.stocks = "QUANTITY MUST BE GREATER THAN 0";
  }

  // If any errors exist, render the form again
  if (Object.keys(errors).length > 0) {
    const categories = await Category.find({ isListed: true });

    return res.render("admin/addProduct", {
      errors,
      formData: req.body,
      activePage: "products",
      categories,
    });
  }

  req.body = value;

  next();
};
