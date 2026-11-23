import type { Request, Response } from "express";
import { menuItems } from "../models/menuModel.js";

const ALLOWED_CATEGORIES = [
  "Classic",
  "Chicken",
  "Cheese",
  "Veggie",
  "Seafood",
  "Special"
];

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createMenuItem(req: Request, res: Response) {
  try {
    const {
      name,
      description,
      category,
      price,
      imageUrl,
      location
    } = req.body ?? {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price <= 0 ||
      typeof imageUrl !== "string" ||
      !imageUrl.trim() ||
      typeof location !== "string" ||
      !location.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid pizza details."
      });
    }

    const canonicalCategory = ALLOWED_CATEGORIES.find(
      (item) => item.toLowerCase() === category.trim().toLowerCase()
    );

    if (!canonicalCategory) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${ALLOWED_CATEGORIES.join(", ")}.`
      });
    }

    if (name.trim().length > 80) {
      return res.status(400).json({
        success: false,
        message: "Pizza name must be 80 characters or fewer."
      });
    }

    if (description.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Description must be 500 characters or fewer."
      });
    }

    if (location.trim().length > 120) {
      return res.status(400).json({
        success: false,
        message: "Location must be 120 characters or fewer."
      });
    }

    if (price > 100000) {
      return res.status(400).json({
        success: false,
        message: "Price is too high."
      });
    }

    if (!isHttpUrl(imageUrl.trim())) {
      return res.status(400).json({
        success: false,
        message: "Image URL must start with http:// or https://."
      });
    }

    if (!req.authUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    const newItem = {
      vendorId: req.authUser.id,
      name: name.trim(),
      description: description.trim(),
      category: canonicalCategory,
      price,
      imageUrl: imageUrl.trim(),
      location: location.trim(),
      status: "pending" as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await menuItems.insertOne(newItem);

    return res.status(201).json({
      success: true,
      message: "Pizza submitted for admin approval.",
      data: {
        ...newItem,
        _id: result.insertedId
      }
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to create menu item."
    });
  }
}

export async function getMyMenuItems(req: Request, res: Response) {
  try {
    if (!req.authUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    const items = await menuItems
      .find({ vendorId: req.authUser.id })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your menu items."
    });
  }
}

// P2_VENDOR_MENU_ACTIONS
import { ObjectId } from "mongodb";

export async function updateMyMenuItem(req: Request, res: Response) {
  try {
    const user = req.authUser;
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!user) return res.status(401).json({ success: false, message: "Authentication required." });
    if (!id || !ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid menu item ID." });

    const body = req.body ?? {};
    const update: Record<string, unknown> = {};

    if (typeof body.isActive === "boolean") update.isActive = body.isActive;

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 80)
        return res.status(400).json({ success: false, message: "Name must be 1-80 characters." });
      update.name = body.name.trim();
    }

    if (body.description !== undefined) {
      if (typeof body.description !== "string" || !body.description.trim() || body.description.trim().length > 500)
        return res.status(400).json({ success: false, message: "Description must be 1-500 characters." });
      update.description = body.description.trim();
    }

    if (body.category !== undefined) {
      const category = ALLOWED_CATEGORIES.find((x) => x.toLowerCase() === String(body.category).trim().toLowerCase());
      if (!category) return res.status(400).json({ success: false, message: "Invalid category." });
      update.category = category;
    }

    if (body.price !== undefined) {
      if (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price <= 0 || body.price > 100000)
        return res.status(400).json({ success: false, message: "Invalid price." });
      update.price = body.price;
    }

    if (body.imageUrl !== undefined) {
      if (typeof body.imageUrl !== "string" || !isHttpUrl(body.imageUrl.trim()))
        return res.status(400).json({ success: false, message: "Image URL must be http or https." });
      update.imageUrl = body.imageUrl.trim();
    }

    if (body.location !== undefined) {
      if (typeof body.location !== "string" || !body.location.trim() || body.location.trim().length > 120)
        return res.status(400).json({ success: false, message: "Location must be 1-120 characters." });
      update.location = body.location.trim();
    }

    if (Object.keys(update).length === 0)
      return res.status(400).json({ success: false, message: "No valid fields to update." });

    update.updatedAt = new Date();

    const result = await menuItems.updateOne(
      { _id: new ObjectId(id), vendorId: user.id },
      { $set: update }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ success: false, message: "Menu item not found or not owned by you." });

    return res.status(200).json({ success: true, message: "Menu item updated." });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to update menu item." });
  }
}

export async function deleteMyMenuItem(req: Request, res: Response) {
  try {
    const user = req.authUser;
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!user) return res.status(401).json({ success: false, message: "Authentication required." });
    if (!id || !ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid menu item ID." });

    const result = await menuItems.deleteOne({ _id: new ObjectId(id), vendorId: user.id });

    if (result.deletedCount === 0)
      return res.status(404).json({ success: false, message: "Menu item not found or not owned by you." });

    return res.status(200).json({ success: true, message: "Menu item deleted." });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to delete menu item." });
  }
}

