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
        "bot":"",
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
                "player1": [{
        "userId": "227956824521834500",
        "userName": "Lch#3181",
        "ingame": "false"
            }]
    }]
}*/
module.exports = {
    name: 'lobby',
    description: "for game lobby hosting template",
    usage: '<boss name>',
    async execute(message, args, Lobby) {
        let embed = new Discord.MessageEmbed();
        let bosses = JSON.parse(fs.readFileSync('./twrpg-info/bosses.json', 'utf-8'));
        var args = args.split('|').map(x => x.trim());
        let content = [];
        let description = '';
        let userId = message.author.id;
        let mention
        let messageId = "";
        let lobby = { host: message.author.tag };
        let slots = [];
        let result, created;

        //purge user command
        //message.delete({ timeout: 5000 });

        switch (args[0]) {
            case 'host':
                let bossSearch = args[1];

                //Error Handling
                if (bossSearch.length < 3) {
                    embed.setDescription("You need three or more letters to continue your search!");
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                } else if (args[2] == null) {
                    embed.setDescription("You need a game name!");
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                }

                let items = JSON.parse(fs.readFileSync('./twrpg-info/items.json', 'utf-8'));
                let boss = fuseSearch(bosses, bossSearch, "name");

                if (boss.length > 0) {
                    lobby.title = boss[0].name;
                    lobby.gameName = args[2];
                    lobby.bot = args[3] == null ? '' : args[3];
                    lobby.rule = args[4] == null ? "#rules" : args[4];
                    lobby.note = args[5] == null ? "Don't Die" : args[5];
                    lobby.status = 'waiting';
                    lobby.drops = []
                    //Slots
                    if (boss[0].drops) {
                        for (let i = 0; i < boss[0].drops.length; i++) {
                            let drop_id = boss[0].drops[i]
                            let drop = fuseSearch(items, drop_id, "id");
                            let capacity = 1;

                            //slot cap
                            if (drop[0].type === '[Material]' && drop[0].name != 'Coin of Effort') {
                                capacity = 2;
                            } else {
                                capacity = 1;
                            }
                            slots.push({ dropId: drop_id, emoteId: drop[0].emote_id, name: drop[0].name, capacity, users: [] });
                        }
                    }

                    //create lobby if not exist
                    if (args[0] === 'host') {
                        [result, created] = await Lobby.findOrCreate({
                            where: {
                                userId
                            },
                            defaults: {
                                lobby,
                                slots
                            }
                        });
                    }
                }
                else {
                    embed.setDescription(`**${bossSearch}** was not found in the boss list\n**__HINT: If you do not know a boss's name, you can type -boss by itself to get a list of all bosses__**`);
                    embed.setColor("A22C2C");
                    return sendEx(message, embed);
                }
                break;
            case 'start':
                result = await Lobby.findByPk(userId);
                if (result === null) {
                    return message.channel.send('You have not host any lobby yet.');
                } else {
                    message.channel.send(`starting ${result.lobby.gameName}`)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                    messageId = result.messageId;
                    lobby = result.lobby;
                    lobby.status = 'started';
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
                break;
            case 'rmk':
                result = await Lobby.findByPk(userId);
                if (result === null) {
                    return message.channel.send('You have not host any lobby yet.');
                } else {
                    messageId = result.messageId;
                    lobby = result.lobby;
                    lobby.status = 'remaking(waiting)';
                    lobby.drops.push(args[1] == null ? 'Air' : args[1]);
                    slots = result.slots;


                    //delete old message
                    message.channel.messages.fetch(messageId)
                        .then(message => {
                            message.delete();
                        });

                    //mention not ingame players to join
                    let str = [];
                    const notInGame = fuseSearch(slots, "false", "users.ingame");
                    notInGame.forEach(element => {
                        element.users.forEach(user => {
                            user.ingame = "true";
                            str.push(` <@${user.userId}>`)
                        })
                    })

                    const output = await message.channel.send(`remaking ${result.lobby.gameName}${str}`);
                    if (!str.length) {
                        output.delete({ timeout: 5000 });
                    }

                    //update lobby
                    await Lobby.update({
                        lobby,
                        slots
                    }, {
                        where: {
                            userId
                        }
                    });
                }
                break;
            case 'unhost':
                result = await Lobby.findByPk(userId);
                if (result === null) {
                    return message.channel.send('You have not host any lobby yet.');
                } else {
                    message.channel.send(`unhosting ${result.lobby.gameName}`)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                    messageId = result.messageId;
                    lobby = result.lobby;
                    lobby.status = 'unhosted';
                    lobby.drops.push(args[1] == null ? 'Air' : args[1]);
                    lobby.note = args[2] == null ? 'Thanks everyone for coming' : args[2];
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

                    await result.destroy();
                }
                break;
            case 'join':
                if (!message.mentions) {
                    embed.setDescription('Please mention which host');
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                }
                mention = message.mentions.users.first()
                result = await Lobby.findByPk(mention.id);
                if (result === null) {
                    embed.setDescription(`${mention.username} has not host any lobby`);
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                } else {
                    messageId = result.messageId;
                    lobby = result.lobby;
                    slots = result.slots;
                    let inSlot = fuseSearch(slots, userId, "users.userId")
                    let item = fuseSearch(slots, args[2], "name");
                    slots.forEach(element => {
                        if (element.dropId === item[0].dropId) {
                            //Error handling
                            if (element.users.length >= element.capacity) {
                                embed.setDescription(`${element.name} is full`);
                                embed.setColor("A22C2C");
                                return sendEx(message, embed)
                                    .then(message => {
                                        message.delete({ timeout: 5000 })
                                    });
                            } else if (inSlot.length) {
                                embed.setDescription(`Already in slot ${inSlot[0].name}`);
                                embed.setColor("A22C2C");
                                return sendEx(message, embed)
                                    .then(message => {
                                        message.delete({ timeout: 5000 })
                                    });
                            }
                            let ingame = lobby.status.includes('waiting') ? "true" : "false";
                            element.users.push({ userId, userName: message.author.tag, ingame })

                            //send success message
                            embed.setDescription(`joining ${result.lobby.gameName}`);
                            embed.setColor("477692");
                            sendEx(message, embed)
                                .then(message => {
                                    message.delete({ timeout: 5000 })
                                });
                        }
                    })

                    await Lobby.update({
                        slots
                    }, {
                        where: {
                            userId: mention.id
                        }
                    });

                    //delete old message
                    message.channel.messages.fetch(messageId)
                        .then(message => {
                            message.delete();
                        });
                }
                break;
            case 'leave':
                if (!message.mentions) {
                    embed.setDescription('Please mention which host');
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                }
                mention = message.mentions.users.first()
                result = await Lobby.findByPk(mention.id);
                if (result === null) {
                    embed.setDescription(`${mention.username} has not host any lobby`);
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                } else {
                    messageId = result.messageId;
                    lobby = result.lobby;
                    slots = result.slots;
                    let inSlot = fuseSearch(slots, userId, "users.userId")
                    //Error handling
                    if (!inSlot.length) {
                        embed.setDescription(`You are not in any slot`);
                        embed.setColor("A22C2C");
                        return sendEx(message, embed)
                            .then(message => {
                                message.delete({ timeout: 5000 })
                            });
                    }
                    
                    //remove user from slot
                    slots.forEach(element => {
                        if (element.dropId === inSlot[0].dropId) {
                            var index = element.users.findIndex(function(item, i){
                                return item.userId === userId
                            });
                            element.users.splice(index, 1);
                            //send success message
                            embed.setDescription(`leaving ${result.lobby.gameName} slot ${element.name}`);
                            embed.setColor("477692");
                            sendEx(message, embed)
                                .then(message => {
                                    message.delete({ timeout: 5000 })
                                });
                        }
                    })

                    //update lobby
                    await Lobby.update({
                        slots
                    }, {
                        where: {
                            userId: mention.id
                        }
                    });

                    //delete old message
                    message.channel.messages.fetch(messageId)
                        .then(message => {
                            message.delete();
                        });
                }
                break;
            default: //Error Handling
                embed.setTitle('Usage');
                let str = ['-lobby host|boss|game name|bot|rules|notes', '-lobby unhost|loots|notes', '-lobby start', '-lobby rmk|loots', '-lobby join|@user|slot', '-lobby leave|@user'];
                embed.setDescription(str.join("\n"));
                embed.setColor("477692");

                return sendEx(message, embed);
                break;
        }

        //message output
        description = `\`\`\`Host: ${lobby.host}\nGame Name: ${lobby.gameName}\nBot: ${lobby.bot}\nRules: ${lobby.rule}\nNotes: ${lobby.note}\nStatus: ${lobby.status}\`\`\``
        embed.setTitle(lobby.title);
        embed.setDescription(description);
        embed.setColor("477692");
        embed.setTimestamp();
        slots.forEach(element => {
            let players = '';
            element.users.forEach(player => {
                players += ` ${player.userName}`
            })
            content.push(`<:${element.dropId}:${element.emoteId}>\`` + element.name.padEnd(30, ' ') + `[${element.users.length}/${element.capacity}]${players}\``);
        });

        embed.addField("Slots:", content, false);
        if (lobby.drops.length > 0) {
            embed.addField("Drops:", `\`\`\`${lobby.drops}\`\`\``, false);
        } else {
            embed.addField("Drops:", `\`\`\` \`\`\``, false);
        }

        //send embed message
        if (!created && args[0] === 'host') {
            embed.setDescription('Already created one lobby, please \"-host unhost\" it first');
            embed.setColor("A22C2C");
            return sendEx(message, embed)
                .then(message => {
                    message.delete({ timeout: 5000 })
                });
        } else {
            const embedMessage = await sendEx(message, embed, '<a:740300330490921042:771395031206330428>')
            result.messageId = embedMessage.id;
            await result.save();
        }

        return;
    }
}

function fuseSearch(Haystack, Needle, Keys) {
    let options = {
        shouldSort: true,
        matchAllTokens: true,
        tokenize: true,
        threshold: 0.1,
        location: 1,
        distance: 10,
        maxPatternLength: 32,
        minMatchCharLength: 3,
        keys: [Keys]
    };
    let fuse = new Fuse(Haystack, options);
    return fuse.search(Needle);
}

async function sendEx(message, embed, content = '') {
    return message.channel.send(content, embed);
}
