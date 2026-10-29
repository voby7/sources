const { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, InteractionContextType, TextInputBuilder, ModalBuilder, LabelBuilder, TextInputStyle } = require('discord.js');

const presets = new Map([
	['dnb', `https://files.catbox.moe/1whog5.gif
https://files.catbox.moe/46ws3p.gif
https://files.catbox.moe/fh7cm2.gif
https://files.catbox.moe/xd3e3f.png
https://files.catbox.moe/qcwc0u.jpg
https://files.catbox.moe/5iexje.jpg`],
]);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('say3')
		.setDescription('say2 but uses random lines from what you input')
		.addStringOption(option => 
			option
				.setName('preset')
				.setDescription('Presets')
				.addChoices(
					...Array.from(presets.entries()).map(([key]) => ({
						name: key,
						value: key,
					}))
				)
		)
		.setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
	async execute(interaction) {
		let lines;
		let response;
		const ape = new ButtonBuilder()
			.setCustomId('button')
			.setLabel('click me')
			.setStyle(ButtonStyle.Primary);
	
		const selectedPreset = interaction.options.getString('preset');
		if (!selectedPreset || selectedPreset === '') {
			const modal = new ModalBuilder().setCustomId(`saymodal_${interaction.id}`).setTitle('enter text').addLabelComponents(
				new LabelBuilder()
					.setLabel('text')
					.setDescription('message per line')
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId('text')
							.setStyle(TextInputStyle.Paragraph)
							.setMinLength(1)
							.setRequired(true)),
			);
			try {
				await interaction.showModal(modal);
	
				const submitted = await interaction.awaitModalSubmit({
					time: 60000,
					filter: i => i.user.id === interaction.user.id && i.customId === `saymodal_${interaction.id}`,
				});
	
				const spamtext = submitted.fields.getTextInputValue('text');
				lines = spamtext.split('\n')
					.map(l => l.trim())
					.map(l => l.length > 2000 ? l.slice(0, 2000) : l)
					.filter(l => l);

				if (lines.length === 0) return;
				response = await submitted.reply({ content: '🔥', flags: MessageFlags.Ephemeral, components: [new ActionRowBuilder().addComponents(ape)], withResponse: true }).catch(console.error);
			}
			catch {
				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
						content: 'You didn\'t respond in time.',
						flags: MessageFlags.Ephemeral,
					});
				}
			}
		} else {
			const presetData = presets.get(selectedPreset);
			if (!presetData) {
				return interaction.reply({ content: 'Preset not found.', flags: MessageFlags.Ephemeral }).catch(console.error);
			}

			const spamtext = presetData;
			lines = spamtext.split('\n')
				.map(l => l.trim())
				.map(l => l.length > 2000 ? l.slice(0, 2000) : l)
				.filter(l => l);
			if (lines.length === 0) return;
			response = await interaction.reply({ content: 'Using \'' + selectedPreset + '\' preset.', flags: MessageFlags.Ephemeral, components: [new ActionRowBuilder().addComponents(ape)], withResponse: true }).catch(console.error);
		}

		try {
			const collector = response.resource.message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_000 });

			collector.on('collect', async i => {
				await i.reply({ content: lines[Math.floor(Math.random() * lines.length)], allowedMentions: { parse: ['roles', 'users', 'everyone'] } }).catch(console.error);
				i.followUp({ content: lines[Math.floor(Math.random() * lines.length)], allowedMentions: { parse: ['roles', 'users', 'everyone'] } }).catch(console.error);
				i.followUp({ content: lines[Math.floor(Math.random() * lines.length)], allowedMentions: { parse: ['roles', 'users', 'everyone'] } }).catch(console.error);
				i.followUp({ content: lines[Math.floor(Math.random() * lines.length)], allowedMentions: { parse: ['roles', 'users', 'everyone'] } }).catch(console.error);
				i.followUp({ content: lines[Math.floor(Math.random() * lines.length)], allowedMentions: { parse: ['roles', 'users', 'everyone'] } }).catch(console.error);
			});
		}
		catch (error) {
			console.error(error);
		}
	},
};
