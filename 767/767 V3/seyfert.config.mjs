import { config } from "seyfert";
import { readFileSync } from "fs";
import { parse } from "yaml";

const botConfig = (() => {
  try {
    const configContent = readFileSync("bot.yaml", "utf-8");
    return parse(configContent);
  } catch (error) {
    console.error("Failed to load bot.yaml:", error);
    return { token: "" };
  }
})();

export default config.bot({
  token: botConfig.token,
  locations: {
    base: "src",
    commands: "commands",
    components: "components",
  },
  intents: ["Guilds", "MessageContent"],
});
