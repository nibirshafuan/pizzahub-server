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

    const user = await db.collection("user").findOne(
      { email },
      { projection: { name: 1, email: 1, role: 1 } }
    );

    if (!user) {
      console.log("Account not found.");
      return;
    }

    console.log("\nAccount:", user.name);
    console.log("Role in database:", user.role ?? "customer");
  } catch (error) {
    console.error("Role check failed:", error);
  } finally {
    rl.close();
    process.exit();
  }
}

main();
