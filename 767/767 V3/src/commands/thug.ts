import {
  Declare,
  Command,
  type CommandContext,
  Container,
  Section,
  Button,
  TextDisplay,
} from "seyfert";
import { getServerInvite } from "../config.js";
import { readFile } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { createUserId, type UserId } from "../types.js";
import { checkAccess } from "../utils/access.js";

@Declare({
  name: "thug",
  description: "thug the server",
  integrationTypes: ["GuildInstall", "UserInstall"],
  contexts: ["Guild", "BotDM", "PrivateChannel"],
})
export default class ThugCommand extends Command {
  async run(ctx: CommandContext) {
    const serverInvite = getServerInvite();

    if (!(await checkAccess(ctx))) return;

    const thugButton = new Button()
      .setCustomId("thug_execute")
      .setLabel("SPAM")
      .setStyle(4);

    const thugSection = new Section()
      .addComponents(new TextDisplay().setContent(".."))
      .setAccessory(thugButton);

    const serverSection = serverInvite
      ? new Section()
          .addComponents(new TextDisplay().setContent("join our server"))
          .setAccessory(
            new Button().setLabel("server").setStyle(5).setURL(serverInvite),
          )
      : null;

    const sections = [thugSection];
    if (serverSection) sections.push(serverSection);

    const container = new Container().addComponents(...sections);

    await ctx.write(
      {
        components: [container],
        flags: 32768 | 64,
      },
      false,
    );
  }
}
