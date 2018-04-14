const Discord = require('discord.js');
const path = require('path');
const dateFormat = require('dateformat');
const util = require('util');
const low = require('lowdb');
const fs = require('fs');

log("Forking Myx\n * Node " + process.version + "\n * Discord.js v" + Discord.version);

// Load configuration
var Config = require('./config.json');

// Load persistent file storage
const db = low('db.json', {
    storage: require('lowdb/lib/storages/file-async')
})

// Set defaults
if (!Config.prefix) {
    Config.prefix = "!";
}
if (!Config.defaultChannel) {
    Config.defaultChannel = 'general';
}

// Initialise bot
const bot = new Discord.Client();

// Load commands
var Commands = require('./commands.js');
var commands = new Commands(Config.prefix, bot);

var plugins = {};

bot.on('ready', function() {
    if (bot.user.username) {
        log('Connected as ' + bot.user.username);
    }

    if (Config.activity) {
        if (!Config.activityType) {
            Config.activityType = 0;
        }

        bot.user.setActivity(Config.activity, { type: Config.activityType }).then(() => {
            log('Set activity to "' + this.user.localPresence.game.name + '"');
        });
    }
});

bot.on('message', function(message) {
    commands.processCommand(message, false);
});

// Check to see if any users go live on Twitch
bot.on('updatePresence', function(oldMember, newMember) {
    if (newMember.presence.game.streaming instanceof String) {
        if (newMember.presence.game.streaming !== oldMember.presence.game.streaming) {
            try {
                newMember.guild.channels.find('name', Config.defaultChannel);
            } catch (e) {
                log(e);
            }
        }
    }
});

// React to adding a new guild/server
bot.on('guildCreate', guild => {
    log(`Joined new server; ${guild.name} (id: ${guild.id}) with ${guild.memberCount} members`);

    const channel = guild.channels.find('name', Config.defaultChannel);
    try {
        channel.send("Hey, I'm new here... Type **!help** for more information on what I can do for you!");
    } catch (e) {
        log(e);
    }
});

// React to a new user joining the server
bot.on('guildMemberAdd', function(member) {
    const channel = member.guild.channels.find('name', Config.defaultChannel)

    try {
        channel.send(`Welcome to the server, ${member}!`);
    } catch (e) {
        log(e);
    }
});

// React to a user leaving the server
bot.on('guildMemberRemove', function(member) {
    const channel = member.guild.channels.find('name', Config.defaultChannel)

    try {
        channel.send(`${member} has left the server!`);
    } catch (e) {
        log(e);
    }
});

bot.on('disconnect', function() {
    log(' .. Bot disconnected');
});

bot.on('debug', function(info) {
    log('DEBUG: ' + info);
});

// Load plugins automagically from /plugins (by default)
var  pluginBasePath = __dirname + Config.plugins.path;
fs.readdir(pluginBasePath, function(err, files) {
    files.forEach(function(file, index) {

        var filePath = path.join(pluginBasePath, file);
        fs.stat(filePath, function(err, stats) {
            // Check whether we're handling a plugin dir
            if (stats.isDirectory()) {
                console.log(`Loading plugin - ${file}...`);

                plugins[file] = {
                    "src": require(`./${Config.plugins.path}/${file}`)
                }
                plugins[file].object = new plugins[file].src(Config.plugins[file], bot, commands, db);
            }
        });
    });
});

// Check for token and login where appropriate
if (Config.token) {
    bot.login(Config.token);
} else {
    log(' .. ERROR: Unable to login, missing token');
    process.exit(1);
}

function log(message) {
    if (typeof message === 'object') {
        message = util.inspect(message, { showHidden: true, depth: null });
    } else {
        // Add timestamp
        message = dateFormat('HH:MM:ss') + ': ' + message;
    }

    console.log(message);
}

process.stdin.resume(); // So the program will not close instantly

function exitHandler() {
    if (bot.status !== 3) { // 0 online, 1 idle, 2 dnd, 3 offline
        log('Destroying bot...');
        bot.destroy();
    }

    process.exit()
}
process.on('SIGINT', exitHandler);
process.on('exit', exitHandler);

process.on('uncaughtException', function(e) {
    console.log('Uncaught Exception:');
    console.log(e.stack);
    process.exit(99);
});
