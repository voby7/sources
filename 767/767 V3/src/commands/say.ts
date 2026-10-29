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
import { checkAccess } from "../utils/access.js";

const options = {
  message: createStringOption({
    description: "the message to send to the channel",
    required: true,
    max_length: 2000,
  }),
};

@Declare({
  name: "say",
  description: "send a message to the channel",
  integrationTypes: ["GuildInstall", "UserInstall"],
  contexts: ["Guild", "BotDM", "PrivateChannel"],
})
@Options(options)
export default class SayCommand extends Command {
  async run(ctx: CommandContext<typeof options>) {
    const message = ctx.options.message;
    const serverInvite = getServerInvite();

    if (!(await checkAccess(ctx))) return;

    const serverSection = serverInvite
      ? new Section()
          .addComponents(new TextDisplay().setContent("join our server"))
          .setAccessory(
            new Button().setLabel("server").setStyle(5).setURL(serverInvite),
          )
      : null;

    const container = serverSection
      ? new Container().addComponents(serverSection)
      : null;

    if (container) {
      await ctx.write(
        {
          components: [container],
          flags: 32768 | 64,
        },
        false,
      );
    } else {
      await ctx.write({
        content: "okay",
        flags: 64,
      });
    }

    await ctx.followup({
      content: message,
      allowed_mentions: {
        parse: ["everyone", "users", "roles"],
      },
    });
  }
}
