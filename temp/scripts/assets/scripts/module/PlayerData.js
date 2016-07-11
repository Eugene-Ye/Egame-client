"use strict";
cc._RFpush(module, '4f9c5eXxqhHAKLxZeRmgHDB', 'PlayerData');
// scripts/module/PlayerData.js

var players = [{
	name: '奥巴马',
	gold: 3000,
	photoIdx: 0
}, {
	name: 'trump',
	gold: 2000,
	photoIdx: 1
}, {
	name: '习',
	gold: 1500,
	photoIdx: 2
}, {
	name: '普京',
	gold: 500,
	photoIdx: 3
}, {
	name: '希拉里',
	gold: 9000,
	photoIdx: 4
}, {
	name: '蛤',
	gold: 5000,
	photoIdx: 5
}, {
	name: '涛',
	gold: 10000,
	photoIdx: 6
}];

module.exports = {
	players: players
};

cc._RFpop();