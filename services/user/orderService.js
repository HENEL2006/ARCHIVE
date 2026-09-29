import Order from "../../models/order.js";
import Product from "../../models/product.js";
import { updateOverallOrderStatus } from "../../utils/orderStatus.js";
import { creditWalletService } from "./walletService.js";

export const getUserOrdersService = async (
  userId,
  page = 1,
  status = "ALL",
  search = "",
) => {
  const limit = 5;
  const skip = (page - 1) * limit;
  const query = { userId };

  if (status !== "ALL") {
    query.orderStatus = status;
  }

  if (search.trim()) {
    query.$or = [
      {
        orderId: {
          $regex: search.trim(),
          $options: "i",
        },
      },
      {
        "items.name": {
          $regex: search.trim(),
          $options: "i",
        },
      },
    ];
  }
  const [orders, totalOrders] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),

    Order.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalOrders / limit);

  const orderCount = await Order.countDocuments({ userId });

  return {
    orders,
    currentPage: page,
    totalPages,
    totalOrders,
    currentStatus: status,
    search: search.trim(),
    orderCount,
  };
};

export const getOrderDetailsService = async (userId, orderId) => {
  const order = await Order.findOne({
    userId,
    orderId,
  }).lean();

  if (!order) {
    throw new Error("ORDER NOT FOUND");
  }

  return order;
};

export const cancelOrderService = async (
  userId,
  orderId,
  cancellationReason,
) => {
  const order = await Order.findOne({ userId, orderId });

  if (!order) {
    throw new Error("ORDER NOT FOUND");
  }

  if (!["PLACED", "CONFIRMED"].includes(order.orderStatus)) {
    throw new Error("ORDER CANNOT BE CANCELLED");
  }

  if (!cancellationReason || !cancellationReason.trim()) {
    throw new Error("CANCELLATION REASON IS REQUIRED");
  }

  const reason = cancellationReason.trim();

  for (const item of order.items) {
    if (item.itemStatus === "CANCELLED") {
      continue;
    }

    await Product.updateOne(
      {
        _id: item.product,
        "variants.size": item.size,
      },
      {
        $inc: {
          "variants.$.stock": item.quantity,
        },
      },
    );

    item.itemStatus = "CANCELLED";
    item.cancellationSource = "CUSTOMER";
    item.cancellationReason = reason;
  }

  if (
    ["RAZORPAY", "WALLET"].includes(order.paymentMethod) &&
    order.paymentStatus === "PAID"
  ) {
    const refundableItems = order.items.filter(
      (item) => item.refundStatus !== "REFUNDED",
    );

    if (refundableItems.length > 0) {
      const itemRefundAmount = refundableItems.reduce(
        (total, item) => total + item.finalItemTotal,
        0,
      );

      const refundAmount = Number(
        (itemRefundAmount + order.shipping).toFixed(2),
      );

      await creditWalletService(
        userId,
        refundAmount,
        "ORDER_CANCELLATION_REFUND",
        order.orderId,
      );

      for (const item of refundableItems) {
        item.refundStatus = "REFUNDED";
        item.refundAmount = item.finalItemTotal;
      }

      order.refundedAmount = Number(
        ((order.refundedAmount || 0) + refundAmount).toFixed(2),
      );
    }
  }

  order.orderStatus = "CANCELLED";
  order.cancellationReason = reason;

  await order.save();

  return order;
};

export const cancelOrderItemService = async (
  userId,
  orderId,
  itemId,
  cancellationReason,
) => {
  const order = await Order.findOne({
    userId,
    orderId,
  });

  if (!order) {
    throw new Error("ORDER NOT FOUND");
  }

  const item = order.items.id(itemId);

  if (!item) {
    throw new Error("ORDER ITEM NOT FOUND");
  }

  if (!cancellationReason || !cancellationReason.trim()) {
    throw new Error("CANCELLATION REASON IS REQUIRED");
  }

  if (!["PLACED", "CONFIRMED"].includes(item.itemStatus)) {
    throw new Error("ITEM CANNOT BE CANCELLED");
  }

  const reason = cancellationReason.trim();

  await Product.updateOne(
    {
      _id: item.product,
      "variants.size": item.size,
    },
    {
      $inc: {
        "variants.$.stock": item.quantity,
      },
    },
  );

  item.itemStatus = "CANCELLED";
  item.cancellationSource = "CUSTOMER";
  item.cancellationReason = reason;

  const allItemsCancelled = order.items.every(
    (orderItem) => orderItem.itemStatus === "CANCELLED",
  );

  if (
    ["RAZORPAY", "WALLET"].includes(order.paymentMethod) &&
    order.paymentStatus === "PAID" &&
    item.refundStatus !== "REFUNDED"
  ) {
    let refundAmount = item.finalItemTotal;

    if (allItemsCancelled) {
      refundAmount += order.shipping;
    }

    refundAmount = Number(refundAmount.toFixed(2));

    await creditWalletService(
      userId,
      refundAmount,
      "ORDER_CANCELLATION_REFUND",
      order.orderId,
    );

    item.refundStatus = "REFUNDED";
    item.refundAmount = refundAmount;

    order.refundedAmount = Number(
      ((order.refundedAmount || 0) + refundAmount).toFixed(2),
    );
  }

  if (allItemsCancelled) {
    order.orderStatus = "CANCELLED";
    order.cancellationReason = reason;
  }

  await order.save();

  return order;
};

export const requestReturnService = async (
  userId,
  orderId,
  itemId,
  returnReason,
) => {
  if (!returnReason || !returnReason.trim()) {
    throw new Error("RETURN REASON IS REQUIRED");
  }

  const order = await Order.findOne({ orderId, userId });

  if (!order) {
    throw new Error("ORDER NOT FOUND");
  }

  const item = order.items.id(itemId);

  if (!item) {
    throw new Error("ORDER ITEM NOT FOUND");
  }

  if (item.itemStatus !== "DELIVERED") {
    throw new Error("ONLY DELIVERED PRODUCTS CAN BE RETURNED");
  }

  item.itemStatus = "RETURN_REQUESTED";
  item.returnReason = returnReason.trim();

  updateOverallOrderStatus(order);

  await order.save();
  return order;
};
