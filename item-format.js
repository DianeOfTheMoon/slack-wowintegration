var request = require('request');
var logger = require('winston');

var bonusStats = require('./libs/bonusStats.json');
var inventoryType = require('./libs/inventoryType.json');
var itemClass = require('./libs/itemClass.json');
var quality = require('./libs/quality.json');

module.exports = function (wowItem, respChannel) {
    var imageURL = 'http://media.blizzard.com/wow/icons/56/';
    
    var data = {};
    data.channel = respChannel;
    
    data.attachments = [];
    var overview = {};
    var itemStats = {};
    
    overview.fields = [];
    var overviewField1 = {};
    var overviewField2 = {};
    var overviewField3 = {};
    var overviewField4 = {};
    
    itemStats.fields = [];
    
    overview.mrkdwn_in = ["text", "pretext"];
    
    overview.fallback = wowItem.name + wowItem.description; // Fallback Text
    
    if (wowItem.id === 19019) {
        overview.pretext = "Did someone say...";
    }
    
    overview.title = wowItem.name; // Item Name
    if (wowItem.nameDescription) {
        overview.title += " (" + wowItem.nameDescription + ")";
    }
    
    overview.title_link = wowItem.webUrl; // URL
    overview.thumb_url = imageURL + wowItem.icon + '.jpg'; // Icon
    
    overview.text = "";
    if (wowItem.description) {
        overview.text += "_\"" + wowItem.description + "\"_\n"; // Description
    }
    
    overview.text += "*Item Level:* " + wowItem.itemLevel; // Item Level
    
    overviewField1.title = "Type";
    overviewField1.value = itemClass[wowItem.itemClass].subClass[wowItem.itemSubClass]; // Type
    overviewField1.short = true;
    
    overviewField2.title = "Slot";
    overviewField2.value = inventoryType[wowItem.inventoryType].name; // Type/Slot
    overviewField2.short = true;
    
    if (wowItem.itemClass === 4) {
        overviewField3.title = "Armor";
        overviewField3.value = wowItem.armor; // Armor
        overviewField3.short = false;
    } else if (wowItem.itemClass === 2) {
        overviewField3.title = "Damage / Speed";
        overviewField3.value = wowItem.weaponInfo.damage.min + " - " + wowItem.weaponInfo.damage.max + " / " + wowItem.weaponInfo.weaponSpeed; // DPS
        overviewField3.short = true;
        
        overviewField4.title = "DPS";
        overviewField4.value = Math.floor(wowItem.weaponInfo.dps);
        overviewField4.short = true;
    }
    
    overview.fields.push(overviewField1, overviewField2, overviewField3, overviewField4);
        
    overview.color = quality[wowItem.quality].color; // Quality Color

    itemStats.text = "";

    for (var i = 0; i < wowItem.bonusStats.length; i++) {
        var itemStatField = {};

        itemStatField.title = bonusStats[wowItem.bonusStats[i].stat].name; // Bonus Stat Title
        itemStatField.value = "+" + wowItem.bonusStats[i].amount; // Bonus Stat Value
        itemStatField.short = true;

        itemStats.fields.push(itemStatField);
    }

    for (var i = 0; i < wowItem.itemSpells.length; i++) {
        itemStats.text += wowItem.itemSpells[i].spell.description + "\n"; // Spell Description
    }

    itemStats.color = quality[wowItem.quality].color; // Quality Color
    
    data.attachments.push(overview, itemStats);
    
    return data;
};