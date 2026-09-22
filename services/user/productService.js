import Category from "../../models/category.js";
import Product from "../../models/product.js";
import Wishlist from "../../models/wishlist.js";
import { getBestOfferService } from "./offerService.js";

export const getProductService = async (query, userId) => {
  const {
    search = "",
    category = "",
    sort = "",
    price = "",
    brand = "",
    size = "",
    page = 1,
  } = query;

  const categories = await Category.find({
    isListed: true,
    isDeleted: false,
  }).lean();

  let selectedCategory = null;
  if (query.category) {
    selectedCategory = categories.find(
      (category) => category._id.toString() === query.category,
    );
  }

  const limit = 8;

  const currentPage = Number(query.page) || 1;

  const skip = (currentPage - 1) * limit;

  const listedCategories = await Category.find({
    isListed: true,
    isDeleted: false,
  }).select("_id");

  const filter = {
    isListed: true,
    isDeleted: false,
    category: {
      $in: listedCategories,
    },
  };

  if (category) {
    filter.category = category;
  }

  if (search.trim()) {
    filter.name = {
      $regex: search,
      $options: "i",
    };
  }

  if (brand) {
    filter.brand = brand;
  }

  if (size) {
    filter["variants.size"] = size;
  }

  if (price === "0-999") {
    filter.price = {
      $lte: 999,
    };
  } else if (price === "1000 - 1999") {
    filter.price = {
      $gte: 1000,
      $lte: 1999,
    };
  } else if (price === "2000") {
    filter.price = {
      $gte: 2000,
      $lte: 2999,
    };
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

  const totalProducts = await Product.countDocuments(filter);
  const brands = await Product.distinct("brand", {
    isListed: true,
    isDeleted: false,
  });

  const products = await Product.find(filter)
    .populate("category", "name isListed")
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .lean();

  const productsWithOffers = await Promise.all(
    products.map(async (product) => {
      const offer = await getBestOfferService({
        ...product,
        category: product.category?._id || product.category,
      });

      return {
        ...product,
        originalPrice: product.price,
        offer: offer.offer,
        discountAmount: offer.discountAmount,
        finalPrice: offer.finalPrice,
      };
    }),
  );

  let wishlistIds = [];

  if (userId) {
    const wishlist = await Wishlist.findOne({
      user: userId,
    }).lean();

    if (wishlist) {
      wishlistIds = wishlist.products.map((id) => id.toString());
    }
  }

  return {
    products: productsWithOffers,
    brands,
    categories,
    selectedCategory,
    wishlistIds,
    pagination: {
      currentPage,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      limit,
    },
  };
};

export const getProductDetailsService = async (slug) => {
  const product = await Product.findOne({
    slug,
    isListed: true,
    isDeleted: false,
  })
    .populate("category")
    .lean();

  if (!product) {
    throw new Error("PRODUCT NOT FOUND");
  }

  if (!product.category.isListed) {
    throw new Error("PRODUCT NOT AVAILABLE");
  }

  const totalStock = product.variants.reduce(
    (total, variant) => total + variant.stock,
    0,
  );

  const offer = await getBestOfferService({
    ...product,
    category: product.category?._id || product.category,
  });

  const productWithOffer = {
    ...product,
    originalPrice: product.price,
    offer: offer.offer,
    discountAmount: offer.discountAmount,
    finalPrice: offer.finalPrice,
  };

  const relatedProducts = await Product.find({
    _id: { $ne: product._id },
    isListed: true,
    isDeleted: false,
  })
    .populate("category", "name")
    .limit(4)
    .lean();

  const relatedProductsWithOffers = await Promise.all(
    relatedProducts.map(async (related) => {
      const relatedOffer = await getBestOfferService({
        ...related,
        category: related.category?._id || related.category,
      });

      return {
        ...related,
        originalPrice: related.price,
        offer: relatedOffer.offer,
        discountAmount: relatedOffer.discountAmount,
        finalPrice: relatedOffer.finalPrice,
      };
    }),
  );

  const categories = await Category.find({ isListed: true, isDeleted: false });

  return {
    product: productWithOffer,
    totalStock,
    relatedProducts: relatedProductsWithOffers,
    categories,
  };
};
