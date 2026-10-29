import {
  Declare,
  Command,
  type CommandContext,
  Container,
  Section,
  Button,
  TextDisplay,
} from "seyfert";
import {
  createUserId,
  type UserId,
} from "../types.js";

@Declare({
  name: "filespam",
  description: "spam a file to the chat",
  integrationTypes: ["GuildInstall", "UserInstall"],
  contexts: ["Guild", "BotDM", "PrivateChannel"],
})
export default class FileSpamCommand extends Command {
  async run(ctx: CommandContext) {
    const { getStoredFile } = await import("../db.js");
    const storedFile = await getStoredFile(createUserId(ctx.author.id));

    if (storedFile) {
      const spamButton = new Button()
        .setCustomId("spam_stored_file")
        .setLabel("spam file")
        .setStyle(4);

      const section = new Section()
        .addComponents(
          new TextDisplay().setContent("ready to spam your stored file"),
        )
        .setAccessory(spamButton);

      const container = new Container().addComponents(section);

      await ctx.write(
        {
          components: [container],
          flags: 32768 | 64,
        },
        false,
      );
    } else {
      const uploadButton = new Button()
        .setCustomId("file_upload")
        .setLabel("upload file")
        .setStyle(1);

      const presetButton = new Button()
        .setCustomId("file_preset")
        .setLabel("use preset")
        .setStyle(3);

      const uploadSection = new Section()
        .addComponents(new TextDisplay().setContent("upload a file to spam"))
        .setAccessory(uploadButton);

      const presetSection = new Section()
        .addComponents(new TextDisplay().setContent("use preset with file"))
        .setAccessory(presetButton);

      const container = new Container().addComponents(
        uploadSection,
        presetSection,
      );

      await ctx.write(
        {
          components: [container],
          flags: 32768 | 64,
        },
        false,
      );
    }
  }

  async handleModal(interaction: any) {
    try {
      const files = interaction.getFiles("spam_file");
      const file = files?.[0];

      if (!file) {
        await interaction.deferUpdate();
        return;
      }

      const { storeFile } = await import("../db.js");
      await storeFile(createUserId(interaction.user.id), {
        url: file.url,
        filename: file.filename,
        message: interaction.getInputValue("file_message", true) as string,
      });

      const spamButton = new Button()
        .setCustomId("spam_stored_file")
        .setLabel("spam file")
        .setStyle(4);

      const section = new Section()
        .addComponents(
          new TextDisplay().setContent(`file uploaded: ${file.filename}`),
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
