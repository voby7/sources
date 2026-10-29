import discord
from discord.ext import commands
from discord import app_commands, ui, ButtonStyle
from io import BytesIO
import asyncio
import random
import logging
from .utils import get_setting, log_command_to_webhook, global_before_invoke, get_user_raid_message, set_user_raid_message, handle_app_command_error, get_user_button_enabled, set_user_button_enabled, is_user_blocked, get_user_send_invite_enabled, set_user_send_invite_enabled

DEFAULT_CR7SH_MESSAGES = ["# @everyone @here YOU HAVE BEEN SPAMMED! JOIN https://discord.gg/HJuJSJEv\n# @everyone @here YOU HAVE BEEN SPAMMED! JOIN https://discord.gg/HJuJSJEv\n# @everyone @here YOU HAVE BEEN SPAMMED! JOIN https://discord.gg/HJuJSJEv\n# @everyone @here YOU HAVE BEEN SPAMMED! JOIN https://discord.gg/HJuJSJEv\n# @everyone @here YOU HAVE BEEN SPAMMED! JOIN https://discord.gg/HJuJSJEv\n# @everyone @here YOU HAVE BEEN SPAMMED! JOIN https://discord.gg/HJuJSJEv\n# @everyone @here YOU HAVE BEEN SPAMMED! JOIN https://discord.gg/HJuJSJEv\n# @everyone @here YOU HAVE BEEN SPAMMED! JOIN https://discord.gg/HJuJSJEv\n# @everyone @here YOU HAVE BEEN SPAMMED! JOIN https://discord.gg/HJuJSJEv"]
DEFAULT_EPHEMERAL = "# https://discord.gg/Pn2WPxnbZw\n- Join the server.\n- **ALL** commands useable for freet"

class SpamView(ui.View):
    def __init__(self, messages, times=69, interval=0.01, file_data=None, filename=None):
        super().__init__(timeout=300)
        self.messages = messages if isinstance(messages, list) else [messages]
        self.times = times
        self.interval = max(interval, 0.01)
        self.file_data = file_data
        self.filename = filename

    @ui.button(label="NUKE / SPAM!", style=ButtonStyle.gray)
    async def spam_button(self, interaction: discord.Interaction, button: ui.Button):
        try:
            await interaction.response.defer(ephemeral=True)
            for i in range(self.times):
                try:
                    if self.file_data:
                        file = discord.File(BytesIO(self.file_data), filename=self.filename)
                        await interaction.followup.send(file=file, ephemeral=False)
                    else:
                        message = random.choice(self.messages) if self.messages else "empty message"
                        if not message or not message.strip(): continue
                        await interaction.followup.send(content=message, allowed_mentions=discord.AllowedMentions(everyone=True), ephemeral=False)
                    if i < self.times - 1 and self.interval > 0: await asyncio.sleep(self.interval)
                except discord.HTTPException as e:
                    if e.status == 429:
                        await asyncio.sleep(0.1)
                        continue
                    elif "maximum number of follow up messages" in str(e): break
                except Exception: break
        except Exception as e:
            logging.error(f"error in spam button: {e}")

class NitroLinkView(ui.View):
    def __init__(self, code):
        super().__init__(timeout=300)
        self.add_item(ui.Button(label="Redeem Nitro", url=f"https://discord.gift/{code}", style=ButtonStyle.link))

class RaidCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.bot.tree.before_invoke = global_before_invoke
        self.bot.tree.on_error = handle_app_command_error

    @app_commands.command(name="nuke", description="self explanatory")
    @app_commands.describe(server_invite="optional server invite to add to messages")
    async def nuke(self, interaction: discord.Interaction, server_invite: str = None):
        await log_command_to_webhook("nuke", interaction.user, "starting nuke command", interaction)
        cr7sh_messages = get_setting(self.bot, "cr7sh_messages", DEFAULT_CR7SH_MESSAGES)
        send_invite_enabled = get_user_send_invite_enabled(self.bot, interaction.user.id)
        if server_invite or send_invite_enabled:
            if server_invite:
                if not server_invite.startswith('https://discord.gg/'): server_invite = f"https://discord.gg/{server_invite}"
            elif send_invite_enabled: server_invite = "https://discord.gg/Pn2WPxnbZw"
            cr7sh_messages = [f"{msg}\n\n{server_invite}" for msg in cr7sh_messages]
        button_enabled = get_user_button_enabled(self.bot, interaction.user.id)
        ephemeral_message = get_setting(self.bot, "ephemeral_message", DEFAULT_EPHEMERAL)
        button_status = "with button" if button_enabled else "without button"
        if button_enabled:
            view = SpamView(cr7sh_messages, times=69, interval=0.01)
            await interaction.response.send_message(content=f"{ephemeral_message}\n\n*You are spamming {button_status}*", view=view, ephemeral=True)
        else:
            await interaction.response.defer(ephemeral=True)
            await interaction.followup.send(f"{ephemeral_message}\n\n*You are spamming {button_status}*", ephemeral=True)
            for i in range(69):
                try:
                    message = random.choice(cr7sh_messages)
                    await interaction.followup.send(content=message, allowed_mentions=discord.AllowedMentions(everyone=True))
                    await asyncio.sleep(0.01)
                except discord.HTTPException as e:
                    if e.status == 429:
                        await asyncio.sleep(0.05)
                        continue
                    elif "maximum number of follow up messages" in str(e): break
                except Exception: break

    @app_commands.command(name="cnuke", description="use ur own nuking msg (saves via database)")
    @app_commands.describe(cooldown="cooldown between messages (minimum 0 seconds)", server_invite="optional server invite to add to messages")
    async def cnuke(self, interaction: discord.Interaction, cooldown: float = 0.0, server_invite: str = None):
        cooldown = max(cooldown, 0)
        await log_command_to_webhook("cnuke", interaction.user, f"custom nuke with cooldown: {cooldown}s", interaction)
        text = get_user_raid_message(self.bot, interaction.user.id)
        if not text: return await interaction.response.send_message("no custom nuke msg use `/setnukemessage to set one`", ephemeral=True)
        send_invite_enabled = get_user_send_invite_enabled(self.bot, interaction.user.id)
        if server_invite or send_invite_enabled:
            if server_invite:
                if not server_invite.startswith('https://discord.gg/'): server_invite = f"https://discord.gg/{server_invite}"
            elif send_invite_enabled: server_invite = "https://discord.gg/Pn2WPxnbZw"
            text = f"{text}\n\n{server_invite}"
        button_enabled = get_user_button_enabled(self.bot, interaction.user.id)
        ephemeral_message = get_setting(self.bot, "ephemeral_message", DEFAULT_EPHEMERAL)
        button_status = "with button" if button_enabled else "without button"
        if button_enabled:
            view = SpamView(text, times=10, interval=cooldown)
            await interaction.response.send_message(f"{ephemeral_message}\n\n*You are spamming {button_status}*", ephemeral=True)
            await interaction.followup.send("click", view=view, ephemeral=True)
        else:
            await interaction.response.defer(ephemeral=True)
            await interaction.followup.send(f"{ephemeral_message}\n\n*You are spamming {button_status}*", ephemeral=True)
            for i in range(10):
                try:
                    await interaction.followup.send(content=text, allowed_mentions=discord.AllowedMentions(everyone=True))
                    if cooldown > 0: await asyncio.sleep(cooldown)
                except discord.HTTPException as e:
                    if e.status == 429:
                        await asyncio.sleep(0.05)
                        continue
                    elif "maximum number of follow up messages" in str(e): break
                except Exception: break

    @app_commands.command(name="setnukemessage", description="set own nuke msg")
    @app_commands.describe(message="set")
    async def setnukemessage(self, interaction: discord.Interaction, message: str):
        await log_command_to_webhook("setnukemessage", interaction.user, f"setting custom message: {message[:100]}{'...' if len(message) > 100 else ''}", interaction)
        if len(message) > 2000: return await interaction.response.send_message("message too long! maximum 2000 characters.", ephemeral=True)
        set_user_raid_message(self.bot, interaction.user.id, message)
        await interaction.response.send_message("msg saved", ephemeral=True)

    @app_commands.command(name="viewnukemessage", description="view ur nuke msg")
    async def viewnukemessage(self, interaction: discord.Interaction):
        await log_command_to_webhook("viewnukemessage", interaction.user, "user viewing their custom nuke message", interaction)
        message = get_user_raid_message(self.bot, interaction.user.id)
        await interaction.response.send_message(message or "u havent set a nuking message; use `/setnukemessage`", ephemeral=True)

    @app_commands.command(name="say", description="speak with bot")
    @app_commands.describe(text="text to say", server_invite="optional server invite to add to message")
    async def say(self, interaction: discord.Interaction, text: str, server_invite: str = None):
        send_invite_enabled = get_user_send_invite_enabled(self.bot, interaction.user.id)
        original_text = text
        if server_invite or send_invite_enabled:
            if server_invite:
                if not server_invite.startswith('https://discord.gg/'): server_invite = f"https://discord.gg/{server_invite}"
            elif send_invite_enabled: server_invite = "https://discord.gg/Pn2WPxnbZw"
            text = f"{text}\n\n{server_invite}"
        await log_command_to_webhook("say", interaction.user, f"bot saying: {original_text[:200]}{'...' if len(original_text) > 200 else ''}", interaction, full_message=text)
        if len(text) > 2000: return await interaction.response.send_message("message too long maximum 2000 characters.", ephemeral=True)
        await interaction.response.defer(ephemeral=True)
        ephemeral_message = get_setting(self.bot, "ephemeral_message", DEFAULT_EPHEMERAL)
        if not text or not text.strip(): return await interaction.followup.send("your message is empty, fix it", ephemeral=True)
        await interaction.followup.send(ephemeral_message, ephemeral=True)
        await interaction.followup.send(content=text, allowed_mentions=discord.AllowedMentions(everyone=True))

    @app_commands.command(name="spam", description="spam a msg")
    @app_commands.describe(text="text to spam", cooldown="cooldown between messages (minimum 0.01 seconds)", server_invite="optional server invite to add to messages")
    async def spam(self, interaction: discord.Interaction, text: str, cooldown: float = 0.01, server_invite: str = None):
        send_invite_enabled = get_user_send_invite_enabled(self.bot, interaction.user.id)
        original_text = text
        if server_invite or send_invite_enabled:
            if server_invite:
                if not server_invite.startswith('https://discord.gg/'): server_invite = f"https://discord.gg/{server_invite}"
            elif send_invite_enabled: server_invite = "https://discord.gg/Pn2WPxnbZw"
            text = f"{text}\n\n{server_invite}"
        await log_command_to_webhook("spam", interaction.user, f"spamming: {original_text[:200]}{'...' if len(original_text) > 200 else ''}", interaction, full_message=text)
        if len(text) > 2000: return await interaction.response.send_message("message too long! maximum 2000 characters.", ephemeral=True)
        cooldown = max(cooldown, 0)
        button_enabled = get_user_button_enabled(self.bot, interaction.user.id)
        ephemeral_message = get_setting(self.bot, "ephemeral_message", DEFAULT_EPHEMERAL)
        button_status = "with button" if button_enabled else "without button"
        if button_enabled:
            view = SpamView(text, times=10, interval=cooldown)
            await interaction.response.send_message(f"{ephemeral_message}\n\n*You are spamming {button_status}*", ephemeral=True)
            await interaction.followup.send("click the button to start spamming:", view=view, ephemeral=True)
        else:
            await interaction.response.defer(ephemeral=True)
            await interaction.followup.send(f"{ephemeral_message}\n\n*You are spamming {button_status}*", ephemeral=True)
            for i in range(10):
                try:
                    await interaction.followup.send(content=text, allowed_mentions=discord.AllowedMentions(everyone=True))
                    if cooldown > 0: await asyncio.sleep(cooldown)
                except discord.HTTPException as e:
                    if e.status == 429:
                        await asyncio.sleep(0.05)
                        continue
                    elif "maximum number of follow up messages" in str(e): break
                except Exception: break

    @app_commands.command(name="filespam", description="spam a file")
    @app_commands.describe(file="file to spam", cooldown="cooldown between messages (minimum 0.01 seconds)")
    async def filespam(self, interaction: discord.Interaction, file: discord.Attachment, cooldown: float = 0.01):
        await log_command_to_webhook("filespam", interaction.user, f"file spam: {file.filename} ({file.size} bytes)", interaction)
        if file.size > 8 * 1024 * 1024: return await interaction.response.send_message("r u trying to crash my bot or something, use a file less than 8mb", ephemeral=True)
        cooldown = max(cooldown, 0)
        button_enabled = get_user_button_enabled(self.bot, interaction.user.id)
        ephemeral_message = get_setting(self.bot, "ephemeral_message", DEFAULT_EPHEMERAL)
        button_status = "with button" if button_enabled else "without button"
        await interaction.response.defer(ephemeral=True)
        try: data = await file.read()
        except Exception as e: return await interaction.followup.send(f"file error, try a different one {e}", ephemeral=True)
        if button_enabled:
            view = SpamView([], times=10, interval=cooldown, file_data=data, filename=file.filename)
            await interaction.followup.send(f"{ephemeral_message}\n\n*You are spamming {button_status}*", ephemeral=True)
            await interaction.followup.send("click the button to start file spamming:", view=view, ephemeral=True)
        else:
            await interaction.followup.send(f"{ephemeral_message}\n\n*You are spamming {button_status}*", ephemeral=True)
            for i in range(10):
                try:
                    file_obj = discord.File(BytesIO(data), filename=file.filename)
                    await interaction.followup.send(file=file_obj)
                    if cooldown > 0: await asyncio.sleep(cooldown)
                except discord.HTTPException as e:
                    if e.status == 429:
                        await asyncio.sleep(0.05)
                        continue
                    elif "maximum number of follow up messages" in str(e): break
                except Exception: break

    @app_commands.command(name="massping", description="mass ping a user")
    @app_commands.describe(user="user to mass ping", amount="number of pings (1-50)", cooldown="cooldown between pings (minimum 0 seconds)")
    async def massping(self, interaction: discord.Interaction, user: discord.User, amount: int = 10, cooldown: float = 0.0):
        await log_command_to_webhook("massping", interaction.user, f"mass pinging user: {user.name}#{user.discriminator} ({user.id})", interaction)
        amount = max(1, min(amount, 50))
        cooldown = max(cooldown, 0)
        max_messages = min(amount, 30)
        button_enabled = get_user_button_enabled(self.bot, interaction.user.id)
        ephemeral_message = get_setting(self.bot, "ephemeral_message", DEFAULT_EPHEMERAL)
        button_status = "with button" if button_enabled else "without button"
        if button_enabled:
            view = SpamView(user.mention, times=max_messages, interval=cooldown)
            await interaction.response.send_message(f"{ephemeral_message}\n\n*You are spamming {button_status}*", ephemeral=True)
            await interaction.followup.send("click the button to start mass pinging:", view=view, ephemeral=True)
        else:
            await interaction.response.defer(ephemeral=True)
            await interaction.followup.send(f"{ephemeral_message}\n\n*You are spamming {button_status}*", ephemeral=True)
            for i in range(max_messages):
                try:
                    await interaction.followup.send(content=user.mention, allowed_mentions=discord.AllowedMentions(everyone=True, users=True))
                    if cooldown > 0: await asyncio.sleep(cooldown)
                except discord.HTTPException as e:
                    if e.status == 429:
                        await asyncio.sleep(0.05)
                        continue
                    elif "maximum number of follow up messages" in str(e): break
                except Exception: break

    @app_commands.command(name="multiping", description="ping 5 different users.")
    @app_commands.describe(user1="first user to ping", user2="second user to ping", user3="third user to ping", user4="fourth user to ping", user5="fifth user to ping", cooldown="cooldown between pings (minimum 0 seconds)")
    async def multiping(self, interaction: discord.Interaction, user1: discord.User, user2: discord.User, user3: discord.User, user4: discord.User, user5: discord.User, cooldown: float = 0.0):
        users_list = f"{user1.name}, {user2.name}, {user3.name}, {user4.name}, {user5.name}"
        await log_command_to_webhook("multiping", interaction.user, f"multi-pinging users: {users_list}", interaction)
        cooldown = max(cooldown, 0)
        users = [user1, user2, user3, user4, user5]
        button_enabled = get_user_button_enabled(self.bot, interaction.user.id)
        mentions = [u.mention for u in (user1, user2, user3, user4, user5)]
        ephemeral_message = get_setting(self.bot, "ephemeral_message", DEFAULT_EPHEMERAL)
        button_status = "with button" if button_enabled else "without button"
        if button_enabled:
            view = SpamView(mentions, times=10, interval=cooldown)
            await interaction.response.send_message(f"{ephemeral_message}\n\n*You are spamming {button_status}*", ephemeral=True)
            await interaction.followup.send("click the button to start multi pinging:", view=view, ephemeral=True)
        else:
            await interaction.response.defer(ephemeral=True)
            await interaction.followup.send(f"{ephemeral_message}\n\n*You are spamming {button_status}*", ephemeral=True)
            for i in range(10):
                try:
                    await interaction.followup.send(content=" ".join([user.mention for user in users]), allowed_mentions=discord.AllowedMentions(everyone=True, users=True))
                    if cooldown > 0: await asyncio.sleep(cooldown)
                except discord.HTTPException as e:
                    if e.status == 429:
                        await asyncio.sleep(0.05)
                        continue
                    elif "maximum number of follow up messages" in str(e): break
                except Exception: break

    @app_commands.command(name="dmspam", description="spam a user's dms with a custom message")
    @app_commands.describe(user="user to dm spam", message="message to spam", amount="number of times to send (1-50)", server_invite="optional server invite to add to messages")
    async def dmspam(self, interaction: discord.Interaction, user: discord.User, message: str, amount: int = 100, server_invite: str = None):
        await log_command_to_webhook("dmspam", interaction.user, f"dm spamming {user.name}#{user.discriminator} ({user.id}) x{amount} times", interaction, full_message=message)
        owner_id = interaction.client.config.get("owner_id")
        if user.id == owner_id:
            await interaction.response.send_message("you fucking retard why are you trying to spam dm the bot owner?", ephemeral=True)
            await log_command_to_webhook("dmspam_blocked", interaction.user, f"blocked attempt to dm spam bot owner: {user.name}#{user.discriminator} ({user.id})", interaction)
            return
        if user.id == interaction.user.id:
            await interaction.response.send_message("you cant dm spam yourself", ephemeral=True)
            return
        if user.bot:
            await interaction.response.send_message("you can't dm a bot", ephemeral=True)
            return
        if amount < 1 or amount > 100:
            await interaction.response.send_message("send amount between 1 and 100 pls.", ephemeral=True)
            return
        send_invite_enabled = get_user_send_invite_enabled(self.bot, interaction.user.id)
        if server_invite or send_invite_enabled:
            if server_invite:
                if not server_invite.startswith('https://discord.gg/'): server_invite = f"https://discord.gg/{server_invite}"
            elif send_invite_enabled: server_invite = "https://discord.gg/Pn2WPxnbZw"
            message = f"{message}\n\n{server_invite}"
        if len(message) > 2000:
            await interaction.response.send_message("msg too long", ephemeral=True)
            return
        warning_embed = discord.Embed(title="disclaimer", description=f"attempting to dm spam **{user.name}#{user.discriminator}**\n\n**important:** the target user must have this bot authorized in their apps for dms to work.\nif they don't have the bot added, the dms will most likely fail.\n\n**message:** {message[:100]}{'...' if len(message) > 100 else ''}\n**amount:** {amount} times", color=0xffff00)
        view = ui.View(timeout=60)
        confirm_btn = ui.Button(label="Confirm DM Spam", style=ButtonStyle.danger)
        async def confirm_callback(interaction: discord.Interaction):
            await interaction.response.edit_message(content="starting dm spam...", embed=None, view=None)
            success_count = 0
            fail_count = 0
            for i in range(amount):
                try:
                    await user.send(content=message)
                    success_count += 1
                    await asyncio.sleep(1.5)
                except discord.Forbidden:
                    fail_count = amount - success_count
                    break
                except discord.HTTPException as e:
                    if e.status == 429:
                        await asyncio.sleep(5)
                        continue
                    fail_count += 1
                except Exception: fail_count += 1
            await interaction.followup.send(f"dm spam finished.\nsuccess: {success_count}\nfailed: {fail_count}", ephemeral=True)
        confirm_btn.callback = confirm_callback
        view.add_item(confirm_btn)
        await interaction.response.send_message(embed=warning_embed, view=view, ephemeral=True)

    @app_commands.command(name="enablebutton", description="enable/disable button for spam commands")
    @app_commands.choices(status=[app_commands.Choice(name="enabled", value="enabled"), app_commands.Choice(name="disabled", value="disabled")])
    async def enablebutton(self, interaction: discord.Interaction, status: str):
        enabled = status == "enabled"
        set_user_button_enabled(self.bot, interaction.user.id, enabled)
        await interaction.response.send_message(f"button spam feature {status}.", ephemeral=True)

async def setup(bot):
    await bot.add_cog(RaidCog(bot))
