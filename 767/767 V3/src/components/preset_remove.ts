import {
  ComponentCommand,
  type ComponentContext,
  Modal,
  Label,
  StringSelectMenu,
  StringSelectOption,
} from "seyfert";
import { getUserPresetNames, deleteUserPreset } from "../db.js";
import {
  createUserId,
  createPresetName,
  type UserId,
  type PresetName,
} from "../types.js";

export default class PresetRemoveComponent extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "preset_remove";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const userId = createUserId(ctx.author.id);
    const presets = await getUserPresetNames(userId);

    if (presets.length === 0) {
      await ctx.write({
        content: "you have no presets to remove",
        flags: 64,
      });
      return;
    }

    const selectOptions = presets.map((name: string) =>
      new StringSelectOption().setLabel(name).setValue(name),
    );

    const selectMenu = new StringSelectMenu()
      .setCustomId("remove_preset_select")
      .setOptions(selectOptions)
      .setPlaceholder("choose a preset to remove");

    const selectLabel = new Label()
      .setLabel("select preset to remove")
      .setComponent(selectMenu);

    const modal = new Modal()
      .setCustomId("remove_preset_modal")
      .setTitle("remove custom raid message")
      .setComponents([selectLabel])
      .run(this.handleModal.bind(this));

    await ctx.interaction.modal(modal);
  }

  async handleModal(interaction: any) {
    try {
      const userId = createUserId(interaction.user.id);
      const presetName = createPresetName(
        interaction.getInputValue("remove_preset_select", true) as string,
      );

      const { deleteUserPreset } = await import("../db.js");

      const result = await deleteUserPreset(userId, presetName);
      console.log("Database delete result:", result);

      await interaction.write({
        content: `successfully removed preset ${presetName}`,
        flags: 64,
      });
    } catch (error) {
      console.error("Error in remove preset modal:", error);
      await interaction.write({
        content: "failed to remove preset please try again",
        flags: 64,
      });
    }
  }
}
