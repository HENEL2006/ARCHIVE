import Category from "../models/category.js";
import Cart from "../models/cart.js";
import Wishlist from "../models/wishlist.js";

export const attachCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({
      isListed: true,
      isDeleted: false,
    })
      .select("name slug")
      .lean();

    res.locals.categories = categories;

    let cartCount = 0;
    let wishlistCount = 0;

    if (req.session && req.session.userId) {
      const [cart, wishlist] = await Promise.all([
        Cart.findOne({ user: req.session.userId }).lean(),
        Wishlist.findOne({ user: req.session.userId }).lean(),
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

    next();
  } catch (error) {
    next(error);
  }
};