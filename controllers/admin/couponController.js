import {
  addCouponService,
  getCouponByIdService,
  getCouponsService,
  toggleCouponsStatusService,
  updateCouponService,
} from "../../services/admin/couponService.js";

export const loadCoupon = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const search = req.query.search || "";
    const status = req.query.status || "ALL";

    const CouponDate = await getCouponsService(page, 5, search, status);

    return res.render("admin/coupons", {
      ...CouponDate,
      activePage: "coupons",
    });
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect("/admin/dashboard");
  }
};

export const loadAddCoupon = async (req, res) => {
  return res.render("admin/addCoupons", {
    activePage: "coupons",
  });
};

export const addCoupon = async (req, res) => {
  try {
    await addCouponService(req.body);

    req.session.toast = {
      type: "success",
      message: "Coupon created successfully",
    };

    return res.redirect("/admin/coupons");
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect("/admin/addCoupon");
  }
};

export const loadEditCoupon = async (req, res) => {
  try {
    const coupon = await getCouponByIdService(req.params.id);

    if (!coupon) {
      req.session.toast = {
        type: "error",
        message: "COUPON NOT FOUND",
      };

      return res.redirect("/admin/coupons");
    }

    return res.render("admin/editCoupon", {
      coupon,
      activePage: "coupons",
    });
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect("/admin/coupons");
  }
};

export const updateCoupon = async (req, res) => {
  try {
    await updateCouponService(req.params.id, req.body);

    req.session.toast = {
      type: "success",
      message: "COUPON UPDATED SUCCESSFULLY",
    };

    return res.redirect("/admin/coupons");
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect(`/admin/editCoupon/${req.params.id}`);
  }
};

export const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await toggleCouponsStatusService(req.params.id);

    req.session.toast = {
      type: "success",
      message: coupon.isActive
        ? "COUPON ACTIVATED SUCCESSFULLY"
        : "COUPON DISABLED SUCCESSFULLY",
    };

    return res.redirect("/admin/coupons");
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect("/admin/coupons");
  }
};
