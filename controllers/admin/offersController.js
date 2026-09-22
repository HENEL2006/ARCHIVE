import {
  createOfferService,
  deleteOfferService,
  getOfferByIdService,
  getOffersService,
  searchCategoriesService,
  searchProductsService,
  toggleOfferService,
  updateOfferService,
} from "../../services/admin/offerService.js";

export const loadOffers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "ALL";

    const offerData = await getOffersService(page, limit, search, status);
    return res.render("admin/offers", {
      ...offerData,
      activePage: "offers",
    });
  } catch (error) {
    console.log(error);
  }
};

export const loadAddOffers = async (req, res) => {
  try {
    const search = req.query.search || "";

    const products = await searchProductsService(search);

    return res.render("admin/addOffers", {
      products,
      search,
      activePage: "offers",
    });
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect("/admin/offers");
  }
};

export const searchProducts = async (req, res) => {
  try {
    const search = req.query.search || "";

    const products = await searchProductsService(search);

    return res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const searchCategories = async (req, res) => {
  try {
    const search = req.query.search || "";

    const categories = await searchCategoriesService(search);

    return res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createOffer = async (req, res) => {
  try {
    const offer = await createOfferService(req.body);

    return res.status(201).json({
      success: true,
      message: "Offer created successfully",
      offer,
    });
  } catch (error) {
    console.log("Create offer error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await toggleOfferService(id);

    req.session.toast = {
      type: "success",
      message: offer.isActive
        ? "Offer enabled successfully"
        : "Offer disabled successfully",
    };

    return res.redirect("/admin/offers");
  } catch (error) {
    console.log("Toggle offer error:", error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect("/admin/offers");
  }
};

export const loadEditOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await getOfferByIdService(id);

    return res.render("admin/editOffer", {
      activePage: "offers",
      offer,
    });
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect("/admin/offers");
  }
};

export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;

    await updateOfferService(id, req.body);

    req.session.toast = {
      type: "success",
      message: "Offer updated successfully",
    };

    return res.redirect("/admin/offers");
  } catch (error) {
    console.log("Update offer error:", error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect(`/admin/offers/${req.params.id}/edit`);
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteOfferService(id);

    req.session.toast = {
      type: "success",
      message: "OFFER DELETED SUCCESSFULLY",
    };

    return res.redirect("/admin/offers");
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect("/admin/offers");
  }
};
