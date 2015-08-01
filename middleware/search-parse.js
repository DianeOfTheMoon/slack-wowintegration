var logger = require('winston');
var base_url = "https://us.battle.net/wow/en/search?f=wowitem&q=";

module.exports = function(req, res, next) {
	if (req.body && req.body.text) {
		logger.debug("Found search body text, parsing for wow site search");
		req.wowSearch = {};
		req.wowSearch.options = parse_options(req.body.text);
		req.wowSearch.searchString = remove_options(req.body.text);
	}
	next();
}

function parse_options(search_string) {
	var options = {};
	var raw_options = search_string.match(/--[^\s]*/g);

	if (raw_options == null) {
		return options;
	}

	raw_options.forEach(function(raw_opt) {
		if (raw_opt === '--normal' || raw_opt === '--raid-normal') {
			options.tier = 'raid-normal';
		} else if (raw_opt === '--heroic' || raw_opt === '--raid-heroic') {
			options.tier = 'raid-heroic';
		} else if (raw_opt === '--mythic' || raw_opt === '--raid-mythic') {
			options.tier = 'raid-mythic';
		} else if (raw_opt.slice(0, 5) === "--id=") {
			options.id = raw_opt.substr(5);
		} else if (raw_opt === '--anal') {
            options.extras = raw_opt;
        }
	});

	logger.debug(options);
	return options;
}

function remove_options(search_string) {
	return search_string.replace(/--[^\s]*/g, '').trim();
}