//https://discordapp.com/oauth2/authorize?client_id=294361039880060928&scope=bot&permissions=2146958463

const Discord = require('discord.js');

console.log("Forking Myx\n * Node " + process.version + "\n * Discord.js v" + Discord.version);


// Load configuration
var Config = require('./config.json');
// Ensure we have a config prefix
if (!Config.prefix) {
    Config.prefix = "!";
}

// Ensure we have a default channel
if (!Config.defaultChannel) {
    Config.defaultChannel = 'general';
}

// Load commands
var Commands = require('./commands.js');

// Initialise bot
const bot = new Discord.Client();

bot.on('ready', function() {
    console.log(' .. Bot started')
    if (bot.user.username) {
        console.log(' .. Bot has logged in as ' + bot.user.username);
    }

    if (Config.game) {
        bot.user.setGame(Config.game);
        console.log(" .. Bot set game to " + Config.game);
    }
});

bot.on('message', function(message) {
    processCommand(message, false);
});

bot.on('guildMemberAdd', function(member) {
    sendChannelMessage(`Welcome to the server, ${member}!`, Config.defaultChannel);
});

bot.on('voiceStateUpdate', function(oldMember, newMember) {
    var message = `${oldMember} has `;

    if (oldMember.voiceChannel === undefined) {
        message += `joined **${newMember.voiceChannel}** (connected)`;
    } else if(newMember.voiceChannel === undefined) {
        message += `left **${oldMember.voiceChannel}** (disconnected)`;
    } else {
        message += `moved from **${oldMember.voiceChannel}** to **${newMember.voiceChannel}**`;
    }

    sendChannelMessage(message, Config.voiceLogChannel);
});

bot.on('disconnected', function() {
    console.log(' .. Bot disconnected');
    process.exit(1);
});

// Check for token and login where appropriate
if (Config.token) {
    bot.login(Config.token);
} else {
    console.log(' .. ERROR: Unable to login, missing token');
    process.exit(1);
}



// Attempt to send a channel message
function sendChannelMessage(message, channel) {
    var channel = bot.channels.find('name', channel);

    try {
        channel.sendMessage(message);
    } catch(e) {
        console.error(e);
    }
}

// Check to see if a message contains a command for the bot
function processCommand(message, isUpdate) {
    // Check the sender and for a command prefix
    if (message.author.id != bot.user.id && (message.content.startsWith(Config.prefix))) {
        var commandText = message.content.split(" ")[0].substring(Config.prefix.length);

        try {
            Commands[commandText].process(message, isUpdate);
            console.log(" .. COMMAND: Bot processed " + Config.prefix + commandText)
        } catch(e) {
            console.log(" .. ERROR: Bot command failed; " + Config.prefix + commandText);
            console.error(e);
        }
    }

    return false;
}
