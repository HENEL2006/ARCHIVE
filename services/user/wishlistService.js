import Product from "../../models/product.js";
import Wishlist from "../../models/wishlist.js";

export const addToWishlistService = async (userId, productId) => {
  if (!productId) {
    throw new Error("PRODUCT ID REQUIRED");
  }
  const product = await Product.findOne({
    _id: productId,
    isListed: true,
    isDeleted: false,
  }).populate("category");

  if (
    !product ||
    !product.category ||
    !product.category.isListed ||
    product.category.isDeleted
  ) {
    throw new Error("PRODUCT IS UNAVAILABLE");
  }

  let wishlist = await Wishlist.findOne({
    user: userId,
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      products: [productId],
    });
    return wishlist;
  }

  if (wishlist.products.some((id) => id.toString() === productId)) {
    throw new Error("PRODUCT ALREADY IN WISHLIST");
  }

  wishlist.products.push(productId);
  await wishlist.save();
  return wishlist;
};

export const removeFromWishlistService = async (userId, productId) => {
  if (!productId) {
    throw new Error("PRODUCT ID REQUIRED");
  }

  const wishlist = await Wishlist.findOne({
    user: userId,
  });

  if (!wishlist) {
    throw new Error("WISHLIST NOT FOUND");
  }

  wishlist.products = wishlist.products.filter(
    (id) => id.toString() !== productId,
  );

  await wishlist.save();

  return wishlist;
};

export const getWishlistService = async (userId) => {
  const wishlist = await Wishlist.findOne({
    user: userId,
  })
    .populate({
      path: "products",
      match: {
        isListed: true,
        isDeleted: false,
      },
      populate: {
        path: "category",
        select: "name isListed isDeleted",
      },
    })
    .lean();

  if (!wishlist) {
    return [];
  }

  return wishlist.products.filter(
    (product) =>
      product &&
      product.category &&
      product.category.isListed &&
      !product.category.isDeleted,
  );
};
