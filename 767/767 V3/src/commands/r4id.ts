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
import { checkAccess } from "../utils/access.js";

@Declare({
  name: "raid",
  description: "raid the server",
  integrationTypes: ["GuildInstall", "UserInstall"],
  contexts: ["Guild", "BotDM", "PrivateChannel"],
})
export default class RaidCommand extends Command {
  async run(ctx: CommandContext) {
    if (!(await checkAccess(ctx))) return;

    const button = new Button()
      .setCustomId("raid_button")
      .setLabel("click to spam")
      .setStyle(4);

    const section = new Section()
      .addComponents(new TextDisplay().setContent("click to start spamming"))
      .setAccessory(button);

    const serverInvite = getServerInvite();
    const serverSection = serverInvite
      ? new Section()
          .addComponents(new TextDisplay().setContent("join our server"))
          .setAccessory(
            new Button().setLabel("server").setStyle(5).setURL(serverInvite),
          )
      : null;

    const sections = [section];
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
