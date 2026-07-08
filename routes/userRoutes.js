import express from "express";
const router = express.Router();
import {
  signup,
  loadSignup,
  loadOtp,
  verifyOtp,
  resendOtp,
  loadLogin,
  login,
  loadForgotPassword,
  forgotPassword,
  loadResetPassword,
  resetPassword,
  loadHomePage,
  logout,
  loadProfilePage,
  loadAddressPage,
  loadAddAddress,
  loadEditAddress,
  editAddress,
  addAddress,
  setAsDefault,
  deleteAddress,
  loadAccountSettings,
} from "../controllers/userController.js";
import {
  canAccessOtp,
  isLoggedIn,
  isLoggedOut,
} from "../middlewares/authMiddleware.js";
import { validateAddress } from "../middlewares/addressValidationMiddleware.js";

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

router.get("/logout", isLoggedIn, logout);

export default router;
