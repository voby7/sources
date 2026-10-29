import { readFileSync } from "fs";
import { parse } from "yaml";
import type { ConfigShape } from "./types.js";

export type Config = ConfigShape;

let config: Config | null = null;

export function loadConfig(): Config {
  if (!config) {
    try {
      const configContent = readFileSync("bot.yaml", "utf-8");
      config = parse(configContent) as Config;
    } catch (error) {
      console.error("Failed to load bot.yaml:", error);
      config = {
        log_webhook: "",
        owner_id: "",
        required_server_id: "",
        required_role_id: "",
        server_invite: "",
        token: "",
        client_id: "",
      };
    }
  }
  return config;
}

export function getServerInvite(): string {
  return loadConfig().server_invite;
}
