export const validateCategory = (isEdit = false) => {
  return (req, res, next) => {
    const { name, description } = req.body;
    const errors = [];

    const trimmedName = name ? name.trim() : "";
    if (!trimmedName) {
      errors.push("Category name is required");
    } else if (trimmedName.length < 2 || trimmedName.length > 50) {
      errors.push("Category name must be between 2 and 50 characters");
    } else if (!/^[a-zA-Z0-9\s/&-]+$/.test(trimmedName)) {
      errors.push("Category name contains invalid characters");
    }

    const trimmedDesc = description ? description.trim() : "";
    if (!trimmedDesc) {
      errors.push("Category description is required");
    } else if (trimmedDesc.length < 5 || trimmedDesc.length > 500) {
      errors.push("Category description must be between 5 and 500 characters");
    }

    if (!isEdit && !req.file) {
      errors.push("Category image is required");
    }

    if (req.file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        errors.push("Only image files (JPEG, PNG, WEBP, GIF) are allowed");
      }
    }

    if (errors.length > 0) {
      req.session.toast = {
        type: "error",
        message: errors.join(" | "),
      };
      if (isEdit) {
        return res.redirect(`/admin/editCategory/${req.params.id}`);
      }
      return res.redirect("/admin/addCategory");
    }

    next();
  };
};
