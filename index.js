require('dotenv').config();
const discord = require('discord.js');
const client = new discord.Client({ partials: ['MESSAGE', 'REACTION'] });
const db = require('./database');
const Lobby = require('./models/Lobby');
const prefix = '-';
const fs = require('fs');
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
    //console.log(message.mentions);

    const input = message.content.slice(prefix.length).trim().split(' ');
    const command = input.shift();
    var args = input.join(' ');

    switch (command) {
        case 'lobby':
            client.commands.get('lobby').execute(client, message, args, Lobby);
            break;
        default:
            console.log('undefinded command: ' + command);
            break;
    }
});
