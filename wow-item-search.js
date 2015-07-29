var request = require('request');
var cheerio = require('cheerio');

module.exports = function(search_term, callback) {
	var search_options = parse_options(search_term);
	search_term = remove_options(search_term);
	console.log(search_term);
	var url = 'https://us.battle.net/wow/en/search?f=wowitem&q=' + encodeURIComponent(search_term);

	request(url, function(error, response, html) {
		if (!error) {
			var search_results = {};
			var $ = cheerio.load(html);
			$(".table tbody").filter(function() {
				var data = $(this);
				data.children("tr").each(function(index, value) {
					var row = $(value);
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
					var shouldAdd = true;
					if (search_options.tier && search_options.tier != search_record.tier) {
						shouldAdd = false;
					}
					if (!search_options.tier && search_record.tier && search_record.tier != 'raid-normal') {
						shouldAdd = false;
					}
					if (search_options.id && search_record.id != search_options.id) {
						shouldAdd = false;
					}

					if (shouldAdd) {
						search_results[search_record.id] = search_record;
					}
				}); 
			});
			callback(null, search_results);
		} else {
			callback(error, response);
		}
	});
}

function parse_options(search_string) {
	var options = {};
	var raw_options = search_string.match(/--[^\s]*/g);

	if (raw_options == null) {
		return options;
	}

	raw_options.forEach(function(raw_opt) {
		console.log(raw_opt);
		if (raw_opt === '--normal' || raw_opt === '--raid-normal') {
			console.log('option for normal raid tier found.');
			options.tier = 'raid-normal';
		} else if (raw_opt === '--heroic' || raw_opt === '--raid-heroic') {
			console.log('option for heroic raid tier found.');
			options.tier = 'raid-heroic';
		} else if (raw_opt === '--mythic' || raw_opt === '--raid-mythic') {
			console.log('option for mythic raid tier found.');
			options.tier = 'raid-mythic';
		} else if (raw_opt.slice(0, 5) === "--id=") {
			options.id = raw_opt.substr(5);
		}
	});

	console.log(options);
	return options;
}

function remove_options(search_string) {
	return search_string.replace(/--[^\s]*/g, '').trim();
}