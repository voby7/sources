import os
import json
import logging
import asyncio
import discord
from discord.ext import commands
from discord import app_commands
import lmdb
import pickle
import yaml
from dotenv import load_dotenv
from collections import defaultdict
import uvloop
asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

def load_config():
    config_path = "config.yaml"
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            return yaml.safe_load(f)
    return {}

config_data = load_config()

TOKEN = os.getenv("DISCORD_BOT_TOKEN") or config_data.get("token")
WEBHOOK_URL = os.getenv("WEBHOOK_URL") or config_data.get("webhook_url", "")
OWNER_ID = int(os.getenv("OWNER_ID")) if os.getenv("OWNER_ID") else config_data.get("owner_id")
REQUIRED_SERVER_ID = int(os.getenv("REQUIRED_SERVER_ID")) if os.getenv("REQUIRED_SERVER_ID") else config_data.get("required_server_id")

config = {
    "token": TOKEN,
    "webhook_url": WEBHOOK_URL,
    "owner_id": OWNER_ID,
    "required_server_id": REQUIRED_SERVER_ID
}

if not TOKEN or not OWNER_ID:
    print("self")

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
intents.guilds = True

class Bot(commands.Bot):
    def __init__(self):
        super().__init__(command_prefix="!", intents=intents)
        self.config = config
        self.setup_database()

    def setup_database(self):
        self.db_env = lmdb.open("bot_data.lmdb", max_dbs=10, map_size=1024*1024*500)

        with self.db_env.begin(write=True) as txn:
            self.raid_messages_db = self.db_env.open_db(b'raid_messages', txn=txn)
            self.settings_db = self.db_env.open_db(b'settings', txn=txn)
            self.blocked_users_db = self.db_env.open_db(b'blocked_users', txn=txn)
            self.blocked_servers_db = self.db_env.open_db(b'blocked_servers', txn=txn)
            self.command_logs_db = self.db_env.open_db(b'command_logs', txn=txn)
            self.message_logs_db = self.db_env.open_db(b'message_logs', txn=txn)
            self.user_activity_db = self.db_env.open_db(b'user_activity', txn=txn)
            self.server_stats_db = self.db_env.open_db(b'server_stats', txn=txn)
            self.error_logs_db = self.db_env.open_db(b'error_logs', txn=txn)

    async def setup_hook(self):
        from cogs.utils import global_before_invoke, handle_app_command_error
        self.tree.interaction_check = global_before_invoke
        self.tree.on_error = handle_app_command_error
        cogs = ['cogs.raid', 'cogs.fake_commands', 'cogs.admin', 'cogs.database']
        for cog in cogs:
            try:
                await self.load_extension(cog)
                logging.info(f"loaded {cog}")
            except Exception as e:
                logging.error(f"failed to load {cog}: {e}")

    async def on_ready(self):
        logging.info(f"{self.user} logged in")
        logging.info(f"Bot Client ID: {self.user.id}")
        try:
            synced = await self.tree.sync()
            logging.info(f"synced {len(synced)} command(s)")
        except Exception as e:
            logging.error(f"{e}")

    async def on_message(self, message):
        if message.author == self.user:
            return
        if message.content == "7!daily":
            await self.handle_daily_command(message)

    async def handle_daily_command(self, message):
        import time
        from datetime import datetime
        from collections import defaultdict
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_timestamp = int(today.timestamp())
        now_timestamp = int(time.time())
        command_counts = defaultdict(int)
        with self.db_env.begin() as txn:
            cursor = txn.cursor(db=self.command_logs_db)
            cursor.first()
            while cursor.next():
                try:
                    key = cursor.key().decode()
                    data = pickle.loads(cursor.value())
                    entry_timestamp = data.get('timestamp', 0)
                    if today_timestamp <= entry_timestamp <= now_timestamp:
                        command_name = data.get('command', 'unknown')
                        command_counts[command_name] += 1
                except:
                    continue
        if not command_counts:
            embed = discord.Embed(title="cmd usage", description="no cmds used yet", color=0x8b0000, timestamp=datetime.now())
        else:
            sorted_commands = sorted(command_counts.items(), key=lambda x: x[1], reverse=True)
            embed = discord.Embed(title="cmd usage", description=f"cmd usage for {today.strftime('%B %d, %Y')}", color=0x8b0000, timestamp=datetime.now())
            for i, (command, count) in enumerate(sorted_commands[:25]):
                if i < 20:
                    embed.add_field(name=f"/{command}", value=f"{count:,} uses", inline=True)
                elif i == 20:
                    remaining = sorted_commands[20:]
                    remaining_text = "\n".join([f"/{cmd}: {cnt}" for cmd, cnt in remaining])
                    embed.add_field(name="other cmds", value=remaining_text[:1024], inline=False)
                    break
            total_commands = sum(command_counts.values())
            unique_commands = len(command_counts)
            embed.add_field(name="summary", value=f"**total cmds:** {total_commands:,}\n**unique cmds** {unique_commands:,}", inline=False)
        embed.set_footer(text="bot.")
        embed.set_thumbnail(url=self.user.display_avatar.url)
        try:
            await message.channel.send(embed=embed)
        except discord.Forbidden:
            await message.channel.send("no perms")
        except Exception as e:
            logging.error(f"Error sending daily stats: {e}")
            await message.channel.send("An error occurred while retrieving daily statistics.")

bot = Bot()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    bot.run(TOKEN)