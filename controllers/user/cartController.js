
import {
  addToCartService,
  getCartService,
  updateCartQuantityService,
  removeCartItemService,
} from "../../services/user/cartService.js";

export const addToCart = async (req, res) => {
  try {
    await addToCartService(req.session.userId, req.body);

    req.session.toast = {
      type: "success",
      message: "ADDED TO CART SUCCESFULLY",
    };
    res.redirect(req.get("Referrer") || "/products");
  } catch (error) {
    console.log(error);
    req.session.toast = {
      type: "error",
      message: error.message,
    };

    res.redirect(req.get("Referrer") || "/products");
  }
};

export const loadCart = async (req, res) => {
  try {
    const { cart, subtotal, shipping, discount, total } = await getCartService(
      req.session.userId,
    );

    res.render("user/cart", {
      cart,
      subtotal,
      shipping,
      discount,
      total,
      activePage: "cart",
    });
  } catch (error) {
    console.log(error);
    req.session.toast = {
      type: "error",
      message: error.message,
    };
  }
};

export const updateCartQuantity = async (req, res) => {
  try {
    await updateCartQuantityService(req.session.userId, req.body);

    const { subtotal, shipping, discount, total } = await getCartService(
      req.session.userId,
    );

    return res.status(200).json({
      success: true,
      message: "CART UPDATED",
      subtotal,
      shipping,
      discount,
      total,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    await removeCartItemService(req.session.userId, req.body);

    const { subtotal, shipping, discount, total } = await getCartService(
      req.session.userId,
    );

    return res.status(200).json({
      success: true,
      message: "ITEM REMOVED",
      subtotal,
      shipping,
      discount,
      total,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

