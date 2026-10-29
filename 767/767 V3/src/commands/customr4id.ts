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
import { getUserPresets, getPresetContent } from "../db.js";
import { getServerInvite } from "../config.js";
import type { AutocompleteInteraction } from "seyfert";
import { createUserId, createPresetName, type UserId, type PresetName } from "../types.js";
import { checkAccess } from "../utils/access.js";

const options = {
  preset: createStringOption({
    description: "choose one of your custom raid message presets",
    required: true,
    autocomplete: async (interaction: AutocompleteInteraction) => {
      const userId = createUserId(interaction.user.id);
      const presets = await getUserPresets(userId);

      const focus = interaction.getInput();
      const filtered = presets
        .filter((preset: any) =>
          preset.name.toLowerCase().includes((focus || "").toLowerCase()),
        )
        .slice(0, 25);

      return interaction.respond(filtered);
    },
  }),
};

@Declare({
  name: "custom-r4id",
  description: "start a raid with your custom message preset",
  integrationTypes: ["GuildInstall", "UserInstall"],
  contexts: ["Guild", "BotDM", "PrivateChannel"],
})
@Options(options)
export default class CustomRaidCommand extends Command {
  async run(ctx: CommandContext<typeof options>) {
    const presetName = createPresetName(ctx.options.preset);
    const userId = createUserId(ctx.author.id);

    if (!(await checkAccess(ctx))) return;

    const messageContent = await getPresetContent(userId, presetName);

    if (!messageContent) {
      await ctx.write({
        content: "preset not found use presetmessage to create presets first",
      });
      return;
    }

    const button = new Button()
      .setCustomId(`custom_raid:${presetName}`)
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
