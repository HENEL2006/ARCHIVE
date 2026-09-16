import {
  cancelOrderItemByAdminService,
  getAdminOrderDetailsService,
  getOrdersService,
  updateOrderItemStatusService,
  updateOrderStatusService,
} from "../../services/admin/orderService.js";

export const loadOrdersPage = async (req, res) => {
  try {
    const {
      page = 1,
      search = "",
      status = "ALL",
      paymentStatus = "ALL",
    } = req.query;

    const data = await getOrdersService(
      page,
      10,
      search,
      status,
      paymentStatus,
    );

    return res.render("admin/orders", {
      orders: data.orders,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
      totalOrders: data.totalOrders,
      perPage: data.perPage,
      search: data.search,
      currentStatus: data.status,
      currentPaymentStatus: data.paymentStatus,
      statistics: data.statistics,
      activePage: "orders",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).render("admin/error", {
      message: "FAILED TO LOAD ORDERS",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    await updateOrderStatusService(orderId, status);

    req.session.toast = {
      type: "success",
      message: "STATUS UPDATED",
    };

    return res.redirect("/admin/orders");
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect("/admin/orders");
  }
};

export const updateOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    await updateOrderItemStatusService(orderId, itemId, status);

    req.session.toast = {
      type: "success",
      message: "PRODUCT STATUS UPDATED",
    };

    return res.redirect(`/admin/orders/${orderId}`);
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect(`/admin/orders/${req.params.orderId}`);
  }
};

export const cancelOrderItemByAdmin = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { cancellationReason } = req.body;

    await cancelOrderItemByAdminService(orderId, itemId, cancellationReason);

    req.session.toast = {
      type: "success",
      message: "PRODUCT CANCELLED",
    };

    return res.redirect(`/admin/orders/${orderId}`);
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect(`/admin/orders/${req.params.orderId}`);
  }
};

export const loadOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await getAdminOrderDetailsService(orderId);

    return res.render("admin/orderDetails", {
      order,
      activePage: "orders",
    });
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect("/admin/orders");
  }
};
