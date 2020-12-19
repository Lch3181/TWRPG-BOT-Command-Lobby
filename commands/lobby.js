const fs = require('fs');
const Fuse = require('fuse.js');
const Discord = require('discord.js');
const { sequelize } = require('../models/Lobby');
/*{
    "userId": "",
    "guildId": "",
    "messageId": "",
    "lobby": {
        "host": "",
        "gameName": "",
        "rule": "",
        "note":"",
        "status": "",
        "drops": []
    },
    "slots": [{
        "I0D2": {
            "emoteId": "",
            "dropId":"",
            "name": "Embrace of Nature",
            "capacity": 1,
            "users": [{
                "player1": {
                    "joined": false
                }
            }]
        }
    }]
}*/
module.exports = {
    name: 'lobby',
    description: "for game lobby hosting template",
    usage: '<boss name>',
    async execute(message, args, Lobby) {
        let embed = new Discord.MessageEmbed();
        let bosses = JSON.parse(fs.readFileSync('./twrpg-info/bosses.json', 'utf-8'));
        var args = args.split('|');
        let content = [];
        let description = '';
        let userId = message.author.id;
        let guildId = message.guild.id;
        let messageId = "";
        let lobby = { host: message.author.tag};
        let slots = [];
        let result, created;

        //purge user command
        message.delete({timeout:5000});

        //Error handle
        if (!args.length || args == '') {
            embed.setTitle('Usage');
            let str = ['-lobby host|boss|game name', '-lobby unhost', '-lobby rmk|loots'];
            embed.setDescription(str.join("\n"));
            embed.setColor("477692");

            return sendEx(message, embed);
        }

        //unhost
        if (args[0] === 'unhost') {
            result = await Lobby.findByPk(userId);
            if (result === null) {
                message.channel.send('You have not host any lobby yet.');
            } else {
                message.channel.send(`unhosting ${result.gamename}`)
                    .then(message => {
                        message.delete({ timeout: 5000 })
                    });
                messageId = result.messageId;
                lobby = result.lobby;
                lobby.status = 'unhosted';
                lobby.note = 'Thanks everyone for coming';
                slots = result.slots;

                //delete old message
                message.channel.messages.fetch(messageId)
                    .then(message => {
                        message.delete();
                    });

                await result.destroy();
            }
        }

        //rmk
        if (args[0] === 'rmk') {
            result = await Lobby.findByPk(userId);
            if (result === null) {
                message.channel.send('You have not host any lobby yet.');
            } else {
                message.channel.send(`remaking ${result.gamename}`)
                    .then(message => {
                        message.delete({ timeout: 5000 })
                    });
                messageId = result.messageId;
                lobby = result.lobby;
                lobby.status = 'remaking(waiting)';
                lobby.drops.push(args[1] == null ? 'Air' : args[1]);
                slots = result.slots;

                await Lobby.update({
                    lobby
                }, {
                    where: {
                        userId
                    }
                });

                //delete old message
                message.channel.messages.fetch(messageId)
                    .then(message => {
                        message.delete();
                    });
            }
        }

        //host
        if (args[0] === 'host') {
            let bossSearch = args[1];

            if (bossSearch.length < 3) {
                embed.setDescription("You need three or more letters to continue your search!");
                embed.setColor("A22C2C");
                return sendEx(message, embed);
            }

            let items = JSON.parse(fs.readFileSync('./twrpg-info/items.json', 'utf-8'));
            let boss = searchBoss(bossSearch, bosses);

            if (boss.length > 0) {
                lobby.title = boss[0].name;
                lobby.gamename = args[2];
                lobby.rule = "#rules";
                lobby.note = "Don't Die";
                lobby.status = 'waiting';
                lobby.drops = []
                //Slots
                if (boss[0].drops) {
                    for (let i = 0; i < boss[0].drops.length; i++) {
                        let drop_id = boss[0].drops[i]
                        let drop = searchItem(drop_id, items);
                        let capacity = 1;

                        //slot cap
                        if (drop[0].type === '[Material]' && drop[0].name != 'Coin of Effort') {
                            capacity = 2;
                        }
                        slots.push({ dropId: drop_id, emoteId: drop[0].emote_id, name: drop[0].name, capacity: 1, users: [] });
                    }
                }
            }
            else {
                embed.setDescription(`**${bossSearch}** was not found in the boss list\n**__HINT: If you do not know a boss's name, you can type -boss by itself to get a list of all bosses__**`);
                embed.setColor("A22C2C");
                return sendEx(message, embed);
            }
        }

        //message output
        description = `\`\`\`Host: ${lobby.host}\nGame Name: ${lobby.gamename}\nRules: ${lobby.rule}\nNotes: ${lobby.note}\nStatus: ${lobby.status}\`\`\``
        embed.setTitle(lobby.title);
        embed.setDescription(description);
        embed.setColor("477692");
        embed.setTimestamp();
        slots.forEach(element => {
            content.push(`<:${element.dropId}:${element.emoteId}>\`` + element.name.padEnd(30, ' ') + `[${element.users.length}/${element.capacity}]\``);
        });

        embed.addField("Slots:", content, false);
        if (lobby.drops.length > 0) {
            embed.addField("Drops:", `\`\`\`${lobby.drops}\`\`\``, false);
        } else {
            embed.addField("Drops:", `\`\`\` \`\`\``, false);
        }

        //create lobby
        if (args[0] === 'host') {
            [result, created] = await Lobby.findOrCreate({
                where: {
                    userId
                },
                defaults: {
                    lobby,
                    slots
                }
            })
        }

        //send embed
        if (created || args[0] === 'rmk' || args[0] === 'unhost') {
            const embedMessage = await sendEx(message, embed, '<a:740300330490921042:771395031206330428>')
            result.messageId = embedMessage.id;
            result.guildId = embedMessage.guild.id;
            await result.save();
        }
        else {
            message.channel.send('Already created one lobby, please \"-host unhost\" it first')
            .then(message => {
                message.delete({timeout:5000})
            });
        }

        return;
    }
}

function searchBoss(bossSearch, bosses) {
    let options = {
        shouldSort: true,
        matchAllTokens: true,
        tokenize: true,
        threshold: 0.1,
        location: 1,
        distance: 10,
        maxPatternLength: 32,
        minMatchCharLength: 3,
        keys: ["name"]
    };
    let fuse = new Fuse(bosses, options);
    return fuse.search(bossSearch);
}

function searchItem(itemSearch, items) {
    let options = {
        shouldSort: true,
        matchAllTokens: true,
        tokenize: true,
        threshold: 0.1,
        location: 1,
        distance: 10,
        maxPatternLength: 32,
        minMatchCharLength: 3,
        keys: ["id"]
    };
    let fuse = new Fuse(items, options);
    return fuse.search(itemSearch);
}

async function sendEx(message, embed, content = '') {
    return message.channel.send(content, embed);
}
