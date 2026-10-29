const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		client.logger.success('Bot started', `${client.user.tag} is online.\nBot link [here](https://discord.com/oauth2/authorize?client_id=${client.user.id}).`);
	},
};
