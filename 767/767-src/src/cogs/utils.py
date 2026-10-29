import json
import logging
import aiosonic
import discord
from discord.ext import commands
from discord import app_commands
from datetime import datetime, timedelta
import pickle

def get_setting(bot, key, default):
    with bot.db_env.begin() as txn:
        value = txn.get(key.encode(), db=bot.settings_db)
        if value: return pickle.loads(value)
        with bot.db_env.begin(write=True) as write_txn:
            write_txn.put(key.encode(), pickle.dumps(default), db=bot.settings_db)
        return default

def set_setting(bot, key, value):
    with bot.db_env.begin(write=True) as txn:
        txn.put(key.encode(), pickle.dumps(value), db=bot.settings_db)

def is_owner():
    return app_commands.check(lambda i: i.user.id == i.client.config.get("owner_id"))

def block_user(bot, user_id):
    with bot.db_env.begin(write=True) as txn:
        txn.put(str(user_id).encode(), b'blocked', db=bot.blocked_users_db)

def unblock_user(bot, user_id):
    with bot.db_env.begin(write=True) as txn:
        txn.delete(str(user_id).encode(), db=bot.blocked_users_db)

def block_server(bot, server_id):
    with bot.db_env.begin(write=True) as txn:
        txn.put(str(server_id).encode(), b'blocked', db=bot.blocked_servers_db)

def unblock_server(bot, server_id):
    with bot.db_env.begin(write=True) as txn:
        txn.delete(str(server_id).encode(), db=bot.blocked_servers_db)

def get_user_raid_message(bot, user_id):
    with bot.db_env.begin() as txn:
        value = txn.get(str(user_id).encode(), db=bot.raid_messages_db)
        return pickle.loads(value) if value else None

def set_user_raid_message(bot, user_id, message):
    with bot.db_env.begin(write=True) as txn:
        txn.put(str(user_id).encode(), pickle.dumps(message), db=bot.raid_messages_db)

def is_user_blocked(bot, user_id):
    with bot.db_env.begin() as txn:
        return txn.get(str(user_id).encode(), db=bot.blocked_users_db) is not None

def is_server_blocked(bot, server_id):
    with bot.db_env.begin() as txn:
        return txn.get(str(server_id).encode(), db=bot.blocked_servers_db) is not None

def get_user_button_enabled(bot, user_id):
    with bot.db_env.begin() as txn:
        value = txn.get(f"button_enabled_{user_id}".encode(), db=bot.settings_db)
        return pickle.loads(value) if value else True

def set_user_button_enabled(bot, user_id, enabled):
    with bot.db_env.begin(write=True) as txn:
        txn.put(f"button_enabled_{user_id}".encode(), pickle.dumps(enabled), db=bot.settings_db)

def get_user_send_invite_enabled(bot, user_id):
    with bot.db_env.begin() as txn:
        value = txn.get(f"send_invite_{user_id}".encode(), db=bot.settings_db)
        return pickle.loads(value) if value is not None else False

def set_user_send_invite_enabled(bot, user_id, enabled):
    with bot.db_env.begin(write=True) as txn:
        txn.put(f"send_invite_{user_id}".encode(), pickle.dumps(enabled), db=bot.settings_db)

def log_command_to_db(bot, command_name, user, guild, channel, full_message=None, extra_data=None):
    import time
    timestamp = int(time.time())
    log_entry = {'timestamp': timestamp, 'command': command_name, 'user_id': user.id, 'user_name': str(user), 'guild_id': guild.id if guild else None, 'guild_name': guild.name if guild else None, 'channel_id': channel.id if channel else None, 'channel_name': getattr(channel, 'name', str(channel.type)) if channel else None, 'full_message': full_message, 'extra_data': extra_data}
    key = f"{timestamp}_{user.id}_{command_name}".encode()
    value = pickle.dumps(log_entry)
    with bot.db_env.begin(write=True) as txn: txn.put(key, value, db=bot.command_logs_db)

def log_message_to_db(bot, message_content, user, guild, channel, message_type="sent"):
    import time
    timestamp = int(time.time())
    log_entry = {'timestamp': timestamp, 'message_type': message_type, 'content': message_content, 'user_id': user.id, 'user_name': str(user), 'guild_id': guild.id if guild else None, 'guild_name': guild.name if guild else None, 'channel_id': channel.id if channel else None, 'channel_name': getattr(channel, 'name', str(channel.type)) if channel else None}
    key = f"{timestamp}_{user.id}_{message_type}".encode()
    value = pickle.dumps(log_entry)
    with bot.db_env.begin(write=True) as txn: txn.put(key, value, db=bot.message_logs_db)

def log_user_activity(bot, user, activity_type, details=None):
    import time
    timestamp = int(time.time())
    log_entry = {'timestamp': timestamp, 'user_id': user.id, 'user_name': str(user), 'activity_type': activity_type, 'details': details}
    key = f"{timestamp}_{user.id}_{activity_type}".encode()
    value = pickle.dumps(log_entry)
    with bot.db_env.begin(write=True) as txn: txn.put(key, value, db=bot.user_activity_db)

def log_error_to_db(bot, error_type, error_message, user=None, guild=None, extra_info=None):
    import time
    timestamp = int(time.time())
    log_entry = {'timestamp': timestamp, 'error_type': error_type, 'error_message': str(error_message), 'user_id': user.id if user else None, 'user_name': str(user) if user else None, 'guild_id': guild.id if guild else None, 'guild_name': guild.name if guild else None, 'extra_info': extra_info}
    key = f"{timestamp}_{error_type}".encode()
    value = pickle.dumps(log_entry)
    with bot.db_env.begin(write=True) as txn: txn.put(key, value, db=bot.error_logs_db)

async def log_command_to_webhook(cmd, user, info, interaction, full_message=None):
    log_command_to_db(interaction.client, cmd, user, interaction.guild, interaction.channel, full_message, info)
    if full_message: log_message_to_db(interaction.client, full_message, user, interaction.guild, interaction.channel, "command_message")
    webhook_url = interaction.client.config.get("webhook_url")
    if not webhook_url: return
    try:
        embed = discord.Embed(title=f"command: {cmd}", color=0x00ff00, timestamp=datetime.utcnow())
        embed.add_field(name="user", value=f"{user.mention} ({user.id})", inline=True)
        if user.display_avatar: embed.set_thumbnail(url=user.display_avatar.url)
        embed.add_field(name="server", value=interaction.guild.name if interaction.guild else "DM", inline=True)
        if info: embed.add_field(name="details", value=info[:1024], inline=False)
        async with aiosonic.HTTPClient() as client:
            await client.post(webhook_url, json={"embeds": [embed.to_dict()]})
    except Exception as e: logging.error(f"webhook fail: {e}")

async def global_before_invoke(interaction: discord.Interaction):
    owner_id = interaction.client.config.get("owner_id")
    if interaction.user.id == owner_id:
        if is_user_blocked(interaction.client, interaction.user.id):
            await interaction.response.send_message("bot cmd failed", ephemeral=True)
            return False
        return True
    if is_user_blocked(interaction.client, interaction.user.id):
        await interaction.response.send_message("bot cmd failed", ephemeral=True)
        return False
    if interaction.guild and is_server_blocked(interaction.client, interaction.guild.id):
        await interaction.response.send_message("bot cmd failed", ephemeral=True)
        return False
    return True

async def handle_app_command_error(interaction: discord.Interaction, error: app_commands.AppCommandError):
    log_error_to_db(interaction.client, type(error).__name__, str(error), interaction.user, interaction.guild)
    message = "bot cmd failed"
    if not interaction.response.is_done(): await interaction.response.send_message(message, ephemeral=True)
    else: await interaction.followup.send(message, ephemeral=True)
