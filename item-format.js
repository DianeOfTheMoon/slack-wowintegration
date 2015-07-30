var request = require('request');
var logger = require('winston');

var bonusStats = require('./libs/bonusStats.json');
var inventoryType = require('./libs/inventoryType.json');
var itemClass = require('./libs/itemClass.json');
var quality = require('./libs/quality.json');

module.exports = function (wowItem, respChannel) {
    var imageURL = 'http://media.blizzard.com/wow/icons/56/';
    
    var data = {};
    data.attachments = [];
    var overview = {};
    
    data.channel = respChannel;
    //data.text = wowItem.name;
    
    overview.fallback = wowItem.name + wowItem.description; // Fallback Text
    overview.title = wowItem.name; // Item Name
    if (wowItem.nameDescription) {
        overview.title += " (" + wowItem.nameDescription + ")";
    };
    
    overview.title_link = wowItem.webUrl; // URL
    overview.thumb_url = imageURL + wowItem.icon + '.jpg'; // Icon
    
    overview.text = "";
    if (wowItem.description) {
        overview.text += "\"" + wowItem.description + "\"\n"; // Description
    }
    
    overview.text += "Item Level: " + wowItem.itemLevel; // Item Level
    
    // Text Line 3
    
    // Text Line 4
    
    overview.color = quality[wowItem.quality].color; // Quality Color
    
    logger.debug(wowItem);
    
    data.attachments.push(overview);
    
    return data;
};