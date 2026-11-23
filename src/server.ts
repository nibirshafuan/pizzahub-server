import express from "express";
import cors from "cors";
import "dotenv/config";
import { setServers } from "node:dns";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { connectMongo, db } from "./db.js";
import menuRoutes from "./routes/menuRoutes.js";
import vendorMenuRoutes from "./routes/vendorMenuRoutes.js";
import adminMenuRoutes from "./routes/adminMenuRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";

setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

app.use(cors({
  origin: [
    CLIENT_URL,
    "http://localhost:3000",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3002"
  ],
  credentials: true
}));

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use("/api/menu", menuRoutes);
app.use("/api/vendor/menu", vendorMenuRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/menu", adminMenuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/newsletter", newsletterRoutes);

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "PizzaHub API is running!"
  });
});

app.get("/api/health", async (_req, res) => {
  try {
    await db.command({ ping: 1 });

    res.status(200).json({
      success: true,
      message: "PizzaHub Server is healthy",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(503).json({
      success: false,
      message: "PizzaHub Server is running but the database is unreachable",
      database: "disconnected",
      timestamp: new Date().toISOString()
    });
  }
});

async function startServer() {
  try {
    await connectMongo();

    app.listen(PORT, () => {
      console.log(`PizzaHub Server running on port ${PORT}`);
      console.log("Better Auth routes are ready!");
    });
  } catch (error) {
    console.error("Failed to start PizzaHub Server:", error);
    process.exit(1);
  }
}

startServer();




