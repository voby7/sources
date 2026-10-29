import {
  Declare,
  Command,
  type CommandContext,
  Container,
  Section,
  Button,
  TextDisplay,
} from "seyfert";
import { getUserPresetNames } from "../db.js";
import { getServerInvite } from "../config.js";
import {
  createUserId,
  type UserId,
} from "../types.js";

@Declare({
  name: "presetmessage",
  description: "manage your custom raid message presets",
  integrationTypes: ["GuildInstall", "UserInstall"],
  contexts: ["Guild", "BotDM", "PrivateChannel"],
})
export default class PresetMessageCommand extends Command {
  async run(ctx: CommandContext) {
    const addButton = new Button()
      .setCustomId("preset_add")
      .setLabel("add")
      .setStyle(3);

    const editButton = new Button()
      .setCustomId("preset_edit")
      .setLabel("edit")
      .setStyle(1);

    const removeButton = new Button()
      .setCustomId("preset_remove")
      .setLabel("remove")
      .setStyle(4);

    const addSection = new Section()
      .addComponents(new TextDisplay().setContent("add a custom message"))
      .setAccessory(addButton);

    const editSection = new Section()
      .addComponents(new TextDisplay().setContent("edit one"))
      .setAccessory(editButton);

    const removeSection = new Section()
      .addComponents(new TextDisplay().setContent("remove a custom message"))
      .setAccessory(removeButton);

    const serverInvite = getServerInvite();
    const serverSection = serverInvite
      ? new Section()
          .addComponents(new TextDisplay().setContent("join our server"))
          .setAccessory(
            new Button().setLabel("server").setStyle(5).setURL(serverInvite),
          )
      : null;

    const sections = [addSection, editSection, removeSection];
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
