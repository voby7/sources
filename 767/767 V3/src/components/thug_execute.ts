import {
  ComponentCommand,
  type ComponentContext,
} from "seyfert";
import { readFile } from "fs/promises";
import { join } from "path";
import { checkAccess } from "../utils/access.js";

export default class ThugExecuteComponent extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "thug_execute";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    if (!(await checkAccess(ctx))) return;

    const gifsTxt = await readFile(join(process.cwd(), "gifs.txt"), "utf-8");
    const gifs = gifsTxt
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const selectedGifs: string[] = [];
    const gifIndices = new Set<number>();
    while (selectedGifs.length < 3 && gifIndices.size < gifs.length) {
      const randomIndex = Math.floor(Math.random() * gifs.length);
      if (!gifIndices.has(randomIndex)) {
        gifIndices.add(randomIndex);
        selectedGifs.push(gifs[randomIndex]);
      }
    }

    if (selectedGifs.length === 0) {
      await ctx.write({
        content: "no thug gifs found",
        flags: 64,
      });
      return;
    }

    await ctx.deferReply();

    for (const gif of selectedGifs) {
      await ctx.followup({
        content: gif,
        allowed_mentions: {
          parse: ["everyone", "users", "roles"],
        },
      });
    }

    setImmediate(async () => {
      const followups = [];
      for (let i = 0; i < 5; i++) {
        followups.push(
          new Promise((resolve) => {
            setTimeout(async () => {
              try {
                for (const gif of selectedGifs) {
                  await ctx.followup({
                    content: gif,
                    allowed_mentions: {
                      parse: ["everyone", "users", "roles"],
                    },
                  });
                }
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
