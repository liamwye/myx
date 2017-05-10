const rssParser = require('rss-parser');

var Rss = function(config, bot, db) {
    this.config = config;
    this.bot = bot;
    this.db = db;

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

    // Ensure the db has an RSS field to store the last published guid
    if (this.db.has('rss').value() == false) {
        this.db.set('rss', { guid: false })
            .write();
    }

    // Check the RSS feed every x ms, defined by config.frequency
    setInterval(this.checkFeed.bind(this), this.config.frequency);
}

Rss.prototype.checkFeed = function () {
    var self = this;

    // Fetch the ID for the last value that was published
    var lastPublished = self.db.get('rss.guid').value();

    rssParser.parseURL(self.config.url, function(err, parsed) {
      parsed.feed.entries.forEach(function(entry) {
          // Check the last guid that was published
          if (entry.guid !== lastPublished) {
              // Update the guid field
              self.db.get('rss')
                  .assign({ guid: entry.guid })
                  .write();

              self.channel.sendMessage(`**${parsed.feed.title}** (${entry.pubDate})\n${entry.title}\n${entry.link}`);
          }
      })
    });
};

module.exports = Rss;
