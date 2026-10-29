import {
  ComponentCommand,
  type ComponentContext,
  Modal,
  Label,
  TextInput,
  StringSelectMenu,
  StringSelectOption,
} from "seyfert";
import { getUserPresetNames, getPresetContent } from "../db.js";
import {
  createUserId,
  createPresetName,
  type UserId,
  type PresetName,
} from "../types.js";

export default class CustomRaidComponent extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("custom_raid:");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const userId = createUserId(ctx.author.id);
    const presetName = createPresetName(ctx.customId.split(":")[1]);

    const messageContent = await getPresetContent(userId, presetName);

    if (!messageContent) {
      await ctx.write({
        content: "preset not found or access denied",
        flags: 64,
      });
      return;
    }

    await ctx.deferReply();

    await ctx.followup({
      content: messageContent,
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
                  content: messageContent,
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
