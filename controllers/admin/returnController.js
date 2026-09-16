import {
  approveReturnService,
  getReturnRequestService,
  getReturnStatisticsService,
  rejectReturnService,
} from "../../services/admin/returnService.js";

export const loadReturn = async (req, res) => {
  try {
    const { search = "", status = "", sort = "newest", page = 1 } = req.query;

    const result = await getReturnRequestService(
      search,
      status,
      sort,
      Number(page),
      10,
    );

    const statistics = await getReturnStatisticsService();

    return res.render("admin/return", {
      activePage: "return",
      returnRequests: result.returnRequests,
      totalRequests: result.totalRequests,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      limit: result.limit,
      search,
      status,
      sort,
      statistics,
    });
  } catch (error) {
    console.log(error);
  }
};

export const approveReturn = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    await approveReturnService(orderId, itemId);

    ((req.session.toast = {
      type: "success",
      message: "RETURN REQUEST APPROVED",
    }),
      res.redirect("/admin/return"));
  } catch (error) {
    console.log(error);
    req.session.toast = {
      type: "error",
      message: error.message,
    };
    return res.redirect("/admin/return");
  }
};

export const rejectReturn = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    await rejectReturnService(orderId, itemId);

    req.session.toast = {
      type: "success",
      message: "RETURN REQUEST REJECTED",
    };

    return res.redirect("/admin/return");
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect("/admin/return");
  }
};
