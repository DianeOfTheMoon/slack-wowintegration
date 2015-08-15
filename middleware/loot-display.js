var Slack = require('slack-node');
var logger = require('winston');

var lootDisplay = {
	sendData: function(params, callback) {
		var slack = new Slack();
		logger.silly(params);
		slack.setWebhook(process.env.LOOT_WEBHOOK || "__hook_not_defined__");
		slack.webhook(params, callback);
	},
	middleware: function(req, resp, next) {
		logger.debug("checking for display: " + req.lootCommand);
		if (req.lootCommand && req.lootCommand == "display") {
			logger.debug(req.lootData.members);

			var respChannel = "#" + req.body.channel_name;
			var listData = getListData(req.lootData.members, (req.lootOptions.active && req.lootOptions.active == true));
			var attachments = null;

			if (req.lootOptions['log'] == true) {
				logger.debug('adding log');
				attachments = req.lootLog;	
			}

			var params = {
				channel: respChannel,
				text: listData,
				attachments: attachments
			};

			lootDisplay.sendData(params, function(err, response) {
				logger.silly('sent display');
				if (err) {
					logger.info(err, response);
					resp.send(response);
				} else {
					resp.send("");
				}
			});
		} else {
			next();
		}
	}
};

module.exports = lootDisplay;

function getListData(members, activeOnly) {
	var data = "";
	var returnCount = 0;
	for (var i = 0; i < members.length; i++) {
		var prefix = "\n" + (i + 1) + ": ";
		var suffix = "";
		if(members[i].status == "active") {
			prefix += "*";
			suffix += "*";
		}
		if ((activeOnly && members[i].status == "active") || !activeOnly) {
			returnCount++;
			data += prefix + members[i].name + suffix;
		}
	}

	return "Current List for " + returnCount + " Users:" + data;
}