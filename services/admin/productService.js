import Category from "../../models/category.js";
import Product from "../../models/product.js";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload.js";

export const addProductService = async (data, files) => {
  const {
    name,
    slug,
    category,
    brand,
    price,
    status,
    shortDescription,
    description,
    sizes,
    stocks,
  } = data;

  const existingProduct = await Product.findOne({
    slug: data.slug.trim().toLowerCase(),
  });

  if (existingProduct) {
    throw new Error("PRODUCT ALREADY EXISTS");
  }

  if (!files || files.length === 0) {
    throw new Error("AT LEAST ONE IMAGE IS REQUIRED");
  }

  const variants = sizes.map((size, index) => ({
    size,
    stock: Number(stocks[index]),
  }));

  const images = [];

  for (const file of files) {
    const uploadedImage = await uploadToCloudinary(file.buffer, "products");
    images.push({
      url: uploadedImage.secure_url,
      publicId: uploadedImage.public_id,
    });
  }

  const product = new Product({
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    category,
    brand: brand.trim(),
    price: Number(price),
    shortDescription: shortDescription.trim(),
    description: description.trim(),
    variants,
    images,
    isListed: status === "Listed",
  });

  await product.save();
  return product;
};

export const getProductService = async (query) => {
  const categories = await Category.find({ isListed: true });

  const {
    search = "",
    category = "",
    status = "",
    sort = "newest",
    page = 1,
  } = query;

  const filter = { isDeleted: false };

  if (search) {
    filter.name = {
      $regex: search,
      $options: "i",
    };
  }

  if (category && category.trim() !== "") {
    filter.category = category;
  }

  if (status === "listed") {
    filter.isListed = true;
  }
  if (status === "unlisted") {
    filter.isListed = false;
  }

  let sortOption = {};

  if (sort === "newest") {
    sortOption = { createdAt: -1 };
  } else if (sort === "oldest") {
    sortOption = { createdAt: 1 };
  } else if (sort === "priceAsc") {
    sortOption = { price: 1 };
  } else if (sort === "priceDesc") {
    sortOption = { price: -1 };
  } else if (sort === "a-z") {
    sortOption = { name: 1 };
  } else if (sort === "z-a") {
    sortOption = { name: -1 };
  }

  const limit = 8;
  const currentPage = Number(page);
  const skip = (currentPage - 1) * limit;

  const totalProducts = await Product.countDocuments(filter);
  const listedProducts = await Product.countDocuments({
    isListed: true,
    isDeleted: false,
  });
  const unlistedProducts = await Product.countDocuments({
    isListed: false,
    isDeleted: false,
  });
  const deletedProducts = await Product.countDocuments({ isDeleted: true });

  const products = await Product.find(filter)
    .populate("category", "name")
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .lean();

  const productsWithStock = products.map((product) => {
    const totalStock = product.variants.reduce(
      (total, variant) => total + (Number(variant.stock) || 0),
      0,
    );
    return {
      ...product,
      totalStock,
    };
  });

  return {
    products: productsWithStock,
    categories,
    pagination: {
      currentPage,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      limit,
    },
    stats: {
      listedProducts,
      unlistedProducts,
      deletedProducts,
      totalProducts,
    },
  };
};

export const toggleProductStatusService = async (productId) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("PRODUCT NOT FOUND");
  }

  product.isListed = !product.isListed;

  await product.save();

  return product;
};

export const getProductByIdService = async (productId) => {
  const product = await Product.findById(productId).populate(
    "category",
    "name",
  );

  if (!product) {
    throw new Error("PRODUCT NOT FOUND");
  }

  return product;
};

export const updateProductService = async (productId, data, files) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("PRODUCT NOT FOUND");
  }

  const {
    name,
    slug,
    category,
    brand,
    price,
    status,
    shortDescription,
    description,
    sizes,
    stocks,
    removedImages,
  } = data;

  const existingProduct = await Product.findOne({
    slug: slug.trim().toLowerCase(),
    _id: { $ne: productId },
  });

  if (existingProduct) {
    throw new Error("PRODUCT ALREADY EXISTS");
  }

  const sizeArray = Array.isArray(sizes) ? sizes : [sizes];
  const stockArray = Array.isArray(stocks) ? stocks : [stocks];

  product.variants = sizeArray.map((size, index) => ({
    size,
    stock: Number(stockArray[index]),
  }));

  let removePublicIds = [];

  if (removedImages) {
    try {
      removePublicIds = JSON.parse(removedImages);
    } catch (error) {
      console.log(error);
      removePublicIds = [];
    }
  }

  product.images = product.images.filter((image) => {
    return !removePublicIds.includes(image.publicId);
  });

  if (files && files.length > 0) {
    for (const file of files) {
      const uploadedImages = await uploadToCloudinary(file.buffer, "products");

      product.images.push({
        url: uploadedImages.secure_url,
        publicId: uploadedImages.public_id,
      });
    }
  }

  if (product.images.length === 0) {
    throw new Error("PRODUCT MUST HAVE ALLEAST ONE IMAGE");
  }

  if (product.images.length > 5) {
    throw new Error("MAXIMUM 5 IMAGES ARE ALLOWED");
  }

  product.name = name.trim();
  product.slug = slug.trim().toLowerCase();
  product.category = category;
  product.brand = brand.trim();
  product.isListed = status === "Listed";
  product.price = Number(price);
  product.shortDescription = shortDescription.trim();
  product.description = description.trim();

  await product.save();
  return product;
};

export const deleteProductService = async (productId)=>{
  const product = await Product.findById(productId);

  if(!product){
    throw new Error("PRODUCT NOT FOUND");
  }

  product.isDeleted = true;
  product.save();
}