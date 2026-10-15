import Category from "../models/category.js";
import Cart from "../models/cart.js";
import Wishlist from "../models/wishlist.js";

// In-memory cache for categories to prevent Atlas roundtrips on every request
let cachedCategories = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const invalidateCategoryCache = () => {
  cachedCategories = null;
  cacheExpiry = 0;
};

export const getCachedCategories = async () => {
  const now = Date.now();
  if (cachedCategories && cacheExpiry > now) {
    return cachedCategories;
  }

  const categories = await Category.find({
    isListed: true,
    isDeleted: false,
  })
    .select("name slug")
    .lean();

  cachedCategories = categories;
  cacheExpiry = now + CACHE_TTL_MS;
  return cachedCategories;
};

export const attachCategories = async (req, res, next) => {
  try {
    // Skip overhead entirely for admin routes
    if (req.originalUrl?.startsWith("/admin") || req.path?.startsWith("/admin")) {
      return next();
    }

    const categories = await getCachedCategories();
    res.locals.categories = categories;

    let cartCount = 0;
    let wishlistCount = 0;

    if (req.session && req.session.userId) {
      const [cart, wishlist] = await Promise.all([
        Cart.findOne({ user: req.session.userId }, { "items.quantity": 1 }).lean(),
        Wishlist.findOne({ user: req.session.userId }, { products: 1 }).lean(),
      ]);

      if (cart && cart.items) {
        cartCount = cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      }
      if (wishlist && wishlist.products) {
        wishlistCount = wishlist.products.length;
      }
    }

    res.locals.cartCount = cartCount;
    res.locals.wishlistCount = wishlistCount;
    res.locals.isLoggedIn = !!(req.session && req.session.userId);

    next();
  } catch (error) {
    next(error);
  }
};