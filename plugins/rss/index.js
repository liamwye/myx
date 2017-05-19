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

    // Initialise the db
    this.initDb();

    // Check the RSS feed every x ms, defined by config.frequency
    setInterval(this.check.bind(this), this.config.frequency);
}

Rss.prototype.initDb = function () {
    // Define a default date, 5 days ago to show content from
    var dateOffset = (24*60*60*1000) * 5; //5 days
    var date = new Date();
    date.setTime(date.getTime() - dateOffset);

    // Ensure the db has an RSS field to store the last published date
    for (var i = 0; i < this.config.feeds.length; i++) {
        if (this.db.has(`rss.${this.config.feeds[i].id}`).value() == false) {
            this.db.set(`rss.${this.config.feeds[i].id}`, { pubDate: date })
                .write();
        }
    }
};

Rss.prototype.addCommand = function (feed) {
    var self = this;
    this.commands.addCommand(feed, feed, "View the last item fetched from the RSS feed.", function(message) {
        self.check(feed, message.channel);
    });
};

Rss.prototype.check = function(feedId, channel) {
    var self = this;
    var lastPublished = false
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

        // Fetch the pubDate of the last published entry for this feed
        lastPublished = self.getLastPublishedDate(feed.id);

        rssParser.parseURL(feed.url, function(err, parsed) {
            parsed.feed.entries.forEach(function(entry) {
                // Check whether this entry has been published OR override if we have a specified channel to publish to
                // .. A specified channel implies we've been asked for the last x entries to show immediately
                var entryDate = new Date(entry.pubDate);
                if (entryDate < lastPublished || channel !== false) {
                    var date = dateFormat(entryDate, 'dddd, mmmm dS, yyyy, HH:MM:ss');
                    messages.push(`**${parsed.feed.title}** (${date})\n${entry.title}\n${entry.link}`)
                }
            });

            // Check whether we have messages to send
            if (messages.length > 0) {
                // Loop through the entries and send them (to a maximum of x entries)
                for (var i = 0; i < self.config.limit; i++) {
                    self.send(messages[i], channel);
                }

                // Update the last published date
                // .. Only update this for a regular internval publishing
                if (channel == false) {
                    self.updateLastPublishedDate(feed.id);
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

    // Convert to date object for comparison
    date = new Date(date);

    return date;
};

Rss.prototype.updateLastPublishedDate = function (id) {
    return this.db.get(`rss.${id}`)
        .assign({ pubDate: new Date() })
        .write();
};

module.exports = Rss;
