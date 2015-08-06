var logger = require("winston");
var moment = require("moment");

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
		} else {
			logger.silly("looks valid");
			req.lootOptions.wowItem = req.wowItem;
			var commandResult = commands[req.lootCommand].execute(req.lootOptions, req.lootData);
			req.lootSave = commandResult[0];
			req.lootData = commandResult[1];
			req.lootLogData = commandResult[2];
			if (commandResult.length = 4) {
				req.sendResponse = commandResult[3];
			}
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
			return [true, newLootList, getInitLog(options, data), "List initialized"];
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
			var membernameList = [];
			for (var i = 0; i < options._.length; i++) {
				var memberName = options._[i].toLowerCase();
				for (var j = 0; j < data.members.length; j++) {
					if (data.members[j].name == memberName) {
						data.members[j].status = "active";
						membernameList.push(memberName);
						break;
					}
				}
			}
			return [true, data, null, membernameList.join(", ") + " has been activated"];
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
			var membernameList = [];
			for (var i = 0; i < options._.length; i++) {
				var memberName = options._[i].toLowerCase();
				for (var j = 0; j < data.members.length; j++) {
					if (data.members[j].name == memberName) {
						data.members[j].status = "inactive";
						membernameList.push(data.members[j].name);
						break;
					}
				}
			}
			return [true, data, null, membernameList.join(", ") + " has been deactivated."];
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
			return [true, data, getSeedLog(options, data), "Name has been seeded"];
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
			var characterName = movingElem.name;
			if (options.date) {
				var date = moment(options.date);	
			} else {
				var date = moment();
			}
			
			for (var i = data.members.length - 1; i >= options.claimIndex; i--) {
				if (data.members[i].status == "active") {
					movingElem = data.members.splice(i, 1, movingElem)[0];
					logger.debug(data);
				}
			}
			logger.debug(data);
			return [true, data, getClaimLog(options, data, characterName, date), "Claim has been processed for " + characterName];
		},
		commandString: "<name>[ --date=<date>][ --item=<item_id>[ --normal][ --heroic][ --mythic]]"
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

function getInitLog(options, data) {
	return {
		fallback: "List Initialized with " + options.admin.join(', '),
		pretext: "List Initialized",
		text: "Admins are: " + options.admin.join(', '),
	}
}

function getClaimLog(options, data, character, date) {
	if (!options.wowItem) {
		var baseText = character + " claimed an item";
	} else {
		var baseText = character + " claimed <" + options.wowItem.webUrl + "|" + options.wowItem.name + ">";
	}
	return {
		fallback: baseText,
		pretext: baseText,
		text: "Claimed on " + date.format("YYYY/MM/DD"),
	}
}

function getSeedLog(options, data) {
	var characterName = options._[0].toLowerCase();
	var text = characterName;
	if (options.first) {
		text += " was added to the top of the list.";
	} else if (options.last) {
		text += " was added to the end of the list.";
	} else {
		text += " was added randomly into the list.";
	}
	return {
		fallback: "Character " + characterName + " added to list.",
		pretext: "Character " + characterName + " added to list.",
		text: text
	}
}