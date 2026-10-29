const { Events } = require('discord.js');

module.exports = {
	name: Events.GuildCreate,
	async execute(guild) {
		console.log(`Bot added to new guild: ${guild.name} (${guild.id})`);
		guild.client.logger.info(`Bot added to new guild: ${guild.name} (${guild.id}). Owned by user ID ${guild.ownerId}`);
	},
};
