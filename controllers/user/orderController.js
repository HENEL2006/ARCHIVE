import {
  cancelOrderItemService,
  cancelOrderService,
  getOrderDetailsService,
  getUserOrdersService,
  requestReturnService,
} from "../../services/user/orderService.js";
import { generateInvoice } from "../../utils/generateInvoice.js";

export const loadOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const allowedStatuses = [
      "ALL",
      "PLACED",
      "CONFIRMED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
    ];

    const status = allowedStatuses.includes(req.query.status)
      ? req.query.status
      : "ALL";

    const search = req.query.search || "";

    const { orders, currentPage, totalPages, totalOrders, currentStatus, orderCount } =
      await getUserOrdersService(req.session.userId, page, status, search);



    res.render("user/orders", {
      orders,
      currentPage,
      totalPages,
      totalOrders,
      currentStatus,
      search,
      orderCount,
      activePage: "orders",
    });
  } catch (error) {
    console.log(error);
    req.session.toast = {
      type: "error",
      message: error.message,
    };
    res.redirect("/");
  }
};

export const loadOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await getOrderDetailsService(req.session.userId, orderId);

    res.render("user/orderDetails", {
      order,
      activePage: "orders",
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

export const cancelOrder = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { orderId } = req.params;
    const { cancellationReason } = req.body;

    if (!cancellationReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "CANCELLATION REASON IS REQUIRED",
      });
    }

    await cancelOrderService(userId, orderId, cancellationReason);

    return res.status(200).json({
      success: true,
      message: "ORDER CANCELLED SUCCESSFULLY",
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelOrderItem = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { orderId, itemId } = req.params;
    const { cancellationReason } = req.body;

    if (!cancellationReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "CANCELLATION REASON IS REQUIRED",
      });
    }

    await cancelOrderItemService(
      userId,
      orderId,
      itemId,
      cancellationReason.trim(),
    );

    return res.status(200).json({
      success: true,
      message: "ORDER ITEM CANCELLED SUCCESSFULLY",
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const requestReturn = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { returnReason } = req.body;

    await requestReturnService(
      req.session.userId,
      orderId,
      itemId,
      returnReason,
    );

    req.session.toast = {
      type: "success",
      message: "RETURN REQUEST SUBMITTED",
    };

    return res.redirect(`/order/${orderId}`);
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect(`/order/${req.params.orderId}`);
  }
};

export const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await getOrderDetailsService(
      req.session.userId,
      orderId,
    );

    return generateInvoice(order, res);
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect(`/order/${req.params.orderId}`);
  }
};
