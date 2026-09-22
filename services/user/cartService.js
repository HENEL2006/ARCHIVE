import Cart from "../../models/cart.js";
import Product from "../../models/product.js";
import Wishlist from "../../models/wishlist.js";
import { getBestOfferService } from "./offerService.js";

export const addToCartService = async (userId, data) => {
  const { productId, size, quantity } = data;
  if (!productId || !size || !quantity) {
    throw new Error("ALL FIELDS REQUIRED");
  }

  const product = await Product.findById(productId).populate("category").lean();
  if (
    !product ||
    !product.isListed ||
    !product.category.isListed ||
    product.category.isDeleted
  ) {
    throw new Error("PRODUCT IS UNAVAILABLE");
  }

  const selectedVariant = product.variants.find(
    (variant) => variant.size === size,
  );

  if (!selectedVariant) {
    throw new Error("INVALID SIZE");
  }

  if (selectedVariant.stock < Number(quantity)) {
    throw new Error("INSUFFICIENT STOCK");
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = new Cart({
      user: userId,
      items: [],
    });
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId && item.size === size,
  );

  const maxCartQuantity = 5;

  if (existingItem) {
    const newQuantity = existingItem.quantity + Number(quantity);

    if (newQuantity > selectedVariant.stock) {
      throw new Error("INSUFFICIENT STOCK");
    }

    if (newQuantity > maxCartQuantity) {
      throw new Error("MAXIMUM 5 ITEMS ALLOWED");
    }

    existingItem.quantity = newQuantity;
  } else {
    if (Number(quantity) > maxCartQuantity) {
      throw new Error("MAXIMUM 5 ITEMS ALLOWED");
    }

    cart.items.push({
      product: product._id,
      size,
      quantity: Number(quantity),
      price: product.price,
    });
  }

  await cart.save();

  await Wishlist.updateOne(
    { user: userId },
    { $pull: { products: productId } },
  );
};

export const getCartService = async (userId) => {
  const cart = await Cart.findOne({ user: userId })
    .populate({
      path: "items.product",
      populate: { path: "category" },
    })
    .lean();

  if (!cart) {
    return {
      cart: {
        items: [],
      },
      subtotal: 0,
      shipping: 0,
      discount: 0,
      total: 0,
    };
  }

  let subtotal = 0;

  const cartItemsWithOffers = await Promise.all(
    cart.items.map(async (item) => {
      const product = item.product;

      const offer = await getBestOfferService({
        ...product,
        category: product.category?._id || product.category,
      });

      const finalPrice = offer.finalPrice;
      const itemTotal = finalPrice * item.quantity;

      subtotal += itemTotal;

      return {
        ...item,
        originalPrice: product.price,
        price: finalPrice,
        discountAmount: offer.discountAmount,
        offer: offer.offer,
        itemTotal,
      };
    }),
  );

  cart.items = cartItemsWithOffers;

  const shipping = subtotal > 0 ? 99 : 0;
  const discount = 0;

  const total = subtotal + shipping - discount;

  return {
    cart,
    subtotal,
    shipping,
    discount,
    total,
  };
};

export const updateCartQuantityService = async (userId, data) => {
  const { productId, size, action } = data;

  if (!productId || !size || !action) {
    throw new Error("INVALID REQUEST");
  }

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new Error("CART NOT FOUND");
  }

  const cartItem = cart.items.find(
    (item) => item.product.toString() === productId && item.size === size,
  );

  if (!cartItem) {
    throw new Error("ITEM NOT FOUND");
  }

  const product = await Product.findById(productId).populate("category");

  if (
    !product ||
    !product.category.isListed ||
    !product.isListed ||
    product.category.isDeleted
  ) {
    throw new Error("PRODUCT IS UNAVAILABLE");
  }

  const selectedVariant = product.variants.find(
    (variant) => variant.size === size,
  );

  if (!selectedVariant) {
    throw new Error("SIZE NOT AVAILABLE");
  }

  const maxCartQuantity = 5;

  if (action === "increase") {
    if (cartItem.quantity >= selectedVariant.stock) {
      throw new Error("INSUFFICIENT STOCK");
    }

    if (cartItem.quantity >= maxCartQuantity) {
      throw new Error("MAXIMUM 5 ITEMS ALLOWED");
    }

    cartItem.quantity++;
  } else if (action === "decrease") {
    if (cartItem.quantity > 1) {
      cartItem.quantity--;
    }
  } else {
    throw new Error("INVALID ACTIONS");
  }

  await cart.save();
};

export const removeCartItemService = async (userId, data) => {
  const { productId, size } = data;

  if (!productId || !size) {
    throw new Error("INVALID REQUEST");
  }

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new Error("CART NOT FOUND");
  }

  const itemExists = cart.items.some(
    (item) => item.product.toString() === productId && item.size === size,
  );

  if (!itemExists) {
    throw new Error("ITEM NOT FOUND");
  }

  cart.items = cart.items.filter(
    (item) => !(item.product.toString() === productId && item.size === size),
  );

  await cart.save();
};

export const validateCartService = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    populate: { path: "category" },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("YOUR CART IS EMPTY");
  }

  for (const item of cart.items) {
    const product = item.product;

    if (!product) {
      throw new Error("A PRODUCT NO LONGER EXISTS");
    }

    if (!product.isListed) {
      throw new Error(`${product.name} IS UNAVAILABLE `);
    }

    if (
      !product.category ||
      !product.category.isListed ||
      product.category.isDeleted
    ) {
      throw new Error(`${product.name} IS UNAVAILABLE`);
    }

    const variant = product.variants.find((v) => v.size === item.size);

    if (!variant) {
      throw new Error(`${product.name} SIZE IS NO LONGER AVAILABLE`);
    }

    if (variant.stock === 0) {
      throw new Error(`${product.name} IS OUT OF STOCK`);
    }

    if (item.quantity > variant.stock) {
      throw new Error(
        `ONLY ${variant.stock} ${item.size} LEFT FOR ${product.name}`,
      );
    }
  }
};
