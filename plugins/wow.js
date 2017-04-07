var Wow = function(config, bot) {
    this.bot = bot;
    this.config = config;

    // Define a base roster in memory
    this.roster = {};

    this.init();
};

Wow.prototype.init = function() {
    console.log(' + Initialising WoW plugin...');

    // Initialise the WoW API
    this.api = require('blizzard.js').initialize({
        apikey: this.config.key
    });

    // Fetch an initial roster
    this.getRoster();
}

Wow.prototype.getRoster = function () {
    return this.api.wow.guild(['members'], { realm: this.config.realm, name: this.config.guild, origin: this.config.region})
        .then(response => {
            for (var i = 0; i < response.data.members.length; i++) {
                // Fetch characters with the correct ranks
                if (response.data.members[i].rank <= this.config.ranks.cutoff && this.config.ranks.ignore.indexOf(response.data.members[i].rank) == -1) {
                    this.roster[response.data.members[i].character.name] = {
                        "name": response.data.members[i].character.name,
                        "rank": this.getRankName(response.data.members[i].rank)
                    };
                }
            }
        });
};

Wow.prototype.getRankName = function(id) {
    return this.config.ranks.mask[id];
};

module.exports = Wow;
