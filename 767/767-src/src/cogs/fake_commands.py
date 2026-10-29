import discord
from discord.ext import commands
from discord import app_commands
import random
import asyncio
from .utils import log_command_to_webhook, get_setting

def gen_fake_token():
    prefixes = ['MTM', 'MTE', 'MTI', 'MTA', 'MTU', 'MTQ', 'MTc', 'MTg']
    chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'
    p1 = random.choice(prefixes) + ''.join(random.choice(chars) for _ in range(21))
    p2 = ''.join(random.choice(chars) for _ in range(6))
    p3 = ''.join(random.choice(chars) for _ in range(27))
    return f"{p1}.{p2}.{p3}"

def gen_fake_ip():
    return ".".join(str(random.randint(1, 254)) for _ in range(4))

class FakeCommandsCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    async def _log_fake_command(self, interaction, command_name, target_info=""):
        await log_command_to_webhook(command_name, interaction.user, f"FAKE COMMAND: {target_info}", interaction)

    @app_commands.command(name="fakeblame", description="fake blame a user")
    async def fakeblame(self, interaction: discord.Interaction, user: discord.User):
        await log_command_to_webhook("fakeblame", interaction.user, f"Fake blaming user: {user.name}", interaction)
        await interaction.response.defer(ephemeral=True)
        msg = f"{user.mention} Raid successfully completed!"
        await interaction.followup.send(msg)

    @app_commands.command(name="faketoken", description="generate a fake discord token")
    async def faketoken(self, interaction: discord.Interaction, user: discord.User):
        await interaction.response.defer(ephemeral=True)
        await self._log_fake_command(interaction, "faketoken", f"Generating fake token for: {user.name}")
        embed = discord.Embed(title="token extracted", description=f"**target:** {user.mention}\n**token:** `{gen_fake_token()}`", color=0x7289da)
        await interaction.followup.send(embed=embed)

    @app_commands.command(name="fakenitro", description="generate a fake nitro gift code")
    async def fakenitro(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)
        await self._log_fake_command(interaction, "fakenitro", "Generating fake Nitro code")
        code = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', k=16))
        embed = discord.Embed(title="Discord Nitro Gift", description=f"Code: `{code}`", color=0x7289da)
        view = discord.ui.View()
        view.add_item(discord.ui.Button(label="Redeem Nitro", url=f"https://discord.gift/{code}", style=discord.ButtonStyle.link))
        await interaction.followup.send(embed=embed, view=view)

async def setup(bot):
    await bot.add_cog(FakeCommandsCog(bot))
