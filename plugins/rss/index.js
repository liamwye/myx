const rssParser = require('rss-parser');

var Rss = function(config, bot) {
    this.config = config;
    this.bot = bot;

    // Define a var to hold the last guid that was published to Discord
    this.guid = false;

    // Cache the log channel
    var self = this;
    this.bot.on('ready', function() {
        self.channel = self.bot.channels.find('name', self.config.channel);
    });

    this.init();
};

Rss.prototype.init = function() {
    console.log(' + Initialising RSS plugin...');

    // Check the RSS feed every x ms, defined by config.frequency
    setInterval(this.checkFeed.bind(this), this.config.frequency);
}

Rss.prototype.checkFeed = function () {
    var self = this;

    rssParser.parseURL(self.config.url, function(err, parsed) {
      parsed.feed.entries.forEach(function(entry) {
          // Check the last guid that was published
          if (entry.guid !== self.guid) {
              // Update the guid field
              self.guid = entry.guid;

              self.channel.sendMessage(`**MMOChampion** (${entry.pubDate})\n${entry.title}\n${entry.link}`);
          }
      })
    });
};

module.exports = Rss;
