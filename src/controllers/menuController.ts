import type { Request, Response } from "express";
import { menuItems } from "../models/menuModel.js";
import { ObjectId } from "mongodb";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getPublicMenu(req: Request, res: Response) {
  try {
    const { search, category, location, sort } = req.query;

    const filter: Record<string, unknown> = {
      status: "approved",
      isActive: true
    };

    if (typeof search === "string" && search.trim()) {
      filter.name = {
        $regex: escapeRegex(search.trim()),
        $options: "i"
      };
    }

    if (typeof category === "string" && category.trim()) {
      filter.category = {
        $regex: `^${escapeRegex(category.trim())}$`,
        $options: "i"
      };
    }

    if (typeof location === "string" && location.trim()) {
      filter.location = {
        $regex: escapeRegex(location.trim()),
        $options: "i"
      };
    }

    let sortOption: Record<string, 1 | -1> = {
      createdAt: -1
    };

    if (sort === "price-asc") {
      sortOption = { price: 1 };
    } else if (sort === "price-desc") {
      sortOption = { price: -1 };
    }

    const items = await menuItems
      .find(filter)
      .sort(sortOption)
      .limit(200)
      .toArray();

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu items."
    });
  }
}

export async function getPublicMenuItem(req: Request, res: Response) {
  try {
    const paramId = req.params.id;
    const id = Array.isArray(paramId) ? paramId[0] : paramId;

    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found."
      });
    }

    const item = await menuItems.findOne({
      _id: new ObjectId(id),
      status: "approved",
      isActive: true
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found."
      });
    }

    return res.status(200).json({
      success: true,
      data: item
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menu item."
    });
  }
}
