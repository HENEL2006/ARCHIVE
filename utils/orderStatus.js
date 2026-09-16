export const updateOverallOrderStatus = (order) => {
  const hasReturnRequest = order.items.some(
    (item) => item.itemStatus === "RETURN_REQUESTED",
  );

  if (hasReturnRequest) {
    order.orderStatus = "RETURN_REQUESTED";
    return order;
  }

  const activeItems = order.items.filter(
    (item) =>
      item.itemStatus !== "CANCELLED" && item.itemStatus !== "RETURN_REJECTED",
  );

  if (activeItems.length === 0) {
    const hasReturnedItem = order.items.some(
      (item) => item.itemStatus === "RETURNED",
    );

    order.orderStatus = hasReturnedItem ? "RETURNED" : "CANCELLED";

    return order;
  }

  const statuses = activeItems.map((item) => item.itemStatus);

  if (statuses.every((status) => status === "DELIVERED")) {
    order.orderStatus = "DELIVERED";
    return order;
  }

  if (statuses.every((status) => status === "SHIPPED")) {
    order.orderStatus = "SHIPPED";
    return order;
  }

  if (statuses.every((status) => status === "CONFIRMED")) {
    order.orderStatus = "CONFIRMED";
    return order;
  }

  if (statuses.every((status) => status === "PLACED")) {
    order.orderStatus = "PLACED";
    return order;
  }

  const statusOrder = {
    PLACED: 1,
    CONFIRMED: 2,
    SHIPPED: 3,
    DELIVERED: 4,
  };

  const earliestStatus = activeItems.reduce((earliest, current) => {
    return statusOrder[current.itemStatus] < statusOrder[earliest.itemStatus]
      ? current
      : earliest;
  });

  order.orderStatus = earliestStatus.itemStatus;

  return order;
};
