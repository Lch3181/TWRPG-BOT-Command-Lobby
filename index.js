require('dotenv').config();
const discord = require('discord.js');
const client = new discord.Client();
const db = require('./database');
const Lobby = require('./models/Lobby');
const prefix = '-';
const fs = require('fs');
const cooldowns = new discord.Collection();
client.commands = new discord.Collection();

client.login(process.env.BOT_TOKEN);


const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log('twbot-!host is online!');
    db.authenticate()
        .then(() => {
            console.log('Connected to Database');
            Lobby.init(db);
            Lobby.sync();
        }).catch((err) => console.log(err));
});

client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    console.log(message.content);

    // split arguements
    const args = message.content.slice(prefix.length).trim().split(/ /);
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) return;

    //cooldown
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    //execute command
    try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});
