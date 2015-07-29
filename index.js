var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var Slack = require('slack-node');
slack = new Slack();
slack.setWebhook(process.env.WEBHOOK || "__hook_not_defined__");

var logger = require('winston');
logger.level = process.env.LOG_LEVEL || 'debug';

var search_parse_middleware = require('./middleware/search-parse');
var wow_search_middleware = require('./middleware/wow-site-search');
var wow_api_item_middleware = require('./middleware/wow-api-item');
var item_format = require('./item-format');

app.set('port', (process.env.PORT || 5000));

app.use('/item', bodyParser.urlencoded({extended: false}));
app.use('/item', search_parse_middleware);
app.use('/item', wow_search_middleware);
app.use('/item', wow_api_item_middleware);

app.get('/', function (req, resp) {
	resp.send('Hello World');
});

app.post('/item', function(req, resp) {
	logger.debug('Item search occurred, link is ' + req.wowItem.webUrl);
	var respChannel = "#" + req.body.channel_name;

	//var params = {
	//	channel: respChannel,
	//	text: "<" + req.wowItem.webUrl + "|" + req.wowItem.name + ">"
	//};
    var params = item_format(req.wowItem, respChannel);

	slack.webhook(params, function(err, response) {
		if (err) {
			logger.info("Unable to use webhook", response);
			resp.send("Slack won't let me link the item for you.");
		} else {
			logger.debug("Sent webhook result");
			resp.send("");
		}
	});
});

var server = app.listen(app.get('port'), function () {
	logger.info('App running');
});
