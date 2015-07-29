var logger = require('winston');
var request = require('request').defaults({
	baseUrl: 'https://us.api.battle.net/wow/item/',
	qs: {apikey: process.env.APIKEY}
});

var wowLinkUrl = 'https://us.battle.net/wow/en/item/';

module.exports = function(req, resp, next) {
	if (req.wowSearch && req.wowSearch.id) {
		logger.debug('single item found, getting from api');
		request(getItemUrl(req), function(error, response, body) {
			if (error) {
				logger.info("Error getting item from api", getItemUrl(req), error);
				resp.send("Error getting item from api.");
			} else {
				logger.debug("Got response from api");
				logger.silly(body);
				req.wowItem = JSON.parse(body);
				var itemUrl = wowLinkUrl + req.wowSearch.id;
				if (req.wowSearch.context) {
					itemUrl += "/" + req.wowSearch.context;
				}
				req.wowItem.webUrl = itemUrl;
				next();
			}
		});
	}
}

function getItemUrl(req) {
	var reqUrl = '/' + req.wowSearch.id;

	if (req.wowSearch.context) {
		reqUrl = reqUrl + '/' + req.wowSearch.context;
	}

	return reqUrl;
}