import {
  getCategoryService,
  addCategoryService,
  getCategoryByIdService,
  editCategoryService,
  toggleCategoryStatusService,
  deleteCategoryService,
} from "../../services/admin/categoryService.js";

export const loadCategory = async (req, res) => {
  try {
    const search = req.query.search || "";
    const status = req.query.status || "";
    const sort = req.query.sort || "";
    const page = Number(req.query.page) || 1;

    const {
      categories,
      totalCategories,
      listedCategories,
      unlistedCategories,
      deletedCategories,
      totalPages,
    } = await getCategoryService(search, status, sort, page);

    res.render("admin/category", {
      activePage: "category",
      categories,
      totalCategories,
      listedCategories,
      unlistedCategories,
      deletedCategories,
      search,
      status,
      sort,
      page,
      totalPages,
    });
  } catch (error) {
    console.log(error);
    req.session.toast = error.message;
    res.redirect("/admin/dashboard");
  }
};

export const loadAddCategory = async (req, res) => {
  res.render("admin/addCategory", {
    error: null,
    activePage: "category",
  });
};

export const addCategory = async (req, res) => {
  try {
    await addCategoryService(req.body, req.file);
    req.session.toast = "CATEGORY ADDED SUCCESSFULLY";
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error);
    req.session.toast = "error.message";
    res.redirect("/admin/addCategory");
  }
};

export const loadEditCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await getCategoryByIdService(id);

    res.render("admin/editCategory", {
      activePage: "category",
      category,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/category");
  }
};

export const editCategory = async (req, res) => {
  try {
    await editCategoryService(req.params.id, req.body, req.file);
    req.session.toast = "CATEGORY UPDATED";
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error);
    req.session.toast = {
      type: "error",
      message: error.message,
    };
    res.redirect(`/admin/editCategory/${req.params.id}`);
  }
};

export const toggleCategoryStatus = async (req, res) => {
  try {
    await toggleCategoryStatusService(req.params.id);

    req.session.toast = "CATEGORY STATUS UPDATED";
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error);
    req.session.toast = error.message;
    res.redirect("/admin/category");
  }
};

export const deleteCategory = async (req, res) => {
  try {
    await deleteCategoryService(req.params.id);

    req.session.toast = "CATEGORY DELETED";

    res.redirect("/admin/category");
  } catch (error) {
    console.log(error);
    req.session.toast = error.message;
    res.redirect("/admin/category");
  }
};
