import { Router } from "express";
import {
  createCustomerOrder,
  getMyOrders,
  getVendorOrders,
  updateVendorOrderStatus,
  cancelMyOrder
} from "../controllers/orderController.js";
import { requireAuth, requireCustomer, requireVendor } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", requireAuth, requireCustomer, createCustomerOrder);
router.get("/mine", requireAuth, requireCustomer, getMyOrders);
router.patch("/:id/cancel", requireAuth, requireCustomer, cancelMyOrder);
router.get("/vendor", requireAuth, requireVendor, getVendorOrders);
router.patch("/:id/vendor-status", requireAuth, requireVendor, updateVendorOrderStatus);

export default router;
