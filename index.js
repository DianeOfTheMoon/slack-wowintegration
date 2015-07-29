var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var Slack = require('slack-node');
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

app.get('/search', function (req, resp) {
	item_search('desecrated shadowmoon insignia', function(error, response) {
		resp.json(response);
	});
});

app.post('/item', bodyParser.urlencoded({extended: false}), function(req, resp) {
	console.log('Item search occurred');
	console.log(req.body);
	var respChannel = "#" + req.body.channel_name;


	item_search(req.body.text, function(error, response) {
		//Find the item
		if (Object.keys(response).length > 1) {
			//If there's more than one, ask for more details
			var more_results = "More than one result found: ";
			for (item_id in response) {
				more_results += " " + response[item_id].name;
				if (response[item_id].tier != "") {
					more_results += " --" + response[item_id].tier;
				}
				more_results += " |";
			}
			resp.send(more_results);
		} else {
			var cur_item = response[Object.keys(response)[0]];
			var req_url = '/' + cur_item.id;
			if (cur_item.tier) {
				req_url = req_url + '/' + cur_item.tier;
			}
			request(req_url, function(api_err, api_resp, api_body) {
				//If not, use webhook to respond
				var params = {
					channel: respChannel,
					text: cur_item.name,
					icon_url: cur_item.icon_url
				};
				console.log(params);

				slack.webhook(params, function(err, response) {
					if (err) {
						// Error in webhook send
						resp.send(response);
					} else {
						// Successfully sent webhook command
						resp.send("Linking item...");
					}
				});
			});
		}
	});
});

var server = app.listen(app.get('port'), function () {
	console.log('App running');
});
