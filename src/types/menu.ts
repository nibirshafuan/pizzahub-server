import type { ObjectId } from "mongodb";

export type MenuItemStatus = "pending" | "approved" | "rejected";

export interface MenuItem {
  _id?: ObjectId;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  location: string;
  status: MenuItemStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
