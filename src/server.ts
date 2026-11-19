import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { setServers } from "node:dns";

dotenv.config();

setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || "pizzahub";

app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

app.use(express.json());

let mongoClient: MongoClient;

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "PizzaHub API is running!"
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "PizzaHub Server is healthy",
    database: mongoClient ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    mongoClient = new MongoClient(MONGODB_URI);

    await mongoClient.connect();
    await mongoClient.db(DATABASE_NAME).command({ ping: 1 });

    console.log("MongoDB connected successfully!");
    console.log(`Database: ${DATABASE_NAME}`);

    app.listen(PORT, () => {
      console.log(`PizzaHub Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start PizzaHub Server:", error);
    process.exit(1);
  }
}

startServer();
