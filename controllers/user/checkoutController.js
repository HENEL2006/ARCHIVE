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
  createFailedOrderService,
  createRetryRazorpayOrderService,
  verifyRetryRazorpayPaymentService,
} from "../../services/user/checkoutService.js";
import {
  applyCouponService,
  getAppliedCouponService,
  getAvailableCouponsService,
} from "../../services/user/couponService.js";
import { getWalletService } from "../../services/user/walletService.js";
import Order from "../../models/order.js";

export const loadCheckout = async (req, res) => {
  try {
    await validateCartService(req.session.userId);

    const addresses = await getUserAddresses(req.session.userId);

    const { cart, subtotal, shipping } = await getCartService(
      req.session.userId,
    );

    let appliedCoupon = null;
    let discount = 0;

    if (req.session.appliedCoupon) {
      try {
        const validated = await getAppliedCouponService(
          req.session.userId,
          req.session.appliedCoupon,
          subtotal,
        );
        appliedCoupon = {
          ...req.session.appliedCoupon,
          discount: validated.discount,
        };
        discount = validated.discount;
      } catch {
        delete req.session.appliedCoupon;
      }
    }

    const availableCoupons = await getAvailableCouponsService(
      req.session.userId,
      subtotal,
    );

    const tax = 0;

    const total = subtotal + shipping + tax - discount;

    const wallet = await getWalletService(req.session.userId);

    res.render("user/checkout", {
      addresses,
      cart,
      subtotal,
      shipping,
      discount,
      total,
      wallet,
      appliedCoupon,
      availableCoupons,
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
    const order = await placeOrderService(
      req.session.userId,
      req.body,
      req.session.appliedCoupon,
    );

    delete req.session.appliedCoupon;

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
      req.session.appliedCoupon,
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
      req.session.appliedCoupon,
    );

    delete req.session.appliedCoupon;

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
  try {
    const reason = req.query.reason || "PAYMENT COULD NOT BE COMPLETED";
    const orderId = req.query.orderId || req.params.orderId || "";
    let order = null;

    if (orderId && req.session.userId) {
      order = await Order.findOne({ orderId, userId: req.session.userId }).lean();
    }

    const items = order ? order.items : [];
    const amount = order ? order.total : Number(req.query.amount || 0) / 100;
    const paymentMethod = order ? order.paymentMethod : "RAZORPAY";

    return res.render("user/paymentFailed", {
      reason,
      amount,
      orderId: order ? order.orderId : orderId,
      items,
      paymentMethod,
      order,
      activePage: "checkout",
    });
  } catch (error) {
    console.log(error);
    return res.render("user/paymentFailed", {
      reason: req.query.reason || "PAYMENT FAILED",
      amount: 0,
      orderId: "",
      items: [],
      paymentMethod: "RAZORPAY",
      order: null,
      activePage: "checkout",
    });
  }
};

export const createFailedOrder = async (req, res) => {
  try {
    const order = await createFailedOrderService(
      req.session.userId,
      req.body,
      req.session.appliedCoupon,
    );

    delete req.session.appliedCoupon;

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

export const createRetryRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const razorpayOrder = await createRetryRazorpayOrderService(
      req.session.userId,
      orderId,
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

export const verifyRetryRazorpayPayment = async (req, res) => {
  try {
    const order = await verifyRetryRazorpayPaymentService(
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

export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    const { subtotal } = await getCartService(req.session.userId);

    const coupon = await applyCouponService(req.session.userId, code, subtotal);

    req.session.appliedCoupon = coupon;

    return res.status(200).json({
      success: true,
      message: "COUPON APPLIED SUCCESSFULLY",
      coupon,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeCoupon = async (req, res) => {
  try {
    delete req.session.appliedCoupon;

    return res.status(200).json({
      success: true,
      message: "COUPON REMOVED SUCCESSFULLY",
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


