var Slack = require('slack-node');
slack = new Slack();
slack.setWebhook(process.env.LOOT_WEBHOOK || "__hook_not_defined__");
var logger = require('winston');

module.exports = function(req, resp, next) {
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
		logger.debug(params);
		slack.webhook(params, function(err, response) {
			logger.debug('sent display');
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


function getListData(members, activeOnly) {
	var data = "Current List:";

	for (var i = 0; i < members.length; i++) {
		var prefix = "\n" + (i + 1) + ": ";
		var suffix = "";
		if(members[i].status == "active") {
			prefix += "*";
			suffix += "*";
		}
		if ((activeOnly && members[i].status == "active") || !activeOnly) {
			data += prefix + members[i].name + suffix;
		}
	}
	return data;
}