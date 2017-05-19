var Commands = function(prefix, bot) {
    this.prefix = prefix;
    this.bot = bot;
};

Commands.prototype.processCommand = function(message, isUpdate) {
    // Check the sender for a command prefix
    if (message.author.id != this.bot.user.id && (message.content.startsWith(this.prefix))) {
        var commandText = message.content.split(" ")[0].substring(this.prefix.length);

        // Force lowercase text
        commandText = commandText.toLowerCase();

        // Check for "special" help command
        if (commandText == 'help') {
            var response = "```Markdown\n";
            response += "commands\n========\n"

            for (var key in this.commands) {
                response += '* ' + this.prefix + this.commands[key].usage + ' => ' + this.commands[key].description + "\n";
            }
            response += '```';

            message.channel.send(response);
            console.log(" .. COMMAND: Bot processed " + this.prefix + 'help');
        } else {
            try {
                this.commands[commandText].process.bind(this)(message)
            } catch(e) {
                console.log(" .. ERROR: Bot command failed; " + this.prefix + commandText);
                console.log(e);
            }
        }
    }

    return false;
}

Commands.prototype.addCommand = function(name, usage, description, processFunction) {
    // Allow overwriting of commands?
    this.commands[name] = {
        "usage": usage,
        "description": description,
        "process": processFunction
    };
};

Commands.prototype.commands = {
    "quote": {
        "usage": "quote",
        "description": "random channel quote.",
        "process": function(message) {
            return message.channel.fetchPinnedMessages()
                .then((pins) => {
                    var pin = pins.random();

                    var response = `${pin.author}: ${pin.content}`;

                    // Check for an attachment
                    if(pin.attachments !== 'undefined') {
                        var file = pin.attachments.first();

                        return message.channel.sendFile(file.url, file.filename, response);
                    }

                    return message.channel.send(response);
                });
        }
    },
    "sco": {
        "usage": "sco",
        "description": "sexiest man on earth.",
        "process": function(message) {
            var images = [
                'https://pbs.twimg.com/profile_images/653684583985053697/KJPoBWDk.png',
                'https://pbs.twimg.com/media/CiS9-UFWwAAWGGr.jpg',
                'https://pbs.twimg.com/media/CooAR0MWEAAeBVJ.jpg',
                'https://pbs.twimg.com/media/Chy2hWyWUAABAQ-.jpg'
            ];

            // Send as text rather than an image file...
            return message.channel.send(images[Math.floor(Math.random() * images.length)]);
        }
    },
    "uptime": {
        "usage": "uptime",
        "description": "check the bot uptime.",
        "process": function(message) {
            var uptime = new Date(this.bot.uptime);

            var uptimeMessage = uptime.getSeconds() + ' seconds';
            if (uptime.getMinutes() > 0) {
                uptimeMessage = uptime.getMinutes() + ' minutes and ' + uptimeMessage;
            }
            if (uptime.getHours() > 0) {
                uptimeMessage = uptime.getHours() + ' hours, ' + uptimeMessage;
            }

            return message.channel.send(uptimeMessage)
        }
    }
};

module.exports = Commands;
