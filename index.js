var express = require('express');
var app = express();
var Slack = require('slack-node');
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

app.post('/item', function(req, resp) {
	console.log('Item search occurred');
	var results = 2;
	var respChannel = "";
	var username = "world_of_warcraft";


	item_search(req.body.text, function(error, response) {
		//Find the item
		if (response.length > 1) {
			//If there's more than one, ask for more details
		} else {
			//If not, use webhook to respond
			slack.webhook({
				channel: respChannel,
				username: username,
				text: "WoW Item!"
			}, function(err, response) {
				if (err) {
					// Error in webhook send
					resp.send(response);
				} else {
					// Successfully sent webhook command
					resp.send("");
				}
			});
		}
	});
});

var server = app.listen(app.get('port'), function () {
	console.log('App running');
});
