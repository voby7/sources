import { Client } from "seyfert";
import "dotenv/config";
import { loadConfig } from "./config.js";

const config = loadConfig();

process.env.DISCORD_TOKEN = config.token;
process.env.DISCORD_CLIENT_ID = config.client_id;

async function deployCommands(client: Client) {
  try {
    await client.uploadCommands({ cachePath: "./commands.json" });
    console.log("commands synced");
  } catch (error) {
    console.error("Failed to deploy commands:", error);
  }
}

async function cleanupExpiredFiles() {
  try {
    const { storedFilesDb } = await import("./db.js");
    const oneHourAgo = new Date(Date.now() - 3600000);

    const result = await storedFilesDb.remove(
      {
        created_at: { $lt: oneHourAgo },
      },
      { multi: true },
    );

    if (result > 0) {
      console.log(`Cleaned up ${result} expired files`);
    }
  } catch (error) {
    console.error("Error during file cleanup:", error);
  }
}

const client = new Client();

console.log("Starting Seyfert bot...");

client
  .start()
  .then(async () => {
    console.log("Bot connected to Discord successfully!");
    console.log(`Logged in with client ID: ${process.env.DISCORD_CLIENT_ID}`);
    console.log("Deploying commands...");
    await deployCommands(client);
    console.log(
      "Commands synced:",
      client.commands.values.map((cmd: any) => cmd.name).join(", "),
    );
    setInterval(cleanupExpiredFiles, 30 * 60 * 1000);
    console.log("Started periodic file cleanup (every 30 minutes)");
  })
  .catch((error) => {
    console.error("Failed to start bot:", error);
    process.exit(1);
  });
