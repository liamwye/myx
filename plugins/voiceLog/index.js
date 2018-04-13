const dateFormat = require('dateformat');

var VoiceLog = function(config, bot) {
    this.config = config;
    this.bot = bot;

    this.init();
};

VoiceLog.prototype.init = function() {
    console.log(' + Initialising VoiceLog plugin...');
    var self = this;

    // Listen to voice state update event and log and channel moves/joins/connects
    this.bot.on('voiceStateUpdate', function(oldMember, newMember) {
        // Check for channel differences
        if (newMember.voiceChannel !== oldMember.voiceChannel) {
            var message = `**${dateFormat('HH:MM:ss')}:** ${oldMember.displayName} `;
            if (oldMember.voiceChannel === undefined) {
                message += `joined **${newMember.voiceChannel}** (connected)`;
            } else if(newMember.voiceChannel === undefined) {
                message += `disconnected`;
            } else {
                message += `moved from **${oldMember.voiceChannel}** to **${newMember.voiceChannel}**`;
            }

            // Get the channel to report to
            const channel = newMember.guild.channels.find('name', self.config.channel);

            // Send message to channel
            try {
                channel.send(message);
            } catch(e) {
                console.log(e);
            }
        }
    });
}

module.exports = VoiceLog;
