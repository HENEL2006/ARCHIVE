import mongoose from "mongoose";
import Address from "../../models/address.js";
import Cart from "../../models/cart.js";
import Product from "../../models/product.js";
import Order from "../../models/order.js";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";
import { debitWalletService } from "./walletService.js";

export const placeOrderService = async (userId, data) => {
  const { addressId, payment, transactionId } = data;

  if (!addressId || !payment) {
    throw new Error("ADDRESS AND PAYMENT METHOD REQUIRED");
  }

  if (!["COD", "RAZORPAY", "WALLET"].includes(payment)) {
    throw new Error("INVALID PAYMENT METHOD");
  }

  if (payment === "RAZORPAY" && !transactionId) {
    throw new Error("RAZORPAY TRANSACTION ID REQUIRED");
  }

  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new Error("INVALID ADDRESS");
  }

  const address = await Address.findOne({
    _id: addressId,
    userId,
  }).lean();

  if (!address) {
    throw new Error("ADDRESS NOT FOUND");
  }

  const cart = await Cart.findOne({
    user: userId,
  }).lean();

  if (!cart || cart.items.length === 0) {
    throw new Error("YOUR CART IS EMPTY");
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = await Product.findById(item.product)
      .populate("category")
      .lean();

    if (!product) {
      throw new Error("A PRODUCT NO LONGER EXISTS");
    }

    if (product.isDeleted || !product.isListed) {
      throw new Error(`${product.name} IS UNAVAILABLE`);
    }

    if (
      !product.category ||
      !product.category.isListed ||
      product.category.isDeleted
    ) {
      throw new Error(`${product.name} IS UNAVAILABLE`);
    }

    const variant = product.variants.find(
      (variant) => variant.size === item.size,
    );

    if (!variant) {
      throw new Error(`${product.name} SIZE IS NO LONGER AVAILABLE`);
    }

    if (variant.stock < item.quantity) {
      throw new Error(
        `ONLY ${variant.stock} ${item.size} LEFT FOR ${product.name}`,
      );
    }

    const itemTotal = item.price * item.quantity;

    subtotal += itemTotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || "",
      size: item.size,
      quantity: item.quantity,
      price: item.price,
      itemTotal,
    });
  }

  const shipping = subtotal > 0 ? 99 : 0;
  const discount = 0;
  const tax = 0;

  const total = subtotal + shipping + tax - discount;

  const timestamp = Date.now().toString().slice(4);

  const orderId = `ARC-${timestamp}-${Math.floor(1000 + Math.random() * 9000)}`;

  if (payment === "WALLET") {
    await debitWalletService(userId, total, orderId);
  }

  const order = await Order.create({
    orderId,
    userId,
    items: orderItems,
    deliveryAddress: {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    },
    subtotal,
    shipping,
    discount,
    tax,
    total,
    paymentMethod: payment,
    paymentStatus:
      payment === "RAZORPAY" || payment === "WALLET" ? "PAID" : "PENDING",
    transactionId: payment === "RAZORPAY" ? transactionId : null,
    orderStatus: "PLACED",
  });

  for (const item of cart.items) {
    await Product.updateOne(
      {
        _id: item.product,
        "variants.size": item.size,
      },
      {
        $inc: {
          "variants.$.stock": -item.quantity,
        },
      },
    );
  }

  await Cart.updateOne({ user: userId }, { $set: { items: [] } });

  return order;
};

export const createRazorpayOrderService = async (userId, data) => {
  const { addressId } = data;

  if (!addressId) {
    throw new Error("ADDRESS IS REQUIRED");
  }

  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new Error("INVALID ADDRESS");
  }

  const address = await Address.findOne({
    _id: addressId,
    userId,
  }).lean();

  if (!address) {
    throw new Error("ADDRESS NOT FOUND");
  }

  const cart = await Cart.findOne({
    user: userId,
  }).lean();

  if (!cart || cart.items.length === 0) {
    throw new Error("YOUR CART IS EMPTY");
  }

  let subtotal = 0;

  for (const item of cart.items) {
    const product = await Product.findById(item.product)
      .populate("category")
      .lean();

    if (!product) {
      throw new Error("A PRODUCT NO LONGER EXISTS");
    }

    if (product.isDeleted || !product.isListed) {
      throw new Error(`${product.name} IS UNAVAILABLE`);
    }

    if (
      !product.category ||
      !product.category.isListed ||
      product.category.isDeleted
    ) {
      throw new Error(`${product.name} IS UNAVAILABLE`);
    }

    const variant = product.variants.find(
      (variant) => variant.size === item.size,
    );

    if (!variant) {
      throw new Error(`${product.name} SIZE IS NO LONGER AVAILABLE`);
    }

    if (variant.stock < item.quantity) {
      throw new Error(
        `ONLY ${variant.stock} ${item.size} LEFT FOR ${product.name}`,
      );
    }

    subtotal += item.price * item.quantity;
  }

  const shipping = subtotal > 0 ? 99 : 0;
  const discount = 0;
  const tax = 0;

  const total = subtotal + shipping + tax - discount;

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(total * 100),
    currency: "INR",
    receipt: `ARC-${Date.now()}`,
  });

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  };
};

export const verifyRazorpayPaymentService = async (userId, data) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    addressId,
  } = data;

  if (
    !razorpay_payment_id ||
    !razorpay_order_id ||
    !razorpay_signature ||
    !addressId
  ) {
    throw new Error("INVALID PAYMENT DETAILS");
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    throw new Error("PAYMENT SIGNATURE VERIFICATION FAILED");
  }

  const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);

  if (!razorpayOrder) {
    throw new Error("RAZORPAY ORDER NOT FOUND");
  }

  const cart = await Cart.findOne({
    user: userId,
  }).lean();

  if (!cart || cart.items.length === 0) {
    throw new Error("YOUR CART IS EMPTY");
  }

  let subtotal = 0;

  for (const item of cart.items) {
    const product = await Product.findById(item.product)
      .populate("category")
      .lean();

    if (!product) {
      throw new Error("A PRODUCT NO LONGER EXISTS");
    }

    if (product.isDeleted || !product.isListed) {
      throw new Error(`${product.name} IS UNAVAILABLE`);
    }

    if (
      !product.category ||
      !product.category.isListed ||
      product.category.isDeleted
    ) {
      throw new Error(`${product.name} IS UNAVAILABLE`);
    }

    const variant = product.variants.find(
      (variant) => variant.size === item.size,
    );

    if (!variant) {
      throw new Error(`${product.name} SIZE IS NO LONGER AVAILABLE`);
    }

    if (variant.stock < item.quantity) {
      throw new Error(
        `ONLY ${variant.stock} ${item.size} LEFT FOR ${product.name}`,
      );
    }

    subtotal += item.price * item.quantity;
  }

  const shipping = subtotal > 0 ? 99 : 0;
  const discount = 0;
  const tax = 0;

  const total = subtotal + shipping + tax - discount;

  const expectedAmount = Math.round(total * 100);

  if (Number(razorpayOrder.amount) !== expectedAmount) {
    throw new Error("PAYMENT AMOUNT MISMATCH");
  }

  if (razorpayOrder.currency !== "INR") {
    throw new Error("INVALID PAYMENT CURRENCY");
  }

  const order = await placeOrderService(userId, {
    addressId,
    payment: "RAZORPAY",
    transactionId: razorpay_payment_id,
  });

  return order;
};

export const getOrderByIdService = async (userId, orderId) => {
  const order = await Order.findOne({
    orderId,
    userId,
  }).lean();

  if (!order) {
    throw new Error("ORDER NOT FOUND");
  }

  return order;
};
