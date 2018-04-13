var Twitter = function(config, bot, commands, db) {
    this.config = config;
    this.bot = bot;
    this.db = db;
    this.commands = commands;

    this.init();
};

Twitter.prototype.init = function() {
    console.log(' + Initialising Twitter plugin...');

    // TODO: Each guild/server needs to have a seperate list of twitter accounts to monitor
    // .. Stored in db.json
    // .. Can be added and removed using commands as a server admin?? !twitter add @mixehh / !twitter remove @mixehh
}

module.exports = Twitter;
