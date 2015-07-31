if (process.env.REDISTOGO_URL) {
	// TODO: redistogo connection
	var rtg   = require("url").parse(process.env.REDISTOGO_URL);
	var redis = require("redis").createClient(rtg.port, rtg.hostname);

	redis.auth(rtg.auth.split(":")[1]);
} else {
	var redis = require("redis").createClient();
}

var logger = require('winston');

module.exports = {
	loader: function(req, resp, next) {
		if (req.lootKey) {
			logger.debug('checking for loot key ' + req.lootKey);
			redis.get(req.lootKey, function (err, data) {
				//TODO what about when the data is corrupt?
				req.lootData = JSON.parse(data);

				redis.lrange(req.lootKey + ".log", 0, 10, function(err, logData) {
					if (logData != "") {
						var logResult = [];
						for (var i = 0; i < logData.length; i++) {
							logResult.push(JSON.parse(logData[i]));
						}
						req.lootLog = logResult;
					}
					next();
				});
			});
		} else {
			next();
		}
	},
	saver: function (req, resp, next) {
		if (req.lootSave && req.lootData) {
			logger.debug('saving data');
			redis.set(req.lootKey, JSON.stringify(req.lootData), function (err, result) {
				if (err) {
					next(err);
				} else {
					logger.debug("Looking for log data to save");
					if (req.lootLogData) {
						logger.debug("Found");
						redis.lpush(req.lootKey + ".log", JSON.stringify(req.lootLogData), function (err, result) {
							if (err) {
								next(err);
							} else {
								next();
							}
						});
					}
					next();
				}
			});
		} else {
			next();
		}
	}
}