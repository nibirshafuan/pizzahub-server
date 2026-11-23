import { db } from "../db.js";
import type { MenuItem } from "../types/menu.js";

export const menuItems = db.collection<MenuItem>("menuItems");
