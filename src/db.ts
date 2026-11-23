import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || "pizzahub";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing from .env");
}

export const mongoClient = new MongoClient(MONGODB_URI);

export const db = mongoClient.db(DATABASE_NAME);

export async function connectMongo() {
  await mongoClient.connect();
  await db.command({ ping: 1 });

  console.log("MongoDB connected successfully!");
  console.log(`Database: ${DATABASE_NAME}`);
}
