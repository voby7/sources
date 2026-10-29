import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function boot() {
  console.log("Running bun run build...");
  const buildProcess = spawn("bun", ["run", "build"], {
    stdio: "inherit",
    shell: true,
  });

  buildProcess.on("close", (code) => {
    if (code === 0) {
      console.log("Build successful. Starting bot...");
      const botProcess = spawn(
        "bun",
        ["run", path.join(__dirname, "dist", "index.js")],
        { stdio: "inherit", shell: true },
      );

      botProcess.on("close", (botCode) => {
        console.log(`Bot process exited with code ${botCode}`);
      });
    } else {
      console.error(`Build failed with code ${code}`);
      process.exit(1);
    }
  });

  buildProcess.on("error", (err) => {
    console.error("Failed to start build process:", err);
    process.exit(1);
  });
}

boot();
