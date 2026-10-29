const { WebhookClient } = require('discord.js');

class Logger {
	constructor(url) {
		if (!url) throw new Error('No URL provided.');
		this.webhook = new WebhookClient({ url: url });
	}

	async log(title, description, color = '#ffbb00', fields = []) {
		const embed = {
			title,
			description,
			color: this.parseColor(color),
			timestamp: new Date().toISOString(),
			fields,
		};

		await this.webhook.send({
			username: 'Free Cliff',
			avatarURL: '',
			embeds: [embed],
		}).catch(console.error);
	}

	async error(title, error) {
		await this.log(`[ERROR] ${title}`, error?.stack || error?.message || String(error), '#ff0000');
	}

	async warn(title, description) {
		await this.log(`[WARN] ${title}`, description, '#ffff00');
	}

	async info(title, description) {
		await this.log(`[INFO] ${title}`, description, '#0099ff');
	}

	async success(title, description) {
		await this.log(`[SUCCESS] ${title}`, description, '#00ff00');
	}

	parseColor(color) {
		return parseInt(color.replace('#', ''), 16);
	}
}

module.exports = Logger;