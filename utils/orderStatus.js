import { ITEM_STATUS, ORDER_STATUS } from "../constants/orderStatus.js";

export const updateOverallOrderStatus = (order) => {
  const hasReturnRequest = order.items.some(
    (item) => item.itemStatus === ITEM_STATUS.RETURN_REQUESTED,
  );

  if (hasReturnRequest) {
    order.orderStatus = ORDER_STATUS.RETURN_REQUESTED;
    return order;
  }

  const activeItems = order.items.filter(
    (item) =>
      item.itemStatus !== ITEM_STATUS.CANCELLED &&
      item.itemStatus !== ITEM_STATUS.RETURNED &&
      item.itemStatus !== ITEM_STATUS.RETURN_REJECTED,
  );

  if (activeItems.length === 0) {
    const hasReturnedItem = order.items.some(
      (item) => item.itemStatus === ITEM_STATUS.RETURNED,
    );

    order.orderStatus = hasReturnedItem
      ? ORDER_STATUS.RETURNED
      : ORDER_STATUS.CANCELLED;

    return order;
  }

  const statuses = activeItems.map((item) => item.itemStatus);

  if (statuses.every((status) => status === ITEM_STATUS.DELIVERED)) {
    order.orderStatus = ORDER_STATUS.DELIVERED;
    return order;
  }

  if (statuses.every((status) => status === ITEM_STATUS.SHIPPED)) {
    order.orderStatus = ORDER_STATUS.SHIPPED;
    return order;
  }

  if (statuses.every((status) => status === ITEM_STATUS.CONFIRMED)) {
    order.orderStatus = ORDER_STATUS.CONFIRMED;
    return order;
  }

  if (statuses.every((status) => status === ITEM_STATUS.PLACED)) {
    order.orderStatus = ORDER_STATUS.PLACED;
    return order;
  }

  const statusOrder = {
    [ITEM_STATUS.PLACED]: 1,
    [ITEM_STATUS.CONFIRMED]: 2,
    [ITEM_STATUS.SHIPPED]: 3,
    [ITEM_STATUS.DELIVERED]: 4,
  };

  const earliestStatus = activeItems.reduce((earliest, current) => {
    return statusOrder[current.itemStatus] < statusOrder[earliest.itemStatus]
      ? current
      : earliest;
  });

  order.orderStatus = earliestStatus.itemStatus;

  return order;
};
