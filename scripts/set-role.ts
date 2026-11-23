import "dotenv/config";
import { setServers } from "node:dns";
import { connectMongo, db } from "../src/db.js";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

setServers(["1.1.1.1", "8.8.8.8"]);

const ROLES = ["customer", "vendor", "admin"];

const rl = createInterface({ input, output });

async function main() {
  try {
    await connectMongo();

    const email = (await rl.question("Account email: "))
      .trim()
      .toLowerCase();

    if (!email) {
      console.log("Email is required.");
      return;
    }

    const users = db.collection("user");
    const user = await users.findOne({ email });

    if (!user) {
      console.log("Account not found. Sign up first, then run this again.");
      return;
    }

    console.log("\nAccount found:");
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("Current role:", user.role ?? "customer");

    const role = (
      await rl.question(`\nNew role (${ROLES.join(" / ")}): `)
    )
      .trim()
      .toLowerCase();

    if (!ROLES.includes(role)) {
      console.log("Invalid role. No changes made.");
      return;
    }

    if ((user.role ?? "customer") === role) {
      console.log(`This account already has the ${role} role.`);
      return;
    }

    const confirm = await rl.question(
      `\nChange role to ${role.toUpperCase()}? Type YES to confirm: `
    );

    if (confirm.trim() !== "YES") {
      console.log("Cancelled. No changes made.");
      return;
    }

    const result = await users.updateOne(
      { _id: user._id },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 1) {
      console.log(`\nRole updated to ${role}. Sign out and sign in again to refresh the session.`);
    } else {
      console.log("\nRole was not changed.");
    }
  } catch (error) {
    console.error("Role update failed:", error);
  } finally {
    rl.close();
    process.exit();
  }
}

main();
