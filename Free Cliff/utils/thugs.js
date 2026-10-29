const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const TEXT_FILE = path.join(__dirname, 'thugs.txt');

let lines = [];
let catboxLink = null;

function initialize() {
	if (lines.length > 0) return;

	const content = fs.readFileSync(TEXT_FILE, 'utf-8');
	lines = content
		.split(/\r?\n/)
		.map(line => line.trim())
		.filter(line => line.length > 0);

	console.log(`Loaded ${lines.length} lines from ${path.basename(TEXT_FILE)}`);

	uploadToCatbox();
}

async function uploadToCatbox() {
	const fileBuffer = fs.readFileSync(TEXT_FILE);
	const prefixBuffer = Buffer.from('This is the thug stash for the Free Cliff bot. https://download-cliff.org\nSend them on Discord to see them as the CDN links are most likely expired.\n\n', 'utf-8');
	const buffer = Buffer.concat([prefixBuffer, fileBuffer]);

	const formData = new (require('form-data'))();
	formData.append('reqtype', 'fileupload');
	formData.append('fileToUpload', buffer, {
		filename: path.basename(TEXT_FILE),
		userhash: '9ad38482cace90890f2551970',
		contentType: 'text/plain',
	});

	try {
		console.log('Uploading to catbox.moe... (this takes a few seconds)');
		const response = await fetch('https://catbox.moe/user/api.php', {
			method: 'POST',
			body: formData,
		});

		const link = await response.text();
		if (link.startsWith('https://files.catbox.moe/')) {
			catboxLink = link.trim();
			console.log(`Uploaded successfully! Link: ${catboxLink}`);
		}
		else {
			console.error('Upload failed:', link);
		}
	}
	catch (err) {
		console.error('Error uploading to catbox.moe:', err.message);
	}
}

function randomThug() {
	initialize();
	if (lines.length === 0) return null;
	return lines[Math.floor(Math.random() * lines.length)];
}

function getCatboxLink() {
	initialize();
	return catboxLink;
}

function getSpamText(text = '') {
	let spamText = text + '\n';
	for (let i = 1; i <= 3; i++) {
		spamText += `# ${randomThug()}\n`;
	}
	return spamText;
}

initialize();

module.exports = {
	randomThug,
	getCatboxLink,
	getSpamText,
};