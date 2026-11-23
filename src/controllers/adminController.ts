import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { db } from "../db.js";
import { menuItems } from "../models/menuModel.js";

const users = db.collection<{ _id: string; role?: string; isBlocked?: boolean; name?: string; email?: string; createdAt?: Date; updatedAt?: Date }>("user");
const orders = db.collection("orders");

export async function getAdminOverview(_req: Request, res: Response) {
  try {
    const [userCount, vendorCount, menuCount, pendingCount, orderCount, orderValue] =
      await Promise.all([
        users.countDocuments({}),
        users.countDocuments({ role: "vendor" }),
        menuItems.countDocuments({}),
        menuItems.countDocuments({ status: "pending" }),
        orders.countDocuments({}),
        orders.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]).toArray()
      ]);

    return res.json({
      success: true,
      data: {
        users: userCount,
        vendors: vendorCount,
        menuItems: menuCount,
        pendingMenuItems: pendingCount,
        orders: orderCount,
        orderValue: Number(orderValue[0]?.total || 0)
      }
    });
  } catch {
    return res.status(500).json({ success: false, message: "Could not load admin overview." });
  }
}

export async function getAdminMenu(req: Request, res: Response) {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : "all";
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const filter: Record<string, unknown> = {};
    if (["pending", "approved", "rejected"].includes(status)) filter.status = status;
    if (search) filter.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

    const data = await menuItems.find(filter).sort({ createdAt: -1 }).limit(250).toArray();
    return res.json({ success: true, count: data.length, data });
  } catch {
    return res.status(500).json({ success: false, message: "Could not load menu items." });
  }
}

export async function updateAdminMenuItem(req: Request, res: Response) {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (typeof id !== "string" || !ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid menu item ID." });

    const body = req.body || {};
    const updates: Record<string, unknown> = {};
    for (const key of ["name", "description", "category", "imageUrl", "location"] as const) {
      if (typeof body[key] === "string") updates[key] = body[key].trim();
    }
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ success: false, message: "Price must be a positive number." });
      updates.price = price;
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") return res.status(400).json({ success: false, message: "isActive must be boolean." });
      updates.isActive = body.isActive;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: "No valid fields supplied." });
    updates.updatedAt = new Date();

    const result = await menuItems.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    if (!result.matchedCount) return res.status(404).json({ success: false, message: "Menu item not found." });
    return res.json({ success: true, message: "Menu item updated." });
  } catch {
    return res.status(500).json({ success: false, message: "Could not update menu item." });
  }
}

export async function deleteAdminMenuItem(req: Request, res: Response) {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (typeof id !== "string" || !ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid menu item ID." });
    const result = await menuItems.deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) return res.status(404).json({ success: false, message: "Menu item not found." });
    return res.json({ success: true, message: "Menu item deleted." });
  } catch {
    return res.status(500).json({ success: false, message: "Could not delete menu item." });
  }
}

export async function getAdminUsers(req: Request, res: Response) {
  try {
    const role = typeof req.query.role === "string" ? req.query.role : "customer";
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const filter: Record<string, unknown> = { role: role === "vendor" ? "vendor" : "customer" };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [{ name: { $regex: escaped, $options: "i" } }, { email: { $regex: escaped, $options: "i" } }];
    }
    const data = await users.find(filter, {
      projection: { name: 1, email: 1, role: 1, isBlocked: 1, createdAt: 1 }
    }).sort({ createdAt: -1 }).limit(250).toArray();
    return res.json({ success: true, count: data.length, data });
  } catch {
    return res.status(500).json({ success: false, message: "Could not load accounts." });
  }
}

export async function setAdminUserBlocked(req: Request, res: Response) {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const blocked = req.body?.blocked;
    if (!id || typeof id !== "string") return res.status(400).json({ success: false, message: "Invalid user ID." });
    if (blocked !== true && blocked !== false) return res.status(400).json({ success: false, message: "blocked must be boolean." });
    if (id === req.authUser?.id) return res.status(400).json({ success: false, message: "You cannot block your own account." });

    const result = await users.updateOne({ _id: id, role: { $in: ["customer", "vendor"] } }, {
      $set: { isBlocked: blocked, updatedAt: new Date() }
    });
    if (!result.matchedCount) return res.status(404).json({ success: false, message: "Customer or vendor account not found." });
    return res.json({ success: true, message: blocked ? "Account blocked." : "Account unblocked." });
  } catch {
    return res.status(500).json({ success: false, message: "Could not update account." });
  }
}

export async function getAdminOrders(_req: Request, res: Response) {
  try {
    const data = await orders.find({}).sort({ createdAt: -1 }).limit(250).toArray();
    return res.json({ success: true, count: data.length, data });
  } catch {
    return res.status(500).json({ success: false, message: "Could not load orders." });
  }
}

export async function updateAdminOrderStatus(req: Request, res: Response) {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const status = req.body?.status;
    const allowed = ["pending", "accepted", "rejected", "cancelled"];
    if (typeof id !== "string" || !ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid order ID." });
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Unsupported order status." });

    const result = await orders.updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } });
    if (!result.matchedCount) return res.status(404).json({ success: false, message: "Order not found." });
    return res.json({ success: true, message: "Order status updated." });
  } catch {
    return res.status(500).json({ success: false, message: "Could not update order status." });
  }
}



