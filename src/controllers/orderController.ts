import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { db } from "../db.js";
import { menuItems } from "../models/menuModel.js";

const orders = db.collection("orders");
const DELIVERY_FEE = 60;

export async function createCustomerOrder(req: Request, res: Response) {
  try {
    const user = req.authUser;
    const { items, deliveryAddress, deliveryDate } = req.body as {
      items?: { menuItemId?: string; quantity?: number }[];
      deliveryAddress?: string;
      deliveryDate?: string;
    };
    if (!user) return res.status(401).json({ success: false, message: "Authentication required." });
    if (!Array.isArray(items) || items.length < 1 || items.length > 10 || typeof deliveryAddress !== "string" || deliveryAddress.trim().length < 8 || deliveryAddress.trim().length > 500 || typeof deliveryDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
      return res.status(400).json({ success: false, message: "Please provide cart items, a valid delivery address, and delivery date." });
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(`${deliveryDate}T00:00:00`);
    if (Number.isNaN(requestedDate.getTime()) || requestedDate < today) return res.status(400).json({ success: false, message: "Delivery date cannot be in the past." });

    const quantities = new Map<string, number>();
    for (const item of items) {
      if (!item || typeof item.menuItemId !== "string" || !ObjectId.isValid(item.menuItemId) || !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 20) {
        return res.status(400).json({ success: false, message: "Cart contains an invalid item or quantity." });
      }
      quantities.set(item.menuItemId, (quantities.get(item.menuItemId) || 0) + Number(item.quantity));
    }
    if ([...quantities.values()].some((quantity) => quantity > 20)) return res.status(400).json({ success: false, message: "Maximum quantity per pizza is 20." });

    const ids = [...quantities.keys()].map((id) => new ObjectId(id));
    const approvedItems = await menuItems.find({ _id: { $in: ids }, status: "approved", isActive: true }).toArray();
    if (approvedItems.length !== ids.length) return res.status(409).json({ success: false, message: "One or more pizzas are no longer available. Refresh your cart." });
    if (approvedItems.some((item) => item.vendorId === user.id)) return res.status(403).json({ success: false, message: "Vendors cannot order their own menu items." });

    for (const item of approvedItems) {
      const duplicate = await orders.findOne({
        customerId: user.id,
        deliveryDate,
        status: { $in: ["pending", "accepted"] },
        items: { $elemMatch: { menuItemId: item._id!.toString() } }
      });
      if (duplicate) return res.status(409).json({ success: false, message: `An active order for ${item.name} already exists on ${deliveryDate}.` });
    }

    const orderItems = approvedItems.map((item) => ({
      menuItemId: item._id!.toString(), vendorId: item.vendorId, name: item.name,
      imageUrl: item.imageUrl, price: item.price, quantity: quantities.get(item._id!.toString()) || 1
    }));
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = {
      customerId: user.id, items: orderItems,
      deliveryAddress: deliveryAddress.trim(), deliveryDate,
      subtotal, deliveryFee: DELIVERY_FEE, total: subtotal + DELIVERY_FEE,
      status: "pending", createdAt: new Date(), updatedAt: new Date()
    };
    const result = await orders.insertOne(order);
    return res.status(201).json({ success: true, message: "Order placed successfully. Payment is not collected online.", data: { ...order, _id: result.insertedId } });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to place order." });
  }
}

export async function getMyOrders(req: Request, res: Response) {
  try {
    if (!req.authUser) return res.status(401).json({ success: false, message: "Authentication required." });
    const data = await orders.find({ customerId: req.authUser.id }).sort({ createdAt: -1 }).toArray();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch orders." });
  }
}

// P2_ORDER_ACTIONS
export async function getVendorOrders(req: Request, res: Response) {
  try {
    const user = req.authUser;
    if (!user) return res.status(401).json({ success: false, message: "Authentication required." });

    const data = await orders.find({ "items.vendorId": user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({ success: true, count: data.length, data });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch vendor orders." });
  }
}

export async function updateVendorOrderStatus(req: Request, res: Response) {
  try {
    const user = req.authUser;
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const status = req.body?.status;

    if (!user) return res.status(401).json({ success: false, message: "Authentication required." });
    if (!id || !ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid order ID." });
    if (status !== "accepted" && status !== "rejected")
      return res.status(400).json({ success: false, message: "Status must be accepted or rejected." });

    const order = await orders.findOne({ _id: new ObjectId(id), "items.vendorId": user.id });

    if (!order) return res.status(404).json({ success: false, message: "Order not found for your store." });
    if (order.status !== "pending")
      return res.status(409).json({ success: false, message: "Only pending orders can be processed." });

    const result = await orders.updateOne(
      { _id: new ObjectId(id), "items.vendorId": user.id, status: "pending" },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0)
      return res.status(409).json({ success: false, message: "Order status changed. Refresh and try again." });

    return res.status(200).json({ success: true, message: `Order ${status}.` });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to update order status." });
  }
}

export async function cancelMyOrder(req: Request, res: Response) {
  try {
    const user = req.authUser;
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!user) return res.status(401).json({ success: false, message: "Authentication required." });
    if (!id || !ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid order ID." });

    const result = await orders.updateOne(
      { _id: new ObjectId(id), customerId: user.id, status: "pending" },
      { $set: { status: "cancelled", updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0)
      return res.status(409).json({ success: false, message: "Order not found, not yours, or no longer pending." });

    return res.status(200).json({ success: true, message: "Order cancelled." });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to cancel order." });
  }
}

