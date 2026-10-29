import {
  ComponentCommand,
  type ComponentContext,
} from "seyfert";
import { getFloodMessage } from "../db.js";

export default class FloodExecuteComponent extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("flood_execute:");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const floodId = ctx.customId.split(":")[1];
    const message = await getFloodMessage(floodId);

    if (!message) {
      await ctx.write({
        content: "Flood message expired or not found.",
      });
      return;
    }

    await ctx.write({
      content: message,
      allowed_mentions: {
        parse: ["everyone", "users", "roles"],
      },
    });

    for (let i = 0; i < 5; i++) {
      await ctx.followup({
        content: message,
        allowed_mentions: {
          parse: ["everyone", "users", "roles"],
        },
      });
    }
  }
}
