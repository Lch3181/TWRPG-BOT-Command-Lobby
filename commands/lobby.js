const fs = require('fs');
const Fuse = require('fuse.js');
const Discord = require('discord.js');

module.exports = {
    name: 'lobby',
    description: "for game lobby hosting template",
    usage: '<boss name>',
    async execute(client, message, args, Lobby) {
        let embed = new Discord.MessageEmbed();
        let bosses = JSON.parse(fs.readFileSync('./twrpg-info/bosses.json', 'utf-8'));
        var args = args.split('|').map(x => x.trim());
        let content = [];
        let userId = message.author.id;
        let mention = message.mentions ? message.mentions.users.first() : null;
        let messageId = "";
        let guildId = message.guild.id;
        let channelId = message.channel.id;
        let lobby = { host: message.author.tag, mentions: [] };
        let slots = [];
        let inSlot = [];
        let result, created;
        let str = [];

        //purge user command
        //message.delete({ timeout: 5000 });

        // get data
        //limit users only can apply commands on the same server that lobby was created
        if (args[0] === 'join' || args[0] === 'leave' && mention) {
            result = await Lobby.findByPk(mention.id);
        } else if (args[0] === 'join' || args[0] === 'leave' && !mention) {
            embed.setDescription('Please mention which host');
            embed.setColor("A22C2C");
            return sendEx(message, embed)
                .then(message => {
                    message.delete({ timeout: 5000 })
                });
        } else {
            result = await Lobby.findByPk(userId);
        }

        if (result !== null && args[0] !== 'unhost') {
            if (result.guildId !== guildId || result.channelId !== channelId) {
                embed.setDescription("Please send command in the same server and channel where you created that lobby or -lobby unhost");
                embed.setColor("A22C2C");
                return sendEx(message, embed)
                    .then(message => {
                        message.delete({ timeout: 5000 })
                    });
            }
        } else if (result == null && args[0] !== 'host' && args[0] !== 'help') {
            embed.setDescription('You have not host any lobby. Please check -lobby help');
            if (args[0] == 'join' && args[0] == 'leave') {
                embed.setDescription(`${mention.tag} has not host any lobby. Please check -lobby help`);
            }
            embed.setColor("A22C2C");
            return sendEx(message, embed)
                .then(message => {
                    message.delete({ timeout: 5000 })
                });
        }

        if (result !== null) {
            messageId = result.messageId;
            guildId = result.guildId;
            channelId = result.channelId;
            lobby = result.lobby;
            slots = result.slots;
        }

        switch (args[0]) {
            case 'host':
                let bossSearch = args[1];

                //Error Handling
                if (args.length < 3) {
                    embed.setDescription('Not enough arguements. Check with -lobby');
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                } else if (bossSearch.length < 3) {
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
                    message.mentions.users.each(mention => {
                        lobby.mentions.push(`<@!${mention.id}>`)
                    });
                    message.mentions.roles.each(role => {
                        lobby.mentions.push(`<@&${role.id}>`)
                    });
                    lobby.bot = args[4] == null ? '' : args[4];
                    lobby.realm = args[5] == null ? '' : args[5];
                    lobby.rule = args[6] == null ? "#rules" : args[6];
                    lobby.note = args[7] == null ? "Don't Die" : args[7];
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
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                }
                break;
            case 'start':
                message.channel.send(`starting ${lobby.gameName}`)
                    .then(message => {
                        message.delete({ timeout: 5000 })
                    });

                lobby.status = 'started';

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

                break;
            case 'remake':
            case 'rmk':
                lobby.status = 'remaking(waiting)';
                lobby.drops.push(args[1] == null ? 'Air' : args[1]);

                //delete old message
                message.channel.messages.fetch(messageId)
                    .then(message => {
                        message.delete();
                    });

                //mention not ingame players to join

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

                break;
            case 'unhost':
                message.channel.send(`unhosting ${lobby.gameName}`)
                    .then(message => {
                        message.delete({ timeout: 5000 })
                    });

                lobby.status = 'unhosted';
                lobby.drops.push(args[1] == null ? 'Air' : args[1]);
                lobby.note = args[2] == null ? 'Thanks everyone for coming' : args[2];

                await Lobby.update({
                    lobby
                }, {
                    where: {
                        userId
                    }
                });

                await result.destroy();

                //delete old message
                client.guilds.cache.get(guildId).channels.cache.get(channelId).messages.fetch(messageId)
                    .then(message => {
                        message.delete();
                    });
                break;
            case 'join':
                if (args.length < 3) {
                    embed.setDescription('Not enough arguements. Check with -lobby');
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                }
                inSlot = fuseSearch(slots, userId, "users.userId")
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
                        embed.setDescription(`joining ${result.lobby.gameName} slot ${item[0].name}`);
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

                break;
            case 'leave':
                inSlot = fuseSearch(slots, userId, "users.userId")
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
                        var index = element.users.findIndex(function (item) {
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

                break;
            case 'vanquish':
            case 'remove':
                //Error Handling
                if (!message.mentions) {
                    embed.setDescription('Please mention which player');
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                } else if (args.length < 2) {
                    embed.setDescription('Not enough arguements. Check with -lobby');
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                }
                let mentions = message.mentions.users;

                mentions.each(mention => {
                    inSlot = fuseSearch(slots, mention.id, "users.userId")
                    //Error handling
                    if (!inSlot.length) {
                        embed.setDescription(`${mention.tag} is not in any slot`);
                        embed.setColor("A22C2C");
                        return sendEx(message, embed)
                            .then(message => {
                                message.delete({ timeout: 5000 })
                            });
                    }

                    //remove user from slot
                    slots.forEach(element => {
                        if (element.dropId === inSlot[0].dropId) {
                            var index = element.users.findIndex(function (item) {
                                return item.userId === mention.id
                            });
                            element.users.splice(index, 1);
                            //send success message
                            embed.setDescription(`removing ${mention.tag} in slot ${element.name}`);
                            embed.setColor("477692");
                            sendEx(message, embed)
                                .then(message => {
                                    message.delete({ timeout: 5000 })
                                });
                        }
                    })
                })


                //update lobby
                await Lobby.update({
                    slots
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
                break;
            case 'add':
                break;
            case 'help':
                embed.setTitle('-lobby usage');
                str = ['Some have default value with an equal sign (you can skip those arugements)',
                    ' __**lobby owner only:**__ ',
                    '-lobby host|boss|game name|@mention(s) or @role(s)|bot=|realm=|rules=#rules|notes=Don\'t Die',
                    '-lobby unhost|loots=Air|notes=Thanks for coming',
                    '-lobby start',
                    '-lobby remake(rmk)|loots=Air',
                    '-lobby remove|@mention(s)',
                    '-lobby add|@mention slot|@mention slot|...',
                    ' __**Anyone:**__ ',
                    '-lobby join|@mention|slot',
                    '-lobby leave|@mention'];
                embed.setDescription(str.join("\n"));
                embed.setColor("477692");

                return sendEx(message, embed);
                break;
        }

        //message output
        embed.setDescription('');
        lobby.mentions.forEach(mention => {
            embed.setDescription(`${embed.description} ${mention}`);
        });
        embed.setDescription(`${embed.description}\n\`\`\`Boss:   ${lobby.title}\nBot:    ${lobby.bot}\nRealm:  ${lobby.realm}\nRules:  ${lobby.rule}\nNotes:  ${lobby.note}\nStatus: ${lobby.status}\`\`\``);
        embed.setAuthor(`Host: ${message.author.tag}`);
        embed.attachFiles({ attachment: `./twicons/${lobby.title} Icon.jpg`, name:'Thumbnail.jpg'});
        embed.setThumbnail(`attachment://Thumbnail.jpg`);
        embed.setTitle(`Game Name: ${lobby.gameName}`);
        embed.setColor("477692");
        embed.setTimestamp();
        slots.forEach(element => {
            let players = '';
            let emote = element.emoteId != null ? `<:${element.dropId}:${element.emoteId}>` : '';
            element.users.forEach(player => {
                players += ` <@${player.userId}>`
            })
            content.push(`${emote}\`` + element.name.padEnd(30, ' ') + `[${element.users.length}/${element.capacity}]\`${players}`);
        });

        embed.addField("Slots:", content, false);
        if (lobby.drops.length > 0) {
            embed.addField("Drops:", `\`\`\`${lobby.drops}\`\`\``, false);
        } else {
            embed.addField("Drops:", `\`\`\` \`\`\``, false);
        }

        if(lobby.status == 'unhosted') {
            embed.setTitle(`~~${embed.title}~~`);
        }

        //send embed message
        if (!created && args[0] === 'host') {
            embed.setDescription('Already created one lobby, please \"-host unhost\" it first');
            embed.setColor("A22C2C");
            embed.fields = [];
            return sendEx(message, embed)
                .then(message => {
                    message.delete({ timeout: 5000 })
                });
        } else if (args[0] === 'unhost') {
            //send to old server&channel
            await client.guilds.cache.get(result.guildId).channels.cache.get(result.channelId).send('<a:740300330490921042:771395031206330428>', embed);
        } else {
            const embedMessage = await sendEx(message, embed, '<a:740300330490921042:771395031206330428>')
            result.messageId = embedMessage.id;
            result.guildId = embedMessage.guild.id;
            result.channelId = embedMessage.channel.id;
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
