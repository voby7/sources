const { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, InteractionContextType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('thug')
		.setDescription('sends you thugs!')
		.setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
		.addStringOption(option =>
			option
				.setName('text')
				.setDescription('optional text')
				.setMaxLength(1250),
		),
	async execute(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const ape = new ButtonBuilder()
			.setCustomId('button')
			.setLabel('click me')
			.setStyle(ButtonStyle.Primary);

		const response = await interaction.editReply({ content: '👇🏿', flags: MessageFlags.Ephemeral, components: [new ActionRowBuilder().addComponents(ape)], withResponse: true }).catch(console.error);
		const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_000 });
		const text = interaction.options.getString('text') ?? '';
		const thugs = interaction.client.thugs;

		collector.on('collect', async i => {
			await i.reply({ content: thugs.getSpamText(text), allowedMentions: { parse: ['roles', 'users', 'everyone'] } }).catch(console.error);
			for (let j = 0; j < 4; j++) {
				i.followUp({ content: thugs.getSpamText(text), allowedMentions: { parse: ['roles', 'users', 'everyone'] } }).catch(console.error);
			}
		});
	},
};