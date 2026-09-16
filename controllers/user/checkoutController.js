import { getUserAddresses } from "../../services/user/addressService.js";
import {
  getCartService,
  validateCartService,
} from "../../services/user/cartService.js";
import {
  createRazorpayOrderService,
  getOrderByIdService,
  placeOrderService,
  verifyRazorpayPaymentService,
} from "../../services/user/checkoutService.js";
import { getWalletService } from "../../services/user/walletService.js";

export const loadCheckout = async (req, res) => {
  try {
    await validateCartService(req.session.userId);

    const addresses = await getUserAddresses(req.session.userId);

    const { cart, subtotal, shipping, discount, total } = await getCartService(
      req.session.userId,
    );

    const wallet = await getWalletService(req.session.userId);

    res.render("user/checkout", {
      addresses,
      cart,
      subtotal,
      shipping,
      discount,
      total,
      wallet,
      activePage: "checkout",
    });
  } catch (error) {
    console.log(error);
    req.session.toast = {
      type: "error",
      message: error.message,
    };
    res.redirect("/cart");
  }
};

export const placeOrder = async (req, res) => {
  try {
    const order = await placeOrderService(req.session.userId, req.body);

    req.session.toast = {
      type: "success",
      message: "ORDER PLACED SUCCESSFULLY",
    };

    res.redirect(`/order-success/${order.orderId}`);
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    res.redirect("/checkout");
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const razorpayOrder = await createRazorpayOrderService(
      req.session.userId,
      req.body,
    );

    return res.status(200).json({
      success: true,
      ...razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const order = await verifyRazorpayPaymentService(
      req.session.userId,
      req.body,
    );

    return res.status(200).json({
      success: true,
      orderId: order.orderId,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const loadOrderSuccess = async (req, res) => {
  try {
    const order = await getOrderByIdService(
      req.session.userId,
      req.params.orderId,
    );

    res.render("user/orderSuccess", {
      order,
      activePage: "order-success",
    });
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    res.redirect("/orders");
  }
};

export const loadPaymentFailed = async (req, res) => {
  return res.render("user/paymentFailed");
};
