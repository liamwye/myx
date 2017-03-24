//https://discordapp.com/oauth2/authorize?client_id=294361039880060928&scope=bot&permissions=2146958463

const Discord = require('discord.js');

// Load web interface
const express = require('express');
const WebSocketServer = require('ws').Server;
const path = require('path');

// Initialise the ws
const ws = require('ws');
const wss = new WebSocketServer({ port: 2222});

wss.on('connection', function(ws) {
    console.log('Client connected to web interface');
    ws.on('close', function() {
        console.log('Client disconnected from web interface');
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
  console.log(`Web interface listening on port ${PORT}`);
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

// Load commands
var Commands = require('./commands.js');

// Initialise bot
const bot = new Discord.Client();

bot.on('ready', function() {
    log(' .. Bot started')
    if (bot.user.username) {
        log(' .. Bot has logged in as ' + bot.user.username);
    }

    if (Config.game) {
        bot.user.setGame(Config.game);
        log(" .. Bot set game to " + Config.game);
    }

    // Load plugins?
});

bot.on('message', function(message) {
    processCommand(message, false);
});

bot.on('guildMemberAdd', function(member) {
    sendChannelMessage(`Welcome to the server, ${member}!`, Config.defaultChannel);
});

bot.on('voiceStateUpdate', function(oldMember, newMember) {
    if (Config.voiceLogChannel) {
        var message = `${oldMember} has `;

        if (oldMember.voiceChannel === undefined) {
            message += `joined **${newMember.voiceChannel}** (connected)`;
        } else if(newMember.voiceChannel === undefined) {
            message += `left **${oldMember.voiceChannel}** (disconnected)`;
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
    log('  DEBUG: ' + info);
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

// Check to see if a message contains a command for the bot
function processCommand(message, isUpdate) {
    // Check the sender and for a command prefix
    if (message.author.id != bot.user.id && (message.content.startsWith(Config.prefix))) {
        var commandText = message.content.split(" ")[0].substring(Config.prefix.length);

        try {
            Commands[commandText].process(message, isUpdate);
            log(" .. COMMAND: Bot processed " + Config.prefix + commandText)
        } catch(e) {
            log(" .. ERROR: Bot command failed; " + Config.prefix + commandText);
            log(e);
        }
    }

    return false;
}

function log(message) {
    console.log(message);
    sendClientMessage(message);
}
