import {
  ComponentCommand,
  type ComponentContext,
  Modal,
  Label,
  StringSelectMenu,
  StringSelectOption,
  FileUpload,
  Button,
  Container,
  Section,
  TextDisplay,
} from "seyfert";
import { getUserPresetNames, getPresetContent } from "../db.js";
import {
  createUserId,
  createPresetName,
  type UserId,
  type PresetName,
} from "../types.js";

export default class FilePresetComponent extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("file_preset:");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const userId = createUserId(ctx.author.id);
    const presets = await getUserPresetNames(userId);

    if (presets.length === 0) {
      await ctx.write({
        content:
          "you have no presets to use with files use presetmessage to create presets first",
        flags: 64,
      });
      return;
    }

    const selectOptions = presets.map((name: string) =>
      new StringSelectOption().setLabel(name).setValue(name),
    );

    const selectMenu = new StringSelectMenu()
      .setCustomId("file_preset_select")
      .setOptions(selectOptions)
      .setPlaceholder("choose a preset to use with file");

    const selectLabel = new Label()
      .setLabel("select preset")
      .setComponent(selectMenu);

    const fileUpload = new FileUpload().setCustomId("preset_file");

    const fileLabel = new Label()
      .setLabel("upload file")
      .setComponent(fileUpload);

    const modal = new Modal()
      .setCustomId("file_preset_modal")
      .setTitle("spam file with preset")
      .setComponents([selectLabel, fileLabel])
      .run(this.handleModal.bind(this));

    await ctx.interaction.modal(modal);
  }

  async handleModal(interaction: any) {
    try {
      const presetNames = interaction.getInputValue(
        "file_preset_select",
        true,
      ) as string[];
      const presetName = createPresetName(presetNames[0]);
      const files = interaction.getFiles("preset_file");
      const file = files?.[0];

      if (!file) {
        await interaction.deferUpdate();
        return;
      }

      const userId = createUserId(interaction.user.id);
      const { getPresetContent } = await import("../db.js");
      const presetContent = await getPresetContent(userId, presetName);

      if (!presetContent) {
        await interaction.deferUpdate();
        return;
      }

      const { storeFile } = await import("../db.js");
      await storeFile(userId, {
        url: file.url,
        filename: file.filename,
        message: presetContent,
      });

      const spamButton = new Button()
        .setCustomId("spam_stored_file")
        .setLabel("spam file")
        .setStyle(4);

      const section = new Section()
        .addComponents(
          new TextDisplay().setContent(
            `file uploaded: ${file.filename}\npreset: ${presetName}\nmessage: ${presetContent}`,
          ),
        )
        .setAccessory(spamButton);

      const container = new Container().addComponents(section);

      await interaction.update({
        components: [container],
        flags: 32768 | 64,
      });
    } catch (error) {
      console.error("Error in file preset modal:", error);
    }
  }
}
