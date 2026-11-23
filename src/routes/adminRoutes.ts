import { Router } from "express";
import {
  getAdminOverview,
  getAdminMenu,
  updateAdminMenuItem,
  deleteAdminMenuItem,
  getAdminUsers,
  setAdminUserBlocked,
  getAdminOrders,
  updateAdminOrderStatus
} from "../controllers/adminController.js";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();
router.use(requireAuth, requireAdmin);
router.get("/overview", getAdminOverview);
router.get("/menu", getAdminMenu);
router.patch("/menu/:id", updateAdminMenuItem);
router.delete("/menu/:id", deleteAdminMenuItem);
router.get("/users", getAdminUsers);
router.patch("/users/:id/block", setAdminUserBlocked);
router.get("/orders", getAdminOrders);
router.patch("/orders/:id/status", updateAdminOrderStatus);

export default router;
