var minimist = require('minimist');

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
		} else {
			resp.send("Usage: `" + req.body.command + " [" + commands.join(" ") + "] [options]`");
		}
		next();
	}
}