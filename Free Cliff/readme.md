# freecliff-bot
evil ass discord thug bot, completely free to use

heavily unoptimized code btw

## how 2 deploy
deploying this yourself is dangerous and discord jannies WILL terminate your bot and holder account (maybe even your other accounts if you don't hide properly) but here's how you deploy this shit

1. get [Tor Browser](https://www.torproject.org/) or [Mullvad Browser](https://mullvad.net/en/browser) with a [good VPN](https://fmhy.net/privacy#vpn), I recommend [WARP](https://one.one.one.one/) (free, [without bloat](https://rentry.co/foss-warp)) or [Mullvad](https://mullvad.net/) (paid)
2. register a nu discord account using the browser of your choice, for the official bot instance I use [email aliases](https://fmhy.net/internet-tools/#email-aliasing) because they're more convenient in my case but [temp mail services](https://fmhy.net/internet-tools#temp-mail) (especially the gmail ones) are better for most people
3. create an application [here](https://discord.com/developers/applications). set your app installation settings to [these](https://files.catbox.moe/fup6fe.png), then go to the bot category, enable the "guild members" intent and get the bot token
4. clone this repo or just download the src
5. copy ``.env.example`` to ``.env`` and modify the stuff
6. modify ``config.json``, specifically the ``clientId`` variable (it's the application ID you can find under the "general information" category on your application's dashboard)
7. run ``npm i`` to install dependencies
8. run ``node deploy-commands.js`` to deploy the application commands to discord
9. run ``npm run start`` to start the bot, or use pm2 instead to have it running in the background (``pm2 start ecosystem.config.js``)
10. to make this run on startup (e.g. on a VPS), use pm2 to run the bot, then run ``pm2 startup`` and run the command it returns, then run ``pm2 save`` to save the current process list


everything above is the original readme

original author: i lowkey forgot but i know em
leaked by voby7
