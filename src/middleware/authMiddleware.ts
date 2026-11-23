import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import { db } from "../db.js";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        role: string;
      };
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    const account = await db.collection<{ _id: string; role?: string; isBlocked?: boolean }>("user").findOne(
      { _id: session.user.id },
      { projection: { isBlocked: 1 } }
    );

    if (account?.isBlocked === true) {
      return res.status(403).json({
        success: false,
        message: "This account has been blocked by an administrator."
      });
    }
    req.authUser = {
      id: session.user.id,
      role: session.user.role ?? "customer"
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session."
    });
  }
}

export function requireVendor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.authUser?.role !== "vendor") {
    return res.status(403).json({
      success: false,
      message: "Vendor access required."
    });
  }

  next();
}


export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.authUser?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required."
    });
  }

  next();
}

export function requireCustomer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.authUser?.role !== "customer") {
    return res.status(403).json({
      success: false,
      message: "Customer access required."
    });
  }

  next();
}


