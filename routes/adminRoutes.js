import express from "express";
const router = express.Router();
import {
  loadLogin,
  adminLogin,
  adminLogout,
} from "../controllers/admin/authController.js";

import { loadDashboard } from "../controllers/admin/dashboardController.js";

import {
  loadCustomers,
  updateUserStatus,
  deleteUser,
} from "../controllers/admin/customerController.js";

import {
  loadCategory,
  loadAddCategory,
  addCategory,
  loadEditCategory,
  editCategory,
  toggleCategoryStatus,
  deleteCategory,
} from "../controllers/admin/categoryController.js";
import { adminAuth, adminGuest } from "../middlewares/authMiddleware.js";
import upload from "../config/multer.js";

router.get("/login", adminGuest, loadLogin);
router.post("/login", adminGuest, adminLogin);
router.get("/dashboard", adminAuth, loadDashboard);
router.get("/customers", adminAuth, loadCustomers);
router.post("/customers/:id/status", adminAuth, updateUserStatus);
router.post("/customers/:id/delete", adminAuth, deleteUser);
router.get("/category", adminAuth, loadCategory);
router.get("/addCategory", adminAuth, loadAddCategory);
router.post("/addCategory", adminAuth, upload.single("image"), addCategory);
router.get("/editCategory/:id", adminAuth, loadEditCategory);
router.post(
  "/editCategory/:id",
  adminAuth,
  upload.single("image"),
  editCategory,
);
router.post("/toggleCategory/:id", adminAuth, toggleCategoryStatus);
router.post("/deleteCategory/:id", adminAuth, deleteCategory);

router.get("/logout", adminLogout);

export default router;
