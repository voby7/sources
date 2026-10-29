const { Events } = require('discord.js');
const { serverWhitelist, bannedUsers } = require('../config.json');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (bannedUsers.includes(interaction.user.id)) {
			if (interaction.isChatInputCommand()) {
				client.logger.info('Banned Person', `${client.user.id} attempted to use a command while banned, laugh at this nigga 😹`);
				await interaction.reply({ content: 'You have been **BANNED** from this bot for inappropriate behavior. Appeal here: https://discord.gg/jt3AFXfDs6' });
			}
			return;
		}
		if (serverWhitelist.includes(interaction.guildId)) return;
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			}
			catch (error) {
				console.error(error);
			}
		}
	},
};
