import { Router } from "express";
import {
  createMenuItem,
  getMyMenuItems,
  updateMyMenuItem,
  deleteMyMenuItem
} from "../controllers/vendorMenuController.js";
import { requireAuth, requireVendor } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, requireVendor, getMyMenuItems);
router.post("/", requireAuth, requireVendor, createMenuItem);
router.patch("/:id", requireAuth, requireVendor, updateMyMenuItem);
router.delete("/:id", requireAuth, requireVendor, deleteMyMenuItem);

export default router;
