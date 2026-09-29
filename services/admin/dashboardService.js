import Order from "../../models/order.js";
import Product from "../../models/product.js";
import User from "../../models/User.js";

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfWeek = (date) => {
  const result = startOfDay(date);

  const day = result.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);

  return result;
};

const endOfWeek = (date) => {
  const result = startOfWeek(date);

  result.setDate(result.getDate() + 6);

  return endOfDay(result);
};

const startOfMonth = (date) => {
  const result = new Date(date);

  result.setDate(1);
  result.setHours(0, 0, 0, 0);

  return result;
};

const endOfMonth = (date) => {
  const result = new Date(date);

  result.setMonth(result.getMonth() + 1);
  result.setDate(0);

  return endOfDay(result);
};

const startOfYear = (date) => {
  const result = new Date(date);

  result.setMonth(0);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);

  return result;
};

const endOfYear = (date) => {
  const result = new Date(date);

  result.setMonth(11);
  result.setDate(31);

  return endOfDay(result);
};

const getDateRange = (range) => {
  const now = new Date();

  switch (range) {

    case "today":
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        type: "hour",
      };


    case "thisWeek":
      return {
        start: startOfWeek(now),
        end: endOfWeek(now),
        type: "day",
      };


    case "lastWeek": {
      const thisWeekStart = startOfWeek(now);

      const start = new Date(thisWeekStart);

      start.setDate(start.getDate() - 7);

      const end = new Date(thisWeekStart);

      end.setMilliseconds(-1);

      return {
        start,
        end,
        type: "day",
      };
    }


    case "thisMonth":
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        type: "day",
      };


    case "lastMonth": {
      const start = startOfMonth(now);

      start.setMonth(start.getMonth() - 1);

      const end = startOfMonth(now);

      end.setMilliseconds(-1);

      return {
        start,
        end,
        type: "day",
      };
    }


    case "thisYear":
      return {
        start: startOfYear(now),
        end: endOfYear(now),
        type: "month",
      };


    default:
      return {
        start: startOfWeek(now),
        end: endOfWeek(now),
        type: "day",
      };
  }
};

const calculateOrderRevenue = (order) => {

  const activeItems = (order.items || []).filter(
    (item) =>
      !["CANCELLED", "RETURNED"].includes(item.itemStatus),
  );

  if (activeItems.length === 0) {
    return 0;
  }

  return activeItems.reduce(
    (sum, item) =>
      sum + Number(item.finalItemTotal || 0),
    0,
  ) + Number(order.shipping || 0);
};

const createRevenueChart = (orders, range) => {

  const { start, end, type } = getDateRange(range);

  const chart = [];

  if (type === "hour") {

    for (let hour = 0; hour < 24; hour++) {

      chart.push({
        label: `${String(hour).padStart(2, "0")}:00`,
        revenue: 0,
      });

    }


    orders.forEach((order) => {

      const date = new Date(order.createdAt);

      const hour = date.getHours();

      chart[hour].revenue += calculateOrderRevenue(order);

    });

  }

  else if (type === "day") {

    const current = new Date(start);

    while (current <= end) {

      chart.push({
        date: new Date(current),
        label: current.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        revenue: 0,
      });

      current.setDate(current.getDate() + 1);

    }


    orders.forEach((order) => {

      const orderDate = startOfDay(
        new Date(order.createdAt),
      );

      const index = chart.findIndex(
        (item) =>
          item.date.getTime() === orderDate.getTime(),
      );

      if (index !== -1) {

        chart[index].revenue +=
          calculateOrderRevenue(order);

      }

    });


    return chart.map((item) => ({
      label: item.label,
      revenue: Number(item.revenue.toFixed(2)),
    }));

  }

  else if (type === "month") {

    for (let month = 0; month < 12; month++) {

      chart.push({
        month,
        label: new Date(
          start.getFullYear(),
          month,
          1,
        ).toLocaleDateString("en-IN", {
          month: "short",
        }),
        revenue: 0,
      });

    }


    orders.forEach((order) => {

      const date = new Date(order.createdAt);

      const month = date.getMonth();

      chart[month].revenue +=
        calculateOrderRevenue(order);

    });


    return chart.map((item) => ({
      label: item.label,
      revenue: Number(item.revenue.toFixed(2)),
    }));

  }


  return chart.map((item) => ({
    label: item.label,
    revenue: Number(item.revenue.toFixed(2)),
  }));
};

export const getDashboardService = async (
  selectedRange = "thisWeek",
) => {

  const [
    totalOrders,
    totalCustomers,
    totalProducts,
    revenueOrders,
    recentOrders,
    lowStockProducts,
  ] = await Promise.all([

    Order.countDocuments(),

    User.countDocuments({
      role: "user",
      isDeleted: false,
    }),

    Product.countDocuments({
      isDeleted: false,
    }),

    Order.find({
      paymentStatus: "PAID",
    })
      .select("items shipping createdAt")
      .lean(),

    Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "username")
      .lean(),

    Product.find({
      isDeleted: false,
      isListed: true,
      variants: {
        $elemMatch: {
          stock: { $gt: 0, $lte: 5 },
        },
      },
    })
      .select("name variants")
      .lean(),

  ]);

  let totalRevenue = 0;

  revenueOrders.forEach((order) => {

    totalRevenue += calculateOrderRevenue(order);

  });

  const { start, end } =
    getDateRange(selectedRange);


  const filteredRevenueOrders =
    revenueOrders.filter((order) => {

      const orderDate =
        new Date(order.createdAt);

      return (
        orderDate >= start &&
        orderDate <= end
      );

    });


  const revenueChart =
    createRevenueChart(
      filteredRevenueOrders,
      selectedRange,
    );

  const lowStockItems = [];

  lowStockProducts.forEach((product) => {

    product.variants.forEach((variant) => {

      if (
        variant.stock > 0 &&
        variant.stock <= 5
      ) {

        lowStockItems.push({
          productName: product.name,
          size: variant.size,
          stock: variant.stock,
        });

      }

    });

  });


  lowStockItems.sort(
    (a, b) => a.stock - b.stock,
  );


  return {

    statistics: {
      totalRevenue:
        Number(totalRevenue.toFixed(2)),

      totalOrders,

      totalCustomers,

      totalProducts,
    },

    revenueChart,

    selectedRange,

    recentOrders,

    lowStockItems:
      lowStockItems.slice(0, 5),
  };
};