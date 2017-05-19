const rssParser = require('rss-parser');
const dateFormat = require('dateformat');

var Rss = function(config, bot, commands, db) {
    this.config = config;
    this.bot = bot;
    this.db = db;
    this.commands = commands;

    // Cache the log channel
    var self = this;
    this.bot.on('ready', function() {
        self.channel = self.bot.channels.find('name', self.config.channel);
    });

    this.init();
};

Rss.prototype.init = function() {
    console.log(' + Initialising RSS plugin...');

    // Define an rss command to fetch the last feed item, for each feed
    for (var i = 0; i < this.config.feeds.length; i++) {
        this.addCommand(this.config.feeds[i].id);
    }

    // Check the RSS feed every x ms, defined by config.frequency
    setInterval(this.check.bind(this), this.config.frequency);
}

Rss.prototype.addCommand = function (feed) {
    var self = this;
    this.commands.addCommand(feed, feed, `show the last ${self.config.limit} items published on ${feed}.`, function(message) {
        self.check(feed, message.channel);
    });
};

Rss.prototype.check = function(feedId, channel) {
    var self = this;
    var lastPublished = 0
    var messages = [];

    // Check whether we've been passed a seperate channel to send to
    channel = typeof channel !== 'undefined' ? channel : false;

    // Check whether we've been passed a specific feed to process
    feedId = typeof feedId !== 'undefined' ? feedId : false;

    // Fetch any entries that have yet to be published
    for (var i = 0; i < self.config.feeds.length; i++) {
        var feed = self.config.feeds[i];
        if (feedId !== false && feedId !== feed.id) {
            continue;
        }

        rssParser.parseURL(feed.url, function(err, parsed) {
            // Fetch the pubDate of the last published entry for this feed
            lastPublished = self.getLastPublishedDate(parsed.feed.title);

            parsed.feed.entries.forEach(function(entry) {
                // Check whether this entry has been published OR override if we have a specified channel to publish to
                // .. A specified channel implies we've been asked for the last x entries to show immediately
                var entryDate = new Date(entry.pubDate);
                if ((entryDate - lastPublished) > 0 || channel !== false) {
                    var date = dateFormat(entryDate, 'dddd, mmmm dS, yyyy, HH:MM:ss');
                    messages.push(`**${parsed.feed.title}** (${date})\n${entry.title}\n${entry.link}`)
                }
            });

            // Check whether we have messages to send
            if (messages.length > 0) {
                // Loop through the entries and send them (to a maximum of x entries)
                for (var j = 0; j < self.config.limit; j++) {
                    self.send(messages[j], channel);
                }

                // Update the last published date
                // .. Only update this for a regular internval publishing
                if (channel == false) {
                    self.updateLastPublishedDate(parsed.feed.title);
                }
            }

            // Reset messages array
            messages = [];
        });
    }
};

Rss.prototype.send = function (message, channel) {
    // Check whether we were passed an alternate channel to publish to
    if (channel !== false) {
        return channel.send(message);
    }

    // Otherwise, stick to ol' faithful
    return this.channel.send(message);
};

Rss.prototype.getLastPublishedDate = function (id) {
    var date = this.db.get(`rss.${id}.pubDate`).value();
    date = typeof date !== 'undefined' ? date : 0;

    // Convert to date object for comparison
    return new Date(date);
};

Rss.prototype.updateLastPublishedDate = function (id) {
    if (this.db.has(`rss.${id}`).value() == false) {
        return this.db.set(`rss.${id}`, { pubDate: new Date() })
            .write();
    }

    return this.db.get(`rss.${id}`)
        .assign({ pubDate: new Date() })
        .write();
};

module.exports = Rss;
