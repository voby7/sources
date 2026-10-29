import {
  ComponentCommand,
  type ComponentContext,
} from "seyfert";
import { readFileSync } from "fs";
import { join } from "path";

export default class RaidButton extends ComponentCommand {
  componentType = "Button" as const;
  private messages: string[] = [];

  constructor() {
    super();
    try {
      const messagesPath = join(process.cwd(), "raid_messages.jsonc");
      const content = readFileSync(messagesPath, "utf-8");
      const cleaned = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      this.messages = JSON.parse(cleaned) as string[];
    } catch (error) {
      console.error("Failed to load raid_messages.jsonc:", error);
      this.messages = ["fallback1", "fallback2", "fallback3"];
    }
  }

  private getRandomMessage(): string {
    return this.messages[Math.floor(Math.random() * this.messages.length)];
  }

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "raid_button";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    await ctx.deferReply();

    await ctx.followup({
      content: this.getRandomMessage(),
      allowed_mentions: {
        parse: ["everyone", "users", "roles"],
      },
    });

    setImmediate(async () => {
      const followups = [];
      for (let i = 0; i < 5; i++) {
        followups.push(
          new Promise((resolve) => {
            setTimeout(async () => {
              try {
                await ctx.followup({
                  content: this.getRandomMessage(),
                  allowed_mentions: {
                    parse: ["everyone", "users", "roles"],
                  },
                });
              } catch (error) {
                console.error(`Failed to send followup ${i + 1}:`, error);
              }
              resolve(void 0);
            }, 0);
          }),
        );
      }

      await Promise.all(followups);
    });
  }
}
