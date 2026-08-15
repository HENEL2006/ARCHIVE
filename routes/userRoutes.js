import express from "express";
const router = express.Router();
import {
  googleAuthCallback,
  googleCallback,
  signup,
  loadSignup,
  loadLogin,
  login,
  loadForgotPassword,
  forgotPassword,
  loadResetPassword,
  resetPassword,
  logout,
} from "../controllers/user/authController.js";
import {
  loadOtp,
  verifyOtp,
  resendOtp,
} from "../controllers/user/otpController.js";
import { loadHomePage } from "../controllers/user/homeController.js";
import {
  loadProfilePage,
  uploadProfileImage,
  removeProfileImage,
} from "../controllers/user/profileController.js";
import {
  loadAddressPage,
  loadAddAddress,
  loadEditAddress,
  addAddress,
  editAddress,
  setAsDefault,
  deleteAddress,
} from "../controllers/user/addressController.js";
import {
  loadAccountSettings,
  sendChangeEmailOtp,
  updateProfile,
  changePassword,
} from "../controllers/user/accountController.js";
import {
  canAccessOtp,
  isLoggedIn,
  isLoggedOut,
} from "../middlewares/authMiddleware.js";
import { validateAddress } from "../middlewares/addressValidationMiddleware.js";
import passport from "passport";
import upload from "../config/multer.js";
import {
  loadProductDetails,
  loadProducts,
} from "../controllers/user/productController.js";
import {
  addToCart,
  loadCart,
  loadCheckout,
  removeCartItem,
  updateCartQuantity,
} from "../controllers/user/cartController.js";
import { addToWishlist, loadWishlist, removeFromWishlist } from "../controllers/user/wishlistController.js";

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);
router.get("/auth/google/callback", googleAuthCallback, googleCallback);

router.post(
  "/profile/upload-photo",
  isLoggedIn,
  upload.single("profileImage"),
  uploadProfileImage,
);
router.get("/profile/remove-photo", isLoggedIn, removeProfileImage);

router.get("/", loadHomePage);
router.get("/home", loadHomePage);
router.get("/signup", isLoggedOut, loadSignup);
router.post("/signup", signup);
router.get("/verify-otp", canAccessOtp, loadOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.get("/login", isLoggedOut, loadLogin);
router.post("/login", login);
router.get("/forgot-password", isLoggedOut, loadForgotPassword);
router.post("/forgot-password", forgotPassword);
router.get("/reset-password", isLoggedOut, loadResetPassword);
router.post("/reset-password", resetPassword);
router.get("/profile", isLoggedIn, loadProfilePage);
router.get("/address", isLoggedIn, loadAddressPage);
router.get("/address/add", isLoggedIn, loadAddAddress);
router.post("/address/add", isLoggedIn, validateAddress, addAddress);
router.get("/address/edit/:id", isLoggedIn, loadEditAddress);
router.post("/address/edit/:id", isLoggedIn, editAddress);
router.get("/address/default/:id", isLoggedIn, setAsDefault);
router.get("/address/delete/:id", isLoggedIn, deleteAddress);
router.get("/account-settings", isLoggedIn, loadAccountSettings);
router.post("/change-email/send-otp", isLoggedIn, sendChangeEmailOtp);
router.post("/profile/update", isLoggedIn, updateProfile);
router.post("/account-settings/change-password", isLoggedIn, changePassword);
router.get("/products", isLoggedIn, loadProducts);
router.get("/product/:slug", loadProductDetails);
router.post("/cart/add", isLoggedIn, addToCart);
router.get("/cart", isLoggedIn, loadCart);
router.post("/cart/update", isLoggedIn, updateCartQuantity);
router.post("/cart/remove", isLoggedIn, removeCartItem);
router.get("/wishlist", isLoggedIn, loadWishlist);
router.post("/wishlist/add", isLoggedIn,addToWishlist);
router.post("/wishlist/remove",isLoggedIn,removeFromWishlist)
router.get("/checkout", isLoggedIn, loadCheckout);

router.get("/logout", isLoggedIn, logout);

export default router;
