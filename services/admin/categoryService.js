import Category from "../../models/category.js";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload.js";
import cloudinary from "../../config/cloudinary.js";
import Product from "../../models/product.js";
import category from "../../models/category.js";

export const getCategoryService = async (
  search = "",
  status = "",
  sort = "newest",
  page = 1,
) => {
  const query = {
    isDeleted: false,
  };

  if (search.trim()) {
    query.name = {
      $regex: search,
      $options: "i",
    };
  }

  if (status === "listed") {
    query.isListed = true;
  } else if (status === "unlisted") {
    query.isListed = false;
  } else if (status === "deleted") {
    query.isDeleted = true;
  } else {
    query.isDeleted = false;
  }

  let sortQuery = {};

  if (sort === "newest") {
    sortQuery = { createdAt: -1 };
  } else if (sort === "oldest") {
    sortQuery = { createdAt: 1 };
  } else if (sort === "az") {
    sortQuery = { name: 1 };
  } else if (sort === "za") {
    sortQuery = { name: -1 };
  }

  const limit = 6;
  const skip = (page - 1) * limit;
  const filteredCount = await Category.countDocuments(query);

  const categories = await Category.find(query)
    .sort(sortQuery)
    .skip(skip)
    .limit(limit)
    .lean();

  const productCounts = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        productCount: {
          $sum: 1,
        },
      },
    },
  ]);

  const productCountMap = new Map(
    productCounts.map((item) => [item._id.toString(), item.productCount]),
  );

  const categoriesWithCounts = categories.map((category) => ({
    ...category,
    productCount: productCountMap.get(category._id.toString()) || 0,
  }));

  const totalPages = Math.ceil(filteredCount / limit);

  const totalCategories = await Category.countDocuments();

  const listedCategories = await Category.countDocuments({
    isListed: true,
    isDeleted: false,
  });

  const unlistedCategories = await Category.countDocuments({
    isDeleted: false,
    isListed: false,
  });

  const deletedCategories = await Category.countDocuments({
    isDeleted: true,
  });

  return {
    categories : categoriesWithCounts,
    totalCategories,
    listedCategories,
    unlistedCategories,
    deletedCategories,
    totalPages,
  };
};

export const addCategoryService = async (data, file) => {
  const { name, description, status } = data;

  if (!name || !description || !file) {
    throw new Error("ALL FIELDS REQUIRED");
  }

  const existingCategory = await Category.findOne({
    name: name.trim(),
    isDeleted: false,
  });

  if (existingCategory) {
    throw new Error("CATEGORY ALREADY EXISTS");
  }

  const uploadedImage = await uploadToCloudinary(
    file.buffer,
    "archive/categories",
  );

  const category = await Category.create({
    name: name.trim(),
    description: description.trim(),
    image: uploadedImage.secure_url,
    imagePublicId: uploadedImage.public_id,
    isListed: status === "listed",
  });

  return category;
};

export const getCategoryByIdService = async (id) => {
  const category = await Category.findById(id);

  if (!category) {
    throw new Error("CATEGORY NOT FOUND");
  }

  return category;
};

export const editCategoryService = async (id, data, file) => {
  if (!data.name || !data.description) {
    throw new Error("ALL FIELDS REQUIRED");
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new Error("CATEGORY NOT FOUND");
  }

  const categoryName = data.name.trim().toLowerCase();

  const existingCategory = await Category.findOne({
    name: { $regex: new RegExp(`^${categoryName}$`, "i") },
    _id: { $ne: id },
  });

  if (existingCategory) {
    throw new Error("CATEGORY ALREADY EXISTS");
  }

  category.name = data.name.trim();
  category.description = data.description.trim();
  category.isListed = data.status === "listed";

  if (file) {
    if (category.imagePublicId) {
      await cloudinary.uploader.destroy(category.imagePublicId);
    }

    const uploadedImage = await uploadToCloudinary(
      file.buffer,
      "archive/categories",
    );

    category.image = uploadedImage.secure_url;
    category.imagePublicId = uploadedImage.public_id;
  }

  await category.save();
  return category;
};

export const toggleCategoryStatusService = async (id) => {
  const category = await Category.findById(id);

  if (!category) {
    throw new Error("CATEGORY NOT FOUND");
  }

  category.isListed = !category.isListed;

  await category.save();
  return category;
};

export const deleteCategoryService = async (id) => {
  const category = await Category.findById(id);

  if (!category) {
    throw new Error("CATEGORY NOT FOUND");
  }

  category.isDeleted = !category.isDeleted;

  await category.save();
  return category;
};
