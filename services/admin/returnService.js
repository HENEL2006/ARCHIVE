import Order from "../../models/order.js";
import { updateOverallOrderStatus } from "../../utils/orderStatus.js";
import { creditWalletService } from "../user/walletService.js";

export const getReturnRequestService = async (
  search = "",
  status = "",
  sort = "newest",
  page = 1,
  limit = 10,
) => {
  const query = {};

  if (status) {
    query["items.itemStatus"] = status;
  } else {
    query["items.itemStatus"] = {
      $in: ["RETURN_REQUESTED", "RETURNED", "RETURN_REJECTED"],
    };
  }

  const orders = await Order.find(query)
    .populate("userId", "username email")
    .sort({ updatedAt: sort === "oldest" ? 1 : -1 })
    .lean();

  const returnRequests = [];

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (status && item.itemStatus !== status) {
        return;
      }

      if (
        !status &&
        !["RETURN_REQUESTED", "RETURNED", "RETURN_REJECTED"].includes(
          item.itemStatus,
        )
      ) {
        return;
      }

      const customerName =
        order.userId?.username ||
        order.deliveryAddress?.fullName ||
        "Unknown Customer";

      const searchText = search.trim().toLowerCase();

      if (
        searchText &&
        !order.orderId.toLowerCase().includes(searchText) &&
        !customerName.toLowerCase().includes(searchText) &&
        !item.name.toLowerCase().includes(searchText)
      ) {
        return;
      }

      returnRequests.push({
        orderId: order.orderId,
        customerName,
        productName: item.name,
        reason: item.returnReason || "No Reason Provided",
        status: item.itemStatus,
        itemId: item._id,
      });
    });
  });

  const totalRequests = returnRequests.length;
  const totalPages = Math.ceil(totalRequests / limit);

  const currentPage =
    totalPages === 0 ? 1 : Math.min(Math.max(Number(page), 1), totalPages);

  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedRequests = returnRequests.slice(startIndex, endIndex);

  return {
    returnRequests: paginatedRequests,
    totalRequests,
    currentPage,
    totalPages,
    limit,
  };
};

export const approveReturnService = async (orderId, itemId) => {
  const order = await Order.findOne({ orderId });
  if (!order) {
    throw new Error("ORDER NOT FOUND");
  }

  const item = order.items.id(itemId);
  if (!item) {
    throw new Error("ORDER ITEM NOT FOUND");
  }

  if (item.itemStatus !== "RETURN_REQUESTED") {
    throw new Error("RETURN REQUEST IS NOT PENDING");
  }

  const itemDiscount =
    order.subtotal > 0 ? (item.itemTotal / order.subtotal) * order.discount : 0;

  const refundAmount = item.itemTotal - itemDiscount;
  
  await creditWalletService(
    order.userId,
    item.itemTotal,
    "RETURN_REFUND",
    order.orderId,
  );

  item.itemStatus = "RETURNED";

  updateOverallOrderStatus(order);

  await order.save();
  return order;
};

export const rejectReturnService = async (orderId, itemId) => {
  const order = await Order.findOne({ orderId });

  if (!order) {
    throw new Error("ORDER NOT FOUND");
  }

  const item = order.items.id(itemId);

  if (!item) {
    throw new Error("ORDER ITEM NOT FOUND");
  }

  if (item.itemStatus !== "RETURN_REQUESTED") {
    throw new Error("RETURN REQUEST IS NOT PENDING");
  }

  item.itemStatus = "RETURN_REJECTED";

  updateOverallOrderStatus(order);

  await order.save();

  return order;
};

export const getReturnStatisticsService = async () => {
  const result = await Order.aggregate([
    {
      $unwind: "$items",
    },
    {
      $match: {
        "items.itemStatus": {
          $in: ["RETURN_REQUESTED", "RETURNED", "RETURN_REJECTED"],
        },
      },
    },
    {
      $group: {
        _id: "$items.itemStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  const statistics = {
    totalReturns: 0,
    pendingReturns: 0,
    approvedReturns: 0,
    rejectedReturns: 0,
  };

  result.forEach((item) => {
    statistics.totalReturns += item.count;

    if (item._id === "RETURN_REQUESTED") {
      statistics.pendingReturns = item.count;
    }

    if (item._id === "RETURNED") {
      statistics.approvedReturns = item.count;
    }

    if (item._id === "RETURN_REJECTED") {
      statistics.rejectedReturns = item.count;
    }
  });

  return statistics;
};
