const rssParser = require('rss-parser');

var Rss = function(config, bot, commands, db) {
    this.config = config;
    this.bot = bot;
    this.db = db;
    this.commands = commands;

    // Ensure we have some defaults defined with the commands?


    // Cache the log channel
    // TODO: Make this an inherited function for all plugins
    var self = this;
    this.bot.on('ready', function() {
        self.channel = self.bot.channels.find('name', self.config.channel);
    });

    this.init();
};

Rss.prototype.init = function() {
    console.log(' + Initialising RSS plugin...');

    // Define an rss command to fetch the last feed item
    var self = this;
    this.commands.addCommand(this.config.command, this.config.command, "View the last item fetched from the RSS feed.", function(message) {
        self.checkFeed(message.channel);
    });

    // Ensure the db has an RSS field to store the last published guid
    if (this.db.has('rss').value() == false) {
        this.db.set('rss', { guid: false })
            .write();
    }

    // Check the RSS feed every x ms, defined by config.frequency
    setInterval(this.checkFeed.bind(this), this.config.frequency);
}

Rss.prototype.checkFeed = function(alternateChannel) {
    var self = this;
    alternateChannel = typeof alternateChannel !== 'undefined' ? alternateChannel : false;

    // Fetch the ID for the last value that was published
    var lastPublished = self.db.get('rss.guid').value();

    rssParser.parseURL(self.config.url, function(err, parsed) {
      parsed.feed.entries.forEach(function(entry) {
          // Check the last guid that was published OR override if we have a specified channel to publish to
          if (entry.guid !== lastPublished || alternateChannel !== false) {
              // Update the guid field
              self.db.get('rss')
                  .assign({ guid: entry.guid })
                  .write();

              var message = `**${parsed.feed.title}** (${entry.pubDate})\n${entry.title}\n${entry.link}`;

              // Check whether we were passed an alternate channel to publish to
              if (alternateChannel !== false) {
                  alternateChannel.sendMessage(message);
              } else {
                  self.channel.sendMessage(message);
              }
          }
      })
    });
};

module.exports = Rss;
