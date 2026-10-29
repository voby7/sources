import {
  ComponentCommand,
  type ComponentContext,
  AttachmentBuilder,
} from "seyfert";
import { getStoredFile } from "../db.js";
import { createUserId, type UserId } from "../types.js";

export default class SpamStoredFileComponent extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "spam_stored_file";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const userId = ctx.author.id;
    const storedFile: any = await getStoredFile(createUserId(userId));

    if (!storedFile) {
      await ctx.write({
        content: "no file stored upload a file first",
        flags: 64,
      });
      return;
    }

    const attachment = new AttachmentBuilder()
      .setName(storedFile.filename)
      .setFile("url", storedFile.url);

    await ctx.write({
      content: storedFile.message || "",
      files: [attachment],
      allowed_mentions: {
        parse: ["everyone", "users", "roles"],
      },
    });

    for (let i = 0; i < 5; i++) {
      const followupAttachment = new AttachmentBuilder()
        .setName(storedFile.filename)
        .setFile("url", storedFile.url);

      await ctx.followup({
        content: storedFile.message || "",
        files: [followupAttachment],
        allowed_mentions: {
          parse: ["everyone", "users", "roles"],
        },
      });
    }
  }
}
