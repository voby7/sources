const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const Logger = require('./utils/logger');
const KeyvManager = require('./utils/keyvManager');

require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMembers] });

client.logger = new Logger(process.env.LOG_WEBHOOK);
client.keyv = new KeyvManager();
client.thugs = require('./utils/thugs');

client.commands = new Collection();

if (process.env.NODE_ENV === 'production') {
	for (const method in console) {
		// no logs!
		console[method] = function() {};
	}
}

const folder = path.join(__dirname, 'commands');
const files = fs.readdirSync(folder).filter(file => file.endsWith('.js'));
for (const file of files) {
	const filePath = path.join(folder, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	}
	else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(process.env.CLIENT_TOKEN);