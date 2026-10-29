import { loadConfig } from "../config.js";
import { getCachedMember, saveCachedMember } from "../db.js";
import {
  Container,
  TextDisplay,
  Button,
  ActionRow,
} from "seyfert";

export async function checkAccess(ctx: any): Promise<boolean> {
  const config = loadConfig();
  if (!config.required_server_id) return true;

  const userId = ctx.author.id;
  let member = await getCachedMember(userId);

  if (!member) {
    try {
      const guild = ctx.client.guilds.get(config.required_server_id);
      if (!guild) return true;
      member = await guild.members.fetch(userId);
      if (member) {
        await saveCachedMember(userId, member);
      }
    } catch (error) {}
  }

  if (!member) {
    const invite = config.server_invite;
    const container = new Container().addComponents(
      new TextDisplay().setContent("join server to use bot"),
      new ActionRow().addComponents(
        new Button().setLabel("join").setStyle(5).setURL(invite),
      ),
    );

    await ctx.write({
      components: [container],
      flags: 32768 | 64,
    });
    return false;
  }

  if (
    config.required_role_id &&
    !member.roles.includes(config.required_role_id)
  ) {
    const container = new Container().addComponents(
      new TextDisplay().setContent("you need the required role to use bot"),
    );

    await ctx.write({
      components: [container],
      flags: 32768 | 64,
    });
    return false;
  }

  return true;
}
