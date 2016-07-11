require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"ActorRenderer":[function(require,module,exports){
"use strict";
cc._RFpush(module, '1a792KO87NBg7vCCIp1jq+j', 'ActorRenderer');
// scripts/ActorRenderer.js

var Game = require('Game');
var Types = require('Types');
var Utils = require('Utils');
var ActorPlayingState = Types.ActorPlayingState;

cc.Class({
    'extends': cc.Component,

    properties: {
        playerInfo: cc.Node,
        stakeOnTable: cc.Node,
        cardInfo: cc.Node,
        cardPrefab: cc.Prefab,
        anchorCards: cc.Node,
        spPlayerName: cc.Sprite,
        labelPlayerName: cc.Label,
        labelTotalStake: cc.Label,
        spPlayerPhoto: cc.Sprite,
        callCounter: cc.ProgressBar,
        labelStakeOnTable: cc.Label,
        spChips: {
            'default': [],
            type: cc.Sprite
        },
        labelCardInfo: cc.Label,
        spCardInfo: cc.Sprite,
        animFX: cc.Node,
        cardSpace: 0
    },

    onLoad: function onLoad() {},

    init: function init(playerInfo, playerInfoPos, stakePos, turnDuration, switchSide) {
        // actor
        this.actor = this.getComponent('Actor');

        // nodes
        this.isCounting = false;
        this.counterTimer = 0;
        this.turnDuration = turnDuration;

        this.playerInfo.position = playerInfoPos;
        this.stakeOnTable.position = stakePos;
        this.labelPlayerName.string = playerInfo.name;
        this.updateTotalStake(playerInfo.gold);
        var photoIdx = playerInfo.photoIdx % 5;
        this.spPlayerPhoto.spriteFrame = Game.instance.assetMng.playerPhotos[photoIdx];
        // fx
        this.animFX = this.animFX.getComponent('FXPlayer');
        this.animFX.init();
        this.animFX.show(false);

        this.cardInfo.active = false;

        // switch side
        if (switchSide) {
            this.spCardInfo.getComponent('SideSwitcher').switchSide();
            this.spPlayerName.getComponent('SideSwitcher').switchSide();
        }
    },

    update: function update(dt) {
        if (this.isCounting) {
            this.callCounter.progress = this.counterTimer / this.turnDuration;
            this.counterTimer += dt;
            if (this.counterTimer >= this.turnDuration) {
                this.isCounting = false;
                this.callCounter.progress = 1;
            }
        }
    },

    initDealer: function initDealer() {
        // actor
        this.actor = this.getComponent('Actor');
        // fx
        this.animFX = this.animFX.getComponent('FXPlayer');
        this.animFX.init();
        this.animFX.show(false);
    },

    updateTotalStake: function updateTotalStake(num) {
        this.labelTotalStake.string = '$' + num;
    },

    startCountdown: function startCountdown() {
        if (this.callCounter) {
            this.isCounting = true;
            this.counterTimer = 0;
        }
    },

    resetCountdown: function resetCountdown() {
        if (this.callCounter) {
            this.isCounting = false;
            this.counterTimer = 0;
            this.callCounter.progress = 0;
        }
    },

    playBlackJackFX: function playBlackJackFX() {
        this.animFX.playFX('blackjack');
    },

    playBustFX: function playBustFX() {
        this.animFX.playFX('bust');
    },

    onDeal: function onDeal(card, show) {
        var newCard = cc.instantiate(this.cardPrefab).getComponent('Card');
        this.anchorCards.addChild(newCard.node);
        newCard.init(card);
        newCard.reveal(show);

        var startPos = cc.p(0, 0);
        var index = this.actor.cards.length - 1;
        var endPos = cc.p(this.cardSpace * index, 0);
        newCard.node.setPosition(startPos);
        this._updatePointPos(endPos.x);

        var moveAction = cc.moveTo(0.5, endPos);
        var callback = cc.callFunc(this._onDealEnd, this);
        newCard.node.runAction(cc.sequence(moveAction, callback));
    },

    _onDealEnd: function _onDealEnd(target) {
        this.resetCountdown();
        if (this.actor.state === ActorPlayingState.Normal) {
            this.startCountdown();
        }
        this.updatePoint();
        // this._updatePointPos(pointX);
    },

    onReset: function onReset() {
        this.cardInfo.active = false;

        this.anchorCards.removeAllChildren();

        this._resetChips();
    },

    onRevealHoldCard: function onRevealHoldCard() {
        var card = cc.find('cardPrefab', this.anchorCards).getComponent('Card');
        card.reveal(true);
        this.updateState();
    },

    updatePoint: function updatePoint() {
        this.cardInfo.active = true;
        this.labelCardInfo.string = this.actor.bestPoint;

        switch (this.actor.hand) {
            case Types.Hand.BlackJack:
                this.animFX.show(true);
                this.animFX.playFX('blackjack');
                break;
            case Types.Hand.FiveCard:
                // TODO
                break;
        }
    },

    _updatePointPos: function _updatePointPos(xPos) {
        // cc.log(this.name + ' card info pos: ' + xPos);
        this.cardInfo.setPosition(xPos + 50, 0);
    },

    showStakeChips: function showStakeChips(stake) {
        var chips = this.spChips;
        var count = 0;
        if (stake > 50000) {
            count = 5;
        } else if (stake > 25000) {
            count = 4;
        } else if (stake > 10000) {
            count = 3;
        } else if (stake > 5000) {
            count = 2;
        } else if (stake > 0) {
            count = 1;
        }
        for (var i = 0; i < count; ++i) {
            chips[i].enabled = true;
        }
    },

    _resetChips: function _resetChips() {
        for (var i = 0; i < this.spChips.length; ++i) {
            this.spChips.enabled = false;
        }
    },

    updateState: function updateState() {
        switch (this.actor.state) {
            case ActorPlayingState.Normal:
                this.cardInfo.active = true;
                this.spCardInfo.spriteFrame = Game.instance.assetMng.texCardInfo;
                this.updatePoint();
                break;
            case ActorPlayingState.Bust:
                var min = Utils.getMinMaxPoint(this.actor.cards).min;
                this.labelCardInfo.string = '爆牌(' + min + ')';
                this.spCardInfo.spriteFrame = Game.instance.assetMng.texBust;
                this.cardInfo.active = true;
                this.animFX.show(true);
                this.animFX.playFX('bust');
                this.resetCountdown();
                break;
            case ActorPlayingState.Stand:
                var max = Utils.getMinMaxPoint(this.actor.cards).max;
                this.labelCardInfo.string = '停牌(' + max + ')';
                this.spCardInfo.spriteFrame = Game.instance.assetMng.texCardInfo;
                this.resetCountdown();
                // this.updatePoint();
                break;
        }
    }
});

cc._RFpop();
},{"Game":"Game","Types":"Types","Utils":"Utils"}],"Actor":[function(require,module,exports){
"use strict";
cc._RFpush(module, '7d008dTf6xB2Z0wCAdzh1Rx', 'Actor');
// scripts/Actor.js

var Types = require('Types');
var Utils = require('Utils');
var ActorPlayingState = Types.ActorPlayingState;

cc.Class({
    'extends': cc.Component,

    properties: {
        // 所有明牌
        cards: {
            'default': [],
            serializable: false,
            visible: false
        },
        // 暗牌，demo 暂存
        holeCard: {
            'default': null,
            serializable: false,
            visible: false
        },

        // 手上最接近 21 点的点数（有可能超过 21 点）
        bestPoint: {
            get: function get() {
                var minMax = Utils.getMinMaxPoint(this.cards);
                return minMax.max;
            }
        },

        // 牌型，不考虑是否爆牌
        hand: {
            get: function get() {
                var count = this.cards.length;
                if (this.holeCard) {
                    ++count;
                }
                if (count >= 5) {
                    return Types.Hand.FiveCard;
                }
                if (count === 2 && this.bestPoint === 21) {
                    return Types.Hand.BlackJack;
                }
                return Types.Hand.Normal;
            }
        },

        canReport: {
            get: function get() {
                return this.hand !== Types.Hand.Normal;
            },
            visible: false
        },

        renderer: {
            'default': null,
            type: cc.Node
        },
        state: {
            'default': ActorPlayingState.Normal,
            notify: function notify(oldState) {
                if (this.state !== oldState) {
                    this.renderer.updateState();
                }
            },
            type: ActorPlayingState,
            serializable: false
        }
    },

    init: function init() {
        this.ready = true;
        this.renderer = this.getComponent('ActorRenderer');
    },

    addCard: function addCard(card) {
        this.cards.push(card);
        this.renderer.onDeal(card, true);

        var cards = this.holeCard ? [this.holeCard].concat(this.cards) : this.cards;
        if (Utils.isBust(cards)) {
            this.state = ActorPlayingState.Bust;
        }
    },

    addHoleCard: function addHoleCard(card) {
        this.holeCard = card;
        this.renderer.onDeal(card, false);
    },

    stand: function stand() {
        this.state = ActorPlayingState.Stand;
    },

    revealHoldCard: function revealHoldCard() {
        if (this.holeCard) {
            this.cards.unshift(this.holeCard);
            this.holeCard = null;
            this.renderer.onRevealHoldCard();
        }
    },

    // revealNormalCard: function() {
    //     this.onRevealNormalCard();
    // },

    report: function report() {
        this.state = ActorPlayingState.Report;
    },

    reset: function reset() {
        this.cards = [];
        this.holeCard = null;
        this.reported = false;
        this.state = ActorPlayingState.Normal;
        this.renderer.onReset();
    }
});

cc._RFpop();
},{"Types":"Types","Utils":"Utils"}],"AssetMng":[function(require,module,exports){
"use strict";
cc._RFpush(module, '54522LcoVpPHbrqYgwp/1Qm', 'AssetMng');
// scripts/AssetMng.js

var AssetMng = cc.Class({
    "extends": cc.Component,

    properties: {
        texBust: cc.SpriteFrame,
        texCardInfo: cc.SpriteFrame,
        texCountdown: cc.SpriteFrame,
        texBetCountdown: cc.SpriteFrame,
        playerPhotos: cc.SpriteFrame
    }
});

cc._RFpop();
},{}],"AudioMng":[function(require,module,exports){
"use strict";
cc._RFpush(module, '01ca4tStvVH+JmZ5TNcmuAu', 'AudioMng');
// scripts/AudioMng.js

cc.Class({
    "extends": cc.Component,

    properties: {
        winAudio: {
            "default": null,
            url: cc.AudioClip
        },

        loseAudio: {
            "default": null,
            url: cc.AudioClip
        },

        cardAudio: {
            "default": null,
            url: cc.AudioClip
        },

        buttonAudio: {
            "default": null,
            url: cc.AudioClip
        },

        chipsAudio: {
            "default": null,
            url: cc.AudioClip
        },

        bgm: {
            "default": null,
            url: cc.AudioClip
        }
    },

    playMusic: function playMusic() {
        cc.audioEngine.playMusic(this.bgm, true);
    },

    pauseMusic: function pauseMusic() {
        cc.audioEngine.pauseMusic();
    },

    resumeMusic: function resumeMusic() {
        cc.audioEngine.resumeMusic();
    },

    _playSFX: function _playSFX(clip) {
        cc.audioEngine.playEffect(clip, false);
    },

    playWin: function playWin() {
        this._playSFX(this.winAudio);
    },

    playLose: function playLose() {
        this._playSFX(this.loseAudio);
    },

    playCard: function playCard() {
        this._playSFX(this.cardAudio);
    },

    playChips: function playChips() {
        this._playSFX(this.chipsAudio);
    },

    playButton: function playButton() {
        this._playSFX(this.buttonAudio);
    }
});

cc._RFpop();
},{}],"Bet":[function(require,module,exports){
"use strict";
cc._RFpush(module, '28f38yToT1Pw7NgyeCvRxDC', 'Bet');
// scripts/Bet.js

var Game = require('Game');

cc.Class({
    'extends': cc.Component,

    properties: {
        chipPrefab: cc.Prefab,
        btnChips: {
            'default': [],
            type: cc.Node
        },
        chipValues: {
            'default': [],
            type: 'Integer'
        },
        anchorChipToss: cc.Node
    },

    // use this for initialization
    init: function init() {
        this._registerBtns();
    },

    _registerBtns: function _registerBtns() {
        var self = this;
        var registerBtn = function registerBtn(index) {
            self.btnChips[i].on('touchstart', function (event) {
                if (Game.instance.addStake(self.chipValues[index])) {
                    self.playAddChip();
                }
            }, this);
        };
        for (var i = 0; i < self.btnChips.length; ++i) {
            registerBtn(i);
        }
    },

    playAddChip: function playAddChip() {
        var startPos = cc.p(cc.randomMinus1To1() * 50, cc.randomMinus1To1() * 50);
        var chip = cc.instantiate(this.chipPrefab);
        this.anchorChipToss.addChild(chip);
        chip.setPosition(startPos);
        chip.getComponent('TossChip').play();
    },

    resetChips: function resetChips() {
        Game.instance.resetStake();
        Game.instance.info.enabled = false;
        this.resetTossedChips();
    },

    resetTossedChips: function resetTossedChips() {
        this.anchorChipToss.removeAllChildren();
    }
});

cc._RFpop();
},{"Game":"Game"}],"ButtonScaler":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'a171dSnCXFMRIqs1IWdvgWM', 'ButtonScaler');
// scripts/UI/ButtonScaler.js

cc.Class({
    'extends': cc.Component,

    properties: {
        pressedScale: 1,
        transDuration: 0
    },

    // use this for initialization
    onLoad: function onLoad() {
        var self = this;
        var audioMng = cc.find('Menu/AudioMng') || cc.find('Game/AudioMng');
        if (audioMng) {
            audioMng = audioMng.getComponent('AudioMng');
        }
        self.initScale = this.node.scale;
        self.button = self.getComponent(cc.Button);
        self.scaleDownAction = cc.scaleTo(self.transDuration, self.pressedScale);
        self.scaleUpAction = cc.scaleTo(self.transDuration, self.initScale);
        function onTouchDown(event) {
            this.stopAllActions();
            if (audioMng) audioMng.playButton();
            this.runAction(self.scaleDownAction);
        }
        function onTouchUp(event) {
            this.stopAllActions();
            this.runAction(self.scaleUpAction);
        }
        this.node.on('touchstart', onTouchDown, this.node);
        this.node.on('touchend', onTouchUp, this.node);
        this.node.on('touchcancel', onTouchUp, this.node);
    }
});

cc._RFpop();
},{}],"Card":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'ab67e5QkiVCBZ3DIMlWhiAt', 'Card');
// scripts/Card.js

cc.Class({
    "extends": cc.Component,

    properties: {
        // nodes
        point: cc.Label,
        suit: cc.Sprite,
        mainPic: cc.Sprite,
        cardBG: cc.Sprite,
        // resources
        redTextColor: cc.Color.WHITE,
        blackTextColor: cc.Color.WHITE,
        texFrontBG: cc.SpriteFrame,
        texBackBG: cc.SpriteFrame,
        texFaces: {
            "default": [],
            type: cc.SpriteFrame
        },
        texSuitBig: {
            "default": [],
            type: cc.SpriteFrame
        },
        texSuitSmall: {
            "default": [],
            type: cc.SpriteFrame
        }
    },

    // use this for initialization
    init: function init(card) {
        var isFaceCard = card.point > 10;

        if (isFaceCard) {
            this.mainPic.spriteFrame = this.texFaces[card.point - 10 - 1];
        } else {
            this.mainPic.spriteFrame = this.texSuitBig[card.suit - 1];
        }

        // for jsb
        this.point.string = card.pointName;

        if (card.isRedSuit) {
            this.point.node.color = this.redTextColor;
        } else {
            this.point.node.color = this.blackTextColor;
        }

        this.suit.spriteFrame = this.texSuitSmall[card.suit - 1];
    },

    reveal: function reveal(isFaceUp) {
        this.point.node.active = isFaceUp;
        this.suit.node.active = isFaceUp;
        this.mainPic.node.active = isFaceUp;
        this.cardBG.spriteFrame = isFaceUp ? this.texFrontBG : this.texBackBG;
    }
});

cc._RFpop();
},{}],"Dealer":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'ce2dfoqEulHCLjS1Z9xPN7t', 'Dealer');
// scripts/Dealer.js

var Actor = require('Actor');
var Utils = require('Utils');

cc.Class({
    'extends': Actor,

    properties: {
        // 手上最接近 21 点的点数（有可能超过 21 点）
        bestPoint: {
            get: function get() {
                var cards = this.holeCard ? [this.holeCard].concat(this.cards) : this.cards;
                var minMax = Utils.getMinMaxPoint(cards);
                return minMax.max;
            },
            override: true
        }
    },

    init: function init() {
        this._super();
        this.renderer.initDealer();
    },

    // 返回是否要牌
    wantHit: function wantHit() {
        var Game = require('Game');
        var Types = require('Types');

        var bestPoint = this.bestPoint;

        // 已经最大点数
        if (bestPoint === 21) {
            return false;
        }

        // 不论抽到什么牌肯定不会爆，那就接着抽
        if (bestPoint <= 21 - 10) {
            return true;
        }

        var player = Game.instance.player;
        var outcome = Game.instance._getPlayerResult(player, this);

        switch (outcome) {
            case Types.Outcome.Win:
                return true;
            case Types.Outcome.Lose:
                return false;
        }

        return this.bestPoint < 17;
    }
});

cc._RFpop();
},{"Actor":"Actor","Game":"Game","Types":"Types","Utils":"Utils"}],"Decks":[function(require,module,exports){
"use strict";
cc._RFpush(module, '17024G0JFpHcLI5GREbF8VN', 'Decks');
// scripts/module/Decks.js

var Types = require('Types');

/**
 * 扑克管理类，用来管理一副或多副牌
 * @class Decks
 * @constructor
 * @param {number} numberOfDecks - 总共几副牌
 */
function Decks(numberOfDecks) {
    // 总共几副牌
    this._numberOfDecks = numberOfDecks;
    // 还没发出去的牌
    this._cardIds = new Array(numberOfDecks * 52);

    this.reset();
}

/**
 * 重置所有牌
 * @method reset
 */
Decks.prototype.reset = function () {
    this._cardIds.length = this._numberOfDecks * 52;
    var index = 0;
    var fromId = Types.Card.fromId;
    for (var i = 0; i < this._numberOfDecks; ++i) {
        for (var cardId = 0; cardId < 52; ++cardId) {
            this._cardIds[index] = fromId(cardId);
            ++index;
        }
    }
};

/**
 * 随机抽一张牌，如果已经没牌了，将返回 null
 * @method draw
 * @return {Card}
 */
Decks.prototype.draw = function () {
    var cardIds = this._cardIds;
    var len = cardIds.length;
    if (len === 0) {
        return null;
    }

    var random = Math.random();
    var index = random * len | 0;
    var result = cardIds[index];

    // 保持数组紧凑
    var last = cardIds[len - 1];
    cardIds[index] = last;
    cardIds.length = len - 1;

    return result;
};

///**
// * 发一张牌
// * @method deal
// * @return {Card}
// */
//Decks.prototype.deal = function () {
//    this._cardIds.pop();
//};

///**
// * 洗牌
// * @method shuffle
// */
//Decks.prototype.shuffle = function () {
//    shuffleArray(this._cardIds);
//};
//
///**
// * Randomize array element order in-place.
// * Using Durstenfeld shuffle algorithm.
// * http://stackoverflow.com/a/12646864
// */
//function shuffleArray(array) {
//    for (var i = array.length - 1; i > 0; i--) {
//        var j = (Math.random() * (i + 1)) | 0;
//        var temp = array[i];
//        array[i] = array[j];
//        array[j] = temp;
//    }
//    return array;
//}

module.exports = Decks;

cc._RFpop();
},{"Types":"Types"}],"FXPlayer":[function(require,module,exports){
"use strict";
cc._RFpush(module, '68da2yjdGVMSYhXLN9DukIB', 'FXPlayer');
// scripts/FXPlayer.js

cc.Class({
    "extends": cc.Component,

    // use this for initialization
    init: function init() {
        this.anim = this.getComponent(cc.Animation);
        this.sprite = this.getComponent(cc.Sprite);
    },

    show: function show(_show) {
        this.sprite.enabled = _show;
    },

    playFX: function playFX(name) {
        // name can be 'blackjack' or 'bust'
        this.anim.stop();
        this.anim.play(name);
    },

    hideFX: function hideFX() {
        this.sprite.enabled = false;
    }
});

cc._RFpop();
},{}],"Game":[function(require,module,exports){
"use strict";
cc._RFpush(module, '63738OONCFKHqsf4QSeJSun', 'Game');
// scripts/Game.js

var players = require('PlayerData').players;
var Decks = require('Decks');
var Types = require('Types');
var ActorPlayingState = Types.ActorPlayingState;
var Fsm = require('game-fsm');

var Game = cc.Class({
    'extends': cc.Component,

    properties: {
        playerAnchors: {
            'default': [],
            type: cc.Node
        },
        playerPrefab: cc.Prefab,
        dealer: cc.Node,
        inGameUI: cc.Node,
        betUI: cc.Node,
        assetMng: cc.Node,
        audioMng: cc.Node,
        turnDuration: 0,
        betDuration: 0,
        totalChipsNum: 0,
        totalDiamondNum: 0,
        numberOfDecks: {
            'default': 1,
            type: 'Integer'
        }
    },

    statics: {
        instance: null
    },

    // use this for initialization
    onLoad: function onLoad() {
        Game.instance = this;
        this.inGameUI = this.inGameUI.getComponent('InGameUI');
        this.assetMng = this.assetMng.getComponent('AssetMng');
        this.audioMng = this.audioMng.getComponent('AudioMng');
        this.betUI = this.betUI.getComponent('Bet');
        this.inGameUI.init(this.betDuration);
        this.betUI.init();
        this.dealer = this.dealer.getComponent('Dealer');
        this.dealer.init();

        //
        this.player = null;
        this.createPlayers();

        // shortcut to ui element
        this.info = this.inGameUI.resultTxt;
        this.totalChips = this.inGameUI.labelTotalChips;

        // init logic
        this.decks = new Decks(this.numberOfDecks);
        this.fsm = Fsm;
        this.fsm.init(this);

        // start
        this.updateTotalChips();

        this.audioMng.playMusic();
    },

    addStake: function addStake(delta) {
        if (this.totalChipsNum < delta) {
            console.log('not enough chips!');
            this.info.enabled = true;
            this.info.string = '金币不足!';
            return false;
        } else {
            this.totalChipsNum -= delta;
            this.updateTotalChips();
            this.player.addStake(delta);
            this.audioMng.playChips();
            this.info.enabled = false;
            this.info.string = '请下注';
            return true;
        }
    },

    resetStake: function resetStake() {
        this.totalChipsNum += this.player.stakeNum;
        this.player.resetStake();
        this.updateTotalChips();
    },

    updateTotalChips: function updateTotalChips() {
        this.totalChips.string = this.totalChipsNum;
        this.player.renderer.updateTotalStake(this.totalChipsNum);
    },

    createPlayers: function createPlayers() {
        for (var i = 0; i < 5; ++i) {
            var playerNode = cc.instantiate(this.playerPrefab);
            var anchor = this.playerAnchors[i];
            var switchSide = i > 2;
            anchor.addChild(playerNode);
            playerNode.position = cc.p(0, 0);

            var playerInfoPos = cc.find('anchorPlayerInfo', anchor).getPosition();
            var stakePos = cc.find('anchorStake', anchor).getPosition();
            var actorRenderer = playerNode.getComponent('ActorRenderer');
            actorRenderer.init(players[i], playerInfoPos, stakePos, this.turnDuration, switchSide);
            if (i === 2) {
                this.player = playerNode.getComponent('Player');
                this.player.init();
            }
        }
    },

    // UI EVENT CALLBACKS

    // 玩家要牌
    hit: function hit() {
        this.player.addCard(this.decks.draw());
        if (this.player.state === ActorPlayingState.Bust) {
            // if every player end
            this.fsm.onPlayerActed();
        }

        this.audioMng.playCard();

        //if (this.dealer.state === ActorPlayingState.Normal) {
        //    if (this.dealer.wantHit()) {
        //        this.dealer.addCard(this.decks.draw());
        //    }
        //    else {
        //        this.dealer.stand();
        //    }
        //}
        //
        //if (this.dealer.state === ActorPlayingState.Bust) {
        //    this.state = GamingState.End;
        //}
        this.audioMng.playButton();
    },

    // 玩家停牌
    stand: function stand() {
        this.player.stand();

        this.audioMng.playButton();

        // if every player end
        this.fsm.onPlayerActed();
    },

    //
    deal: function deal() {
        this.fsm.toDeal();
        this.audioMng.playButton();
    },

    //
    start: function start() {
        this.fsm.toBet();
        this.audioMng.playButton();
    },

    // 玩家报到
    report: function report() {
        this.player.report();

        // if every player end
        this.fsm.onPlayerActed();
    },

    quitToMenu: function quitToMenu() {
        cc.director.loadScene('menu');
    },

    // FSM CALLBACKS

    onEnterDealState: function onEnterDealState() {
        this.betUI.resetTossedChips();
        this.inGameUI.resetCountdown();
        this.player.renderer.showStakeChips(this.player.stakeNum);
        this.player.addCard(this.decks.draw());
        var holdCard = this.decks.draw();
        this.dealer.addHoleCard(holdCard);
        this.player.addCard(this.decks.draw());
        this.dealer.addCard(this.decks.draw());
        this.audioMng.playCard();
        this.fsm.onDealed();
    },

    onPlayersTurnState: function onPlayersTurnState(enter) {
        if (enter) {
            this.inGameUI.showGameState();
        }
    },

    onEnterDealersTurnState: function onEnterDealersTurnState() {
        while (this.dealer.state === ActorPlayingState.Normal) {
            if (this.dealer.wantHit()) {
                this.dealer.addCard(this.decks.draw());
            } else {
                this.dealer.stand();
            }
        }
        this.fsm.onDealerActed();
    },

    // 结算
    onEndState: function onEndState(enter) {
        if (enter) {
            this.dealer.revealHoldCard();
            this.inGameUI.showResultState();

            var outcome = this._getPlayerResult(this.player, this.dealer);
            switch (outcome) {
                case Types.Outcome.Win:
                    this.info.string = 'You Win';
                    this.audioMng.pauseMusic();
                    this.audioMng.playWin();
                    // 拿回原先自己的筹码
                    this.totalChipsNum += this.player.stakeNum;
                    // 奖励筹码
                    var winChipsNum = this.player.stakeNum;
                    if (!this.player.state === Types.ActorPlayingState.Report) {
                        if (this.player.hand === Types.Hand.BlackJack) {
                            winChipsNum *= 1.5;
                        } else {
                            // 五小龙
                            winChipsNum *= 2.0;
                        }
                    }
                    this.totalChipsNum += winChipsNum;
                    this.updateTotalChips();
                    break;

                case Types.Outcome.Lose:
                    this.info.string = 'You Lose';
                    this.audioMng.pauseMusic();
                    this.audioMng.playLose();
                    break;

                case Types.Outcome.Tie:
                    this.info.string = 'Draw';
                    // 退还筹码
                    this.totalChipsNum += this.player.stakeNum;
                    this.updateTotalChips();
                    break;
            }
        }

        this.info.enabled = enter;
    },

    // 下注
    onBetState: function onBetState(enter) {
        if (enter) {
            this.decks.reset();
            this.player.reset();
            this.dealer.reset();
            this.info.string = '请下注';
            this.inGameUI.showBetState();
            this.inGameUI.startCountdown();

            this.audioMng.resumeMusic();
        }
        this.info.enabled = enter;
    },

    // PRIVATES

    // 判断玩家输赢
    _getPlayerResult: function _getPlayerResult(player, dealer) {
        var Outcome = Types.Outcome;
        if (player.state === ActorPlayingState.Bust) {
            return Outcome.Lose;
        } else if (dealer.state === ActorPlayingState.Bust) {
            return Outcome.Win;
        } else {
            if (player.state === ActorPlayingState.Report) {
                return Outcome.Win;
            } else {
                if (player.hand > dealer.hand) {
                    return Outcome.Win;
                } else if (player.hand < dealer.hand) {
                    return Outcome.Lose;
                } else {
                    if (player.bestPoint === dealer.bestPoint) {
                        return Outcome.Tie;
                    } else if (player.bestPoint < dealer.bestPoint) {
                        return Outcome.Lose;
                    } else {
                        return Outcome.Win;
                    }
                }
            }
        }
    }

});

cc._RFpop();
},{"Decks":"Decks","PlayerData":"PlayerData","Types":"Types","game-fsm":"game-fsm"}],"InGameUI":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'f192efroeFEyaxtfh8TVXYz', 'InGameUI');
// scripts/UI/InGameUI.js

var Game = require('Game');

cc.Class({
    'extends': cc.Component,

    properties: {
        panelChat: cc.Node,
        panelSocial: cc.Node,
        betStateUI: cc.Node,
        gameStateUI: cc.Node,
        resultTxt: cc.Label,
        betCounter: cc.ProgressBar,
        btnStart: cc.Node,
        labelTotalChips: cc.Label
    },

    // use this for initialization
    init: function init(betDuration) {
        this.panelChat.active = false;
        this.panelSocial.active = false;
        this.resultTxt.enabled = false;
        this.betStateUI.active = true;
        this.gameStateUI.active = false;
        // this.resultStateUI.active = false;
        this.btnStart.active = false;
        this.betDuration = betDuration;
        this.betTimer = 0;
        this.isBetCounting = false;
    },

    startCountdown: function startCountdown() {
        if (this.betCounter) {
            this.betTimer = 0;
            this.isBetCounting = true;
        }
    },

    resetCountdown: function resetCountdown() {
        if (this.betCounter) {
            this.betTimer = 0;
            this.isBetCounting = false;
            this.betCounter.progress = 0;
        }
    },

    showBetState: function showBetState() {
        this.betStateUI.active = true;
        this.gameStateUI.active = false;
        this.btnStart.active = false;
    },

    showGameState: function showGameState() {
        this.betStateUI.active = false;
        this.gameStateUI.active = true;
        this.btnStart.active = false;
    },

    showResultState: function showResultState() {
        this.betStateUI.active = false;
        this.gameStateUI.active = false;
        this.btnStart.active = true;
    },

    toggleChat: function toggleChat() {
        this.panelChat.active = !this.panelChat.active;
    },

    toggleSocial: function toggleSocial() {
        this.panelSocial.active = !this.panelSocial.active;
    },

    // called every frame
    update: function update(dt) {
        if (this.isBetCounting) {
            this.betCounter.progress = this.betTimer / this.betDuration;
            this.betTimer += dt;
            if (this.betTimer >= this.betDuration) {
                this.isBetCounting = false;
                this.betCounter.progress = 1;
            }
        }
    }
});

cc._RFpop();
},{"Game":"Game"}],"Login":[function(require,module,exports){
"use strict";
cc._RFpush(module, '22c85u27ZZLf4X9hO3W/zfP', 'Login');
// scripts/Login.js

cc.Class({
    "extends": cc.Component,

    properties: {
        inputUsername: cc.EditBox,
        inputPass: cc.EditBox
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function onLoad() {},

    enterMenu: function enterMenu() {
        var username = this.inputUsername.string;
        var pass = this.inputPass.string;
        var xhr = new XMLHttpRequest();
        var url = "http://localhost:8088/welcome/?action=user.signin";
        var data = "username=" + username + "&pass=" + pass;
        //var data = JSON.stringify({"username": username, "pass": pass});
        //var data = {"username": username, "pass": pass};
        alert(typeof data);
        alert(data);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status < 400) {
                var response = xhr.responseText;
                alert(response);
            }
        };

        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send(data);

        /* ws = new WebSocket("ws://127.0.0.1/welcome/");
        ws.onopen = function (event) {
            console.log("Send Text WS was opened.");
        };
        ws.onmessage = function (event) {
            console.log("response text msg: " + event.data);
        };
        ws.onerror = function (event) {
            console.log("Send Text fired an error");
        };
        ws.onclose = function (event) {
            console.log("WebSocket instance closed.");
        };
         setTimeout(function () {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send("Hello WebSocket, I'm a text message.");
            }
            else {
                console.log("WebSocket instance wasn't ready...");
            }
        }, 3);*/

        // cc.director.loadScene('menu');
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});

cc._RFpop();
},{}],"Menu":[function(require,module,exports){
"use strict";
cc._RFpush(module, '20f60m+3RlGO7x2/ARzZ6Qc', 'Menu');
// scripts/Menu.js

cc.Class({
    'extends': cc.Component,

    properties: {
        audioMng: cc.Node
    },

    // use this for initialization
    onLoad: function onLoad() {
        this.audioMng = this.audioMng.getComponent('AudioMng');
        this.audioMng.playMusic();
    },

    playGame: function playGame() {
        cc.director.loadScene('table');
    },

    // called every frame
    update: function update(dt) {}
});

cc._RFpop();
},{}],"ModalUI":[function(require,module,exports){
"use strict";
cc._RFpush(module, '54397cUxehGzqEqpMUGHejs', 'ModalUI');
// scripts/UI/ModalUI.js

cc.Class({
    'extends': cc.Component,

    properties: {
        mask: cc.Node
    },

    // use this for initialization
    onLoad: function onLoad() {},

    onEnable: function onEnable() {
        this.mask.on('touchstart', function (event) {
            event.stopPropagation();
        });
        this.mask.on('touchend', function (event) {
            event.stopPropagation();
        });
    },

    onDisable: function onDisable() {
        this.mask.off('touchstart', function (event) {
            event.stopPropagation();
        });
        this.mask.off('touchend', function (event) {
            event.stopPropagation();
        });
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});

cc._RFpop();
},{}],"PlayerData":[function(require,module,exports){
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
},{}],"Player":[function(require,module,exports){
"use strict";
cc._RFpush(module, '226a2AvzRpHL7SJGTMy5PDX', 'Player');
// scripts/Player.js

var Actor = require('Actor');

cc.Class({
    'extends': Actor,

    init: function init() {
        this._super();
        this.labelStake = this.renderer.labelStakeOnTable;
        this.stakeNum = 0;
    },

    reset: function reset() {
        this._super();
        this.resetStake();
    },

    addCard: function addCard(card) {
        this._super(card);

        // var Game = require('Game');
        // Game.instance.canReport = this.canReport;
    },

    addStake: function addStake(delta) {
        this.stakeNum += delta;
        this.updateStake(this.stakeNum);
    },

    resetStake: function resetStake(delta) {
        this.stakeNum = 0;
        this.updateStake(this.stakeNum);
    },

    updateStake: function updateStake(number) {
        this.labelStake.string = number;
    }

});

cc._RFpop();
},{"Actor":"Actor"}],"RankItem":[function(require,module,exports){
"use strict";
cc._RFpush(module, '1657ewfijBOXLq5zGqr6PvE', 'RankItem');
// scripts/UI/RankItem.js

cc.Class({
    "extends": cc.Component,

    properties: {
        spRankBG: cc.Sprite,
        labelRank: cc.Label,
        labelPlayerName: cc.Label,
        labelGold: cc.Label,
        spPlayerPhoto: cc.Sprite,
        texRankBG: cc.SpriteFrame,
        texPlayerPhoto: cc.SpriteFrame
        // ...
    },

    // use this for initialization
    init: function init(rank, playerInfo) {
        if (rank < 3) {
            // should display trophy
            this.labelRank.node.active = false;
            this.spRankBG.spriteFrame = this.texRankBG[rank];
        } else {
            this.labelRank.node.active = true;
            this.labelRank.string = (rank + 1).toString();
        }

        this.labelPlayerName.string = playerInfo.name;
        this.labelGold.string = playerInfo.gold.toString();
        this.spPlayerPhoto.spriteFrame = this.texPlayerPhoto[playerInfo.photoIdx];
    },

    // called every frame
    update: function update(dt) {}
});

cc._RFpop();
},{}],"RankList":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'fe3fcIxCFFLrKHg6s5+xRUU', 'RankList');
// scripts/UI/RankList.js

var players = require('PlayerData').players;

cc.Class({
    'extends': cc.Component,

    properties: {
        scrollView: cc.ScrollView,
        prefabRankItem: cc.Prefab,
        rankCount: 0
    },

    // use this for initialization
    onLoad: function onLoad() {
        this.content = this.scrollView.content;
        this.populateList();
    },

    populateList: function populateList() {
        for (var i = 0; i < this.rankCount; ++i) {
            var playerInfo = players[i];
            var item = cc.instantiate(this.prefabRankItem);
            item.getComponent('RankItem').init(i, playerInfo);
            this.content.addChild(item);
        }
    },

    // called every frame
    update: function update(dt) {}
});

cc._RFpop();
},{"PlayerData":"PlayerData"}],"SideSwitcher":[function(require,module,exports){
"use strict";
cc._RFpush(module, '3aae7lZKyhPqqsLD3wMKl6X', 'SideSwitcher');
// scripts/SideSwitcher.js

cc.Class({
    "extends": cc.Component,

    properties: {
        retainSideNodes: {
            "default": [],
            type: cc.Node
        }
    },

    // use this for initialization
    switchSide: function switchSide() {
        this.node.scaleX = -this.node.scaleX;
        for (var i = 0; i < this.retainSideNodes.length; ++i) {
            var curNode = this.retainSideNodes[i];
            curNode.scaleX = -curNode.scaleX;
        }
    }
});

cc._RFpop();
},{}],"TossChip":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'b4eb5Lo6U1IZ4eJWuxShCdH', 'TossChip');
// scripts/TossChip.js

cc.Class({
    'extends': cc.Component,

    properties: {
        anim: cc.Animation
    },

    // use this for initialization
    play: function play() {
        this.anim.play('chip_toss');
    }
});

cc._RFpop();
},{}],"Types":[function(require,module,exports){
"use strict";
cc._RFpush(module, '5b633QMQxpFmYetofEvK2UD', 'Types');
// scripts/module/Types.js

var Suit = cc.Enum({
    Spade: 1, // 黑桃
    Heart: 2, // 红桃
    Club: 3, // 梅花(黑)
    Diamond: 4 });

// 方块(红)
var A2_10JQK = 'NAN,A,2,3,4,5,6,7,8,9,10,J,Q,K'.split(',');

/**
 * 扑克牌类，只用来表示牌的基本属性，不包含游戏逻辑，所有属性只读，
 * 因此全局只需要有 52 个实例（去掉大小王），不论有多少副牌
 * @class Card
 * @constructor
 * @param {Number} point - 可能的值为 1 到 13
 * @param {Suit} suit
 */
function Card(point, suit) {
    Object.defineProperties(this, {
        point: {
            value: point,
            writable: false
        },
        suit: {
            value: suit,
            writable: false
        },
        /**
         * @property {Number} id - 可能的值为 0 到 51
         */
        id: {
            value: (suit - 1) * 13 + (point - 1),
            writable: false
        },
        //
        pointName: {
            get: function get() {
                return A2_10JQK[this.point];
            }
        },
        suitName: {
            get: function get() {
                return Suit[this.suit];
            }
        },
        isBlackSuit: {
            get: function get() {
                return this.suit === Suit.Spade || this.suit === Suit.Club;
            }
        },
        isRedSuit: {
            get: function get() {
                return this.suit === Suit.Heart || this.suit === Suit.Diamond;
            }
        }
    });
}

Card.prototype.toString = function () {
    return this.suitName + ' ' + this.pointName;
};

// 存放 52 张扑克的实例
var cards = new Array(52);

/**
 * 返回指定 id 的实例
 * @param {Number} id - 0 到 51
 */
Card.fromId = function (id) {
    return cards[id];
};

// 初始化所有扑克牌
(function createCards() {
    for (var s = 1; s <= 4; s++) {
        for (var p = 1; p <= 13; p++) {
            var card = new Card(p, s);
            cards[card.id] = card;
        }
    }
})();

// 手中牌的状态
var ActorPlayingState = cc.Enum({
    Normal: -1,
    Stand: -1, // 停牌
    Report: -1, // 报到
    Bust: -1 });

// 输赢
// 爆了
var Outcome = cc.Enum({
    Win: -1,
    Lose: -1,
    Tie: -1
});

// 牌型，值越大越厉害
var Hand = cc.Enum({
    Normal: -1, // 无
    BlackJack: -1, // 黑杰克
    FiveCard: -1 });

// 五小龙
module.exports = {
    Suit: Suit,
    Card: Card,
    ActorPlayingState: ActorPlayingState,
    Hand: Hand,
    Outcome: Outcome
};

cc._RFpop();
},{}],"Utils":[function(require,module,exports){
"use strict";
cc._RFpush(module, '73590esk6xP9ICqhfUZalMg', 'Utils');
// scripts/module/Utils.js


// 返回尽可能不超过 21 点的最小和最大点数
function getMinMaxPoint(cards) {
    var hasAce = false;
    var min = 0;
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (card.point === 1) {
            hasAce = true;
        }
        min += Math.min(10, card.point);
    }
    var max = min;
    // 如果有 1 个 A 可以当成 11
    if (hasAce && min + 10 <= 21) {
        // （如果两个 A 都当成 11，那么总分最小也会是 22，爆了，所以最多只能有一个 A 当成 11）
        max += 10;
    }

    return {
        min: min,
        max: max
    };
}

function isBust(cards) {
    var sum = 0;
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        sum += Math.min(10, card.point);
    }
    return sum > 21;
}

var isMobile = function isMobile() {
    return cc.sys.isMobile;
};

module.exports = {
    isBust: isBust,
    getMinMaxPoint: getMinMaxPoint,
    isMobile: isMobile
};

cc._RFpop();
},{}],"game-fsm":[function(require,module,exports){
"use strict";
cc._RFpush(module, '6510d1SmQRMMYH8FEIA7zXq', 'game-fsm');
// scripts/module/game-fsm.js

var State = require('state.com');

var instance;
var model;
var playing;

function on(message) {
    return function (msgToEvaluate) {
        return msgToEvaluate === message;
    };
}

var evaluating = false;

exports = {
    init: function init(target) {
        // send log messages, warnings and errors to the console
        State.console = console;

        model = new State.StateMachine("root");
        var initial = new State.PseudoState("init-root", model, State.PseudoStateKind.Initial);

        // 当前这一把的状态

        var bet = new State.State("下注", model);
        playing = new State.State("已开局", model);
        var settled = new State.State("结算", model);

        initial.to(bet);
        bet.to(playing).when(on("deal"));
        playing.to(settled).when(on("end"));
        settled.to(bet).when(on("bet"));

        bet.entry(function () {
            target.onBetState(true);
        });
        bet.exit(function () {
            target.onBetState(false);
        });

        settled.entry(function () {
            target.onEndState(true);
        });
        settled.exit(function () {
            target.onEndState(false);
        });

        // 开局后的子状态

        var initialP = new State.PseudoState("init 已开局", playing, State.PseudoStateKind.Initial);
        var deal = new State.State("发牌", playing);
        //var postDeal = new State.State("等待", playing);    // 询问玩家是否买保险，双倍、分牌等
        var playersTurn = new State.State("玩家决策", playing);
        var dealersTurn = new State.State("庄家决策", playing);

        initialP.to(deal);
        deal.to(playersTurn).when(on("dealed"));
        playersTurn.to(dealersTurn).when(on("player acted"));

        deal.entry(function () {
            target.onEnterDealState();
        });
        playersTurn.entry(function () {
            target.onPlayersTurnState(true);
        });
        playersTurn.exit(function () {
            target.onPlayersTurnState(false);
        });
        dealersTurn.entry(function () {
            target.onEnterDealersTurnState();
        });

        // create a State machine instance
        instance = new State.StateMachineInstance("fsm");
        State.initialise(model, instance);
    },

    toDeal: function toDeal() {
        this._evaluate('deal');
    },
    toBet: function toBet() {
        this._evaluate('bet');
    },
    onDealed: function onDealed() {
        this._evaluate('dealed');
    },
    onPlayerActed: function onPlayerActed() {
        this._evaluate('player acted');
    },
    onDealerActed: function onDealerActed() {
        this._evaluate('end');
    },

    _evaluate: function _evaluate(message) {
        if (evaluating) {
            // can not call fsm's evaluate recursively
            setTimeout(function () {
                State.evaluate(model, instance, message);
            }, 1);
            return;
        }
        evaluating = true;
        State.evaluate(model, instance, message);
        evaluating = false;
    },

    _getInstance: function _getInstance() {
        return instance;
    },

    _getModel: function _getModel() {
        return model;
    }
};

module.exports = exports;

cc._RFpop();
},{"state.com":"state.com"}],"state.com":[function(require,module,exports){
"use strict";
cc._RFpush(module, '71d9293mx9CFryhJvRw85ZS', 'state.com');
// scripts/lib/state.com.js

/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * Behavior encapsulates multiple Action callbacks that can be invoked by a single call.
     * @class Behavior
     */
    var Behavior = (function () {
        /**
         * Creates a new instance of the Behavior class.
         * @param {Behavior} behavior The copy constructor; omit this optional parameter for a simple constructor.
         */
        function Behavior(behavior) {
            this.actions = [];
            if (behavior) {
                this.push(behavior); // NOTE: this ensures a copy of the array is made
            }
        }
        /**
         * Adds an Action or set of Actions callbacks in a Behavior instance to this behavior instance.
         * @method push
         * @param {Behavior} behavior The Action or set of Actions callbacks to add to this behavior instance.
         * @returns {Behavior} Returns this behavior instance (for use in fluent style development).
         */
        Behavior.prototype.push = function (behavior) {
            Array.prototype.push.apply(this.actions, behavior instanceof Behavior ? behavior.actions : arguments);
            return this;
        };
        /**
         * Tests the Behavior instance to see if any actions have been defined.
         * @method hasActions
         * @returns {boolean} True if there are actions defined within this Behavior instance.
         */
        Behavior.prototype.hasActions = function () {
            return this.actions.length !== 0;
        };
        /**
         * Invokes all the action callbacks in this Behavior instance.
         * @method invoke
         * @param {any} message The message that triggered the transition.
         * @param {IActiveStateConfiguration} instance The state machine instance.
         * @param {boolean} history Internal use only
         */
        Behavior.prototype.invoke = function (message, instance, history) {
            if (history === void 0) {
                history = false;
            }
            this.actions.forEach(function (action) {
                return action(message, instance, history);
            });
        };
        return Behavior;
    })();
    StateJS.Behavior = Behavior;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * An enumeration of static constants that dictates the precise behaviour of pseudo states.
     *
     * Use these constants as the `kind` parameter when creating new `PseudoState` instances.
     * @class PseudoStateKind
     */
    (function (PseudoStateKind) {
        /**
         * Used for pseudo states that are always the staring point when entering their parent region.
         * @member {PseudoStateKind} Initial
         */
        PseudoStateKind[PseudoStateKind["Initial"] = 0] = "Initial";
        /**
         * Used for pseudo states that are the the starting point when entering their parent region for the first time; subsequent entries will start at the last known state.
         * @member {PseudoStateKind} ShallowHistory
         */
        PseudoStateKind[PseudoStateKind["ShallowHistory"] = 1] = "ShallowHistory";
        /**
         * As per `ShallowHistory` but the history semantic cascades through all child regions irrespective of their initial pseudo state kind.
         * @member {PseudoStateKind} DeepHistory
         */
        PseudoStateKind[PseudoStateKind["DeepHistory"] = 2] = "DeepHistory";
        /**
         * Enables a dynamic conditional branches; within a compound transition.
         * All outbound transition guards from a Choice are evaluated upon entering the PseudoState:
         * if a single transition is found, it will be traversed;
         * if many transitions are found, an arbitary one will be selected and traversed;
         * if none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
         * @member {PseudoStateKind} Choice
         */
        PseudoStateKind[PseudoStateKind["Choice"] = 3] = "Choice";
        /**
         * Enables a static conditional branches; within a compound transition.
         * All outbound transition guards from a Choice are evaluated upon entering the PseudoState:
         * if a single transition is found, it will be traversed;
         * if many or none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
         * @member {PseudoStateKind} Junction
         */
        PseudoStateKind[PseudoStateKind["Junction"] = 4] = "Junction";
        /**
         * Entering a terminate `PseudoState` implies that the execution of this state machine by means of its state object is terminated.
         * @member {PseudoStateKind} Terminate
         */
        PseudoStateKind[PseudoStateKind["Terminate"] = 5] = "Terminate";
    })(StateJS.PseudoStateKind || (StateJS.PseudoStateKind = {}));
    var PseudoStateKind = StateJS.PseudoStateKind;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * An enumeration of static constants that dictates the precise behaviour of transitions.
     *
     * Use these constants as the `kind` parameter when creating new `Transition` instances.
     * @class TransitionKind
     */
    (function (TransitionKind) {
        /**
         * The transition, if triggered, occurs without exiting or entering the source state.
         * Thus, it does not cause a state change. This means that the entry or exit condition of the source state will not be invoked.
         * An internal transition can be taken even if the state machine is in one or more regions nested within this state.
         * @member {TransitionKind} Internal
         */
        TransitionKind[TransitionKind["Internal"] = 0] = "Internal";
        /**
         * The transition, if triggered, will not exit the composite (source) state, but will enter the non-active target vertex ancestry.
         * @member {TransitionKind} Local
         */
        TransitionKind[TransitionKind["Local"] = 1] = "Local";
        /**
         * The transition, if triggered, will exit the source vertex.
         * @member {TransitionKind} External
         */
        TransitionKind[TransitionKind["External"] = 2] = "External";
    })(StateJS.TransitionKind || (StateJS.TransitionKind = {}));
    var TransitionKind = StateJS.TransitionKind;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * An abstract class used as the base for the Region and Vertex classes.
     * An element is a node within the tree structure that represents a composite state machine model.
     * @class Element
     */
    var Element = (function () {
        /**
         * Creates a new instance of the element class.
         * @param {string} name The name of the element.
         */
        function Element(name, parent) {
            this.name = name;
            this.qualifiedName = parent ? parent.qualifiedName + Element.namespaceSeparator + name : name;
        }
        /**
         * Returns a the element name as a fully qualified namespace.
         * @method toString
         * @returns {string}
         */
        Element.prototype.toString = function () {
            return this.qualifiedName;
        };
        /**
         * The symbol used to separate element names within a fully qualified name.
         * Change this static member to create different styles of qualified name generated by the toString method.
         * @member {string}
         */
        Element.namespaceSeparator = ".";
        return Element;
    })();
    StateJS.Element = Element;
})(StateJS || (StateJS = {}));
var __extends = this && this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() {
        this.constructor = d;
    }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * An element within a state machine model that is a container of Vertices.
     *
     * Regions are implicitly inserted into composite state machines as a container for vertices.
     * They only need to be explicitly defined if orthogonal states are required.
     *
     * Region extends the Element class and inherits its public interface.
     * @class Region
     * @augments Element
     */
    var Region = (function (_super) {
        __extends(Region, _super);
        /**
         * Creates a new instance of the Region class.
         * @param {string} name The name of the region.
         * @param {State} state The parent state that this region will be a child of.
         */
        function Region(name, state) {
            _super.call(this, name, state);
            /**
             * The set of vertices that are children of the region.
             * @member {Array<Vertex>}
             */
            this.vertices = [];
            this.state = state;
            this.state.regions.push(this);
            this.state.getRoot().clean = false;
        }
        /**
         * Returns the root element within the state machine model.
         * @method getRoot
         * @returns {StateMachine} The root state machine element.
         */
        Region.prototype.getRoot = function () {
            return this.state.getRoot();
        };
        /**
         * Accepts an instance of a visitor and calls the visitRegion method on it.
         * @method accept
         * @param {Visitor<TArg1>} visitor The visitor instance.
         * @param {TArg1} arg1 An optional argument to pass into the visitor.
         * @param {any} arg2 An optional argument to pass into the visitor.
         * @param {any} arg3 An optional argument to pass into the visitor.
         * @returns {any} Any value can be returned by the visitor.
         */
        Region.prototype.accept = function (visitor, arg1, arg2, arg3) {
            return visitor.visitRegion(this, arg1, arg2, arg3);
        };
        /**
         * The name given to regions that are are created automatically when a state is passed as a vertex's parent.
         * Regions are automatically inserted into state machine models as the composite structure is built; they are named using this static member.
         * Update this static member to use a different name for default regions.
         * @member {string}
         */
        Region.defaultName = "default";
        return Region;
    })(StateJS.Element);
    StateJS.Region = Region;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * An abstract element within a state machine model that can be the source or target of a transition (states and pseudo states).
     *
     * Vertex extends the Element class and inherits its public interface.
     * @class Vertex
     * @augments Element
     */
    var Vertex = (function (_super) {
        __extends(Vertex, _super);
        /**
         * Creates a new instance of the Vertex class.
         * @param {string} name The name of the vertex.
         * @param {Element} parent The parent region or state.
         */
        function Vertex(name, parent) {
            _super.call(this, name, parent = parent instanceof StateJS.State ? parent.defaultRegion() : parent); // TODO: find a cleaner way to manage implicit conversion
            /**
             * The set of transitions from this vertex.
             * @member {Array<Transition>}
             */
            this.outgoing = [];
            this.region = parent; // NOTE: parent will be a Region due to the conditional logic in the super call above
            if (this.region) {
                this.region.vertices.push(this);
                this.region.getRoot().clean = false;
            }
        }
        /**
         * Returns the root element within the state machine model.
         * @method getRoot
         * @returns {StateMachine} The root state machine element.
         */
        Vertex.prototype.getRoot = function () {
            return this.region.getRoot(); // NOTE: need to keep this dynamic as a state machine may be embedded within another
        };
        /**
         * Creates a new transition from this vertex.
         * Newly created transitions are completion transitions; they will be evaluated after a vertex has been entered if it is deemed to be complete.
         * Transitions can be converted to be event triggered by adding a guard condition via the transitions `where` method.
         * @method to
         * @param {Vertex} target The destination of the transition; omit for internal transitions.
         * @param {TransitionKind} kind The kind the transition; use this to set Local or External (the default if omitted) transition semantics.
         * @returns {Transition} The new transition object.
         */
        Vertex.prototype.to = function (target, kind) {
            if (kind === void 0) {
                kind = StateJS.TransitionKind.External;
            }
            return new StateJS.Transition(this, target, kind);
        };
        /**
         * Accepts an instance of a visitor.
         * @method accept
         * @param {Visitor<TArg>} visitor The visitor instance.
         * @param {TArg} arg An optional argument to pass into the visitor.
         * @returns {any} Any value can be returned by the visitor.
         */
        Vertex.prototype.accept = function (visitor, arg1, arg2, arg3) {};
        return Vertex;
    })(StateJS.Element);
    StateJS.Vertex = Vertex;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * An element within a state machine model that represents an transitory Vertex within the state machine model.
     *
     * Pseudo states are required in all state machine models; at the very least, an `Initial` pseudo state is the default stating state when the parent region is entered.
     * Other types of pseudo state are available; typically for defining history semantics or to facilitate more complex transitions.
     * A `Terminate` pseudo state kind is also available to immediately terminate processing within the entire state machine instance.
     *
     * PseudoState extends the Vertex class and inherits its public interface.
     * @class PseudoState
     * @augments Vertex
     */
    var PseudoState = (function (_super) {
        __extends(PseudoState, _super);
        /**
         * Creates a new instance of the PseudoState class.
         * @param {string} name The name of the pseudo state.
         * @param {Element} parent The parent element that this pseudo state will be a child of.
         * @param {PseudoStateKind} kind Determines the behaviour of the PseudoState.
         */
        function PseudoState(name, parent, kind) {
            if (kind === void 0) {
                kind = StateJS.PseudoStateKind.Initial;
            }
            _super.call(this, name, parent);
            this.kind = kind;
        }
        /**
         * Tests a pseudo state to determine if it is a history pseudo state.
         * History pseudo states are of kind: Initial, ShallowHisory, or DeepHistory.
         * @method isHistory
         * @returns {boolean} True if the pseudo state is a history pseudo state.
         */
        PseudoState.prototype.isHistory = function () {
            return this.kind === StateJS.PseudoStateKind.DeepHistory || this.kind === StateJS.PseudoStateKind.ShallowHistory;
        };
        /**
         * Tests a pseudo state to determine if it is an initial pseudo state.
         * Initial pseudo states are of kind: Initial, ShallowHisory, or DeepHistory.
         * @method isInitial
         * @returns {boolean} True if the pseudo state is an initial pseudo state.
         */
        PseudoState.prototype.isInitial = function () {
            return this.kind === StateJS.PseudoStateKind.Initial || this.isHistory();
        };
        /**
         * Accepts an instance of a visitor and calls the visitPseudoState method on it.
         * @method accept
         * @param {Visitor<TArg1>} visitor The visitor instance.
         * @param {TArg1} arg1 An optional argument to pass into the visitor.
         * @param {any} arg2 An optional argument to pass into the visitor.
         * @param {any} arg3 An optional argument to pass into the visitor.
         * @returns {any} Any value can be returned by the visitor.
         */
        PseudoState.prototype.accept = function (visitor, arg1, arg2, arg3) {
            return visitor.visitPseudoState(this, arg1, arg2, arg3);
        };
        return PseudoState;
    })(StateJS.Vertex);
    StateJS.PseudoState = PseudoState;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * An element within a state machine model that represents an invariant condition within the life of the state machine instance.
     *
     * States are one of the fundamental building blocks of the state machine model.
     * Behaviour can be defined for both state entry and state exit.
     *
     * State extends the Vertex class and inherits its public interface.
     * @class State
     * @augments Vertex
     */
    var State = (function (_super) {
        __extends(State, _super);
        /**
         * Creates a new instance of the State class.
         * @param {string} name The name of the state.
         * @param {Element} parent The parent state that owns the state.
         */
        function State(name, parent) {
            _super.call(this, name, parent);
            // user defined behaviour (via exit method) to execute when exiting a state.
            this.exitBehavior = new StateJS.Behavior();
            // user defined behaviour (via entry method) to execute when entering a state.
            this.entryBehavior = new StateJS.Behavior();
            /**
             * The set of regions under this state.
             * @member {Array<Region>}
             */
            this.regions = [];
        }
        /**
         * Returns the default region for the state.
         * Note, this will create the default region if it does not already exist.
         * @method defaultRegion
         * @returns {Region} The default region.
         */
        State.prototype.defaultRegion = function () {
            return this.regions.reduce(function (result, region) {
                return region.name === StateJS.Region.defaultName ? region : result;
            }, undefined) || new StateJS.Region(StateJS.Region.defaultName, this);
        };
        /**
         * Tests the state to see if it is a final state;
         * a final state is one that has no outbound transitions.
         * @method isFinal
         * @returns {boolean} True if the state is a final state.
         */
        State.prototype.isFinal = function () {
            return this.outgoing.length === 0;
        };
        /**
         * Tests the state to see if it is a simple state;
         * a simple state is one that has no child regions.
         * @method isSimple
         * @returns {boolean} True if the state is a simple state.
         */
        State.prototype.isSimple = function () {
            return this.regions.length === 0;
        };
        /**
         * Tests the state to see if it is a composite state;
         * a composite state is one that has one or more child regions.
         * @method isComposite
         * @returns {boolean} True if the state is a composite state.
         */
        State.prototype.isComposite = function () {
            return this.regions.length > 0;
        };
        /**
         * Tests the state to see if it is an orthogonal state;
         * an orthogonal state is one that has two or more child regions.
         * @method isOrthogonal
         * @returns {boolean} True if the state is an orthogonal state.
         */
        State.prototype.isOrthogonal = function () {
            return this.regions.length > 1;
        };
        /**
         * Adds behaviour to a state that is executed each time the state is exited.
         * @method exit
         * @param {Action} exitAction The action to add to the state's exit behaviour.
         * @returns {State} Returns the state to allow a fluent style API.
         */
        State.prototype.exit = function (exitAction) {
            this.exitBehavior.push(exitAction);
            this.getRoot().clean = false;
            return this;
        };
        /**
         * Adds behaviour to a state that is executed each time the state is entered.
         * @method entry
         * @param {Action} entryAction The action to add to the state's entry behaviour.
         * @returns {State} Returns the state to allow a fluent style API.
         */
        State.prototype.entry = function (entryAction) {
            this.entryBehavior.push(entryAction);
            this.getRoot().clean = false;
            return this;
        };
        /**
         * Accepts an instance of a visitor and calls the visitState method on it.
         * @method accept
         * @param {Visitor<TArg1>} visitor The visitor instance.
         * @param {TArg1} arg1 An optional argument to pass into the visitor.
         * @param {any} arg2 An optional argument to pass into the visitor.
         * @param {any} arg3 An optional argument to pass into the visitor.
         * @returns {any} Any value can be returned by the visitor.
         */
        State.prototype.accept = function (visitor, arg1, arg2, arg3) {
            return visitor.visitState(this, arg1, arg2, arg3);
        };
        return State;
    })(StateJS.Vertex);
    StateJS.State = State;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * An element within a state machine model that represents completion of the life of the containing Region within the state machine instance.
     *
     * A final state cannot have outbound transitions.
     *
     * FinalState extends the State class and inherits its public interface.
     * @class FinalState
     * @augments State
     */
    var FinalState = (function (_super) {
        __extends(FinalState, _super);
        /**
         * Creates a new instance of the FinalState class.
         * @param {string} name The name of the final state.
         * @param {Element} parent The parent element that owns the final state.
         */
        function FinalState(name, parent) {
            _super.call(this, name, parent);
        }
        /**
         * Accepts an instance of a visitor and calls the visitFinalState method on it.
         * @method accept
         * @param {Visitor<TArg>} visitor The visitor instance.
         * @param {TArg} arg An optional argument to pass into the visitor.
         * @returns {any} Any value can be returned by the visitor.
         */
        FinalState.prototype.accept = function (visitor, arg1, arg2, arg3) {
            return visitor.visitFinalState(this, arg1, arg2, arg3);
        };
        return FinalState;
    })(StateJS.State);
    StateJS.FinalState = FinalState;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * An element within a state machine model that represents the root of the state machine model.
     *
     * StateMachine extends the State class and inherits its public interface.
     * @class StateMachine
     * @augments State
     */
    var StateMachine = (function (_super) {
        __extends(StateMachine, _super);
        /**
         * Creates a new instance of the StateMachine class.
         * @param {string} name The name of the state machine.
         */
        function StateMachine(name) {
            _super.call(this, name, undefined);
            // flag used to indicate that the state machine model has has structural changes and therefore requires initialising.
            this.clean = false;
        }
        /**
         * Returns the root element within the state machine model.
         * Note that if this state machine is embeded within another state machine, the ultimate root element will be returned.
         * @method getRoot
         * @returns {StateMachine} The root state machine element.
         */
        StateMachine.prototype.getRoot = function () {
            return this.region ? this.region.getRoot() : this;
        };
        /**
         * Accepts an instance of a visitor and calls the visitStateMachine method on it.
         * @method accept
         * @param {Visitor<TArg1>} visitor The visitor instance.
         * @param {TArg1} arg1 An optional argument to pass into the visitor.
         * @param {any} arg2 An optional argument to pass into the visitor.
         * @param {any} arg3 An optional argument to pass into the visitor.
         * @returns {any} Any value can be returned by the visitor.
         */
        StateMachine.prototype.accept = function (visitor, arg1, arg2, arg3) {
            return visitor.visitStateMachine(this, arg1, arg2, arg3);
        };
        return StateMachine;
    })(StateJS.State);
    StateJS.StateMachine = StateMachine;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * A transition between vertices (states or pseudo states) that may be traversed in response to a message.
     *
     * Transitions come in a variety of types:
     * internal transitions respond to messages but do not cause a state transition, they only have behaviour;
     * local transitions are contained within a single region therefore the source vertex is exited, the transition traversed, and the target state entered;
     * external transitions are more complex in nature as they cross region boundaries, all elements up to but not not including the common ancestor are exited and entered.
     *
     * Entering a composite state will cause the entry of the child regions within the composite state; this in turn may trigger more transitions.
     * @class Transition
     */
    var Transition = (function () {
        /**
         * Creates a new instance of the Transition class.
         * @param {Vertex} source The source of the transition.
         * @param {Vertex} source The target of the transition; this is an optional parameter, omitting it will create an Internal transition.
         * @param {TransitionKind} kind The kind the transition; use this to set Local or External (the default if omitted) transition semantics.
         */
        function Transition(source, target, kind) {
            var _this = this;
            if (kind === void 0) {
                kind = StateJS.TransitionKind.External;
            }
            // user defined behaviour (via effect) executed when traversing this transition.
            this.transitionBehavior = new StateJS.Behavior();
            // the collected actions to perform when traversing the transition (includes exiting states, traversal, and state entry)
            this.onTraverse = new StateJS.Behavior();
            this.source = source;
            this.target = target;
            this.kind = target ? kind : StateJS.TransitionKind.Internal;
            this.guard = source instanceof StateJS.PseudoState ? Transition.TrueGuard : function (message) {
                return message === _this.source;
            };
            this.source.outgoing.push(this);
            this.source.getRoot().clean = false;
        }
        /**
         * Turns a transition into an else transition.
         *
         * Else transitions can be used at `Junction` or `Choice` pseudo states if no other transition guards evaluate true, an Else transition if present will be traversed.
         * @method else
         * @returns {Transition} Returns the transition object to enable the fluent API.
         */
        Transition.prototype["else"] = function () {
            this.guard = Transition.FalseGuard;
            return this;
        };
        /**
         * Defines the guard condition for the transition.
         * @method when
         * @param {Guard} guard The guard condition that must evaluate true for the transition to be traversed.
         * @returns {Transition} Returns the transition object to enable the fluent API.
         */
        Transition.prototype.when = function (guard) {
            this.guard = guard;
            return this;
        };
        /**
         * Add behaviour to a transition.
         * @method effect
         * @param {Action} transitionAction The action to add to the transitions traversal behaviour.
         * @returns {Transition} Returns the transition object to enable the fluent API.
         */
        Transition.prototype.effect = function (transitionAction) {
            this.transitionBehavior.push(transitionAction);
            this.source.getRoot().clean = false;
            return this;
        };
        /**
         * Accepts an instance of a visitor and calls the visitTransition method on it.
         * @method accept
         * @param {Visitor<TArg1>} visitor The visitor instance.
         * @param {TArg1} arg1 An optional argument to pass into the visitor.
         * @param {any} arg2 An optional argument to pass into the visitor.
         * @param {any} arg3 An optional argument to pass into the visitor.
         * @returns {any} Any value can be returned by the visitor.
         */
        Transition.prototype.accept = function (visitor, arg1, arg2, arg3) {
            return visitor.visitTransition(this, arg1, arg2, arg3);
        };
        /**
         * Returns a the transition name.
         * @method toString
         * @returns {string}
         */
        Transition.prototype.toString = function () {
            return "[" + (this.target ? this.source + " -> " + this.target : this.source) + "]";
        };
        // the default guard condition for pseudo states
        Transition.TrueGuard = function () {
            return true;
        };
        // used as the guard condition for else tranitions
        Transition.FalseGuard = function () {
            return false;
        };
        return Transition;
    })();
    StateJS.Transition = Transition;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * Implementation of a visitor pattern.
     * @class Visitor
     */
    var Visitor = (function () {
        function Visitor() {}
        /**
         * Visits an element within a state machine model.
         * @method visitElement
         * @param {Element} element the element being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        Visitor.prototype.visitElement = function (element, arg1, arg2, arg3) {};
        /**
         * Visits a region within a state machine model.
         * @method visitRegion
         * @param {Region} region The region being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        Visitor.prototype.visitRegion = function (region, arg1, arg2, arg3) {
            var _this = this;
            var result = this.visitElement(region, arg1, arg2, arg3);
            region.vertices.forEach(function (vertex) {
                vertex.accept(_this, arg1, arg2, arg3);
            });
            return result;
        };
        /**
         * Visits a vertex within a state machine model.
         * @method visitVertex
         * @param {Vertex} vertex The vertex being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        Visitor.prototype.visitVertex = function (vertex, arg1, arg2, arg3) {
            var _this = this;
            var result = this.visitElement(vertex, arg1, arg2, arg3);
            vertex.outgoing.forEach(function (transition) {
                transition.accept(_this, arg1, arg2, arg3);
            });
            return result;
        };
        /**
         * Visits a pseudo state within a state machine model.
         * @method visitPseudoState
         * @param {PseudoState} pseudoState The pseudo state being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        Visitor.prototype.visitPseudoState = function (pseudoState, arg1, arg2, arg3) {
            return this.visitVertex(pseudoState, arg1, arg2, arg3);
        };
        /**
         * Visits a state within a state machine model.
         * @method visitState
         * @param {State} state The state being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        Visitor.prototype.visitState = function (state, arg1, arg2, arg3) {
            var _this = this;
            var result = this.visitVertex(state, arg1, arg2, arg3);
            state.regions.forEach(function (region) {
                region.accept(_this, arg1, arg2, arg3);
            });
            return result;
        };
        /**
         * Visits a final state within a state machine model.
         * @method visitFinal
         * @param {FinalState} finalState The final state being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        Visitor.prototype.visitFinalState = function (finalState, arg1, arg2, arg3) {
            return this.visitState(finalState, arg1, arg2, arg3);
        };
        /**
         * Visits a state machine within a state machine model.
         * @method visitVertex
         * @param {StateMachine} state machine The state machine being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        Visitor.prototype.visitStateMachine = function (stateMachine, arg1, arg2, arg3) {
            return this.visitState(stateMachine, arg1, arg2, arg3);
        };
        /**
         * Visits a transition within a state machine model.
         * @method visitTransition
         * @param {Transition} transition The transition being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        Visitor.prototype.visitTransition = function (transition, arg1, arg2, arg3) {};
        return Visitor;
    })();
    StateJS.Visitor = Visitor;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * Default working implementation of a state machine instance class.
     *
     * Implements the `IActiveStateConfiguration` interface.
     * It is possible to create other custom instance classes to manage state machine state in other ways (e.g. as serialisable JSON); just implement the same members and methods as this class.
     * @class StateMachineInstance
     * @implements IActiveStateConfiguration
     */
    var StateMachineInstance = (function () {
        /**
         * Creates a new instance of the state machine instance class.
         * @param {string} name The optional name of the state machine instance.
         */
        function StateMachineInstance(name) {
            if (name === void 0) {
                name = "unnamed";
            }
            this.last = {};
            /**
             * Indicates that the state manchine instance reached was terminated by reaching a Terminate pseudo state.
             * @member isTerminated
             */
            this.isTerminated = false;
            this.name = name;
        }
        // Updates the last known state for a given region.
        StateMachineInstance.prototype.setCurrent = function (region, state) {
            this.last[region.qualifiedName] = state;
        };
        // Returns the last known state for a given region.
        StateMachineInstance.prototype.getCurrent = function (region) {
            return this.last[region.qualifiedName];
        };
        /**
         * Returns the name of the state machine instance.
         * @method toString
         * @returns {string} The name of the state machine instance.
         */
        StateMachineInstance.prototype.toString = function () {
            return this.name;
        };
        return StateMachineInstance;
    })();
    StateJS.StateMachineInstance = StateMachineInstance;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * Sets a method to select an integer random number less than the max value passed as a parameter.
     *
     * This is only useful when a custom random number generator is required; the default implementation is fine in most circumstances.
     * @function setRandom
     * @param {function} generator A function that takes a max value and returns a random number between 0 and max - 1.
     * @returns A random number between 0 and max - 1
     */
    function setRandom(generator) {
        random = generator;
    }
    StateJS.setRandom = setRandom;
    /**
     * Returns the current method used to select an integer random number less than the max value passed as a parameter.
     *
     * This is only useful when a custom random number generator is required; the default implementation is fine in most circumstances.
     * @function getRandom
     * @returns {function} The function that takes a max value and returns a random number between 0 and max - 1.
     */
    function getRandom() {
        return random;
    }
    StateJS.getRandom = getRandom;
    // the default method used to produce a random number; defaulting to simplified implementation seen in Mozilla Math.random() page; may be overriden for testing
    var random = function random(max) {
        return Math.floor(Math.random() * max);
    };
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * Determines if an element is currently active; that it has been entered but not yet exited.
     * @function isActive
     * @param {Element} element The state to test.
     * @param {IActiveStateConfiguration} instance The instance of the state machine model.
     * @returns {boolean} True if the element is active.
     */
    function isActive(_x, _x2) {
        var _again = true;

        _function: while (_again) {
            var element = _x,
                stateMachineInstance = _x2;
            _again = false;

            if (element instanceof StateJS.Region) {
                _x = element.state;
                _x2 = stateMachineInstance;
                _again = true;
                continue _function;
            } else if (element instanceof StateJS.State) {
                return element.region ? isActive(element.region, stateMachineInstance) && stateMachineInstance.getCurrent(element.region) === element : true;
            }
        }
    }
    StateJS.isActive = isActive;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * Tests an element within a state machine instance to see if its lifecycle is complete.
     * @function isComplete
     * @param {Element} element The element to test.
     * @param {IActiveStateConfiguration} instance The instance of the state machine model to test for completeness.
     * @returns {boolean} True if the element is complete.
     */
    function isComplete(element, instance) {
        if (element instanceof StateJS.Region) {
            return instance.getCurrent(element).isFinal();
        } else if (element instanceof StateJS.State) {
            return element.regions.every(function (region) {
                return isComplete(region, instance);
            });
        }
        return true;
    }
    StateJS.isComplete = isComplete;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * Initialises a state machine and/or state machine model.
     *
     * Passing just the state machine model will initialise the model, passing the model and instance will initialse the instance and if necessary, the model.
     * @function initialise
     * @param {StateMachine} stateMachineModel The state machine model. If autoInitialiseModel is true (or no instance is specified) and the model has changed, the model will be initialised.
     * @param {IActiveStateConfiguration} stateMachineInstance The optional state machine instance to initialise.
     * @param {boolean} autoInitialiseModel Defaulting to true, this will cause the model to be initialised prior to initialising the instance if the model has changed.
     */
    function initialise(stateMachineModel, stateMachineInstance, autoInitialiseModel) {
        if (autoInitialiseModel === void 0) {
            autoInitialiseModel = true;
        }
        if (stateMachineInstance) {
            // initialise the state machine model if necessary
            if (autoInitialiseModel && stateMachineModel.clean === false) {
                initialise(stateMachineModel);
            }
            // log as required
            StateJS.console.log("initialise " + stateMachineInstance);
            // enter the state machine instance for the first time
            stateMachineModel.onInitialise.invoke(undefined, stateMachineInstance);
        } else {
            // log as required
            StateJS.console.log("initialise " + stateMachineModel.name);
            // initialise the state machine model
            stateMachineModel.accept(new InitialiseElements(), false);
            stateMachineModel.clean = true;
        }
    }
    StateJS.initialise = initialise;
    /**
     * Passes a message to a state machine for evaluation; messages trigger state transitions.
     * @function evaluate
     * @param {StateMachine} stateMachineModel The state machine model. If autoInitialiseModel is true (or no instance is specified) and the model has changed, the model will be initialised.
     * @param {IActiveStateConfiguration} stateMachineInstance The instance of the state machine model to evaluate the message against.
     * @param {boolean} autoInitialiseModel Defaulting to true, this will cause the model to be initialised prior to initialising the instance if the model has changed.
     * @returns {boolean} True if the message triggered a state transition.
     */
    function evaluate(stateMachineModel, stateMachineInstance, message, autoInitialiseModel) {
        if (autoInitialiseModel === void 0) {
            autoInitialiseModel = true;
        }
        // log as required
        StateJS.console.log(stateMachineInstance + " evaluate " + message);
        // initialise the state machine model if necessary
        if (autoInitialiseModel && stateMachineModel.clean === false) {
            initialise(stateMachineModel);
        }
        // terminated state machine instances will not evaluate messages
        if (stateMachineInstance.isTerminated) {
            return false;
        }
        return evaluateState(stateMachineModel, stateMachineInstance, message);
    }
    StateJS.evaluate = evaluate;
    // evaluates messages against a state, executing transitions as appropriate
    function evaluateState(state, stateMachineInstance, message) {
        var result = false;
        // delegate to child regions first
        state.regions.every(function (region) {
            if (evaluateState(stateMachineInstance.getCurrent(region), stateMachineInstance, message)) {
                result = true;
                return StateJS.isActive(state, stateMachineInstance); // NOTE: this just controls the every loop; also isActive is a litte costly so using sparingly
            }
            return true; // NOTE: this just controls the every loop
        });
        // if a transition occured in a child region, check for completions
        if (result) {
            if (message !== state && StateJS.isComplete(state, stateMachineInstance)) {
                evaluateState(state, stateMachineInstance, state);
            }
        } else {
            // otherwise look for a transition from this state
            var transitions = state.outgoing.filter(function (transition) {
                return transition.guard(message, stateMachineInstance);
            });
            if (transitions.length === 1) {
                // execute if a single transition was found
                result = traverse(transitions[0], stateMachineInstance, message);
            } else if (transitions.length > 1) {
                // error if multiple transitions evaluated true
                StateJS.console.error(state + ": multiple outbound transitions evaluated true for message " + message);
            }
        }
        return result;
    }
    // traverses a transition
    function traverse(transition, instance, message) {
        var onTraverse = new StateJS.Behavior(transition.onTraverse),
            target = transition.target;
        // process static conditional branches
        while (target && target instanceof StateJS.PseudoState && target.kind === StateJS.PseudoStateKind.Junction) {
            target = (transition = selectTransition(target, instance, message)).target;
            // concatenate behaviour before and after junctions
            onTraverse.push(transition.onTraverse);
        }
        // execute the transition behaviour
        onTraverse.invoke(message, instance);
        // process dynamic conditional branches
        if (target && target instanceof StateJS.PseudoState && target.kind === StateJS.PseudoStateKind.Choice) {
            traverse(selectTransition(target, instance, message), instance, message);
        } else if (target && target instanceof StateJS.State && StateJS.isComplete(target, instance)) {
            // test for completion transitions
            evaluateState(target, instance, target);
        }
        return true;
    }
    // select next leg of composite transitions after choice and junction pseudo states
    function selectTransition(pseudoState, stateMachineInstance, message) {
        var results = pseudoState.outgoing.filter(function (transition) {
            return transition.guard(message, stateMachineInstance);
        });
        if (pseudoState.kind === StateJS.PseudoStateKind.Choice) {
            return results.length !== 0 ? results[StateJS.getRandom()(results.length)] : findElse(pseudoState);
        } else {
            if (results.length > 1) {
                StateJS.console.error("Multiple outbound transition guards returned true at " + this + " for " + message);
            } else {
                return results[0] || findElse(pseudoState);
            }
        }
    }
    // look for else transitins from a junction or choice
    function findElse(pseudoState) {
        return pseudoState.outgoing.filter(function (transition) {
            return transition.guard === StateJS.Transition.FalseGuard;
        })[0];
    }
    // functions to retreive specif element behavior
    function leave(elementBehavior) {
        return elementBehavior[0] || (elementBehavior[0] = new StateJS.Behavior());
    }
    function beginEnter(elementBehavior) {
        return elementBehavior[1] || (elementBehavior[1] = new StateJS.Behavior());
    }
    function endEnter(elementBehavior) {
        return elementBehavior[2] || (elementBehavior[2] = new StateJS.Behavior());
    }
    function enter(elementBehavior) {
        return new StateJS.Behavior(beginEnter(elementBehavior)).push(endEnter(elementBehavior));
    }
    // get all the vertex ancestors of a vertex (including the vertex itself)
    function ancestors(vertex) {
        return (vertex.region ? ancestors(vertex.region.state) : []).concat(vertex);
    }
    // determine the type of transition and use the appropriate initiliasition method
    var InitialiseTransitions = (function (_super) {
        __extends(InitialiseTransitions, _super);
        function InitialiseTransitions() {
            _super.apply(this, arguments);
        }
        InitialiseTransitions.prototype.visitTransition = function (transition, behaviour) {
            if (transition.kind === StateJS.TransitionKind.Internal) {
                transition.onTraverse.push(transition.transitionBehavior);
            } else if (transition.kind === StateJS.TransitionKind.Local) {
                this.visitLocalTransition(transition, behaviour);
            } else {
                this.visitExternalTransition(transition, behaviour);
            }
        };
        // initialise internal transitions: these do not leave the source state
        InitialiseTransitions.prototype.visitLocalTransition = function (transition, behaviour) {
            var _this = this;
            transition.onTraverse.push(function (message, instance) {
                var targetAncestors = ancestors(transition.target),
                    i = 0;
                // find the first inactive element in the target ancestry
                while (StateJS.isActive(targetAncestors[i], instance)) {
                    ++i;
                }
                // exit the active sibling
                leave(behaviour(instance.getCurrent(targetAncestors[i].region))).invoke(message, instance);
                // perform the transition action;
                transition.transitionBehavior.invoke(message, instance);
                // enter the target ancestry
                while (i < targetAncestors.length) {
                    _this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], targetAncestors[i], function (behavior) {
                        behavior.invoke(message, instance);
                    });
                }
                // trigger cascade
                endEnter(behaviour(transition.target)).invoke(message, instance);
            });
        };
        // initialise external transitions: these are abritarily complex
        InitialiseTransitions.prototype.visitExternalTransition = function (transition, behaviour) {
            var sourceAncestors = ancestors(transition.source),
                targetAncestors = ancestors(transition.target),
                i = Math.min(sourceAncestors.length, targetAncestors.length) - 1;
            // find the index of the first uncommon ancestor (or for external transitions, the source)
            while (sourceAncestors[i - 1] !== targetAncestors[i - 1]) {
                --i;
            }
            // leave source ancestry as required
            transition.onTraverse.push(leave(behaviour(sourceAncestors[i])));
            // perform the transition effect
            transition.onTraverse.push(transition.transitionBehavior);
            // enter the target ancestry
            while (i < targetAncestors.length) {
                this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], targetAncestors[i], function (behavior) {
                    return transition.onTraverse.push(behavior);
                });
            }
            // trigger cascade
            transition.onTraverse.push(endEnter(behaviour(transition.target)));
        };
        InitialiseTransitions.prototype.cascadeElementEntry = function (transition, behaviour, element, next, task) {
            task(beginEnter(behaviour(element)));
            if (next && element instanceof StateJS.State) {
                element.regions.forEach(function (region) {
                    task(beginEnter(behaviour(region)));
                    if (region !== next.region) {
                        task(endEnter(behaviour(region)));
                    }
                });
            }
        };
        return InitialiseTransitions;
    })(StateJS.Visitor);
    // bootstraps all the elements within a state machine model
    var InitialiseElements = (function (_super) {
        __extends(InitialiseElements, _super);
        function InitialiseElements() {
            _super.apply(this, arguments);
            this.behaviours = {};
        }
        InitialiseElements.prototype.behaviour = function (element) {
            return this.behaviours[element.qualifiedName] || (this.behaviours[element.qualifiedName] = []);
        };
        InitialiseElements.prototype.visitElement = function (element, deepHistoryAbove) {
            if (StateJS.console !== defaultConsole) {
                leave(this.behaviour(element)).push(function (message, instance) {
                    return StateJS.console.log(instance + " leave " + element);
                });
                beginEnter(this.behaviour(element)).push(function (message, instance) {
                    return StateJS.console.log(instance + " enter " + element);
                });
            }
        };
        InitialiseElements.prototype.visitRegion = function (region, deepHistoryAbove) {
            var _this = this;
            var regionInitial = region.vertices.reduce(function (result, vertex) {
                return vertex instanceof StateJS.PseudoState && vertex.isInitial() ? vertex : result;
            }, undefined);
            region.vertices.forEach(function (vertex) {
                vertex.accept(_this, deepHistoryAbove || regionInitial && regionInitial.kind === StateJS.PseudoStateKind.DeepHistory);
            });
            // leave the curent active child state when exiting the region
            leave(this.behaviour(region)).push(function (message, stateMachineInstance) {
                return leave(_this.behaviour(stateMachineInstance.getCurrent(region))).invoke(message, stateMachineInstance);
            });
            // enter the appropriate child vertex when entering the region
            if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) {
                endEnter(this.behaviour(region)).push(function (message, stateMachineInstance, history) {
                    enter(_this.behaviour(history || regionInitial.isHistory() ? stateMachineInstance.getCurrent(region) || regionInitial : regionInitial)).invoke(message, stateMachineInstance, history || regionInitial.kind === StateJS.PseudoStateKind.DeepHistory);
                });
            } else {
                endEnter(this.behaviour(region)).push(enter(this.behaviour(regionInitial)));
            }
            this.visitElement(region, deepHistoryAbove);
        };
        InitialiseElements.prototype.visitPseudoState = function (pseudoState, deepHistoryAbove) {
            _super.prototype.visitPseudoState.call(this, pseudoState, deepHistoryAbove);
            // evaluate comppletion transitions once vertex entry is complete
            if (pseudoState.isInitial()) {
                endEnter(this.behaviour(pseudoState)).push(function (message, stateMachineInstance) {
                    return traverse(pseudoState.outgoing[0], stateMachineInstance);
                });
            } else if (pseudoState.kind === StateJS.PseudoStateKind.Terminate) {
                // terminate the state machine instance upon transition to a terminate pseudo state
                beginEnter(this.behaviour(pseudoState)).push(function (message, stateMachineInstance) {
                    return stateMachineInstance.isTerminated = true;
                });
            }
        };
        InitialiseElements.prototype.visitState = function (state, deepHistoryAbove) {
            var _this = this;
            // NOTE: manually iterate over the child regions to control the sequence of behaviour
            state.regions.forEach(function (region) {
                region.accept(_this, deepHistoryAbove);
                leave(_this.behaviour(state)).push(leave(_this.behaviour(region)));
                endEnter(_this.behaviour(state)).push(enter(_this.behaviour(region)));
            });
            this.visitVertex(state, deepHistoryAbove);
            // add the user defined behaviour when entering and exiting states
            leave(this.behaviour(state)).push(state.exitBehavior);
            beginEnter(this.behaviour(state)).push(state.entryBehavior);
            // update the parent regions current state
            beginEnter(this.behaviour(state)).push(function (message, stateMachineInstance) {
                if (state.region) {
                    stateMachineInstance.setCurrent(state.region, state);
                }
            });
        };
        InitialiseElements.prototype.visitStateMachine = function (stateMachine, deepHistoryAbove) {
            var _this = this;
            _super.prototype.visitStateMachine.call(this, stateMachine, deepHistoryAbove);
            // initiaise all the transitions once all the elements have been initialised
            stateMachine.accept(new InitialiseTransitions(), function (element) {
                return _this.behaviour(element);
            });
            // define the behaviour for initialising a state machine instance
            stateMachine.onInitialise = enter(this.behaviour(stateMachine));
        };
        return InitialiseElements;
    })(StateJS.Visitor);
    var defaultConsole = {
        log: function log(message) {
            var optionalParams = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                optionalParams[_i - 1] = arguments[_i];
            }
        },
        warn: function warn(message) {
            var optionalParams = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                optionalParams[_i - 1] = arguments[_i];
            }
        },
        error: function error(message) {
            var optionalParams = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                optionalParams[_i - 1] = arguments[_i];
            }
            throw message;
        }
    };
    /**
     * The object used for log, warning and error messages
     * @member {IConsole}
     */
    StateJS.console = defaultConsole;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    /**
     * Validates a state machine model for correctness (see the constraints defined within the UML Superstructure specification).
     * @function validate
     * @param {StateMachine} stateMachineModel The state machine model to validate.
     */
    function validate(stateMachineModel) {
        stateMachineModel.accept(new Validator());
    }
    StateJS.validate = validate;
    function ancestors(vertex) {
        return (vertex.region ? ancestors(vertex.region.state) : []).concat(vertex);
    }
    var Validator = (function (_super) {
        __extends(Validator, _super);
        function Validator() {
            _super.apply(this, arguments);
        }
        Validator.prototype.visitPseudoState = function (pseudoState) {
            _super.prototype.visitPseudoState.call(this, pseudoState);
            if (pseudoState.kind === StateJS.PseudoStateKind.Choice || pseudoState.kind === StateJS.PseudoStateKind.Junction) {
                // [7] In a complete statemachine, a junction vertex must have at least one incoming and one outgoing transition.
                // [8] In a complete statemachine, a choice vertex must have at least one incoming and one outgoing transition.
                if (pseudoState.outgoing.length === 0) {
                    StateJS.console.error(pseudoState + ": " + pseudoState.kind + " pseudo states must have at least one outgoing transition.");
                }
                // choice and junction pseudo state can have at most one else transition
                if (pseudoState.outgoing.filter(function (transition) {
                    return transition.guard === StateJS.Transition.FalseGuard;
                }).length > 1) {
                    StateJS.console.error(pseudoState + ": " + pseudoState.kind + " pseudo states cannot have more than one Else transitions.");
                }
            } else {
                // non choice/junction pseudo state may not have else transitions
                if (pseudoState.outgoing.filter(function (transition) {
                    return transition.guard === StateJS.Transition.FalseGuard;
                }).length !== 0) {
                    StateJS.console.error(pseudoState + ": " + pseudoState.kind + " pseudo states cannot have Else transitions.");
                }
                if (pseudoState.isInitial()) {
                    if (pseudoState.outgoing.length !== 1) {
                        // [1] An initial vertex can have at most one outgoing transition.
                        // [2] History vertices can have at most one outgoing transition.
                        StateJS.console.error(pseudoState + ": initial pseudo states must have one outgoing transition.");
                    } else {
                        // [9] The outgoing transition from an initial vertex may have a behavior, but not a trigger or guard.
                        if (pseudoState.outgoing[0].guard !== StateJS.Transition.TrueGuard) {
                            StateJS.console.error(pseudoState + ": initial pseudo states cannot have a guard condition.");
                        }
                    }
                }
            }
        };
        Validator.prototype.visitRegion = function (region) {
            _super.prototype.visitRegion.call(this, region);
            // [1] A region can have at most one initial vertex.
            // [2] A region can have at most one deep history vertex.
            // [3] A region can have at most one shallow history vertex.
            var initial;
            region.vertices.forEach(function (vertex) {
                if (vertex instanceof StateJS.PseudoState && vertex.isInitial()) {
                    if (initial) {
                        StateJS.console.error(region + ": regions may have at most one initial pseudo state.");
                    }
                    initial = vertex;
                }
            });
        };
        Validator.prototype.visitState = function (state) {
            _super.prototype.visitState.call(this, state);
            if (state.regions.filter(function (state) {
                return state.name === StateJS.Region.defaultName;
            }).length > 1) {
                StateJS.console.error(state + ": a state cannot have more than one region named " + StateJS.Region.defaultName);
            }
        };
        Validator.prototype.visitFinalState = function (finalState) {
            _super.prototype.visitFinalState.call(this, finalState);
            // [1] A final state cannot have any outgoing transitions.
            if (finalState.outgoing.length !== 0) {
                StateJS.console.error(finalState + ": final states must not have outgoing transitions.");
            }
            // [2] A final state cannot have regions.
            if (finalState.regions.length !== 0) {
                StateJS.console.error(finalState + ": final states must not have child regions.");
            }
            // [4] A final state has no entry behavior.
            if (finalState.entryBehavior.hasActions()) {
                StateJS.console.warn(finalState + ": final states may not have entry behavior.");
            }
            // [5] A final state has no exit behavior.
            if (finalState.exitBehavior.hasActions()) {
                StateJS.console.warn(finalState + ": final states may not have exit behavior.");
            }
        };
        Validator.prototype.visitTransition = function (transition) {
            _super.prototype.visitTransition.call(this, transition);
            // Local transition target vertices must be a child of the source vertex
            if (transition.kind === StateJS.TransitionKind.Local) {
                if (ancestors(transition.target).indexOf(transition.source) === -1) {
                    StateJS.console.error(transition + ": local transition target vertices must be a child of the source composite sate.");
                }
            }
        };
        return Validator;
    })(StateJS.Visitor);
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
//var module = module;
module.exports = StateJS;

cc._RFpop();
},{}]},{},["AudioMng","RankItem","Decks","ActorRenderer","Menu","Player","Login","Bet","SideSwitcher","PlayerData","ModalUI","AssetMng","Types","game-fsm","Game","FXPlayer","state.com","Utils","Actor","ButtonScaler","Card","TossChip","Dealer","InGameUI","RankList"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL0FwcGxpY2F0aW9ucy9Db2Nvc0NyZWF0b3IuYXBwL0NvbnRlbnRzL1Jlc291cmNlcy9hcHAuYXNhci9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYXNzZXRzL3NjcmlwdHMvQWN0b3JSZW5kZXJlci5qcyIsImFzc2V0cy9zY3JpcHRzL0FjdG9yLmpzIiwiYXNzZXRzL3NjcmlwdHMvQXNzZXRNbmcuanMiLCJhc3NldHMvc2NyaXB0cy9BdWRpb01uZy5qcyIsImFzc2V0cy9zY3JpcHRzL0JldC5qcyIsImFzc2V0cy9zY3JpcHRzL1VJL0J1dHRvblNjYWxlci5qcyIsImFzc2V0cy9zY3JpcHRzL0NhcmQuanMiLCJhc3NldHMvc2NyaXB0cy9EZWFsZXIuanMiLCJhc3NldHMvc2NyaXB0cy9tb2R1bGUvRGVja3MuanMiLCJhc3NldHMvc2NyaXB0cy9GWFBsYXllci5qcyIsImFzc2V0cy9zY3JpcHRzL0dhbWUuanMiLCJhc3NldHMvc2NyaXB0cy9VSS9JbkdhbWVVSS5qcyIsImFzc2V0cy9zY3JpcHRzL0xvZ2luLmpzIiwiYXNzZXRzL3NjcmlwdHMvTWVudS5qcyIsImFzc2V0cy9zY3JpcHRzL1VJL01vZGFsVUkuanMiLCJhc3NldHMvc2NyaXB0cy9tb2R1bGUvUGxheWVyRGF0YS5qcyIsImFzc2V0cy9zY3JpcHRzL1BsYXllci5qcyIsImFzc2V0cy9zY3JpcHRzL1VJL1JhbmtJdGVtLmpzIiwiYXNzZXRzL3NjcmlwdHMvVUkvUmFua0xpc3QuanMiLCJhc3NldHMvc2NyaXB0cy9TaWRlU3dpdGNoZXIuanMiLCJhc3NldHMvc2NyaXB0cy9Ub3NzQ2hpcC5qcyIsImFzc2V0cy9zY3JpcHRzL21vZHVsZS9UeXBlcy5qcyIsImFzc2V0cy9zY3JpcHRzL21vZHVsZS9VdGlscy5qcyIsImFzc2V0cy9zY3JpcHRzL21vZHVsZS9nYW1lLWZzbS5qcyIsImFzc2V0cy9zY3JpcHRzL2xpYi9zdGF0ZS5jb20uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnMWE3OTJLTzg3TkJnN3ZDQ0lwMWpxK2onLCAnQWN0b3JSZW5kZXJlcicpO1xuLy8gc2NyaXB0cy9BY3RvclJlbmRlcmVyLmpzXG5cbnZhciBHYW1lID0gcmVxdWlyZSgnR2FtZScpO1xudmFyIFR5cGVzID0gcmVxdWlyZSgnVHlwZXMnKTtcbnZhciBVdGlscyA9IHJlcXVpcmUoJ1V0aWxzJyk7XG52YXIgQWN0b3JQbGF5aW5nU3RhdGUgPSBUeXBlcy5BY3RvclBsYXlpbmdTdGF0ZTtcblxuY2MuQ2xhc3Moe1xuICAgICdleHRlbmRzJzogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBwbGF5ZXJJbmZvOiBjYy5Ob2RlLFxuICAgICAgICBzdGFrZU9uVGFibGU6IGNjLk5vZGUsXG4gICAgICAgIGNhcmRJbmZvOiBjYy5Ob2RlLFxuICAgICAgICBjYXJkUHJlZmFiOiBjYy5QcmVmYWIsXG4gICAgICAgIGFuY2hvckNhcmRzOiBjYy5Ob2RlLFxuICAgICAgICBzcFBsYXllck5hbWU6IGNjLlNwcml0ZSxcbiAgICAgICAgbGFiZWxQbGF5ZXJOYW1lOiBjYy5MYWJlbCxcbiAgICAgICAgbGFiZWxUb3RhbFN0YWtlOiBjYy5MYWJlbCxcbiAgICAgICAgc3BQbGF5ZXJQaG90bzogY2MuU3ByaXRlLFxuICAgICAgICBjYWxsQ291bnRlcjogY2MuUHJvZ3Jlc3NCYXIsXG4gICAgICAgIGxhYmVsU3Rha2VPblRhYmxlOiBjYy5MYWJlbCxcbiAgICAgICAgc3BDaGlwczoge1xuICAgICAgICAgICAgJ2RlZmF1bHQnOiBbXSxcbiAgICAgICAgICAgIHR5cGU6IGNjLlNwcml0ZVxuICAgICAgICB9LFxuICAgICAgICBsYWJlbENhcmRJbmZvOiBjYy5MYWJlbCxcbiAgICAgICAgc3BDYXJkSW5mbzogY2MuU3ByaXRlLFxuICAgICAgICBhbmltRlg6IGNjLk5vZGUsXG4gICAgICAgIGNhcmRTcGFjZTogMFxuICAgIH0sXG5cbiAgICBvbkxvYWQ6IGZ1bmN0aW9uIG9uTG9hZCgpIHt9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChwbGF5ZXJJbmZvLCBwbGF5ZXJJbmZvUG9zLCBzdGFrZVBvcywgdHVybkR1cmF0aW9uLCBzd2l0Y2hTaWRlKSB7XG4gICAgICAgIC8vIGFjdG9yXG4gICAgICAgIHRoaXMuYWN0b3IgPSB0aGlzLmdldENvbXBvbmVudCgnQWN0b3InKTtcblxuICAgICAgICAvLyBub2Rlc1xuICAgICAgICB0aGlzLmlzQ291bnRpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jb3VudGVyVGltZXIgPSAwO1xuICAgICAgICB0aGlzLnR1cm5EdXJhdGlvbiA9IHR1cm5EdXJhdGlvbjtcblxuICAgICAgICB0aGlzLnBsYXllckluZm8ucG9zaXRpb24gPSBwbGF5ZXJJbmZvUG9zO1xuICAgICAgICB0aGlzLnN0YWtlT25UYWJsZS5wb3NpdGlvbiA9IHN0YWtlUG9zO1xuICAgICAgICB0aGlzLmxhYmVsUGxheWVyTmFtZS5zdHJpbmcgPSBwbGF5ZXJJbmZvLm5hbWU7XG4gICAgICAgIHRoaXMudXBkYXRlVG90YWxTdGFrZShwbGF5ZXJJbmZvLmdvbGQpO1xuICAgICAgICB2YXIgcGhvdG9JZHggPSBwbGF5ZXJJbmZvLnBob3RvSWR4ICUgNTtcbiAgICAgICAgdGhpcy5zcFBsYXllclBob3RvLnNwcml0ZUZyYW1lID0gR2FtZS5pbnN0YW5jZS5hc3NldE1uZy5wbGF5ZXJQaG90b3NbcGhvdG9JZHhdO1xuICAgICAgICAvLyBmeFxuICAgICAgICB0aGlzLmFuaW1GWCA9IHRoaXMuYW5pbUZYLmdldENvbXBvbmVudCgnRlhQbGF5ZXInKTtcbiAgICAgICAgdGhpcy5hbmltRlguaW5pdCgpO1xuICAgICAgICB0aGlzLmFuaW1GWC5zaG93KGZhbHNlKTtcblxuICAgICAgICB0aGlzLmNhcmRJbmZvLmFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgICAgIC8vIHN3aXRjaCBzaWRlXG4gICAgICAgIGlmIChzd2l0Y2hTaWRlKSB7XG4gICAgICAgICAgICB0aGlzLnNwQ2FyZEluZm8uZ2V0Q29tcG9uZW50KCdTaWRlU3dpdGNoZXInKS5zd2l0Y2hTaWRlKCk7XG4gICAgICAgICAgICB0aGlzLnNwUGxheWVyTmFtZS5nZXRDb21wb25lbnQoJ1NpZGVTd2l0Y2hlcicpLnN3aXRjaFNpZGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZShkdCkge1xuICAgICAgICBpZiAodGhpcy5pc0NvdW50aW5nKSB7XG4gICAgICAgICAgICB0aGlzLmNhbGxDb3VudGVyLnByb2dyZXNzID0gdGhpcy5jb3VudGVyVGltZXIgLyB0aGlzLnR1cm5EdXJhdGlvbjtcbiAgICAgICAgICAgIHRoaXMuY291bnRlclRpbWVyICs9IGR0O1xuICAgICAgICAgICAgaWYgKHRoaXMuY291bnRlclRpbWVyID49IHRoaXMudHVybkR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0NvdW50aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5jYWxsQ291bnRlci5wcm9ncmVzcyA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdERlYWxlcjogZnVuY3Rpb24gaW5pdERlYWxlcigpIHtcbiAgICAgICAgLy8gYWN0b3JcbiAgICAgICAgdGhpcy5hY3RvciA9IHRoaXMuZ2V0Q29tcG9uZW50KCdBY3RvcicpO1xuICAgICAgICAvLyBmeFxuICAgICAgICB0aGlzLmFuaW1GWCA9IHRoaXMuYW5pbUZYLmdldENvbXBvbmVudCgnRlhQbGF5ZXInKTtcbiAgICAgICAgdGhpcy5hbmltRlguaW5pdCgpO1xuICAgICAgICB0aGlzLmFuaW1GWC5zaG93KGZhbHNlKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlVG90YWxTdGFrZTogZnVuY3Rpb24gdXBkYXRlVG90YWxTdGFrZShudW0pIHtcbiAgICAgICAgdGhpcy5sYWJlbFRvdGFsU3Rha2Uuc3RyaW5nID0gJyQnICsgbnVtO1xuICAgIH0sXG5cbiAgICBzdGFydENvdW50ZG93bjogZnVuY3Rpb24gc3RhcnRDb3VudGRvd24oKSB7XG4gICAgICAgIGlmICh0aGlzLmNhbGxDb3VudGVyKSB7XG4gICAgICAgICAgICB0aGlzLmlzQ291bnRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5jb3VudGVyVGltZXIgPSAwO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlc2V0Q291bnRkb3duOiBmdW5jdGlvbiByZXNldENvdW50ZG93bigpIHtcbiAgICAgICAgaWYgKHRoaXMuY2FsbENvdW50ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaXNDb3VudGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5jb3VudGVyVGltZXIgPSAwO1xuICAgICAgICAgICAgdGhpcy5jYWxsQ291bnRlci5wcm9ncmVzcyA9IDA7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcGxheUJsYWNrSmFja0ZYOiBmdW5jdGlvbiBwbGF5QmxhY2tKYWNrRlgoKSB7XG4gICAgICAgIHRoaXMuYW5pbUZYLnBsYXlGWCgnYmxhY2tqYWNrJyk7XG4gICAgfSxcblxuICAgIHBsYXlCdXN0Rlg6IGZ1bmN0aW9uIHBsYXlCdXN0RlgoKSB7XG4gICAgICAgIHRoaXMuYW5pbUZYLnBsYXlGWCgnYnVzdCcpO1xuICAgIH0sXG5cbiAgICBvbkRlYWw6IGZ1bmN0aW9uIG9uRGVhbChjYXJkLCBzaG93KSB7XG4gICAgICAgIHZhciBuZXdDYXJkID0gY2MuaW5zdGFudGlhdGUodGhpcy5jYXJkUHJlZmFiKS5nZXRDb21wb25lbnQoJ0NhcmQnKTtcbiAgICAgICAgdGhpcy5hbmNob3JDYXJkcy5hZGRDaGlsZChuZXdDYXJkLm5vZGUpO1xuICAgICAgICBuZXdDYXJkLmluaXQoY2FyZCk7XG4gICAgICAgIG5ld0NhcmQucmV2ZWFsKHNob3cpO1xuXG4gICAgICAgIHZhciBzdGFydFBvcyA9IGNjLnAoMCwgMCk7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuYWN0b3IuY2FyZHMubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIGVuZFBvcyA9IGNjLnAodGhpcy5jYXJkU3BhY2UgKiBpbmRleCwgMCk7XG4gICAgICAgIG5ld0NhcmQubm9kZS5zZXRQb3NpdGlvbihzdGFydFBvcyk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVBvaW50UG9zKGVuZFBvcy54KTtcblxuICAgICAgICB2YXIgbW92ZUFjdGlvbiA9IGNjLm1vdmVUbygwLjUsIGVuZFBvcyk7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGNjLmNhbGxGdW5jKHRoaXMuX29uRGVhbEVuZCwgdGhpcyk7XG4gICAgICAgIG5ld0NhcmQubm9kZS5ydW5BY3Rpb24oY2Muc2VxdWVuY2UobW92ZUFjdGlvbiwgY2FsbGJhY2spKTtcbiAgICB9LFxuXG4gICAgX29uRGVhbEVuZDogZnVuY3Rpb24gX29uRGVhbEVuZCh0YXJnZXQpIHtcbiAgICAgICAgdGhpcy5yZXNldENvdW50ZG93bigpO1xuICAgICAgICBpZiAodGhpcy5hY3Rvci5zdGF0ZSA9PT0gQWN0b3JQbGF5aW5nU3RhdGUuTm9ybWFsKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0Q291bnRkb3duKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVQb2ludCgpO1xuICAgICAgICAvLyB0aGlzLl91cGRhdGVQb2ludFBvcyhwb2ludFgpO1xuICAgIH0sXG5cbiAgICBvblJlc2V0OiBmdW5jdGlvbiBvblJlc2V0KCkge1xuICAgICAgICB0aGlzLmNhcmRJbmZvLmFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuYW5jaG9yQ2FyZHMucmVtb3ZlQWxsQ2hpbGRyZW4oKTtcblxuICAgICAgICB0aGlzLl9yZXNldENoaXBzKCk7XG4gICAgfSxcblxuICAgIG9uUmV2ZWFsSG9sZENhcmQ6IGZ1bmN0aW9uIG9uUmV2ZWFsSG9sZENhcmQoKSB7XG4gICAgICAgIHZhciBjYXJkID0gY2MuZmluZCgnY2FyZFByZWZhYicsIHRoaXMuYW5jaG9yQ2FyZHMpLmdldENvbXBvbmVudCgnQ2FyZCcpO1xuICAgICAgICBjYXJkLnJldmVhbCh0cnVlKTtcbiAgICAgICAgdGhpcy51cGRhdGVTdGF0ZSgpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVQb2ludDogZnVuY3Rpb24gdXBkYXRlUG9pbnQoKSB7XG4gICAgICAgIHRoaXMuY2FyZEluZm8uYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5sYWJlbENhcmRJbmZvLnN0cmluZyA9IHRoaXMuYWN0b3IuYmVzdFBvaW50O1xuXG4gICAgICAgIHN3aXRjaCAodGhpcy5hY3Rvci5oYW5kKSB7XG4gICAgICAgICAgICBjYXNlIFR5cGVzLkhhbmQuQmxhY2tKYWNrOlxuICAgICAgICAgICAgICAgIHRoaXMuYW5pbUZYLnNob3codHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmltRlgucGxheUZYKCdibGFja2phY2snKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgVHlwZXMuSGFuZC5GaXZlQ2FyZDpcbiAgICAgICAgICAgICAgICAvLyBUT0RPXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3VwZGF0ZVBvaW50UG9zOiBmdW5jdGlvbiBfdXBkYXRlUG9pbnRQb3MoeFBvcykge1xuICAgICAgICAvLyBjYy5sb2codGhpcy5uYW1lICsgJyBjYXJkIGluZm8gcG9zOiAnICsgeFBvcyk7XG4gICAgICAgIHRoaXMuY2FyZEluZm8uc2V0UG9zaXRpb24oeFBvcyArIDUwLCAwKTtcbiAgICB9LFxuXG4gICAgc2hvd1N0YWtlQ2hpcHM6IGZ1bmN0aW9uIHNob3dTdGFrZUNoaXBzKHN0YWtlKSB7XG4gICAgICAgIHZhciBjaGlwcyA9IHRoaXMuc3BDaGlwcztcbiAgICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgICAgaWYgKHN0YWtlID4gNTAwMDApIHtcbiAgICAgICAgICAgIGNvdW50ID0gNTtcbiAgICAgICAgfSBlbHNlIGlmIChzdGFrZSA+IDI1MDAwKSB7XG4gICAgICAgICAgICBjb3VudCA9IDQ7XG4gICAgICAgIH0gZWxzZSBpZiAoc3Rha2UgPiAxMDAwMCkge1xuICAgICAgICAgICAgY291bnQgPSAzO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YWtlID4gNTAwMCkge1xuICAgICAgICAgICAgY291bnQgPSAyO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YWtlID4gMCkge1xuICAgICAgICAgICAgY291bnQgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7ICsraSkge1xuICAgICAgICAgICAgY2hpcHNbaV0uZW5hYmxlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3Jlc2V0Q2hpcHM6IGZ1bmN0aW9uIF9yZXNldENoaXBzKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3BDaGlwcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdGhpcy5zcENoaXBzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB1cGRhdGVTdGF0ZTogZnVuY3Rpb24gdXBkYXRlU3RhdGUoKSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5hY3Rvci5zdGF0ZSkge1xuICAgICAgICAgICAgY2FzZSBBY3RvclBsYXlpbmdTdGF0ZS5Ob3JtYWw6XG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkSW5mby5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuc3BDYXJkSW5mby5zcHJpdGVGcmFtZSA9IEdhbWUuaW5zdGFuY2UuYXNzZXRNbmcudGV4Q2FyZEluZm87XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVQb2ludCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBBY3RvclBsYXlpbmdTdGF0ZS5CdXN0OlxuICAgICAgICAgICAgICAgIHZhciBtaW4gPSBVdGlscy5nZXRNaW5NYXhQb2ludCh0aGlzLmFjdG9yLmNhcmRzKS5taW47XG4gICAgICAgICAgICAgICAgdGhpcy5sYWJlbENhcmRJbmZvLnN0cmluZyA9ICfniIbniYwoJyArIG1pbiArICcpJztcbiAgICAgICAgICAgICAgICB0aGlzLnNwQ2FyZEluZm8uc3ByaXRlRnJhbWUgPSBHYW1lLmluc3RhbmNlLmFzc2V0TW5nLnRleEJ1c3Q7XG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkSW5mby5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuYW5pbUZYLnNob3codHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmltRlgucGxheUZYKCdidXN0Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldENvdW50ZG93bigpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBBY3RvclBsYXlpbmdTdGF0ZS5TdGFuZDpcbiAgICAgICAgICAgICAgICB2YXIgbWF4ID0gVXRpbHMuZ2V0TWluTWF4UG9pbnQodGhpcy5hY3Rvci5jYXJkcykubWF4O1xuICAgICAgICAgICAgICAgIHRoaXMubGFiZWxDYXJkSW5mby5zdHJpbmcgPSAn5YGc54mMKCcgKyBtYXggKyAnKSc7XG4gICAgICAgICAgICAgICAgdGhpcy5zcENhcmRJbmZvLnNwcml0ZUZyYW1lID0gR2FtZS5pbnN0YW5jZS5hc3NldE1uZy50ZXhDYXJkSW5mbztcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0Q291bnRkb3duKCk7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy51cGRhdGVQb2ludCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICc3ZDAwOGRUZjZ4QjJaMHdDQWR6aDFSeCcsICdBY3RvcicpO1xuLy8gc2NyaXB0cy9BY3Rvci5qc1xuXG52YXIgVHlwZXMgPSByZXF1aXJlKCdUeXBlcycpO1xudmFyIFV0aWxzID0gcmVxdWlyZSgnVXRpbHMnKTtcbnZhciBBY3RvclBsYXlpbmdTdGF0ZSA9IFR5cGVzLkFjdG9yUGxheWluZ1N0YXRlO1xuXG5jYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIC8vIOaJgOacieaYjueJjFxuICAgICAgICBjYXJkczoge1xuICAgICAgICAgICAgJ2RlZmF1bHQnOiBbXSxcbiAgICAgICAgICAgIHNlcmlhbGl6YWJsZTogZmFsc2UsXG4gICAgICAgICAgICB2aXNpYmxlOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICAvLyDmmpfniYzvvIxkZW1vIOaaguWtmFxuICAgICAgICBob2xlQ2FyZDoge1xuICAgICAgICAgICAgJ2RlZmF1bHQnOiBudWxsLFxuICAgICAgICAgICAgc2VyaWFsaXphYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIHZpc2libGU6IGZhbHNlXG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g5omL5LiK5pyA5o6l6L+RIDIxIOeCueeahOeCueaVsO+8iOacieWPr+iDvei2hei/hyAyMSDngrnvvIlcbiAgICAgICAgYmVzdFBvaW50OiB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWluTWF4ID0gVXRpbHMuZ2V0TWluTWF4UG9pbnQodGhpcy5jYXJkcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1pbk1heC5tYXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g54mM5Z6L77yM5LiN6ICD6JmR5piv5ZCm54iG54mMXG4gICAgICAgIGhhbmQ6IHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgICAgIHZhciBjb3VudCA9IHRoaXMuY2FyZHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhvbGVDYXJkKSB7XG4gICAgICAgICAgICAgICAgICAgICsrY291bnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjb3VudCA+PSA1KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBUeXBlcy5IYW5kLkZpdmVDYXJkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY291bnQgPT09IDIgJiYgdGhpcy5iZXN0UG9pbnQgPT09IDIxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBUeXBlcy5IYW5kLkJsYWNrSmFjaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIFR5cGVzLkhhbmQuTm9ybWFsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGNhblJlcG9ydDoge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZCAhPT0gVHlwZXMuSGFuZC5Ob3JtYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmlzaWJsZTogZmFsc2VcbiAgICAgICAgfSxcblxuICAgICAgICByZW5kZXJlcjoge1xuICAgICAgICAgICAgJ2RlZmF1bHQnOiBudWxsLFxuICAgICAgICAgICAgdHlwZTogY2MuTm9kZVxuICAgICAgICB9LFxuICAgICAgICBzdGF0ZToge1xuICAgICAgICAgICAgJ2RlZmF1bHQnOiBBY3RvclBsYXlpbmdTdGF0ZS5Ob3JtYWwsXG4gICAgICAgICAgICBub3RpZnk6IGZ1bmN0aW9uIG5vdGlmeShvbGRTdGF0ZSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlICE9PSBvbGRTdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnVwZGF0ZVN0YXRlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHR5cGU6IEFjdG9yUGxheWluZ1N0YXRlLFxuICAgICAgICAgICAgc2VyaWFsaXphYmxlOiBmYWxzZVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgIHRoaXMucmVhZHkgPSB0cnVlO1xuICAgICAgICB0aGlzLnJlbmRlcmVyID0gdGhpcy5nZXRDb21wb25lbnQoJ0FjdG9yUmVuZGVyZXInKTtcbiAgICB9LFxuXG4gICAgYWRkQ2FyZDogZnVuY3Rpb24gYWRkQ2FyZChjYXJkKSB7XG4gICAgICAgIHRoaXMuY2FyZHMucHVzaChjYXJkKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5vbkRlYWwoY2FyZCwgdHJ1ZSk7XG5cbiAgICAgICAgdmFyIGNhcmRzID0gdGhpcy5ob2xlQ2FyZCA/IFt0aGlzLmhvbGVDYXJkXS5jb25jYXQodGhpcy5jYXJkcykgOiB0aGlzLmNhcmRzO1xuICAgICAgICBpZiAoVXRpbHMuaXNCdXN0KGNhcmRzKSkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IEFjdG9yUGxheWluZ1N0YXRlLkJ1c3Q7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYWRkSG9sZUNhcmQ6IGZ1bmN0aW9uIGFkZEhvbGVDYXJkKGNhcmQpIHtcbiAgICAgICAgdGhpcy5ob2xlQ2FyZCA9IGNhcmQ7XG4gICAgICAgIHRoaXMucmVuZGVyZXIub25EZWFsKGNhcmQsIGZhbHNlKTtcbiAgICB9LFxuXG4gICAgc3RhbmQ6IGZ1bmN0aW9uIHN0YW5kKCkge1xuICAgICAgICB0aGlzLnN0YXRlID0gQWN0b3JQbGF5aW5nU3RhdGUuU3RhbmQ7XG4gICAgfSxcblxuICAgIHJldmVhbEhvbGRDYXJkOiBmdW5jdGlvbiByZXZlYWxIb2xkQ2FyZCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaG9sZUNhcmQpIHtcbiAgICAgICAgICAgIHRoaXMuY2FyZHMudW5zaGlmdCh0aGlzLmhvbGVDYXJkKTtcbiAgICAgICAgICAgIHRoaXMuaG9sZUNhcmQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5vblJldmVhbEhvbGRDYXJkKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gcmV2ZWFsTm9ybWFsQ2FyZDogZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIHRoaXMub25SZXZlYWxOb3JtYWxDYXJkKCk7XG4gICAgLy8gfSxcblxuICAgIHJlcG9ydDogZnVuY3Rpb24gcmVwb3J0KCkge1xuICAgICAgICB0aGlzLnN0YXRlID0gQWN0b3JQbGF5aW5nU3RhdGUuUmVwb3J0O1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICAgIHRoaXMuY2FyZHMgPSBbXTtcbiAgICAgICAgdGhpcy5ob2xlQ2FyZCA9IG51bGw7XG4gICAgICAgIHRoaXMucmVwb3J0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IEFjdG9yUGxheWluZ1N0YXRlLk5vcm1hbDtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5vblJlc2V0KCk7XG4gICAgfVxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICc1NDUyMkxjb1ZwUEhicnFZZ3dwLzFRbScsICdBc3NldE1uZycpO1xuLy8gc2NyaXB0cy9Bc3NldE1uZy5qc1xuXG52YXIgQXNzZXRNbmcgPSBjYy5DbGFzcyh7XG4gICAgXCJleHRlbmRzXCI6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgdGV4QnVzdDogY2MuU3ByaXRlRnJhbWUsXG4gICAgICAgIHRleENhcmRJbmZvOiBjYy5TcHJpdGVGcmFtZSxcbiAgICAgICAgdGV4Q291bnRkb3duOiBjYy5TcHJpdGVGcmFtZSxcbiAgICAgICAgdGV4QmV0Q291bnRkb3duOiBjYy5TcHJpdGVGcmFtZSxcbiAgICAgICAgcGxheWVyUGhvdG9zOiBjYy5TcHJpdGVGcmFtZVxuICAgIH1cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnMDFjYTR0U3R2VkgrSm1aNVROY211QXUnLCAnQXVkaW9NbmcnKTtcbi8vIHNjcmlwdHMvQXVkaW9NbmcuanNcblxuY2MuQ2xhc3Moe1xuICAgIFwiZXh0ZW5kc1wiOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIHdpbkF1ZGlvOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH0sXG5cbiAgICAgICAgbG9zZUF1ZGlvOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FyZEF1ZGlvOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH0sXG5cbiAgICAgICAgYnV0dG9uQXVkaW86IHtcbiAgICAgICAgICAgIFwiZGVmYXVsdFwiOiBudWxsLFxuICAgICAgICAgICAgdXJsOiBjYy5BdWRpb0NsaXBcbiAgICAgICAgfSxcblxuICAgICAgICBjaGlwc0F1ZGlvOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH0sXG5cbiAgICAgICAgYmdtOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcGxheU11c2ljOiBmdW5jdGlvbiBwbGF5TXVzaWMoKSB7XG4gICAgICAgIGNjLmF1ZGlvRW5naW5lLnBsYXlNdXNpYyh0aGlzLmJnbSwgdHJ1ZSk7XG4gICAgfSxcblxuICAgIHBhdXNlTXVzaWM6IGZ1bmN0aW9uIHBhdXNlTXVzaWMoKSB7XG4gICAgICAgIGNjLmF1ZGlvRW5naW5lLnBhdXNlTXVzaWMoKTtcbiAgICB9LFxuXG4gICAgcmVzdW1lTXVzaWM6IGZ1bmN0aW9uIHJlc3VtZU11c2ljKCkge1xuICAgICAgICBjYy5hdWRpb0VuZ2luZS5yZXN1bWVNdXNpYygpO1xuICAgIH0sXG5cbiAgICBfcGxheVNGWDogZnVuY3Rpb24gX3BsYXlTRlgoY2xpcCkge1xuICAgICAgICBjYy5hdWRpb0VuZ2luZS5wbGF5RWZmZWN0KGNsaXAsIGZhbHNlKTtcbiAgICB9LFxuXG4gICAgcGxheVdpbjogZnVuY3Rpb24gcGxheVdpbigpIHtcbiAgICAgICAgdGhpcy5fcGxheVNGWCh0aGlzLndpbkF1ZGlvKTtcbiAgICB9LFxuXG4gICAgcGxheUxvc2U6IGZ1bmN0aW9uIHBsYXlMb3NlKCkge1xuICAgICAgICB0aGlzLl9wbGF5U0ZYKHRoaXMubG9zZUF1ZGlvKTtcbiAgICB9LFxuXG4gICAgcGxheUNhcmQ6IGZ1bmN0aW9uIHBsYXlDYXJkKCkge1xuICAgICAgICB0aGlzLl9wbGF5U0ZYKHRoaXMuY2FyZEF1ZGlvKTtcbiAgICB9LFxuXG4gICAgcGxheUNoaXBzOiBmdW5jdGlvbiBwbGF5Q2hpcHMoKSB7XG4gICAgICAgIHRoaXMuX3BsYXlTRlgodGhpcy5jaGlwc0F1ZGlvKTtcbiAgICB9LFxuXG4gICAgcGxheUJ1dHRvbjogZnVuY3Rpb24gcGxheUJ1dHRvbigpIHtcbiAgICAgICAgdGhpcy5fcGxheVNGWCh0aGlzLmJ1dHRvbkF1ZGlvKTtcbiAgICB9XG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzI4ZjM4eVRvVDFQdzdOZ3llQ3ZSeERDJywgJ0JldCcpO1xuLy8gc2NyaXB0cy9CZXQuanNcblxudmFyIEdhbWUgPSByZXF1aXJlKCdHYW1lJyk7XG5cbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgY2hpcFByZWZhYjogY2MuUHJlZmFiLFxuICAgICAgICBidG5DaGlwczoge1xuICAgICAgICAgICAgJ2RlZmF1bHQnOiBbXSxcbiAgICAgICAgICAgIHR5cGU6IGNjLk5vZGVcbiAgICAgICAgfSxcbiAgICAgICAgY2hpcFZhbHVlczoge1xuICAgICAgICAgICAgJ2RlZmF1bHQnOiBbXSxcbiAgICAgICAgICAgIHR5cGU6ICdJbnRlZ2VyJ1xuICAgICAgICB9LFxuICAgICAgICBhbmNob3JDaGlwVG9zczogY2MuTm9kZVxuICAgIH0sXG5cbiAgICAvLyB1c2UgdGhpcyBmb3IgaW5pdGlhbGl6YXRpb25cbiAgICBpbml0OiBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICB0aGlzLl9yZWdpc3RlckJ0bnMoKTtcbiAgICB9LFxuXG4gICAgX3JlZ2lzdGVyQnRuczogZnVuY3Rpb24gX3JlZ2lzdGVyQnRucygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgcmVnaXN0ZXJCdG4gPSBmdW5jdGlvbiByZWdpc3RlckJ0bihpbmRleCkge1xuICAgICAgICAgICAgc2VsZi5idG5DaGlwc1tpXS5vbigndG91Y2hzdGFydCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGlmIChHYW1lLmluc3RhbmNlLmFkZFN0YWtlKHNlbGYuY2hpcFZhbHVlc1tpbmRleF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYucGxheUFkZENoaXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLmJ0bkNoaXBzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICByZWdpc3RlckJ0bihpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBwbGF5QWRkQ2hpcDogZnVuY3Rpb24gcGxheUFkZENoaXAoKSB7XG4gICAgICAgIHZhciBzdGFydFBvcyA9IGNjLnAoY2MucmFuZG9tTWludXMxVG8xKCkgKiA1MCwgY2MucmFuZG9tTWludXMxVG8xKCkgKiA1MCk7XG4gICAgICAgIHZhciBjaGlwID0gY2MuaW5zdGFudGlhdGUodGhpcy5jaGlwUHJlZmFiKTtcbiAgICAgICAgdGhpcy5hbmNob3JDaGlwVG9zcy5hZGRDaGlsZChjaGlwKTtcbiAgICAgICAgY2hpcC5zZXRQb3NpdGlvbihzdGFydFBvcyk7XG4gICAgICAgIGNoaXAuZ2V0Q29tcG9uZW50KCdUb3NzQ2hpcCcpLnBsYXkoKTtcbiAgICB9LFxuXG4gICAgcmVzZXRDaGlwczogZnVuY3Rpb24gcmVzZXRDaGlwcygpIHtcbiAgICAgICAgR2FtZS5pbnN0YW5jZS5yZXNldFN0YWtlKCk7XG4gICAgICAgIEdhbWUuaW5zdGFuY2UuaW5mby5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVzZXRUb3NzZWRDaGlwcygpO1xuICAgIH0sXG5cbiAgICByZXNldFRvc3NlZENoaXBzOiBmdW5jdGlvbiByZXNldFRvc3NlZENoaXBzKCkge1xuICAgICAgICB0aGlzLmFuY2hvckNoaXBUb3NzLnJlbW92ZUFsbENoaWxkcmVuKCk7XG4gICAgfVxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICdhMTcxZFNuQ1hGTVJJcXMxSVdkdmdXTScsICdCdXR0b25TY2FsZXInKTtcbi8vIHNjcmlwdHMvVUkvQnV0dG9uU2NhbGVyLmpzXG5cbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgcHJlc3NlZFNjYWxlOiAxLFxuICAgICAgICB0cmFuc0R1cmF0aW9uOiAwXG4gICAgfSxcblxuICAgIC8vIHVzZSB0aGlzIGZvciBpbml0aWFsaXphdGlvblxuICAgIG9uTG9hZDogZnVuY3Rpb24gb25Mb2FkKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBhdWRpb01uZyA9IGNjLmZpbmQoJ01lbnUvQXVkaW9NbmcnKSB8fCBjYy5maW5kKCdHYW1lL0F1ZGlvTW5nJyk7XG4gICAgICAgIGlmIChhdWRpb01uZykge1xuICAgICAgICAgICAgYXVkaW9NbmcgPSBhdWRpb01uZy5nZXRDb21wb25lbnQoJ0F1ZGlvTW5nJyk7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi5pbml0U2NhbGUgPSB0aGlzLm5vZGUuc2NhbGU7XG4gICAgICAgIHNlbGYuYnV0dG9uID0gc2VsZi5nZXRDb21wb25lbnQoY2MuQnV0dG9uKTtcbiAgICAgICAgc2VsZi5zY2FsZURvd25BY3Rpb24gPSBjYy5zY2FsZVRvKHNlbGYudHJhbnNEdXJhdGlvbiwgc2VsZi5wcmVzc2VkU2NhbGUpO1xuICAgICAgICBzZWxmLnNjYWxlVXBBY3Rpb24gPSBjYy5zY2FsZVRvKHNlbGYudHJhbnNEdXJhdGlvbiwgc2VsZi5pbml0U2NhbGUpO1xuICAgICAgICBmdW5jdGlvbiBvblRvdWNoRG93bihldmVudCkge1xuICAgICAgICAgICAgdGhpcy5zdG9wQWxsQWN0aW9ucygpO1xuICAgICAgICAgICAgaWYgKGF1ZGlvTW5nKSBhdWRpb01uZy5wbGF5QnV0dG9uKCk7XG4gICAgICAgICAgICB0aGlzLnJ1bkFjdGlvbihzZWxmLnNjYWxlRG93bkFjdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25Ub3VjaFVwKGV2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLnN0b3BBbGxBY3Rpb25zKCk7XG4gICAgICAgICAgICB0aGlzLnJ1bkFjdGlvbihzZWxmLnNjYWxlVXBBY3Rpb24pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubm9kZS5vbigndG91Y2hzdGFydCcsIG9uVG91Y2hEb3duLCB0aGlzLm5vZGUpO1xuICAgICAgICB0aGlzLm5vZGUub24oJ3RvdWNoZW5kJywgb25Ub3VjaFVwLCB0aGlzLm5vZGUpO1xuICAgICAgICB0aGlzLm5vZGUub24oJ3RvdWNoY2FuY2VsJywgb25Ub3VjaFVwLCB0aGlzLm5vZGUpO1xuICAgIH1cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnYWI2N2U1UWtpVkNCWjNESU1sV2hpQXQnLCAnQ2FyZCcpO1xuLy8gc2NyaXB0cy9DYXJkLmpzXG5cbmNjLkNsYXNzKHtcbiAgICBcImV4dGVuZHNcIjogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICAvLyBub2Rlc1xuICAgICAgICBwb2ludDogY2MuTGFiZWwsXG4gICAgICAgIHN1aXQ6IGNjLlNwcml0ZSxcbiAgICAgICAgbWFpblBpYzogY2MuU3ByaXRlLFxuICAgICAgICBjYXJkQkc6IGNjLlNwcml0ZSxcbiAgICAgICAgLy8gcmVzb3VyY2VzXG4gICAgICAgIHJlZFRleHRDb2xvcjogY2MuQ29sb3IuV0hJVEUsXG4gICAgICAgIGJsYWNrVGV4dENvbG9yOiBjYy5Db2xvci5XSElURSxcbiAgICAgICAgdGV4RnJvbnRCRzogY2MuU3ByaXRlRnJhbWUsXG4gICAgICAgIHRleEJhY2tCRzogY2MuU3ByaXRlRnJhbWUsXG4gICAgICAgIHRleEZhY2VzOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogW10sXG4gICAgICAgICAgICB0eXBlOiBjYy5TcHJpdGVGcmFtZVxuICAgICAgICB9LFxuICAgICAgICB0ZXhTdWl0QmlnOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogW10sXG4gICAgICAgICAgICB0eXBlOiBjYy5TcHJpdGVGcmFtZVxuICAgICAgICB9LFxuICAgICAgICB0ZXhTdWl0U21hbGw6IHtcbiAgICAgICAgICAgIFwiZGVmYXVsdFwiOiBbXSxcbiAgICAgICAgICAgIHR5cGU6IGNjLlNwcml0ZUZyYW1lXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gdXNlIHRoaXMgZm9yIGluaXRpYWxpemF0aW9uXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChjYXJkKSB7XG4gICAgICAgIHZhciBpc0ZhY2VDYXJkID0gY2FyZC5wb2ludCA+IDEwO1xuXG4gICAgICAgIGlmIChpc0ZhY2VDYXJkKSB7XG4gICAgICAgICAgICB0aGlzLm1haW5QaWMuc3ByaXRlRnJhbWUgPSB0aGlzLnRleEZhY2VzW2NhcmQucG9pbnQgLSAxMCAtIDFdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5tYWluUGljLnNwcml0ZUZyYW1lID0gdGhpcy50ZXhTdWl0QmlnW2NhcmQuc3VpdCAtIDFdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZm9yIGpzYlxuICAgICAgICB0aGlzLnBvaW50LnN0cmluZyA9IGNhcmQucG9pbnROYW1lO1xuXG4gICAgICAgIGlmIChjYXJkLmlzUmVkU3VpdCkge1xuICAgICAgICAgICAgdGhpcy5wb2ludC5ub2RlLmNvbG9yID0gdGhpcy5yZWRUZXh0Q29sb3I7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBvaW50Lm5vZGUuY29sb3IgPSB0aGlzLmJsYWNrVGV4dENvbG9yO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdWl0LnNwcml0ZUZyYW1lID0gdGhpcy50ZXhTdWl0U21hbGxbY2FyZC5zdWl0IC0gMV07XG4gICAgfSxcblxuICAgIHJldmVhbDogZnVuY3Rpb24gcmV2ZWFsKGlzRmFjZVVwKSB7XG4gICAgICAgIHRoaXMucG9pbnQubm9kZS5hY3RpdmUgPSBpc0ZhY2VVcDtcbiAgICAgICAgdGhpcy5zdWl0Lm5vZGUuYWN0aXZlID0gaXNGYWNlVXA7XG4gICAgICAgIHRoaXMubWFpblBpYy5ub2RlLmFjdGl2ZSA9IGlzRmFjZVVwO1xuICAgICAgICB0aGlzLmNhcmRCRy5zcHJpdGVGcmFtZSA9IGlzRmFjZVVwID8gdGhpcy50ZXhGcm9udEJHIDogdGhpcy50ZXhCYWNrQkc7XG4gICAgfVxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICdjZTJkZm9xRXVsSENMalMxWjl4UE43dCcsICdEZWFsZXInKTtcbi8vIHNjcmlwdHMvRGVhbGVyLmpzXG5cbnZhciBBY3RvciA9IHJlcXVpcmUoJ0FjdG9yJyk7XG52YXIgVXRpbHMgPSByZXF1aXJlKCdVdGlscycpO1xuXG5jYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBBY3RvcixcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgLy8g5omL5LiK5pyA5o6l6L+RIDIxIOeCueeahOeCueaVsO+8iOacieWPr+iDvei2hei/hyAyMSDngrnvvIlcbiAgICAgICAgYmVzdFBvaW50OiB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FyZHMgPSB0aGlzLmhvbGVDYXJkID8gW3RoaXMuaG9sZUNhcmRdLmNvbmNhdCh0aGlzLmNhcmRzKSA6IHRoaXMuY2FyZHM7XG4gICAgICAgICAgICAgICAgdmFyIG1pbk1heCA9IFV0aWxzLmdldE1pbk1heFBvaW50KGNhcmRzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWluTWF4Lm1heDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgIHRoaXMuX3N1cGVyKCk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuaW5pdERlYWxlcigpO1xuICAgIH0sXG5cbiAgICAvLyDov5Tlm57mmK/lkKbopoHniYxcbiAgICB3YW50SGl0OiBmdW5jdGlvbiB3YW50SGl0KCkge1xuICAgICAgICB2YXIgR2FtZSA9IHJlcXVpcmUoJ0dhbWUnKTtcbiAgICAgICAgdmFyIFR5cGVzID0gcmVxdWlyZSgnVHlwZXMnKTtcblxuICAgICAgICB2YXIgYmVzdFBvaW50ID0gdGhpcy5iZXN0UG9pbnQ7XG5cbiAgICAgICAgLy8g5bey57uP5pyA5aSn54K55pWwXG4gICAgICAgIGlmIChiZXN0UG9pbnQgPT09IDIxKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkuI3orrrmir3liLDku4DkuYjniYzogq/lrprkuI3kvJrniIbvvIzpgqPlsLHmjqXnnYDmir1cbiAgICAgICAgaWYgKGJlc3RQb2ludCA8PSAyMSAtIDEwKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwbGF5ZXIgPSBHYW1lLmluc3RhbmNlLnBsYXllcjtcbiAgICAgICAgdmFyIG91dGNvbWUgPSBHYW1lLmluc3RhbmNlLl9nZXRQbGF5ZXJSZXN1bHQocGxheWVyLCB0aGlzKTtcblxuICAgICAgICBzd2l0Y2ggKG91dGNvbWUpIHtcbiAgICAgICAgICAgIGNhc2UgVHlwZXMuT3V0Y29tZS5XaW46XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBjYXNlIFR5cGVzLk91dGNvbWUuTG9zZTpcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5iZXN0UG9pbnQgPCAxNztcbiAgICB9XG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzE3MDI0RzBKRnBIY0xJNUdSRWJGOFZOJywgJ0RlY2tzJyk7XG4vLyBzY3JpcHRzL21vZHVsZS9EZWNrcy5qc1xuXG52YXIgVHlwZXMgPSByZXF1aXJlKCdUeXBlcycpO1xuXG4vKipcbiAqIOaJkeWFi+euoeeQhuexu++8jOeUqOadpeeuoeeQhuS4gOWJr+aIluWkmuWJr+eJjFxuICogQGNsYXNzIERlY2tzXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1iZXJPZkRlY2tzIC0g5oC75YWx5Yeg5Ymv54mMXG4gKi9cbmZ1bmN0aW9uIERlY2tzKG51bWJlck9mRGVja3MpIHtcbiAgICAvLyDmgLvlhbHlh6Dlia/niYxcbiAgICB0aGlzLl9udW1iZXJPZkRlY2tzID0gbnVtYmVyT2ZEZWNrcztcbiAgICAvLyDov5jmsqHlj5Hlh7rljrvnmoTniYxcbiAgICB0aGlzLl9jYXJkSWRzID0gbmV3IEFycmF5KG51bWJlck9mRGVja3MgKiA1Mik7XG5cbiAgICB0aGlzLnJlc2V0KCk7XG59XG5cbi8qKlxuICog6YeN572u5omA5pyJ54mMXG4gKiBAbWV0aG9kIHJlc2V0XG4gKi9cbkRlY2tzLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9jYXJkSWRzLmxlbmd0aCA9IHRoaXMuX251bWJlck9mRGVja3MgKiA1MjtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBmcm9tSWQgPSBUeXBlcy5DYXJkLmZyb21JZDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX251bWJlck9mRGVja3M7ICsraSkge1xuICAgICAgICBmb3IgKHZhciBjYXJkSWQgPSAwOyBjYXJkSWQgPCA1MjsgKytjYXJkSWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NhcmRJZHNbaW5kZXhdID0gZnJvbUlkKGNhcmRJZCk7XG4gICAgICAgICAgICArK2luZGV4O1xuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gKiDpmo/mnLrmir3kuIDlvKDniYzvvIzlpoLmnpzlt7Lnu4/msqHniYzkuobvvIzlsIbov5Tlm54gbnVsbFxuICogQG1ldGhvZCBkcmF3XG4gKiBAcmV0dXJuIHtDYXJkfVxuICovXG5EZWNrcy5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FyZElkcyA9IHRoaXMuX2NhcmRJZHM7XG4gICAgdmFyIGxlbiA9IGNhcmRJZHMubGVuZ3RoO1xuICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIHJhbmRvbSA9IE1hdGgucmFuZG9tKCk7XG4gICAgdmFyIGluZGV4ID0gcmFuZG9tICogbGVuIHwgMDtcbiAgICB2YXIgcmVzdWx0ID0gY2FyZElkc1tpbmRleF07XG5cbiAgICAvLyDkv53mjIHmlbDnu4TntKflh5FcbiAgICB2YXIgbGFzdCA9IGNhcmRJZHNbbGVuIC0gMV07XG4gICAgY2FyZElkc1tpbmRleF0gPSBsYXN0O1xuICAgIGNhcmRJZHMubGVuZ3RoID0gbGVuIC0gMTtcblxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vLy8qKlxuLy8gKiDlj5HkuIDlvKDniYxcbi8vICogQG1ldGhvZCBkZWFsXG4vLyAqIEByZXR1cm4ge0NhcmR9XG4vLyAqL1xuLy9EZWNrcy5wcm90b3R5cGUuZGVhbCA9IGZ1bmN0aW9uICgpIHtcbi8vICAgIHRoaXMuX2NhcmRJZHMucG9wKCk7XG4vL307XG5cbi8vLyoqXG4vLyAqIOa0l+eJjFxuLy8gKiBAbWV0aG9kIHNodWZmbGVcbi8vICovXG4vL0RlY2tzLnByb3RvdHlwZS5zaHVmZmxlID0gZnVuY3Rpb24gKCkge1xuLy8gICAgc2h1ZmZsZUFycmF5KHRoaXMuX2NhcmRJZHMpO1xuLy99O1xuLy9cbi8vLyoqXG4vLyAqIFJhbmRvbWl6ZSBhcnJheSBlbGVtZW50IG9yZGVyIGluLXBsYWNlLlxuLy8gKiBVc2luZyBEdXJzdGVuZmVsZCBzaHVmZmxlIGFsZ29yaXRobS5cbi8vICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTI2NDY4NjRcbi8vICovXG4vL2Z1bmN0aW9uIHNodWZmbGVBcnJheShhcnJheSkge1xuLy8gICAgZm9yICh2YXIgaSA9IGFycmF5Lmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbi8vICAgICAgICB2YXIgaiA9IChNYXRoLnJhbmRvbSgpICogKGkgKyAxKSkgfCAwO1xuLy8gICAgICAgIHZhciB0ZW1wID0gYXJyYXlbaV07XG4vLyAgICAgICAgYXJyYXlbaV0gPSBhcnJheVtqXTtcbi8vICAgICAgICBhcnJheVtqXSA9IHRlbXA7XG4vLyAgICB9XG4vLyAgICByZXR1cm4gYXJyYXk7XG4vL31cblxubW9kdWxlLmV4cG9ydHMgPSBEZWNrcztcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzY4ZGEyeWpkR1ZNU1loWExOOUR1a0lCJywgJ0ZYUGxheWVyJyk7XG4vLyBzY3JpcHRzL0ZYUGxheWVyLmpzXG5cbmNjLkNsYXNzKHtcbiAgICBcImV4dGVuZHNcIjogY2MuQ29tcG9uZW50LFxuXG4gICAgLy8gdXNlIHRoaXMgZm9yIGluaXRpYWxpemF0aW9uXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgdGhpcy5hbmltID0gdGhpcy5nZXRDb21wb25lbnQoY2MuQW5pbWF0aW9uKTtcbiAgICAgICAgdGhpcy5zcHJpdGUgPSB0aGlzLmdldENvbXBvbmVudChjYy5TcHJpdGUpO1xuICAgIH0sXG5cbiAgICBzaG93OiBmdW5jdGlvbiBzaG93KF9zaG93KSB7XG4gICAgICAgIHRoaXMuc3ByaXRlLmVuYWJsZWQgPSBfc2hvdztcbiAgICB9LFxuXG4gICAgcGxheUZYOiBmdW5jdGlvbiBwbGF5RlgobmFtZSkge1xuICAgICAgICAvLyBuYW1lIGNhbiBiZSAnYmxhY2tqYWNrJyBvciAnYnVzdCdcbiAgICAgICAgdGhpcy5hbmltLnN0b3AoKTtcbiAgICAgICAgdGhpcy5hbmltLnBsYXkobmFtZSk7XG4gICAgfSxcblxuICAgIGhpZGVGWDogZnVuY3Rpb24gaGlkZUZYKCkge1xuICAgICAgICB0aGlzLnNwcml0ZS5lbmFibGVkID0gZmFsc2U7XG4gICAgfVxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICc2MzczOE9PTkNGS0hxc2Y0UVNlSlN1bicsICdHYW1lJyk7XG4vLyBzY3JpcHRzL0dhbWUuanNcblxudmFyIHBsYXllcnMgPSByZXF1aXJlKCdQbGF5ZXJEYXRhJykucGxheWVycztcbnZhciBEZWNrcyA9IHJlcXVpcmUoJ0RlY2tzJyk7XG52YXIgVHlwZXMgPSByZXF1aXJlKCdUeXBlcycpO1xudmFyIEFjdG9yUGxheWluZ1N0YXRlID0gVHlwZXMuQWN0b3JQbGF5aW5nU3RhdGU7XG52YXIgRnNtID0gcmVxdWlyZSgnZ2FtZS1mc20nKTtcblxudmFyIEdhbWUgPSBjYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIHBsYXllckFuY2hvcnM6IHtcbiAgICAgICAgICAgICdkZWZhdWx0JzogW10sXG4gICAgICAgICAgICB0eXBlOiBjYy5Ob2RlXG4gICAgICAgIH0sXG4gICAgICAgIHBsYXllclByZWZhYjogY2MuUHJlZmFiLFxuICAgICAgICBkZWFsZXI6IGNjLk5vZGUsXG4gICAgICAgIGluR2FtZVVJOiBjYy5Ob2RlLFxuICAgICAgICBiZXRVSTogY2MuTm9kZSxcbiAgICAgICAgYXNzZXRNbmc6IGNjLk5vZGUsXG4gICAgICAgIGF1ZGlvTW5nOiBjYy5Ob2RlLFxuICAgICAgICB0dXJuRHVyYXRpb246IDAsXG4gICAgICAgIGJldER1cmF0aW9uOiAwLFxuICAgICAgICB0b3RhbENoaXBzTnVtOiAwLFxuICAgICAgICB0b3RhbERpYW1vbmROdW06IDAsXG4gICAgICAgIG51bWJlck9mRGVja3M6IHtcbiAgICAgICAgICAgICdkZWZhdWx0JzogMSxcbiAgICAgICAgICAgIHR5cGU6ICdJbnRlZ2VyJ1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHN0YXRpY3M6IHtcbiAgICAgICAgaW5zdGFuY2U6IG51bGxcbiAgICB9LFxuXG4gICAgLy8gdXNlIHRoaXMgZm9yIGluaXRpYWxpemF0aW9uXG4gICAgb25Mb2FkOiBmdW5jdGlvbiBvbkxvYWQoKSB7XG4gICAgICAgIEdhbWUuaW5zdGFuY2UgPSB0aGlzO1xuICAgICAgICB0aGlzLmluR2FtZVVJID0gdGhpcy5pbkdhbWVVSS5nZXRDb21wb25lbnQoJ0luR2FtZVVJJyk7XG4gICAgICAgIHRoaXMuYXNzZXRNbmcgPSB0aGlzLmFzc2V0TW5nLmdldENvbXBvbmVudCgnQXNzZXRNbmcnKTtcbiAgICAgICAgdGhpcy5hdWRpb01uZyA9IHRoaXMuYXVkaW9NbmcuZ2V0Q29tcG9uZW50KCdBdWRpb01uZycpO1xuICAgICAgICB0aGlzLmJldFVJID0gdGhpcy5iZXRVSS5nZXRDb21wb25lbnQoJ0JldCcpO1xuICAgICAgICB0aGlzLmluR2FtZVVJLmluaXQodGhpcy5iZXREdXJhdGlvbik7XG4gICAgICAgIHRoaXMuYmV0VUkuaW5pdCgpO1xuICAgICAgICB0aGlzLmRlYWxlciA9IHRoaXMuZGVhbGVyLmdldENvbXBvbmVudCgnRGVhbGVyJyk7XG4gICAgICAgIHRoaXMuZGVhbGVyLmluaXQoKTtcblxuICAgICAgICAvL1xuICAgICAgICB0aGlzLnBsYXllciA9IG51bGw7XG4gICAgICAgIHRoaXMuY3JlYXRlUGxheWVycygpO1xuXG4gICAgICAgIC8vIHNob3J0Y3V0IHRvIHVpIGVsZW1lbnRcbiAgICAgICAgdGhpcy5pbmZvID0gdGhpcy5pbkdhbWVVSS5yZXN1bHRUeHQ7XG4gICAgICAgIHRoaXMudG90YWxDaGlwcyA9IHRoaXMuaW5HYW1lVUkubGFiZWxUb3RhbENoaXBzO1xuXG4gICAgICAgIC8vIGluaXQgbG9naWNcbiAgICAgICAgdGhpcy5kZWNrcyA9IG5ldyBEZWNrcyh0aGlzLm51bWJlck9mRGVja3MpO1xuICAgICAgICB0aGlzLmZzbSA9IEZzbTtcbiAgICAgICAgdGhpcy5mc20uaW5pdCh0aGlzKTtcblxuICAgICAgICAvLyBzdGFydFxuICAgICAgICB0aGlzLnVwZGF0ZVRvdGFsQ2hpcHMoKTtcblxuICAgICAgICB0aGlzLmF1ZGlvTW5nLnBsYXlNdXNpYygpO1xuICAgIH0sXG5cbiAgICBhZGRTdGFrZTogZnVuY3Rpb24gYWRkU3Rha2UoZGVsdGEpIHtcbiAgICAgICAgaWYgKHRoaXMudG90YWxDaGlwc051bSA8IGRlbHRhKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnbm90IGVub3VnaCBjaGlwcyEnKTtcbiAgICAgICAgICAgIHRoaXMuaW5mby5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaW5mby5zdHJpbmcgPSAn6YeR5biB5LiN6LazISc7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRvdGFsQ2hpcHNOdW0gLT0gZGVsdGE7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVRvdGFsQ2hpcHMoKTtcbiAgICAgICAgICAgIHRoaXMucGxheWVyLmFkZFN0YWtlKGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuYXVkaW9NbmcucGxheUNoaXBzKCk7XG4gICAgICAgICAgICB0aGlzLmluZm8uZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5pbmZvLnN0cmluZyA9ICfor7fkuIvms6gnO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzZXRTdGFrZTogZnVuY3Rpb24gcmVzZXRTdGFrZSgpIHtcbiAgICAgICAgdGhpcy50b3RhbENoaXBzTnVtICs9IHRoaXMucGxheWVyLnN0YWtlTnVtO1xuICAgICAgICB0aGlzLnBsYXllci5yZXNldFN0YWtlKCk7XG4gICAgICAgIHRoaXMudXBkYXRlVG90YWxDaGlwcygpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVUb3RhbENoaXBzOiBmdW5jdGlvbiB1cGRhdGVUb3RhbENoaXBzKCkge1xuICAgICAgICB0aGlzLnRvdGFsQ2hpcHMuc3RyaW5nID0gdGhpcy50b3RhbENoaXBzTnVtO1xuICAgICAgICB0aGlzLnBsYXllci5yZW5kZXJlci51cGRhdGVUb3RhbFN0YWtlKHRoaXMudG90YWxDaGlwc051bSk7XG4gICAgfSxcblxuICAgIGNyZWF0ZVBsYXllcnM6IGZ1bmN0aW9uIGNyZWF0ZVBsYXllcnMoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNTsgKytpKSB7XG4gICAgICAgICAgICB2YXIgcGxheWVyTm9kZSA9IGNjLmluc3RhbnRpYXRlKHRoaXMucGxheWVyUHJlZmFiKTtcbiAgICAgICAgICAgIHZhciBhbmNob3IgPSB0aGlzLnBsYXllckFuY2hvcnNbaV07XG4gICAgICAgICAgICB2YXIgc3dpdGNoU2lkZSA9IGkgPiAyO1xuICAgICAgICAgICAgYW5jaG9yLmFkZENoaWxkKHBsYXllck5vZGUpO1xuICAgICAgICAgICAgcGxheWVyTm9kZS5wb3NpdGlvbiA9IGNjLnAoMCwgMCk7XG5cbiAgICAgICAgICAgIHZhciBwbGF5ZXJJbmZvUG9zID0gY2MuZmluZCgnYW5jaG9yUGxheWVySW5mbycsIGFuY2hvcikuZ2V0UG9zaXRpb24oKTtcbiAgICAgICAgICAgIHZhciBzdGFrZVBvcyA9IGNjLmZpbmQoJ2FuY2hvclN0YWtlJywgYW5jaG9yKS5nZXRQb3NpdGlvbigpO1xuICAgICAgICAgICAgdmFyIGFjdG9yUmVuZGVyZXIgPSBwbGF5ZXJOb2RlLmdldENvbXBvbmVudCgnQWN0b3JSZW5kZXJlcicpO1xuICAgICAgICAgICAgYWN0b3JSZW5kZXJlci5pbml0KHBsYXllcnNbaV0sIHBsYXllckluZm9Qb3MsIHN0YWtlUG9zLCB0aGlzLnR1cm5EdXJhdGlvbiwgc3dpdGNoU2lkZSk7XG4gICAgICAgICAgICBpZiAoaSA9PT0gMikge1xuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyID0gcGxheWVyTm9kZS5nZXRDb21wb25lbnQoJ1BsYXllcicpO1xuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyLmluaXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBVSSBFVkVOVCBDQUxMQkFDS1NcblxuICAgIC8vIOeOqeWutuimgeeJjFxuICAgIGhpdDogZnVuY3Rpb24gaGl0KCkge1xuICAgICAgICB0aGlzLnBsYXllci5hZGRDYXJkKHRoaXMuZGVja3MuZHJhdygpKTtcbiAgICAgICAgaWYgKHRoaXMucGxheWVyLnN0YXRlID09PSBBY3RvclBsYXlpbmdTdGF0ZS5CdXN0KSB7XG4gICAgICAgICAgICAvLyBpZiBldmVyeSBwbGF5ZXIgZW5kXG4gICAgICAgICAgICB0aGlzLmZzbS5vblBsYXllckFjdGVkKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmF1ZGlvTW5nLnBsYXlDYXJkKCk7XG5cbiAgICAgICAgLy9pZiAodGhpcy5kZWFsZXIuc3RhdGUgPT09IEFjdG9yUGxheWluZ1N0YXRlLk5vcm1hbCkge1xuICAgICAgICAvLyAgICBpZiAodGhpcy5kZWFsZXIud2FudEhpdCgpKSB7XG4gICAgICAgIC8vICAgICAgICB0aGlzLmRlYWxlci5hZGRDYXJkKHRoaXMuZGVja3MuZHJhdygpKTtcbiAgICAgICAgLy8gICAgfVxuICAgICAgICAvLyAgICBlbHNlIHtcbiAgICAgICAgLy8gICAgICAgIHRoaXMuZGVhbGVyLnN0YW5kKCk7XG4gICAgICAgIC8vICAgIH1cbiAgICAgICAgLy99XG4gICAgICAgIC8vXG4gICAgICAgIC8vaWYgKHRoaXMuZGVhbGVyLnN0YXRlID09PSBBY3RvclBsYXlpbmdTdGF0ZS5CdXN0KSB7XG4gICAgICAgIC8vICAgIHRoaXMuc3RhdGUgPSBHYW1pbmdTdGF0ZS5FbmQ7XG4gICAgICAgIC8vfVxuICAgICAgICB0aGlzLmF1ZGlvTW5nLnBsYXlCdXR0b24oKTtcbiAgICB9LFxuXG4gICAgLy8g546p5a625YGc54mMXG4gICAgc3RhbmQ6IGZ1bmN0aW9uIHN0YW5kKCkge1xuICAgICAgICB0aGlzLnBsYXllci5zdGFuZCgpO1xuXG4gICAgICAgIHRoaXMuYXVkaW9NbmcucGxheUJ1dHRvbigpO1xuXG4gICAgICAgIC8vIGlmIGV2ZXJ5IHBsYXllciBlbmRcbiAgICAgICAgdGhpcy5mc20ub25QbGF5ZXJBY3RlZCgpO1xuICAgIH0sXG5cbiAgICAvL1xuICAgIGRlYWw6IGZ1bmN0aW9uIGRlYWwoKSB7XG4gICAgICAgIHRoaXMuZnNtLnRvRGVhbCgpO1xuICAgICAgICB0aGlzLmF1ZGlvTW5nLnBsYXlCdXR0b24oKTtcbiAgICB9LFxuXG4gICAgLy9cbiAgICBzdGFydDogZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgIHRoaXMuZnNtLnRvQmV0KCk7XG4gICAgICAgIHRoaXMuYXVkaW9NbmcucGxheUJ1dHRvbigpO1xuICAgIH0sXG5cbiAgICAvLyDnjqnlrrbmiqXliLBcbiAgICByZXBvcnQ6IGZ1bmN0aW9uIHJlcG9ydCgpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXIucmVwb3J0KCk7XG5cbiAgICAgICAgLy8gaWYgZXZlcnkgcGxheWVyIGVuZFxuICAgICAgICB0aGlzLmZzbS5vblBsYXllckFjdGVkKCk7XG4gICAgfSxcblxuICAgIHF1aXRUb01lbnU6IGZ1bmN0aW9uIHF1aXRUb01lbnUoKSB7XG4gICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZSgnbWVudScpO1xuICAgIH0sXG5cbiAgICAvLyBGU00gQ0FMTEJBQ0tTXG5cbiAgICBvbkVudGVyRGVhbFN0YXRlOiBmdW5jdGlvbiBvbkVudGVyRGVhbFN0YXRlKCkge1xuICAgICAgICB0aGlzLmJldFVJLnJlc2V0VG9zc2VkQ2hpcHMoKTtcbiAgICAgICAgdGhpcy5pbkdhbWVVSS5yZXNldENvdW50ZG93bigpO1xuICAgICAgICB0aGlzLnBsYXllci5yZW5kZXJlci5zaG93U3Rha2VDaGlwcyh0aGlzLnBsYXllci5zdGFrZU51bSk7XG4gICAgICAgIHRoaXMucGxheWVyLmFkZENhcmQodGhpcy5kZWNrcy5kcmF3KCkpO1xuICAgICAgICB2YXIgaG9sZENhcmQgPSB0aGlzLmRlY2tzLmRyYXcoKTtcbiAgICAgICAgdGhpcy5kZWFsZXIuYWRkSG9sZUNhcmQoaG9sZENhcmQpO1xuICAgICAgICB0aGlzLnBsYXllci5hZGRDYXJkKHRoaXMuZGVja3MuZHJhdygpKTtcbiAgICAgICAgdGhpcy5kZWFsZXIuYWRkQ2FyZCh0aGlzLmRlY2tzLmRyYXcoKSk7XG4gICAgICAgIHRoaXMuYXVkaW9NbmcucGxheUNhcmQoKTtcbiAgICAgICAgdGhpcy5mc20ub25EZWFsZWQoKTtcbiAgICB9LFxuXG4gICAgb25QbGF5ZXJzVHVyblN0YXRlOiBmdW5jdGlvbiBvblBsYXllcnNUdXJuU3RhdGUoZW50ZXIpIHtcbiAgICAgICAgaWYgKGVudGVyKSB7XG4gICAgICAgICAgICB0aGlzLmluR2FtZVVJLnNob3dHYW1lU3RhdGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkVudGVyRGVhbGVyc1R1cm5TdGF0ZTogZnVuY3Rpb24gb25FbnRlckRlYWxlcnNUdXJuU3RhdGUoKSB7XG4gICAgICAgIHdoaWxlICh0aGlzLmRlYWxlci5zdGF0ZSA9PT0gQWN0b3JQbGF5aW5nU3RhdGUuTm9ybWFsKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kZWFsZXIud2FudEhpdCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZWFsZXIuYWRkQ2FyZCh0aGlzLmRlY2tzLmRyYXcoKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVhbGVyLnN0YW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mc20ub25EZWFsZXJBY3RlZCgpO1xuICAgIH0sXG5cbiAgICAvLyDnu5PnrpdcbiAgICBvbkVuZFN0YXRlOiBmdW5jdGlvbiBvbkVuZFN0YXRlKGVudGVyKSB7XG4gICAgICAgIGlmIChlbnRlcikge1xuICAgICAgICAgICAgdGhpcy5kZWFsZXIucmV2ZWFsSG9sZENhcmQoKTtcbiAgICAgICAgICAgIHRoaXMuaW5HYW1lVUkuc2hvd1Jlc3VsdFN0YXRlKCk7XG5cbiAgICAgICAgICAgIHZhciBvdXRjb21lID0gdGhpcy5fZ2V0UGxheWVyUmVzdWx0KHRoaXMucGxheWVyLCB0aGlzLmRlYWxlcik7XG4gICAgICAgICAgICBzd2l0Y2ggKG91dGNvbWUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFR5cGVzLk91dGNvbWUuV2luOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluZm8uc3RyaW5nID0gJ1lvdSBXaW4nO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmF1ZGlvTW5nLnBhdXNlTXVzaWMoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hdWRpb01uZy5wbGF5V2luKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOaLv+WbnuWOn+WFiOiHquW3seeahOetueeggVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvdGFsQ2hpcHNOdW0gKz0gdGhpcy5wbGF5ZXIuc3Rha2VOdW07XG4gICAgICAgICAgICAgICAgICAgIC8vIOWlluWKseetueeggVxuICAgICAgICAgICAgICAgICAgICB2YXIgd2luQ2hpcHNOdW0gPSB0aGlzLnBsYXllci5zdGFrZU51bTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnBsYXllci5zdGF0ZSA9PT0gVHlwZXMuQWN0b3JQbGF5aW5nU3RhdGUuUmVwb3J0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wbGF5ZXIuaGFuZCA9PT0gVHlwZXMuSGFuZC5CbGFja0phY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5DaGlwc051bSAqPSAxLjU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOS6lOWwj+m+mVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbkNoaXBzTnVtICo9IDIuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvdGFsQ2hpcHNOdW0gKz0gd2luQ2hpcHNOdW07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVG90YWxDaGlwcygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgVHlwZXMuT3V0Y29tZS5Mb3NlOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluZm8uc3RyaW5nID0gJ1lvdSBMb3NlJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hdWRpb01uZy5wYXVzZU11c2ljKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXVkaW9NbmcucGxheUxvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIFR5cGVzLk91dGNvbWUuVGllOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluZm8uc3RyaW5nID0gJ0RyYXcnO1xuICAgICAgICAgICAgICAgICAgICAvLyDpgIDov5jnrbnnoIFcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b3RhbENoaXBzTnVtICs9IHRoaXMucGxheWVyLnN0YWtlTnVtO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRvdGFsQ2hpcHMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmluZm8uZW5hYmxlZCA9IGVudGVyO1xuICAgIH0sXG5cbiAgICAvLyDkuIvms6hcbiAgICBvbkJldFN0YXRlOiBmdW5jdGlvbiBvbkJldFN0YXRlKGVudGVyKSB7XG4gICAgICAgIGlmIChlbnRlcikge1xuICAgICAgICAgICAgdGhpcy5kZWNrcy5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy5wbGF5ZXIucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMuZGVhbGVyLnJlc2V0KCk7XG4gICAgICAgICAgICB0aGlzLmluZm8uc3RyaW5nID0gJ+ivt+S4i+azqCc7XG4gICAgICAgICAgICB0aGlzLmluR2FtZVVJLnNob3dCZXRTdGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5pbkdhbWVVSS5zdGFydENvdW50ZG93bigpO1xuXG4gICAgICAgICAgICB0aGlzLmF1ZGlvTW5nLnJlc3VtZU11c2ljKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbmZvLmVuYWJsZWQgPSBlbnRlcjtcbiAgICB9LFxuXG4gICAgLy8gUFJJVkFURVNcblxuICAgIC8vIOWIpOaWreeOqeWutui+k+i1olxuICAgIF9nZXRQbGF5ZXJSZXN1bHQ6IGZ1bmN0aW9uIF9nZXRQbGF5ZXJSZXN1bHQocGxheWVyLCBkZWFsZXIpIHtcbiAgICAgICAgdmFyIE91dGNvbWUgPSBUeXBlcy5PdXRjb21lO1xuICAgICAgICBpZiAocGxheWVyLnN0YXRlID09PSBBY3RvclBsYXlpbmdTdGF0ZS5CdXN0KSB7XG4gICAgICAgICAgICByZXR1cm4gT3V0Y29tZS5Mb3NlO1xuICAgICAgICB9IGVsc2UgaWYgKGRlYWxlci5zdGF0ZSA9PT0gQWN0b3JQbGF5aW5nU3RhdGUuQnVzdCkge1xuICAgICAgICAgICAgcmV0dXJuIE91dGNvbWUuV2luO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHBsYXllci5zdGF0ZSA9PT0gQWN0b3JQbGF5aW5nU3RhdGUuUmVwb3J0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE91dGNvbWUuV2luO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAocGxheWVyLmhhbmQgPiBkZWFsZXIuaGFuZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gT3V0Y29tZS5XaW47XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuaGFuZCA8IGRlYWxlci5oYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPdXRjb21lLkxvc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBsYXllci5iZXN0UG9pbnQgPT09IGRlYWxlci5iZXN0UG9pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPdXRjb21lLlRpZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYmVzdFBvaW50IDwgZGVhbGVyLmJlc3RQb2ludCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE91dGNvbWUuTG9zZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPdXRjb21lLldpbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICdmMTkyZWZyb2VGRXlheHRmaDhUVlhZeicsICdJbkdhbWVVSScpO1xuLy8gc2NyaXB0cy9VSS9JbkdhbWVVSS5qc1xuXG52YXIgR2FtZSA9IHJlcXVpcmUoJ0dhbWUnKTtcblxuY2MuQ2xhc3Moe1xuICAgICdleHRlbmRzJzogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBwYW5lbENoYXQ6IGNjLk5vZGUsXG4gICAgICAgIHBhbmVsU29jaWFsOiBjYy5Ob2RlLFxuICAgICAgICBiZXRTdGF0ZVVJOiBjYy5Ob2RlLFxuICAgICAgICBnYW1lU3RhdGVVSTogY2MuTm9kZSxcbiAgICAgICAgcmVzdWx0VHh0OiBjYy5MYWJlbCxcbiAgICAgICAgYmV0Q291bnRlcjogY2MuUHJvZ3Jlc3NCYXIsXG4gICAgICAgIGJ0blN0YXJ0OiBjYy5Ob2RlLFxuICAgICAgICBsYWJlbFRvdGFsQ2hpcHM6IGNjLkxhYmVsXG4gICAgfSxcblxuICAgIC8vIHVzZSB0aGlzIGZvciBpbml0aWFsaXphdGlvblxuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQoYmV0RHVyYXRpb24pIHtcbiAgICAgICAgdGhpcy5wYW5lbENoYXQuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMucGFuZWxTb2NpYWwuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVzdWx0VHh0LmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5iZXRTdGF0ZVVJLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIHRoaXMuZ2FtZVN0YXRlVUkuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIC8vIHRoaXMucmVzdWx0U3RhdGVVSS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5idG5TdGFydC5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5iZXREdXJhdGlvbiA9IGJldER1cmF0aW9uO1xuICAgICAgICB0aGlzLmJldFRpbWVyID0gMDtcbiAgICAgICAgdGhpcy5pc0JldENvdW50aW5nID0gZmFsc2U7XG4gICAgfSxcblxuICAgIHN0YXJ0Q291bnRkb3duOiBmdW5jdGlvbiBzdGFydENvdW50ZG93bigpIHtcbiAgICAgICAgaWYgKHRoaXMuYmV0Q291bnRlcikge1xuICAgICAgICAgICAgdGhpcy5iZXRUaW1lciA9IDA7XG4gICAgICAgICAgICB0aGlzLmlzQmV0Q291bnRpbmcgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlc2V0Q291bnRkb3duOiBmdW5jdGlvbiByZXNldENvdW50ZG93bigpIHtcbiAgICAgICAgaWYgKHRoaXMuYmV0Q291bnRlcikge1xuICAgICAgICAgICAgdGhpcy5iZXRUaW1lciA9IDA7XG4gICAgICAgICAgICB0aGlzLmlzQmV0Q291bnRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuYmV0Q291bnRlci5wcm9ncmVzcyA9IDA7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2hvd0JldFN0YXRlOiBmdW5jdGlvbiBzaG93QmV0U3RhdGUoKSB7XG4gICAgICAgIHRoaXMuYmV0U3RhdGVVSS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICB0aGlzLmdhbWVTdGF0ZVVJLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmJ0blN0YXJ0LmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICBzaG93R2FtZVN0YXRlOiBmdW5jdGlvbiBzaG93R2FtZVN0YXRlKCkge1xuICAgICAgICB0aGlzLmJldFN0YXRlVUkuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZ2FtZVN0YXRlVUkuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5idG5TdGFydC5hY3RpdmUgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgc2hvd1Jlc3VsdFN0YXRlOiBmdW5jdGlvbiBzaG93UmVzdWx0U3RhdGUoKSB7XG4gICAgICAgIHRoaXMuYmV0U3RhdGVVSS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5nYW1lU3RhdGVVSS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5idG5TdGFydC5hY3RpdmUgPSB0cnVlO1xuICAgIH0sXG5cbiAgICB0b2dnbGVDaGF0OiBmdW5jdGlvbiB0b2dnbGVDaGF0KCkge1xuICAgICAgICB0aGlzLnBhbmVsQ2hhdC5hY3RpdmUgPSAhdGhpcy5wYW5lbENoYXQuYWN0aXZlO1xuICAgIH0sXG5cbiAgICB0b2dnbGVTb2NpYWw6IGZ1bmN0aW9uIHRvZ2dsZVNvY2lhbCgpIHtcbiAgICAgICAgdGhpcy5wYW5lbFNvY2lhbC5hY3RpdmUgPSAhdGhpcy5wYW5lbFNvY2lhbC5hY3RpdmU7XG4gICAgfSxcblxuICAgIC8vIGNhbGxlZCBldmVyeSBmcmFtZVxuICAgIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlKGR0KSB7XG4gICAgICAgIGlmICh0aGlzLmlzQmV0Q291bnRpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuYmV0Q291bnRlci5wcm9ncmVzcyA9IHRoaXMuYmV0VGltZXIgLyB0aGlzLmJldER1cmF0aW9uO1xuICAgICAgICAgICAgdGhpcy5iZXRUaW1lciArPSBkdDtcbiAgICAgICAgICAgIGlmICh0aGlzLmJldFRpbWVyID49IHRoaXMuYmV0RHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQmV0Q291bnRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLmJldENvdW50ZXIucHJvZ3Jlc3MgPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICcyMmM4NXUyN1paTGY0WDloTzNXL3pmUCcsICdMb2dpbicpO1xuLy8gc2NyaXB0cy9Mb2dpbi5qc1xuXG5jYy5DbGFzcyh7XG4gICAgXCJleHRlbmRzXCI6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgaW5wdXRVc2VybmFtZTogY2MuRWRpdEJveCxcbiAgICAgICAgaW5wdXRQYXNzOiBjYy5FZGl0Qm94XG4gICAgICAgIC8vIGZvbzoge1xuICAgICAgICAvLyAgICBkZWZhdWx0OiBudWxsLFxuICAgICAgICAvLyAgICB1cmw6IGNjLlRleHR1cmUyRCwgIC8vIG9wdGlvbmFsLCBkZWZhdWx0IGlzIHR5cGVvZiBkZWZhdWx0XG4gICAgICAgIC8vICAgIHNlcmlhbGl6YWJsZTogdHJ1ZSwgLy8gb3B0aW9uYWwsIGRlZmF1bHQgaXMgdHJ1ZVxuICAgICAgICAvLyAgICB2aXNpYmxlOiB0cnVlLCAgICAgIC8vIG9wdGlvbmFsLCBkZWZhdWx0IGlzIHRydWVcbiAgICAgICAgLy8gICAgZGlzcGxheU5hbWU6ICdGb28nLCAvLyBvcHRpb25hbFxuICAgICAgICAvLyAgICByZWFkb25seTogZmFsc2UsICAgIC8vIG9wdGlvbmFsLCBkZWZhdWx0IGlzIGZhbHNlXG4gICAgICAgIC8vIH0sXG4gICAgICAgIC8vIC4uLlxuICAgIH0sXG5cbiAgICAvLyB1c2UgdGhpcyBmb3IgaW5pdGlhbGl6YXRpb25cbiAgICBvbkxvYWQ6IGZ1bmN0aW9uIG9uTG9hZCgpIHt9LFxuXG4gICAgZW50ZXJNZW51OiBmdW5jdGlvbiBlbnRlck1lbnUoKSB7XG4gICAgICAgIHZhciB1c2VybmFtZSA9IHRoaXMuaW5wdXRVc2VybmFtZS5zdHJpbmc7XG4gICAgICAgIHZhciBwYXNzID0gdGhpcy5pbnB1dFBhc3Muc3RyaW5nO1xuICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHZhciB1cmwgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6ODA4OC93ZWxjb21lLz9hY3Rpb249dXNlci5zaWduaW5cIjtcbiAgICAgICAgdmFyIGRhdGEgPSBcInVzZXJuYW1lPVwiICsgdXNlcm5hbWUgKyBcIiZwYXNzPVwiICsgcGFzcztcbiAgICAgICAgLy92YXIgZGF0YSA9IEpTT04uc3RyaW5naWZ5KHtcInVzZXJuYW1lXCI6IHVzZXJuYW1lLCBcInBhc3NcIjogcGFzc30pO1xuICAgICAgICAvL3ZhciBkYXRhID0ge1widXNlcm5hbWVcIjogdXNlcm5hbWUsIFwicGFzc1wiOiBwYXNzfTtcbiAgICAgICAgYWxlcnQodHlwZW9mIGRhdGEpO1xuICAgICAgICBhbGVydChkYXRhKTtcbiAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PSA0ICYmIHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCA0MDApIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgICAgIGFsZXJ0KHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB4aHIub3BlbihcIlBPU1RcIiwgdXJsLCB0cnVlKTtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcIik7XG4gICAgICAgIHhoci5zZW5kKGRhdGEpO1xuXG4gICAgICAgIC8qIHdzID0gbmV3IFdlYlNvY2tldChcIndzOi8vMTI3LjAuMC4xL3dlbGNvbWUvXCIpO1xuICAgICAgICB3cy5vbm9wZW4gPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU2VuZCBUZXh0IFdTIHdhcyBvcGVuZWQuXCIpO1xuICAgICAgICB9O1xuICAgICAgICB3cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicmVzcG9uc2UgdGV4dCBtc2c6IFwiICsgZXZlbnQuZGF0YSk7XG4gICAgICAgIH07XG4gICAgICAgIHdzLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU2VuZCBUZXh0IGZpcmVkIGFuIGVycm9yXCIpO1xuICAgICAgICB9O1xuICAgICAgICB3cy5vbmNsb3NlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIldlYlNvY2tldCBpbnN0YW5jZSBjbG9zZWQuXCIpO1xuICAgICAgICB9O1xuICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAod3MucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0Lk9QRU4pIHtcbiAgICAgICAgICAgICAgICB3cy5zZW5kKFwiSGVsbG8gV2ViU29ja2V0LCBJJ20gYSB0ZXh0IG1lc3NhZ2UuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJXZWJTb2NrZXQgaW5zdGFuY2Ugd2Fzbid0IHJlYWR5Li4uXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAzKTsqL1xuXG4gICAgICAgIC8vIGNjLmRpcmVjdG9yLmxvYWRTY2VuZSgnbWVudScpO1xuICAgIH1cblxuICAgIC8vIGNhbGxlZCBldmVyeSBmcmFtZSwgdW5jb21tZW50IHRoaXMgZnVuY3Rpb24gdG8gYWN0aXZhdGUgdXBkYXRlIGNhbGxiYWNrXG4gICAgLy8gdXBkYXRlOiBmdW5jdGlvbiAoZHQpIHtcblxuICAgIC8vIH0sXG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzIwZjYwbSszUmxHTzd4Mi9BUnpaNlFjJywgJ01lbnUnKTtcbi8vIHNjcmlwdHMvTWVudS5qc1xuXG5jYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIGF1ZGlvTW5nOiBjYy5Ob2RlXG4gICAgfSxcblxuICAgIC8vIHVzZSB0aGlzIGZvciBpbml0aWFsaXphdGlvblxuICAgIG9uTG9hZDogZnVuY3Rpb24gb25Mb2FkKCkge1xuICAgICAgICB0aGlzLmF1ZGlvTW5nID0gdGhpcy5hdWRpb01uZy5nZXRDb21wb25lbnQoJ0F1ZGlvTW5nJyk7XG4gICAgICAgIHRoaXMuYXVkaW9NbmcucGxheU11c2ljKCk7XG4gICAgfSxcblxuICAgIHBsYXlHYW1lOiBmdW5jdGlvbiBwbGF5R2FtZSgpIHtcbiAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKCd0YWJsZScpO1xuICAgIH0sXG5cbiAgICAvLyBjYWxsZWQgZXZlcnkgZnJhbWVcbiAgICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZShkdCkge31cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnNTQzOTdjVXhlaEd6cUVxcE1VR0hlanMnLCAnTW9kYWxVSScpO1xuLy8gc2NyaXB0cy9VSS9Nb2RhbFVJLmpzXG5cbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgbWFzazogY2MuTm9kZVxuICAgIH0sXG5cbiAgICAvLyB1c2UgdGhpcyBmb3IgaW5pdGlhbGl6YXRpb25cbiAgICBvbkxvYWQ6IGZ1bmN0aW9uIG9uTG9hZCgpIHt9LFxuXG4gICAgb25FbmFibGU6IGZ1bmN0aW9uIG9uRW5hYmxlKCkge1xuICAgICAgICB0aGlzLm1hc2sub24oJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5tYXNrLm9uKCd0b3VjaGVuZCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbkRpc2FibGU6IGZ1bmN0aW9uIG9uRGlzYWJsZSgpIHtcbiAgICAgICAgdGhpcy5tYXNrLm9mZigndG91Y2hzdGFydCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm1hc2sub2ZmKCd0b3VjaGVuZCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIGNhbGxlZCBldmVyeSBmcmFtZSwgdW5jb21tZW50IHRoaXMgZnVuY3Rpb24gdG8gYWN0aXZhdGUgdXBkYXRlIGNhbGxiYWNrXG4gICAgLy8gdXBkYXRlOiBmdW5jdGlvbiAoZHQpIHtcblxuICAgIC8vIH0sXG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzRmOWM1ZVh4cWhIQUtMeFplUm1nSERCJywgJ1BsYXllckRhdGEnKTtcbi8vIHNjcmlwdHMvbW9kdWxlL1BsYXllckRhdGEuanNcblxudmFyIHBsYXllcnMgPSBbe1xuXHRuYW1lOiAn5aWl5be06amsJyxcblx0Z29sZDogMzAwMCxcblx0cGhvdG9JZHg6IDBcbn0sIHtcblx0bmFtZTogJ3RydW1wJyxcblx0Z29sZDogMjAwMCxcblx0cGhvdG9JZHg6IDFcbn0sIHtcblx0bmFtZTogJ+S5oCcsXG5cdGdvbGQ6IDE1MDAsXG5cdHBob3RvSWR4OiAyXG59LCB7XG5cdG5hbWU6ICfmma7kuqwnLFxuXHRnb2xkOiA1MDAsXG5cdHBob3RvSWR4OiAzXG59LCB7XG5cdG5hbWU6ICfluIzmi4nph4wnLFxuXHRnb2xkOiA5MDAwLFxuXHRwaG90b0lkeDogNFxufSwge1xuXHRuYW1lOiAn6JukJyxcblx0Z29sZDogNTAwMCxcblx0cGhvdG9JZHg6IDVcbn0sIHtcblx0bmFtZTogJ+a2mycsXG5cdGdvbGQ6IDEwMDAwLFxuXHRwaG90b0lkeDogNlxufV07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRwbGF5ZXJzOiBwbGF5ZXJzXG59O1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnMjI2YTJBdnpScEhMN1NKR1RNeTVQRFgnLCAnUGxheWVyJyk7XG4vLyBzY3JpcHRzL1BsYXllci5qc1xuXG52YXIgQWN0b3IgPSByZXF1aXJlKCdBY3RvcicpO1xuXG5jYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBBY3RvcixcblxuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgIHRoaXMuX3N1cGVyKCk7XG4gICAgICAgIHRoaXMubGFiZWxTdGFrZSA9IHRoaXMucmVuZGVyZXIubGFiZWxTdGFrZU9uVGFibGU7XG4gICAgICAgIHRoaXMuc3Rha2VOdW0gPSAwO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICAgIHRoaXMuX3N1cGVyKCk7XG4gICAgICAgIHRoaXMucmVzZXRTdGFrZSgpO1xuICAgIH0sXG5cbiAgICBhZGRDYXJkOiBmdW5jdGlvbiBhZGRDYXJkKGNhcmQpIHtcbiAgICAgICAgdGhpcy5fc3VwZXIoY2FyZCk7XG5cbiAgICAgICAgLy8gdmFyIEdhbWUgPSByZXF1aXJlKCdHYW1lJyk7XG4gICAgICAgIC8vIEdhbWUuaW5zdGFuY2UuY2FuUmVwb3J0ID0gdGhpcy5jYW5SZXBvcnQ7XG4gICAgfSxcblxuICAgIGFkZFN0YWtlOiBmdW5jdGlvbiBhZGRTdGFrZShkZWx0YSkge1xuICAgICAgICB0aGlzLnN0YWtlTnVtICs9IGRlbHRhO1xuICAgICAgICB0aGlzLnVwZGF0ZVN0YWtlKHRoaXMuc3Rha2VOdW0pO1xuICAgIH0sXG5cbiAgICByZXNldFN0YWtlOiBmdW5jdGlvbiByZXNldFN0YWtlKGRlbHRhKSB7XG4gICAgICAgIHRoaXMuc3Rha2VOdW0gPSAwO1xuICAgICAgICB0aGlzLnVwZGF0ZVN0YWtlKHRoaXMuc3Rha2VOdW0pO1xuICAgIH0sXG5cbiAgICB1cGRhdGVTdGFrZTogZnVuY3Rpb24gdXBkYXRlU3Rha2UobnVtYmVyKSB7XG4gICAgICAgIHRoaXMubGFiZWxTdGFrZS5zdHJpbmcgPSBudW1iZXI7XG4gICAgfVxuXG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzE2NTdld2ZpakJPWExxNXpHcXI2UHZFJywgJ1JhbmtJdGVtJyk7XG4vLyBzY3JpcHRzL1VJL1JhbmtJdGVtLmpzXG5cbmNjLkNsYXNzKHtcbiAgICBcImV4dGVuZHNcIjogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBzcFJhbmtCRzogY2MuU3ByaXRlLFxuICAgICAgICBsYWJlbFJhbms6IGNjLkxhYmVsLFxuICAgICAgICBsYWJlbFBsYXllck5hbWU6IGNjLkxhYmVsLFxuICAgICAgICBsYWJlbEdvbGQ6IGNjLkxhYmVsLFxuICAgICAgICBzcFBsYXllclBob3RvOiBjYy5TcHJpdGUsXG4gICAgICAgIHRleFJhbmtCRzogY2MuU3ByaXRlRnJhbWUsXG4gICAgICAgIHRleFBsYXllclBob3RvOiBjYy5TcHJpdGVGcmFtZVxuICAgICAgICAvLyAuLi5cbiAgICB9LFxuXG4gICAgLy8gdXNlIHRoaXMgZm9yIGluaXRpYWxpemF0aW9uXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChyYW5rLCBwbGF5ZXJJbmZvKSB7XG4gICAgICAgIGlmIChyYW5rIDwgMykge1xuICAgICAgICAgICAgLy8gc2hvdWxkIGRpc3BsYXkgdHJvcGh5XG4gICAgICAgICAgICB0aGlzLmxhYmVsUmFuay5ub2RlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5zcFJhbmtCRy5zcHJpdGVGcmFtZSA9IHRoaXMudGV4UmFua0JHW3JhbmtdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sYWJlbFJhbmsubm9kZS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5sYWJlbFJhbmsuc3RyaW5nID0gKHJhbmsgKyAxKS50b1N0cmluZygpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5sYWJlbFBsYXllck5hbWUuc3RyaW5nID0gcGxheWVySW5mby5uYW1lO1xuICAgICAgICB0aGlzLmxhYmVsR29sZC5zdHJpbmcgPSBwbGF5ZXJJbmZvLmdvbGQudG9TdHJpbmcoKTtcbiAgICAgICAgdGhpcy5zcFBsYXllclBob3RvLnNwcml0ZUZyYW1lID0gdGhpcy50ZXhQbGF5ZXJQaG90b1twbGF5ZXJJbmZvLnBob3RvSWR4XTtcbiAgICB9LFxuXG4gICAgLy8gY2FsbGVkIGV2ZXJ5IGZyYW1lXG4gICAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoZHQpIHt9XG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJ2ZlM2ZjSXhDRkZMcktIZzZzNSt4UlVVJywgJ1JhbmtMaXN0Jyk7XG4vLyBzY3JpcHRzL1VJL1JhbmtMaXN0LmpzXG5cbnZhciBwbGF5ZXJzID0gcmVxdWlyZSgnUGxheWVyRGF0YScpLnBsYXllcnM7XG5cbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgc2Nyb2xsVmlldzogY2MuU2Nyb2xsVmlldyxcbiAgICAgICAgcHJlZmFiUmFua0l0ZW06IGNjLlByZWZhYixcbiAgICAgICAgcmFua0NvdW50OiAwXG4gICAgfSxcblxuICAgIC8vIHVzZSB0aGlzIGZvciBpbml0aWFsaXphdGlvblxuICAgIG9uTG9hZDogZnVuY3Rpb24gb25Mb2FkKCkge1xuICAgICAgICB0aGlzLmNvbnRlbnQgPSB0aGlzLnNjcm9sbFZpZXcuY29udGVudDtcbiAgICAgICAgdGhpcy5wb3B1bGF0ZUxpc3QoKTtcbiAgICB9LFxuXG4gICAgcG9wdWxhdGVMaXN0OiBmdW5jdGlvbiBwb3B1bGF0ZUxpc3QoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5yYW5rQ291bnQ7ICsraSkge1xuICAgICAgICAgICAgdmFyIHBsYXllckluZm8gPSBwbGF5ZXJzW2ldO1xuICAgICAgICAgICAgdmFyIGl0ZW0gPSBjYy5pbnN0YW50aWF0ZSh0aGlzLnByZWZhYlJhbmtJdGVtKTtcbiAgICAgICAgICAgIGl0ZW0uZ2V0Q29tcG9uZW50KCdSYW5rSXRlbScpLmluaXQoaSwgcGxheWVySW5mbyk7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnQuYWRkQ2hpbGQoaXRlbSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gY2FsbGVkIGV2ZXJ5IGZyYW1lXG4gICAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoZHQpIHt9XG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzNhYWU3bFpLeWhQcXFzTEQzd01LbDZYJywgJ1NpZGVTd2l0Y2hlcicpO1xuLy8gc2NyaXB0cy9TaWRlU3dpdGNoZXIuanNcblxuY2MuQ2xhc3Moe1xuICAgIFwiZXh0ZW5kc1wiOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIHJldGFpblNpZGVOb2Rlczoge1xuICAgICAgICAgICAgXCJkZWZhdWx0XCI6IFtdLFxuICAgICAgICAgICAgdHlwZTogY2MuTm9kZVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIHVzZSB0aGlzIGZvciBpbml0aWFsaXphdGlvblxuICAgIHN3aXRjaFNpZGU6IGZ1bmN0aW9uIHN3aXRjaFNpZGUoKSB7XG4gICAgICAgIHRoaXMubm9kZS5zY2FsZVggPSAtdGhpcy5ub2RlLnNjYWxlWDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnJldGFpblNpZGVOb2Rlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIGN1ck5vZGUgPSB0aGlzLnJldGFpblNpZGVOb2Rlc1tpXTtcbiAgICAgICAgICAgIGN1ck5vZGUuc2NhbGVYID0gLWN1ck5vZGUuc2NhbGVYO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICdiNGViNUxvNlUxSVo0ZUpXdXhTaENkSCcsICdUb3NzQ2hpcCcpO1xuLy8gc2NyaXB0cy9Ub3NzQ2hpcC5qc1xuXG5jYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIGFuaW06IGNjLkFuaW1hdGlvblxuICAgIH0sXG5cbiAgICAvLyB1c2UgdGhpcyBmb3IgaW5pdGlhbGl6YXRpb25cbiAgICBwbGF5OiBmdW5jdGlvbiBwbGF5KCkge1xuICAgICAgICB0aGlzLmFuaW0ucGxheSgnY2hpcF90b3NzJyk7XG4gICAgfVxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICc1YjYzM1FNUXhwRm1ZZXRvZkV2SzJVRCcsICdUeXBlcycpO1xuLy8gc2NyaXB0cy9tb2R1bGUvVHlwZXMuanNcblxudmFyIFN1aXQgPSBjYy5FbnVtKHtcbiAgICBTcGFkZTogMSwgLy8g6buR5qGDXG4gICAgSGVhcnQ6IDIsIC8vIOe6ouahg1xuICAgIENsdWI6IDMsIC8vIOaiheiKsSjpu5EpXG4gICAgRGlhbW9uZDogNCB9KTtcblxuLy8g5pa55Z2XKOe6oilcbnZhciBBMl8xMEpRSyA9ICdOQU4sQSwyLDMsNCw1LDYsNyw4LDksMTAsSixRLEsnLnNwbGl0KCcsJyk7XG5cbi8qKlxuICog5omR5YWL54mM57G777yM5Y+q55So5p2l6KGo56S654mM55qE5Z+65pys5bGe5oCn77yM5LiN5YyF5ZCr5ri45oiP6YC76L6R77yM5omA5pyJ5bGe5oCn5Y+q6K+777yMXG4gKiDlm6DmraTlhajlsYDlj6rpnIDopoHmnIkgNTIg5Liq5a6e5L6L77yI5Y675o6J5aSn5bCP546L77yJ77yM5LiN6K665pyJ5aSa5bCR5Ymv54mMXG4gKiBAY2xhc3MgQ2FyZFxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge051bWJlcn0gcG9pbnQgLSDlj6/og73nmoTlgLzkuLogMSDliLAgMTNcbiAqIEBwYXJhbSB7U3VpdH0gc3VpdFxuICovXG5mdW5jdGlvbiBDYXJkKHBvaW50LCBzdWl0KSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgICBwb2ludDoge1xuICAgICAgICAgICAgdmFsdWU6IHBvaW50LFxuICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIHN1aXQ6IHtcbiAgICAgICAgICAgIHZhbHVlOiBzdWl0LFxuICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcHJvcGVydHkge051bWJlcn0gaWQgLSDlj6/og73nmoTlgLzkuLogMCDliLAgNTFcbiAgICAgICAgICovXG4gICAgICAgIGlkOiB7XG4gICAgICAgICAgICB2YWx1ZTogKHN1aXQgLSAxKSAqIDEzICsgKHBvaW50IC0gMSksXG4gICAgICAgICAgICB3cml0YWJsZTogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgLy9cbiAgICAgICAgcG9pbnROYW1lOiB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQTJfMTBKUUtbdGhpcy5wb2ludF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHN1aXROYW1lOiB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gU3VpdFt0aGlzLnN1aXRdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpc0JsYWNrU3VpdDoge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3VpdCA9PT0gU3VpdC5TcGFkZSB8fCB0aGlzLnN1aXQgPT09IFN1aXQuQ2x1YjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaXNSZWRTdWl0OiB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdWl0ID09PSBTdWl0LkhlYXJ0IHx8IHRoaXMuc3VpdCA9PT0gU3VpdC5EaWFtb25kO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG5cbkNhcmQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnN1aXROYW1lICsgJyAnICsgdGhpcy5wb2ludE5hbWU7XG59O1xuXG4vLyDlrZjmlL4gNTIg5byg5omR5YWL55qE5a6e5L6LXG52YXIgY2FyZHMgPSBuZXcgQXJyYXkoNTIpO1xuXG4vKipcbiAqIOi/lOWbnuaMh+WumiBpZCDnmoTlrp7kvotcbiAqIEBwYXJhbSB7TnVtYmVyfSBpZCAtIDAg5YiwIDUxXG4gKi9cbkNhcmQuZnJvbUlkID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgcmV0dXJuIGNhcmRzW2lkXTtcbn07XG5cbi8vIOWIneWni+WMluaJgOacieaJkeWFi+eJjFxuKGZ1bmN0aW9uIGNyZWF0ZUNhcmRzKCkge1xuICAgIGZvciAodmFyIHMgPSAxOyBzIDw9IDQ7IHMrKykge1xuICAgICAgICBmb3IgKHZhciBwID0gMTsgcCA8PSAxMzsgcCsrKSB7XG4gICAgICAgICAgICB2YXIgY2FyZCA9IG5ldyBDYXJkKHAsIHMpO1xuICAgICAgICAgICAgY2FyZHNbY2FyZC5pZF0gPSBjYXJkO1xuICAgICAgICB9XG4gICAgfVxufSkoKTtcblxuLy8g5omL5Lit54mM55qE54q25oCBXG52YXIgQWN0b3JQbGF5aW5nU3RhdGUgPSBjYy5FbnVtKHtcbiAgICBOb3JtYWw6IC0xLFxuICAgIFN0YW5kOiAtMSwgLy8g5YGc54mMXG4gICAgUmVwb3J0OiAtMSwgLy8g5oql5YiwXG4gICAgQnVzdDogLTEgfSk7XG5cbi8vIOi+k+i1olxuLy8g54iG5LqGXG52YXIgT3V0Y29tZSA9IGNjLkVudW0oe1xuICAgIFdpbjogLTEsXG4gICAgTG9zZTogLTEsXG4gICAgVGllOiAtMVxufSk7XG5cbi8vIOeJjOWei++8jOWAvOi2iuWkp+i2iuWOieWus1xudmFyIEhhbmQgPSBjYy5FbnVtKHtcbiAgICBOb3JtYWw6IC0xLCAvLyDml6BcbiAgICBCbGFja0phY2s6IC0xLCAvLyDpu5HmnbDlhYtcbiAgICBGaXZlQ2FyZDogLTEgfSk7XG5cbi8vIOS6lOWwj+m+mVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgU3VpdDogU3VpdCxcbiAgICBDYXJkOiBDYXJkLFxuICAgIEFjdG9yUGxheWluZ1N0YXRlOiBBY3RvclBsYXlpbmdTdGF0ZSxcbiAgICBIYW5kOiBIYW5kLFxuICAgIE91dGNvbWU6IE91dGNvbWVcbn07XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICc3MzU5MGVzazZ4UDlJQ3FoZlVaYWxNZycsICdVdGlscycpO1xuLy8gc2NyaXB0cy9tb2R1bGUvVXRpbHMuanNcblxuXG4vLyDov5Tlm57lsL3lj6/og73kuI3otoXov4cgMjEg54K555qE5pyA5bCP5ZKM5pyA5aSn54K55pWwXG5mdW5jdGlvbiBnZXRNaW5NYXhQb2ludChjYXJkcykge1xuICAgIHZhciBoYXNBY2UgPSBmYWxzZTtcbiAgICB2YXIgbWluID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjYXJkID0gY2FyZHNbaV07XG4gICAgICAgIGlmIChjYXJkLnBvaW50ID09PSAxKSB7XG4gICAgICAgICAgICBoYXNBY2UgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIG1pbiArPSBNYXRoLm1pbigxMCwgY2FyZC5wb2ludCk7XG4gICAgfVxuICAgIHZhciBtYXggPSBtaW47XG4gICAgLy8g5aaC5p6c5pyJIDEg5LiqIEEg5Y+v5Lul5b2T5oiQIDExXG4gICAgaWYgKGhhc0FjZSAmJiBtaW4gKyAxMCA8PSAyMSkge1xuICAgICAgICAvLyDvvIjlpoLmnpzkuKTkuKogQSDpg73lvZPmiJAgMTHvvIzpgqPkuYjmgLvliIbmnIDlsI/kuZ/kvJrmmK8gMjLvvIzniIbkuobvvIzmiYDku6XmnIDlpJrlj6rog73mnInkuIDkuKogQSDlvZPmiJAgMTHvvIlcbiAgICAgICAgbWF4ICs9IDEwO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIG1pbjogbWluLFxuICAgICAgICBtYXg6IG1heFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGlzQnVzdChjYXJkcykge1xuICAgIHZhciBzdW0gPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FyZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNhcmQgPSBjYXJkc1tpXTtcbiAgICAgICAgc3VtICs9IE1hdGgubWluKDEwLCBjYXJkLnBvaW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHN1bSA+IDIxO1xufVxuXG52YXIgaXNNb2JpbGUgPSBmdW5jdGlvbiBpc01vYmlsZSgpIHtcbiAgICByZXR1cm4gY2Muc3lzLmlzTW9iaWxlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXNCdXN0OiBpc0J1c3QsXG4gICAgZ2V0TWluTWF4UG9pbnQ6IGdldE1pbk1heFBvaW50LFxuICAgIGlzTW9iaWxlOiBpc01vYmlsZVxufTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzY1MTBkMVNtUVJNTVlIOEZFSUE3elhxJywgJ2dhbWUtZnNtJyk7XG4vLyBzY3JpcHRzL21vZHVsZS9nYW1lLWZzbS5qc1xuXG52YXIgU3RhdGUgPSByZXF1aXJlKCdzdGF0ZS5jb20nKTtcblxudmFyIGluc3RhbmNlO1xudmFyIG1vZGVsO1xudmFyIHBsYXlpbmc7XG5cbmZ1bmN0aW9uIG9uKG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG1zZ1RvRXZhbHVhdGUpIHtcbiAgICAgICAgcmV0dXJuIG1zZ1RvRXZhbHVhdGUgPT09IG1lc3NhZ2U7XG4gICAgfTtcbn1cblxudmFyIGV2YWx1YXRpbmcgPSBmYWxzZTtcblxuZXhwb3J0cyA9IHtcbiAgICBpbml0OiBmdW5jdGlvbiBpbml0KHRhcmdldCkge1xuICAgICAgICAvLyBzZW5kIGxvZyBtZXNzYWdlcywgd2FybmluZ3MgYW5kIGVycm9ycyB0byB0aGUgY29uc29sZVxuICAgICAgICBTdGF0ZS5jb25zb2xlID0gY29uc29sZTtcblxuICAgICAgICBtb2RlbCA9IG5ldyBTdGF0ZS5TdGF0ZU1hY2hpbmUoXCJyb290XCIpO1xuICAgICAgICB2YXIgaW5pdGlhbCA9IG5ldyBTdGF0ZS5Qc2V1ZG9TdGF0ZShcImluaXQtcm9vdFwiLCBtb2RlbCwgU3RhdGUuUHNldWRvU3RhdGVLaW5kLkluaXRpYWwpO1xuXG4gICAgICAgIC8vIOW9k+WJjei/meS4gOaKiueahOeKtuaAgVxuXG4gICAgICAgIHZhciBiZXQgPSBuZXcgU3RhdGUuU3RhdGUoXCLkuIvms6hcIiwgbW9kZWwpO1xuICAgICAgICBwbGF5aW5nID0gbmV3IFN0YXRlLlN0YXRlKFwi5bey5byA5bGAXCIsIG1vZGVsKTtcbiAgICAgICAgdmFyIHNldHRsZWQgPSBuZXcgU3RhdGUuU3RhdGUoXCLnu5PnrpdcIiwgbW9kZWwpO1xuXG4gICAgICAgIGluaXRpYWwudG8oYmV0KTtcbiAgICAgICAgYmV0LnRvKHBsYXlpbmcpLndoZW4ob24oXCJkZWFsXCIpKTtcbiAgICAgICAgcGxheWluZy50byhzZXR0bGVkKS53aGVuKG9uKFwiZW5kXCIpKTtcbiAgICAgICAgc2V0dGxlZC50byhiZXQpLndoZW4ob24oXCJiZXRcIikpO1xuXG4gICAgICAgIGJldC5lbnRyeShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0YXJnZXQub25CZXRTdGF0ZSh0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJldC5leGl0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRhcmdldC5vbkJldFN0YXRlKGZhbHNlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2V0dGxlZC5lbnRyeShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0YXJnZXQub25FbmRTdGF0ZSh0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNldHRsZWQuZXhpdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0YXJnZXQub25FbmRTdGF0ZShmYWxzZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOW8gOWxgOWQjueahOWtkOeKtuaAgVxuXG4gICAgICAgIHZhciBpbml0aWFsUCA9IG5ldyBTdGF0ZS5Qc2V1ZG9TdGF0ZShcImluaXQg5bey5byA5bGAXCIsIHBsYXlpbmcsIFN0YXRlLlBzZXVkb1N0YXRlS2luZC5Jbml0aWFsKTtcbiAgICAgICAgdmFyIGRlYWwgPSBuZXcgU3RhdGUuU3RhdGUoXCLlj5HniYxcIiwgcGxheWluZyk7XG4gICAgICAgIC8vdmFyIHBvc3REZWFsID0gbmV3IFN0YXRlLlN0YXRlKFwi562J5b6FXCIsIHBsYXlpbmcpOyAgICAvLyDor6Lpl67njqnlrrbmmK/lkKbkubDkv53pmanvvIzlj4zlgI3jgIHliIbniYznrYlcbiAgICAgICAgdmFyIHBsYXllcnNUdXJuID0gbmV3IFN0YXRlLlN0YXRlKFwi546p5a625Yaz562WXCIsIHBsYXlpbmcpO1xuICAgICAgICB2YXIgZGVhbGVyc1R1cm4gPSBuZXcgU3RhdGUuU3RhdGUoXCLluoTlrrblhrPnrZZcIiwgcGxheWluZyk7XG5cbiAgICAgICAgaW5pdGlhbFAudG8oZGVhbCk7XG4gICAgICAgIGRlYWwudG8ocGxheWVyc1R1cm4pLndoZW4ob24oXCJkZWFsZWRcIikpO1xuICAgICAgICBwbGF5ZXJzVHVybi50byhkZWFsZXJzVHVybikud2hlbihvbihcInBsYXllciBhY3RlZFwiKSk7XG5cbiAgICAgICAgZGVhbC5lbnRyeShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0YXJnZXQub25FbnRlckRlYWxTdGF0ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgcGxheWVyc1R1cm4uZW50cnkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGFyZ2V0Lm9uUGxheWVyc1R1cm5TdGF0ZSh0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHBsYXllcnNUdXJuLmV4aXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGFyZ2V0Lm9uUGxheWVyc1R1cm5TdGF0ZShmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBkZWFsZXJzVHVybi5lbnRyeShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0YXJnZXQub25FbnRlckRlYWxlcnNUdXJuU3RhdGUoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gY3JlYXRlIGEgU3RhdGUgbWFjaGluZSBpbnN0YW5jZVxuICAgICAgICBpbnN0YW5jZSA9IG5ldyBTdGF0ZS5TdGF0ZU1hY2hpbmVJbnN0YW5jZShcImZzbVwiKTtcbiAgICAgICAgU3RhdGUuaW5pdGlhbGlzZShtb2RlbCwgaW5zdGFuY2UpO1xuICAgIH0sXG5cbiAgICB0b0RlYWw6IGZ1bmN0aW9uIHRvRGVhbCgpIHtcbiAgICAgICAgdGhpcy5fZXZhbHVhdGUoJ2RlYWwnKTtcbiAgICB9LFxuICAgIHRvQmV0OiBmdW5jdGlvbiB0b0JldCgpIHtcbiAgICAgICAgdGhpcy5fZXZhbHVhdGUoJ2JldCcpO1xuICAgIH0sXG4gICAgb25EZWFsZWQ6IGZ1bmN0aW9uIG9uRGVhbGVkKCkge1xuICAgICAgICB0aGlzLl9ldmFsdWF0ZSgnZGVhbGVkJyk7XG4gICAgfSxcbiAgICBvblBsYXllckFjdGVkOiBmdW5jdGlvbiBvblBsYXllckFjdGVkKCkge1xuICAgICAgICB0aGlzLl9ldmFsdWF0ZSgncGxheWVyIGFjdGVkJyk7XG4gICAgfSxcbiAgICBvbkRlYWxlckFjdGVkOiBmdW5jdGlvbiBvbkRlYWxlckFjdGVkKCkge1xuICAgICAgICB0aGlzLl9ldmFsdWF0ZSgnZW5kJyk7XG4gICAgfSxcblxuICAgIF9ldmFsdWF0ZTogZnVuY3Rpb24gX2V2YWx1YXRlKG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKGV2YWx1YXRpbmcpIHtcbiAgICAgICAgICAgIC8vIGNhbiBub3QgY2FsbCBmc20ncyBldmFsdWF0ZSByZWN1cnNpdmVseVxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU3RhdGUuZXZhbHVhdGUobW9kZWwsIGluc3RhbmNlLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIH0sIDEpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGV2YWx1YXRpbmcgPSB0cnVlO1xuICAgICAgICBTdGF0ZS5ldmFsdWF0ZShtb2RlbCwgaW5zdGFuY2UsIG1lc3NhZ2UpO1xuICAgICAgICBldmFsdWF0aW5nID0gZmFsc2U7XG4gICAgfSxcblxuICAgIF9nZXRJbnN0YW5jZTogZnVuY3Rpb24gX2dldEluc3RhbmNlKCkge1xuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfSxcblxuICAgIF9nZXRNb2RlbDogZnVuY3Rpb24gX2dldE1vZGVsKCkge1xuICAgICAgICByZXR1cm4gbW9kZWw7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnNzFkOTI5M214OUNGcnloSnZSdzg1WlMnLCAnc3RhdGUuY29tJyk7XG4vLyBzY3JpcHRzL2xpYi9zdGF0ZS5jb20uanNcblxuLypcbiAqIEZpbml0ZSBzdGF0ZSBtYWNoaW5lIGxpYnJhcnlcbiAqIENvcHlyaWdodCAoYykgMjAxNC01IFN0ZWVsYnJlZXplIExpbWl0ZWRcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xuICogaHR0cDovL3d3dy5zdGVlbGJyZWV6ZS5uZXQvc3RhdGUuY3NcbiAqL1xudmFyIFN0YXRlSlM7XG4oZnVuY3Rpb24gKFN0YXRlSlMpIHtcbiAgICAvKipcbiAgICAgKiBCZWhhdmlvciBlbmNhcHN1bGF0ZXMgbXVsdGlwbGUgQWN0aW9uIGNhbGxiYWNrcyB0aGF0IGNhbiBiZSBpbnZva2VkIGJ5IGEgc2luZ2xlIGNhbGwuXG4gICAgICogQGNsYXNzIEJlaGF2aW9yXG4gICAgICovXG4gICAgdmFyIEJlaGF2aW9yID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIEJlaGF2aW9yIGNsYXNzLlxuICAgICAgICAgKiBAcGFyYW0ge0JlaGF2aW9yfSBiZWhhdmlvciBUaGUgY29weSBjb25zdHJ1Y3Rvcjsgb21pdCB0aGlzIG9wdGlvbmFsIHBhcmFtZXRlciBmb3IgYSBzaW1wbGUgY29uc3RydWN0b3IuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBCZWhhdmlvcihiZWhhdmlvcikge1xuICAgICAgICAgICAgdGhpcy5hY3Rpb25zID0gW107XG4gICAgICAgICAgICBpZiAoYmVoYXZpb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2goYmVoYXZpb3IpOyAvLyBOT1RFOiB0aGlzIGVuc3VyZXMgYSBjb3B5IG9mIHRoZSBhcnJheSBpcyBtYWRlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZHMgYW4gQWN0aW9uIG9yIHNldCBvZiBBY3Rpb25zIGNhbGxiYWNrcyBpbiBhIEJlaGF2aW9yIGluc3RhbmNlIHRvIHRoaXMgYmVoYXZpb3IgaW5zdGFuY2UuXG4gICAgICAgICAqIEBtZXRob2QgcHVzaFxuICAgICAgICAgKiBAcGFyYW0ge0JlaGF2aW9yfSBiZWhhdmlvciBUaGUgQWN0aW9uIG9yIHNldCBvZiBBY3Rpb25zIGNhbGxiYWNrcyB0byBhZGQgdG8gdGhpcyBiZWhhdmlvciBpbnN0YW5jZS5cbiAgICAgICAgICogQHJldHVybnMge0JlaGF2aW9yfSBSZXR1cm5zIHRoaXMgYmVoYXZpb3IgaW5zdGFuY2UgKGZvciB1c2UgaW4gZmx1ZW50IHN0eWxlIGRldmVsb3BtZW50KS5cbiAgICAgICAgICovXG4gICAgICAgIEJlaGF2aW9yLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKGJlaGF2aW9yKSB7XG4gICAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh0aGlzLmFjdGlvbnMsIGJlaGF2aW9yIGluc3RhbmNlb2YgQmVoYXZpb3IgPyBiZWhhdmlvci5hY3Rpb25zIDogYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogVGVzdHMgdGhlIEJlaGF2aW9yIGluc3RhbmNlIHRvIHNlZSBpZiBhbnkgYWN0aW9ucyBoYXZlIGJlZW4gZGVmaW5lZC5cbiAgICAgICAgICogQG1ldGhvZCBoYXNBY3Rpb25zXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZXJlIGFyZSBhY3Rpb25zIGRlZmluZWQgd2l0aGluIHRoaXMgQmVoYXZpb3IgaW5zdGFuY2UuXG4gICAgICAgICAqL1xuICAgICAgICBCZWhhdmlvci5wcm90b3R5cGUuaGFzQWN0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFjdGlvbnMubGVuZ3RoICE9PSAwO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogSW52b2tlcyBhbGwgdGhlIGFjdGlvbiBjYWxsYmFja3MgaW4gdGhpcyBCZWhhdmlvciBpbnN0YW5jZS5cbiAgICAgICAgICogQG1ldGhvZCBpbnZva2VcbiAgICAgICAgICogQHBhcmFtIHthbnl9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdGhhdCB0cmlnZ2VyZWQgdGhlIHRyYW5zaXRpb24uXG4gICAgICAgICAqIEBwYXJhbSB7SUFjdGl2ZVN0YXRlQ29uZmlndXJhdGlvbn0gaW5zdGFuY2UgVGhlIHN0YXRlIG1hY2hpbmUgaW5zdGFuY2UuXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaGlzdG9yeSBJbnRlcm5hbCB1c2Ugb25seVxuICAgICAgICAgKi9cbiAgICAgICAgQmVoYXZpb3IucHJvdG90eXBlLmludm9rZSA9IGZ1bmN0aW9uIChtZXNzYWdlLCBpbnN0YW5jZSwgaGlzdG9yeSkge1xuICAgICAgICAgICAgaWYgKGhpc3RvcnkgPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICAgIGhpc3RvcnkgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYWN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWN0aW9uKG1lc3NhZ2UsIGluc3RhbmNlLCBoaXN0b3J5KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gQmVoYXZpb3I7XG4gICAgfSkoKTtcbiAgICBTdGF0ZUpTLkJlaGF2aW9yID0gQmVoYXZpb3I7XG59KShTdGF0ZUpTIHx8IChTdGF0ZUpTID0ge30pKTtcbi8qXG4gKiBGaW5pdGUgc3RhdGUgbWFjaGluZSBsaWJyYXJ5XG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGFuZCBHUEwgdjMgbGljZW5jZXNcbiAqIGh0dHA6Ly93d3cuc3RlZWxicmVlemUubmV0L3N0YXRlLmNzXG4gKi9cbnZhciBTdGF0ZUpTO1xuKGZ1bmN0aW9uIChTdGF0ZUpTKSB7XG4gICAgLyoqXG4gICAgICogQW4gZW51bWVyYXRpb24gb2Ygc3RhdGljIGNvbnN0YW50cyB0aGF0IGRpY3RhdGVzIHRoZSBwcmVjaXNlIGJlaGF2aW91ciBvZiBwc2V1ZG8gc3RhdGVzLlxuICAgICAqXG4gICAgICogVXNlIHRoZXNlIGNvbnN0YW50cyBhcyB0aGUgYGtpbmRgIHBhcmFtZXRlciB3aGVuIGNyZWF0aW5nIG5ldyBgUHNldWRvU3RhdGVgIGluc3RhbmNlcy5cbiAgICAgKiBAY2xhc3MgUHNldWRvU3RhdGVLaW5kXG4gICAgICovXG4gICAgKGZ1bmN0aW9uIChQc2V1ZG9TdGF0ZUtpbmQpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVzZWQgZm9yIHBzZXVkbyBzdGF0ZXMgdGhhdCBhcmUgYWx3YXlzIHRoZSBzdGFyaW5nIHBvaW50IHdoZW4gZW50ZXJpbmcgdGhlaXIgcGFyZW50IHJlZ2lvbi5cbiAgICAgICAgICogQG1lbWJlciB7UHNldWRvU3RhdGVLaW5kfSBJbml0aWFsXG4gICAgICAgICAqL1xuICAgICAgICBQc2V1ZG9TdGF0ZUtpbmRbUHNldWRvU3RhdGVLaW5kW1wiSW5pdGlhbFwiXSA9IDBdID0gXCJJbml0aWFsXCI7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVc2VkIGZvciBwc2V1ZG8gc3RhdGVzIHRoYXQgYXJlIHRoZSB0aGUgc3RhcnRpbmcgcG9pbnQgd2hlbiBlbnRlcmluZyB0aGVpciBwYXJlbnQgcmVnaW9uIGZvciB0aGUgZmlyc3QgdGltZTsgc3Vic2VxdWVudCBlbnRyaWVzIHdpbGwgc3RhcnQgYXQgdGhlIGxhc3Qga25vd24gc3RhdGUuXG4gICAgICAgICAqIEBtZW1iZXIge1BzZXVkb1N0YXRlS2luZH0gU2hhbGxvd0hpc3RvcnlcbiAgICAgICAgICovXG4gICAgICAgIFBzZXVkb1N0YXRlS2luZFtQc2V1ZG9TdGF0ZUtpbmRbXCJTaGFsbG93SGlzdG9yeVwiXSA9IDFdID0gXCJTaGFsbG93SGlzdG9yeVwiO1xuICAgICAgICAvKipcbiAgICAgICAgICogQXMgcGVyIGBTaGFsbG93SGlzdG9yeWAgYnV0IHRoZSBoaXN0b3J5IHNlbWFudGljIGNhc2NhZGVzIHRocm91Z2ggYWxsIGNoaWxkIHJlZ2lvbnMgaXJyZXNwZWN0aXZlIG9mIHRoZWlyIGluaXRpYWwgcHNldWRvIHN0YXRlIGtpbmQuXG4gICAgICAgICAqIEBtZW1iZXIge1BzZXVkb1N0YXRlS2luZH0gRGVlcEhpc3RvcnlcbiAgICAgICAgICovXG4gICAgICAgIFBzZXVkb1N0YXRlS2luZFtQc2V1ZG9TdGF0ZUtpbmRbXCJEZWVwSGlzdG9yeVwiXSA9IDJdID0gXCJEZWVwSGlzdG9yeVwiO1xuICAgICAgICAvKipcbiAgICAgICAgICogRW5hYmxlcyBhIGR5bmFtaWMgY29uZGl0aW9uYWwgYnJhbmNoZXM7IHdpdGhpbiBhIGNvbXBvdW5kIHRyYW5zaXRpb24uXG4gICAgICAgICAqIEFsbCBvdXRib3VuZCB0cmFuc2l0aW9uIGd1YXJkcyBmcm9tIGEgQ2hvaWNlIGFyZSBldmFsdWF0ZWQgdXBvbiBlbnRlcmluZyB0aGUgUHNldWRvU3RhdGU6XG4gICAgICAgICAqIGlmIGEgc2luZ2xlIHRyYW5zaXRpb24gaXMgZm91bmQsIGl0IHdpbGwgYmUgdHJhdmVyc2VkO1xuICAgICAgICAgKiBpZiBtYW55IHRyYW5zaXRpb25zIGFyZSBmb3VuZCwgYW4gYXJiaXRhcnkgb25lIHdpbGwgYmUgc2VsZWN0ZWQgYW5kIHRyYXZlcnNlZDtcbiAgICAgICAgICogaWYgbm9uZSBldmFsdWF0ZSB0cnVlLCBhbmQgdGhlcmUgaXMgbm8gJ2Vsc2UgdHJhbnNpdGlvbicgZGVmaW5lZCwgdGhlIG1hY2hpbmUgaXMgZGVlbWVkIGlsbGZvcm1lZCBhbmQgYW4gZXhjZXB0aW9uIHdpbGwgYmUgdGhyb3duLlxuICAgICAgICAgKiBAbWVtYmVyIHtQc2V1ZG9TdGF0ZUtpbmR9IENob2ljZVxuICAgICAgICAgKi9cbiAgICAgICAgUHNldWRvU3RhdGVLaW5kW1BzZXVkb1N0YXRlS2luZFtcIkNob2ljZVwiXSA9IDNdID0gXCJDaG9pY2VcIjtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVuYWJsZXMgYSBzdGF0aWMgY29uZGl0aW9uYWwgYnJhbmNoZXM7IHdpdGhpbiBhIGNvbXBvdW5kIHRyYW5zaXRpb24uXG4gICAgICAgICAqIEFsbCBvdXRib3VuZCB0cmFuc2l0aW9uIGd1YXJkcyBmcm9tIGEgQ2hvaWNlIGFyZSBldmFsdWF0ZWQgdXBvbiBlbnRlcmluZyB0aGUgUHNldWRvU3RhdGU6XG4gICAgICAgICAqIGlmIGEgc2luZ2xlIHRyYW5zaXRpb24gaXMgZm91bmQsIGl0IHdpbGwgYmUgdHJhdmVyc2VkO1xuICAgICAgICAgKiBpZiBtYW55IG9yIG5vbmUgZXZhbHVhdGUgdHJ1ZSwgYW5kIHRoZXJlIGlzIG5vICdlbHNlIHRyYW5zaXRpb24nIGRlZmluZWQsIHRoZSBtYWNoaW5lIGlzIGRlZW1lZCBpbGxmb3JtZWQgYW5kIGFuIGV4Y2VwdGlvbiB3aWxsIGJlIHRocm93bi5cbiAgICAgICAgICogQG1lbWJlciB7UHNldWRvU3RhdGVLaW5kfSBKdW5jdGlvblxuICAgICAgICAgKi9cbiAgICAgICAgUHNldWRvU3RhdGVLaW5kW1BzZXVkb1N0YXRlS2luZFtcIkp1bmN0aW9uXCJdID0gNF0gPSBcIkp1bmN0aW9uXCI7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFbnRlcmluZyBhIHRlcm1pbmF0ZSBgUHNldWRvU3RhdGVgIGltcGxpZXMgdGhhdCB0aGUgZXhlY3V0aW9uIG9mIHRoaXMgc3RhdGUgbWFjaGluZSBieSBtZWFucyBvZiBpdHMgc3RhdGUgb2JqZWN0IGlzIHRlcm1pbmF0ZWQuXG4gICAgICAgICAqIEBtZW1iZXIge1BzZXVkb1N0YXRlS2luZH0gVGVybWluYXRlXG4gICAgICAgICAqL1xuICAgICAgICBQc2V1ZG9TdGF0ZUtpbmRbUHNldWRvU3RhdGVLaW5kW1wiVGVybWluYXRlXCJdID0gNV0gPSBcIlRlcm1pbmF0ZVwiO1xuICAgIH0pKFN0YXRlSlMuUHNldWRvU3RhdGVLaW5kIHx8IChTdGF0ZUpTLlBzZXVkb1N0YXRlS2luZCA9IHt9KSk7XG4gICAgdmFyIFBzZXVkb1N0YXRlS2luZCA9IFN0YXRlSlMuUHNldWRvU3RhdGVLaW5kO1xufSkoU3RhdGVKUyB8fCAoU3RhdGVKUyA9IHt9KSk7XG4vKlxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxuICogQ29weXJpZ2h0IChjKSAyMDE0LTUgU3RlZWxicmVlemUgTGltaXRlZFxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBhbmQgR1BMIHYzIGxpY2VuY2VzXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xuICovXG52YXIgU3RhdGVKUztcbihmdW5jdGlvbiAoU3RhdGVKUykge1xuICAgIC8qKlxuICAgICAqIEFuIGVudW1lcmF0aW9uIG9mIHN0YXRpYyBjb25zdGFudHMgdGhhdCBkaWN0YXRlcyB0aGUgcHJlY2lzZSBiZWhhdmlvdXIgb2YgdHJhbnNpdGlvbnMuXG4gICAgICpcbiAgICAgKiBVc2UgdGhlc2UgY29uc3RhbnRzIGFzIHRoZSBga2luZGAgcGFyYW1ldGVyIHdoZW4gY3JlYXRpbmcgbmV3IGBUcmFuc2l0aW9uYCBpbnN0YW5jZXMuXG4gICAgICogQGNsYXNzIFRyYW5zaXRpb25LaW5kXG4gICAgICovXG4gICAgKGZ1bmN0aW9uIChUcmFuc2l0aW9uS2luZCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHRyYW5zaXRpb24sIGlmIHRyaWdnZXJlZCwgb2NjdXJzIHdpdGhvdXQgZXhpdGluZyBvciBlbnRlcmluZyB0aGUgc291cmNlIHN0YXRlLlxuICAgICAgICAgKiBUaHVzLCBpdCBkb2VzIG5vdCBjYXVzZSBhIHN0YXRlIGNoYW5nZS4gVGhpcyBtZWFucyB0aGF0IHRoZSBlbnRyeSBvciBleGl0IGNvbmRpdGlvbiBvZiB0aGUgc291cmNlIHN0YXRlIHdpbGwgbm90IGJlIGludm9rZWQuXG4gICAgICAgICAqIEFuIGludGVybmFsIHRyYW5zaXRpb24gY2FuIGJlIHRha2VuIGV2ZW4gaWYgdGhlIHN0YXRlIG1hY2hpbmUgaXMgaW4gb25lIG9yIG1vcmUgcmVnaW9ucyBuZXN0ZWQgd2l0aGluIHRoaXMgc3RhdGUuXG4gICAgICAgICAqIEBtZW1iZXIge1RyYW5zaXRpb25LaW5kfSBJbnRlcm5hbFxuICAgICAgICAgKi9cbiAgICAgICAgVHJhbnNpdGlvbktpbmRbVHJhbnNpdGlvbktpbmRbXCJJbnRlcm5hbFwiXSA9IDBdID0gXCJJbnRlcm5hbFwiO1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHRyYW5zaXRpb24sIGlmIHRyaWdnZXJlZCwgd2lsbCBub3QgZXhpdCB0aGUgY29tcG9zaXRlIChzb3VyY2UpIHN0YXRlLCBidXQgd2lsbCBlbnRlciB0aGUgbm9uLWFjdGl2ZSB0YXJnZXQgdmVydGV4IGFuY2VzdHJ5LlxuICAgICAgICAgKiBAbWVtYmVyIHtUcmFuc2l0aW9uS2luZH0gTG9jYWxcbiAgICAgICAgICovXG4gICAgICAgIFRyYW5zaXRpb25LaW5kW1RyYW5zaXRpb25LaW5kW1wiTG9jYWxcIl0gPSAxXSA9IFwiTG9jYWxcIjtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSB0cmFuc2l0aW9uLCBpZiB0cmlnZ2VyZWQsIHdpbGwgZXhpdCB0aGUgc291cmNlIHZlcnRleC5cbiAgICAgICAgICogQG1lbWJlciB7VHJhbnNpdGlvbktpbmR9IEV4dGVybmFsXG4gICAgICAgICAqL1xuICAgICAgICBUcmFuc2l0aW9uS2luZFtUcmFuc2l0aW9uS2luZFtcIkV4dGVybmFsXCJdID0gMl0gPSBcIkV4dGVybmFsXCI7XG4gICAgfSkoU3RhdGVKUy5UcmFuc2l0aW9uS2luZCB8fCAoU3RhdGVKUy5UcmFuc2l0aW9uS2luZCA9IHt9KSk7XG4gICAgdmFyIFRyYW5zaXRpb25LaW5kID0gU3RhdGVKUy5UcmFuc2l0aW9uS2luZDtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcbiAqIEZpbml0ZSBzdGF0ZSBtYWNoaW5lIGxpYnJhcnlcbiAqIENvcHlyaWdodCAoYykgMjAxNC01IFN0ZWVsYnJlZXplIExpbWl0ZWRcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xuICogaHR0cDovL3d3dy5zdGVlbGJyZWV6ZS5uZXQvc3RhdGUuY3NcbiAqL1xudmFyIFN0YXRlSlM7XG4oZnVuY3Rpb24gKFN0YXRlSlMpIHtcbiAgICAvKipcbiAgICAgKiBBbiBhYnN0cmFjdCBjbGFzcyB1c2VkIGFzIHRoZSBiYXNlIGZvciB0aGUgUmVnaW9uIGFuZCBWZXJ0ZXggY2xhc3Nlcy5cbiAgICAgKiBBbiBlbGVtZW50IGlzIGEgbm9kZSB3aXRoaW4gdGhlIHRyZWUgc3RydWN0dXJlIHRoYXQgcmVwcmVzZW50cyBhIGNvbXBvc2l0ZSBzdGF0ZSBtYWNoaW5lIG1vZGVsLlxuICAgICAqIEBjbGFzcyBFbGVtZW50XG4gICAgICovXG4gICAgdmFyIEVsZW1lbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgZWxlbWVudCBjbGFzcy5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIGVsZW1lbnQuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBFbGVtZW50KG5hbWUsIHBhcmVudCkge1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgIHRoaXMucXVhbGlmaWVkTmFtZSA9IHBhcmVudCA/IHBhcmVudC5xdWFsaWZpZWROYW1lICsgRWxlbWVudC5uYW1lc3BhY2VTZXBhcmF0b3IgKyBuYW1lIDogbmFtZTtcbiAgICAgICAgfVxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBhIHRoZSBlbGVtZW50IG5hbWUgYXMgYSBmdWxseSBxdWFsaWZpZWQgbmFtZXNwYWNlLlxuICAgICAgICAgKiBAbWV0aG9kIHRvU3RyaW5nXG4gICAgICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBFbGVtZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1YWxpZmllZE5hbWU7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgc3ltYm9sIHVzZWQgdG8gc2VwYXJhdGUgZWxlbWVudCBuYW1lcyB3aXRoaW4gYSBmdWxseSBxdWFsaWZpZWQgbmFtZS5cbiAgICAgICAgICogQ2hhbmdlIHRoaXMgc3RhdGljIG1lbWJlciB0byBjcmVhdGUgZGlmZmVyZW50IHN0eWxlcyBvZiBxdWFsaWZpZWQgbmFtZSBnZW5lcmF0ZWQgYnkgdGhlIHRvU3RyaW5nIG1ldGhvZC5cbiAgICAgICAgICogQG1lbWJlciB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgRWxlbWVudC5uYW1lc3BhY2VTZXBhcmF0b3IgPSBcIi5cIjtcbiAgICAgICAgcmV0dXJuIEVsZW1lbnQ7XG4gICAgfSkoKTtcbiAgICBTdGF0ZUpTLkVsZW1lbnQgPSBFbGVtZW50O1xufSkoU3RhdGVKUyB8fCAoU3RhdGVKUyA9IHt9KSk7XG52YXIgX19leHRlbmRzID0gdGhpcyAmJiB0aGlzLl9fZXh0ZW5kcyB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkge1xuICAgICAgICB0aGlzLmNvbnN0cnVjdG9yID0gZDtcbiAgICB9XG4gICAgX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGU7XG4gICAgZC5wcm90b3R5cGUgPSBuZXcgX18oKTtcbn07XG4vKlxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxuICogQ29weXJpZ2h0IChjKSAyMDE0LTUgU3RlZWxicmVlemUgTGltaXRlZFxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBhbmQgR1BMIHYzIGxpY2VuY2VzXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xuICovXG52YXIgU3RhdGVKUztcbihmdW5jdGlvbiAoU3RhdGVKUykge1xuICAgIC8qKlxuICAgICAqIEFuIGVsZW1lbnQgd2l0aGluIGEgc3RhdGUgbWFjaGluZSBtb2RlbCB0aGF0IGlzIGEgY29udGFpbmVyIG9mIFZlcnRpY2VzLlxuICAgICAqXG4gICAgICogUmVnaW9ucyBhcmUgaW1wbGljaXRseSBpbnNlcnRlZCBpbnRvIGNvbXBvc2l0ZSBzdGF0ZSBtYWNoaW5lcyBhcyBhIGNvbnRhaW5lciBmb3IgdmVydGljZXMuXG4gICAgICogVGhleSBvbmx5IG5lZWQgdG8gYmUgZXhwbGljaXRseSBkZWZpbmVkIGlmIG9ydGhvZ29uYWwgc3RhdGVzIGFyZSByZXF1aXJlZC5cbiAgICAgKlxuICAgICAqIFJlZ2lvbiBleHRlbmRzIHRoZSBFbGVtZW50IGNsYXNzIGFuZCBpbmhlcml0cyBpdHMgcHVibGljIGludGVyZmFjZS5cbiAgICAgKiBAY2xhc3MgUmVnaW9uXG4gICAgICogQGF1Z21lbnRzIEVsZW1lbnRcbiAgICAgKi9cbiAgICB2YXIgUmVnaW9uID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICAgICAgX19leHRlbmRzKFJlZ2lvbiwgX3N1cGVyKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIFJlZ2lvbiBjbGFzcy5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHJlZ2lvbi5cbiAgICAgICAgICogQHBhcmFtIHtTdGF0ZX0gc3RhdGUgVGhlIHBhcmVudCBzdGF0ZSB0aGF0IHRoaXMgcmVnaW9uIHdpbGwgYmUgYSBjaGlsZCBvZi5cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIFJlZ2lvbihuYW1lLCBzdGF0ZSkge1xuICAgICAgICAgICAgX3N1cGVyLmNhbGwodGhpcywgbmFtZSwgc3RhdGUpO1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUaGUgc2V0IG9mIHZlcnRpY2VzIHRoYXQgYXJlIGNoaWxkcmVuIG9mIHRoZSByZWdpb24uXG4gICAgICAgICAgICAgKiBAbWVtYmVyIHtBcnJheTxWZXJ0ZXg+fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnZlcnRpY2VzID0gW107XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnJlZ2lvbnMucHVzaCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZ2V0Um9vdCgpLmNsZWFuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgdGhlIHJvb3QgZWxlbWVudCB3aXRoaW4gdGhlIHN0YXRlIG1hY2hpbmUgbW9kZWwuXG4gICAgICAgICAqIEBtZXRob2QgZ2V0Um9vdFxuICAgICAgICAgKiBAcmV0dXJucyB7U3RhdGVNYWNoaW5lfSBUaGUgcm9vdCBzdGF0ZSBtYWNoaW5lIGVsZW1lbnQuXG4gICAgICAgICAqL1xuICAgICAgICBSZWdpb24ucHJvdG90eXBlLmdldFJvb3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5nZXRSb290KCk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBY2NlcHRzIGFuIGluc3RhbmNlIG9mIGEgdmlzaXRvciBhbmQgY2FsbHMgdGhlIHZpc2l0UmVnaW9uIG1ldGhvZCBvbiBpdC5cbiAgICAgICAgICogQG1ldGhvZCBhY2NlcHRcbiAgICAgICAgICogQHBhcmFtIHtWaXNpdG9yPFRBcmcxPn0gdmlzaXRvciBUaGUgdmlzaXRvciBpbnN0YW5jZS5cbiAgICAgICAgICogQHBhcmFtIHtUQXJnMX0gYXJnMSBBbiBvcHRpb25hbCBhcmd1bWVudCB0byBwYXNzIGludG8gdGhlIHZpc2l0b3IuXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmcyIEFuIG9wdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgaW50byB0aGUgdmlzaXRvci5cbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzMgQW4gb3B0aW9uYWwgYXJndW1lbnQgdG8gcGFzcyBpbnRvIHRoZSB2aXNpdG9yLlxuICAgICAgICAgKiBAcmV0dXJucyB7YW55fSBBbnkgdmFsdWUgY2FuIGJlIHJldHVybmVkIGJ5IHRoZSB2aXNpdG9yLlxuICAgICAgICAgKi9cbiAgICAgICAgUmVnaW9uLnByb3RvdHlwZS5hY2NlcHQgPSBmdW5jdGlvbiAodmlzaXRvciwgYXJnMSwgYXJnMiwgYXJnMykge1xuICAgICAgICAgICAgcmV0dXJuIHZpc2l0b3IudmlzaXRSZWdpb24odGhpcywgYXJnMSwgYXJnMiwgYXJnMyk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgbmFtZSBnaXZlbiB0byByZWdpb25zIHRoYXQgYXJlIGFyZSBjcmVhdGVkIGF1dG9tYXRpY2FsbHkgd2hlbiBhIHN0YXRlIGlzIHBhc3NlZCBhcyBhIHZlcnRleCdzIHBhcmVudC5cbiAgICAgICAgICogUmVnaW9ucyBhcmUgYXV0b21hdGljYWxseSBpbnNlcnRlZCBpbnRvIHN0YXRlIG1hY2hpbmUgbW9kZWxzIGFzIHRoZSBjb21wb3NpdGUgc3RydWN0dXJlIGlzIGJ1aWx0OyB0aGV5IGFyZSBuYW1lZCB1c2luZyB0aGlzIHN0YXRpYyBtZW1iZXIuXG4gICAgICAgICAqIFVwZGF0ZSB0aGlzIHN0YXRpYyBtZW1iZXIgdG8gdXNlIGEgZGlmZmVyZW50IG5hbWUgZm9yIGRlZmF1bHQgcmVnaW9ucy5cbiAgICAgICAgICogQG1lbWJlciB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgUmVnaW9uLmRlZmF1bHROYW1lID0gXCJkZWZhdWx0XCI7XG4gICAgICAgIHJldHVybiBSZWdpb247XG4gICAgfSkoU3RhdGVKUy5FbGVtZW50KTtcbiAgICBTdGF0ZUpTLlJlZ2lvbiA9IFJlZ2lvbjtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcbiAqIEZpbml0ZSBzdGF0ZSBtYWNoaW5lIGxpYnJhcnlcbiAqIENvcHlyaWdodCAoYykgMjAxNC01IFN0ZWVsYnJlZXplIExpbWl0ZWRcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xuICogaHR0cDovL3d3dy5zdGVlbGJyZWV6ZS5uZXQvc3RhdGUuY3NcbiAqL1xudmFyIFN0YXRlSlM7XG4oZnVuY3Rpb24gKFN0YXRlSlMpIHtcbiAgICAvKipcbiAgICAgKiBBbiBhYnN0cmFjdCBlbGVtZW50IHdpdGhpbiBhIHN0YXRlIG1hY2hpbmUgbW9kZWwgdGhhdCBjYW4gYmUgdGhlIHNvdXJjZSBvciB0YXJnZXQgb2YgYSB0cmFuc2l0aW9uIChzdGF0ZXMgYW5kIHBzZXVkbyBzdGF0ZXMpLlxuICAgICAqXG4gICAgICogVmVydGV4IGV4dGVuZHMgdGhlIEVsZW1lbnQgY2xhc3MgYW5kIGluaGVyaXRzIGl0cyBwdWJsaWMgaW50ZXJmYWNlLlxuICAgICAqIEBjbGFzcyBWZXJ0ZXhcbiAgICAgKiBAYXVnbWVudHMgRWxlbWVudFxuICAgICAqL1xuICAgIHZhciBWZXJ0ZXggPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgICAgICBfX2V4dGVuZHMoVmVydGV4LCBfc3VwZXIpO1xuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgVmVydGV4IGNsYXNzLlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgdmVydGV4LlxuICAgICAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IHBhcmVudCBUaGUgcGFyZW50IHJlZ2lvbiBvciBzdGF0ZS5cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIFZlcnRleChuYW1lLCBwYXJlbnQpIHtcbiAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIG5hbWUsIHBhcmVudCA9IHBhcmVudCBpbnN0YW5jZW9mIFN0YXRlSlMuU3RhdGUgPyBwYXJlbnQuZGVmYXVsdFJlZ2lvbigpIDogcGFyZW50KTsgLy8gVE9ETzogZmluZCBhIGNsZWFuZXIgd2F5IHRvIG1hbmFnZSBpbXBsaWNpdCBjb252ZXJzaW9uXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFRoZSBzZXQgb2YgdHJhbnNpdGlvbnMgZnJvbSB0aGlzIHZlcnRleC5cbiAgICAgICAgICAgICAqIEBtZW1iZXIge0FycmF5PFRyYW5zaXRpb24+fVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLm91dGdvaW5nID0gW107XG4gICAgICAgICAgICB0aGlzLnJlZ2lvbiA9IHBhcmVudDsgLy8gTk9URTogcGFyZW50IHdpbGwgYmUgYSBSZWdpb24gZHVlIHRvIHRoZSBjb25kaXRpb25hbCBsb2dpYyBpbiB0aGUgc3VwZXIgY2FsbCBhYm92ZVxuICAgICAgICAgICAgaWYgKHRoaXMucmVnaW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpb24udmVydGljZXMucHVzaCh0aGlzKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lvbi5nZXRSb290KCkuY2xlYW4gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyB0aGUgcm9vdCBlbGVtZW50IHdpdGhpbiB0aGUgc3RhdGUgbWFjaGluZSBtb2RlbC5cbiAgICAgICAgICogQG1ldGhvZCBnZXRSb290XG4gICAgICAgICAqIEByZXR1cm5zIHtTdGF0ZU1hY2hpbmV9IFRoZSByb290IHN0YXRlIG1hY2hpbmUgZWxlbWVudC5cbiAgICAgICAgICovXG4gICAgICAgIFZlcnRleC5wcm90b3R5cGUuZ2V0Um9vdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZ2lvbi5nZXRSb290KCk7IC8vIE5PVEU6IG5lZWQgdG8ga2VlcCB0aGlzIGR5bmFtaWMgYXMgYSBzdGF0ZSBtYWNoaW5lIG1heSBiZSBlbWJlZGRlZCB3aXRoaW4gYW5vdGhlclxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlcyBhIG5ldyB0cmFuc2l0aW9uIGZyb20gdGhpcyB2ZXJ0ZXguXG4gICAgICAgICAqIE5ld2x5IGNyZWF0ZWQgdHJhbnNpdGlvbnMgYXJlIGNvbXBsZXRpb24gdHJhbnNpdGlvbnM7IHRoZXkgd2lsbCBiZSBldmFsdWF0ZWQgYWZ0ZXIgYSB2ZXJ0ZXggaGFzIGJlZW4gZW50ZXJlZCBpZiBpdCBpcyBkZWVtZWQgdG8gYmUgY29tcGxldGUuXG4gICAgICAgICAqIFRyYW5zaXRpb25zIGNhbiBiZSBjb252ZXJ0ZWQgdG8gYmUgZXZlbnQgdHJpZ2dlcmVkIGJ5IGFkZGluZyBhIGd1YXJkIGNvbmRpdGlvbiB2aWEgdGhlIHRyYW5zaXRpb25zIGB3aGVyZWAgbWV0aG9kLlxuICAgICAgICAgKiBAbWV0aG9kIHRvXG4gICAgICAgICAqIEBwYXJhbSB7VmVydGV4fSB0YXJnZXQgVGhlIGRlc3RpbmF0aW9uIG9mIHRoZSB0cmFuc2l0aW9uOyBvbWl0IGZvciBpbnRlcm5hbCB0cmFuc2l0aW9ucy5cbiAgICAgICAgICogQHBhcmFtIHtUcmFuc2l0aW9uS2luZH0ga2luZCBUaGUga2luZCB0aGUgdHJhbnNpdGlvbjsgdXNlIHRoaXMgdG8gc2V0IExvY2FsIG9yIEV4dGVybmFsICh0aGUgZGVmYXVsdCBpZiBvbWl0dGVkKSB0cmFuc2l0aW9uIHNlbWFudGljcy5cbiAgICAgICAgICogQHJldHVybnMge1RyYW5zaXRpb259IFRoZSBuZXcgdHJhbnNpdGlvbiBvYmplY3QuXG4gICAgICAgICAqL1xuICAgICAgICBWZXJ0ZXgucHJvdG90eXBlLnRvID0gZnVuY3Rpb24gKHRhcmdldCwga2luZCkge1xuICAgICAgICAgICAgaWYgKGtpbmQgPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICAgIGtpbmQgPSBTdGF0ZUpTLlRyYW5zaXRpb25LaW5kLkV4dGVybmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBTdGF0ZUpTLlRyYW5zaXRpb24odGhpcywgdGFyZ2V0LCBraW5kKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFjY2VwdHMgYW4gaW5zdGFuY2Ugb2YgYSB2aXNpdG9yLlxuICAgICAgICAgKiBAbWV0aG9kIGFjY2VwdFxuICAgICAgICAgKiBAcGFyYW0ge1Zpc2l0b3I8VEFyZz59IHZpc2l0b3IgVGhlIHZpc2l0b3IgaW5zdGFuY2UuXG4gICAgICAgICAqIEBwYXJhbSB7VEFyZ30gYXJnIEFuIG9wdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgaW50byB0aGUgdmlzaXRvci5cbiAgICAgICAgICogQHJldHVybnMge2FueX0gQW55IHZhbHVlIGNhbiBiZSByZXR1cm5lZCBieSB0aGUgdmlzaXRvci5cbiAgICAgICAgICovXG4gICAgICAgIFZlcnRleC5wcm90b3R5cGUuYWNjZXB0ID0gZnVuY3Rpb24gKHZpc2l0b3IsIGFyZzEsIGFyZzIsIGFyZzMpIHt9O1xuICAgICAgICByZXR1cm4gVmVydGV4O1xuICAgIH0pKFN0YXRlSlMuRWxlbWVudCk7XG4gICAgU3RhdGVKUy5WZXJ0ZXggPSBWZXJ0ZXg7XG59KShTdGF0ZUpTIHx8IChTdGF0ZUpTID0ge30pKTtcbi8qXG4gKiBGaW5pdGUgc3RhdGUgbWFjaGluZSBsaWJyYXJ5XG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGFuZCBHUEwgdjMgbGljZW5jZXNcbiAqIGh0dHA6Ly93d3cuc3RlZWxicmVlemUubmV0L3N0YXRlLmNzXG4gKi9cbnZhciBTdGF0ZUpTO1xuKGZ1bmN0aW9uIChTdGF0ZUpTKSB7XG4gICAgLyoqXG4gICAgICogQW4gZWxlbWVudCB3aXRoaW4gYSBzdGF0ZSBtYWNoaW5lIG1vZGVsIHRoYXQgcmVwcmVzZW50cyBhbiB0cmFuc2l0b3J5IFZlcnRleCB3aXRoaW4gdGhlIHN0YXRlIG1hY2hpbmUgbW9kZWwuXG4gICAgICpcbiAgICAgKiBQc2V1ZG8gc3RhdGVzIGFyZSByZXF1aXJlZCBpbiBhbGwgc3RhdGUgbWFjaGluZSBtb2RlbHM7IGF0IHRoZSB2ZXJ5IGxlYXN0LCBhbiBgSW5pdGlhbGAgcHNldWRvIHN0YXRlIGlzIHRoZSBkZWZhdWx0IHN0YXRpbmcgc3RhdGUgd2hlbiB0aGUgcGFyZW50IHJlZ2lvbiBpcyBlbnRlcmVkLlxuICAgICAqIE90aGVyIHR5cGVzIG9mIHBzZXVkbyBzdGF0ZSBhcmUgYXZhaWxhYmxlOyB0eXBpY2FsbHkgZm9yIGRlZmluaW5nIGhpc3Rvcnkgc2VtYW50aWNzIG9yIHRvIGZhY2lsaXRhdGUgbW9yZSBjb21wbGV4IHRyYW5zaXRpb25zLlxuICAgICAqIEEgYFRlcm1pbmF0ZWAgcHNldWRvIHN0YXRlIGtpbmQgaXMgYWxzbyBhdmFpbGFibGUgdG8gaW1tZWRpYXRlbHkgdGVybWluYXRlIHByb2Nlc3Npbmcgd2l0aGluIHRoZSBlbnRpcmUgc3RhdGUgbWFjaGluZSBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIFBzZXVkb1N0YXRlIGV4dGVuZHMgdGhlIFZlcnRleCBjbGFzcyBhbmQgaW5oZXJpdHMgaXRzIHB1YmxpYyBpbnRlcmZhY2UuXG4gICAgICogQGNsYXNzIFBzZXVkb1N0YXRlXG4gICAgICogQGF1Z21lbnRzIFZlcnRleFxuICAgICAqL1xuICAgIHZhciBQc2V1ZG9TdGF0ZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgICAgIF9fZXh0ZW5kcyhQc2V1ZG9TdGF0ZSwgX3N1cGVyKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIFBzZXVkb1N0YXRlIGNsYXNzLlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcHNldWRvIHN0YXRlLlxuICAgICAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IHBhcmVudCBUaGUgcGFyZW50IGVsZW1lbnQgdGhhdCB0aGlzIHBzZXVkbyBzdGF0ZSB3aWxsIGJlIGEgY2hpbGQgb2YuXG4gICAgICAgICAqIEBwYXJhbSB7UHNldWRvU3RhdGVLaW5kfSBraW5kIERldGVybWluZXMgdGhlIGJlaGF2aW91ciBvZiB0aGUgUHNldWRvU3RhdGUuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBQc2V1ZG9TdGF0ZShuYW1lLCBwYXJlbnQsIGtpbmQpIHtcbiAgICAgICAgICAgIGlmIChraW5kID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgICAgICBraW5kID0gU3RhdGVKUy5Qc2V1ZG9TdGF0ZUtpbmQuSW5pdGlhbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIG5hbWUsIHBhcmVudCk7XG4gICAgICAgICAgICB0aGlzLmtpbmQgPSBraW5kO1xuICAgICAgICB9XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUZXN0cyBhIHBzZXVkbyBzdGF0ZSB0byBkZXRlcm1pbmUgaWYgaXQgaXMgYSBoaXN0b3J5IHBzZXVkbyBzdGF0ZS5cbiAgICAgICAgICogSGlzdG9yeSBwc2V1ZG8gc3RhdGVzIGFyZSBvZiBraW5kOiBJbml0aWFsLCBTaGFsbG93SGlzb3J5LCBvciBEZWVwSGlzdG9yeS5cbiAgICAgICAgICogQG1ldGhvZCBpc0hpc3RvcnlcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIHBzZXVkbyBzdGF0ZSBpcyBhIGhpc3RvcnkgcHNldWRvIHN0YXRlLlxuICAgICAgICAgKi9cbiAgICAgICAgUHNldWRvU3RhdGUucHJvdG90eXBlLmlzSGlzdG9yeSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmtpbmQgPT09IFN0YXRlSlMuUHNldWRvU3RhdGVLaW5kLkRlZXBIaXN0b3J5IHx8IHRoaXMua2luZCA9PT0gU3RhdGVKUy5Qc2V1ZG9TdGF0ZUtpbmQuU2hhbGxvd0hpc3Rvcnk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUZXN0cyBhIHBzZXVkbyBzdGF0ZSB0byBkZXRlcm1pbmUgaWYgaXQgaXMgYW4gaW5pdGlhbCBwc2V1ZG8gc3RhdGUuXG4gICAgICAgICAqIEluaXRpYWwgcHNldWRvIHN0YXRlcyBhcmUgb2Yga2luZDogSW5pdGlhbCwgU2hhbGxvd0hpc29yeSwgb3IgRGVlcEhpc3RvcnkuXG4gICAgICAgICAqIEBtZXRob2QgaXNJbml0aWFsXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBwc2V1ZG8gc3RhdGUgaXMgYW4gaW5pdGlhbCBwc2V1ZG8gc3RhdGUuXG4gICAgICAgICAqL1xuICAgICAgICBQc2V1ZG9TdGF0ZS5wcm90b3R5cGUuaXNJbml0aWFsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMua2luZCA9PT0gU3RhdGVKUy5Qc2V1ZG9TdGF0ZUtpbmQuSW5pdGlhbCB8fCB0aGlzLmlzSGlzdG9yeSgpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQWNjZXB0cyBhbiBpbnN0YW5jZSBvZiBhIHZpc2l0b3IgYW5kIGNhbGxzIHRoZSB2aXNpdFBzZXVkb1N0YXRlIG1ldGhvZCBvbiBpdC5cbiAgICAgICAgICogQG1ldGhvZCBhY2NlcHRcbiAgICAgICAgICogQHBhcmFtIHtWaXNpdG9yPFRBcmcxPn0gdmlzaXRvciBUaGUgdmlzaXRvciBpbnN0YW5jZS5cbiAgICAgICAgICogQHBhcmFtIHtUQXJnMX0gYXJnMSBBbiBvcHRpb25hbCBhcmd1bWVudCB0byBwYXNzIGludG8gdGhlIHZpc2l0b3IuXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmcyIEFuIG9wdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgaW50byB0aGUgdmlzaXRvci5cbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzMgQW4gb3B0aW9uYWwgYXJndW1lbnQgdG8gcGFzcyBpbnRvIHRoZSB2aXNpdG9yLlxuICAgICAgICAgKiBAcmV0dXJucyB7YW55fSBBbnkgdmFsdWUgY2FuIGJlIHJldHVybmVkIGJ5IHRoZSB2aXNpdG9yLlxuICAgICAgICAgKi9cbiAgICAgICAgUHNldWRvU3RhdGUucHJvdG90eXBlLmFjY2VwdCA9IGZ1bmN0aW9uICh2aXNpdG9yLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gICAgICAgICAgICByZXR1cm4gdmlzaXRvci52aXNpdFBzZXVkb1N0YXRlKHRoaXMsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gUHNldWRvU3RhdGU7XG4gICAgfSkoU3RhdGVKUy5WZXJ0ZXgpO1xuICAgIFN0YXRlSlMuUHNldWRvU3RhdGUgPSBQc2V1ZG9TdGF0ZTtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcbiAqIEZpbml0ZSBzdGF0ZSBtYWNoaW5lIGxpYnJhcnlcbiAqIENvcHlyaWdodCAoYykgMjAxNC01IFN0ZWVsYnJlZXplIExpbWl0ZWRcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xuICogaHR0cDovL3d3dy5zdGVlbGJyZWV6ZS5uZXQvc3RhdGUuY3NcbiAqL1xudmFyIFN0YXRlSlM7XG4oZnVuY3Rpb24gKFN0YXRlSlMpIHtcbiAgICAvKipcbiAgICAgKiBBbiBlbGVtZW50IHdpdGhpbiBhIHN0YXRlIG1hY2hpbmUgbW9kZWwgdGhhdCByZXByZXNlbnRzIGFuIGludmFyaWFudCBjb25kaXRpb24gd2l0aGluIHRoZSBsaWZlIG9mIHRoZSBzdGF0ZSBtYWNoaW5lIGluc3RhbmNlLlxuICAgICAqXG4gICAgICogU3RhdGVzIGFyZSBvbmUgb2YgdGhlIGZ1bmRhbWVudGFsIGJ1aWxkaW5nIGJsb2NrcyBvZiB0aGUgc3RhdGUgbWFjaGluZSBtb2RlbC5cbiAgICAgKiBCZWhhdmlvdXIgY2FuIGJlIGRlZmluZWQgZm9yIGJvdGggc3RhdGUgZW50cnkgYW5kIHN0YXRlIGV4aXQuXG4gICAgICpcbiAgICAgKiBTdGF0ZSBleHRlbmRzIHRoZSBWZXJ0ZXggY2xhc3MgYW5kIGluaGVyaXRzIGl0cyBwdWJsaWMgaW50ZXJmYWNlLlxuICAgICAqIEBjbGFzcyBTdGF0ZVxuICAgICAqIEBhdWdtZW50cyBWZXJ0ZXhcbiAgICAgKi9cbiAgICB2YXIgU3RhdGUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgICAgICBfX2V4dGVuZHMoU3RhdGUsIF9zdXBlcik7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBTdGF0ZSBjbGFzcy5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHN0YXRlLlxuICAgICAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IHBhcmVudCBUaGUgcGFyZW50IHN0YXRlIHRoYXQgb3ducyB0aGUgc3RhdGUuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBTdGF0ZShuYW1lLCBwYXJlbnQpIHtcbiAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIG5hbWUsIHBhcmVudCk7XG4gICAgICAgICAgICAvLyB1c2VyIGRlZmluZWQgYmVoYXZpb3VyICh2aWEgZXhpdCBtZXRob2QpIHRvIGV4ZWN1dGUgd2hlbiBleGl0aW5nIGEgc3RhdGUuXG4gICAgICAgICAgICB0aGlzLmV4aXRCZWhhdmlvciA9IG5ldyBTdGF0ZUpTLkJlaGF2aW9yKCk7XG4gICAgICAgICAgICAvLyB1c2VyIGRlZmluZWQgYmVoYXZpb3VyICh2aWEgZW50cnkgbWV0aG9kKSB0byBleGVjdXRlIHdoZW4gZW50ZXJpbmcgYSBzdGF0ZS5cbiAgICAgICAgICAgIHRoaXMuZW50cnlCZWhhdmlvciA9IG5ldyBTdGF0ZUpTLkJlaGF2aW9yKCk7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFRoZSBzZXQgb2YgcmVnaW9ucyB1bmRlciB0aGlzIHN0YXRlLlxuICAgICAgICAgICAgICogQG1lbWJlciB7QXJyYXk8UmVnaW9uPn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5yZWdpb25zID0gW107XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgdGhlIGRlZmF1bHQgcmVnaW9uIGZvciB0aGUgc3RhdGUuXG4gICAgICAgICAqIE5vdGUsIHRoaXMgd2lsbCBjcmVhdGUgdGhlIGRlZmF1bHQgcmVnaW9uIGlmIGl0IGRvZXMgbm90IGFscmVhZHkgZXhpc3QuXG4gICAgICAgICAqIEBtZXRob2QgZGVmYXVsdFJlZ2lvblxuICAgICAgICAgKiBAcmV0dXJucyB7UmVnaW9ufSBUaGUgZGVmYXVsdCByZWdpb24uXG4gICAgICAgICAqL1xuICAgICAgICBTdGF0ZS5wcm90b3R5cGUuZGVmYXVsdFJlZ2lvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZ2lvbnMucmVkdWNlKGZ1bmN0aW9uIChyZXN1bHQsIHJlZ2lvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWdpb24ubmFtZSA9PT0gU3RhdGVKUy5SZWdpb24uZGVmYXVsdE5hbWUgPyByZWdpb24gOiByZXN1bHQ7XG4gICAgICAgICAgICB9LCB1bmRlZmluZWQpIHx8IG5ldyBTdGF0ZUpTLlJlZ2lvbihTdGF0ZUpTLlJlZ2lvbi5kZWZhdWx0TmFtZSwgdGhpcyk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUZXN0cyB0aGUgc3RhdGUgdG8gc2VlIGlmIGl0IGlzIGEgZmluYWwgc3RhdGU7XG4gICAgICAgICAqIGEgZmluYWwgc3RhdGUgaXMgb25lIHRoYXQgaGFzIG5vIG91dGJvdW5kIHRyYW5zaXRpb25zLlxuICAgICAgICAgKiBAbWV0aG9kIGlzRmluYWxcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIHN0YXRlIGlzIGEgZmluYWwgc3RhdGUuXG4gICAgICAgICAqL1xuICAgICAgICBTdGF0ZS5wcm90b3R5cGUuaXNGaW5hbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm91dGdvaW5nLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRlc3RzIHRoZSBzdGF0ZSB0byBzZWUgaWYgaXQgaXMgYSBzaW1wbGUgc3RhdGU7XG4gICAgICAgICAqIGEgc2ltcGxlIHN0YXRlIGlzIG9uZSB0aGF0IGhhcyBubyBjaGlsZCByZWdpb25zLlxuICAgICAgICAgKiBAbWV0aG9kIGlzU2ltcGxlXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBzdGF0ZSBpcyBhIHNpbXBsZSBzdGF0ZS5cbiAgICAgICAgICovXG4gICAgICAgIFN0YXRlLnByb3RvdHlwZS5pc1NpbXBsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZ2lvbnMubGVuZ3RoID09PSAwO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogVGVzdHMgdGhlIHN0YXRlIHRvIHNlZSBpZiBpdCBpcyBhIGNvbXBvc2l0ZSBzdGF0ZTtcbiAgICAgICAgICogYSBjb21wb3NpdGUgc3RhdGUgaXMgb25lIHRoYXQgaGFzIG9uZSBvciBtb3JlIGNoaWxkIHJlZ2lvbnMuXG4gICAgICAgICAqIEBtZXRob2QgaXNDb21wb3NpdGVcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIHN0YXRlIGlzIGEgY29tcG9zaXRlIHN0YXRlLlxuICAgICAgICAgKi9cbiAgICAgICAgU3RhdGUucHJvdG90eXBlLmlzQ29tcG9zaXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVnaW9ucy5sZW5ndGggPiAwO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogVGVzdHMgdGhlIHN0YXRlIHRvIHNlZSBpZiBpdCBpcyBhbiBvcnRob2dvbmFsIHN0YXRlO1xuICAgICAgICAgKiBhbiBvcnRob2dvbmFsIHN0YXRlIGlzIG9uZSB0aGF0IGhhcyB0d28gb3IgbW9yZSBjaGlsZCByZWdpb25zLlxuICAgICAgICAgKiBAbWV0aG9kIGlzT3J0aG9nb25hbFxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgc3RhdGUgaXMgYW4gb3J0aG9nb25hbCBzdGF0ZS5cbiAgICAgICAgICovXG4gICAgICAgIFN0YXRlLnByb3RvdHlwZS5pc09ydGhvZ29uYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWdpb25zLmxlbmd0aCA+IDE7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGRzIGJlaGF2aW91ciB0byBhIHN0YXRlIHRoYXQgaXMgZXhlY3V0ZWQgZWFjaCB0aW1lIHRoZSBzdGF0ZSBpcyBleGl0ZWQuXG4gICAgICAgICAqIEBtZXRob2QgZXhpdFxuICAgICAgICAgKiBAcGFyYW0ge0FjdGlvbn0gZXhpdEFjdGlvbiBUaGUgYWN0aW9uIHRvIGFkZCB0byB0aGUgc3RhdGUncyBleGl0IGJlaGF2aW91ci5cbiAgICAgICAgICogQHJldHVybnMge1N0YXRlfSBSZXR1cm5zIHRoZSBzdGF0ZSB0byBhbGxvdyBhIGZsdWVudCBzdHlsZSBBUEkuXG4gICAgICAgICAqL1xuICAgICAgICBTdGF0ZS5wcm90b3R5cGUuZXhpdCA9IGZ1bmN0aW9uIChleGl0QWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmV4aXRCZWhhdmlvci5wdXNoKGV4aXRBY3Rpb24pO1xuICAgICAgICAgICAgdGhpcy5nZXRSb290KCkuY2xlYW4gPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQWRkcyBiZWhhdmlvdXIgdG8gYSBzdGF0ZSB0aGF0IGlzIGV4ZWN1dGVkIGVhY2ggdGltZSB0aGUgc3RhdGUgaXMgZW50ZXJlZC5cbiAgICAgICAgICogQG1ldGhvZCBlbnRyeVxuICAgICAgICAgKiBAcGFyYW0ge0FjdGlvbn0gZW50cnlBY3Rpb24gVGhlIGFjdGlvbiB0byBhZGQgdG8gdGhlIHN0YXRlJ3MgZW50cnkgYmVoYXZpb3VyLlxuICAgICAgICAgKiBAcmV0dXJucyB7U3RhdGV9IFJldHVybnMgdGhlIHN0YXRlIHRvIGFsbG93IGEgZmx1ZW50IHN0eWxlIEFQSS5cbiAgICAgICAgICovXG4gICAgICAgIFN0YXRlLnByb3RvdHlwZS5lbnRyeSA9IGZ1bmN0aW9uIChlbnRyeUFjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5lbnRyeUJlaGF2aW9yLnB1c2goZW50cnlBY3Rpb24pO1xuICAgICAgICAgICAgdGhpcy5nZXRSb290KCkuY2xlYW4gPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQWNjZXB0cyBhbiBpbnN0YW5jZSBvZiBhIHZpc2l0b3IgYW5kIGNhbGxzIHRoZSB2aXNpdFN0YXRlIG1ldGhvZCBvbiBpdC5cbiAgICAgICAgICogQG1ldGhvZCBhY2NlcHRcbiAgICAgICAgICogQHBhcmFtIHtWaXNpdG9yPFRBcmcxPn0gdmlzaXRvciBUaGUgdmlzaXRvciBpbnN0YW5jZS5cbiAgICAgICAgICogQHBhcmFtIHtUQXJnMX0gYXJnMSBBbiBvcHRpb25hbCBhcmd1bWVudCB0byBwYXNzIGludG8gdGhlIHZpc2l0b3IuXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmcyIEFuIG9wdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgaW50byB0aGUgdmlzaXRvci5cbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzMgQW4gb3B0aW9uYWwgYXJndW1lbnQgdG8gcGFzcyBpbnRvIHRoZSB2aXNpdG9yLlxuICAgICAgICAgKiBAcmV0dXJucyB7YW55fSBBbnkgdmFsdWUgY2FuIGJlIHJldHVybmVkIGJ5IHRoZSB2aXNpdG9yLlxuICAgICAgICAgKi9cbiAgICAgICAgU3RhdGUucHJvdG90eXBlLmFjY2VwdCA9IGZ1bmN0aW9uICh2aXNpdG9yLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gICAgICAgICAgICByZXR1cm4gdmlzaXRvci52aXNpdFN0YXRlKHRoaXMsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gU3RhdGU7XG4gICAgfSkoU3RhdGVKUy5WZXJ0ZXgpO1xuICAgIFN0YXRlSlMuU3RhdGUgPSBTdGF0ZTtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcbiAqIEZpbml0ZSBzdGF0ZSBtYWNoaW5lIGxpYnJhcnlcbiAqIENvcHlyaWdodCAoYykgMjAxNC01IFN0ZWVsYnJlZXplIExpbWl0ZWRcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xuICogaHR0cDovL3d3dy5zdGVlbGJyZWV6ZS5uZXQvc3RhdGUuY3NcbiAqL1xudmFyIFN0YXRlSlM7XG4oZnVuY3Rpb24gKFN0YXRlSlMpIHtcbiAgICAvKipcbiAgICAgKiBBbiBlbGVtZW50IHdpdGhpbiBhIHN0YXRlIG1hY2hpbmUgbW9kZWwgdGhhdCByZXByZXNlbnRzIGNvbXBsZXRpb24gb2YgdGhlIGxpZmUgb2YgdGhlIGNvbnRhaW5pbmcgUmVnaW9uIHdpdGhpbiB0aGUgc3RhdGUgbWFjaGluZSBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIEEgZmluYWwgc3RhdGUgY2Fubm90IGhhdmUgb3V0Ym91bmQgdHJhbnNpdGlvbnMuXG4gICAgICpcbiAgICAgKiBGaW5hbFN0YXRlIGV4dGVuZHMgdGhlIFN0YXRlIGNsYXNzIGFuZCBpbmhlcml0cyBpdHMgcHVibGljIGludGVyZmFjZS5cbiAgICAgKiBAY2xhc3MgRmluYWxTdGF0ZVxuICAgICAqIEBhdWdtZW50cyBTdGF0ZVxuICAgICAqL1xuICAgIHZhciBGaW5hbFN0YXRlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICAgICAgX19leHRlbmRzKEZpbmFsU3RhdGUsIF9zdXBlcik7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBGaW5hbFN0YXRlIGNsYXNzLlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgZmluYWwgc3RhdGUuXG4gICAgICAgICAqIEBwYXJhbSB7RWxlbWVudH0gcGFyZW50IFRoZSBwYXJlbnQgZWxlbWVudCB0aGF0IG93bnMgdGhlIGZpbmFsIHN0YXRlLlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gRmluYWxTdGF0ZShuYW1lLCBwYXJlbnQpIHtcbiAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIG5hbWUsIHBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFjY2VwdHMgYW4gaW5zdGFuY2Ugb2YgYSB2aXNpdG9yIGFuZCBjYWxscyB0aGUgdmlzaXRGaW5hbFN0YXRlIG1ldGhvZCBvbiBpdC5cbiAgICAgICAgICogQG1ldGhvZCBhY2NlcHRcbiAgICAgICAgICogQHBhcmFtIHtWaXNpdG9yPFRBcmc+fSB2aXNpdG9yIFRoZSB2aXNpdG9yIGluc3RhbmNlLlxuICAgICAgICAgKiBAcGFyYW0ge1RBcmd9IGFyZyBBbiBvcHRpb25hbCBhcmd1bWVudCB0byBwYXNzIGludG8gdGhlIHZpc2l0b3IuXG4gICAgICAgICAqIEByZXR1cm5zIHthbnl9IEFueSB2YWx1ZSBjYW4gYmUgcmV0dXJuZWQgYnkgdGhlIHZpc2l0b3IuXG4gICAgICAgICAqL1xuICAgICAgICBGaW5hbFN0YXRlLnByb3RvdHlwZS5hY2NlcHQgPSBmdW5jdGlvbiAodmlzaXRvciwgYXJnMSwgYXJnMiwgYXJnMykge1xuICAgICAgICAgICAgcmV0dXJuIHZpc2l0b3IudmlzaXRGaW5hbFN0YXRlKHRoaXMsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gRmluYWxTdGF0ZTtcbiAgICB9KShTdGF0ZUpTLlN0YXRlKTtcbiAgICBTdGF0ZUpTLkZpbmFsU3RhdGUgPSBGaW5hbFN0YXRlO1xufSkoU3RhdGVKUyB8fCAoU3RhdGVKUyA9IHt9KSk7XG4vKlxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxuICogQ29weXJpZ2h0IChjKSAyMDE0LTUgU3RlZWxicmVlemUgTGltaXRlZFxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBhbmQgR1BMIHYzIGxpY2VuY2VzXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xuICovXG52YXIgU3RhdGVKUztcbihmdW5jdGlvbiAoU3RhdGVKUykge1xuICAgIC8qKlxuICAgICAqIEFuIGVsZW1lbnQgd2l0aGluIGEgc3RhdGUgbWFjaGluZSBtb2RlbCB0aGF0IHJlcHJlc2VudHMgdGhlIHJvb3Qgb2YgdGhlIHN0YXRlIG1hY2hpbmUgbW9kZWwuXG4gICAgICpcbiAgICAgKiBTdGF0ZU1hY2hpbmUgZXh0ZW5kcyB0aGUgU3RhdGUgY2xhc3MgYW5kIGluaGVyaXRzIGl0cyBwdWJsaWMgaW50ZXJmYWNlLlxuICAgICAqIEBjbGFzcyBTdGF0ZU1hY2hpbmVcbiAgICAgKiBAYXVnbWVudHMgU3RhdGVcbiAgICAgKi9cbiAgICB2YXIgU3RhdGVNYWNoaW5lID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICAgICAgX19leHRlbmRzKFN0YXRlTWFjaGluZSwgX3N1cGVyKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIFN0YXRlTWFjaGluZSBjbGFzcy5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHN0YXRlIG1hY2hpbmUuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBTdGF0ZU1hY2hpbmUobmFtZSkge1xuICAgICAgICAgICAgX3N1cGVyLmNhbGwodGhpcywgbmFtZSwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIC8vIGZsYWcgdXNlZCB0byBpbmRpY2F0ZSB0aGF0IHRoZSBzdGF0ZSBtYWNoaW5lIG1vZGVsIGhhcyBoYXMgc3RydWN0dXJhbCBjaGFuZ2VzIGFuZCB0aGVyZWZvcmUgcmVxdWlyZXMgaW5pdGlhbGlzaW5nLlxuICAgICAgICAgICAgdGhpcy5jbGVhbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHRoZSByb290IGVsZW1lbnQgd2l0aGluIHRoZSBzdGF0ZSBtYWNoaW5lIG1vZGVsLlxuICAgICAgICAgKiBOb3RlIHRoYXQgaWYgdGhpcyBzdGF0ZSBtYWNoaW5lIGlzIGVtYmVkZWQgd2l0aGluIGFub3RoZXIgc3RhdGUgbWFjaGluZSwgdGhlIHVsdGltYXRlIHJvb3QgZWxlbWVudCB3aWxsIGJlIHJldHVybmVkLlxuICAgICAgICAgKiBAbWV0aG9kIGdldFJvb3RcbiAgICAgICAgICogQHJldHVybnMge1N0YXRlTWFjaGluZX0gVGhlIHJvb3Qgc3RhdGUgbWFjaGluZSBlbGVtZW50LlxuICAgICAgICAgKi9cbiAgICAgICAgU3RhdGVNYWNoaW5lLnByb3RvdHlwZS5nZXRSb290ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVnaW9uID8gdGhpcy5yZWdpb24uZ2V0Um9vdCgpIDogdGhpcztcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFjY2VwdHMgYW4gaW5zdGFuY2Ugb2YgYSB2aXNpdG9yIGFuZCBjYWxscyB0aGUgdmlzaXRTdGF0ZU1hY2hpbmUgbWV0aG9kIG9uIGl0LlxuICAgICAgICAgKiBAbWV0aG9kIGFjY2VwdFxuICAgICAgICAgKiBAcGFyYW0ge1Zpc2l0b3I8VEFyZzE+fSB2aXNpdG9yIFRoZSB2aXNpdG9yIGluc3RhbmNlLlxuICAgICAgICAgKiBAcGFyYW0ge1RBcmcxfSBhcmcxIEFuIG9wdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgaW50byB0aGUgdmlzaXRvci5cbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzIgQW4gb3B0aW9uYWwgYXJndW1lbnQgdG8gcGFzcyBpbnRvIHRoZSB2aXNpdG9yLlxuICAgICAgICAgKiBAcGFyYW0ge2FueX0gYXJnMyBBbiBvcHRpb25hbCBhcmd1bWVudCB0byBwYXNzIGludG8gdGhlIHZpc2l0b3IuXG4gICAgICAgICAqIEByZXR1cm5zIHthbnl9IEFueSB2YWx1ZSBjYW4gYmUgcmV0dXJuZWQgYnkgdGhlIHZpc2l0b3IuXG4gICAgICAgICAqL1xuICAgICAgICBTdGF0ZU1hY2hpbmUucHJvdG90eXBlLmFjY2VwdCA9IGZ1bmN0aW9uICh2aXNpdG9yLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gICAgICAgICAgICByZXR1cm4gdmlzaXRvci52aXNpdFN0YXRlTWFjaGluZSh0aGlzLCBhcmcxLCBhcmcyLCBhcmczKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFN0YXRlTWFjaGluZTtcbiAgICB9KShTdGF0ZUpTLlN0YXRlKTtcbiAgICBTdGF0ZUpTLlN0YXRlTWFjaGluZSA9IFN0YXRlTWFjaGluZTtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcbiAqIEZpbml0ZSBzdGF0ZSBtYWNoaW5lIGxpYnJhcnlcbiAqIENvcHlyaWdodCAoYykgMjAxNC01IFN0ZWVsYnJlZXplIExpbWl0ZWRcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xuICogaHR0cDovL3d3dy5zdGVlbGJyZWV6ZS5uZXQvc3RhdGUuY3NcbiAqL1xudmFyIFN0YXRlSlM7XG4oZnVuY3Rpb24gKFN0YXRlSlMpIHtcbiAgICAvKipcbiAgICAgKiBBIHRyYW5zaXRpb24gYmV0d2VlbiB2ZXJ0aWNlcyAoc3RhdGVzIG9yIHBzZXVkbyBzdGF0ZXMpIHRoYXQgbWF5IGJlIHRyYXZlcnNlZCBpbiByZXNwb25zZSB0byBhIG1lc3NhZ2UuXG4gICAgICpcbiAgICAgKiBUcmFuc2l0aW9ucyBjb21lIGluIGEgdmFyaWV0eSBvZiB0eXBlczpcbiAgICAgKiBpbnRlcm5hbCB0cmFuc2l0aW9ucyByZXNwb25kIHRvIG1lc3NhZ2VzIGJ1dCBkbyBub3QgY2F1c2UgYSBzdGF0ZSB0cmFuc2l0aW9uLCB0aGV5IG9ubHkgaGF2ZSBiZWhhdmlvdXI7XG4gICAgICogbG9jYWwgdHJhbnNpdGlvbnMgYXJlIGNvbnRhaW5lZCB3aXRoaW4gYSBzaW5nbGUgcmVnaW9uIHRoZXJlZm9yZSB0aGUgc291cmNlIHZlcnRleCBpcyBleGl0ZWQsIHRoZSB0cmFuc2l0aW9uIHRyYXZlcnNlZCwgYW5kIHRoZSB0YXJnZXQgc3RhdGUgZW50ZXJlZDtcbiAgICAgKiBleHRlcm5hbCB0cmFuc2l0aW9ucyBhcmUgbW9yZSBjb21wbGV4IGluIG5hdHVyZSBhcyB0aGV5IGNyb3NzIHJlZ2lvbiBib3VuZGFyaWVzLCBhbGwgZWxlbWVudHMgdXAgdG8gYnV0IG5vdCBub3QgaW5jbHVkaW5nIHRoZSBjb21tb24gYW5jZXN0b3IgYXJlIGV4aXRlZCBhbmQgZW50ZXJlZC5cbiAgICAgKlxuICAgICAqIEVudGVyaW5nIGEgY29tcG9zaXRlIHN0YXRlIHdpbGwgY2F1c2UgdGhlIGVudHJ5IG9mIHRoZSBjaGlsZCByZWdpb25zIHdpdGhpbiB0aGUgY29tcG9zaXRlIHN0YXRlOyB0aGlzIGluIHR1cm4gbWF5IHRyaWdnZXIgbW9yZSB0cmFuc2l0aW9ucy5cbiAgICAgKiBAY2xhc3MgVHJhbnNpdGlvblxuICAgICAqL1xuICAgIHZhciBUcmFuc2l0aW9uID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIFRyYW5zaXRpb24gY2xhc3MuXG4gICAgICAgICAqIEBwYXJhbSB7VmVydGV4fSBzb3VyY2UgVGhlIHNvdXJjZSBvZiB0aGUgdHJhbnNpdGlvbi5cbiAgICAgICAgICogQHBhcmFtIHtWZXJ0ZXh9IHNvdXJjZSBUaGUgdGFyZ2V0IG9mIHRoZSB0cmFuc2l0aW9uOyB0aGlzIGlzIGFuIG9wdGlvbmFsIHBhcmFtZXRlciwgb21pdHRpbmcgaXQgd2lsbCBjcmVhdGUgYW4gSW50ZXJuYWwgdHJhbnNpdGlvbi5cbiAgICAgICAgICogQHBhcmFtIHtUcmFuc2l0aW9uS2luZH0ga2luZCBUaGUga2luZCB0aGUgdHJhbnNpdGlvbjsgdXNlIHRoaXMgdG8gc2V0IExvY2FsIG9yIEV4dGVybmFsICh0aGUgZGVmYXVsdCBpZiBvbWl0dGVkKSB0cmFuc2l0aW9uIHNlbWFudGljcy5cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIFRyYW5zaXRpb24oc291cmNlLCB0YXJnZXQsIGtpbmQpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICBpZiAoa2luZCA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAga2luZCA9IFN0YXRlSlMuVHJhbnNpdGlvbktpbmQuRXh0ZXJuYWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB1c2VyIGRlZmluZWQgYmVoYXZpb3VyICh2aWEgZWZmZWN0KSBleGVjdXRlZCB3aGVuIHRyYXZlcnNpbmcgdGhpcyB0cmFuc2l0aW9uLlxuICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uQmVoYXZpb3IgPSBuZXcgU3RhdGVKUy5CZWhhdmlvcigpO1xuICAgICAgICAgICAgLy8gdGhlIGNvbGxlY3RlZCBhY3Rpb25zIHRvIHBlcmZvcm0gd2hlbiB0cmF2ZXJzaW5nIHRoZSB0cmFuc2l0aW9uIChpbmNsdWRlcyBleGl0aW5nIHN0YXRlcywgdHJhdmVyc2FsLCBhbmQgc3RhdGUgZW50cnkpXG4gICAgICAgICAgICB0aGlzLm9uVHJhdmVyc2UgPSBuZXcgU3RhdGVKUy5CZWhhdmlvcigpO1xuICAgICAgICAgICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICAgICAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICAgICAgICAgIHRoaXMua2luZCA9IHRhcmdldCA/IGtpbmQgOiBTdGF0ZUpTLlRyYW5zaXRpb25LaW5kLkludGVybmFsO1xuICAgICAgICAgICAgdGhpcy5ndWFyZCA9IHNvdXJjZSBpbnN0YW5jZW9mIFN0YXRlSlMuUHNldWRvU3RhdGUgPyBUcmFuc2l0aW9uLlRydWVHdWFyZCA6IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lc3NhZ2UgPT09IF90aGlzLnNvdXJjZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLnNvdXJjZS5vdXRnb2luZy5wdXNoKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5zb3VyY2UuZ2V0Um9vdCgpLmNsZWFuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFR1cm5zIGEgdHJhbnNpdGlvbiBpbnRvIGFuIGVsc2UgdHJhbnNpdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogRWxzZSB0cmFuc2l0aW9ucyBjYW4gYmUgdXNlZCBhdCBgSnVuY3Rpb25gIG9yIGBDaG9pY2VgIHBzZXVkbyBzdGF0ZXMgaWYgbm8gb3RoZXIgdHJhbnNpdGlvbiBndWFyZHMgZXZhbHVhdGUgdHJ1ZSwgYW4gRWxzZSB0cmFuc2l0aW9uIGlmIHByZXNlbnQgd2lsbCBiZSB0cmF2ZXJzZWQuXG4gICAgICAgICAqIEBtZXRob2QgZWxzZVxuICAgICAgICAgKiBAcmV0dXJucyB7VHJhbnNpdGlvbn0gUmV0dXJucyB0aGUgdHJhbnNpdGlvbiBvYmplY3QgdG8gZW5hYmxlIHRoZSBmbHVlbnQgQVBJLlxuICAgICAgICAgKi9cbiAgICAgICAgVHJhbnNpdGlvbi5wcm90b3R5cGVbXCJlbHNlXCJdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5ndWFyZCA9IFRyYW5zaXRpb24uRmFsc2VHdWFyZDtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogRGVmaW5lcyB0aGUgZ3VhcmQgY29uZGl0aW9uIGZvciB0aGUgdHJhbnNpdGlvbi5cbiAgICAgICAgICogQG1ldGhvZCB3aGVuXG4gICAgICAgICAqIEBwYXJhbSB7R3VhcmR9IGd1YXJkIFRoZSBndWFyZCBjb25kaXRpb24gdGhhdCBtdXN0IGV2YWx1YXRlIHRydWUgZm9yIHRoZSB0cmFuc2l0aW9uIHRvIGJlIHRyYXZlcnNlZC5cbiAgICAgICAgICogQHJldHVybnMge1RyYW5zaXRpb259IFJldHVybnMgdGhlIHRyYW5zaXRpb24gb2JqZWN0IHRvIGVuYWJsZSB0aGUgZmx1ZW50IEFQSS5cbiAgICAgICAgICovXG4gICAgICAgIFRyYW5zaXRpb24ucHJvdG90eXBlLndoZW4gPSBmdW5jdGlvbiAoZ3VhcmQpIHtcbiAgICAgICAgICAgIHRoaXMuZ3VhcmQgPSBndWFyZDtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQWRkIGJlaGF2aW91ciB0byBhIHRyYW5zaXRpb24uXG4gICAgICAgICAqIEBtZXRob2QgZWZmZWN0XG4gICAgICAgICAqIEBwYXJhbSB7QWN0aW9ufSB0cmFuc2l0aW9uQWN0aW9uIFRoZSBhY3Rpb24gdG8gYWRkIHRvIHRoZSB0cmFuc2l0aW9ucyB0cmF2ZXJzYWwgYmVoYXZpb3VyLlxuICAgICAgICAgKiBAcmV0dXJucyB7VHJhbnNpdGlvbn0gUmV0dXJucyB0aGUgdHJhbnNpdGlvbiBvYmplY3QgdG8gZW5hYmxlIHRoZSBmbHVlbnQgQVBJLlxuICAgICAgICAgKi9cbiAgICAgICAgVHJhbnNpdGlvbi5wcm90b3R5cGUuZWZmZWN0ID0gZnVuY3Rpb24gKHRyYW5zaXRpb25BY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbkJlaGF2aW9yLnB1c2godHJhbnNpdGlvbkFjdGlvbik7XG4gICAgICAgICAgICB0aGlzLnNvdXJjZS5nZXRSb290KCkuY2xlYW4gPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQWNjZXB0cyBhbiBpbnN0YW5jZSBvZiBhIHZpc2l0b3IgYW5kIGNhbGxzIHRoZSB2aXNpdFRyYW5zaXRpb24gbWV0aG9kIG9uIGl0LlxuICAgICAgICAgKiBAbWV0aG9kIGFjY2VwdFxuICAgICAgICAgKiBAcGFyYW0ge1Zpc2l0b3I8VEFyZzE+fSB2aXNpdG9yIFRoZSB2aXNpdG9yIGluc3RhbmNlLlxuICAgICAgICAgKiBAcGFyYW0ge1RBcmcxfSBhcmcxIEFuIG9wdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgaW50byB0aGUgdmlzaXRvci5cbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzIgQW4gb3B0aW9uYWwgYXJndW1lbnQgdG8gcGFzcyBpbnRvIHRoZSB2aXNpdG9yLlxuICAgICAgICAgKiBAcGFyYW0ge2FueX0gYXJnMyBBbiBvcHRpb25hbCBhcmd1bWVudCB0byBwYXNzIGludG8gdGhlIHZpc2l0b3IuXG4gICAgICAgICAqIEByZXR1cm5zIHthbnl9IEFueSB2YWx1ZSBjYW4gYmUgcmV0dXJuZWQgYnkgdGhlIHZpc2l0b3IuXG4gICAgICAgICAqL1xuICAgICAgICBUcmFuc2l0aW9uLnByb3RvdHlwZS5hY2NlcHQgPSBmdW5jdGlvbiAodmlzaXRvciwgYXJnMSwgYXJnMiwgYXJnMykge1xuICAgICAgICAgICAgcmV0dXJuIHZpc2l0b3IudmlzaXRUcmFuc2l0aW9uKHRoaXMsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBhIHRoZSB0cmFuc2l0aW9uIG5hbWUuXG4gICAgICAgICAqIEBtZXRob2QgdG9TdHJpbmdcbiAgICAgICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIFRyYW5zaXRpb24ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiW1wiICsgKHRoaXMudGFyZ2V0ID8gdGhpcy5zb3VyY2UgKyBcIiAtPiBcIiArIHRoaXMudGFyZ2V0IDogdGhpcy5zb3VyY2UpICsgXCJdXCI7XG4gICAgICAgIH07XG4gICAgICAgIC8vIHRoZSBkZWZhdWx0IGd1YXJkIGNvbmRpdGlvbiBmb3IgcHNldWRvIHN0YXRlc1xuICAgICAgICBUcmFuc2l0aW9uLlRydWVHdWFyZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICAvLyB1c2VkIGFzIHRoZSBndWFyZCBjb25kaXRpb24gZm9yIGVsc2UgdHJhbml0aW9uc1xuICAgICAgICBUcmFuc2l0aW9uLkZhbHNlR3VhcmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBUcmFuc2l0aW9uO1xuICAgIH0pKCk7XG4gICAgU3RhdGVKUy5UcmFuc2l0aW9uID0gVHJhbnNpdGlvbjtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcbiAqIEZpbml0ZSBzdGF0ZSBtYWNoaW5lIGxpYnJhcnlcbiAqIENvcHlyaWdodCAoYykgMjAxNC01IFN0ZWVsYnJlZXplIExpbWl0ZWRcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xuICogaHR0cDovL3d3dy5zdGVlbGJyZWV6ZS5uZXQvc3RhdGUuY3NcbiAqL1xudmFyIFN0YXRlSlM7XG4oZnVuY3Rpb24gKFN0YXRlSlMpIHtcbiAgICAvKipcbiAgICAgKiBJbXBsZW1lbnRhdGlvbiBvZiBhIHZpc2l0b3IgcGF0dGVybi5cbiAgICAgKiBAY2xhc3MgVmlzaXRvclxuICAgICAqL1xuICAgIHZhciBWaXNpdG9yID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gVmlzaXRvcigpIHt9XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBWaXNpdHMgYW4gZWxlbWVudCB3aXRoaW4gYSBzdGF0ZSBtYWNoaW5lIG1vZGVsLlxuICAgICAgICAgKiBAbWV0aG9kIHZpc2l0RWxlbWVudFxuICAgICAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgdGhlIGVsZW1lbnQgYmVpbmcgdmlzaXRlZC5cbiAgICAgICAgICogQHBhcmFtIHtUQXJnMX0gYXJnMSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmcyIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzMgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxuICAgICAgICAgKiBAcmV0dXJucyB7YW55fSBBbnkgdmFsdWUgbWF5IGJlIHJldHVybmVkIHdoZW4gdmlzaXRpbmcgYW4gZWxlbWVudC5cbiAgICAgICAgICovXG4gICAgICAgIFZpc2l0b3IucHJvdG90eXBlLnZpc2l0RWxlbWVudCA9IGZ1bmN0aW9uIChlbGVtZW50LCBhcmcxLCBhcmcyLCBhcmczKSB7fTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFZpc2l0cyBhIHJlZ2lvbiB3aXRoaW4gYSBzdGF0ZSBtYWNoaW5lIG1vZGVsLlxuICAgICAgICAgKiBAbWV0aG9kIHZpc2l0UmVnaW9uXG4gICAgICAgICAqIEBwYXJhbSB7UmVnaW9ufSByZWdpb24gVGhlIHJlZ2lvbiBiZWluZyB2aXNpdGVkLlxuICAgICAgICAgKiBAcGFyYW0ge1RBcmcxfSBhcmcxIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzIgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxuICAgICAgICAgKiBAcGFyYW0ge2FueX0gYXJnMyBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXG4gICAgICAgICAqIEByZXR1cm5zIHthbnl9IEFueSB2YWx1ZSBtYXkgYmUgcmV0dXJuZWQgd2hlbiB2aXNpdGluZyBhbiBlbGVtZW50LlxuICAgICAgICAgKi9cbiAgICAgICAgVmlzaXRvci5wcm90b3R5cGUudmlzaXRSZWdpb24gPSBmdW5jdGlvbiAocmVnaW9uLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMudmlzaXRFbGVtZW50KHJlZ2lvbiwgYXJnMSwgYXJnMiwgYXJnMyk7XG4gICAgICAgICAgICByZWdpb24udmVydGljZXMuZm9yRWFjaChmdW5jdGlvbiAodmVydGV4KSB7XG4gICAgICAgICAgICAgICAgdmVydGV4LmFjY2VwdChfdGhpcywgYXJnMSwgYXJnMiwgYXJnMyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBWaXNpdHMgYSB2ZXJ0ZXggd2l0aGluIGEgc3RhdGUgbWFjaGluZSBtb2RlbC5cbiAgICAgICAgICogQG1ldGhvZCB2aXNpdFZlcnRleFxuICAgICAgICAgKiBAcGFyYW0ge1ZlcnRleH0gdmVydGV4IFRoZSB2ZXJ0ZXggYmVpbmcgdmlzaXRlZC5cbiAgICAgICAgICogQHBhcmFtIHtUQXJnMX0gYXJnMSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmcyIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzMgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxuICAgICAgICAgKiBAcmV0dXJucyB7YW55fSBBbnkgdmFsdWUgbWF5IGJlIHJldHVybmVkIHdoZW4gdmlzaXRpbmcgYW4gZWxlbWVudC5cbiAgICAgICAgICovXG4gICAgICAgIFZpc2l0b3IucHJvdG90eXBlLnZpc2l0VmVydGV4ID0gZnVuY3Rpb24gKHZlcnRleCwgYXJnMSwgYXJnMiwgYXJnMykge1xuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB0aGlzLnZpc2l0RWxlbWVudCh2ZXJ0ZXgsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICAgICAgICAgICAgdmVydGV4Lm91dGdvaW5nLmZvckVhY2goZnVuY3Rpb24gKHRyYW5zaXRpb24pIHtcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uLmFjY2VwdChfdGhpcywgYXJnMSwgYXJnMiwgYXJnMyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBWaXNpdHMgYSBwc2V1ZG8gc3RhdGUgd2l0aGluIGEgc3RhdGUgbWFjaGluZSBtb2RlbC5cbiAgICAgICAgICogQG1ldGhvZCB2aXNpdFBzZXVkb1N0YXRlXG4gICAgICAgICAqIEBwYXJhbSB7UHNldWRvU3RhdGV9IHBzZXVkb1N0YXRlIFRoZSBwc2V1ZG8gc3RhdGUgYmVpbmcgdmlzaXRlZC5cbiAgICAgICAgICogQHBhcmFtIHtUQXJnMX0gYXJnMSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmcyIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzMgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxuICAgICAgICAgKiBAcmV0dXJucyB7YW55fSBBbnkgdmFsdWUgbWF5IGJlIHJldHVybmVkIHdoZW4gdmlzaXRpbmcgYW4gZWxlbWVudC5cbiAgICAgICAgICovXG4gICAgICAgIFZpc2l0b3IucHJvdG90eXBlLnZpc2l0UHNldWRvU3RhdGUgPSBmdW5jdGlvbiAocHNldWRvU3RhdGUsIGFyZzEsIGFyZzIsIGFyZzMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZpc2l0VmVydGV4KHBzZXVkb1N0YXRlLCBhcmcxLCBhcmcyLCBhcmczKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFZpc2l0cyBhIHN0YXRlIHdpdGhpbiBhIHN0YXRlIG1hY2hpbmUgbW9kZWwuXG4gICAgICAgICAqIEBtZXRob2QgdmlzaXRTdGF0ZVxuICAgICAgICAgKiBAcGFyYW0ge1N0YXRlfSBzdGF0ZSBUaGUgc3RhdGUgYmVpbmcgdmlzaXRlZC5cbiAgICAgICAgICogQHBhcmFtIHtUQXJnMX0gYXJnMSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmcyIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzMgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxuICAgICAgICAgKiBAcmV0dXJucyB7YW55fSBBbnkgdmFsdWUgbWF5IGJlIHJldHVybmVkIHdoZW4gdmlzaXRpbmcgYW4gZWxlbWVudC5cbiAgICAgICAgICovXG4gICAgICAgIFZpc2l0b3IucHJvdG90eXBlLnZpc2l0U3RhdGUgPSBmdW5jdGlvbiAoc3RhdGUsIGFyZzEsIGFyZzIsIGFyZzMpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy52aXNpdFZlcnRleChzdGF0ZSwgYXJnMSwgYXJnMiwgYXJnMyk7XG4gICAgICAgICAgICBzdGF0ZS5yZWdpb25zLmZvckVhY2goZnVuY3Rpb24gKHJlZ2lvbikge1xuICAgICAgICAgICAgICAgIHJlZ2lvbi5hY2NlcHQoX3RoaXMsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogVmlzaXRzIGEgZmluYWwgc3RhdGUgd2l0aGluIGEgc3RhdGUgbWFjaGluZSBtb2RlbC5cbiAgICAgICAgICogQG1ldGhvZCB2aXNpdEZpbmFsXG4gICAgICAgICAqIEBwYXJhbSB7RmluYWxTdGF0ZX0gZmluYWxTdGF0ZSBUaGUgZmluYWwgc3RhdGUgYmVpbmcgdmlzaXRlZC5cbiAgICAgICAgICogQHBhcmFtIHtUQXJnMX0gYXJnMSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmcyIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzMgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxuICAgICAgICAgKiBAcmV0dXJucyB7YW55fSBBbnkgdmFsdWUgbWF5IGJlIHJldHVybmVkIHdoZW4gdmlzaXRpbmcgYW4gZWxlbWVudC5cbiAgICAgICAgICovXG4gICAgICAgIFZpc2l0b3IucHJvdG90eXBlLnZpc2l0RmluYWxTdGF0ZSA9IGZ1bmN0aW9uIChmaW5hbFN0YXRlLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52aXNpdFN0YXRlKGZpbmFsU3RhdGUsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogVmlzaXRzIGEgc3RhdGUgbWFjaGluZSB3aXRoaW4gYSBzdGF0ZSBtYWNoaW5lIG1vZGVsLlxuICAgICAgICAgKiBAbWV0aG9kIHZpc2l0VmVydGV4XG4gICAgICAgICAqIEBwYXJhbSB7U3RhdGVNYWNoaW5lfSBzdGF0ZSBtYWNoaW5lIFRoZSBzdGF0ZSBtYWNoaW5lIGJlaW5nIHZpc2l0ZWQuXG4gICAgICAgICAqIEBwYXJhbSB7VEFyZzF9IGFyZzEgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxuICAgICAgICAgKiBAcGFyYW0ge2FueX0gYXJnMiBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmczIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cbiAgICAgICAgICogQHJldHVybnMge2FueX0gQW55IHZhbHVlIG1heSBiZSByZXR1cm5lZCB3aGVuIHZpc2l0aW5nIGFuIGVsZW1lbnQuXG4gICAgICAgICAqL1xuICAgICAgICBWaXNpdG9yLnByb3RvdHlwZS52aXNpdFN0YXRlTWFjaGluZSA9IGZ1bmN0aW9uIChzdGF0ZU1hY2hpbmUsIGFyZzEsIGFyZzIsIGFyZzMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZpc2l0U3RhdGUoc3RhdGVNYWNoaW5lLCBhcmcxLCBhcmcyLCBhcmczKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFZpc2l0cyBhIHRyYW5zaXRpb24gd2l0aGluIGEgc3RhdGUgbWFjaGluZSBtb2RlbC5cbiAgICAgICAgICogQG1ldGhvZCB2aXNpdFRyYW5zaXRpb25cbiAgICAgICAgICogQHBhcmFtIHtUcmFuc2l0aW9ufSB0cmFuc2l0aW9uIFRoZSB0cmFuc2l0aW9uIGJlaW5nIHZpc2l0ZWQuXG4gICAgICAgICAqIEBwYXJhbSB7VEFyZzF9IGFyZzEgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxuICAgICAgICAgKiBAcGFyYW0ge2FueX0gYXJnMiBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmczIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cbiAgICAgICAgICogQHJldHVybnMge2FueX0gQW55IHZhbHVlIG1heSBiZSByZXR1cm5lZCB3aGVuIHZpc2l0aW5nIGFuIGVsZW1lbnQuXG4gICAgICAgICAqL1xuICAgICAgICBWaXNpdG9yLnByb3RvdHlwZS52aXNpdFRyYW5zaXRpb24gPSBmdW5jdGlvbiAodHJhbnNpdGlvbiwgYXJnMSwgYXJnMiwgYXJnMykge307XG4gICAgICAgIHJldHVybiBWaXNpdG9yO1xuICAgIH0pKCk7XG4gICAgU3RhdGVKUy5WaXNpdG9yID0gVmlzaXRvcjtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcbiAqIEZpbml0ZSBzdGF0ZSBtYWNoaW5lIGxpYnJhcnlcbiAqIENvcHlyaWdodCAoYykgMjAxNC01IFN0ZWVsYnJlZXplIExpbWl0ZWRcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xuICogaHR0cDovL3d3dy5zdGVlbGJyZWV6ZS5uZXQvc3RhdGUuY3NcbiAqL1xudmFyIFN0YXRlSlM7XG4oZnVuY3Rpb24gKFN0YXRlSlMpIHtcbiAgICAvKipcbiAgICAgKiBEZWZhdWx0IHdvcmtpbmcgaW1wbGVtZW50YXRpb24gb2YgYSBzdGF0ZSBtYWNoaW5lIGluc3RhbmNlIGNsYXNzLlxuICAgICAqXG4gICAgICogSW1wbGVtZW50cyB0aGUgYElBY3RpdmVTdGF0ZUNvbmZpZ3VyYXRpb25gIGludGVyZmFjZS5cbiAgICAgKiBJdCBpcyBwb3NzaWJsZSB0byBjcmVhdGUgb3RoZXIgY3VzdG9tIGluc3RhbmNlIGNsYXNzZXMgdG8gbWFuYWdlIHN0YXRlIG1hY2hpbmUgc3RhdGUgaW4gb3RoZXIgd2F5cyAoZS5nLiBhcyBzZXJpYWxpc2FibGUgSlNPTik7IGp1c3QgaW1wbGVtZW50IHRoZSBzYW1lIG1lbWJlcnMgYW5kIG1ldGhvZHMgYXMgdGhpcyBjbGFzcy5cbiAgICAgKiBAY2xhc3MgU3RhdGVNYWNoaW5lSW5zdGFuY2VcbiAgICAgKiBAaW1wbGVtZW50cyBJQWN0aXZlU3RhdGVDb25maWd1cmF0aW9uXG4gICAgICovXG4gICAgdmFyIFN0YXRlTWFjaGluZUluc3RhbmNlID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIHN0YXRlIG1hY2hpbmUgaW5zdGFuY2UgY2xhc3MuXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBvcHRpb25hbCBuYW1lIG9mIHRoZSBzdGF0ZSBtYWNoaW5lIGluc3RhbmNlLlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gU3RhdGVNYWNoaW5lSW5zdGFuY2UobmFtZSkge1xuICAgICAgICAgICAgaWYgKG5hbWUgPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICAgIG5hbWUgPSBcInVubmFtZWRcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubGFzdCA9IHt9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBJbmRpY2F0ZXMgdGhhdCB0aGUgc3RhdGUgbWFuY2hpbmUgaW5zdGFuY2UgcmVhY2hlZCB3YXMgdGVybWluYXRlZCBieSByZWFjaGluZyBhIFRlcm1pbmF0ZSBwc2V1ZG8gc3RhdGUuXG4gICAgICAgICAgICAgKiBAbWVtYmVyIGlzVGVybWluYXRlZFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmlzVGVybWluYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBVcGRhdGVzIHRoZSBsYXN0IGtub3duIHN0YXRlIGZvciBhIGdpdmVuIHJlZ2lvbi5cbiAgICAgICAgU3RhdGVNYWNoaW5lSW5zdGFuY2UucHJvdG90eXBlLnNldEN1cnJlbnQgPSBmdW5jdGlvbiAocmVnaW9uLCBzdGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5sYXN0W3JlZ2lvbi5xdWFsaWZpZWROYW1lXSA9IHN0YXRlO1xuICAgICAgICB9O1xuICAgICAgICAvLyBSZXR1cm5zIHRoZSBsYXN0IGtub3duIHN0YXRlIGZvciBhIGdpdmVuIHJlZ2lvbi5cbiAgICAgICAgU3RhdGVNYWNoaW5lSW5zdGFuY2UucHJvdG90eXBlLmdldEN1cnJlbnQgPSBmdW5jdGlvbiAocmVnaW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXN0W3JlZ2lvbi5xdWFsaWZpZWROYW1lXTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgdGhlIG5hbWUgb2YgdGhlIHN0YXRlIG1hY2hpbmUgaW5zdGFuY2UuXG4gICAgICAgICAqIEBtZXRob2QgdG9TdHJpbmdcbiAgICAgICAgICogQHJldHVybnMge3N0cmluZ30gVGhlIG5hbWUgb2YgdGhlIHN0YXRlIG1hY2hpbmUgaW5zdGFuY2UuXG4gICAgICAgICAqL1xuICAgICAgICBTdGF0ZU1hY2hpbmVJbnN0YW5jZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYW1lO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gU3RhdGVNYWNoaW5lSW5zdGFuY2U7XG4gICAgfSkoKTtcbiAgICBTdGF0ZUpTLlN0YXRlTWFjaGluZUluc3RhbmNlID0gU3RhdGVNYWNoaW5lSW5zdGFuY2U7XG59KShTdGF0ZUpTIHx8IChTdGF0ZUpTID0ge30pKTtcbi8qXG4gKiBGaW5pdGUgc3RhdGUgbWFjaGluZSBsaWJyYXJ5XG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGFuZCBHUEwgdjMgbGljZW5jZXNcbiAqIGh0dHA6Ly93d3cuc3RlZWxicmVlemUubmV0L3N0YXRlLmNzXG4gKi9cbnZhciBTdGF0ZUpTO1xuKGZ1bmN0aW9uIChTdGF0ZUpTKSB7XG4gICAgLyoqXG4gICAgICogU2V0cyBhIG1ldGhvZCB0byBzZWxlY3QgYW4gaW50ZWdlciByYW5kb20gbnVtYmVyIGxlc3MgdGhhbiB0aGUgbWF4IHZhbHVlIHBhc3NlZCBhcyBhIHBhcmFtZXRlci5cbiAgICAgKlxuICAgICAqIFRoaXMgaXMgb25seSB1c2VmdWwgd2hlbiBhIGN1c3RvbSByYW5kb20gbnVtYmVyIGdlbmVyYXRvciBpcyByZXF1aXJlZDsgdGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gaXMgZmluZSBpbiBtb3N0IGNpcmN1bXN0YW5jZXMuXG4gICAgICogQGZ1bmN0aW9uIHNldFJhbmRvbVxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGdlbmVyYXRvciBBIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSBtYXggdmFsdWUgYW5kIHJldHVybnMgYSByYW5kb20gbnVtYmVyIGJldHdlZW4gMCBhbmQgbWF4IC0gMS5cbiAgICAgKiBAcmV0dXJucyBBIHJhbmRvbSBudW1iZXIgYmV0d2VlbiAwIGFuZCBtYXggLSAxXG4gICAgICovXG4gICAgZnVuY3Rpb24gc2V0UmFuZG9tKGdlbmVyYXRvcikge1xuICAgICAgICByYW5kb20gPSBnZW5lcmF0b3I7XG4gICAgfVxuICAgIFN0YXRlSlMuc2V0UmFuZG9tID0gc2V0UmFuZG9tO1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgbWV0aG9kIHVzZWQgdG8gc2VsZWN0IGFuIGludGVnZXIgcmFuZG9tIG51bWJlciBsZXNzIHRoYW4gdGhlIG1heCB2YWx1ZSBwYXNzZWQgYXMgYSBwYXJhbWV0ZXIuXG4gICAgICpcbiAgICAgKiBUaGlzIGlzIG9ubHkgdXNlZnVsIHdoZW4gYSBjdXN0b20gcmFuZG9tIG51bWJlciBnZW5lcmF0b3IgaXMgcmVxdWlyZWQ7IHRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIGlzIGZpbmUgaW4gbW9zdCBjaXJjdW1zdGFuY2VzLlxuICAgICAqIEBmdW5jdGlvbiBnZXRSYW5kb21cbiAgICAgKiBAcmV0dXJucyB7ZnVuY3Rpb259IFRoZSBmdW5jdGlvbiB0aGF0IHRha2VzIGEgbWF4IHZhbHVlIGFuZCByZXR1cm5zIGEgcmFuZG9tIG51bWJlciBiZXR3ZWVuIDAgYW5kIG1heCAtIDEuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0UmFuZG9tKCkge1xuICAgICAgICByZXR1cm4gcmFuZG9tO1xuICAgIH1cbiAgICBTdGF0ZUpTLmdldFJhbmRvbSA9IGdldFJhbmRvbTtcbiAgICAvLyB0aGUgZGVmYXVsdCBtZXRob2QgdXNlZCB0byBwcm9kdWNlIGEgcmFuZG9tIG51bWJlcjsgZGVmYXVsdGluZyB0byBzaW1wbGlmaWVkIGltcGxlbWVudGF0aW9uIHNlZW4gaW4gTW96aWxsYSBNYXRoLnJhbmRvbSgpIHBhZ2U7IG1heSBiZSBvdmVycmlkZW4gZm9yIHRlc3RpbmdcbiAgICB2YXIgcmFuZG9tID0gZnVuY3Rpb24gcmFuZG9tKG1heCkge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICB9O1xufSkoU3RhdGVKUyB8fCAoU3RhdGVKUyA9IHt9KSk7XG4vKlxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxuICogQ29weXJpZ2h0IChjKSAyMDE0LTUgU3RlZWxicmVlemUgTGltaXRlZFxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBhbmQgR1BMIHYzIGxpY2VuY2VzXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xuICovXG52YXIgU3RhdGVKUztcbihmdW5jdGlvbiAoU3RhdGVKUykge1xuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgaWYgYW4gZWxlbWVudCBpcyBjdXJyZW50bHkgYWN0aXZlOyB0aGF0IGl0IGhhcyBiZWVuIGVudGVyZWQgYnV0IG5vdCB5ZXQgZXhpdGVkLlxuICAgICAqIEBmdW5jdGlvbiBpc0FjdGl2ZVxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgc3RhdGUgdG8gdGVzdC5cbiAgICAgKiBAcGFyYW0ge0lBY3RpdmVTdGF0ZUNvbmZpZ3VyYXRpb259IGluc3RhbmNlIFRoZSBpbnN0YW5jZSBvZiB0aGUgc3RhdGUgbWFjaGluZSBtb2RlbC5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgZWxlbWVudCBpcyBhY3RpdmUuXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNBY3RpdmUoX3gsIF94Mikge1xuICAgICAgICB2YXIgX2FnYWluID0gdHJ1ZTtcblxuICAgICAgICBfZnVuY3Rpb246IHdoaWxlIChfYWdhaW4pIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50ID0gX3gsXG4gICAgICAgICAgICAgICAgc3RhdGVNYWNoaW5lSW5zdGFuY2UgPSBfeDI7XG4gICAgICAgICAgICBfYWdhaW4gPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBTdGF0ZUpTLlJlZ2lvbikge1xuICAgICAgICAgICAgICAgIF94ID0gZWxlbWVudC5zdGF0ZTtcbiAgICAgICAgICAgICAgICBfeDIgPSBzdGF0ZU1hY2hpbmVJbnN0YW5jZTtcbiAgICAgICAgICAgICAgICBfYWdhaW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlIF9mdW5jdGlvbjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIFN0YXRlSlMuU3RhdGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudC5yZWdpb24gPyBpc0FjdGl2ZShlbGVtZW50LnJlZ2lvbiwgc3RhdGVNYWNoaW5lSW5zdGFuY2UpICYmIHN0YXRlTWFjaGluZUluc3RhbmNlLmdldEN1cnJlbnQoZWxlbWVudC5yZWdpb24pID09PSBlbGVtZW50IDogdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBTdGF0ZUpTLmlzQWN0aXZlID0gaXNBY3RpdmU7XG59KShTdGF0ZUpTIHx8IChTdGF0ZUpTID0ge30pKTtcbi8qXG4gKiBGaW5pdGUgc3RhdGUgbWFjaGluZSBsaWJyYXJ5XG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGFuZCBHUEwgdjMgbGljZW5jZXNcbiAqIGh0dHA6Ly93d3cuc3RlZWxicmVlemUubmV0L3N0YXRlLmNzXG4gKi9cbnZhciBTdGF0ZUpTO1xuKGZ1bmN0aW9uIChTdGF0ZUpTKSB7XG4gICAgLyoqXG4gICAgICogVGVzdHMgYW4gZWxlbWVudCB3aXRoaW4gYSBzdGF0ZSBtYWNoaW5lIGluc3RhbmNlIHRvIHNlZSBpZiBpdHMgbGlmZWN5Y2xlIGlzIGNvbXBsZXRlLlxuICAgICAqIEBmdW5jdGlvbiBpc0NvbXBsZXRlXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRlc3QuXG4gICAgICogQHBhcmFtIHtJQWN0aXZlU3RhdGVDb25maWd1cmF0aW9ufSBpbnN0YW5jZSBUaGUgaW5zdGFuY2Ugb2YgdGhlIHN0YXRlIG1hY2hpbmUgbW9kZWwgdG8gdGVzdCBmb3IgY29tcGxldGVuZXNzLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBlbGVtZW50IGlzIGNvbXBsZXRlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzQ29tcGxldGUoZWxlbWVudCwgaW5zdGFuY2UpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBTdGF0ZUpTLlJlZ2lvbikge1xuICAgICAgICAgICAgcmV0dXJuIGluc3RhbmNlLmdldEN1cnJlbnQoZWxlbWVudCkuaXNGaW5hbCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBTdGF0ZUpTLlN0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudC5yZWdpb25zLmV2ZXJ5KGZ1bmN0aW9uIChyZWdpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNDb21wbGV0ZShyZWdpb24sIGluc3RhbmNlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBTdGF0ZUpTLmlzQ29tcGxldGUgPSBpc0NvbXBsZXRlO1xufSkoU3RhdGVKUyB8fCAoU3RhdGVKUyA9IHt9KSk7XG4vKlxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxuICogQ29weXJpZ2h0IChjKSAyMDE0LTUgU3RlZWxicmVlemUgTGltaXRlZFxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBhbmQgR1BMIHYzIGxpY2VuY2VzXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xuICovXG52YXIgU3RhdGVKUztcbihmdW5jdGlvbiAoU3RhdGVKUykge1xuICAgIC8qKlxuICAgICAqIEluaXRpYWxpc2VzIGEgc3RhdGUgbWFjaGluZSBhbmQvb3Igc3RhdGUgbWFjaGluZSBtb2RlbC5cbiAgICAgKlxuICAgICAqIFBhc3NpbmcganVzdCB0aGUgc3RhdGUgbWFjaGluZSBtb2RlbCB3aWxsIGluaXRpYWxpc2UgdGhlIG1vZGVsLCBwYXNzaW5nIHRoZSBtb2RlbCBhbmQgaW5zdGFuY2Ugd2lsbCBpbml0aWFsc2UgdGhlIGluc3RhbmNlIGFuZCBpZiBuZWNlc3NhcnksIHRoZSBtb2RlbC5cbiAgICAgKiBAZnVuY3Rpb24gaW5pdGlhbGlzZVxuICAgICAqIEBwYXJhbSB7U3RhdGVNYWNoaW5lfSBzdGF0ZU1hY2hpbmVNb2RlbCBUaGUgc3RhdGUgbWFjaGluZSBtb2RlbC4gSWYgYXV0b0luaXRpYWxpc2VNb2RlbCBpcyB0cnVlIChvciBubyBpbnN0YW5jZSBpcyBzcGVjaWZpZWQpIGFuZCB0aGUgbW9kZWwgaGFzIGNoYW5nZWQsIHRoZSBtb2RlbCB3aWxsIGJlIGluaXRpYWxpc2VkLlxuICAgICAqIEBwYXJhbSB7SUFjdGl2ZVN0YXRlQ29uZmlndXJhdGlvbn0gc3RhdGVNYWNoaW5lSW5zdGFuY2UgVGhlIG9wdGlvbmFsIHN0YXRlIG1hY2hpbmUgaW5zdGFuY2UgdG8gaW5pdGlhbGlzZS5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGF1dG9Jbml0aWFsaXNlTW9kZWwgRGVmYXVsdGluZyB0byB0cnVlLCB0aGlzIHdpbGwgY2F1c2UgdGhlIG1vZGVsIHRvIGJlIGluaXRpYWxpc2VkIHByaW9yIHRvIGluaXRpYWxpc2luZyB0aGUgaW5zdGFuY2UgaWYgdGhlIG1vZGVsIGhhcyBjaGFuZ2VkLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGluaXRpYWxpc2Uoc3RhdGVNYWNoaW5lTW9kZWwsIHN0YXRlTWFjaGluZUluc3RhbmNlLCBhdXRvSW5pdGlhbGlzZU1vZGVsKSB7XG4gICAgICAgIGlmIChhdXRvSW5pdGlhbGlzZU1vZGVsID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgIGF1dG9Jbml0aWFsaXNlTW9kZWwgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGF0ZU1hY2hpbmVJbnN0YW5jZSkge1xuICAgICAgICAgICAgLy8gaW5pdGlhbGlzZSB0aGUgc3RhdGUgbWFjaGluZSBtb2RlbCBpZiBuZWNlc3NhcnlcbiAgICAgICAgICAgIGlmIChhdXRvSW5pdGlhbGlzZU1vZGVsICYmIHN0YXRlTWFjaGluZU1vZGVsLmNsZWFuID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGluaXRpYWxpc2Uoc3RhdGVNYWNoaW5lTW9kZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gbG9nIGFzIHJlcXVpcmVkXG4gICAgICAgICAgICBTdGF0ZUpTLmNvbnNvbGUubG9nKFwiaW5pdGlhbGlzZSBcIiArIHN0YXRlTWFjaGluZUluc3RhbmNlKTtcbiAgICAgICAgICAgIC8vIGVudGVyIHRoZSBzdGF0ZSBtYWNoaW5lIGluc3RhbmNlIGZvciB0aGUgZmlyc3QgdGltZVxuICAgICAgICAgICAgc3RhdGVNYWNoaW5lTW9kZWwub25Jbml0aWFsaXNlLmludm9rZSh1bmRlZmluZWQsIHN0YXRlTWFjaGluZUluc3RhbmNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGxvZyBhcyByZXF1aXJlZFxuICAgICAgICAgICAgU3RhdGVKUy5jb25zb2xlLmxvZyhcImluaXRpYWxpc2UgXCIgKyBzdGF0ZU1hY2hpbmVNb2RlbC5uYW1lKTtcbiAgICAgICAgICAgIC8vIGluaXRpYWxpc2UgdGhlIHN0YXRlIG1hY2hpbmUgbW9kZWxcbiAgICAgICAgICAgIHN0YXRlTWFjaGluZU1vZGVsLmFjY2VwdChuZXcgSW5pdGlhbGlzZUVsZW1lbnRzKCksIGZhbHNlKTtcbiAgICAgICAgICAgIHN0YXRlTWFjaGluZU1vZGVsLmNsZWFuID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBTdGF0ZUpTLmluaXRpYWxpc2UgPSBpbml0aWFsaXNlO1xuICAgIC8qKlxuICAgICAqIFBhc3NlcyBhIG1lc3NhZ2UgdG8gYSBzdGF0ZSBtYWNoaW5lIGZvciBldmFsdWF0aW9uOyBtZXNzYWdlcyB0cmlnZ2VyIHN0YXRlIHRyYW5zaXRpb25zLlxuICAgICAqIEBmdW5jdGlvbiBldmFsdWF0ZVxuICAgICAqIEBwYXJhbSB7U3RhdGVNYWNoaW5lfSBzdGF0ZU1hY2hpbmVNb2RlbCBUaGUgc3RhdGUgbWFjaGluZSBtb2RlbC4gSWYgYXV0b0luaXRpYWxpc2VNb2RlbCBpcyB0cnVlIChvciBubyBpbnN0YW5jZSBpcyBzcGVjaWZpZWQpIGFuZCB0aGUgbW9kZWwgaGFzIGNoYW5nZWQsIHRoZSBtb2RlbCB3aWxsIGJlIGluaXRpYWxpc2VkLlxuICAgICAqIEBwYXJhbSB7SUFjdGl2ZVN0YXRlQ29uZmlndXJhdGlvbn0gc3RhdGVNYWNoaW5lSW5zdGFuY2UgVGhlIGluc3RhbmNlIG9mIHRoZSBzdGF0ZSBtYWNoaW5lIG1vZGVsIHRvIGV2YWx1YXRlIHRoZSBtZXNzYWdlIGFnYWluc3QuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBhdXRvSW5pdGlhbGlzZU1vZGVsIERlZmF1bHRpbmcgdG8gdHJ1ZSwgdGhpcyB3aWxsIGNhdXNlIHRoZSBtb2RlbCB0byBiZSBpbml0aWFsaXNlZCBwcmlvciB0byBpbml0aWFsaXNpbmcgdGhlIGluc3RhbmNlIGlmIHRoZSBtb2RlbCBoYXMgY2hhbmdlZC5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgbWVzc2FnZSB0cmlnZ2VyZWQgYSBzdGF0ZSB0cmFuc2l0aW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGV2YWx1YXRlKHN0YXRlTWFjaGluZU1vZGVsLCBzdGF0ZU1hY2hpbmVJbnN0YW5jZSwgbWVzc2FnZSwgYXV0b0luaXRpYWxpc2VNb2RlbCkge1xuICAgICAgICBpZiAoYXV0b0luaXRpYWxpc2VNb2RlbCA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICBhdXRvSW5pdGlhbGlzZU1vZGVsID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBsb2cgYXMgcmVxdWlyZWRcbiAgICAgICAgU3RhdGVKUy5jb25zb2xlLmxvZyhzdGF0ZU1hY2hpbmVJbnN0YW5jZSArIFwiIGV2YWx1YXRlIFwiICsgbWVzc2FnZSk7XG4gICAgICAgIC8vIGluaXRpYWxpc2UgdGhlIHN0YXRlIG1hY2hpbmUgbW9kZWwgaWYgbmVjZXNzYXJ5XG4gICAgICAgIGlmIChhdXRvSW5pdGlhbGlzZU1vZGVsICYmIHN0YXRlTWFjaGluZU1vZGVsLmNsZWFuID09PSBmYWxzZSkge1xuICAgICAgICAgICAgaW5pdGlhbGlzZShzdGF0ZU1hY2hpbmVNb2RlbCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdGVybWluYXRlZCBzdGF0ZSBtYWNoaW5lIGluc3RhbmNlcyB3aWxsIG5vdCBldmFsdWF0ZSBtZXNzYWdlc1xuICAgICAgICBpZiAoc3RhdGVNYWNoaW5lSW5zdGFuY2UuaXNUZXJtaW5hdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV2YWx1YXRlU3RhdGUoc3RhdGVNYWNoaW5lTW9kZWwsIHN0YXRlTWFjaGluZUluc3RhbmNlLCBtZXNzYWdlKTtcbiAgICB9XG4gICAgU3RhdGVKUy5ldmFsdWF0ZSA9IGV2YWx1YXRlO1xuICAgIC8vIGV2YWx1YXRlcyBtZXNzYWdlcyBhZ2FpbnN0IGEgc3RhdGUsIGV4ZWN1dGluZyB0cmFuc2l0aW9ucyBhcyBhcHByb3ByaWF0ZVxuICAgIGZ1bmN0aW9uIGV2YWx1YXRlU3RhdGUoc3RhdGUsIHN0YXRlTWFjaGluZUluc3RhbmNlLCBtZXNzYWdlKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgLy8gZGVsZWdhdGUgdG8gY2hpbGQgcmVnaW9ucyBmaXJzdFxuICAgICAgICBzdGF0ZS5yZWdpb25zLmV2ZXJ5KGZ1bmN0aW9uIChyZWdpb24pIHtcbiAgICAgICAgICAgIGlmIChldmFsdWF0ZVN0YXRlKHN0YXRlTWFjaGluZUluc3RhbmNlLmdldEN1cnJlbnQocmVnaW9uKSwgc3RhdGVNYWNoaW5lSW5zdGFuY2UsIG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gU3RhdGVKUy5pc0FjdGl2ZShzdGF0ZSwgc3RhdGVNYWNoaW5lSW5zdGFuY2UpOyAvLyBOT1RFOiB0aGlzIGp1c3QgY29udHJvbHMgdGhlIGV2ZXJ5IGxvb3A7IGFsc28gaXNBY3RpdmUgaXMgYSBsaXR0ZSBjb3N0bHkgc28gdXNpbmcgc3BhcmluZ2x5XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gTk9URTogdGhpcyBqdXN0IGNvbnRyb2xzIHRoZSBldmVyeSBsb29wXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBpZiBhIHRyYW5zaXRpb24gb2NjdXJlZCBpbiBhIGNoaWxkIHJlZ2lvbiwgY2hlY2sgZm9yIGNvbXBsZXRpb25zXG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGlmIChtZXNzYWdlICE9PSBzdGF0ZSAmJiBTdGF0ZUpTLmlzQ29tcGxldGUoc3RhdGUsIHN0YXRlTWFjaGluZUluc3RhbmNlKSkge1xuICAgICAgICAgICAgICAgIGV2YWx1YXRlU3RhdGUoc3RhdGUsIHN0YXRlTWFjaGluZUluc3RhbmNlLCBzdGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBvdGhlcndpc2UgbG9vayBmb3IgYSB0cmFuc2l0aW9uIGZyb20gdGhpcyBzdGF0ZVxuICAgICAgICAgICAgdmFyIHRyYW5zaXRpb25zID0gc3RhdGUub3V0Z29pbmcuZmlsdGVyKGZ1bmN0aW9uICh0cmFuc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zaXRpb24uZ3VhcmQobWVzc2FnZSwgc3RhdGVNYWNoaW5lSW5zdGFuY2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAodHJhbnNpdGlvbnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgLy8gZXhlY3V0ZSBpZiBhIHNpbmdsZSB0cmFuc2l0aW9uIHdhcyBmb3VuZFxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRyYXZlcnNlKHRyYW5zaXRpb25zWzBdLCBzdGF0ZU1hY2hpbmVJbnN0YW5jZSwgbWVzc2FnZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRyYW5zaXRpb25zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAvLyBlcnJvciBpZiBtdWx0aXBsZSB0cmFuc2l0aW9ucyBldmFsdWF0ZWQgdHJ1ZVxuICAgICAgICAgICAgICAgIFN0YXRlSlMuY29uc29sZS5lcnJvcihzdGF0ZSArIFwiOiBtdWx0aXBsZSBvdXRib3VuZCB0cmFuc2l0aW9ucyBldmFsdWF0ZWQgdHJ1ZSBmb3IgbWVzc2FnZSBcIiArIG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIC8vIHRyYXZlcnNlcyBhIHRyYW5zaXRpb25cbiAgICBmdW5jdGlvbiB0cmF2ZXJzZSh0cmFuc2l0aW9uLCBpbnN0YW5jZSwgbWVzc2FnZSkge1xuICAgICAgICB2YXIgb25UcmF2ZXJzZSA9IG5ldyBTdGF0ZUpTLkJlaGF2aW9yKHRyYW5zaXRpb24ub25UcmF2ZXJzZSksXG4gICAgICAgICAgICB0YXJnZXQgPSB0cmFuc2l0aW9uLnRhcmdldDtcbiAgICAgICAgLy8gcHJvY2VzcyBzdGF0aWMgY29uZGl0aW9uYWwgYnJhbmNoZXNcbiAgICAgICAgd2hpbGUgKHRhcmdldCAmJiB0YXJnZXQgaW5zdGFuY2VvZiBTdGF0ZUpTLlBzZXVkb1N0YXRlICYmIHRhcmdldC5raW5kID09PSBTdGF0ZUpTLlBzZXVkb1N0YXRlS2luZC5KdW5jdGlvbikge1xuICAgICAgICAgICAgdGFyZ2V0ID0gKHRyYW5zaXRpb24gPSBzZWxlY3RUcmFuc2l0aW9uKHRhcmdldCwgaW5zdGFuY2UsIG1lc3NhZ2UpKS50YXJnZXQ7XG4gICAgICAgICAgICAvLyBjb25jYXRlbmF0ZSBiZWhhdmlvdXIgYmVmb3JlIGFuZCBhZnRlciBqdW5jdGlvbnNcbiAgICAgICAgICAgIG9uVHJhdmVyc2UucHVzaCh0cmFuc2l0aW9uLm9uVHJhdmVyc2UpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGV4ZWN1dGUgdGhlIHRyYW5zaXRpb24gYmVoYXZpb3VyXG4gICAgICAgIG9uVHJhdmVyc2UuaW52b2tlKG1lc3NhZ2UsIGluc3RhbmNlKTtcbiAgICAgICAgLy8gcHJvY2VzcyBkeW5hbWljIGNvbmRpdGlvbmFsIGJyYW5jaGVzXG4gICAgICAgIGlmICh0YXJnZXQgJiYgdGFyZ2V0IGluc3RhbmNlb2YgU3RhdGVKUy5Qc2V1ZG9TdGF0ZSAmJiB0YXJnZXQua2luZCA9PT0gU3RhdGVKUy5Qc2V1ZG9TdGF0ZUtpbmQuQ2hvaWNlKSB7XG4gICAgICAgICAgICB0cmF2ZXJzZShzZWxlY3RUcmFuc2l0aW9uKHRhcmdldCwgaW5zdGFuY2UsIG1lc3NhZ2UpLCBpbnN0YW5jZSwgbWVzc2FnZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0ICYmIHRhcmdldCBpbnN0YW5jZW9mIFN0YXRlSlMuU3RhdGUgJiYgU3RhdGVKUy5pc0NvbXBsZXRlKHRhcmdldCwgaW5zdGFuY2UpKSB7XG4gICAgICAgICAgICAvLyB0ZXN0IGZvciBjb21wbGV0aW9uIHRyYW5zaXRpb25zXG4gICAgICAgICAgICBldmFsdWF0ZVN0YXRlKHRhcmdldCwgaW5zdGFuY2UsIHRhcmdldCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8vIHNlbGVjdCBuZXh0IGxlZyBvZiBjb21wb3NpdGUgdHJhbnNpdGlvbnMgYWZ0ZXIgY2hvaWNlIGFuZCBqdW5jdGlvbiBwc2V1ZG8gc3RhdGVzXG4gICAgZnVuY3Rpb24gc2VsZWN0VHJhbnNpdGlvbihwc2V1ZG9TdGF0ZSwgc3RhdGVNYWNoaW5lSW5zdGFuY2UsIG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBwc2V1ZG9TdGF0ZS5vdXRnb2luZy5maWx0ZXIoZnVuY3Rpb24gKHRyYW5zaXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiB0cmFuc2l0aW9uLmd1YXJkKG1lc3NhZ2UsIHN0YXRlTWFjaGluZUluc3RhbmNlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChwc2V1ZG9TdGF0ZS5raW5kID09PSBTdGF0ZUpTLlBzZXVkb1N0YXRlS2luZC5DaG9pY2UpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHRzLmxlbmd0aCAhPT0gMCA/IHJlc3VsdHNbU3RhdGVKUy5nZXRSYW5kb20oKShyZXN1bHRzLmxlbmd0aCldIDogZmluZEVsc2UocHNldWRvU3RhdGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHJlc3VsdHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIFN0YXRlSlMuY29uc29sZS5lcnJvcihcIk11bHRpcGxlIG91dGJvdW5kIHRyYW5zaXRpb24gZ3VhcmRzIHJldHVybmVkIHRydWUgYXQgXCIgKyB0aGlzICsgXCIgZm9yIFwiICsgbWVzc2FnZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRzWzBdIHx8IGZpbmRFbHNlKHBzZXVkb1N0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBsb29rIGZvciBlbHNlIHRyYW5zaXRpbnMgZnJvbSBhIGp1bmN0aW9uIG9yIGNob2ljZVxuICAgIGZ1bmN0aW9uIGZpbmRFbHNlKHBzZXVkb1N0YXRlKSB7XG4gICAgICAgIHJldHVybiBwc2V1ZG9TdGF0ZS5vdXRnb2luZy5maWx0ZXIoZnVuY3Rpb24gKHRyYW5zaXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiB0cmFuc2l0aW9uLmd1YXJkID09PSBTdGF0ZUpTLlRyYW5zaXRpb24uRmFsc2VHdWFyZDtcbiAgICAgICAgfSlbMF07XG4gICAgfVxuICAgIC8vIGZ1bmN0aW9ucyB0byByZXRyZWl2ZSBzcGVjaWYgZWxlbWVudCBiZWhhdmlvclxuICAgIGZ1bmN0aW9uIGxlYXZlKGVsZW1lbnRCZWhhdmlvcikge1xuICAgICAgICByZXR1cm4gZWxlbWVudEJlaGF2aW9yWzBdIHx8IChlbGVtZW50QmVoYXZpb3JbMF0gPSBuZXcgU3RhdGVKUy5CZWhhdmlvcigpKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYmVnaW5FbnRlcihlbGVtZW50QmVoYXZpb3IpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnRCZWhhdmlvclsxXSB8fCAoZWxlbWVudEJlaGF2aW9yWzFdID0gbmV3IFN0YXRlSlMuQmVoYXZpb3IoKSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGVuZEVudGVyKGVsZW1lbnRCZWhhdmlvcikge1xuICAgICAgICByZXR1cm4gZWxlbWVudEJlaGF2aW9yWzJdIHx8IChlbGVtZW50QmVoYXZpb3JbMl0gPSBuZXcgU3RhdGVKUy5CZWhhdmlvcigpKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZW50ZXIoZWxlbWVudEJlaGF2aW9yKSB7XG4gICAgICAgIHJldHVybiBuZXcgU3RhdGVKUy5CZWhhdmlvcihiZWdpbkVudGVyKGVsZW1lbnRCZWhhdmlvcikpLnB1c2goZW5kRW50ZXIoZWxlbWVudEJlaGF2aW9yKSk7XG4gICAgfVxuICAgIC8vIGdldCBhbGwgdGhlIHZlcnRleCBhbmNlc3RvcnMgb2YgYSB2ZXJ0ZXggKGluY2x1ZGluZyB0aGUgdmVydGV4IGl0c2VsZilcbiAgICBmdW5jdGlvbiBhbmNlc3RvcnModmVydGV4KSB7XG4gICAgICAgIHJldHVybiAodmVydGV4LnJlZ2lvbiA/IGFuY2VzdG9ycyh2ZXJ0ZXgucmVnaW9uLnN0YXRlKSA6IFtdKS5jb25jYXQodmVydGV4KTtcbiAgICB9XG4gICAgLy8gZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIHRyYW5zaXRpb24gYW5kIHVzZSB0aGUgYXBwcm9wcmlhdGUgaW5pdGlsaWFzaXRpb24gbWV0aG9kXG4gICAgdmFyIEluaXRpYWxpc2VUcmFuc2l0aW9ucyA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgICAgIF9fZXh0ZW5kcyhJbml0aWFsaXNlVHJhbnNpdGlvbnMsIF9zdXBlcik7XG4gICAgICAgIGZ1bmN0aW9uIEluaXRpYWxpc2VUcmFuc2l0aW9ucygpIHtcbiAgICAgICAgICAgIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICAgIEluaXRpYWxpc2VUcmFuc2l0aW9ucy5wcm90b3R5cGUudmlzaXRUcmFuc2l0aW9uID0gZnVuY3Rpb24gKHRyYW5zaXRpb24sIGJlaGF2aW91cikge1xuICAgICAgICAgICAgaWYgKHRyYW5zaXRpb24ua2luZCA9PT0gU3RhdGVKUy5UcmFuc2l0aW9uS2luZC5JbnRlcm5hbCkge1xuICAgICAgICAgICAgICAgIHRyYW5zaXRpb24ub25UcmF2ZXJzZS5wdXNoKHRyYW5zaXRpb24udHJhbnNpdGlvbkJlaGF2aW9yKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHJhbnNpdGlvbi5raW5kID09PSBTdGF0ZUpTLlRyYW5zaXRpb25LaW5kLkxvY2FsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52aXNpdExvY2FsVHJhbnNpdGlvbih0cmFuc2l0aW9uLCBiZWhhdmlvdXIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZpc2l0RXh0ZXJuYWxUcmFuc2l0aW9uKHRyYW5zaXRpb24sIGJlaGF2aW91cik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIGluaXRpYWxpc2UgaW50ZXJuYWwgdHJhbnNpdGlvbnM6IHRoZXNlIGRvIG5vdCBsZWF2ZSB0aGUgc291cmNlIHN0YXRlXG4gICAgICAgIEluaXRpYWxpc2VUcmFuc2l0aW9ucy5wcm90b3R5cGUudmlzaXRMb2NhbFRyYW5zaXRpb24gPSBmdW5jdGlvbiAodHJhbnNpdGlvbiwgYmVoYXZpb3VyKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgdHJhbnNpdGlvbi5vblRyYXZlcnNlLnB1c2goZnVuY3Rpb24gKG1lc3NhZ2UsIGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldEFuY2VzdG9ycyA9IGFuY2VzdG9ycyh0cmFuc2l0aW9uLnRhcmdldCksXG4gICAgICAgICAgICAgICAgICAgIGkgPSAwO1xuICAgICAgICAgICAgICAgIC8vIGZpbmQgdGhlIGZpcnN0IGluYWN0aXZlIGVsZW1lbnQgaW4gdGhlIHRhcmdldCBhbmNlc3RyeVxuICAgICAgICAgICAgICAgIHdoaWxlIChTdGF0ZUpTLmlzQWN0aXZlKHRhcmdldEFuY2VzdG9yc1tpXSwgaW5zdGFuY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICsraTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gZXhpdCB0aGUgYWN0aXZlIHNpYmxpbmdcbiAgICAgICAgICAgICAgICBsZWF2ZShiZWhhdmlvdXIoaW5zdGFuY2UuZ2V0Q3VycmVudCh0YXJnZXRBbmNlc3RvcnNbaV0ucmVnaW9uKSkpLmludm9rZShtZXNzYWdlLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgLy8gcGVyZm9ybSB0aGUgdHJhbnNpdGlvbiBhY3Rpb247XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbi50cmFuc2l0aW9uQmVoYXZpb3IuaW52b2tlKG1lc3NhZ2UsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAvLyBlbnRlciB0aGUgdGFyZ2V0IGFuY2VzdHJ5XG4gICAgICAgICAgICAgICAgd2hpbGUgKGkgPCB0YXJnZXRBbmNlc3RvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmNhc2NhZGVFbGVtZW50RW50cnkodHJhbnNpdGlvbiwgYmVoYXZpb3VyLCB0YXJnZXRBbmNlc3RvcnNbaSsrXSwgdGFyZ2V0QW5jZXN0b3JzW2ldLCBmdW5jdGlvbiAoYmVoYXZpb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlaGF2aW9yLmludm9rZShtZXNzYWdlLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB0cmlnZ2VyIGNhc2NhZGVcbiAgICAgICAgICAgICAgICBlbmRFbnRlcihiZWhhdmlvdXIodHJhbnNpdGlvbi50YXJnZXQpKS5pbnZva2UobWVzc2FnZSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIGluaXRpYWxpc2UgZXh0ZXJuYWwgdHJhbnNpdGlvbnM6IHRoZXNlIGFyZSBhYnJpdGFyaWx5IGNvbXBsZXhcbiAgICAgICAgSW5pdGlhbGlzZVRyYW5zaXRpb25zLnByb3RvdHlwZS52aXNpdEV4dGVybmFsVHJhbnNpdGlvbiA9IGZ1bmN0aW9uICh0cmFuc2l0aW9uLCBiZWhhdmlvdXIpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2VBbmNlc3RvcnMgPSBhbmNlc3RvcnModHJhbnNpdGlvbi5zb3VyY2UpLFxuICAgICAgICAgICAgICAgIHRhcmdldEFuY2VzdG9ycyA9IGFuY2VzdG9ycyh0cmFuc2l0aW9uLnRhcmdldCksXG4gICAgICAgICAgICAgICAgaSA9IE1hdGgubWluKHNvdXJjZUFuY2VzdG9ycy5sZW5ndGgsIHRhcmdldEFuY2VzdG9ycy5sZW5ndGgpIC0gMTtcbiAgICAgICAgICAgIC8vIGZpbmQgdGhlIGluZGV4IG9mIHRoZSBmaXJzdCB1bmNvbW1vbiBhbmNlc3RvciAob3IgZm9yIGV4dGVybmFsIHRyYW5zaXRpb25zLCB0aGUgc291cmNlKVxuICAgICAgICAgICAgd2hpbGUgKHNvdXJjZUFuY2VzdG9yc1tpIC0gMV0gIT09IHRhcmdldEFuY2VzdG9yc1tpIC0gMV0pIHtcbiAgICAgICAgICAgICAgICAtLWk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBsZWF2ZSBzb3VyY2UgYW5jZXN0cnkgYXMgcmVxdWlyZWRcbiAgICAgICAgICAgIHRyYW5zaXRpb24ub25UcmF2ZXJzZS5wdXNoKGxlYXZlKGJlaGF2aW91cihzb3VyY2VBbmNlc3RvcnNbaV0pKSk7XG4gICAgICAgICAgICAvLyBwZXJmb3JtIHRoZSB0cmFuc2l0aW9uIGVmZmVjdFxuICAgICAgICAgICAgdHJhbnNpdGlvbi5vblRyYXZlcnNlLnB1c2godHJhbnNpdGlvbi50cmFuc2l0aW9uQmVoYXZpb3IpO1xuICAgICAgICAgICAgLy8gZW50ZXIgdGhlIHRhcmdldCBhbmNlc3RyeVxuICAgICAgICAgICAgd2hpbGUgKGkgPCB0YXJnZXRBbmNlc3RvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYXNjYWRlRWxlbWVudEVudHJ5KHRyYW5zaXRpb24sIGJlaGF2aW91ciwgdGFyZ2V0QW5jZXN0b3JzW2krK10sIHRhcmdldEFuY2VzdG9yc1tpXSwgZnVuY3Rpb24gKGJlaGF2aW9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cmFuc2l0aW9uLm9uVHJhdmVyc2UucHVzaChiZWhhdmlvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0cmlnZ2VyIGNhc2NhZGVcbiAgICAgICAgICAgIHRyYW5zaXRpb24ub25UcmF2ZXJzZS5wdXNoKGVuZEVudGVyKGJlaGF2aW91cih0cmFuc2l0aW9uLnRhcmdldCkpKTtcbiAgICAgICAgfTtcbiAgICAgICAgSW5pdGlhbGlzZVRyYW5zaXRpb25zLnByb3RvdHlwZS5jYXNjYWRlRWxlbWVudEVudHJ5ID0gZnVuY3Rpb24gKHRyYW5zaXRpb24sIGJlaGF2aW91ciwgZWxlbWVudCwgbmV4dCwgdGFzaykge1xuICAgICAgICAgICAgdGFzayhiZWdpbkVudGVyKGJlaGF2aW91cihlbGVtZW50KSkpO1xuICAgICAgICAgICAgaWYgKG5leHQgJiYgZWxlbWVudCBpbnN0YW5jZW9mIFN0YXRlSlMuU3RhdGUpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnJlZ2lvbnMuZm9yRWFjaChmdW5jdGlvbiAocmVnaW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhc2soYmVnaW5FbnRlcihiZWhhdmlvdXIocmVnaW9uKSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVnaW9uICE9PSBuZXh0LnJlZ2lvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFzayhlbmRFbnRlcihiZWhhdmlvdXIocmVnaW9uKSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBJbml0aWFsaXNlVHJhbnNpdGlvbnM7XG4gICAgfSkoU3RhdGVKUy5WaXNpdG9yKTtcbiAgICAvLyBib290c3RyYXBzIGFsbCB0aGUgZWxlbWVudHMgd2l0aGluIGEgc3RhdGUgbWFjaGluZSBtb2RlbFxuICAgIHZhciBJbml0aWFsaXNlRWxlbWVudHMgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgICAgICBfX2V4dGVuZHMoSW5pdGlhbGlzZUVsZW1lbnRzLCBfc3VwZXIpO1xuICAgICAgICBmdW5jdGlvbiBJbml0aWFsaXNlRWxlbWVudHMoKSB7XG4gICAgICAgICAgICBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHRoaXMuYmVoYXZpb3VycyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIEluaXRpYWxpc2VFbGVtZW50cy5wcm90b3R5cGUuYmVoYXZpb3VyID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJlaGF2aW91cnNbZWxlbWVudC5xdWFsaWZpZWROYW1lXSB8fCAodGhpcy5iZWhhdmlvdXJzW2VsZW1lbnQucXVhbGlmaWVkTmFtZV0gPSBbXSk7XG4gICAgICAgIH07XG4gICAgICAgIEluaXRpYWxpc2VFbGVtZW50cy5wcm90b3R5cGUudmlzaXRFbGVtZW50ID0gZnVuY3Rpb24gKGVsZW1lbnQsIGRlZXBIaXN0b3J5QWJvdmUpIHtcbiAgICAgICAgICAgIGlmIChTdGF0ZUpTLmNvbnNvbGUgIT09IGRlZmF1bHRDb25zb2xlKSB7XG4gICAgICAgICAgICAgICAgbGVhdmUodGhpcy5iZWhhdmlvdXIoZWxlbWVudCkpLnB1c2goZnVuY3Rpb24gKG1lc3NhZ2UsIGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTdGF0ZUpTLmNvbnNvbGUubG9nKGluc3RhbmNlICsgXCIgbGVhdmUgXCIgKyBlbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBiZWdpbkVudGVyKHRoaXMuYmVoYXZpb3VyKGVsZW1lbnQpKS5wdXNoKGZ1bmN0aW9uIChtZXNzYWdlLCBpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gU3RhdGVKUy5jb25zb2xlLmxvZyhpbnN0YW5jZSArIFwiIGVudGVyIFwiICsgZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIEluaXRpYWxpc2VFbGVtZW50cy5wcm90b3R5cGUudmlzaXRSZWdpb24gPSBmdW5jdGlvbiAocmVnaW9uLCBkZWVwSGlzdG9yeUFib3ZlKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIHJlZ2lvbkluaXRpYWwgPSByZWdpb24udmVydGljZXMucmVkdWNlKGZ1bmN0aW9uIChyZXN1bHQsIHZlcnRleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2ZXJ0ZXggaW5zdGFuY2VvZiBTdGF0ZUpTLlBzZXVkb1N0YXRlICYmIHZlcnRleC5pc0luaXRpYWwoKSA/IHZlcnRleCA6IHJlc3VsdDtcbiAgICAgICAgICAgIH0sIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICByZWdpb24udmVydGljZXMuZm9yRWFjaChmdW5jdGlvbiAodmVydGV4KSB7XG4gICAgICAgICAgICAgICAgdmVydGV4LmFjY2VwdChfdGhpcywgZGVlcEhpc3RvcnlBYm92ZSB8fCByZWdpb25Jbml0aWFsICYmIHJlZ2lvbkluaXRpYWwua2luZCA9PT0gU3RhdGVKUy5Qc2V1ZG9TdGF0ZUtpbmQuRGVlcEhpc3RvcnkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBsZWF2ZSB0aGUgY3VyZW50IGFjdGl2ZSBjaGlsZCBzdGF0ZSB3aGVuIGV4aXRpbmcgdGhlIHJlZ2lvblxuICAgICAgICAgICAgbGVhdmUodGhpcy5iZWhhdmlvdXIocmVnaW9uKSkucHVzaChmdW5jdGlvbiAobWVzc2FnZSwgc3RhdGVNYWNoaW5lSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVhdmUoX3RoaXMuYmVoYXZpb3VyKHN0YXRlTWFjaGluZUluc3RhbmNlLmdldEN1cnJlbnQocmVnaW9uKSkpLmludm9rZShtZXNzYWdlLCBzdGF0ZU1hY2hpbmVJbnN0YW5jZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGVudGVyIHRoZSBhcHByb3ByaWF0ZSBjaGlsZCB2ZXJ0ZXggd2hlbiBlbnRlcmluZyB0aGUgcmVnaW9uXG4gICAgICAgICAgICBpZiAoZGVlcEhpc3RvcnlBYm92ZSB8fCAhcmVnaW9uSW5pdGlhbCB8fCByZWdpb25Jbml0aWFsLmlzSGlzdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgZW5kRW50ZXIodGhpcy5iZWhhdmlvdXIocmVnaW9uKSkucHVzaChmdW5jdGlvbiAobWVzc2FnZSwgc3RhdGVNYWNoaW5lSW5zdGFuY2UsIGhpc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgZW50ZXIoX3RoaXMuYmVoYXZpb3VyKGhpc3RvcnkgfHwgcmVnaW9uSW5pdGlhbC5pc0hpc3RvcnkoKSA/IHN0YXRlTWFjaGluZUluc3RhbmNlLmdldEN1cnJlbnQocmVnaW9uKSB8fCByZWdpb25Jbml0aWFsIDogcmVnaW9uSW5pdGlhbCkpLmludm9rZShtZXNzYWdlLCBzdGF0ZU1hY2hpbmVJbnN0YW5jZSwgaGlzdG9yeSB8fCByZWdpb25Jbml0aWFsLmtpbmQgPT09IFN0YXRlSlMuUHNldWRvU3RhdGVLaW5kLkRlZXBIaXN0b3J5KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZW5kRW50ZXIodGhpcy5iZWhhdmlvdXIocmVnaW9uKSkucHVzaChlbnRlcih0aGlzLmJlaGF2aW91cihyZWdpb25Jbml0aWFsKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy52aXNpdEVsZW1lbnQocmVnaW9uLCBkZWVwSGlzdG9yeUFib3ZlKTtcbiAgICAgICAgfTtcbiAgICAgICAgSW5pdGlhbGlzZUVsZW1lbnRzLnByb3RvdHlwZS52aXNpdFBzZXVkb1N0YXRlID0gZnVuY3Rpb24gKHBzZXVkb1N0YXRlLCBkZWVwSGlzdG9yeUFib3ZlKSB7XG4gICAgICAgICAgICBfc3VwZXIucHJvdG90eXBlLnZpc2l0UHNldWRvU3RhdGUuY2FsbCh0aGlzLCBwc2V1ZG9TdGF0ZSwgZGVlcEhpc3RvcnlBYm92ZSk7XG4gICAgICAgICAgICAvLyBldmFsdWF0ZSBjb21wcGxldGlvbiB0cmFuc2l0aW9ucyBvbmNlIHZlcnRleCBlbnRyeSBpcyBjb21wbGV0ZVxuICAgICAgICAgICAgaWYgKHBzZXVkb1N0YXRlLmlzSW5pdGlhbCgpKSB7XG4gICAgICAgICAgICAgICAgZW5kRW50ZXIodGhpcy5iZWhhdmlvdXIocHNldWRvU3RhdGUpKS5wdXNoKGZ1bmN0aW9uIChtZXNzYWdlLCBzdGF0ZU1hY2hpbmVJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJhdmVyc2UocHNldWRvU3RhdGUub3V0Z29pbmdbMF0sIHN0YXRlTWFjaGluZUluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHNldWRvU3RhdGUua2luZCA9PT0gU3RhdGVKUy5Qc2V1ZG9TdGF0ZUtpbmQuVGVybWluYXRlKSB7XG4gICAgICAgICAgICAgICAgLy8gdGVybWluYXRlIHRoZSBzdGF0ZSBtYWNoaW5lIGluc3RhbmNlIHVwb24gdHJhbnNpdGlvbiB0byBhIHRlcm1pbmF0ZSBwc2V1ZG8gc3RhdGVcbiAgICAgICAgICAgICAgICBiZWdpbkVudGVyKHRoaXMuYmVoYXZpb3VyKHBzZXVkb1N0YXRlKSkucHVzaChmdW5jdGlvbiAobWVzc2FnZSwgc3RhdGVNYWNoaW5lSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlTWFjaGluZUluc3RhbmNlLmlzVGVybWluYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIEluaXRpYWxpc2VFbGVtZW50cy5wcm90b3R5cGUudmlzaXRTdGF0ZSA9IGZ1bmN0aW9uIChzdGF0ZSwgZGVlcEhpc3RvcnlBYm92ZSkge1xuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIC8vIE5PVEU6IG1hbnVhbGx5IGl0ZXJhdGUgb3ZlciB0aGUgY2hpbGQgcmVnaW9ucyB0byBjb250cm9sIHRoZSBzZXF1ZW5jZSBvZiBiZWhhdmlvdXJcbiAgICAgICAgICAgIHN0YXRlLnJlZ2lvbnMuZm9yRWFjaChmdW5jdGlvbiAocmVnaW9uKSB7XG4gICAgICAgICAgICAgICAgcmVnaW9uLmFjY2VwdChfdGhpcywgZGVlcEhpc3RvcnlBYm92ZSk7XG4gICAgICAgICAgICAgICAgbGVhdmUoX3RoaXMuYmVoYXZpb3VyKHN0YXRlKSkucHVzaChsZWF2ZShfdGhpcy5iZWhhdmlvdXIocmVnaW9uKSkpO1xuICAgICAgICAgICAgICAgIGVuZEVudGVyKF90aGlzLmJlaGF2aW91cihzdGF0ZSkpLnB1c2goZW50ZXIoX3RoaXMuYmVoYXZpb3VyKHJlZ2lvbikpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy52aXNpdFZlcnRleChzdGF0ZSwgZGVlcEhpc3RvcnlBYm92ZSk7XG4gICAgICAgICAgICAvLyBhZGQgdGhlIHVzZXIgZGVmaW5lZCBiZWhhdmlvdXIgd2hlbiBlbnRlcmluZyBhbmQgZXhpdGluZyBzdGF0ZXNcbiAgICAgICAgICAgIGxlYXZlKHRoaXMuYmVoYXZpb3VyKHN0YXRlKSkucHVzaChzdGF0ZS5leGl0QmVoYXZpb3IpO1xuICAgICAgICAgICAgYmVnaW5FbnRlcih0aGlzLmJlaGF2aW91cihzdGF0ZSkpLnB1c2goc3RhdGUuZW50cnlCZWhhdmlvcik7XG4gICAgICAgICAgICAvLyB1cGRhdGUgdGhlIHBhcmVudCByZWdpb25zIGN1cnJlbnQgc3RhdGVcbiAgICAgICAgICAgIGJlZ2luRW50ZXIodGhpcy5iZWhhdmlvdXIoc3RhdGUpKS5wdXNoKGZ1bmN0aW9uIChtZXNzYWdlLCBzdGF0ZU1hY2hpbmVJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5yZWdpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVNYWNoaW5lSW5zdGFuY2Uuc2V0Q3VycmVudChzdGF0ZS5yZWdpb24sIHN0YXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgSW5pdGlhbGlzZUVsZW1lbnRzLnByb3RvdHlwZS52aXNpdFN0YXRlTWFjaGluZSA9IGZ1bmN0aW9uIChzdGF0ZU1hY2hpbmUsIGRlZXBIaXN0b3J5QWJvdmUpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICBfc3VwZXIucHJvdG90eXBlLnZpc2l0U3RhdGVNYWNoaW5lLmNhbGwodGhpcywgc3RhdGVNYWNoaW5lLCBkZWVwSGlzdG9yeUFib3ZlKTtcbiAgICAgICAgICAgIC8vIGluaXRpYWlzZSBhbGwgdGhlIHRyYW5zaXRpb25zIG9uY2UgYWxsIHRoZSBlbGVtZW50cyBoYXZlIGJlZW4gaW5pdGlhbGlzZWRcbiAgICAgICAgICAgIHN0YXRlTWFjaGluZS5hY2NlcHQobmV3IEluaXRpYWxpc2VUcmFuc2l0aW9ucygpLCBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5iZWhhdmlvdXIoZWxlbWVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGRlZmluZSB0aGUgYmVoYXZpb3VyIGZvciBpbml0aWFsaXNpbmcgYSBzdGF0ZSBtYWNoaW5lIGluc3RhbmNlXG4gICAgICAgICAgICBzdGF0ZU1hY2hpbmUub25Jbml0aWFsaXNlID0gZW50ZXIodGhpcy5iZWhhdmlvdXIoc3RhdGVNYWNoaW5lKSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBJbml0aWFsaXNlRWxlbWVudHM7XG4gICAgfSkoU3RhdGVKUy5WaXNpdG9yKTtcbiAgICB2YXIgZGVmYXVsdENvbnNvbGUgPSB7XG4gICAgICAgIGxvZzogZnVuY3Rpb24gbG9nKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25hbFBhcmFtcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICBvcHRpb25hbFBhcmFtc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgd2FybjogZnVuY3Rpb24gd2FybihtZXNzYWdlKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9uYWxQYXJhbXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9uYWxQYXJhbXNbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVycm9yOiBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9uYWxQYXJhbXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9uYWxQYXJhbXNbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBtZXNzYWdlO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBUaGUgb2JqZWN0IHVzZWQgZm9yIGxvZywgd2FybmluZyBhbmQgZXJyb3IgbWVzc2FnZXNcbiAgICAgKiBAbWVtYmVyIHtJQ29uc29sZX1cbiAgICAgKi9cbiAgICBTdGF0ZUpTLmNvbnNvbGUgPSBkZWZhdWx0Q29uc29sZTtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcbiAqIEZpbml0ZSBzdGF0ZSBtYWNoaW5lIGxpYnJhcnlcbiAqIENvcHlyaWdodCAoYykgMjAxNC01IFN0ZWVsYnJlZXplIExpbWl0ZWRcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xuICogaHR0cDovL3d3dy5zdGVlbGJyZWV6ZS5uZXQvc3RhdGUuY3NcbiAqL1xudmFyIFN0YXRlSlM7XG4oZnVuY3Rpb24gKFN0YXRlSlMpIHtcbiAgICAvKipcbiAgICAgKiBWYWxpZGF0ZXMgYSBzdGF0ZSBtYWNoaW5lIG1vZGVsIGZvciBjb3JyZWN0bmVzcyAoc2VlIHRoZSBjb25zdHJhaW50cyBkZWZpbmVkIHdpdGhpbiB0aGUgVU1MIFN1cGVyc3RydWN0dXJlIHNwZWNpZmljYXRpb24pLlxuICAgICAqIEBmdW5jdGlvbiB2YWxpZGF0ZVxuICAgICAqIEBwYXJhbSB7U3RhdGVNYWNoaW5lfSBzdGF0ZU1hY2hpbmVNb2RlbCBUaGUgc3RhdGUgbWFjaGluZSBtb2RlbCB0byB2YWxpZGF0ZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB2YWxpZGF0ZShzdGF0ZU1hY2hpbmVNb2RlbCkge1xuICAgICAgICBzdGF0ZU1hY2hpbmVNb2RlbC5hY2NlcHQobmV3IFZhbGlkYXRvcigpKTtcbiAgICB9XG4gICAgU3RhdGVKUy52YWxpZGF0ZSA9IHZhbGlkYXRlO1xuICAgIGZ1bmN0aW9uIGFuY2VzdG9ycyh2ZXJ0ZXgpIHtcbiAgICAgICAgcmV0dXJuICh2ZXJ0ZXgucmVnaW9uID8gYW5jZXN0b3JzKHZlcnRleC5yZWdpb24uc3RhdGUpIDogW10pLmNvbmNhdCh2ZXJ0ZXgpO1xuICAgIH1cbiAgICB2YXIgVmFsaWRhdG9yID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICAgICAgX19leHRlbmRzKFZhbGlkYXRvciwgX3N1cGVyKTtcbiAgICAgICAgZnVuY3Rpb24gVmFsaWRhdG9yKCkge1xuICAgICAgICAgICAgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICAgICAgVmFsaWRhdG9yLnByb3RvdHlwZS52aXNpdFBzZXVkb1N0YXRlID0gZnVuY3Rpb24gKHBzZXVkb1N0YXRlKSB7XG4gICAgICAgICAgICBfc3VwZXIucHJvdG90eXBlLnZpc2l0UHNldWRvU3RhdGUuY2FsbCh0aGlzLCBwc2V1ZG9TdGF0ZSk7XG4gICAgICAgICAgICBpZiAocHNldWRvU3RhdGUua2luZCA9PT0gU3RhdGVKUy5Qc2V1ZG9TdGF0ZUtpbmQuQ2hvaWNlIHx8IHBzZXVkb1N0YXRlLmtpbmQgPT09IFN0YXRlSlMuUHNldWRvU3RhdGVLaW5kLkp1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgLy8gWzddIEluIGEgY29tcGxldGUgc3RhdGVtYWNoaW5lLCBhIGp1bmN0aW9uIHZlcnRleCBtdXN0IGhhdmUgYXQgbGVhc3Qgb25lIGluY29taW5nIGFuZCBvbmUgb3V0Z29pbmcgdHJhbnNpdGlvbi5cbiAgICAgICAgICAgICAgICAvLyBbOF0gSW4gYSBjb21wbGV0ZSBzdGF0ZW1hY2hpbmUsIGEgY2hvaWNlIHZlcnRleCBtdXN0IGhhdmUgYXQgbGVhc3Qgb25lIGluY29taW5nIGFuZCBvbmUgb3V0Z29pbmcgdHJhbnNpdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAocHNldWRvU3RhdGUub3V0Z29pbmcubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIFN0YXRlSlMuY29uc29sZS5lcnJvcihwc2V1ZG9TdGF0ZSArIFwiOiBcIiArIHBzZXVkb1N0YXRlLmtpbmQgKyBcIiBwc2V1ZG8gc3RhdGVzIG11c3QgaGF2ZSBhdCBsZWFzdCBvbmUgb3V0Z29pbmcgdHJhbnNpdGlvbi5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGNob2ljZSBhbmQganVuY3Rpb24gcHNldWRvIHN0YXRlIGNhbiBoYXZlIGF0IG1vc3Qgb25lIGVsc2UgdHJhbnNpdGlvblxuICAgICAgICAgICAgICAgIGlmIChwc2V1ZG9TdGF0ZS5vdXRnb2luZy5maWx0ZXIoZnVuY3Rpb24gKHRyYW5zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zaXRpb24uZ3VhcmQgPT09IFN0YXRlSlMuVHJhbnNpdGlvbi5GYWxzZUd1YXJkO1xuICAgICAgICAgICAgICAgIH0pLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgU3RhdGVKUy5jb25zb2xlLmVycm9yKHBzZXVkb1N0YXRlICsgXCI6IFwiICsgcHNldWRvU3RhdGUua2luZCArIFwiIHBzZXVkbyBzdGF0ZXMgY2Fubm90IGhhdmUgbW9yZSB0aGFuIG9uZSBFbHNlIHRyYW5zaXRpb25zLlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIG5vbiBjaG9pY2UvanVuY3Rpb24gcHNldWRvIHN0YXRlIG1heSBub3QgaGF2ZSBlbHNlIHRyYW5zaXRpb25zXG4gICAgICAgICAgICAgICAgaWYgKHBzZXVkb1N0YXRlLm91dGdvaW5nLmZpbHRlcihmdW5jdGlvbiAodHJhbnNpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnNpdGlvbi5ndWFyZCA9PT0gU3RhdGVKUy5UcmFuc2l0aW9uLkZhbHNlR3VhcmQ7XG4gICAgICAgICAgICAgICAgfSkubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIFN0YXRlSlMuY29uc29sZS5lcnJvcihwc2V1ZG9TdGF0ZSArIFwiOiBcIiArIHBzZXVkb1N0YXRlLmtpbmQgKyBcIiBwc2V1ZG8gc3RhdGVzIGNhbm5vdCBoYXZlIEVsc2UgdHJhbnNpdGlvbnMuXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocHNldWRvU3RhdGUuaXNJbml0aWFsKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBzZXVkb1N0YXRlLm91dGdvaW5nLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gWzFdIEFuIGluaXRpYWwgdmVydGV4IGNhbiBoYXZlIGF0IG1vc3Qgb25lIG91dGdvaW5nIHRyYW5zaXRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBbMl0gSGlzdG9yeSB2ZXJ0aWNlcyBjYW4gaGF2ZSBhdCBtb3N0IG9uZSBvdXRnb2luZyB0cmFuc2l0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAgU3RhdGVKUy5jb25zb2xlLmVycm9yKHBzZXVkb1N0YXRlICsgXCI6IGluaXRpYWwgcHNldWRvIHN0YXRlcyBtdXN0IGhhdmUgb25lIG91dGdvaW5nIHRyYW5zaXRpb24uXCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gWzldIFRoZSBvdXRnb2luZyB0cmFuc2l0aW9uIGZyb20gYW4gaW5pdGlhbCB2ZXJ0ZXggbWF5IGhhdmUgYSBiZWhhdmlvciwgYnV0IG5vdCBhIHRyaWdnZXIgb3IgZ3VhcmQuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHNldWRvU3RhdGUub3V0Z29pbmdbMF0uZ3VhcmQgIT09IFN0YXRlSlMuVHJhbnNpdGlvbi5UcnVlR3VhcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdGF0ZUpTLmNvbnNvbGUuZXJyb3IocHNldWRvU3RhdGUgKyBcIjogaW5pdGlhbCBwc2V1ZG8gc3RhdGVzIGNhbm5vdCBoYXZlIGEgZ3VhcmQgY29uZGl0aW9uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgVmFsaWRhdG9yLnByb3RvdHlwZS52aXNpdFJlZ2lvbiA9IGZ1bmN0aW9uIChyZWdpb24pIHtcbiAgICAgICAgICAgIF9zdXBlci5wcm90b3R5cGUudmlzaXRSZWdpb24uY2FsbCh0aGlzLCByZWdpb24pO1xuICAgICAgICAgICAgLy8gWzFdIEEgcmVnaW9uIGNhbiBoYXZlIGF0IG1vc3Qgb25lIGluaXRpYWwgdmVydGV4LlxuICAgICAgICAgICAgLy8gWzJdIEEgcmVnaW9uIGNhbiBoYXZlIGF0IG1vc3Qgb25lIGRlZXAgaGlzdG9yeSB2ZXJ0ZXguXG4gICAgICAgICAgICAvLyBbM10gQSByZWdpb24gY2FuIGhhdmUgYXQgbW9zdCBvbmUgc2hhbGxvdyBoaXN0b3J5IHZlcnRleC5cbiAgICAgICAgICAgIHZhciBpbml0aWFsO1xuICAgICAgICAgICAgcmVnaW9uLnZlcnRpY2VzLmZvckVhY2goZnVuY3Rpb24gKHZlcnRleCkge1xuICAgICAgICAgICAgICAgIGlmICh2ZXJ0ZXggaW5zdGFuY2VvZiBTdGF0ZUpTLlBzZXVkb1N0YXRlICYmIHZlcnRleC5pc0luaXRpYWwoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5pdGlhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgU3RhdGVKUy5jb25zb2xlLmVycm9yKHJlZ2lvbiArIFwiOiByZWdpb25zIG1heSBoYXZlIGF0IG1vc3Qgb25lIGluaXRpYWwgcHNldWRvIHN0YXRlLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpbml0aWFsID0gdmVydGV4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBWYWxpZGF0b3IucHJvdG90eXBlLnZpc2l0U3RhdGUgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgICAgIF9zdXBlci5wcm90b3R5cGUudmlzaXRTdGF0ZS5jYWxsKHRoaXMsIHN0YXRlKTtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5yZWdpb25zLmZpbHRlcihmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUubmFtZSA9PT0gU3RhdGVKUy5SZWdpb24uZGVmYXVsdE5hbWU7XG4gICAgICAgICAgICB9KS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgU3RhdGVKUy5jb25zb2xlLmVycm9yKHN0YXRlICsgXCI6IGEgc3RhdGUgY2Fubm90IGhhdmUgbW9yZSB0aGFuIG9uZSByZWdpb24gbmFtZWQgXCIgKyBTdGF0ZUpTLlJlZ2lvbi5kZWZhdWx0TmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIFZhbGlkYXRvci5wcm90b3R5cGUudmlzaXRGaW5hbFN0YXRlID0gZnVuY3Rpb24gKGZpbmFsU3RhdGUpIHtcbiAgICAgICAgICAgIF9zdXBlci5wcm90b3R5cGUudmlzaXRGaW5hbFN0YXRlLmNhbGwodGhpcywgZmluYWxTdGF0ZSk7XG4gICAgICAgICAgICAvLyBbMV0gQSBmaW5hbCBzdGF0ZSBjYW5ub3QgaGF2ZSBhbnkgb3V0Z29pbmcgdHJhbnNpdGlvbnMuXG4gICAgICAgICAgICBpZiAoZmluYWxTdGF0ZS5vdXRnb2luZy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICBTdGF0ZUpTLmNvbnNvbGUuZXJyb3IoZmluYWxTdGF0ZSArIFwiOiBmaW5hbCBzdGF0ZXMgbXVzdCBub3QgaGF2ZSBvdXRnb2luZyB0cmFuc2l0aW9ucy5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBbMl0gQSBmaW5hbCBzdGF0ZSBjYW5ub3QgaGF2ZSByZWdpb25zLlxuICAgICAgICAgICAgaWYgKGZpbmFsU3RhdGUucmVnaW9ucy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICBTdGF0ZUpTLmNvbnNvbGUuZXJyb3IoZmluYWxTdGF0ZSArIFwiOiBmaW5hbCBzdGF0ZXMgbXVzdCBub3QgaGF2ZSBjaGlsZCByZWdpb25zLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFs0XSBBIGZpbmFsIHN0YXRlIGhhcyBubyBlbnRyeSBiZWhhdmlvci5cbiAgICAgICAgICAgIGlmIChmaW5hbFN0YXRlLmVudHJ5QmVoYXZpb3IuaGFzQWN0aW9ucygpKSB7XG4gICAgICAgICAgICAgICAgU3RhdGVKUy5jb25zb2xlLndhcm4oZmluYWxTdGF0ZSArIFwiOiBmaW5hbCBzdGF0ZXMgbWF5IG5vdCBoYXZlIGVudHJ5IGJlaGF2aW9yLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFs1XSBBIGZpbmFsIHN0YXRlIGhhcyBubyBleGl0IGJlaGF2aW9yLlxuICAgICAgICAgICAgaWYgKGZpbmFsU3RhdGUuZXhpdEJlaGF2aW9yLmhhc0FjdGlvbnMoKSkge1xuICAgICAgICAgICAgICAgIFN0YXRlSlMuY29uc29sZS53YXJuKGZpbmFsU3RhdGUgKyBcIjogZmluYWwgc3RhdGVzIG1heSBub3QgaGF2ZSBleGl0IGJlaGF2aW9yLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgVmFsaWRhdG9yLnByb3RvdHlwZS52aXNpdFRyYW5zaXRpb24gPSBmdW5jdGlvbiAodHJhbnNpdGlvbikge1xuICAgICAgICAgICAgX3N1cGVyLnByb3RvdHlwZS52aXNpdFRyYW5zaXRpb24uY2FsbCh0aGlzLCB0cmFuc2l0aW9uKTtcbiAgICAgICAgICAgIC8vIExvY2FsIHRyYW5zaXRpb24gdGFyZ2V0IHZlcnRpY2VzIG11c3QgYmUgYSBjaGlsZCBvZiB0aGUgc291cmNlIHZlcnRleFxuICAgICAgICAgICAgaWYgKHRyYW5zaXRpb24ua2luZCA9PT0gU3RhdGVKUy5UcmFuc2l0aW9uS2luZC5Mb2NhbCkge1xuICAgICAgICAgICAgICAgIGlmIChhbmNlc3RvcnModHJhbnNpdGlvbi50YXJnZXQpLmluZGV4T2YodHJhbnNpdGlvbi5zb3VyY2UpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBTdGF0ZUpTLmNvbnNvbGUuZXJyb3IodHJhbnNpdGlvbiArIFwiOiBsb2NhbCB0cmFuc2l0aW9uIHRhcmdldCB2ZXJ0aWNlcyBtdXN0IGJlIGEgY2hpbGQgb2YgdGhlIHNvdXJjZSBjb21wb3NpdGUgc2F0ZS5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gVmFsaWRhdG9yO1xuICAgIH0pKFN0YXRlSlMuVmlzaXRvcik7XG59KShTdGF0ZUpTIHx8IChTdGF0ZUpTID0ge30pKTtcbi8qXG4gKiBGaW5pdGUgc3RhdGUgbWFjaGluZSBsaWJyYXJ5XG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGFuZCBHUEwgdjMgbGljZW5jZXNcbiAqIGh0dHA6Ly93d3cuc3RlZWxicmVlemUubmV0L3N0YXRlLmNzXG4gKi9cbi8vdmFyIG1vZHVsZSA9IG1vZHVsZTtcbm1vZHVsZS5leHBvcnRzID0gU3RhdGVKUztcblxuY2MuX1JGcG9wKCk7Il19
