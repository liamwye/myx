module.exports = {
    "test": {
        "usage": "!test",
        "description": "Test command...",
        "process": function(message) {
            message.channel.send("hej");
        }
    }
};
