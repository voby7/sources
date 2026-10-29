import {
  ComponentCommand,
  type ComponentContext,
  Modal,
  Label,
  TextInput,
  StringSelectMenu,
  StringSelectOption,
} from "seyfert";
import { getUserPresetNames, saveUserPreset } from "../db.js";
import {
  createUserId,
  createPresetName,
  type UserId,
  type PresetName,
} from "../types.js";

export default class PresetEditComponent extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "preset_edit";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const userId = createUserId(ctx.author.id);
    const presets = await getUserPresetNames(userId);

    if (presets.length === 0) {
      await ctx.write({
        content: "you have no presets to edit use the add button first",
        flags: 64,
      });
      return;
    }

    const selectOptions = presets.map((name: string) =>
      new StringSelectOption().setLabel(name).setValue(name),
    );

    const selectMenu = new StringSelectMenu()
      .setCustomId("edit_preset_select")
      .setOptions(selectOptions)
      .setPlaceholder("choose a preset to edit");

    const selectLabel = new Label()
      .setLabel("select preset to edit")
      .setComponent(selectMenu);

    const contentInput = new TextInput()
      .setCustomId("edit_preset_content")
      .setStyle(2)
      .setPlaceholder("enter the new message content")
      .setRequired(true)
      .setLength({ min: 1, max: 1950 });

    const contentLabel = new Label()
      .setLabel("new content")
      .setComponent(contentInput);

    const modal = new Modal()
      .setCustomId("edit_preset_modal")
      .setTitle("edit custom raid message")
      .setComponents([selectLabel, contentLabel])
      .run(this.handleModal.bind(this));

    await ctx.interaction.modal(modal);
  }

  async handleModal(interaction: any) {
    try {
      const userId = createUserId(interaction.user.id);
      const presetName = createPresetName(
        interaction.getInputValue("edit_preset_select", true) as string,
      );
      const newContent = interaction.getInputValue(
        "edit_preset_content",
        true,
      ) as string;

      const { saveUserPreset } = await import("../db.js");

      const result = await saveUserPreset(userId, presetName, newContent);
      console.log("Database update result:", result);

      await interaction.write({
        content: `successfully updated preset ${presetName} you can now use it with customr4id`,
        flags: 64,
      });
    } catch (error) {
      console.error("Error in edit preset modal:", error);
      await interaction.write({
        content: "failed to update preset please try again",
        flags: 64,
      });
    }
  }
}
