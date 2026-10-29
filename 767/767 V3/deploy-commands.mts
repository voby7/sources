import { Client } from "seyfert";
import "dotenv/config";

async function deployCommands() {
  const client = new Client();

  try {
    console.log("Starting command deployment...");
    await client.start();
    console.log("Uploading commands...");
    await client.uploadCommands({ cachePath: "./commands.json" });
    console.log(
      "Commands deployed:",
      client.commands.values.map((cmd: any) => cmd.name).join(", "),
    );
    process.exit(0);
  } catch (error) {
    console.error("Failed to deploy commands:", error);
    process.exit(1);
  }
}

deployCommands();
