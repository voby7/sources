const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stash')
		.setDescription('access your stash')
		.setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
		.addBooleanOption(option =>
			option
				.setName('ephemeral')
				.setDescription('should be ephemeral or not, true by default')),
	async execute(interaction) {
		const flags = interaction.options.getBoolean('ephemeral') ?? true ? MessageFlags.Ephemeral : 0;

		const catboxLink = interaction.client.thugs.getCatboxLink();
		if (catboxLink !== null) {
			interaction.reply({ content: `You can get the current thug stash here: ${catboxLink}\nConsider crediting if you're going to use this in your own stuff !!`, flags: flags }).catch(console.error);
		}
		else {
			interaction.reply({ content: 'Link to the stash is currently not available, ask for it in https://discord.gg/qgqn3xeuMn !!', flags: flags }).catch(console.error);
		}
	},
};