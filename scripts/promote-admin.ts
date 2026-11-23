import "dotenv/config";
import { setServers } from "node:dns";
import { connectMongo, db } from "../src/db.js";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

setServers(["1.1.1.1", "8.8.8.8"]);

const rl = createInterface({ input, output });

async function main() {
  try {
    await connectMongo();

    const email = (await rl.question("Admin account email: "))
      .trim()
      .toLowerCase();

    if (!email) {
      console.log("Email is required.");
      return;
    }

    const users = db.collection("user");
    const user = await users.findOne({ email });

    if (!user) {
      console.log("Account not found. Check the email and try again.");
      return;
    }

    console.log("\nAccount found:");
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("Current role:", user.role ?? "customer");

    if (user.role === "admin") {
      console.log("This account is already an admin.");
      return;
    }

    const confirm = await rl.question(
      "\nMake this account an ADMIN? Type YES to confirm: "
    );

    if (confirm.trim() !== "YES") {
      console.log("Cancelled. No changes made.");
      return;
    }

    const result = await users.updateOne(
      { _id: user._id, email: user.email },
      { $set: { role: "admin" } }
    );

    if (result.modifiedCount === 1) {
      console.log("\nAdmin role assigned successfully.");
    } else {
      console.log("\nRole was not changed.");
    }
  } catch (error) {
    console.error("Admin role update failed:", error);
  } finally {
    rl.close();
    process.exit();
  }
}

main();
