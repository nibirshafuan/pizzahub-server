import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { menuItems } from "../models/menuModel.js";

export async function getPendingMenuItems(
  _req: Request,
  res: Response
) {
  try {
    const items = await menuItems
      .find({ status: "pending" })
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
      message: "Failed to fetch pending menu items."
    });
  }
}

export async function updateMenuItemStatus(
  req: Request,
  res: Response
) {
  try {
    const paramId = req.params.id;
    const id = Array.isArray(paramId) ? paramId[0] : paramId;
    const { status } = req.body;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID."
      });
    }

    if (status !== "approved" && status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected."
      });
    }

    const result = await menuItems.updateOne(
      {
        _id: new ObjectId(id),
        status: "pending"
      },
      {
        $set: {
          status,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Pending menu item not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: `Menu item ${status} successfully.`
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to update menu item status."
    });
  }
}

