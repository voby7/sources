import {
  ComponentCommand,
  type ComponentContext,
  Modal,
  Label,
  TextInput,
} from "seyfert";
import { saveUserPreset } from "../db.js";
import {
  createUserId,
  createPresetName,
  type UserId,
  type PresetName,
} from "../types.js";

export default class PresetAddComponent extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "preset_add";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const nameInput = new TextInput()
      .setCustomId("preset_name")
      .setStyle(1)
      .setPlaceholder("enter a name for your preset")
      .setRequired(true)
      .setLength({ min: 1, max: 50 });

    const contentInput = new TextInput()
      .setCustomId("preset_content")
      .setStyle(2)
      .setPlaceholder("enter your custom raid message")
      .setRequired(true)
      .setLength({ min: 1, max: 1950 });

    const nameLabel = new Label()
      .setLabel("preset name")
      .setComponent(nameInput);

    const contentLabel = new Label()
      .setLabel("message content")
      .setComponent(contentInput);

    const modal = new Modal()
      .setCustomId("add_preset_modal")
      .setTitle("add custom raid message")
      .setComponents([nameLabel, contentLabel])
      .run(this.handleModal.bind(this));

    await ctx.interaction.modal(modal);
  }

  async handleModal(interaction: any) {
    try {
      const userId = createUserId(interaction.user.id);
      console.log("Adding preset for user:", userId);

      const presetName = createPresetName(
        interaction.getInputValue("preset_name", true) as string,
      );
      const presetContent = interaction.getInputValue(
        "preset_content",
        true,
      ) as string;

      console.log(
        "Preset name:",
        presetName,
        "Content length:",
        presetContent.length,
      );

      const { saveUserPreset, checkPresetLimit } = await import("../db.js");

      const atLimit = await checkPresetLimit(userId);
      console.log("User at limit:", atLimit);

      if (atLimit) {
        await interaction.write({
          content:
            "you have reached the maximum limit of 10 presets delete some presets first using the remove button",
          flags: 64,
        });
        return;
      }

      const result = await saveUserPreset(userId, presetName, presetContent);
      console.log("Database save result:", result);

      await interaction.write({
        content: `successfully added preset ${presetName} you can now use it with customr4id`,
        flags: 64,
      });
    } catch (error) {
      console.error("Error in add preset modal:", error);
      await interaction.write({
        content: "failed to save preset please try again",
        flags: 64,
      });
    }
  }
}
