import Order from "../../models/Order.js";

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

  const orders = await Order.find({
    orderStatus: "DELIVERED",
    createdAt: {
      $gte: start,
      $lte: end,
    },
  })
    .sort({ createdAt: -1 })
    .lean();

  const totalOrders = orders.length;

  let totalSales = 0;
  let totalDiscount = 0;
  let totalItemsSold = 0;

  const dailyBreakdown = {};

  for (const order of orders) {
    totalSales += order.total || 0;
    totalDiscount += order.discount || 0;

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
    dailyBreakdown[dateKey].grossSales += order.subtotal || 0;
    dailyBreakdown[dateKey].discounts += order.discount || 0;
    dailyBreakdown[dateKey].netSales += order.total || 0;

    for (const item of order.items || []) {
      totalItemsSold += item.quantity || 0;
      dailyBreakdown[dateKey].itemsSold += item.quantity || 0;
    }
  }

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

  return {
    orders,
    totalSales,
    totalDiscount,
    totalOrders,
    totalItemsSold,
    breakdown: paginatedBreakdown,
    chartBreakdown,
    currentPage,
    totalPages,
    totalRecords,
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
