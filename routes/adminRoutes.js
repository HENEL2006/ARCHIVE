import express from "express";
const router = express.Router();
import {
  adminLogin,
  adminLogout,
  loadCustomers,
  loadDashboard,
  loadLogin,
  updateUserStatus,
} from "../controllers/adminController.js";
import { adminAuth, adminGuest } from "../middlewares/authMiddleware.js";
import { deleteUser } from "../controllers/userController.js";

router.get("/login", adminGuest, loadLogin);
router.post("/login", adminGuest, adminLogin);
router.get("/dashboard", adminAuth, loadDashboard);
router.get("/customers", adminAuth, loadCustomers);
router.post("/customers/:id/status", adminAuth, updateUserStatus);
router.post("/customers/:id/delete",adminAuth,deleteUser);

router.get("/logout", adminLogout);

export default router;
