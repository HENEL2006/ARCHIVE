import {
  addToWishlistService,
  getWishlistService,
  removeFromWishlistService,
} from "../../services/user/wishlistService.js";
import { HTTP_STATUS } from "../../constants/httpStatusCodes.js";

export const loadWishlist = async (req, res) => {
  try {
    const products = await getWishlistService(req.session.userId);

    res.render("user/wishlist", {
      activePage: "wishlist",
      products,
    });
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    res.redirect("/products");
  }
};


export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    await addToWishlistService(
      req.session.userId,
      productId,
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "ADDED TO WISHLIST",
    });

  } catch (error) {
    console.log(error);

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};


export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    await removeFromWishlistService(
      req.session.userId,
      productId,
    );

    req.session.toast = {
      type: "success",
      message: "REMOVED FROM WISHLIST",
    };

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "REMOVED FROM WISHLIST",
    });

  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};