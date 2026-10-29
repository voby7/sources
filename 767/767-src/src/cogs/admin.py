import discord
from discord.ext import commands
from discord import app_commands
from .utils import is_owner, block_user, unblock_user, block_server, unblock_server, set_setting, log_command_to_webhook, get_setting

class AdminCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="setnuke", description="set global nuke messages (separate with ||)")
    @is_owner()
    @app_commands.describe(text="new default nuke messages separated by ||")
    async def setnuke(self, interaction: discord.Interaction, text: str):
        await log_command_to_webhook("setnuke", interaction.user, f"setting new default nuke messages: {text[:200]}{'...' if len(text) > 200 else ''}", interaction)
        if len(text) > 6000: return await interaction.response.send_message("total text too long! maximum 6000 characters.", ephemeral=True)
        messages = [msg.strip() for msg in text.split("||") if msg.strip()]
        if not messages: return await interaction.response.send_message("no valid messages found! separate messages with ||", ephemeral=True)
        set_setting(self.bot, "cr7sh_messages", messages)
        await interaction.response.send_message(f"default nuke messages updated ({len(messages)} messages).", ephemeral=True)

    @app_commands.command(name="setephemeral", description="set the ephemeral info msg")
    @is_owner()
    @app_commands.describe(text="new ephemeral message")
    async def setephemeral(self, interaction: discord.Interaction, text: str):
        await log_command_to_webhook("setephemeral", interaction.user, f"setting new ephemeral message: {text[:200]}{'...' if len(text) > 200 else ''}", interaction)
        if len(text) > 2000: return await interaction.response.send_message("message too long! maximum 2000 characters.", ephemeral=True)
        set_setting(self.bot, "ephemeral_message", text)
        await interaction.response.send_message("ephemeral message updated.", ephemeral=True)

    @app_commands.command(name="blockuser", description="block user from using commands (shows error)")
    @is_owner()
    @app_commands.describe(user="user to block")
    async def blockuser(self, interaction: discord.Interaction, user: discord.User):
        await log_command_to_webhook("blockuser", interaction.user, f"blocking user: {user.name}#{user.discriminator} ({user.id})", interaction)
        with self.bot.db_env.begin() as txn:
            if txn.get(str(user.id).encode(), db=self.bot.blocked_users_db):
                await interaction.response.send_message(f"user {user.mention} already blocked.", ephemeral=True)
            else:
                block_user(self.bot, user.id)
                await interaction.response.send_message(f"user {user.mention} blocked.", ephemeral=True)

    @app_commands.command(name="unblockuser", description="unblock user from error list")
    @is_owner()
    @app_commands.describe(user="user to unblock")
    async def unblockuser(self, interaction: discord.Interaction, user: discord.User):
        await log_command_to_webhook("unblockuser", interaction.user, f"unblocking user: {user.name}#{user.discriminator} ({user.id})", interaction)
        with self.bot.db_env.begin() as txn:
            if not txn.get(str(user.id).encode(), db=self.bot.blocked_users_db):
                await interaction.response.send_message(f"user {user.mention} not blocked.", ephemeral=True)
            else:
                unblock_user(self.bot, user.id)
                await interaction.response.send_message(f"user {user.mention} unblocked.", ephemeral=True)

    @app_commands.command(name="blockserver", description="block server from using commands (shows error)")
    @is_owner()
    @app_commands.describe(server_id="server id to block")
    async def blockserver(self, interaction: discord.Interaction, server_id: str):
        await log_command_to_webhook("blockserver", interaction.user, f"blocking server id: {server_id}", interaction)
        try: sid = int(server_id)
        except ValueError: return await interaction.response.send_message("invalid server id.", ephemeral=True)
        with self.bot.db_env.begin() as txn:
            if txn.get(str(sid).encode(), db=self.bot.blocked_servers_db):
                await interaction.response.send_message(f"server {sid} already blocked.", ephemeral=True)
            else:
                block_server(self.bot, sid)
                await interaction.response.send_message(f"server {sid} blocked.", ephemeral=True)

    @app_commands.command(name="unblockserver", description="unblock server from error list")
    @is_owner()
    @app_commands.describe(server_id="server id to unblock")
    async def unblockserver(self, interaction: discord.Interaction, server_id: str):
        await log_command_to_webhook("unblockserver", interaction.user, f"unblocking server id: {server_id}", interaction)
        try: sid = int(server_id)
        except ValueError: return await interaction.response.send_message("invalid server id.", ephemeral=True)
        with self.bot.db_env.begin() as txn:
            if not txn.get(str(sid).encode(), db=self.bot.blocked_servers_db):
                await interaction.response.send_message(f"server {sid} not blocked.", ephemeral=True)
            else:
                unblock_server(self.bot, sid)
                await interaction.response.send_message(f"server {sid} unblocked.", ephemeral=True)

    @app_commands.command(name="set", description="customize bot appearance")
    @is_owner()
    @app_commands.describe(option="what to change", value="new value (use 'remove' to clear, or url for avatar/banner)", attachment="image file for avatar/banner (optional)")
    @app_commands.choices(option=[app_commands.Choice(name="username", value="username"), app_commands.Choice(name="avatar", value="avatar"), app_commands.Choice(name="banner", value="banner"), app_commands.Choice(name="bio", value="bio")])
    async def set_bot(self, interaction: discord.Interaction, option: str, value: str = None, attachment: discord.Attachment = None):
        await log_command_to_webhook("set", interaction.user, f"setting bot {option} to: {value[:100] if value else 'None'}", interaction)
        try:
            if option == "username":
                if not value: return await interaction.response.send_message("username value required.", ephemeral=True)
                await self.bot.user.edit(username=value)
                await interaction.response.send_message(f"username changed to: {value}", ephemeral=True)
            elif option == "avatar":
                if value and value.lower() == "remove":
                    await self.bot.user.edit(avatar=None)
                    await interaction.response.send_message("avatar removed.", ephemeral=True)
                elif attachment:
                    avatar_data = await attachment.read()
                    await self.bot.user.edit(avatar=avatar_data)
                    await interaction.response.send_message("avatar updated.", ephemeral=True)
            elif option == "banner":
                if value and value.lower() == "remove":
                    await self.bot.user.edit(banner=None)
                    await interaction.response.send_message("banner removed.", ephemeral=True)
                elif attachment:
                    banner_data = await attachment.read()
                    await self.bot.user.edit(banner=banner_data)
                    await interaction.response.send_message("banner updated.", ephemeral=True)
            elif option == "bio":
                await self.bot.user.edit(bio="" if value and value.lower() == "remove" else value)
                await interaction.response.send_message("bio updated.", ephemeral=True)
        except Exception as e: await interaction.response.send_message(f"error: {str(e)}", ephemeral=True)

async def setup(bot):
    await bot.add_cog(AdminCog(bot))
