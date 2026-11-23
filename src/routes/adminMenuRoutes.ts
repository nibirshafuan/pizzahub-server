import { Router } from "express";
import {
  getPendingMenuItems,
  updateMenuItemStatus
} from "../controllers/adminMenuController.js";
import {
  requireAuth,
  requireAdmin
} from "../middleware/authMiddleware.js";

const router = Router();

router.get(
  "/pending",
  requireAuth,
  requireAdmin,
  getPendingMenuItems
);

router.patch(
  "/:id/status",
  requireAuth,
  requireAdmin,
  updateMenuItemStatus
);

export default router;
