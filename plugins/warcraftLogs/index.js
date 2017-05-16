const api = require('weasel.js');
const dateFormat = require('dateformat');

var WarcraftLogs = function(config, bot, commands, db) {
    this.config = config;
    this.bot = bot;
    this.db = db;
    this.commands = commands;

    // Cache the log channel wew should be posting to
    var self = this;
    this.bot.on('ready', function() {
        self.channel = self.bot.channels.find('name', self.config.channel);
    });

    this.init();
};

WarcraftLogs.prototype.init = function() {
    console.log(' + Initialising WarcraftLogs plugin...');

    // Define the wcl api key
    api.setApiKey(this.config.key);

    // Ensure the db has a wcl field to store the last published report
    if (this.db.has('wcl').value() == false) {
        this.db.set('wcl', { id: false })
            .write();
    }
    
    // Check the RSS feed every x ms, defined by config.frequency
    setInterval(this.check.bind(this), this.config.frequency);
}

WarcraftLogs.prototype.check = function(alternateChannel) {
    // Check to see if we need to post to an different channel
    alternateChannel = typeof alternateChannel !== 'undefined' ? alternateChannel : false;
    var self = this;

    // Fetch the ID for the last value that was published
    var lastPublished = self.db.get('wcl.id').value();

    api.getReportsGuild(self.config.guild, self.config.realm, self.config.region, {}, function(err, data) {
        if (err) {
            console.log(err);
            return;
        }

        // Get the last log that was published
        data = data.pop();

        // Check that we haven't published this log
        if (data.id !== lastPublished || alternateChannel !== false) {
            // Update the log id field
            self.db.get('wcl')
                .assign({ id: data.id })
                .write();

            var date = dateFormat(data.start, "dd/mm/yyyy");
            var url = self.config.url + data.id;
            var message = `**${date}** ${data.title}: ${url}`;

            // Check whether we were passed an alternate channel to publish to
            if (alternateChannel !== false) {
                alternateChannel.sendMessage(message);
            } else {
                self.channel.sendMessage(message);
            }
        }
    });
};

module.exports = WarcraftLogs;
