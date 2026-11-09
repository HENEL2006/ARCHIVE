import Order from "../../models/order.js";
import { ITEM_STATUS, ORDER_STATUS } from "../../constants/orderStatus.js";

export const getSalesReportService = async (query) => {
  const { period = "daily", startDate, endDate, page = 1, limit = 10 } = query;

  let start;
  let end;

  const now = new Date();

  if (period === "daily") {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);

    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  }

  if (period === "weekly") {
    start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  }

  if (period === "yearly") {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  if (period === "custom") {
    if (!startDate || !endDate) {
      throw new Error("START DATE AND END DATE ARE REQUIRED");
    }

    const [startYear, startMonth, startDay] = startDate.split("-").map(Number);

    const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

    start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

    end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    if (start > end) {
      throw new Error("START DATE CANNOT BE AFTER END DATE");
    }
  }

  const rawOrders = await Order.find({
    orderStatus: ORDER_STATUS.DELIVERED,
    createdAt: {
      $gte: start,
      $lte: end,
    },
  })
    .sort({ createdAt: -1 })
    .lean();

  // Process orders at item level, correctly excluding CANCELLED and RETURNED items
  const processedOrders = [];
  let totalSales = 0;
  let totalDiscount = 0;
  let totalItemsSold = 0;

  const dailyBreakdown = {};

  for (const order of rawOrders) {
    const activeItems = (order.items || []).filter(
      (item) =>
        item.itemStatus !== ITEM_STATUS.CANCELLED &&
        item.itemStatus !== ITEM_STATUS.RETURNED,
    );

    // If an entire order had all its items cancelled or returned, exclude from completed sales
    if (activeItems.length === 0) {
      continue;
    }

    const orderActiveItemsSold = activeItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0,
    );

    const orderActiveItemFinalTotal = activeItems.reduce(
      (sum, item) => sum + (Number(item.finalItemTotal) || 0),
      0,
    );

    const orderActiveGrossSales = activeItems.reduce(
      (sum, item) => sum + (Number(item.itemTotal) || 0),
      0,
    );

    // Discount for active items is difference between original itemTotal and finalItemTotal
    const orderActiveDiscount = Math.max(
      orderActiveGrossSales - orderActiveItemFinalTotal,
      0,
    );

    // Net sales contribution includes active items' final paid total plus shipping if not refunded
    const shippingContribution = order.shippingRefunded
      ? 0
      : Number(order.shipping) || 0;
    const orderActiveNetSales =
      orderActiveItemFinalTotal + shippingContribution;

    totalSales += orderActiveNetSales;
    totalDiscount += orderActiveDiscount;
    totalItemsSold += orderActiveItemsSold;

    const formattedOrder = {
      ...order,
      activeItemsCount: orderActiveItemsSold,
      activeNetSales: orderActiveNetSales,
      activeDiscount: orderActiveDiscount,
      activeGrossSales: orderActiveGrossSales,
    };
    processedOrders.push(formattedOrder);

    const dateKey = new Date(order.createdAt).toISOString().split("T")[0];

    if (!dailyBreakdown[dateKey]) {
      dailyBreakdown[dateKey] = {
        date: new Date(order.createdAt),
        orders: 0,
        itemsSold: 0,
        grossSales: 0,
        discounts: 0,
        netSales: 0,
      };
    }

    dailyBreakdown[dateKey].orders += 1;
    dailyBreakdown[dateKey].grossSales += orderActiveGrossSales;
    dailyBreakdown[dateKey].discounts += orderActiveDiscount;
    dailyBreakdown[dateKey].netSales += orderActiveNetSales;
    dailyBreakdown[dateKey].itemsSold += orderActiveItemsSold;
  }

  totalSales = Number(totalSales.toFixed(2));
  totalDiscount = Number(totalDiscount.toFixed(2));

  const totalOrders = processedOrders.length;
  const orders = processedOrders;

  const breakdown = Object.values(dailyBreakdown).sort(
    (a, b) => b.date - a.date,
  );

  const chartBreakdown = breakdown.slice(0, 7);

  const perPage = Math.max(Number(limit) || 10, 1);

  const totalRecords = breakdown.length;

  const totalPages = Math.ceil(totalRecords / perPage);

  const requestedPage = Math.max(Number(page) || 1, 1);

  const currentPage =
    totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);

  const startIndex = (currentPage - 1) * perPage;
  const paginatedBreakdown = breakdown.slice(startIndex, startIndex + perPage);

  const orderStartIndex = (currentPage - 1) * perPage;
  const paginatedOrders = orders.slice(orderStartIndex, orderStartIndex + perPage);
  const totalOrderPages = Math.ceil(totalOrders / perPage);

  return {
    orders,
    paginatedOrders,
    totalSales,
    totalDiscount,
    totalOrders,
    totalItemsSold,
    breakdown: paginatedBreakdown,
    chartBreakdown,
    currentPage,
    totalPages,
    totalRecords,
    totalOrderPages,
    limit: perPage,
    period,
    startDate: start,
    endDate: end,
    filterStartDate: startDate || "",
    filterEndDate: endDate || "",
  };
};

export const getSalesReportForPDFService = async (query) => {
  const { period = "daily", startDate, endDate } = query;

  const report = await getSalesReportService({
    period,
    startDate,
    endDate,
    page: 1,
    limit: 100000,
  });

  return {
    orders: report.orders,

    totalSales: report.totalSales,
    totalDiscount: report.totalDiscount,
    totalOrders: report.totalOrders,
    totalItemsSold: report.totalItemsSold,

    breakdown: report.breakdown,

    period: report.period,

    startDate: report.startDate,
    endDate: report.endDate,

    filterStartDate: report.filterStartDate,
    filterEndDate: report.filterEndDate,
  };
};
