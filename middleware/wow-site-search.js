var logger = require('winston');
var request = require('request');
var cheerio = require('cheerio');
var url = 'https://us.battle.net/wow/en/search?f=wowitem&q='

module.exports = function(req, resp, next) {
	if (req.wowSearch) {
		logger.debug('Search terms found, searching us wow');
		var searchUrl = url + encodeURIComponent(req.wowSearch.searchString);
		request(searchUrl, function(error, response, html) {
			if (!error) {
				var search_results = {};
				var $ = cheerio.load(html);
				$(".table tbody").filter(function() {
					var data = $(this);
					data.children("tr").each(function(index, value) {
						var search_record = parse_row($(value));

						if (should_add(req.wowSearch.options, search_record)) {
							search_results[search_record.id] = search_record;
						}
					}); 
				});
				var numResults = Object.keys(search_results).length;
				logger.silly(search_results);
				logger.debug(numResults + " records found");
				req.wowSearch.results = search_results;
				if (numResults == 1) {
					req.wowSearch.id = search_results[Object.keys(search_results)[0]].id;
					req.wowSearch.context = search_results[Object.keys(search_results)[0]].tier;
					next();
				} else if (numResults > 1) {
					logger.debug("More than one result found, exiting request.");
					resp.send(buildManyResponse(req.body.command, search_results));
				} else {
					logger.debug("No results found, asking for a better search");
					resp.send("Unable to find an item with `" + req.body.text + "`");
				}
			} else {
				logger.info("Error from wow site: ", error, response);
				resp.send("Error response from the wow site.");
			}
		});
	}
}

function buildManyResponse(command, searchResults) {
	var more_results = "More than one result found:\n";

	for (item_id in searchResults) {
		more_results += "`" + command + " " + searchResults[item_id].name + " --id=" + searchResults[item_id].id + "`\n";
	}

	return more_results;
}

function should_add(options, search_record) {
	var shouldAdd = true;
	if (options.tier && options.tier != search_record.tier) {
		shouldAdd = false;
	}
	if (!options.tier && search_record.tier && search_record.tier != 'raid-normal') {
		shouldAdd = false;
	}
	if (options.id && search_record.id != options.id) {
		shouldAdd = false;
	}

	return shouldAdd;
}

function parse_row(row) {
	var search_record = {};
	var td = td = row.find("td:nth-child(1)");
	var a_tag = td.children().first();
	var item_url = a_tag.attr('href');
	var item_url_segments = item_url.split('/');

	search_record.name = a_tag.children('strong').text().trim().replace(/\r?\n|\r/g, '');
	search_record.id = item_url_segments[4];
	search_record.tier = (item_url_segments.length == 6) ? item_url_segments[5] : "";
	search_record.icon_url = a_tag.children('span').css('background-image').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
	td = row.find("td:nth-child(2)");

	search_record.level = td.text().trim();
	td = row.find("td:nth-child(3)");

	search_record.required_level = td.text().trim();
	td = row.find("td:nth-child(4)");

	search_record.source = td.children('a').first().text().trim();
	search_record.source_link = td.children('a').first().attr('data-fansite');
	td = row.find("td:nth-child(5)");

	search_record.type = td.text().trim();
	return search_record;
}