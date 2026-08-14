import Category from "../models/category.js";

export const attachCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({
      isListed: true,
      isDeleted: false,
    })
      .select("name slug")
      .lean();

    res.locals.categories = categories;

    next();
  } catch (error) {
    next(error);
  }
};