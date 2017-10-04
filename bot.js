const Discord = require('discord.js');
const path = require('path');
const dateFormat = require('dateformat');
const util = require('util');
const low = require('lowdb')

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
        log('Logged in as ' + bot.user.username);
    }

    if (Config.game) {
        bot.user.setGame(Config.game).then(() => {
            log('Set game to "' + this.user.localPresence.game.name + '"');
        });
    }
});

// Load plugins...
// TODO: Do this dynamically... loop over each dir and load the requirements
plugins.wow = {
    "src": require('./plugins/wow')
}
plugins.wow.object = new plugins.wow.src(Config.plugins.wow, bot, commands, db);
plugins.voiceLog = {
    "src": require('./plugins/voiceLog')
}
plugins.voiceLog.object = new plugins.voiceLog.src(Config.plugins.voiceLog, bot, commands, db);
//plugins.rss = {
    "src": require('./plugins/rss')
}
//plugins.rss.object = new plugins.rss.src(Config.plugins.rss, bot, commands, db);
plugins.warcraftLogs = {
    "src": require('./plugins/warcraftLogs')
}
plugins.warcraftLogs.object = new plugins.wa rcraftLogs.src(Config.plugins.warcraftLogs, bot, commands, db);


bot.on('message', function(message) {
    commands.processCommand(message, false);
});

bot.on('messageUpdate', function(oldMessage, newMessage) {
    commands.processCommand(newMessage, true);
});

bot.on('guildMemberAdd', function(member) {
    sendChannelMessage(`Welcome to the server, ${member}!`, Config.defaultChannel);
});

bot.on('disconnect', function() {
    log(' .. Bot disconnected');
});

bot.on('debug', function(info) {
    //log('  DEBUG: ' + info);
});

// Check for token and login where appropriate
if (Config.token) {
    bot.login(Config.token);
} else {
    log(' .. ERROR: Unable to login, missing token');
    process.exit(1);
}

// Attempt to send a channel message
function sendChannelMessage(message, channel) {
    channel = bot.channels.find('name', channel);

    try {
        channel.send(message);
    } catch(e) {
        log(e);
    }
}

function get24HourTime() {
    return dateFormat('HH:MM:ss');
}

function log(message) {
    if (typeof message === 'object') {
        message = util.inspect(message, { showHidden: true, depth: null });
    } else {
        // Add timestamp
        message = get24HourTime() + ': ' + message;
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
