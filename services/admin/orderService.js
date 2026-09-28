import Order from "../../models/order.js";
import Product from "../../models/product.js";
import User from "../../models/User.js";
import { updateOverallOrderStatus } from "../../utils/orderStatus.js";
import { completeReferralService } from "../user/referralService.js";

export const getOrdersService = async (
  page = 1,
  limit = 10,
  search = "",
  status = "ALL",
  paymentStatus = "ALL",
) => {
  const currentPage = Math.max(Number(page) || 1, 1);
  const perPage = Math.max(Number(limit) || 10, 1);

  const skip = (currentPage - 1) * perPage;

  const query = {};

  const trimmedSearch = search.trim();

  if (trimmedSearch) {
    const matchingUsers = await User.find({
      $or: [
        {
          username: {
            $regex: trimmedSearch,
            $options: "i",
          },
        },
        {
          email: {
            $regex: trimmedSearch,
            $options: "i",
          },
        },
      ],
    })
      .select("_id")
      .lean();

    const userIds = matchingUsers.map((user) => user._id);

    query.$or = [
      {
        orderId: {
          $regex: trimmedSearch,
          $options: "i",
        },
      },
      {
        "items.name": {
          $regex: trimmedSearch,
          $options: "i",
        },
      },
      {
        "deliveryAddress.phone": {
          $regex: trimmedSearch,
          $options: "i",
        },
      },
      {
        userId: {
          $in: userIds,
        },
      },
    ];
  }

  if (status !== "ALL") {
    query.orderStatus = status;
  }

  if (paymentStatus !== "ALL") {
    query.paymentStatus = paymentStatus;
  }

  const [orders, totalOrders] = await Promise.all([
    Order.find(query)
      .populate("userId", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .lean(),
    Order.countDocuments(query),
  ]);

  orders.forEach((order) => {
    const activeItems = order.items.filter(
      (item) => item.itemStatus !== "CANCELLED",
    );

    const cancelledItems = order.items.filter(
      (item) => item.itemStatus === "CANCELLED",
    );

    order.activeTotal = activeItems.reduce(
      (sum, item) => sum + item.itemTotal,
      0,
    );

    order.cancelledTotal = cancelledItems.reduce(
      (sum, item) => sum + item.itemTotal,
      0,
    );

    order.activeItemCount = activeItems.length;
    order.cancelledItemCount = cancelledItems.length;
  });

  const [
    totalOrderCount,
    pendingCount,
    shippedCount,
    deliveredCount,
    cancelledCount,
  ] = await Promise.all([
    Order.countDocuments(),

    Order.countDocuments({
      orderStatus: {
        $in: ["PLACED", "CONFIRMED"],
      },
    }),
    Order.countDocuments({
      orderStatus: "SHIPPED",
    }),
    Order.countDocuments({
      orderStatus: "DELIVERED",
    }),
    Order.countDocuments({
      orderStatus: "CANCELLED",
    }),
  ]);

  const totalPages = Math.ceil(totalOrders / perPage);

  return {
    orders,
    currentPage,
    totalPages,
    totalOrders,
    perPage,
    search: trimmedSearch,
    status,
    paymentStatus,
    statistics: {
      totalOrders: totalOrderCount,
      pending: pendingCount,
      shipped: shippedCount,
      delivered: deliveredCount,
      cancelled: cancelledCount,
    },
  };
};

export const updateOrderStatusService = async (orderId, newStatus) => {
  const allowedStatuses = [
    "PLACED",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "RETURN_REQUESTED",
    "RETURNED",
  ];

  if (!allowedStatuses.includes(newStatus)) {
    throw new Error("INVALID ORDER STATUS");
  }

  const order = await Order.findOne({ orderId });

  if (!order) {
    throw new Error("ORDER NOT FOUND");
  }

  const activeItems = order.items.filter(
    (item) =>
      item.itemStatus !== "CANCELLED" && item.itemStatus !== "RETURN_REQUESTED",
  );

  if (newStatus === "CANCELLED") {
    const nonCancellableItems = order.items.filter((item) =>
      ["SHIPPED", "DELIVERED", "RETURNED", "RETURN_REQUESTED"].includes(
        item.itemStatus,
      ),
    );

    if (nonCancellableItems.length > 0) {
      throw new Error(
        "ORDER CANNOT BE CANCELLED BECAUSE ONE OR MORE PRODUCTS HAVE ALREADY BEEN SHIPPED, DELIVERED, RETURNED, OR HAVE A RETURN REQUEST",
      );
    }

    const cancellableItems = order.items.filter(
      (item) => item.itemStatus !== "CANCELLED",
    );

    if (cancellableItems.length === 0) {
      throw new Error("ALL PRODUCTS IN THIS ORDER ARE ALREADY CANCELLED");
    }

    for (const item of cancellableItems) {
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
      item.cancellationSource = "ADMIN";
      item.cancellationReason = "Order cancelled by admin";
    }

    updateOverallOrderStatus(order);

    await order.save();

    return order;
  }

  if (activeItems.length === 0) {
    throw new Error("NO PRODUCTS AVAILABLE FOR ORDER STATUS UPDATE");
  }

  activeItems.forEach((item) => {
    item.itemStatus = newStatus;
  });

  updateOverallOrderStatus(order);

  await order.save();

  if (order.orderStatus === "DELIVERED") {
    await completeReferralService(order.userId);
  }

  return order;
};

export const updateOrderItemStatusService = async (
  orderId,
  itemId,
  newStatus,
) => {
  const allowedStatuses = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

  if (!allowedStatuses.includes(newStatus)) {
    throw new Error("INVALID ITEM STATUS");
  }

  const order = await Order.findOne({ orderId });

  if (!order) {
    throw new Error("ORDER NOT FOUND");
  }

  const item = order.items.id(itemId);

  if (!item) {
    throw new Error("ORDER ITEM NOT FOUND");
  }

  if (item.itemStatus === "CANCELLED") {
    throw new Error("CANCELLED PRODUCT STATUS CANNOT BE CHANGED");
  }

  if (item.itemStatus === "RETURN_REQUESTED") {
    throw new Error("RETURN REQUESTED PRODUCT STATUS CANNOT BE CHANGED");
  }

  item.itemStatus = newStatus;

  updateOverallOrderStatus(order);

  await order.save();

  if (order.orderStatus === "DELIVERED") {
    await completeReferralService(order.userId);
  }

  return order;
};

export const cancelOrderItemByAdminService = async (
  orderId,
  itemId,
  cancellationReason,
) => {
  if (!cancellationReason || !cancellationReason.trim()) {
    throw new Error("CANCELLATION REASON IS REQUIRED");
  }

  const order = await Order.findOne({ orderId });

  if (!order) {
    throw new Error("ORDER NOT FOUND");
  }

  const item = order.items.id(itemId);

  if (!item) {
    throw new Error("ORDER ITEM NOT FOUND");
  }

  if (item.itemStatus === "CANCELLED") {
    throw new Error("ITEM IS ALREADY CANCELLED");
  }

  if (
    item.itemStatus === "SHIPPED" ||
    item.itemStatus === "DELIVERED" ||
    item.itemStatus === "RETURNED"
  ) {
    throw new Error("THIS ITEM CANNOT BE CANCELLED AT THIS STAGE");
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
  item.cancellationSource = "ADMIN";
  item.cancellationReason = cancellationReason.trim();

  updateOverallOrderStatus(order);

  await order.save();

  return order;
};

export const getAdminOrderDetailsService = async (orderId) => {
  const order = await Order.findOne({ orderId })
    .populate("userId", "username email profileImage createdAt")
    .lean();

  if (!order) {
    throw new Error("ORDER NOT FOUND");
  }

  const activeItems = order.items.filter(
    (item) => item.itemStatus !== "CANCELLED",
  );

  const cancelledItems = order.items.filter(
    (item) => item.itemStatus === "CANCELLED",
  );

  const activeTotal = activeItems.reduce(
    (sum, item) => sum + Number(item.itemTotal || 0),
    0,
  );

  const cancelledTotal = cancelledItems.reduce(
    (sum, item) => sum + Number(item.itemTotal || 0),
    0,
  );

  const isFullyCancelled = activeItems.length === 0;

  const effectiveShipping = isFullyCancelled ? 0 : Number(order.shipping || 0);

  const payableAmount = isFullyCancelled
    ? 0
    : Math.max(
        0,
        activeTotal +
          effectiveShipping +
          Number(order.tax || 0) -
          Number(order.discount || 0),
      );

  return {
    ...order,

    activeTotal,
    cancelledTotal,

    activeItemCount: activeItems.length,
    cancelledItemCount: cancelledItems.length,

    effectiveShipping,
    payableAmount,
  };
};
