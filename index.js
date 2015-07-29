var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var Slack = require('slack-node');
var logger = require('winston');
logger.level = process.env.LOG_LEVEL || 'debug';

var request = require('request').defaults({
	baseUrl: 'https://us.api.battle.net/wow/item/',
	qs: {apikey: process.env.APIKEY}
});

var item_search = require('./wow-item-search');

slack = new Slack();
slack.setWebhook(process.env.WEBHOOK || "__hook_not_defined__");

app.set('port', (process.env.PORT || 5000));

app.get('/', function (req, resp) {
	resp.send('Hello World');
});

app.post('/item', bodyParser.urlencoded({extended: false}), function(req, resp) {
	logger.debug('Item search occurred');
	logger.debug(req.body);
	var respChannel = "#" + req.body.channel_name;


	item_search(req.body.text, function(error, response) {
		//Find the item
		if (Object.keys(response).length > 1) {
			logger.debug("More than one result found, returning directly");
			//If there's more than one, ask for more details
			var more_results = "More than one result found: ";

			for (item_id in response) {
				more_results += " " + response[item_id].name + " --id=" + response[item_id].id + " |";
			}

			resp.send(more_results);

		} else if (Object.keys(response).length == 0) {
			logger.debug("No results found, asking for a better search");
			resp.send("Unable to find an item with `" + req.body.text + "`");

		} else {
			var cur_item = response[Object.keys(response)[0]];
			var req_url = '/' + cur_item.id;

			if (cur_item.tier) {
				req_url = req_url + '/' + cur_item.tier;
			}

			request(req_url, function(api_err, api_resp, api_body) {
				if (api_err) {
					logger.info("Error response from wow api", api_resp);
					resp.send("I'm unable to look that item up right now.");
				}
				//If not, use webhook to respond
				var params = {
					channel: respChannel,
					text: cur_item.name,
					icon_url: cur_item.icon_url
				};
				
				slack.webhook(params, function(err, response) {
					if (err) {
						logger.info("Unable to use webhook", response);
						resp.send("Slack won't let me link the item for you.");
					} else {
						logger.debug("Sent webhook result");
						resp.send("Linking item...");
					}
				});
			});
		}
	});
});

var server = app.listen(app.get('port'), function () {
	logger.info('App running');
});
