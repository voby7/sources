import {
  Declare,
  Command,
  type CommandContext,
  Options,
  createStringOption,
  Container,
  Section,
  Button,
  TextDisplay,
} from "seyfert";
import { getServerInvite } from "../config.js";
import { saveFloodMessage } from "../db.js";
import { createHash } from "crypto";
import { checkAccess } from "../utils/access.js";

const options = {
  message: createStringOption({
    description: "the message to flood the channel with",
    required: true,
    max_length: 1950,
  }),
};

@Declare({
  name: "flood",
  description: "flood the channel",
  integrationTypes: ["GuildInstall", "UserInstall"],
  contexts: ["Guild", "BotDM", "PrivateChannel"],
})
@Options(options)
export default class FloodCommand extends Command {
  async run(ctx: CommandContext<typeof options>) {
    const message = ctx.options.message;
    const serverInvite = getServerInvite();

    if (!(await checkAccess(ctx))) return;

    const floodId = createHash("md5")
      .update(message)
      .digest("hex")
      .substring(0, 16);

    await saveFloodMessage(floodId, message);
    const floodButton = new Button()
      .setCustomId(`flood_execute:${floodId}`)
      .setLabel("SPAM")
      .setStyle(4);

    const floodSection = new Section()
      .addComponents(new TextDisplay().setContent("..."))
      .setAccessory(floodButton);

    const serverSection = serverInvite
      ? new Section()
          .addComponents(new TextDisplay().setContent("join our server"))
          .setAccessory(
            new Button().setLabel("server").setStyle(5).setURL(serverInvite),
          )
      : null;

    const sections = [floodSection];
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
