const Discord = require('discord.js');
const express = require('express');
const WebSocketServer = require('ws').Server;
const path = require('path');
const dateFormat = require('dateformat');
const util = require('util');

// Initialise the ws
const ws = require('ws');
const wss = new WebSocketServer({ port: 2222});

wss.on('connection', function(ws) {
    log('Client connected to web interface');

    ws.on('close', function() {
        log('Client disconnected from web interface');
    })
});

function sendClientMessage(message) {
    wss.clients.forEach(function(client) {
        client.send(message);
    });
}

// Initialise the server
var server = express();

// Define settings
const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, '/www/index.html');

server.use(function(request, response) {
    response.sendFile(INDEX);
});

server.listen(PORT, function () {
  log(`Web interface listening on port ${PORT}`);
})


log("Forking Myx\n * Node " + process.version + "\n * Discord.js v" + Discord.version);


// Load configuration
var Config = require('./config.json');

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
    log(' .. Bot started')
    if (bot.user.username) {
        log(' .. Bot has logged in as ' + bot.user.username);
    }

    if (Config.game) {
        bot.user.setGame(Config.game).then(() => {
            log(' .. Bot set game to "' + this.user.localPresence.game.name + '"');
        });
    }

    // Load plugins...
    // TODO: Do this dynamically - loop over dir and load each
    plugins.wow = {
        "class": require('./plugins/wow.js')
    }
    plugins.wow.object = new plugins.wow.class(Config.plugins.wow, bot);

});

bot.on('message', function(message) {
    commands.processCommand(message, false);
});

bot.on('messageUpdate', function(oldMessage, newMessage) {
    commands.processCommand(newMessage, true);
});

bot.on('guildMemberAdd', function(member) {
    sendChannelMessage(`Welcome to the server, ${member}!`, Config.defaultChannel);
});

bot.on('voiceStateUpdate', function(oldMember, newMember) {
    if (Config.voiceLogChannel && (newMember.voiceChannel !== oldMember.voiceChannel)) {
        var message = `**${get24HourTime()}:** ${oldMember.displayName} `;

        if (oldMember.voiceChannel === undefined) {
            message += `joined **${newMember.voiceChannel}** (connected)`;
        } else if(newMember.voiceChannel === undefined) {
            message += `disconnected`;
        } else {
            message += `moved from **${oldMember.voiceChannel}** to **${newMember.voiceChannel}**`;
        }

        sendChannelMessage(message, Config.voiceLogChannel);
    }
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
    var channel = bot.channels.find('name', channel);

    try {
        channel.sendMessage(message);
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
    sendClientMessage(message);
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
