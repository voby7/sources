const { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, InteractionContextType, TextInputStyle, ModalBuilder, TextInputBuilder, LabelBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('says something')
		.setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
	async execute(interaction) {
		const modal = new ModalBuilder().setCustomId(`saymodal_${interaction.id}`).setTitle('enter text').addLabelComponents(
			new LabelBuilder()
				.setLabel('text')
				.setDescription('the text you want to say')
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId('text')
						.setStyle(TextInputStyle.Paragraph)
						.setMaxLength(2000)
						.setMinLength(1)
						.setRequired(true)),
		);
		try {
			await interaction.showModal(modal);

			const submitted = await interaction.awaitModalSubmit({
				time: 60000,
				filter: i => i.user.id === interaction.user.id && i.customId === `saymodal_${interaction.id}`,
			});

			const text = submitted.fields.getTextInputValue('text');

			try {
				const ape = new ButtonBuilder()
					.setCustomId('button')
					.setLabel('click me')
					.setStyle(ButtonStyle.Primary);

				const response = await submitted.reply({ content: text, flags: MessageFlags.Ephemeral, components: [new ActionRowBuilder().addComponents(ape)], withResponse: true }).catch(console.error);

				const collector = response.resource.message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_000 });

				collector.on('collect', i => {
					i.reply({ content: text, allowedMentions: { parse: ['roles', 'users', 'everyone'] } }).catch(console.error);
				});
			}
			catch (error) {
				console.error(error);
			}
		}
		catch {
			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({
					content: 'You didn\'t respond in time.',
					flags: MessageFlags.Ephemeral,
				}).catch(() => {});
			}
		}
	},
};