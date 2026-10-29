import {
  ComponentCommand,
  type ComponentContext,
  Modal,
  Label,
  TextInput,
  FileUpload,
  Button,
  Container,
  Section,
  TextDisplay,
} from "seyfert";
import { storeFile } from "../db.js";
import {
  createUserId,
  type UserId,
} from "../types.js";

export default class FileUploadComponent extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "file_upload";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const fileUpload = new FileUpload().setCustomId("spam_file");

    const fileLabel = new Label()
      .setLabel("upload file to spam")
      .setComponent(fileUpload);

    const messageInput = new TextInput()
      .setCustomId("file_message")
      .setStyle(2)
      .setPlaceholder("enter message to send with file (optional)")
      .setRequired(false)
      .setLength({ min: 0, max: 1950 });

    const messageLabel = new Label()
      .setLabel("message content")
      .setComponent(messageInput);

    const modal = new Modal()
      .setCustomId("file_upload_modal")
      .setTitle("upload file to spam")
      .setComponents([fileLabel, messageLabel])
      .run(this.handleModal.bind(this));

    await ctx.interaction.modal(modal);
  }

  async handleModal(interaction: any) {
    try {
      const files = interaction.getFiles("spam_file");
      const file = files?.[0];
      const message = interaction.getInputValue("file_message", true) as string;

      if (!file) {
        await interaction.deferUpdate();
        return;
      }

      const { storeFile } = await import("../db.js");
      await storeFile(interaction.user.id, {
        url: file.url,
        filename: file.filename,
        message: message,
      });

      const spamButton = new Button()
        .setCustomId("spam_stored_file")
        .setLabel("spam file")
        .setStyle(4);

      const section = new Section()
        .addComponents(
          new TextDisplay().setContent(
            `file uploaded: ${file.filename}${message ? `\nmessage: ${message}` : ""}`,
          ),
        )
        .setAccessory(spamButton);

      const container = new Container().addComponents(section);

      await interaction.update({
        components: [container],
        flags: 32768 | 64,
      });
    } catch (error) {
      console.error("Error in file upload modal:", error);
    }
  }
}
