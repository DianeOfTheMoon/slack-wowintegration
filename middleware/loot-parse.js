var minimist = require('minimist');
var logger = require('winston');
var commands = ['init', 'activate', 'deactivate', 'seed', 'claim', 'display'];

module.exports = function(req, resp, next) {
	if (req.body && req.body.text) {
		var command = req.body.text.split(' ');
		if (commands.indexOf(command[0]) > -1) {
			req.lootCommand = command[0];
			req.lootOptions = minimist(command.slice(1));
			req.lootOptions.currentUser = req.body.user_name;
			req.lootKey = req.body.team_id + "." + req.body.channel_id;
			req.lootUser = req.body.user_name;
			if (req.lootOptions.item) {
				logger.debug('linking item');
				if (!req.wowSearch) {
					req.wowSearch = {
						id: req.lootOptions.item,
					};
					if (req.lootOptions.normal) {
						req.wowSearch.context = "raid-normal";
					}
					if (req.lootOptions.heroic) {
						req.wowSearch.context = "raid-heroic";
					}
					if (req.lootOptions.mythic) {
						req.wowSearch.context = "raid-mythic";
					}
				}
			}
		} else {
			resp.send("Usage: `" + req.body.command + " [" + commands.join(" ") + "] [options]`");
		}
		next();
	} else {
		next();
	}
}