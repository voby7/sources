import discord
from discord.ext import commands
from discord import app_commands, ui
from .utils import log_command_to_webhook

class HelpSelect(ui.Select):
    def __init__(self):
        options = [
            discord.SelectOption(label="nuke commands", description="spam and raid functionality", value="nuke"),
            discord.SelectOption(label="fake commands", description="harmless trolling commands", value="fake"),
            discord.SelectOption(label="admin commands", description="owner-only administrative commands", value="admin"),
            discord.SelectOption(label="all commands", description="complete command list", value="all")
        ]
        super().__init__(placeholder="Choose a category...", options=options)

    async def callback(self, interaction: discord.Interaction):
        embeds = {
            "nuke": discord.Embed(title="nuke commands", description="spam functionality", color=0xff4500).add_field(name="commands", value="`/nuke` `/cnuke` `/setnukemessage` `/viewnukemessage` `/say` `/spam` `/filespam` `/massping` `/multiping` `/dmspam` `/dmeveryone` `/ghostping` `/enablebutton`"),
            "fake": discord.Embed(title="fake commands", description="harmless commands", color=0x7289da).add_field(name="commands", value="`/fakeblame` `/fakeuserip` `/fakeddos` `/faketoken` `/fakenitro` `/fakecrash` `/fakenuke` `/fakeserverdelete` `/fakeraid` `/fakeupdate` `/fakevirus` `/fakeping` `/fakereport`"),
            "admin": discord.Embed(title="admin commands", description="owner-only commands", color=0x00ff00).add_field(name="commands", value="`/blockuser` `/unblockuser` `/blockserver` `/unblockserver` `/setnuke` `/setephemeral` `/set`"),
            "all": discord.Embed(title="all commands", description="complete list", color=0x9932cc).add_field(name="summary", value="total commands: 38")
        }
        embed = embeds.get(self.values[0])
        if embed:
            embed.set_thumbnail(url=interaction.client.user.display_avatar.url)
            await interaction.response.edit_message(embed=embed, view=self.view)

class HelpView(ui.View):
    def __init__(self):
        super().__init__(timeout=300)
        self.add_item(HelpSelect())

    @ui.button(label="close", style=discord.ButtonStyle.danger)
    async def close_button(self, interaction: discord.Interaction, button: ui.Button):
        await interaction.response.edit_message(content="closed", embed=None, view=None)

class HelpCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="help", description="Show all available commands")
    async def help_cmd(self, interaction: discord.Interaction):
        await log_command_to_webhook("help", interaction.user, "User requested help menu", interaction)
        embed = discord.Embed(title="raider help", description="select a category below", color=0x7289da)
        embed.set_thumbnail(url=self.bot.user.display_avatar.url)
        await interaction.response.send_message(embed=embed, view=HelpView(), ephemeral=True)

async def setup(bot):
    await bot.add_cog(HelpCog(bot))
