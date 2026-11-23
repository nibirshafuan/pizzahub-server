import type { Request, Response } from "express";
import { db } from "../db.js";

type NewsletterSubscriber = {
  email: string;
  subscribedAt: Date;
};

const subscribers = db.collection<NewsletterSubscriber>("newsletterSubscribers");

export async function subscribeNewsletter(req: Request, res: Response) {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
    });
  }

  try {
    await subscribers.createIndex({ email: 1 }, { unique: true });

    const existing = await subscribers.findOne({ email });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "This email is already subscribed.",
      });
    }

    await subscribers.insertOne({
      email,
      subscribedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "You have successfully subscribed to PizzaHub updates.",
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return res.status(200).json({
        success: true,
        message: "This email is already subscribed.",
      });
    }

    console.error("Newsletter subscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Subscription failed. Please try again later.",
    });
  }
}