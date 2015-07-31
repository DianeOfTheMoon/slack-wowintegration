var logger = require("winston");
if (process.env.REDISTOGO_URL) {
	// TODO: redistogo connection
	var rtg   = require("url").parse(process.env.REDISTOGO_URL);
	var redis = require("redis").createClient(rtg.port, rtg.hostname);

	redis.auth(rtg.auth.split(":")[1]);
} else {
	var redis = require("redis").createClient();
}

module.exports = function(req, resp, next) {
	logger.silly('checking for loot command');
	if (req.lootCommand && Object.keys(commands).indexOf(req.lootCommand) > -1) {
		logger.debug('validating loot options', req.lootOptions);
		var validationResult = commands[req.lootCommand].validate(req.lootOptions, req.lootData);
		if (validationResult !== true) {
			logger.silly("not valid");
			if (typeof validationResult == 'string') {
				logger.silly("validation result: " + validationResult);
				resp.send(validationResult);
			} else {
				logger.silly("failed basic");
				resp.send("Usage: " + req.body.command + " " + req.lootCommand + " " + commands[req.lootCommand].commandString);
			}
			next("err");
		} else {
			logger.silly("looks valid");
			var commandResult = commands[req.lootCommand].execute(req.lootOptions, req.lootData);
			req.lootSave = commandResult[0];
			req.lootData = commandResult[1];
			req.lootLog = commandResult[2];
			next();
		}
	} else {
		logger.silly("next middleware");
		next();
	}
}

var commands = {
	"init": {
		"validate": function(options, data) {
			if (options.admin) {
				if (typeof options.admin == 'string') {
					options.admin = [options.admin];
				}
				if (options._.length == 0) {
					return false;
				}
				if (!data) {
					return true;
				} else {
					if (data.admin.indexOf(options.currentUser) == -1) {
						return "Unable to init existing loot table due to lack of admin rights.";
					}

					return true;
				}
			}
			return false;
		},
		"execute": function(options, data) {
			var initMembers = [];
			for(var i = 0; i < options._.length; i++) {
				initMembers.push({
					name: options._[i].toLowerCase(),
					status: "active"
				});
			}
			var newLootList = {
				admin: options.admin,
				members: initMembers
			};
			return [true, newLootList, null];
		},
		commandString: "--admin=<slack_user_name>[ --admin=<slack_user_name>] <name>[ <name>[ <name>]]"
	},
	"activate": {
		"validate": function(options, data) {
			if (!isAdmin(options, data)) {
				return "You do not have permission to manage this loot list";
			}
			for (var i = 0; i < data.members.length; i++) {
				if (data.members[i].name == options._[0].toLowerCase()) {
					if (data.members[i].status == "inactive") {
						return true;
					} else {
						return "That user is already active";
					}
				}
			}
			return false;
		},
		"execute": function(options, data) {
			var memberName = options._[0].toLowerCase();
			for (var i = 0; i < data.members.length; i++) {
				if (data.members[i].name == memberName) {
					data.members[i].status = "active";
				}
			}
			return [true, data, null];
		},
		commandString: "<name>[ <name>[ <name>]]"
	},
	"deactivate": {
		"validate": function(options, data) {
			if (!isAdmin(options, data)) {
				return "You do not have permission to manage this loot list";
			}
			for (var i = 0; i < data.members.length; i++) {
				if (data.members[i].name == options._[0].toLowerCase()) {
					if (data.members[i].status == "active") {
						return true;
					} else {
						return "That user is already inactive";
					}
				}
			}
			return false;
		},
		"execute": function(options, data) {
			var memberName = options._[0].toLowerCase();
			for (var i = 0; i < data.members.length; i++) {
				if (data.members[i].name == memberName) {
					data.members[i].status = "inactive";
				}
			}
			return [true, data, null];
		},
		commandString: "<name>[ <name>[ <name>]]"
	},
	"seed": {
		"validate": function(options, data) {
			if (!data) {
				return "Please init first";
			} else if (options._.length != 1) {
				return false;
			} else if (!(options.first || options.last || options.random)) {
				return false;
			} else if (!isAdmin(options, data)) {
				logger.info("Non admin " + options.currentUser + " attempting seed");
				return "You do not have permission to manage this loot list";
			} else {
				for (var i = 0; i < data.members.length; i++) {
					if (data.members[i].name == options._[0].toLowerCase()) {
						return "Name " + options._[0] + " already exists";
					}
				}
			}
			return true;
		},
		"execute": function(options, data) {
			var member = {
				name: options._[0].toLowerCase(),
				status: "active"
			};
			if (options.last) {
				data.members.push(member);
			} else if (options.first) {
				data.members.unshift(member);
			} else {
				data.members.splice(getRandomInt(0, data.members.length - 1), 0, member);
			}
			return [true, data, null];
		},
		commandString: "<name>[ --first| --last| --random]"
	},
	"claim": {
		"validate": function(options, data) {
			var searchName = options._[0].toLowerCase();
			if (!isAdmin(options, data)) {
				return "You do not have permission to manage this loot list";
			}
			for (var i = 0; i < data.members.length; i++) {
				logger.debug(data.members[i], searchName);
				if (data.members[i].name == searchName) {
					options.claimIndex = i;
					return true;
				}
			}
			return false;
		},
		"execute": function(options, data) {
			var movingElem = data.members[options.claimIndex];
			for (var i = data.members.length - 1; i >= options.claimIndex; i--) {
				if (data.members[i].status == "active") {
					movingElem = data.members.splice(i, 1, movingElem)[0];
					logger.debug(data);
				}
			}
			logger.debug(data);
			return [true, data, null];
		},
		commandString: "<name>[ --date=<date>][ --item=<item_id>]"
	}
}

var template = {
	admin: [],
	members: [{
		name: "",
		status: ""
	}]
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isAdmin(options, data) {
	return data.admin.indexOf(options.currentUser) > -1;
}