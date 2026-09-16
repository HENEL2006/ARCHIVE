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
import {
  addProduct,
  deleteProduct,
  loadaddProduct,
  loadEditProduct,
  loadProducts,
  toggleProductStatus,
  updateProduct,
} from "../controllers/admin/productController.js";
import { productValidationMiddleware } from "../middlewares/ProductValidationMiddleware.js";
import {
  cancelOrderItemByAdmin,
  loadOrderDetails,
  loadOrdersPage,
  updateOrderItemStatus,
  updateOrderStatus,
} from "../controllers/admin/orderController.js";
import {
  approveReturn,
  loadReturn,
  rejectReturn,
} from "../controllers/admin/returnController.js";

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
router.get("/products", adminAuth, loadProducts);
router.get("/addProducts", adminAuth, loadaddProduct);
router.post(
  "/addProducts",
  adminAuth,
  upload.array("images", 5),
  productValidationMiddleware,
  addProduct,
);
router.post("/products/:id/status", adminAuth, toggleProductStatus);
router.get("/products/:id/edit", adminAuth, loadEditProduct);
router.post(
  "/products/:id/edit",
  adminAuth,
  upload.array("images", 5),
  updateProduct,
);
router.post("/products/:id/delete", adminAuth, deleteProduct);
router.get("/orders", adminAuth, loadOrdersPage);
router.post("/orders/:orderId/status", adminAuth, updateOrderStatus);
router.get("/orders/:orderId", adminAuth, loadOrderDetails);
router.post(
  "/orders/:orderId/items/:itemId/status",
  adminAuth,
  updateOrderItemStatus,
);
router.post(
  "/orders/:orderId/items/:itemId/cancel",
  adminAuth,
  cancelOrderItemByAdmin,
);
router.get("/return", adminAuth, loadReturn);
router.post("/return/:orderId/:itemId/approve", approveReturn);
router.post("/return/:orderId/:itemId/reject", adminAuth, rejectReturn);

router.get("/logout", adminLogout);

export default router;
