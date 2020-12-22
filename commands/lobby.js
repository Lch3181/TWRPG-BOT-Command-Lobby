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
        let mentions = message.mentions ? message.mentions.users : null;
        let mention = message.mentions ? mentions.first() : null;
        let messageId = "";
        let guildId = message.guild.id;
        let channelId = message.channel.id;
        let lobby = { host: message.author.tag, mentions: [] };
        let slot = "";
        let slots = [];
        let inSlot = [];
        let item = [];
        let playerNum = 0;
        let result, created;
        let str = [];

        //purge user command
        //message.delete({ timeout: 5000 });

        //Error Handling/Documentation/Command Usage
        switch (args[0].match(/^\w+/gm) ? args[0].match(/^\w+/gm)[0] : args[0]) {
            case 'host':
                let bossSearch = args[1];
                if (args.length < 3) {
                    embed.setTitle('**Usage**');
                    str = [' __**lobby owner only:**__ ',
                        'Host a Lobby',
                        'Some have default value with an equal sign (you can leave them empty)',
                        '-lobby host | `<boss name>` | `<game name>` | `<@player(s) or @role(s)>` | `<bot=>` | `<realm=>` | `<rules=#rules>` | `<notes=Don\'t Die>`',
                        'Example: `-lobby host | Valtora | vl | @English Player @Russians Player | Lee Bot | EB/Giddo`']
                    embed.setDescription(str.join('\n\n'));
                    embed.setColor("89922D");
                    return sendEx(message, embed)
                } else if (bossSearch.length < 3) {
                    embed.setDescription("You need three or more letters to continue your search!");
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                }
                break;
            case 'join':
                if (args.length < 3) {
                    embed.setTitle('**Usage**');
                    str = [' __**Anyone:**__ ',
                        'Join a Lobby',
                        '-lobby join | `<@host>` | `<slot>`',
                        'Example: `-lobby join | @host | Essence of Storm`']
                    embed.setDescription(str.join('\n\n'));
                    embed.setColor("89922D");
                    return sendEx(message, embed)
                }
                if (!mention) {
                    embed.setDescription('Please mention which host to join');
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                }
                break;
            case 'leave':
                if (args.length < 2) {
                    embed.setTitle('**Usage**');
                    str = [' __**Anyone:**__ ',
                        'Join a Lobby',
                        '-lobby leave | `<@host>`',
                        'Example: `-lobby leave | @host']
                    embed.setDescription(str.join('\n\n'));
                    embed.setColor("89922D");
                    return sendEx(message, embed)
                }
                break;
            case 'add':
                //Error Handling
                if (args.length < 2) {
                    embed.setTitle('**Usage**');
                    str = [' __**lobby owner only:**__ ',
                        'Add player(s) to slot',
                        '-lobby add | `<@player1(s)> slot` | `<@player2(s)> slot` | ',
                        'Example: `-lobby add | @player1 shackles | @player2 @player3 Essence of Storm`',
                        'To reserve a slot, just fill up the capacity with that player',
                        'Example: `-lobby add | @myself @myself Essence of Storm`']
                    embed.setDescription(str.join('\n\n'));
                    embed.setColor("89922D");
                    return sendEx(message, embed)
                }
                if (!mention) {
                    embed.setDescription('Please mention who to add');
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                } else if (!args[1].match(/\w+$/gm)) {
                    embed.setDescription('Please include which slot to add');
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                }
                break;
            case 'remove':
                //Error Handling
                if (args.length < 2) {
                    embed.setTitle('**Usage**');
                    str = [' __**lobby owner only:**__ ',
                        'Remove player(s) from slot(s)',
                        '-lobby remove | `<@player(s)>`',
                        'Example: `-lobby remove | @player1 @player2`']
                    embed.setDescription(str.join('\n\n'));
                    embed.setColor("89922D");
                    return sendEx(message, embed)
                }
                if (!message.mentions) {
                    embed.setDescription('Please mention which player to remove');
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                }
                break;
            case 'start':
                if (args[0] != 'start') {
                    embed.setTitle('**Usage**');
                    str = [' __**lobby owner only:**__ ',
                        'Start the lobby',
                        '-lobby start',
                        'Example: `-lobby start`']
                    embed.setDescription(str.join('\n\n'));
                    embed.setColor("89922D");
                    return sendEx(message, embed)
                }
                break;
            case 'remake':
                if (args[0] != "remake") {
                    embed.setTitle('**Usage**');
                    str = [' __**lobby owner only:**__ ',
                        'Remake lobby',
                        'Some have default value with an equal sign (you can leave them empty)',
                        '-lobby remake | `<Loot = Air>`',
                        'Example: `-lobby remake | Essence of Storm`']
                    embed.setDescription(str.join('\n\n'));
                    embed.setColor("89922D");
                    return sendEx(message, embed)
                }
                break;
            case 'unhost':
                if (args[0] != "unhost") {
                    embed.setTitle('**Usage**');
                    str = [' __**lobby owner only:**__ ',
                        'Unhost the lobby',
                        '-lobby unhost',
                        'Example: `-lobby unhost`']
                    embed.setDescription(str.join('\n\n'));
                    embed.setColor("89922D");
                    return sendEx(message, embed)
                }
                break;
            case 'show':
                if (args[0] != "show") {
                    embed.setTitle('**Usage**');
                    str = [' __**lobby owner only:**__ ',
                        'Show the lobby',
                        '-lobby show',
                        'Example: `-lobby show`']
                    embed.setDescription(str.join('\n\n'));
                    embed.setColor("89922D");
                    return sendEx(message, embed)
                }
                break;
            case 'list':
                if (args[0] != "list") {
                    embed.setTitle('**Usage**');
                    str = [' __**Anyone:**__ ',
                        'Show a list of all the lobbies',
                        '-lobby list',
                        'Example: `-lobby list`']
                    embed.setDescription(str.join('\n\n'));
                    embed.setColor("89922D");
                    return sendEx(message, embed)
                }
                break;
            case '':
            default:
                embed.setTitle('**Usage**');
                str = ['Some have default value with an equal sign (you can leave them empty)',
                    ' __**lobby owner only:**__ ',
                    '-lobby host | `<boss name>` | `<game name>` | `<@player(s) or @role(s)>` | `<bot=>` | `<realm=>` | `<rules=#rules>` | `<notes=Don\'t Die>`',
                    '-lobby show',
                    '-lobby start',
                    '-lobby remake | `<loots=Air>`',
                    '-lobby unhost | `<loots=Air>` | `<notes=Thanks for coming>`',
                    '-lobby add | `<@player1(s) slot>` | `<@player2(s) slot>`...',
                    '-lobby remove | `<@player(s)>`',
                    ' __**Anyone:**__ ',
                    '-lobby list',
                    '-lobby join | `<@host>` | `<slot>`',
                    '-lobby leave | `<@host>`'];
                embed.setDescription(str.join("\n"));
                embed.setColor("89922D");

                sendEx(message, embed);
                return
                break;
        }

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
        } else if (result == null && args[0] !== 'host' && args[0] !== 'list') {
            embed.setDescription('You have not host any lobby. Please check -lobby');
            if (args[0] == 'join' && args[0] == 'leave') {
                embed.setDescription(`${mention.tag} has not host any lobby. Please check -lobby`);
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
                    if (!lobby.mentions.length) {
                        lobby.mentions.push(`@everyone`)
                    }
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

                if (str.length) {
                    const output = await message.channel.send(`remaking ${result.lobby.gameName}${str}`);
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
                //limit players to be less or equal to 10
                playerNum = 0;
                slots.forEach(slot => {
                    playerNum += slot.users.length;
                })
                if (playerNum + 1 > 10) {
                    embed.setDescription(`Cannot have more than 10 players`);
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                }

                inSlot = fuseSearch(slots, userId, "users.userId")
                item = fuseSearch(slots, args[2], "name");
                if (!item.length) {
                    embed.setDescription(`${args[2]} not found in lobby`);
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                }
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

                //remove user from all slot
                slots.forEach(slot => {
                    slot.users = slot.users.filter(user => user.userId !== userId)
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
            case 'remove':
                mentions.each(mention => {
                    inSlots = fuseSearch(slots, mention.id, "users.userId")
                    //Error handling
                    if (!inSlots.length) {
                        embed.setDescription(`${mention.tag} is not in any slot`);
                        embed.setColor("A22C2C");
                        return sendEx(message, embed)
                            .then(message => {
                                message.delete({ timeout: 5000 })
                            });
                    }

                    //remove user from all slot
                    slots.forEach(slot => {
                        slot.users = slot.users.filter(user => user.userId !== mention.id)
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
                args.shift(); //remove command arg

                //limit players to be less or equal to 10
                playerNum = 0;
                slots.forEach(slot => {
                    playerNum += slot.users.length;
                })
                if (playerNum + message.content.match(/<[@!\d]+>/g).length > 10) {
                    embed.setDescription(`Cannot have more than 10 players`);
                    embed.setColor("A22C2C");
                    return sendEx(message, embed)
                        .then(message => {
                            message.delete({ timeout: 5000 })
                        });
                }
                args.forEach(arg => {
                    let players = [];
                    let targets = arg.match(/<[@!\d]+>/g) ? arg.match(/<[@!\d]+>/g) : [''];
                    mentions.forEach(mention => {
                        targets.forEach(target => {
                            if (mention.id == target.replace(/[<@!>]/g, "")) {
                                players.push(mention);
                            }
                        })
                    })
                    slot = arg.match(/\w+$/gm)
                    if (slot != null) {
                        item = fuseSearch(slots, slot[0], "name");
                        if (item.length) {
                            slots.forEach(element => {
                                if (element.dropId === item[0].dropId) {
                                    let ingame = lobby.status.includes('waiting') ? "true" : "false";
                                    players.forEach(player => {
                                        element.users.push({ userId: player.id, userName: player.tag, ingame })
                                    })
                                }
                            })
                        } else {
                            embed.setDescription(`${slot[0]} not found in lobby`);
                            embed.setColor("A22C2C");
                            return sendEx(message, embed)
                                .then(message => {
                                    message.delete({ timeout: 5000 })
                                });
                        }
                    }
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
            case 'show':
                break;
            case 'list':
                let lists = await Lobby.findAll({
                    attributes: ['lobby', 'slots']
                })
                let hostList = [], bossList = [], capacityList = [];
                if (lists) {
                    embed.setTitle('Lobby');
                    lists.forEach((list) => {
                        let capacity = 0;
                        list.slots.forEach(slot => {
                            capacity += slot.users.length
                        })
                        hostList.push(list.lobby.host);
                        bossList.push(list.lobby.title);
                        capacityList.push(capacity + '/10');
                    })
                    embed.addField('Host:', `${hostList.join('\n')}`, true);
                    embed.addField('Boss:', `${bossList.join('\n')}`, true);
                    embed.addField('Capacity:', `${capacityList.join('\n')}`, true);
                    embed.setColor("477692");
                    return await sendEx(message, embed, '<a:740300330490921042:771395031206330428>')
                }
                break;
        }

        //message output
        embed.setDescription('');
        lobby.mentions.forEach(mention => {
            embed.setDescription(`${embed.description} ${mention}`);
        });
        embed.setDescription(`${embed.description}\n\`\`\`Boss:   ${lobby.title}\nBot:    ${lobby.bot}\nRealm:  ${lobby.realm}\nRules:  ${lobby.rule}\nNotes:  ${lobby.note}\nStatus: ${lobby.status}\`\`\``);
        embed.setAuthor(`Host: ${message.author.tag}`);
        embed.attachFiles({ attachment: `./twicons/${lobby.title} Icon.jpg`, name: `${lobby.title.replace(/[ _]/g, "")}Icon.jpg` });
        embed.setThumbnail(`attachment://${lobby.title.replace(/[ _]/g, "")}Icon.jpg`);
        embed.setTitle(`Game Name: ${lobby.gameName}`);
        embed.setColor("477692");
        slots.forEach(element => {
            let players = '';
            let emote = element.emoteId != null ? `<:${element.dropId}:${element.emoteId}>` : '';
            element.users.forEach(player => {
                players += ` <@${player.userId}>`
            })
            if (element.users.length > element.capacity) {
                content.push(`${emote}\`` + element.name.padEnd(30, ' ') + `[${element.users.length}/${element.users.length}]\`${players}`);
            } else {
                content.push(`${emote}\`` + element.name.padEnd(30, ' ') + `[${element.users.length}/${element.capacity}]\`${players}`);
            }
        });

        embed.addField("Slots:", content, false);
        if (lobby.drops.length > 0) {
            embed.addField("Drops:", `\`\`\`${lobby.drops}\`\`\``, false);
        } else {
            embed.addField("Drops:", `\`\`\` \`\`\``, false);
        }

        if (lobby.status == 'unhosted') {
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
            if (embedMessage) {
                result.messageId = embedMessage.id;
                result.guildId = embedMessage.guild.id;
                result.channelId = embedMessage.channel.id;
                await result.save();
            }
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
