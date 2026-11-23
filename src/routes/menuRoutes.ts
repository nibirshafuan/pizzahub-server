import { Router } from "express";
import {
  getPublicMenu,
  getPublicMenuItem
} from "../controllers/menuController.js";

const router = Router();

router.get("/", getPublicMenu);
router.get("/:id", getPublicMenuItem);

export default router;
