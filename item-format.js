var request = require('request');
var logger = require('winston');

module.exports = function (wowItem, respChannel) {
    var imageURL = 'http://media.blizzard.com/wow/icons/56/';
    
    var data = {};
    data.attachments = [];
    var overview = {};
    
    data.channel = respChannel;
    //data.text = wowItem.name;
    
    overview.fallback = wowItem.name + wowItem.description;
    overview.title = wowItem.name;
    if (wowItem.nameDescription) {
        overview.title += "(" + wowItem.nameDescription + ")";
    };
    
    overview.title_link = wowItem.webUrl;
    overview.thumb_url = imageURL + wowItem.icon + '.jpg';
    if (wowItem.description) {
        overview.text = wowItem.description;
    } else {
        overview.text = wowItem.itemLevel;
    }

    switch (wowItem.quality) {
        case 1:
            overview.color = '#ffffff';
            break;
        case 2:
            overview.color = '#1eff00';
            break;
        case 3:
            overview.color = '#0081ff';
            break;
        case 4:
            overview.color = '#c600ff';
            break;
        case 5:
            overview.color = '#ff8000';
            break;
        case 6:
            overview.color = '#e5cc80';
            break;
        default:
            overview.color = '#ffffff';
            break;
    }
    
    logger.debug(wowItem);
    
    data.attachments.push(overview);
        
    logger.debug(data);
    
    return data;
};