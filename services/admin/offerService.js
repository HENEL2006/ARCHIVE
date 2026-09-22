import category from "../../models/category.js";
import Offer from "../../models/offer.js";
import Product from "../../models/product.js";

export const getOffersService = async (
  page = 1,
  limit = 10,
  search = "",
  status = "ALL",
) => {
  const query = {};

  if (search.trim()) {
    query.name = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  if (status === "ACTIVE") {
    query.isActive = true;
  }

  if (status === "DISABLED") {
    query.isActive = false;
  }

  const currentPage = Math.max(Number(page) || 1, 1);
  const currentLimit = Math.max(Number(limit) || 10, 1);
  const skip = (currentPage - 1) * currentLimit;

  const [offers, totalOffers] = await Promise.all([
    Offer.find(query)
      .populate("product", "name")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(currentLimit)
      .lean(),

    Offer.countDocuments(query),
  ]);

  const now = new Date();

  const activeOffers = await Offer.countDocuments({
    isActive: true,
    startDate: { $lte: now },
    expiryDate: { $gte: now },
  });

  const scheduledOffers = await Offer.countDocuments({
    isActive: true,
    startDate: { $gt: now },
  });

  const expiredOffers = await Offer.countDocuments({
    expiryDate: { $lte: now },
  });

  const totalPages = Math.ceil(totalOffers / currentLimit);

  return {
    offers,
    totalOffers,
    activeOffers,
    scheduledOffers,
    expiredOffers,
    currentPage,
    totalPages,
    limit: currentLimit,
    search: search.trim(),
    status,
  };
};

export const searchProductsService = async (search = "") => {
  const trimmedSearch = search.trim();

  if (!trimmedSearch) {
    return [];
  }

  const products = await Product.find({
    name: {
      $regex: trimmedSearch,
      $options: "i",
    },
    isListed: true,
    isDeleted: false,
  })
    .select("_id name price images")
    .limit(10)
    .lean();

  return products;
};

export const searchCategoriesService = async (search = "") => {
  const trimmedSearch = search.trim();

  if (!trimmedSearch) {
    return [];
  }

  const categories = await category
    .find({
      name: {
        $regex: trimmedSearch,
        $options: "i",
      },
      isListed: true,
      isDeleted: false,
    })
    .select("_id name image")
    .limit(10)
    .lean();

  return categories;
};

export const createOfferService = async (offerData) => {
  const {
    name,
    type,
    product,
    category,
    discountType,
    discountValue,
    startDate,
    expiryDate,
    status,
  } = offerData;

  if (!["PRODUCT", "CATEGORY"].includes(type)) {
    throw new Error("Invalid offer type");
  }

  if (type === "PRODUCT" && !product) {
    throw new Error("Product is required for product offer");
  }

  if (type === "CATEGORY" && !category) {
    throw new Error("Category is required for category offer");
  }

  if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
    throw new Error("Invalid discount type");
  }

  if (!discountValue || discountValue <= 0) {
    throw new Error("Discount value must be greater than 0");
  }

  if (discountType === "PERCENTAGE" && discountValue > 100) {
    throw new Error("Percentage discount cannot exceed 100%");
  }

  if (!startDate || !expiryDate) {
    throw new Error("Start date and expiry date are required");
  }

  if (new Date(expiryDate) <= new Date(startDate)) {
    throw new Error("Expiry date must be after start date");
  }

  if (!["ACTIVE", "DISABLED"].includes(status)) {
    throw new Error("Invalid offer status");
  }

  const offer = await Offer.create({
    name: name.trim(),
    type,
    product: type === "PRODUCT" ? product : null,
    category: type === "CATEGORY" ? category : null,
    discountType,
    discountValue,
    startDate: new Date(startDate),
    expiryDate: new Date(expiryDate),
    isActive: status === "ACTIVE",
  });

  return offer;
};

export const toggleOfferService = async (offerId) => {
  const offer = await Offer.findById(offerId);

  if (!offer) {
    throw new Error("OFFER NOT FOUND");
  }

  offer.isActive = !offer.isActive;

  await offer.save();
  return offer;
};

export const getOfferByIdService = async (offerId) => {
  const offer = await Offer.findById(offerId)
    .populate("product", "name price images")
    .populate("category", "name image")
    .lean();

  if (!offer) {
    throw new Error("Offer not found");
  }

  return offer;
};

export const updateOfferService = async (offerId, offerData) => {
  const {
    name,
    type,
    product,
    category,
    discountType,
    discountValue,
    startDate,
    expiryDate,
    status,
  } = offerData;

  if (!["PRODUCT", "CATEGORY"].includes(type)) {
    throw new Error("Invalid offer type");
  }

  if (type === "PRODUCT" && !product) {
    throw new Error("Product is required for product offer");
  }

  if (type === "CATEGORY" && !category) {
    throw new Error("Category is required for category offer");
  }

  if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
    throw new Error("Invalid discount type");
  }

  if (!discountValue || discountValue <= 0) {
    throw new Error("Discount value must be greater than 0");
  }

  if (discountType === "PERCENTAGE" && discountValue > 100) {
    throw new Error("Percentage discount cannot exceed 100%");
  }

  if (!startDate || !expiryDate) {
    throw new Error("Start date and expiry date are required");
  }

  if (new Date(expiryDate) <= new Date(startDate)) {
    throw new Error("Expiry date must be after start date");
  }

  if (!["ACTIVE", "DISABLED"].includes(status)) {
    throw new Error("Invalid offer status");
  }

  const offer = await Offer.findById(offerId);

  if (!offer) {
    throw new Error("Offer not found");
  }

  offer.name = name.trim();
  offer.type = type;
  offer.product = type === "PRODUCT" ? product : null;
  offer.category = type === "CATEGORY" ? category : null;
  offer.discountType = discountType;
  offer.discountValue = discountValue;
  offer.startDate = new Date(startDate);
  offer.expiryDate = new Date(expiryDate);
  offer.isActive = status === "ACTIVE";

  await offer.save();

  return offer;
};

export const deleteOfferService = async (offerId) => {
  const offer = await Offer.findById(offerId);

  if (!offer) {
    throw new Error("OFFER NOT FOUND");
  }

  await Offer.findByIdAndDelete(offerId);

  return offer;
};
