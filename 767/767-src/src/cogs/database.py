import discord
from discord import app_commands
from discord.ext import commands
import pickle
from datetime import datetime
from .utils import log_command_to_webhook

class DatabaseCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="dbstats", description="Show database statistics")
    async def dbstats(self, interaction: discord.Interaction):
        if interaction.user.id != self.bot.config.get("owner_id"):
            await interaction.response.send_message("Only the bot owner can use this command.", ephemeral=True)
            return
            
        stats = {}
        with self.bot.db_env.begin() as txn:
            stats['command_logs'] = txn.stat(db=self.bot.command_logs_db)['entries']
            stats['message_logs'] = txn.stat(db=self.bot.message_logs_db)['entries']
            stats['user_activity'] = txn.stat(db=self.bot.user_activity_db)['entries']
            stats['error_logs'] = txn.stat(db=self.bot.error_logs_db)['entries']
            stats['settings'] = txn.stat(db=self.bot.settings_db)['entries']
            stats['blocked_users'] = txn.stat(db=self.bot.blocked_users_db)['entries']
            stats['blocked_servers'] = txn.stat(db=self.bot.blocked_servers_db)['entries']
            stats['raid_messages'] = txn.stat(db=self.bot.raid_messages_db)['entries']

        embed = discord.Embed(title="Database Statistics", color=0x00ff00, timestamp=datetime.now())
        embed.add_field(name="Commands Logged", value=f"{stats['command_logs']:,}", inline=True)
        embed.add_field(name="Messages Logged", value=f"{stats['message_logs']:,}", inline=True)
        embed.add_field(name="User Activities", value=f"{stats['user_activity']:,}", inline=True)
        embed.add_field(name="Error Logs", value=f"{stats['error_logs']:,}", inline=True)
        embed.add_field(name="Settings", value=f"{stats['settings']:,}", inline=True)
        embed.add_field(name="Blocked Users", value=f"{stats['blocked_users']:,}", inline=True)
        embed.add_field(name="Blocked Servers", value=f"{stats['blocked_servers']:,}", inline=True)
        embed.add_field(name="Raid Messages", value=f"{stats['raid_messages']:,}", inline=True)
        
        total_entries = sum(stats.values())
        embed.add_field(name="Total Entries", value=f"{total_entries:,}", inline=False)
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="dbrecent", description="Show recent database entries")
    @app_commands.describe(db_type="Type of database to query", limit="Number of entries to show")
    @app_commands.choices(db_type=[
        app_commands.Choice(name="Command Logs", value="commands"),
        app_commands.Choice(name="Message Logs", value="messages"),
        app_commands.Choice(name="User Activity", value="activity"),
        app_commands.Choice(name="Error Logs", value="errors")
    ])
    async def dbrecent(self, interaction: discord.Interaction, db_type: str, limit: int = 10):
        if interaction.user.id != self.bot.config.get("owner_id"):
            await interaction.response.send_message("Only the bot owner can use this command.", ephemeral=True)
            return
        limit = min(limit, 20)
        entries = []
        with self.bot.db_env.begin() as txn:
            if db_type == "commands": db = self.bot.command_logs_db
            elif db_type == "messages": db = self.bot.message_logs_db
            elif db_type == "activity": db = self.bot.user_activity_db
            elif db_type == "errors": db = self.bot.error_logs_db
            else: return await interaction.response.send_message("Invalid database type", ephemeral=True)
                
            cursor = txn.cursor(db=db)
            if cursor.last():
                count = 0
                while count < limit:
                    try:
                        key = cursor.key().decode()
                        value = pickle.loads(cursor.value())
                        entries.append((key, value))
                        count += 1
                        if not cursor.prev(): break
                    except: continue
        
        if not entries: return await interaction.response.send_message("No entries found", ephemeral=True)
        embed = discord.Embed(title=f"Recent {db_type.title()} Entries", color=0x0099ff, timestamp=datetime.now())
        for i, (key, data) in enumerate(entries[:10]):
            if isinstance(data, dict):
                timestamp = data.get('timestamp', 0)
                time_str = datetime.fromtimestamp(timestamp).strftime('%H:%M:%S') if timestamp else 'Unknown'
                if db_type == "commands": value = f"**{data.get('command', 'Unknown')}** by {data.get('user_name', 'Unknown')}\nServer: {data.get('guild_name', 'DM')}\nTime: {time_str}"
                elif db_type == "messages":
                    content = data.get('content', '')[:50] + ('...' if len(data.get('content', '')) > 50 else '')
                    value = f"**{data.get('message_type', 'Unknown')}**: {content}\nBy: {data.get('user_name', 'Unknown')}\nTime: {time_str}"
                elif db_type == "activity": value = f"**{data.get('activity_type', 'Unknown')}**\nUser: {data.get('user_name', 'Unknown')}\nTime: {time_str}"
                elif db_type == "errors": value = f"**{data.get('error_type', 'Unknown')}**\n{data.get('error_message', '')[:100]}\nTime: {time_str}"
                embed.add_field(name=f"Entry {i+1}", value=value, inline=False)
        await interaction.response.send_message(embed=embed, ephemeral=True)

async def setup(bot):
    await bot.add_cog(DatabaseCog(bot))
