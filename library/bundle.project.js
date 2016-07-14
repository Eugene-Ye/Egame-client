require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"ActorRenderer":[function(require,module,exports){
"use strict";
cc._RFpush(module, '1a792KO87NBg7vCCIp1jq+j', 'ActorRenderer');
// scripts\ActorRenderer.js

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
// scripts\Actor.js

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
// scripts\AssetMng.js

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
// scripts\AudioMng.js

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
// scripts\Bet.js

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
// scripts\UI\ButtonScaler.js

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
// scripts\Card.js

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
// scripts\Dealer.js

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
// scripts\module\Decks.js

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
// scripts\FXPlayer.js

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
// scripts\Game.js

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
// scripts\UI\InGameUI.js

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
// scripts\Login.js

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
        var url = "http://192.168.1.102:8088/welcome/?action=user.signin";
        var data = "username=" + username + "&pass=" + pass;
        //var data = JSON.stringify({"username": username, "pass": pass});
        //var data = {"username": username, "pass": pass};
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status < 400) {
                var response = xhr.responseText;
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

        //load users
        url = "http://192.168.1.102:8088/welcome/?action=user.getusers";
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status < 400) {
                var response = xhr.responseText;
                console.log(response);
                cc.sys.localStorage.setItem('userData', JSON.stringify(response));
            }
        };

        xhr.open("GET", url, true);
        xhr.send();

        //reset data
        /*url = "http://192.168.1.102:8088/welcome/?action=user.rsetusers";
        xhr.onreadystatechange = function () {
          if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status < 400)) {
            var response = xhr.responseText;
            console.log(response);
          }
        };
        
        xhr.open("GET", url, true);
        xhr.send();*/

        //cc.director.loadScene('menu');
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});

cc._RFpop();
},{}],"Menu":[function(require,module,exports){
"use strict";
cc._RFpush(module, '20f60m+3RlGO7x2/ARzZ6Qc', 'Menu');
// scripts\Menu.js

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
// scripts\UI\ModalUI.js

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
// scripts\module\PlayerData.js

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
// scripts\Player.js

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
// scripts\UI\RankItem.js

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
// scripts\UI\RankList.js

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
// scripts\SideSwitcher.js

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
// scripts\TossChip.js

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
// scripts\module\Types.js

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
// scripts\module\Utils.js


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
// scripts\module\game-fsm.js

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
// scripts\lib\state.com.js

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
},{}]},{},["AudioMng","RankItem","Decks","ActorRenderer","Menu","Player","Login","Bet","SideSwitcher","PlayerData","ModalUI","AssetMng","Types","Game","game-fsm","FXPlayer","state.com","Utils","Actor","ButtonScaler","Card","TossChip","Dealer","InGameUI","RankList"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0FkbWluaXN0cmF0b3IvQXBwRGF0YS9Mb2NhbC9Db2Nvc0NyZWF0b3IvYXBwLTEuMS4xL3Jlc291cmNlcy9hcHAuYXNhci9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYXNzZXRzL3NjcmlwdHMvQWN0b3JSZW5kZXJlci5qcyIsImFzc2V0cy9zY3JpcHRzL0FjdG9yLmpzIiwiYXNzZXRzL3NjcmlwdHMvQXNzZXRNbmcuanMiLCJhc3NldHMvc2NyaXB0cy9BdWRpb01uZy5qcyIsImFzc2V0cy9zY3JpcHRzL0JldC5qcyIsImFzc2V0cy9zY3JpcHRzL1VJL0J1dHRvblNjYWxlci5qcyIsImFzc2V0cy9zY3JpcHRzL0NhcmQuanMiLCJhc3NldHMvc2NyaXB0cy9EZWFsZXIuanMiLCJhc3NldHMvc2NyaXB0cy9tb2R1bGUvRGVja3MuanMiLCJhc3NldHMvc2NyaXB0cy9GWFBsYXllci5qcyIsImFzc2V0cy9zY3JpcHRzL0dhbWUuanMiLCJhc3NldHMvc2NyaXB0cy9VSS9JbkdhbWVVSS5qcyIsImFzc2V0cy9zY3JpcHRzL0xvZ2luLmpzIiwiYXNzZXRzL3NjcmlwdHMvTWVudS5qcyIsImFzc2V0cy9zY3JpcHRzL1VJL01vZGFsVUkuanMiLCJhc3NldHMvc2NyaXB0cy9tb2R1bGUvUGxheWVyRGF0YS5qcyIsImFzc2V0cy9zY3JpcHRzL1BsYXllci5qcyIsImFzc2V0cy9zY3JpcHRzL1VJL1JhbmtJdGVtLmpzIiwiYXNzZXRzL3NjcmlwdHMvVUkvUmFua0xpc3QuanMiLCJhc3NldHMvc2NyaXB0cy9TaWRlU3dpdGNoZXIuanMiLCJhc3NldHMvc2NyaXB0cy9Ub3NzQ2hpcC5qcyIsImFzc2V0cy9zY3JpcHRzL21vZHVsZS9UeXBlcy5qcyIsImFzc2V0cy9zY3JpcHRzL21vZHVsZS9VdGlscy5qcyIsImFzc2V0cy9zY3JpcHRzL21vZHVsZS9nYW1lLWZzbS5qcyIsImFzc2V0cy9zY3JpcHRzL2xpYi9zdGF0ZS5jb20uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICcxYTc5MktPODdOQmc3dkNDSXAxanEraicsICdBY3RvclJlbmRlcmVyJyk7XG4vLyBzY3JpcHRzXFxBY3RvclJlbmRlcmVyLmpzXG5cbnZhciBHYW1lID0gcmVxdWlyZSgnR2FtZScpO1xudmFyIFR5cGVzID0gcmVxdWlyZSgnVHlwZXMnKTtcbnZhciBVdGlscyA9IHJlcXVpcmUoJ1V0aWxzJyk7XG52YXIgQWN0b3JQbGF5aW5nU3RhdGUgPSBUeXBlcy5BY3RvclBsYXlpbmdTdGF0ZTtcblxuY2MuQ2xhc3Moe1xuICAgICdleHRlbmRzJzogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBwbGF5ZXJJbmZvOiBjYy5Ob2RlLFxuICAgICAgICBzdGFrZU9uVGFibGU6IGNjLk5vZGUsXG4gICAgICAgIGNhcmRJbmZvOiBjYy5Ob2RlLFxuICAgICAgICBjYXJkUHJlZmFiOiBjYy5QcmVmYWIsXG4gICAgICAgIGFuY2hvckNhcmRzOiBjYy5Ob2RlLFxuICAgICAgICBzcFBsYXllck5hbWU6IGNjLlNwcml0ZSxcbiAgICAgICAgbGFiZWxQbGF5ZXJOYW1lOiBjYy5MYWJlbCxcbiAgICAgICAgbGFiZWxUb3RhbFN0YWtlOiBjYy5MYWJlbCxcbiAgICAgICAgc3BQbGF5ZXJQaG90bzogY2MuU3ByaXRlLFxuICAgICAgICBjYWxsQ291bnRlcjogY2MuUHJvZ3Jlc3NCYXIsXG4gICAgICAgIGxhYmVsU3Rha2VPblRhYmxlOiBjYy5MYWJlbCxcbiAgICAgICAgc3BDaGlwczoge1xuICAgICAgICAgICAgJ2RlZmF1bHQnOiBbXSxcbiAgICAgICAgICAgIHR5cGU6IGNjLlNwcml0ZVxuICAgICAgICB9LFxuICAgICAgICBsYWJlbENhcmRJbmZvOiBjYy5MYWJlbCxcbiAgICAgICAgc3BDYXJkSW5mbzogY2MuU3ByaXRlLFxuICAgICAgICBhbmltRlg6IGNjLk5vZGUsXG4gICAgICAgIGNhcmRTcGFjZTogMFxuICAgIH0sXG5cbiAgICBvbkxvYWQ6IGZ1bmN0aW9uIG9uTG9hZCgpIHt9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChwbGF5ZXJJbmZvLCBwbGF5ZXJJbmZvUG9zLCBzdGFrZVBvcywgdHVybkR1cmF0aW9uLCBzd2l0Y2hTaWRlKSB7XG4gICAgICAgIC8vIGFjdG9yXG4gICAgICAgIHRoaXMuYWN0b3IgPSB0aGlzLmdldENvbXBvbmVudCgnQWN0b3InKTtcblxuICAgICAgICAvLyBub2Rlc1xuICAgICAgICB0aGlzLmlzQ291bnRpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jb3VudGVyVGltZXIgPSAwO1xuICAgICAgICB0aGlzLnR1cm5EdXJhdGlvbiA9IHR1cm5EdXJhdGlvbjtcblxuICAgICAgICB0aGlzLnBsYXllckluZm8ucG9zaXRpb24gPSBwbGF5ZXJJbmZvUG9zO1xuICAgICAgICB0aGlzLnN0YWtlT25UYWJsZS5wb3NpdGlvbiA9IHN0YWtlUG9zO1xuICAgICAgICB0aGlzLmxhYmVsUGxheWVyTmFtZS5zdHJpbmcgPSBwbGF5ZXJJbmZvLm5hbWU7XG4gICAgICAgIHRoaXMudXBkYXRlVG90YWxTdGFrZShwbGF5ZXJJbmZvLmdvbGQpO1xuICAgICAgICB2YXIgcGhvdG9JZHggPSBwbGF5ZXJJbmZvLnBob3RvSWR4ICUgNTtcbiAgICAgICAgdGhpcy5zcFBsYXllclBob3RvLnNwcml0ZUZyYW1lID0gR2FtZS5pbnN0YW5jZS5hc3NldE1uZy5wbGF5ZXJQaG90b3NbcGhvdG9JZHhdO1xuICAgICAgICAvLyBmeFxuICAgICAgICB0aGlzLmFuaW1GWCA9IHRoaXMuYW5pbUZYLmdldENvbXBvbmVudCgnRlhQbGF5ZXInKTtcbiAgICAgICAgdGhpcy5hbmltRlguaW5pdCgpO1xuICAgICAgICB0aGlzLmFuaW1GWC5zaG93KGZhbHNlKTtcblxuICAgICAgICB0aGlzLmNhcmRJbmZvLmFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgICAgIC8vIHN3aXRjaCBzaWRlXG4gICAgICAgIGlmIChzd2l0Y2hTaWRlKSB7XG4gICAgICAgICAgICB0aGlzLnNwQ2FyZEluZm8uZ2V0Q29tcG9uZW50KCdTaWRlU3dpdGNoZXInKS5zd2l0Y2hTaWRlKCk7XG4gICAgICAgICAgICB0aGlzLnNwUGxheWVyTmFtZS5nZXRDb21wb25lbnQoJ1NpZGVTd2l0Y2hlcicpLnN3aXRjaFNpZGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZShkdCkge1xuICAgICAgICBpZiAodGhpcy5pc0NvdW50aW5nKSB7XG4gICAgICAgICAgICB0aGlzLmNhbGxDb3VudGVyLnByb2dyZXNzID0gdGhpcy5jb3VudGVyVGltZXIgLyB0aGlzLnR1cm5EdXJhdGlvbjtcbiAgICAgICAgICAgIHRoaXMuY291bnRlclRpbWVyICs9IGR0O1xuICAgICAgICAgICAgaWYgKHRoaXMuY291bnRlclRpbWVyID49IHRoaXMudHVybkR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0NvdW50aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5jYWxsQ291bnRlci5wcm9ncmVzcyA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdERlYWxlcjogZnVuY3Rpb24gaW5pdERlYWxlcigpIHtcbiAgICAgICAgLy8gYWN0b3JcbiAgICAgICAgdGhpcy5hY3RvciA9IHRoaXMuZ2V0Q29tcG9uZW50KCdBY3RvcicpO1xuICAgICAgICAvLyBmeFxuICAgICAgICB0aGlzLmFuaW1GWCA9IHRoaXMuYW5pbUZYLmdldENvbXBvbmVudCgnRlhQbGF5ZXInKTtcbiAgICAgICAgdGhpcy5hbmltRlguaW5pdCgpO1xuICAgICAgICB0aGlzLmFuaW1GWC5zaG93KGZhbHNlKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlVG90YWxTdGFrZTogZnVuY3Rpb24gdXBkYXRlVG90YWxTdGFrZShudW0pIHtcbiAgICAgICAgdGhpcy5sYWJlbFRvdGFsU3Rha2Uuc3RyaW5nID0gJyQnICsgbnVtO1xuICAgIH0sXG5cbiAgICBzdGFydENvdW50ZG93bjogZnVuY3Rpb24gc3RhcnRDb3VudGRvd24oKSB7XG4gICAgICAgIGlmICh0aGlzLmNhbGxDb3VudGVyKSB7XG4gICAgICAgICAgICB0aGlzLmlzQ291bnRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5jb3VudGVyVGltZXIgPSAwO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlc2V0Q291bnRkb3duOiBmdW5jdGlvbiByZXNldENvdW50ZG93bigpIHtcbiAgICAgICAgaWYgKHRoaXMuY2FsbENvdW50ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaXNDb3VudGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5jb3VudGVyVGltZXIgPSAwO1xuICAgICAgICAgICAgdGhpcy5jYWxsQ291bnRlci5wcm9ncmVzcyA9IDA7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcGxheUJsYWNrSmFja0ZYOiBmdW5jdGlvbiBwbGF5QmxhY2tKYWNrRlgoKSB7XG4gICAgICAgIHRoaXMuYW5pbUZYLnBsYXlGWCgnYmxhY2tqYWNrJyk7XG4gICAgfSxcblxuICAgIHBsYXlCdXN0Rlg6IGZ1bmN0aW9uIHBsYXlCdXN0RlgoKSB7XG4gICAgICAgIHRoaXMuYW5pbUZYLnBsYXlGWCgnYnVzdCcpO1xuICAgIH0sXG5cbiAgICBvbkRlYWw6IGZ1bmN0aW9uIG9uRGVhbChjYXJkLCBzaG93KSB7XG4gICAgICAgIHZhciBuZXdDYXJkID0gY2MuaW5zdGFudGlhdGUodGhpcy5jYXJkUHJlZmFiKS5nZXRDb21wb25lbnQoJ0NhcmQnKTtcbiAgICAgICAgdGhpcy5hbmNob3JDYXJkcy5hZGRDaGlsZChuZXdDYXJkLm5vZGUpO1xuICAgICAgICBuZXdDYXJkLmluaXQoY2FyZCk7XG4gICAgICAgIG5ld0NhcmQucmV2ZWFsKHNob3cpO1xuXG4gICAgICAgIHZhciBzdGFydFBvcyA9IGNjLnAoMCwgMCk7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuYWN0b3IuY2FyZHMubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIGVuZFBvcyA9IGNjLnAodGhpcy5jYXJkU3BhY2UgKiBpbmRleCwgMCk7XG4gICAgICAgIG5ld0NhcmQubm9kZS5zZXRQb3NpdGlvbihzdGFydFBvcyk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVBvaW50UG9zKGVuZFBvcy54KTtcblxuICAgICAgICB2YXIgbW92ZUFjdGlvbiA9IGNjLm1vdmVUbygwLjUsIGVuZFBvcyk7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGNjLmNhbGxGdW5jKHRoaXMuX29uRGVhbEVuZCwgdGhpcyk7XG4gICAgICAgIG5ld0NhcmQubm9kZS5ydW5BY3Rpb24oY2Muc2VxdWVuY2UobW92ZUFjdGlvbiwgY2FsbGJhY2spKTtcbiAgICB9LFxuXG4gICAgX29uRGVhbEVuZDogZnVuY3Rpb24gX29uRGVhbEVuZCh0YXJnZXQpIHtcbiAgICAgICAgdGhpcy5yZXNldENvdW50ZG93bigpO1xuICAgICAgICBpZiAodGhpcy5hY3Rvci5zdGF0ZSA9PT0gQWN0b3JQbGF5aW5nU3RhdGUuTm9ybWFsKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0Q291bnRkb3duKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVQb2ludCgpO1xuICAgICAgICAvLyB0aGlzLl91cGRhdGVQb2ludFBvcyhwb2ludFgpO1xuICAgIH0sXG5cbiAgICBvblJlc2V0OiBmdW5jdGlvbiBvblJlc2V0KCkge1xuICAgICAgICB0aGlzLmNhcmRJbmZvLmFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuYW5jaG9yQ2FyZHMucmVtb3ZlQWxsQ2hpbGRyZW4oKTtcblxuICAgICAgICB0aGlzLl9yZXNldENoaXBzKCk7XG4gICAgfSxcblxuICAgIG9uUmV2ZWFsSG9sZENhcmQ6IGZ1bmN0aW9uIG9uUmV2ZWFsSG9sZENhcmQoKSB7XG4gICAgICAgIHZhciBjYXJkID0gY2MuZmluZCgnY2FyZFByZWZhYicsIHRoaXMuYW5jaG9yQ2FyZHMpLmdldENvbXBvbmVudCgnQ2FyZCcpO1xuICAgICAgICBjYXJkLnJldmVhbCh0cnVlKTtcbiAgICAgICAgdGhpcy51cGRhdGVTdGF0ZSgpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVQb2ludDogZnVuY3Rpb24gdXBkYXRlUG9pbnQoKSB7XG4gICAgICAgIHRoaXMuY2FyZEluZm8uYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5sYWJlbENhcmRJbmZvLnN0cmluZyA9IHRoaXMuYWN0b3IuYmVzdFBvaW50O1xuXG4gICAgICAgIHN3aXRjaCAodGhpcy5hY3Rvci5oYW5kKSB7XG4gICAgICAgICAgICBjYXNlIFR5cGVzLkhhbmQuQmxhY2tKYWNrOlxuICAgICAgICAgICAgICAgIHRoaXMuYW5pbUZYLnNob3codHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmltRlgucGxheUZYKCdibGFja2phY2snKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgVHlwZXMuSGFuZC5GaXZlQ2FyZDpcbiAgICAgICAgICAgICAgICAvLyBUT0RPXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3VwZGF0ZVBvaW50UG9zOiBmdW5jdGlvbiBfdXBkYXRlUG9pbnRQb3MoeFBvcykge1xuICAgICAgICAvLyBjYy5sb2codGhpcy5uYW1lICsgJyBjYXJkIGluZm8gcG9zOiAnICsgeFBvcyk7XG4gICAgICAgIHRoaXMuY2FyZEluZm8uc2V0UG9zaXRpb24oeFBvcyArIDUwLCAwKTtcbiAgICB9LFxuXG4gICAgc2hvd1N0YWtlQ2hpcHM6IGZ1bmN0aW9uIHNob3dTdGFrZUNoaXBzKHN0YWtlKSB7XG4gICAgICAgIHZhciBjaGlwcyA9IHRoaXMuc3BDaGlwcztcbiAgICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgICAgaWYgKHN0YWtlID4gNTAwMDApIHtcbiAgICAgICAgICAgIGNvdW50ID0gNTtcbiAgICAgICAgfSBlbHNlIGlmIChzdGFrZSA+IDI1MDAwKSB7XG4gICAgICAgICAgICBjb3VudCA9IDQ7XG4gICAgICAgIH0gZWxzZSBpZiAoc3Rha2UgPiAxMDAwMCkge1xuICAgICAgICAgICAgY291bnQgPSAzO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YWtlID4gNTAwMCkge1xuICAgICAgICAgICAgY291bnQgPSAyO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YWtlID4gMCkge1xuICAgICAgICAgICAgY291bnQgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7ICsraSkge1xuICAgICAgICAgICAgY2hpcHNbaV0uZW5hYmxlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3Jlc2V0Q2hpcHM6IGZ1bmN0aW9uIF9yZXNldENoaXBzKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3BDaGlwcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdGhpcy5zcENoaXBzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB1cGRhdGVTdGF0ZTogZnVuY3Rpb24gdXBkYXRlU3RhdGUoKSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5hY3Rvci5zdGF0ZSkge1xuICAgICAgICAgICAgY2FzZSBBY3RvclBsYXlpbmdTdGF0ZS5Ob3JtYWw6XG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkSW5mby5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuc3BDYXJkSW5mby5zcHJpdGVGcmFtZSA9IEdhbWUuaW5zdGFuY2UuYXNzZXRNbmcudGV4Q2FyZEluZm87XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVQb2ludCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBBY3RvclBsYXlpbmdTdGF0ZS5CdXN0OlxuICAgICAgICAgICAgICAgIHZhciBtaW4gPSBVdGlscy5nZXRNaW5NYXhQb2ludCh0aGlzLmFjdG9yLmNhcmRzKS5taW47XG4gICAgICAgICAgICAgICAgdGhpcy5sYWJlbENhcmRJbmZvLnN0cmluZyA9ICfniIbniYwoJyArIG1pbiArICcpJztcbiAgICAgICAgICAgICAgICB0aGlzLnNwQ2FyZEluZm8uc3ByaXRlRnJhbWUgPSBHYW1lLmluc3RhbmNlLmFzc2V0TW5nLnRleEJ1c3Q7XG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkSW5mby5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuYW5pbUZYLnNob3codHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmltRlgucGxheUZYKCdidXN0Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldENvdW50ZG93bigpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBBY3RvclBsYXlpbmdTdGF0ZS5TdGFuZDpcbiAgICAgICAgICAgICAgICB2YXIgbWF4ID0gVXRpbHMuZ2V0TWluTWF4UG9pbnQodGhpcy5hY3Rvci5jYXJkcykubWF4O1xuICAgICAgICAgICAgICAgIHRoaXMubGFiZWxDYXJkSW5mby5zdHJpbmcgPSAn5YGc54mMKCcgKyBtYXggKyAnKSc7XG4gICAgICAgICAgICAgICAgdGhpcy5zcENhcmRJbmZvLnNwcml0ZUZyYW1lID0gR2FtZS5pbnN0YW5jZS5hc3NldE1uZy50ZXhDYXJkSW5mbztcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0Q291bnRkb3duKCk7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy51cGRhdGVQb2ludCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICc3ZDAwOGRUZjZ4QjJaMHdDQWR6aDFSeCcsICdBY3RvcicpO1xuLy8gc2NyaXB0c1xcQWN0b3IuanNcblxudmFyIFR5cGVzID0gcmVxdWlyZSgnVHlwZXMnKTtcbnZhciBVdGlscyA9IHJlcXVpcmUoJ1V0aWxzJyk7XG52YXIgQWN0b3JQbGF5aW5nU3RhdGUgPSBUeXBlcy5BY3RvclBsYXlpbmdTdGF0ZTtcblxuY2MuQ2xhc3Moe1xuICAgICdleHRlbmRzJzogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICAvLyDmiYDmnInmmI7niYxcbiAgICAgICAgY2FyZHM6IHtcbiAgICAgICAgICAgICdkZWZhdWx0JzogW10sXG4gICAgICAgICAgICBzZXJpYWxpemFibGU6IGZhbHNlLFxuICAgICAgICAgICAgdmlzaWJsZTogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgLy8g5pqX54mM77yMZGVtbyDmmoLlrZhcbiAgICAgICAgaG9sZUNhcmQ6IHtcbiAgICAgICAgICAgICdkZWZhdWx0JzogbnVsbCxcbiAgICAgICAgICAgIHNlcmlhbGl6YWJsZTogZmFsc2UsXG4gICAgICAgICAgICB2aXNpYmxlOiBmYWxzZVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIOaJi+S4iuacgOaOpei/kSAyMSDngrnnmoTngrnmlbDvvIjmnInlj6/og73otoXov4cgMjEg54K577yJXG4gICAgICAgIGJlc3RQb2ludDoge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1pbk1heCA9IFV0aWxzLmdldE1pbk1heFBvaW50KHRoaXMuY2FyZHMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBtaW5NYXgubWF4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIOeJjOWei++8jOS4jeiAg+iZkeaYr+WQpueIhueJjFxuICAgICAgICBoYW5kOiB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgICAgICB2YXIgY291bnQgPSB0aGlzLmNhcmRzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ob2xlQ2FyZCkge1xuICAgICAgICAgICAgICAgICAgICArK2NvdW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY291bnQgPj0gNSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gVHlwZXMuSGFuZC5GaXZlQ2FyZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGNvdW50ID09PSAyICYmIHRoaXMuYmVzdFBvaW50ID09PSAyMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gVHlwZXMuSGFuZC5CbGFja0phY2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBUeXBlcy5IYW5kLk5vcm1hbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBjYW5SZXBvcnQ6IHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmQgIT09IFR5cGVzLkhhbmQuTm9ybWFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZpc2libGU6IGZhbHNlXG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVuZGVyZXI6IHtcbiAgICAgICAgICAgICdkZWZhdWx0JzogbnVsbCxcbiAgICAgICAgICAgIHR5cGU6IGNjLk5vZGVcbiAgICAgICAgfSxcbiAgICAgICAgc3RhdGU6IHtcbiAgICAgICAgICAgICdkZWZhdWx0JzogQWN0b3JQbGF5aW5nU3RhdGUuTm9ybWFsLFxuICAgICAgICAgICAgbm90aWZ5OiBmdW5jdGlvbiBub3RpZnkob2xkU3RhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPT0gb2xkU3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci51cGRhdGVTdGF0ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0eXBlOiBBY3RvclBsYXlpbmdTdGF0ZSxcbiAgICAgICAgICAgIHNlcmlhbGl6YWJsZTogZmFsc2VcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbml0OiBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICB0aGlzLnJlYWR5ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZW5kZXJlciA9IHRoaXMuZ2V0Q29tcG9uZW50KCdBY3RvclJlbmRlcmVyJyk7XG4gICAgfSxcblxuICAgIGFkZENhcmQ6IGZ1bmN0aW9uIGFkZENhcmQoY2FyZCkge1xuICAgICAgICB0aGlzLmNhcmRzLnB1c2goY2FyZCk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIub25EZWFsKGNhcmQsIHRydWUpO1xuXG4gICAgICAgIHZhciBjYXJkcyA9IHRoaXMuaG9sZUNhcmQgPyBbdGhpcy5ob2xlQ2FyZF0uY29uY2F0KHRoaXMuY2FyZHMpIDogdGhpcy5jYXJkcztcbiAgICAgICAgaWYgKFV0aWxzLmlzQnVzdChjYXJkcykpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBBY3RvclBsYXlpbmdTdGF0ZS5CdXN0O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFkZEhvbGVDYXJkOiBmdW5jdGlvbiBhZGRIb2xlQ2FyZChjYXJkKSB7XG4gICAgICAgIHRoaXMuaG9sZUNhcmQgPSBjYXJkO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLm9uRGVhbChjYXJkLCBmYWxzZSk7XG4gICAgfSxcblxuICAgIHN0YW5kOiBmdW5jdGlvbiBzdGFuZCgpIHtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IEFjdG9yUGxheWluZ1N0YXRlLlN0YW5kO1xuICAgIH0sXG5cbiAgICByZXZlYWxIb2xkQ2FyZDogZnVuY3Rpb24gcmV2ZWFsSG9sZENhcmQoKSB7XG4gICAgICAgIGlmICh0aGlzLmhvbGVDYXJkKSB7XG4gICAgICAgICAgICB0aGlzLmNhcmRzLnVuc2hpZnQodGhpcy5ob2xlQ2FyZCk7XG4gICAgICAgICAgICB0aGlzLmhvbGVDYXJkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXIub25SZXZlYWxIb2xkQ2FyZCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIHJldmVhbE5vcm1hbENhcmQ6IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICB0aGlzLm9uUmV2ZWFsTm9ybWFsQ2FyZCgpO1xuICAgIC8vIH0sXG5cbiAgICByZXBvcnQ6IGZ1bmN0aW9uIHJlcG9ydCgpIHtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IEFjdG9yUGxheWluZ1N0YXRlLlJlcG9ydDtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgICB0aGlzLmNhcmRzID0gW107XG4gICAgICAgIHRoaXMuaG9sZUNhcmQgPSBudWxsO1xuICAgICAgICB0aGlzLnJlcG9ydGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBBY3RvclBsYXlpbmdTdGF0ZS5Ob3JtYWw7XG4gICAgICAgIHRoaXMucmVuZGVyZXIub25SZXNldCgpO1xuICAgIH1cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnNTQ1MjJMY29WcFBIYnJxWWd3cC8xUW0nLCAnQXNzZXRNbmcnKTtcbi8vIHNjcmlwdHNcXEFzc2V0TW5nLmpzXG5cbnZhciBBc3NldE1uZyA9IGNjLkNsYXNzKHtcbiAgICBcImV4dGVuZHNcIjogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICB0ZXhCdXN0OiBjYy5TcHJpdGVGcmFtZSxcbiAgICAgICAgdGV4Q2FyZEluZm86IGNjLlNwcml0ZUZyYW1lLFxuICAgICAgICB0ZXhDb3VudGRvd246IGNjLlNwcml0ZUZyYW1lLFxuICAgICAgICB0ZXhCZXRDb3VudGRvd246IGNjLlNwcml0ZUZyYW1lLFxuICAgICAgICBwbGF5ZXJQaG90b3M6IGNjLlNwcml0ZUZyYW1lXG4gICAgfVxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICcwMWNhNHRTdHZWSCtKbVo1VE5jbXVBdScsICdBdWRpb01uZycpO1xuLy8gc2NyaXB0c1xcQXVkaW9NbmcuanNcblxuY2MuQ2xhc3Moe1xuICAgIFwiZXh0ZW5kc1wiOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIHdpbkF1ZGlvOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH0sXG5cbiAgICAgICAgbG9zZUF1ZGlvOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FyZEF1ZGlvOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH0sXG5cbiAgICAgICAgYnV0dG9uQXVkaW86IHtcbiAgICAgICAgICAgIFwiZGVmYXVsdFwiOiBudWxsLFxuICAgICAgICAgICAgdXJsOiBjYy5BdWRpb0NsaXBcbiAgICAgICAgfSxcblxuICAgICAgICBjaGlwc0F1ZGlvOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH0sXG5cbiAgICAgICAgYmdtOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcGxheU11c2ljOiBmdW5jdGlvbiBwbGF5TXVzaWMoKSB7XG4gICAgICAgIGNjLmF1ZGlvRW5naW5lLnBsYXlNdXNpYyh0aGlzLmJnbSwgdHJ1ZSk7XG4gICAgfSxcblxuICAgIHBhdXNlTXVzaWM6IGZ1bmN0aW9uIHBhdXNlTXVzaWMoKSB7XG4gICAgICAgIGNjLmF1ZGlvRW5naW5lLnBhdXNlTXVzaWMoKTtcbiAgICB9LFxuXG4gICAgcmVzdW1lTXVzaWM6IGZ1bmN0aW9uIHJlc3VtZU11c2ljKCkge1xuICAgICAgICBjYy5hdWRpb0VuZ2luZS5yZXN1bWVNdXNpYygpO1xuICAgIH0sXG5cbiAgICBfcGxheVNGWDogZnVuY3Rpb24gX3BsYXlTRlgoY2xpcCkge1xuICAgICAgICBjYy5hdWRpb0VuZ2luZS5wbGF5RWZmZWN0KGNsaXAsIGZhbHNlKTtcbiAgICB9LFxuXG4gICAgcGxheVdpbjogZnVuY3Rpb24gcGxheVdpbigpIHtcbiAgICAgICAgdGhpcy5fcGxheVNGWCh0aGlzLndpbkF1ZGlvKTtcbiAgICB9LFxuXG4gICAgcGxheUxvc2U6IGZ1bmN0aW9uIHBsYXlMb3NlKCkge1xuICAgICAgICB0aGlzLl9wbGF5U0ZYKHRoaXMubG9zZUF1ZGlvKTtcbiAgICB9LFxuXG4gICAgcGxheUNhcmQ6IGZ1bmN0aW9uIHBsYXlDYXJkKCkge1xuICAgICAgICB0aGlzLl9wbGF5U0ZYKHRoaXMuY2FyZEF1ZGlvKTtcbiAgICB9LFxuXG4gICAgcGxheUNoaXBzOiBmdW5jdGlvbiBwbGF5Q2hpcHMoKSB7XG4gICAgICAgIHRoaXMuX3BsYXlTRlgodGhpcy5jaGlwc0F1ZGlvKTtcbiAgICB9LFxuXG4gICAgcGxheUJ1dHRvbjogZnVuY3Rpb24gcGxheUJ1dHRvbigpIHtcbiAgICAgICAgdGhpcy5fcGxheVNGWCh0aGlzLmJ1dHRvbkF1ZGlvKTtcbiAgICB9XG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzI4ZjM4eVRvVDFQdzdOZ3llQ3ZSeERDJywgJ0JldCcpO1xuLy8gc2NyaXB0c1xcQmV0LmpzXG5cbnZhciBHYW1lID0gcmVxdWlyZSgnR2FtZScpO1xuXG5jYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIGNoaXBQcmVmYWI6IGNjLlByZWZhYixcbiAgICAgICAgYnRuQ2hpcHM6IHtcbiAgICAgICAgICAgICdkZWZhdWx0JzogW10sXG4gICAgICAgICAgICB0eXBlOiBjYy5Ob2RlXG4gICAgICAgIH0sXG4gICAgICAgIGNoaXBWYWx1ZXM6IHtcbiAgICAgICAgICAgICdkZWZhdWx0JzogW10sXG4gICAgICAgICAgICB0eXBlOiAnSW50ZWdlcidcbiAgICAgICAgfSxcbiAgICAgICAgYW5jaG9yQ2hpcFRvc3M6IGNjLk5vZGVcbiAgICB9LFxuXG4gICAgLy8gdXNlIHRoaXMgZm9yIGluaXRpYWxpemF0aW9uXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgdGhpcy5fcmVnaXN0ZXJCdG5zKCk7XG4gICAgfSxcblxuICAgIF9yZWdpc3RlckJ0bnM6IGZ1bmN0aW9uIF9yZWdpc3RlckJ0bnMoKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHJlZ2lzdGVyQnRuID0gZnVuY3Rpb24gcmVnaXN0ZXJCdG4oaW5kZXgpIHtcbiAgICAgICAgICAgIHNlbGYuYnRuQ2hpcHNbaV0ub24oJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoR2FtZS5pbnN0YW5jZS5hZGRTdGFrZShzZWxmLmNoaXBWYWx1ZXNbaW5kZXhdKSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnBsYXlBZGRDaGlwKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH07XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5idG5DaGlwcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgcmVnaXN0ZXJCdG4oaSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcGxheUFkZENoaXA6IGZ1bmN0aW9uIHBsYXlBZGRDaGlwKCkge1xuICAgICAgICB2YXIgc3RhcnRQb3MgPSBjYy5wKGNjLnJhbmRvbU1pbnVzMVRvMSgpICogNTAsIGNjLnJhbmRvbU1pbnVzMVRvMSgpICogNTApO1xuICAgICAgICB2YXIgY2hpcCA9IGNjLmluc3RhbnRpYXRlKHRoaXMuY2hpcFByZWZhYik7XG4gICAgICAgIHRoaXMuYW5jaG9yQ2hpcFRvc3MuYWRkQ2hpbGQoY2hpcCk7XG4gICAgICAgIGNoaXAuc2V0UG9zaXRpb24oc3RhcnRQb3MpO1xuICAgICAgICBjaGlwLmdldENvbXBvbmVudCgnVG9zc0NoaXAnKS5wbGF5KCk7XG4gICAgfSxcblxuICAgIHJlc2V0Q2hpcHM6IGZ1bmN0aW9uIHJlc2V0Q2hpcHMoKSB7XG4gICAgICAgIEdhbWUuaW5zdGFuY2UucmVzZXRTdGFrZSgpO1xuICAgICAgICBHYW1lLmluc3RhbmNlLmluZm8uZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlc2V0VG9zc2VkQ2hpcHMoKTtcbiAgICB9LFxuXG4gICAgcmVzZXRUb3NzZWRDaGlwczogZnVuY3Rpb24gcmVzZXRUb3NzZWRDaGlwcygpIHtcbiAgICAgICAgdGhpcy5hbmNob3JDaGlwVG9zcy5yZW1vdmVBbGxDaGlsZHJlbigpO1xuICAgIH1cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnYTE3MWRTbkNYRk1SSXFzMUlXZHZnV00nLCAnQnV0dG9uU2NhbGVyJyk7XG4vLyBzY3JpcHRzXFxVSVxcQnV0dG9uU2NhbGVyLmpzXG5cbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgcHJlc3NlZFNjYWxlOiAxLFxuICAgICAgICB0cmFuc0R1cmF0aW9uOiAwXG4gICAgfSxcblxuICAgIC8vIHVzZSB0aGlzIGZvciBpbml0aWFsaXphdGlvblxuICAgIG9uTG9hZDogZnVuY3Rpb24gb25Mb2FkKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBhdWRpb01uZyA9IGNjLmZpbmQoJ01lbnUvQXVkaW9NbmcnKSB8fCBjYy5maW5kKCdHYW1lL0F1ZGlvTW5nJyk7XG4gICAgICAgIGlmIChhdWRpb01uZykge1xuICAgICAgICAgICAgYXVkaW9NbmcgPSBhdWRpb01uZy5nZXRDb21wb25lbnQoJ0F1ZGlvTW5nJyk7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi5pbml0U2NhbGUgPSB0aGlzLm5vZGUuc2NhbGU7XG4gICAgICAgIHNlbGYuYnV0dG9uID0gc2VsZi5nZXRDb21wb25lbnQoY2MuQnV0dG9uKTtcbiAgICAgICAgc2VsZi5zY2FsZURvd25BY3Rpb24gPSBjYy5zY2FsZVRvKHNlbGYudHJhbnNEdXJhdGlvbiwgc2VsZi5wcmVzc2VkU2NhbGUpO1xuICAgICAgICBzZWxmLnNjYWxlVXBBY3Rpb24gPSBjYy5zY2FsZVRvKHNlbGYudHJhbnNEdXJhdGlvbiwgc2VsZi5pbml0U2NhbGUpO1xuICAgICAgICBmdW5jdGlvbiBvblRvdWNoRG93bihldmVudCkge1xuICAgICAgICAgICAgdGhpcy5zdG9wQWxsQWN0aW9ucygpO1xuICAgICAgICAgICAgaWYgKGF1ZGlvTW5nKSBhdWRpb01uZy5wbGF5QnV0dG9uKCk7XG4gICAgICAgICAgICB0aGlzLnJ1bkFjdGlvbihzZWxmLnNjYWxlRG93bkFjdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25Ub3VjaFVwKGV2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLnN0b3BBbGxBY3Rpb25zKCk7XG4gICAgICAgICAgICB0aGlzLnJ1bkFjdGlvbihzZWxmLnNjYWxlVXBBY3Rpb24pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubm9kZS5vbigndG91Y2hzdGFydCcsIG9uVG91Y2hEb3duLCB0aGlzLm5vZGUpO1xuICAgICAgICB0aGlzLm5vZGUub24oJ3RvdWNoZW5kJywgb25Ub3VjaFVwLCB0aGlzLm5vZGUpO1xuICAgICAgICB0aGlzLm5vZGUub24oJ3RvdWNoY2FuY2VsJywgb25Ub3VjaFVwLCB0aGlzLm5vZGUpO1xuICAgIH1cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnYWI2N2U1UWtpVkNCWjNESU1sV2hpQXQnLCAnQ2FyZCcpO1xuLy8gc2NyaXB0c1xcQ2FyZC5qc1xuXG5jYy5DbGFzcyh7XG4gICAgXCJleHRlbmRzXCI6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgLy8gbm9kZXNcbiAgICAgICAgcG9pbnQ6IGNjLkxhYmVsLFxuICAgICAgICBzdWl0OiBjYy5TcHJpdGUsXG4gICAgICAgIG1haW5QaWM6IGNjLlNwcml0ZSxcbiAgICAgICAgY2FyZEJHOiBjYy5TcHJpdGUsXG4gICAgICAgIC8vIHJlc291cmNlc1xuICAgICAgICByZWRUZXh0Q29sb3I6IGNjLkNvbG9yLldISVRFLFxuICAgICAgICBibGFja1RleHRDb2xvcjogY2MuQ29sb3IuV0hJVEUsXG4gICAgICAgIHRleEZyb250Qkc6IGNjLlNwcml0ZUZyYW1lLFxuICAgICAgICB0ZXhCYWNrQkc6IGNjLlNwcml0ZUZyYW1lLFxuICAgICAgICB0ZXhGYWNlczoge1xuICAgICAgICAgICAgXCJkZWZhdWx0XCI6IFtdLFxuICAgICAgICAgICAgdHlwZTogY2MuU3ByaXRlRnJhbWVcbiAgICAgICAgfSxcbiAgICAgICAgdGV4U3VpdEJpZzoge1xuICAgICAgICAgICAgXCJkZWZhdWx0XCI6IFtdLFxuICAgICAgICAgICAgdHlwZTogY2MuU3ByaXRlRnJhbWVcbiAgICAgICAgfSxcbiAgICAgICAgdGV4U3VpdFNtYWxsOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogW10sXG4gICAgICAgICAgICB0eXBlOiBjYy5TcHJpdGVGcmFtZVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIHVzZSB0aGlzIGZvciBpbml0aWFsaXphdGlvblxuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQoY2FyZCkge1xuICAgICAgICB2YXIgaXNGYWNlQ2FyZCA9IGNhcmQucG9pbnQgPiAxMDtcblxuICAgICAgICBpZiAoaXNGYWNlQ2FyZCkge1xuICAgICAgICAgICAgdGhpcy5tYWluUGljLnNwcml0ZUZyYW1lID0gdGhpcy50ZXhGYWNlc1tjYXJkLnBvaW50IC0gMTAgLSAxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubWFpblBpYy5zcHJpdGVGcmFtZSA9IHRoaXMudGV4U3VpdEJpZ1tjYXJkLnN1aXQgLSAxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZvciBqc2JcbiAgICAgICAgdGhpcy5wb2ludC5zdHJpbmcgPSBjYXJkLnBvaW50TmFtZTtcblxuICAgICAgICBpZiAoY2FyZC5pc1JlZFN1aXQpIHtcbiAgICAgICAgICAgIHRoaXMucG9pbnQubm9kZS5jb2xvciA9IHRoaXMucmVkVGV4dENvbG9yO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wb2ludC5ub2RlLmNvbG9yID0gdGhpcy5ibGFja1RleHRDb2xvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3VpdC5zcHJpdGVGcmFtZSA9IHRoaXMudGV4U3VpdFNtYWxsW2NhcmQuc3VpdCAtIDFdO1xuICAgIH0sXG5cbiAgICByZXZlYWw6IGZ1bmN0aW9uIHJldmVhbChpc0ZhY2VVcCkge1xuICAgICAgICB0aGlzLnBvaW50Lm5vZGUuYWN0aXZlID0gaXNGYWNlVXA7XG4gICAgICAgIHRoaXMuc3VpdC5ub2RlLmFjdGl2ZSA9IGlzRmFjZVVwO1xuICAgICAgICB0aGlzLm1haW5QaWMubm9kZS5hY3RpdmUgPSBpc0ZhY2VVcDtcbiAgICAgICAgdGhpcy5jYXJkQkcuc3ByaXRlRnJhbWUgPSBpc0ZhY2VVcCA/IHRoaXMudGV4RnJvbnRCRyA6IHRoaXMudGV4QmFja0JHO1xuICAgIH1cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnY2UyZGZvcUV1bEhDTGpTMVo5eFBON3QnLCAnRGVhbGVyJyk7XG4vLyBzY3JpcHRzXFxEZWFsZXIuanNcblxudmFyIEFjdG9yID0gcmVxdWlyZSgnQWN0b3InKTtcbnZhciBVdGlscyA9IHJlcXVpcmUoJ1V0aWxzJyk7XG5cbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IEFjdG9yLFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICAvLyDmiYvkuIrmnIDmjqXov5EgMjEg54K555qE54K55pWw77yI5pyJ5Y+v6IO96LaF6L+HIDIxIOeCue+8iVxuICAgICAgICBiZXN0UG9pbnQ6IHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgICAgIHZhciBjYXJkcyA9IHRoaXMuaG9sZUNhcmQgPyBbdGhpcy5ob2xlQ2FyZF0uY29uY2F0KHRoaXMuY2FyZHMpIDogdGhpcy5jYXJkcztcbiAgICAgICAgICAgICAgICB2YXIgbWluTWF4ID0gVXRpbHMuZ2V0TWluTWF4UG9pbnQoY2FyZHMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBtaW5NYXgubWF4O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgdGhpcy5fc3VwZXIoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5pbml0RGVhbGVyKCk7XG4gICAgfSxcblxuICAgIC8vIOi/lOWbnuaYr+WQpuimgeeJjFxuICAgIHdhbnRIaXQ6IGZ1bmN0aW9uIHdhbnRIaXQoKSB7XG4gICAgICAgIHZhciBHYW1lID0gcmVxdWlyZSgnR2FtZScpO1xuICAgICAgICB2YXIgVHlwZXMgPSByZXF1aXJlKCdUeXBlcycpO1xuXG4gICAgICAgIHZhciBiZXN0UG9pbnQgPSB0aGlzLmJlc3RQb2ludDtcblxuICAgICAgICAvLyDlt7Lnu4/mnIDlpKfngrnmlbBcbiAgICAgICAgaWYgKGJlc3RQb2ludCA9PT0gMjEpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS4jeiuuuaKveWIsOS7gOS5iOeJjOiCr+WumuS4jeS8mueIhu+8jOmCo+WwseaOpeedgOaKvVxuICAgICAgICBpZiAoYmVzdFBvaW50IDw9IDIxIC0gMTApIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBsYXllciA9IEdhbWUuaW5zdGFuY2UucGxheWVyO1xuICAgICAgICB2YXIgb3V0Y29tZSA9IEdhbWUuaW5zdGFuY2UuX2dldFBsYXllclJlc3VsdChwbGF5ZXIsIHRoaXMpO1xuXG4gICAgICAgIHN3aXRjaCAob3V0Y29tZSkge1xuICAgICAgICAgICAgY2FzZSBUeXBlcy5PdXRjb21lLldpbjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIGNhc2UgVHlwZXMuT3V0Y29tZS5Mb3NlOlxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmJlc3RQb2ludCA8IDE3O1xuICAgIH1cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnMTcwMjRHMEpGcEhjTEk1R1JFYkY4Vk4nLCAnRGVja3MnKTtcbi8vIHNjcmlwdHNcXG1vZHVsZVxcRGVja3MuanNcblxudmFyIFR5cGVzID0gcmVxdWlyZSgnVHlwZXMnKTtcblxuLyoqXHJcbiAqIOaJkeWFi+euoeeQhuexu++8jOeUqOadpeeuoeeQhuS4gOWJr+aIluWkmuWJr+eJjFxyXG4gKiBAY2xhc3MgRGVja3NcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1iZXJPZkRlY2tzIC0g5oC75YWx5Yeg5Ymv54mMXHJcbiAqL1xuZnVuY3Rpb24gRGVja3MobnVtYmVyT2ZEZWNrcykge1xuICAgIC8vIOaAu+WFseWHoOWJr+eJjFxuICAgIHRoaXMuX251bWJlck9mRGVja3MgPSBudW1iZXJPZkRlY2tzO1xuICAgIC8vIOi/mOayoeWPkeWHuuWOu+eahOeJjFxuICAgIHRoaXMuX2NhcmRJZHMgPSBuZXcgQXJyYXkobnVtYmVyT2ZEZWNrcyAqIDUyKTtcblxuICAgIHRoaXMucmVzZXQoKTtcbn1cblxuLyoqXHJcbiAqIOmHjee9ruaJgOacieeJjFxyXG4gKiBAbWV0aG9kIHJlc2V0XHJcbiAqL1xuRGVja3MucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2NhcmRJZHMubGVuZ3RoID0gdGhpcy5fbnVtYmVyT2ZEZWNrcyAqIDUyO1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIGZyb21JZCA9IFR5cGVzLkNhcmQuZnJvbUlkO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fbnVtYmVyT2ZEZWNrczsgKytpKSB7XG4gICAgICAgIGZvciAodmFyIGNhcmRJZCA9IDA7IGNhcmRJZCA8IDUyOyArK2NhcmRJZCkge1xuICAgICAgICAgICAgdGhpcy5fY2FyZElkc1tpbmRleF0gPSBmcm9tSWQoY2FyZElkKTtcbiAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcclxuICog6ZqP5py65oq95LiA5byg54mM77yM5aaC5p6c5bey57uP5rKh54mM5LqG77yM5bCG6L+U5ZueIG51bGxcclxuICogQG1ldGhvZCBkcmF3XHJcbiAqIEByZXR1cm4ge0NhcmR9XHJcbiAqL1xuRGVja3MucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhcmRJZHMgPSB0aGlzLl9jYXJkSWRzO1xuICAgIHZhciBsZW4gPSBjYXJkSWRzLmxlbmd0aDtcbiAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciByYW5kb20gPSBNYXRoLnJhbmRvbSgpO1xuICAgIHZhciBpbmRleCA9IHJhbmRvbSAqIGxlbiB8IDA7XG4gICAgdmFyIHJlc3VsdCA9IGNhcmRJZHNbaW5kZXhdO1xuXG4gICAgLy8g5L+d5oyB5pWw57uE57Sn5YeRXG4gICAgdmFyIGxhc3QgPSBjYXJkSWRzW2xlbiAtIDFdO1xuICAgIGNhcmRJZHNbaW5kZXhdID0gbGFzdDtcbiAgICBjYXJkSWRzLmxlbmd0aCA9IGxlbiAtIDE7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuLy8vKipcbi8vICog5Y+R5LiA5byg54mMXG4vLyAqIEBtZXRob2QgZGVhbFxuLy8gKiBAcmV0dXJuIHtDYXJkfVxuLy8gKi9cbi8vRGVja3MucHJvdG90eXBlLmRlYWwgPSBmdW5jdGlvbiAoKSB7XG4vLyAgICB0aGlzLl9jYXJkSWRzLnBvcCgpO1xuLy99O1xuXG4vLy8qKlxuLy8gKiDmtJfniYxcbi8vICogQG1ldGhvZCBzaHVmZmxlXG4vLyAqL1xuLy9EZWNrcy5wcm90b3R5cGUuc2h1ZmZsZSA9IGZ1bmN0aW9uICgpIHtcbi8vICAgIHNodWZmbGVBcnJheSh0aGlzLl9jYXJkSWRzKTtcbi8vfTtcbi8vXG4vLy8qKlxuLy8gKiBSYW5kb21pemUgYXJyYXkgZWxlbWVudCBvcmRlciBpbi1wbGFjZS5cbi8vICogVXNpbmcgRHVyc3RlbmZlbGQgc2h1ZmZsZSBhbGdvcml0aG0uXG4vLyAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEyNjQ2ODY0XG4vLyAqL1xuLy9mdW5jdGlvbiBzaHVmZmxlQXJyYXkoYXJyYXkpIHtcbi8vICAgIGZvciAodmFyIGkgPSBhcnJheS5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4vLyAgICAgICAgdmFyIGogPSAoTWF0aC5yYW5kb20oKSAqIChpICsgMSkpIHwgMDtcbi8vICAgICAgICB2YXIgdGVtcCA9IGFycmF5W2ldO1xuLy8gICAgICAgIGFycmF5W2ldID0gYXJyYXlbal07XG4vLyAgICAgICAgYXJyYXlbal0gPSB0ZW1wO1xuLy8gICAgfVxuLy8gICAgcmV0dXJuIGFycmF5O1xuLy99XG5cbm1vZHVsZS5leHBvcnRzID0gRGVja3M7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICc2OGRhMnlqZEdWTVNZaFhMTjlEdWtJQicsICdGWFBsYXllcicpO1xuLy8gc2NyaXB0c1xcRlhQbGF5ZXIuanNcblxuY2MuQ2xhc3Moe1xuICAgIFwiZXh0ZW5kc1wiOiBjYy5Db21wb25lbnQsXG5cbiAgICAvLyB1c2UgdGhpcyBmb3IgaW5pdGlhbGl6YXRpb25cbiAgICBpbml0OiBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICB0aGlzLmFuaW0gPSB0aGlzLmdldENvbXBvbmVudChjYy5BbmltYXRpb24pO1xuICAgICAgICB0aGlzLnNwcml0ZSA9IHRoaXMuZ2V0Q29tcG9uZW50KGNjLlNwcml0ZSk7XG4gICAgfSxcblxuICAgIHNob3c6IGZ1bmN0aW9uIHNob3coX3Nob3cpIHtcbiAgICAgICAgdGhpcy5zcHJpdGUuZW5hYmxlZCA9IF9zaG93O1xuICAgIH0sXG5cbiAgICBwbGF5Rlg6IGZ1bmN0aW9uIHBsYXlGWChuYW1lKSB7XG4gICAgICAgIC8vIG5hbWUgY2FuIGJlICdibGFja2phY2snIG9yICdidXN0J1xuICAgICAgICB0aGlzLmFuaW0uc3RvcCgpO1xuICAgICAgICB0aGlzLmFuaW0ucGxheShuYW1lKTtcbiAgICB9LFxuXG4gICAgaGlkZUZYOiBmdW5jdGlvbiBoaWRlRlgoKSB7XG4gICAgICAgIHRoaXMuc3ByaXRlLmVuYWJsZWQgPSBmYWxzZTtcbiAgICB9XG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzYzNzM4T09OQ0ZLSHFzZjRRU2VKU3VuJywgJ0dhbWUnKTtcbi8vIHNjcmlwdHNcXEdhbWUuanNcblxudmFyIHBsYXllcnMgPSByZXF1aXJlKCdQbGF5ZXJEYXRhJykucGxheWVycztcbnZhciBEZWNrcyA9IHJlcXVpcmUoJ0RlY2tzJyk7XG52YXIgVHlwZXMgPSByZXF1aXJlKCdUeXBlcycpO1xudmFyIEFjdG9yUGxheWluZ1N0YXRlID0gVHlwZXMuQWN0b3JQbGF5aW5nU3RhdGU7XG52YXIgRnNtID0gcmVxdWlyZSgnZ2FtZS1mc20nKTtcblxudmFyIEdhbWUgPSBjYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIHBsYXllckFuY2hvcnM6IHtcbiAgICAgICAgICAgICdkZWZhdWx0JzogW10sXG4gICAgICAgICAgICB0eXBlOiBjYy5Ob2RlXG4gICAgICAgIH0sXG4gICAgICAgIHBsYXllclByZWZhYjogY2MuUHJlZmFiLFxuICAgICAgICBkZWFsZXI6IGNjLk5vZGUsXG4gICAgICAgIGluR2FtZVVJOiBjYy5Ob2RlLFxuICAgICAgICBiZXRVSTogY2MuTm9kZSxcbiAgICAgICAgYXNzZXRNbmc6IGNjLk5vZGUsXG4gICAgICAgIGF1ZGlvTW5nOiBjYy5Ob2RlLFxuICAgICAgICB0dXJuRHVyYXRpb246IDAsXG4gICAgICAgIGJldER1cmF0aW9uOiAwLFxuICAgICAgICB0b3RhbENoaXBzTnVtOiAwLFxuICAgICAgICB0b3RhbERpYW1vbmROdW06IDAsXG4gICAgICAgIG51bWJlck9mRGVja3M6IHtcbiAgICAgICAgICAgICdkZWZhdWx0JzogMSxcbiAgICAgICAgICAgIHR5cGU6ICdJbnRlZ2VyJ1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHN0YXRpY3M6IHtcbiAgICAgICAgaW5zdGFuY2U6IG51bGxcbiAgICB9LFxuXG4gICAgLy8gdXNlIHRoaXMgZm9yIGluaXRpYWxpemF0aW9uXG4gICAgb25Mb2FkOiBmdW5jdGlvbiBvbkxvYWQoKSB7XG4gICAgICAgIEdhbWUuaW5zdGFuY2UgPSB0aGlzO1xuICAgICAgICB0aGlzLmluR2FtZVVJID0gdGhpcy5pbkdhbWVVSS5nZXRDb21wb25lbnQoJ0luR2FtZVVJJyk7XG4gICAgICAgIHRoaXMuYXNzZXRNbmcgPSB0aGlzLmFzc2V0TW5nLmdldENvbXBvbmVudCgnQXNzZXRNbmcnKTtcbiAgICAgICAgdGhpcy5hdWRpb01uZyA9IHRoaXMuYXVkaW9NbmcuZ2V0Q29tcG9uZW50KCdBdWRpb01uZycpO1xuICAgICAgICB0aGlzLmJldFVJID0gdGhpcy5iZXRVSS5nZXRDb21wb25lbnQoJ0JldCcpO1xuICAgICAgICB0aGlzLmluR2FtZVVJLmluaXQodGhpcy5iZXREdXJhdGlvbik7XG4gICAgICAgIHRoaXMuYmV0VUkuaW5pdCgpO1xuICAgICAgICB0aGlzLmRlYWxlciA9IHRoaXMuZGVhbGVyLmdldENvbXBvbmVudCgnRGVhbGVyJyk7XG4gICAgICAgIHRoaXMuZGVhbGVyLmluaXQoKTtcblxuICAgICAgICAvL1xuICAgICAgICB0aGlzLnBsYXllciA9IG51bGw7XG4gICAgICAgIHRoaXMuY3JlYXRlUGxheWVycygpO1xuXG4gICAgICAgIC8vIHNob3J0Y3V0IHRvIHVpIGVsZW1lbnRcbiAgICAgICAgdGhpcy5pbmZvID0gdGhpcy5pbkdhbWVVSS5yZXN1bHRUeHQ7XG4gICAgICAgIHRoaXMudG90YWxDaGlwcyA9IHRoaXMuaW5HYW1lVUkubGFiZWxUb3RhbENoaXBzO1xuXG4gICAgICAgIC8vIGluaXQgbG9naWNcbiAgICAgICAgdGhpcy5kZWNrcyA9IG5ldyBEZWNrcyh0aGlzLm51bWJlck9mRGVja3MpO1xuICAgICAgICB0aGlzLmZzbSA9IEZzbTtcbiAgICAgICAgdGhpcy5mc20uaW5pdCh0aGlzKTtcblxuICAgICAgICAvLyBzdGFydFxuICAgICAgICB0aGlzLnVwZGF0ZVRvdGFsQ2hpcHMoKTtcblxuICAgICAgICB0aGlzLmF1ZGlvTW5nLnBsYXlNdXNpYygpO1xuICAgIH0sXG5cbiAgICBhZGRTdGFrZTogZnVuY3Rpb24gYWRkU3Rha2UoZGVsdGEpIHtcbiAgICAgICAgaWYgKHRoaXMudG90YWxDaGlwc051bSA8IGRlbHRhKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnbm90IGVub3VnaCBjaGlwcyEnKTtcbiAgICAgICAgICAgIHRoaXMuaW5mby5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaW5mby5zdHJpbmcgPSAn6YeR5biB5LiN6LazISc7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRvdGFsQ2hpcHNOdW0gLT0gZGVsdGE7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVRvdGFsQ2hpcHMoKTtcbiAgICAgICAgICAgIHRoaXMucGxheWVyLmFkZFN0YWtlKGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuYXVkaW9NbmcucGxheUNoaXBzKCk7XG4gICAgICAgICAgICB0aGlzLmluZm8uZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5pbmZvLnN0cmluZyA9ICfor7fkuIvms6gnO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzZXRTdGFrZTogZnVuY3Rpb24gcmVzZXRTdGFrZSgpIHtcbiAgICAgICAgdGhpcy50b3RhbENoaXBzTnVtICs9IHRoaXMucGxheWVyLnN0YWtlTnVtO1xuICAgICAgICB0aGlzLnBsYXllci5yZXNldFN0YWtlKCk7XG4gICAgICAgIHRoaXMudXBkYXRlVG90YWxDaGlwcygpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVUb3RhbENoaXBzOiBmdW5jdGlvbiB1cGRhdGVUb3RhbENoaXBzKCkge1xuICAgICAgICB0aGlzLnRvdGFsQ2hpcHMuc3RyaW5nID0gdGhpcy50b3RhbENoaXBzTnVtO1xuICAgICAgICB0aGlzLnBsYXllci5yZW5kZXJlci51cGRhdGVUb3RhbFN0YWtlKHRoaXMudG90YWxDaGlwc051bSk7XG4gICAgfSxcblxuICAgIGNyZWF0ZVBsYXllcnM6IGZ1bmN0aW9uIGNyZWF0ZVBsYXllcnMoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNTsgKytpKSB7XG4gICAgICAgICAgICB2YXIgcGxheWVyTm9kZSA9IGNjLmluc3RhbnRpYXRlKHRoaXMucGxheWVyUHJlZmFiKTtcbiAgICAgICAgICAgIHZhciBhbmNob3IgPSB0aGlzLnBsYXllckFuY2hvcnNbaV07XG4gICAgICAgICAgICB2YXIgc3dpdGNoU2lkZSA9IGkgPiAyO1xuICAgICAgICAgICAgYW5jaG9yLmFkZENoaWxkKHBsYXllck5vZGUpO1xuICAgICAgICAgICAgcGxheWVyTm9kZS5wb3NpdGlvbiA9IGNjLnAoMCwgMCk7XG5cbiAgICAgICAgICAgIHZhciBwbGF5ZXJJbmZvUG9zID0gY2MuZmluZCgnYW5jaG9yUGxheWVySW5mbycsIGFuY2hvcikuZ2V0UG9zaXRpb24oKTtcbiAgICAgICAgICAgIHZhciBzdGFrZVBvcyA9IGNjLmZpbmQoJ2FuY2hvclN0YWtlJywgYW5jaG9yKS5nZXRQb3NpdGlvbigpO1xuICAgICAgICAgICAgdmFyIGFjdG9yUmVuZGVyZXIgPSBwbGF5ZXJOb2RlLmdldENvbXBvbmVudCgnQWN0b3JSZW5kZXJlcicpO1xuICAgICAgICAgICAgYWN0b3JSZW5kZXJlci5pbml0KHBsYXllcnNbaV0sIHBsYXllckluZm9Qb3MsIHN0YWtlUG9zLCB0aGlzLnR1cm5EdXJhdGlvbiwgc3dpdGNoU2lkZSk7XG4gICAgICAgICAgICBpZiAoaSA9PT0gMikge1xuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyID0gcGxheWVyTm9kZS5nZXRDb21wb25lbnQoJ1BsYXllcicpO1xuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyLmluaXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBVSSBFVkVOVCBDQUxMQkFDS1NcblxuICAgIC8vIOeOqeWutuimgeeJjFxuICAgIGhpdDogZnVuY3Rpb24gaGl0KCkge1xuICAgICAgICB0aGlzLnBsYXllci5hZGRDYXJkKHRoaXMuZGVja3MuZHJhdygpKTtcbiAgICAgICAgaWYgKHRoaXMucGxheWVyLnN0YXRlID09PSBBY3RvclBsYXlpbmdTdGF0ZS5CdXN0KSB7XG4gICAgICAgICAgICAvLyBpZiBldmVyeSBwbGF5ZXIgZW5kXG4gICAgICAgICAgICB0aGlzLmZzbS5vblBsYXllckFjdGVkKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmF1ZGlvTW5nLnBsYXlDYXJkKCk7XG5cbiAgICAgICAgLy9pZiAodGhpcy5kZWFsZXIuc3RhdGUgPT09IEFjdG9yUGxheWluZ1N0YXRlLk5vcm1hbCkge1xuICAgICAgICAvLyAgICBpZiAodGhpcy5kZWFsZXIud2FudEhpdCgpKSB7XG4gICAgICAgIC8vICAgICAgICB0aGlzLmRlYWxlci5hZGRDYXJkKHRoaXMuZGVja3MuZHJhdygpKTtcbiAgICAgICAgLy8gICAgfVxuICAgICAgICAvLyAgICBlbHNlIHtcbiAgICAgICAgLy8gICAgICAgIHRoaXMuZGVhbGVyLnN0YW5kKCk7XG4gICAgICAgIC8vICAgIH1cbiAgICAgICAgLy99XG4gICAgICAgIC8vXG4gICAgICAgIC8vaWYgKHRoaXMuZGVhbGVyLnN0YXRlID09PSBBY3RvclBsYXlpbmdTdGF0ZS5CdXN0KSB7XG4gICAgICAgIC8vICAgIHRoaXMuc3RhdGUgPSBHYW1pbmdTdGF0ZS5FbmQ7XG4gICAgICAgIC8vfVxuICAgICAgICB0aGlzLmF1ZGlvTW5nLnBsYXlCdXR0b24oKTtcbiAgICB9LFxuXG4gICAgLy8g546p5a625YGc54mMXG4gICAgc3RhbmQ6IGZ1bmN0aW9uIHN0YW5kKCkge1xuICAgICAgICB0aGlzLnBsYXllci5zdGFuZCgpO1xuXG4gICAgICAgIHRoaXMuYXVkaW9NbmcucGxheUJ1dHRvbigpO1xuXG4gICAgICAgIC8vIGlmIGV2ZXJ5IHBsYXllciBlbmRcbiAgICAgICAgdGhpcy5mc20ub25QbGF5ZXJBY3RlZCgpO1xuICAgIH0sXG5cbiAgICAvL1xuICAgIGRlYWw6IGZ1bmN0aW9uIGRlYWwoKSB7XG4gICAgICAgIHRoaXMuZnNtLnRvRGVhbCgpO1xuICAgICAgICB0aGlzLmF1ZGlvTW5nLnBsYXlCdXR0b24oKTtcbiAgICB9LFxuXG4gICAgLy9cbiAgICBzdGFydDogZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgIHRoaXMuZnNtLnRvQmV0KCk7XG4gICAgICAgIHRoaXMuYXVkaW9NbmcucGxheUJ1dHRvbigpO1xuICAgIH0sXG5cbiAgICAvLyDnjqnlrrbmiqXliLBcbiAgICByZXBvcnQ6IGZ1bmN0aW9uIHJlcG9ydCgpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXIucmVwb3J0KCk7XG5cbiAgICAgICAgLy8gaWYgZXZlcnkgcGxheWVyIGVuZFxuICAgICAgICB0aGlzLmZzbS5vblBsYXllckFjdGVkKCk7XG4gICAgfSxcblxuICAgIHF1aXRUb01lbnU6IGZ1bmN0aW9uIHF1aXRUb01lbnUoKSB7XG4gICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZSgnbWVudScpO1xuICAgIH0sXG5cbiAgICAvLyBGU00gQ0FMTEJBQ0tTXG5cbiAgICBvbkVudGVyRGVhbFN0YXRlOiBmdW5jdGlvbiBvbkVudGVyRGVhbFN0YXRlKCkge1xuICAgICAgICB0aGlzLmJldFVJLnJlc2V0VG9zc2VkQ2hpcHMoKTtcbiAgICAgICAgdGhpcy5pbkdhbWVVSS5yZXNldENvdW50ZG93bigpO1xuICAgICAgICB0aGlzLnBsYXllci5yZW5kZXJlci5zaG93U3Rha2VDaGlwcyh0aGlzLnBsYXllci5zdGFrZU51bSk7XG4gICAgICAgIHRoaXMucGxheWVyLmFkZENhcmQodGhpcy5kZWNrcy5kcmF3KCkpO1xuICAgICAgICB2YXIgaG9sZENhcmQgPSB0aGlzLmRlY2tzLmRyYXcoKTtcbiAgICAgICAgdGhpcy5kZWFsZXIuYWRkSG9sZUNhcmQoaG9sZENhcmQpO1xuICAgICAgICB0aGlzLnBsYXllci5hZGRDYXJkKHRoaXMuZGVja3MuZHJhdygpKTtcbiAgICAgICAgdGhpcy5kZWFsZXIuYWRkQ2FyZCh0aGlzLmRlY2tzLmRyYXcoKSk7XG4gICAgICAgIHRoaXMuYXVkaW9NbmcucGxheUNhcmQoKTtcbiAgICAgICAgdGhpcy5mc20ub25EZWFsZWQoKTtcbiAgICB9LFxuXG4gICAgb25QbGF5ZXJzVHVyblN0YXRlOiBmdW5jdGlvbiBvblBsYXllcnNUdXJuU3RhdGUoZW50ZXIpIHtcbiAgICAgICAgaWYgKGVudGVyKSB7XG4gICAgICAgICAgICB0aGlzLmluR2FtZVVJLnNob3dHYW1lU3RhdGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkVudGVyRGVhbGVyc1R1cm5TdGF0ZTogZnVuY3Rpb24gb25FbnRlckRlYWxlcnNUdXJuU3RhdGUoKSB7XG4gICAgICAgIHdoaWxlICh0aGlzLmRlYWxlci5zdGF0ZSA9PT0gQWN0b3JQbGF5aW5nU3RhdGUuTm9ybWFsKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kZWFsZXIud2FudEhpdCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZWFsZXIuYWRkQ2FyZCh0aGlzLmRlY2tzLmRyYXcoKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVhbGVyLnN0YW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mc20ub25EZWFsZXJBY3RlZCgpO1xuICAgIH0sXG5cbiAgICAvLyDnu5PnrpdcbiAgICBvbkVuZFN0YXRlOiBmdW5jdGlvbiBvbkVuZFN0YXRlKGVudGVyKSB7XG4gICAgICAgIGlmIChlbnRlcikge1xuICAgICAgICAgICAgdGhpcy5kZWFsZXIucmV2ZWFsSG9sZENhcmQoKTtcbiAgICAgICAgICAgIHRoaXMuaW5HYW1lVUkuc2hvd1Jlc3VsdFN0YXRlKCk7XG5cbiAgICAgICAgICAgIHZhciBvdXRjb21lID0gdGhpcy5fZ2V0UGxheWVyUmVzdWx0KHRoaXMucGxheWVyLCB0aGlzLmRlYWxlcik7XG4gICAgICAgICAgICBzd2l0Y2ggKG91dGNvbWUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFR5cGVzLk91dGNvbWUuV2luOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluZm8uc3RyaW5nID0gJ1lvdSBXaW4nO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmF1ZGlvTW5nLnBhdXNlTXVzaWMoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hdWRpb01uZy5wbGF5V2luKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOaLv+WbnuWOn+WFiOiHquW3seeahOetueeggVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvdGFsQ2hpcHNOdW0gKz0gdGhpcy5wbGF5ZXIuc3Rha2VOdW07XG4gICAgICAgICAgICAgICAgICAgIC8vIOWlluWKseetueeggVxuICAgICAgICAgICAgICAgICAgICB2YXIgd2luQ2hpcHNOdW0gPSB0aGlzLnBsYXllci5zdGFrZU51bTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnBsYXllci5zdGF0ZSA9PT0gVHlwZXMuQWN0b3JQbGF5aW5nU3RhdGUuUmVwb3J0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wbGF5ZXIuaGFuZCA9PT0gVHlwZXMuSGFuZC5CbGFja0phY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5DaGlwc051bSAqPSAxLjU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOS6lOWwj+m+mVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbkNoaXBzTnVtICo9IDIuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvdGFsQ2hpcHNOdW0gKz0gd2luQ2hpcHNOdW07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVG90YWxDaGlwcygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgVHlwZXMuT3V0Y29tZS5Mb3NlOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluZm8uc3RyaW5nID0gJ1lvdSBMb3NlJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hdWRpb01uZy5wYXVzZU11c2ljKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXVkaW9NbmcucGxheUxvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIFR5cGVzLk91dGNvbWUuVGllOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluZm8uc3RyaW5nID0gJ0RyYXcnO1xuICAgICAgICAgICAgICAgICAgICAvLyDpgIDov5jnrbnnoIFcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b3RhbENoaXBzTnVtICs9IHRoaXMucGxheWVyLnN0YWtlTnVtO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRvdGFsQ2hpcHMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmluZm8uZW5hYmxlZCA9IGVudGVyO1xuICAgIH0sXG5cbiAgICAvLyDkuIvms6hcbiAgICBvbkJldFN0YXRlOiBmdW5jdGlvbiBvbkJldFN0YXRlKGVudGVyKSB7XG4gICAgICAgIGlmIChlbnRlcikge1xuICAgICAgICAgICAgdGhpcy5kZWNrcy5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy5wbGF5ZXIucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMuZGVhbGVyLnJlc2V0KCk7XG4gICAgICAgICAgICB0aGlzLmluZm8uc3RyaW5nID0gJ+ivt+S4i+azqCc7XG4gICAgICAgICAgICB0aGlzLmluR2FtZVVJLnNob3dCZXRTdGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5pbkdhbWVVSS5zdGFydENvdW50ZG93bigpO1xuXG4gICAgICAgICAgICB0aGlzLmF1ZGlvTW5nLnJlc3VtZU11c2ljKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbmZvLmVuYWJsZWQgPSBlbnRlcjtcbiAgICB9LFxuXG4gICAgLy8gUFJJVkFURVNcblxuICAgIC8vIOWIpOaWreeOqeWutui+k+i1olxuICAgIF9nZXRQbGF5ZXJSZXN1bHQ6IGZ1bmN0aW9uIF9nZXRQbGF5ZXJSZXN1bHQocGxheWVyLCBkZWFsZXIpIHtcbiAgICAgICAgdmFyIE91dGNvbWUgPSBUeXBlcy5PdXRjb21lO1xuICAgICAgICBpZiAocGxheWVyLnN0YXRlID09PSBBY3RvclBsYXlpbmdTdGF0ZS5CdXN0KSB7XG4gICAgICAgICAgICByZXR1cm4gT3V0Y29tZS5Mb3NlO1xuICAgICAgICB9IGVsc2UgaWYgKGRlYWxlci5zdGF0ZSA9PT0gQWN0b3JQbGF5aW5nU3RhdGUuQnVzdCkge1xuICAgICAgICAgICAgcmV0dXJuIE91dGNvbWUuV2luO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHBsYXllci5zdGF0ZSA9PT0gQWN0b3JQbGF5aW5nU3RhdGUuUmVwb3J0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE91dGNvbWUuV2luO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAocGxheWVyLmhhbmQgPiBkZWFsZXIuaGFuZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gT3V0Y29tZS5XaW47XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuaGFuZCA8IGRlYWxlci5oYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPdXRjb21lLkxvc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBsYXllci5iZXN0UG9pbnQgPT09IGRlYWxlci5iZXN0UG9pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPdXRjb21lLlRpZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYmVzdFBvaW50IDwgZGVhbGVyLmJlc3RQb2ludCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE91dGNvbWUuTG9zZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPdXRjb21lLldpbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICdmMTkyZWZyb2VGRXlheHRmaDhUVlhZeicsICdJbkdhbWVVSScpO1xuLy8gc2NyaXB0c1xcVUlcXEluR2FtZVVJLmpzXG5cbnZhciBHYW1lID0gcmVxdWlyZSgnR2FtZScpO1xuXG5jYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIHBhbmVsQ2hhdDogY2MuTm9kZSxcbiAgICAgICAgcGFuZWxTb2NpYWw6IGNjLk5vZGUsXG4gICAgICAgIGJldFN0YXRlVUk6IGNjLk5vZGUsXG4gICAgICAgIGdhbWVTdGF0ZVVJOiBjYy5Ob2RlLFxuICAgICAgICByZXN1bHRUeHQ6IGNjLkxhYmVsLFxuICAgICAgICBiZXRDb3VudGVyOiBjYy5Qcm9ncmVzc0JhcixcbiAgICAgICAgYnRuU3RhcnQ6IGNjLk5vZGUsXG4gICAgICAgIGxhYmVsVG90YWxDaGlwczogY2MuTGFiZWxcbiAgICB9LFxuXG4gICAgLy8gdXNlIHRoaXMgZm9yIGluaXRpYWxpemF0aW9uXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChiZXREdXJhdGlvbikge1xuICAgICAgICB0aGlzLnBhbmVsQ2hhdC5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wYW5lbFNvY2lhbC5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZXN1bHRUeHQuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmJldFN0YXRlVUkuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5nYW1lU3RhdGVVSS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgLy8gdGhpcy5yZXN1bHRTdGF0ZVVJLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmJ0blN0YXJ0LmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmJldER1cmF0aW9uID0gYmV0RHVyYXRpb247XG4gICAgICAgIHRoaXMuYmV0VGltZXIgPSAwO1xuICAgICAgICB0aGlzLmlzQmV0Q291bnRpbmcgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgc3RhcnRDb3VudGRvd246IGZ1bmN0aW9uIHN0YXJ0Q291bnRkb3duKCkge1xuICAgICAgICBpZiAodGhpcy5iZXRDb3VudGVyKSB7XG4gICAgICAgICAgICB0aGlzLmJldFRpbWVyID0gMDtcbiAgICAgICAgICAgIHRoaXMuaXNCZXRDb3VudGluZyA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzZXRDb3VudGRvd246IGZ1bmN0aW9uIHJlc2V0Q291bnRkb3duKCkge1xuICAgICAgICBpZiAodGhpcy5iZXRDb3VudGVyKSB7XG4gICAgICAgICAgICB0aGlzLmJldFRpbWVyID0gMDtcbiAgICAgICAgICAgIHRoaXMuaXNCZXRDb3VudGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5iZXRDb3VudGVyLnByb2dyZXNzID0gMDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzaG93QmV0U3RhdGU6IGZ1bmN0aW9uIHNob3dCZXRTdGF0ZSgpIHtcbiAgICAgICAgdGhpcy5iZXRTdGF0ZVVJLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIHRoaXMuZ2FtZVN0YXRlVUkuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYnRuU3RhcnQuYWN0aXZlID0gZmFsc2U7XG4gICAgfSxcblxuICAgIHNob3dHYW1lU3RhdGU6IGZ1bmN0aW9uIHNob3dHYW1lU3RhdGUoKSB7XG4gICAgICAgIHRoaXMuYmV0U3RhdGVVSS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5nYW1lU3RhdGVVSS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICB0aGlzLmJ0blN0YXJ0LmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICBzaG93UmVzdWx0U3RhdGU6IGZ1bmN0aW9uIHNob3dSZXN1bHRTdGF0ZSgpIHtcbiAgICAgICAgdGhpcy5iZXRTdGF0ZVVJLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmdhbWVTdGF0ZVVJLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmJ0blN0YXJ0LmFjdGl2ZSA9IHRydWU7XG4gICAgfSxcblxuICAgIHRvZ2dsZUNoYXQ6IGZ1bmN0aW9uIHRvZ2dsZUNoYXQoKSB7XG4gICAgICAgIHRoaXMucGFuZWxDaGF0LmFjdGl2ZSA9ICF0aGlzLnBhbmVsQ2hhdC5hY3RpdmU7XG4gICAgfSxcblxuICAgIHRvZ2dsZVNvY2lhbDogZnVuY3Rpb24gdG9nZ2xlU29jaWFsKCkge1xuICAgICAgICB0aGlzLnBhbmVsU29jaWFsLmFjdGl2ZSA9ICF0aGlzLnBhbmVsU29jaWFsLmFjdGl2ZTtcbiAgICB9LFxuXG4gICAgLy8gY2FsbGVkIGV2ZXJ5IGZyYW1lXG4gICAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoZHQpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNCZXRDb3VudGluZykge1xuICAgICAgICAgICAgdGhpcy5iZXRDb3VudGVyLnByb2dyZXNzID0gdGhpcy5iZXRUaW1lciAvIHRoaXMuYmV0RHVyYXRpb247XG4gICAgICAgICAgICB0aGlzLmJldFRpbWVyICs9IGR0O1xuICAgICAgICAgICAgaWYgKHRoaXMuYmV0VGltZXIgPj0gdGhpcy5iZXREdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNCZXRDb3VudGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuYmV0Q291bnRlci5wcm9ncmVzcyA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzIyYzg1dTI3WlpMZjRYOWhPM1cvemZQJywgJ0xvZ2luJyk7XG4vLyBzY3JpcHRzXFxMb2dpbi5qc1xuXG5jYy5DbGFzcyh7XG4gICAgXCJleHRlbmRzXCI6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgaW5wdXRVc2VybmFtZTogY2MuRWRpdEJveCxcbiAgICAgICAgaW5wdXRQYXNzOiBjYy5FZGl0Qm94XG4gICAgICAgIC8vIGZvbzoge1xuICAgICAgICAvLyAgICBkZWZhdWx0OiBudWxsLFxuICAgICAgICAvLyAgICB1cmw6IGNjLlRleHR1cmUyRCwgIC8vIG9wdGlvbmFsLCBkZWZhdWx0IGlzIHR5cGVvZiBkZWZhdWx0XG4gICAgICAgIC8vICAgIHNlcmlhbGl6YWJsZTogdHJ1ZSwgLy8gb3B0aW9uYWwsIGRlZmF1bHQgaXMgdHJ1ZVxuICAgICAgICAvLyAgICB2aXNpYmxlOiB0cnVlLCAgICAgIC8vIG9wdGlvbmFsLCBkZWZhdWx0IGlzIHRydWVcbiAgICAgICAgLy8gICAgZGlzcGxheU5hbWU6ICdGb28nLCAvLyBvcHRpb25hbFxuICAgICAgICAvLyAgICByZWFkb25seTogZmFsc2UsICAgIC8vIG9wdGlvbmFsLCBkZWZhdWx0IGlzIGZhbHNlXG4gICAgICAgIC8vIH0sXG4gICAgICAgIC8vIC4uLlxuICAgIH0sXG5cbiAgICAvLyB1c2UgdGhpcyBmb3IgaW5pdGlhbGl6YXRpb25cbiAgICBvbkxvYWQ6IGZ1bmN0aW9uIG9uTG9hZCgpIHt9LFxuXG4gICAgZW50ZXJNZW51OiBmdW5jdGlvbiBlbnRlck1lbnUoKSB7XG4gICAgICAgIHZhciB1c2VybmFtZSA9IHRoaXMuaW5wdXRVc2VybmFtZS5zdHJpbmc7XG4gICAgICAgIHZhciBwYXNzID0gdGhpcy5pbnB1dFBhc3Muc3RyaW5nO1xuICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHZhciB1cmwgPSBcImh0dHA6Ly8xOTIuMTY4LjEuMTAyOjgwODgvd2VsY29tZS8/YWN0aW9uPXVzZXIuc2lnbmluXCI7XG4gICAgICAgIHZhciBkYXRhID0gXCJ1c2VybmFtZT1cIiArIHVzZXJuYW1lICsgXCImcGFzcz1cIiArIHBhc3M7XG4gICAgICAgIC8vdmFyIGRhdGEgPSBKU09OLnN0cmluZ2lmeSh7XCJ1c2VybmFtZVwiOiB1c2VybmFtZSwgXCJwYXNzXCI6IHBhc3N9KTtcbiAgICAgICAgLy92YXIgZGF0YSA9IHtcInVzZXJuYW1lXCI6IHVzZXJuYW1lLCBcInBhc3NcIjogcGFzc307XG4gICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT0gNCAmJiB4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgNDAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0geGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB4aHIub3BlbihcIlBPU1RcIiwgdXJsLCB0cnVlKTtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcIik7XG4gICAgICAgIHhoci5zZW5kKGRhdGEpO1xuXG4gICAgICAgIC8qIHdzID0gbmV3IFdlYlNvY2tldChcIndzOi8vMTI3LjAuMC4xL3dlbGNvbWUvXCIpO1xyXG4gICAgICAgIHdzLm9ub3BlbiA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNlbmQgVGV4dCBXUyB3YXMgb3BlbmVkLlwiKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHdzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInJlc3BvbnNlIHRleHQgbXNnOiBcIiArIGV2ZW50LmRhdGEpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgd3Mub25lcnJvciA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNlbmQgVGV4dCBmaXJlZCBhbiBlcnJvclwiKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHdzLm9uY2xvc2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJXZWJTb2NrZXQgaW5zdGFuY2UgY2xvc2VkLlwiKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICh3cy5yZWFkeVN0YXRlID09PSBXZWJTb2NrZXQuT1BFTikge1xyXG4gICAgICAgICAgICAgICAgd3Muc2VuZChcIkhlbGxvIFdlYlNvY2tldCwgSSdtIGEgdGV4dCBtZXNzYWdlLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiV2ViU29ja2V0IGluc3RhbmNlIHdhc24ndCByZWFkeS4uLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIDMpOyovXG5cbiAgICAgICAgLy9sb2FkIHVzZXJzXG4gICAgICAgIHVybCA9IFwiaHR0cDovLzE5Mi4xNjguMS4xMDI6ODA4OC93ZWxjb21lLz9hY3Rpb249dXNlci5nZXR1c2Vyc1wiO1xuICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09IDQgJiYgeGhyLnN0YXR1cyA+PSAyMDAgJiYgeGhyLnN0YXR1cyA8IDQwMCkge1xuICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IHhoci5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIGNjLnN5cy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlckRhdGEnLCBKU09OLnN0cmluZ2lmeShyZXNwb25zZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHhoci5vcGVuKFwiR0VUXCIsIHVybCwgdHJ1ZSk7XG4gICAgICAgIHhoci5zZW5kKCk7XG5cbiAgICAgICAgLy9yZXNldCBkYXRhXG4gICAgICAgIC8qdXJsID0gXCJodHRwOi8vMTkyLjE2OC4xLjEwMjo4MDg4L3dlbGNvbWUvP2FjdGlvbj11c2VyLnJzZXR1c2Vyc1wiO1xyXG4gICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT0gNCAmJiAoeGhyLnN0YXR1cyA+PSAyMDAgJiYgeGhyLnN0YXR1cyA8IDQwMCkpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0geGhyLnJlc3BvbnNlVGV4dDtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXG4gICAgICAgIHhoci5vcGVuKFwiR0VUXCIsIHVybCwgdHJ1ZSk7XHJcbiAgICAgICAgeGhyLnNlbmQoKTsqL1xuXG4gICAgICAgIC8vY2MuZGlyZWN0b3IubG9hZFNjZW5lKCdtZW51Jyk7XG4gICAgfVxuXG4gICAgLy8gY2FsbGVkIGV2ZXJ5IGZyYW1lLCB1bmNvbW1lbnQgdGhpcyBmdW5jdGlvbiB0byBhY3RpdmF0ZSB1cGRhdGUgY2FsbGJhY2tcbiAgICAvLyB1cGRhdGU6IGZ1bmN0aW9uIChkdCkge1xuXG4gICAgLy8gfSxcbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnMjBmNjBtKzNSbEdPN3gyL0FSelo2UWMnLCAnTWVudScpO1xuLy8gc2NyaXB0c1xcTWVudS5qc1xuXG5jYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIGF1ZGlvTW5nOiBjYy5Ob2RlXG4gICAgfSxcblxuICAgIC8vIHVzZSB0aGlzIGZvciBpbml0aWFsaXphdGlvblxuICAgIG9uTG9hZDogZnVuY3Rpb24gb25Mb2FkKCkge1xuICAgICAgICB0aGlzLmF1ZGlvTW5nID0gdGhpcy5hdWRpb01uZy5nZXRDb21wb25lbnQoJ0F1ZGlvTW5nJyk7XG4gICAgICAgIHRoaXMuYXVkaW9NbmcucGxheU11c2ljKCk7XG4gICAgfSxcblxuICAgIHBsYXlHYW1lOiBmdW5jdGlvbiBwbGF5R2FtZSgpIHtcbiAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKCd0YWJsZScpO1xuICAgIH0sXG5cbiAgICAvLyBjYWxsZWQgZXZlcnkgZnJhbWVcbiAgICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZShkdCkge31cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnNTQzOTdjVXhlaEd6cUVxcE1VR0hlanMnLCAnTW9kYWxVSScpO1xuLy8gc2NyaXB0c1xcVUlcXE1vZGFsVUkuanNcblxuY2MuQ2xhc3Moe1xuICAgICdleHRlbmRzJzogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBtYXNrOiBjYy5Ob2RlXG4gICAgfSxcblxuICAgIC8vIHVzZSB0aGlzIGZvciBpbml0aWFsaXphdGlvblxuICAgIG9uTG9hZDogZnVuY3Rpb24gb25Mb2FkKCkge30sXG5cbiAgICBvbkVuYWJsZTogZnVuY3Rpb24gb25FbmFibGUoKSB7XG4gICAgICAgIHRoaXMubWFzay5vbigndG91Y2hzdGFydCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm1hc2sub24oJ3RvdWNoZW5kJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uRGlzYWJsZTogZnVuY3Rpb24gb25EaXNhYmxlKCkge1xuICAgICAgICB0aGlzLm1hc2sub2ZmKCd0b3VjaHN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubWFzay5vZmYoJ3RvdWNoZW5kJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gY2FsbGVkIGV2ZXJ5IGZyYW1lLCB1bmNvbW1lbnQgdGhpcyBmdW5jdGlvbiB0byBhY3RpdmF0ZSB1cGRhdGUgY2FsbGJhY2tcbiAgICAvLyB1cGRhdGU6IGZ1bmN0aW9uIChkdCkge1xuXG4gICAgLy8gfSxcbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnNGY5YzVlWHhxaEhBS0x4WmVSbWdIREInLCAnUGxheWVyRGF0YScpO1xuLy8gc2NyaXB0c1xcbW9kdWxlXFxQbGF5ZXJEYXRhLmpzXG5cbnZhciBwbGF5ZXJzID0gW3tcblx0bmFtZTogJ+WlpeW3tOmprCcsXG5cdGdvbGQ6IDMwMDAsXG5cdHBob3RvSWR4OiAwXG59LCB7XG5cdG5hbWU6ICd0cnVtcCcsXG5cdGdvbGQ6IDIwMDAsXG5cdHBob3RvSWR4OiAxXG59LCB7XG5cdG5hbWU6ICfkuaAnLFxuXHRnb2xkOiAxNTAwLFxuXHRwaG90b0lkeDogMlxufSwge1xuXHRuYW1lOiAn5pmu5LqsJyxcblx0Z29sZDogNTAwLFxuXHRwaG90b0lkeDogM1xufSwge1xuXHRuYW1lOiAn5biM5ouJ6YeMJyxcblx0Z29sZDogOTAwMCxcblx0cGhvdG9JZHg6IDRcbn0sIHtcblx0bmFtZTogJ+ibpCcsXG5cdGdvbGQ6IDUwMDAsXG5cdHBob3RvSWR4OiA1XG59LCB7XG5cdG5hbWU6ICfmtpsnLFxuXHRnb2xkOiAxMDAwMCxcblx0cGhvdG9JZHg6IDZcbn1dO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0cGxheWVyczogcGxheWVyc1xufTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzIyNmEyQXZ6UnBITDdTSkdUTXk1UERYJywgJ1BsYXllcicpO1xuLy8gc2NyaXB0c1xcUGxheWVyLmpzXG5cbnZhciBBY3RvciA9IHJlcXVpcmUoJ0FjdG9yJyk7XG5cbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IEFjdG9yLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgdGhpcy5fc3VwZXIoKTtcbiAgICAgICAgdGhpcy5sYWJlbFN0YWtlID0gdGhpcy5yZW5kZXJlci5sYWJlbFN0YWtlT25UYWJsZTtcbiAgICAgICAgdGhpcy5zdGFrZU51bSA9IDA7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgICAgdGhpcy5fc3VwZXIoKTtcbiAgICAgICAgdGhpcy5yZXNldFN0YWtlKCk7XG4gICAgfSxcblxuICAgIGFkZENhcmQ6IGZ1bmN0aW9uIGFkZENhcmQoY2FyZCkge1xuICAgICAgICB0aGlzLl9zdXBlcihjYXJkKTtcblxuICAgICAgICAvLyB2YXIgR2FtZSA9IHJlcXVpcmUoJ0dhbWUnKTtcbiAgICAgICAgLy8gR2FtZS5pbnN0YW5jZS5jYW5SZXBvcnQgPSB0aGlzLmNhblJlcG9ydDtcbiAgICB9LFxuXG4gICAgYWRkU3Rha2U6IGZ1bmN0aW9uIGFkZFN0YWtlKGRlbHRhKSB7XG4gICAgICAgIHRoaXMuc3Rha2VOdW0gKz0gZGVsdGE7XG4gICAgICAgIHRoaXMudXBkYXRlU3Rha2UodGhpcy5zdGFrZU51bSk7XG4gICAgfSxcblxuICAgIHJlc2V0U3Rha2U6IGZ1bmN0aW9uIHJlc2V0U3Rha2UoZGVsdGEpIHtcbiAgICAgICAgdGhpcy5zdGFrZU51bSA9IDA7XG4gICAgICAgIHRoaXMudXBkYXRlU3Rha2UodGhpcy5zdGFrZU51bSk7XG4gICAgfSxcblxuICAgIHVwZGF0ZVN0YWtlOiBmdW5jdGlvbiB1cGRhdGVTdGFrZShudW1iZXIpIHtcbiAgICAgICAgdGhpcy5sYWJlbFN0YWtlLnN0cmluZyA9IG51bWJlcjtcbiAgICB9XG5cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnMTY1N2V3ZmlqQk9YTHE1ekdxcjZQdkUnLCAnUmFua0l0ZW0nKTtcbi8vIHNjcmlwdHNcXFVJXFxSYW5rSXRlbS5qc1xuXG5jYy5DbGFzcyh7XG4gICAgXCJleHRlbmRzXCI6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgc3BSYW5rQkc6IGNjLlNwcml0ZSxcbiAgICAgICAgbGFiZWxSYW5rOiBjYy5MYWJlbCxcbiAgICAgICAgbGFiZWxQbGF5ZXJOYW1lOiBjYy5MYWJlbCxcbiAgICAgICAgbGFiZWxHb2xkOiBjYy5MYWJlbCxcbiAgICAgICAgc3BQbGF5ZXJQaG90bzogY2MuU3ByaXRlLFxuICAgICAgICB0ZXhSYW5rQkc6IGNjLlNwcml0ZUZyYW1lLFxuICAgICAgICB0ZXhQbGF5ZXJQaG90bzogY2MuU3ByaXRlRnJhbWVcbiAgICAgICAgLy8gLi4uXG4gICAgfSxcblxuICAgIC8vIHVzZSB0aGlzIGZvciBpbml0aWFsaXphdGlvblxuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQocmFuaywgcGxheWVySW5mbykge1xuICAgICAgICBpZiAocmFuayA8IDMpIHtcbiAgICAgICAgICAgIC8vIHNob3VsZCBkaXNwbGF5IHRyb3BoeVxuICAgICAgICAgICAgdGhpcy5sYWJlbFJhbmsubm9kZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuc3BSYW5rQkcuc3ByaXRlRnJhbWUgPSB0aGlzLnRleFJhbmtCR1tyYW5rXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGFiZWxSYW5rLm5vZGUuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMubGFiZWxSYW5rLnN0cmluZyA9IChyYW5rICsgMSkudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubGFiZWxQbGF5ZXJOYW1lLnN0cmluZyA9IHBsYXllckluZm8ubmFtZTtcbiAgICAgICAgdGhpcy5sYWJlbEdvbGQuc3RyaW5nID0gcGxheWVySW5mby5nb2xkLnRvU3RyaW5nKCk7XG4gICAgICAgIHRoaXMuc3BQbGF5ZXJQaG90by5zcHJpdGVGcmFtZSA9IHRoaXMudGV4UGxheWVyUGhvdG9bcGxheWVySW5mby5waG90b0lkeF07XG4gICAgfSxcblxuICAgIC8vIGNhbGxlZCBldmVyeSBmcmFtZVxuICAgIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlKGR0KSB7fVxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICdmZTNmY0l4Q0ZGTHJLSGc2czUreFJVVScsICdSYW5rTGlzdCcpO1xuLy8gc2NyaXB0c1xcVUlcXFJhbmtMaXN0LmpzXG5cbnZhciBwbGF5ZXJzID0gcmVxdWlyZSgnUGxheWVyRGF0YScpLnBsYXllcnM7XG5cbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgc2Nyb2xsVmlldzogY2MuU2Nyb2xsVmlldyxcbiAgICAgICAgcHJlZmFiUmFua0l0ZW06IGNjLlByZWZhYixcbiAgICAgICAgcmFua0NvdW50OiAwXG4gICAgfSxcblxuICAgIC8vIHVzZSB0aGlzIGZvciBpbml0aWFsaXphdGlvblxuICAgIG9uTG9hZDogZnVuY3Rpb24gb25Mb2FkKCkge1xuICAgICAgICB0aGlzLmNvbnRlbnQgPSB0aGlzLnNjcm9sbFZpZXcuY29udGVudDtcbiAgICAgICAgdGhpcy5wb3B1bGF0ZUxpc3QoKTtcbiAgICB9LFxuXG4gICAgcG9wdWxhdGVMaXN0OiBmdW5jdGlvbiBwb3B1bGF0ZUxpc3QoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5yYW5rQ291bnQ7ICsraSkge1xuICAgICAgICAgICAgdmFyIHBsYXllckluZm8gPSBwbGF5ZXJzW2ldO1xuICAgICAgICAgICAgdmFyIGl0ZW0gPSBjYy5pbnN0YW50aWF0ZSh0aGlzLnByZWZhYlJhbmtJdGVtKTtcbiAgICAgICAgICAgIGl0ZW0uZ2V0Q29tcG9uZW50KCdSYW5rSXRlbScpLmluaXQoaSwgcGxheWVySW5mbyk7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnQuYWRkQ2hpbGQoaXRlbSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gY2FsbGVkIGV2ZXJ5IGZyYW1lXG4gICAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoZHQpIHt9XG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzNhYWU3bFpLeWhQcXFzTEQzd01LbDZYJywgJ1NpZGVTd2l0Y2hlcicpO1xuLy8gc2NyaXB0c1xcU2lkZVN3aXRjaGVyLmpzXG5cbmNjLkNsYXNzKHtcbiAgICBcImV4dGVuZHNcIjogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICByZXRhaW5TaWRlTm9kZXM6IHtcbiAgICAgICAgICAgIFwiZGVmYXVsdFwiOiBbXSxcbiAgICAgICAgICAgIHR5cGU6IGNjLk5vZGVcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyB1c2UgdGhpcyBmb3IgaW5pdGlhbGl6YXRpb25cbiAgICBzd2l0Y2hTaWRlOiBmdW5jdGlvbiBzd2l0Y2hTaWRlKCkge1xuICAgICAgICB0aGlzLm5vZGUuc2NhbGVYID0gLXRoaXMubm9kZS5zY2FsZVg7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5yZXRhaW5TaWRlTm9kZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBjdXJOb2RlID0gdGhpcy5yZXRhaW5TaWRlTm9kZXNbaV07XG4gICAgICAgICAgICBjdXJOb2RlLnNjYWxlWCA9IC1jdXJOb2RlLnNjYWxlWDtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnYjRlYjVMbzZVMUlaNGVKV3V4U2hDZEgnLCAnVG9zc0NoaXAnKTtcbi8vIHNjcmlwdHNcXFRvc3NDaGlwLmpzXG5cbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgYW5pbTogY2MuQW5pbWF0aW9uXG4gICAgfSxcblxuICAgIC8vIHVzZSB0aGlzIGZvciBpbml0aWFsaXphdGlvblxuICAgIHBsYXk6IGZ1bmN0aW9uIHBsYXkoKSB7XG4gICAgICAgIHRoaXMuYW5pbS5wbGF5KCdjaGlwX3Rvc3MnKTtcbiAgICB9XG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzViNjMzUU1ReHBGbVlldG9mRXZLMlVEJywgJ1R5cGVzJyk7XG4vLyBzY3JpcHRzXFxtb2R1bGVcXFR5cGVzLmpzXG5cbnZhciBTdWl0ID0gY2MuRW51bSh7XG4gICAgU3BhZGU6IDEsIC8vIOm7keahg1xuICAgIEhlYXJ0OiAyLCAvLyDnuqLmoYNcbiAgICBDbHViOiAzLCAvLyDmooXoirEo6buRKVxuICAgIERpYW1vbmQ6IDQgfSk7XG5cbi8vIOaWueWdlyjnuqIpXG52YXIgQTJfMTBKUUsgPSAnTkFOLEEsMiwzLDQsNSw2LDcsOCw5LDEwLEosUSxLJy5zcGxpdCgnLCcpO1xuXG4vKipcclxuICog5omR5YWL54mM57G777yM5Y+q55So5p2l6KGo56S654mM55qE5Z+65pys5bGe5oCn77yM5LiN5YyF5ZCr5ri45oiP6YC76L6R77yM5omA5pyJ5bGe5oCn5Y+q6K+777yMXHJcbiAqIOWboOatpOWFqOWxgOWPqumcgOimgeaciSA1MiDkuKrlrp7kvovvvIjljrvmjonlpKflsI/njovvvInvvIzkuI3orrrmnInlpJrlsJHlia/niYxcclxuICogQGNsYXNzIENhcmRcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBwb2ludCAtIOWPr+iDveeahOWAvOS4uiAxIOWIsCAxM1xyXG4gKiBAcGFyYW0ge1N1aXR9IHN1aXRcclxuICovXG5mdW5jdGlvbiBDYXJkKHBvaW50LCBzdWl0KSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgICBwb2ludDoge1xuICAgICAgICAgICAgdmFsdWU6IHBvaW50LFxuICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIHN1aXQ6IHtcbiAgICAgICAgICAgIHZhbHVlOiBzdWl0LFxuICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBpZCAtIOWPr+iDveeahOWAvOS4uiAwIOWIsCA1MVxyXG4gICAgICAgICAqL1xuICAgICAgICBpZDoge1xuICAgICAgICAgICAgdmFsdWU6IChzdWl0IC0gMSkgKiAxMyArIChwb2ludCAtIDEpLFxuICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIC8vXG4gICAgICAgIHBvaW50TmFtZToge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEEyXzEwSlFLW3RoaXMucG9pbnRdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzdWl0TmFtZToge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFN1aXRbdGhpcy5zdWl0XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaXNCbGFja1N1aXQ6IHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN1aXQgPT09IFN1aXQuU3BhZGUgfHwgdGhpcy5zdWl0ID09PSBTdWl0LkNsdWI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGlzUmVkU3VpdDoge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3VpdCA9PT0gU3VpdC5IZWFydCB8fCB0aGlzLnN1aXQgPT09IFN1aXQuRGlhbW9uZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5DYXJkLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdWl0TmFtZSArICcgJyArIHRoaXMucG9pbnROYW1lO1xufTtcblxuLy8g5a2Y5pS+IDUyIOW8oOaJkeWFi+eahOWunuS+i1xudmFyIGNhcmRzID0gbmV3IEFycmF5KDUyKTtcblxuLyoqXHJcbiAqIOi/lOWbnuaMh+WumiBpZCDnmoTlrp7kvotcclxuICogQHBhcmFtIHtOdW1iZXJ9IGlkIC0gMCDliLAgNTFcclxuICovXG5DYXJkLmZyb21JZCA9IGZ1bmN0aW9uIChpZCkge1xuICAgIHJldHVybiBjYXJkc1tpZF07XG59O1xuXG4vLyDliJ3lp4vljJbmiYDmnInmiZHlhYvniYxcbihmdW5jdGlvbiBjcmVhdGVDYXJkcygpIHtcbiAgICBmb3IgKHZhciBzID0gMTsgcyA8PSA0OyBzKyspIHtcbiAgICAgICAgZm9yICh2YXIgcCA9IDE7IHAgPD0gMTM7IHArKykge1xuICAgICAgICAgICAgdmFyIGNhcmQgPSBuZXcgQ2FyZChwLCBzKTtcbiAgICAgICAgICAgIGNhcmRzW2NhcmQuaWRdID0gY2FyZDtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7XG5cbi8vIOaJi+S4reeJjOeahOeKtuaAgVxudmFyIEFjdG9yUGxheWluZ1N0YXRlID0gY2MuRW51bSh7XG4gICAgTm9ybWFsOiAtMSxcbiAgICBTdGFuZDogLTEsIC8vIOWBnOeJjFxuICAgIFJlcG9ydDogLTEsIC8vIOaKpeWIsFxuICAgIEJ1c3Q6IC0xIH0pO1xuXG4vLyDovpPotaJcbi8vIOeIhuS6hlxudmFyIE91dGNvbWUgPSBjYy5FbnVtKHtcbiAgICBXaW46IC0xLFxuICAgIExvc2U6IC0xLFxuICAgIFRpZTogLTFcbn0pO1xuXG4vLyDniYzlnovvvIzlgLzotorlpKfotorljonlrrNcbnZhciBIYW5kID0gY2MuRW51bSh7XG4gICAgTm9ybWFsOiAtMSwgLy8g5pegXG4gICAgQmxhY2tKYWNrOiAtMSwgLy8g6buR5p2w5YWLXG4gICAgRml2ZUNhcmQ6IC0xIH0pO1xuXG4vLyDkupTlsI/pvplcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIFN1aXQ6IFN1aXQsXG4gICAgQ2FyZDogQ2FyZCxcbiAgICBBY3RvclBsYXlpbmdTdGF0ZTogQWN0b3JQbGF5aW5nU3RhdGUsXG4gICAgSGFuZDogSGFuZCxcbiAgICBPdXRjb21lOiBPdXRjb21lXG59O1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnNzM1OTBlc2s2eFA5SUNxaGZVWmFsTWcnLCAnVXRpbHMnKTtcbi8vIHNjcmlwdHNcXG1vZHVsZVxcVXRpbHMuanNcblxuXG4vLyDov5Tlm57lsL3lj6/og73kuI3otoXov4cgMjEg54K555qE5pyA5bCP5ZKM5pyA5aSn54K55pWwXG5mdW5jdGlvbiBnZXRNaW5NYXhQb2ludChjYXJkcykge1xuICAgIHZhciBoYXNBY2UgPSBmYWxzZTtcbiAgICB2YXIgbWluID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjYXJkID0gY2FyZHNbaV07XG4gICAgICAgIGlmIChjYXJkLnBvaW50ID09PSAxKSB7XG4gICAgICAgICAgICBoYXNBY2UgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIG1pbiArPSBNYXRoLm1pbigxMCwgY2FyZC5wb2ludCk7XG4gICAgfVxuICAgIHZhciBtYXggPSBtaW47XG4gICAgLy8g5aaC5p6c5pyJIDEg5LiqIEEg5Y+v5Lul5b2T5oiQIDExXG4gICAgaWYgKGhhc0FjZSAmJiBtaW4gKyAxMCA8PSAyMSkge1xuICAgICAgICAvLyDvvIjlpoLmnpzkuKTkuKogQSDpg73lvZPmiJAgMTHvvIzpgqPkuYjmgLvliIbmnIDlsI/kuZ/kvJrmmK8gMjLvvIzniIbkuobvvIzmiYDku6XmnIDlpJrlj6rog73mnInkuIDkuKogQSDlvZPmiJAgMTHvvIlcbiAgICAgICAgbWF4ICs9IDEwO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIG1pbjogbWluLFxuICAgICAgICBtYXg6IG1heFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGlzQnVzdChjYXJkcykge1xuICAgIHZhciBzdW0gPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FyZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNhcmQgPSBjYXJkc1tpXTtcbiAgICAgICAgc3VtICs9IE1hdGgubWluKDEwLCBjYXJkLnBvaW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHN1bSA+IDIxO1xufVxuXG52YXIgaXNNb2JpbGUgPSBmdW5jdGlvbiBpc01vYmlsZSgpIHtcbiAgICByZXR1cm4gY2Muc3lzLmlzTW9iaWxlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXNCdXN0OiBpc0J1c3QsXG4gICAgZ2V0TWluTWF4UG9pbnQ6IGdldE1pbk1heFBvaW50LFxuICAgIGlzTW9iaWxlOiBpc01vYmlsZVxufTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzY1MTBkMVNtUVJNTVlIOEZFSUE3elhxJywgJ2dhbWUtZnNtJyk7XG4vLyBzY3JpcHRzXFxtb2R1bGVcXGdhbWUtZnNtLmpzXG5cbnZhciBTdGF0ZSA9IHJlcXVpcmUoJ3N0YXRlLmNvbScpO1xuXG52YXIgaW5zdGFuY2U7XG52YXIgbW9kZWw7XG52YXIgcGxheWluZztcblxuZnVuY3Rpb24gb24obWVzc2FnZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAobXNnVG9FdmFsdWF0ZSkge1xuICAgICAgICByZXR1cm4gbXNnVG9FdmFsdWF0ZSA9PT0gbWVzc2FnZTtcbiAgICB9O1xufVxuXG52YXIgZXZhbHVhdGluZyA9IGZhbHNlO1xuXG5leHBvcnRzID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQodGFyZ2V0KSB7XG4gICAgICAgIC8vIHNlbmQgbG9nIG1lc3NhZ2VzLCB3YXJuaW5ncyBhbmQgZXJyb3JzIHRvIHRoZSBjb25zb2xlXG4gICAgICAgIFN0YXRlLmNvbnNvbGUgPSBjb25zb2xlO1xuXG4gICAgICAgIG1vZGVsID0gbmV3IFN0YXRlLlN0YXRlTWFjaGluZShcInJvb3RcIik7XG4gICAgICAgIHZhciBpbml0aWFsID0gbmV3IFN0YXRlLlBzZXVkb1N0YXRlKFwiaW5pdC1yb290XCIsIG1vZGVsLCBTdGF0ZS5Qc2V1ZG9TdGF0ZUtpbmQuSW5pdGlhbCk7XG5cbiAgICAgICAgLy8g5b2T5YmN6L+Z5LiA5oqK55qE54q25oCBXG5cbiAgICAgICAgdmFyIGJldCA9IG5ldyBTdGF0ZS5TdGF0ZShcIuS4i+azqFwiLCBtb2RlbCk7XG4gICAgICAgIHBsYXlpbmcgPSBuZXcgU3RhdGUuU3RhdGUoXCLlt7LlvIDlsYBcIiwgbW9kZWwpO1xuICAgICAgICB2YXIgc2V0dGxlZCA9IG5ldyBTdGF0ZS5TdGF0ZShcIue7k+eul1wiLCBtb2RlbCk7XG5cbiAgICAgICAgaW5pdGlhbC50byhiZXQpO1xuICAgICAgICBiZXQudG8ocGxheWluZykud2hlbihvbihcImRlYWxcIikpO1xuICAgICAgICBwbGF5aW5nLnRvKHNldHRsZWQpLndoZW4ob24oXCJlbmRcIikpO1xuICAgICAgICBzZXR0bGVkLnRvKGJldCkud2hlbihvbihcImJldFwiKSk7XG5cbiAgICAgICAgYmV0LmVudHJ5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRhcmdldC5vbkJldFN0YXRlKHRydWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgYmV0LmV4aXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGFyZ2V0Lm9uQmV0U3RhdGUoZmFsc2UpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzZXR0bGVkLmVudHJ5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRhcmdldC5vbkVuZFN0YXRlKHRydWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgc2V0dGxlZC5leGl0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRhcmdldC5vbkVuZFN0YXRlKGZhbHNlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5byA5bGA5ZCO55qE5a2Q54q25oCBXG5cbiAgICAgICAgdmFyIGluaXRpYWxQID0gbmV3IFN0YXRlLlBzZXVkb1N0YXRlKFwiaW5pdCDlt7LlvIDlsYBcIiwgcGxheWluZywgU3RhdGUuUHNldWRvU3RhdGVLaW5kLkluaXRpYWwpO1xuICAgICAgICB2YXIgZGVhbCA9IG5ldyBTdGF0ZS5TdGF0ZShcIuWPkeeJjFwiLCBwbGF5aW5nKTtcbiAgICAgICAgLy92YXIgcG9zdERlYWwgPSBuZXcgU3RhdGUuU3RhdGUoXCLnrYnlvoVcIiwgcGxheWluZyk7ICAgIC8vIOivoumXrueOqeWutuaYr+WQpuS5sOS/nemZqe+8jOWPjOWAjeOAgeWIhueJjOetiVxuICAgICAgICB2YXIgcGxheWVyc1R1cm4gPSBuZXcgU3RhdGUuU3RhdGUoXCLnjqnlrrblhrPnrZZcIiwgcGxheWluZyk7XG4gICAgICAgIHZhciBkZWFsZXJzVHVybiA9IG5ldyBTdGF0ZS5TdGF0ZShcIuW6hOWutuWGs+etllwiLCBwbGF5aW5nKTtcblxuICAgICAgICBpbml0aWFsUC50byhkZWFsKTtcbiAgICAgICAgZGVhbC50byhwbGF5ZXJzVHVybikud2hlbihvbihcImRlYWxlZFwiKSk7XG4gICAgICAgIHBsYXllcnNUdXJuLnRvKGRlYWxlcnNUdXJuKS53aGVuKG9uKFwicGxheWVyIGFjdGVkXCIpKTtcblxuICAgICAgICBkZWFsLmVudHJ5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRhcmdldC5vbkVudGVyRGVhbFN0YXRlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBwbGF5ZXJzVHVybi5lbnRyeShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0YXJnZXQub25QbGF5ZXJzVHVyblN0YXRlKHRydWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcGxheWVyc1R1cm4uZXhpdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0YXJnZXQub25QbGF5ZXJzVHVyblN0YXRlKGZhbHNlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGRlYWxlcnNUdXJuLmVudHJ5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRhcmdldC5vbkVudGVyRGVhbGVyc1R1cm5TdGF0ZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBjcmVhdGUgYSBTdGF0ZSBtYWNoaW5lIGluc3RhbmNlXG4gICAgICAgIGluc3RhbmNlID0gbmV3IFN0YXRlLlN0YXRlTWFjaGluZUluc3RhbmNlKFwiZnNtXCIpO1xuICAgICAgICBTdGF0ZS5pbml0aWFsaXNlKG1vZGVsLCBpbnN0YW5jZSk7XG4gICAgfSxcblxuICAgIHRvRGVhbDogZnVuY3Rpb24gdG9EZWFsKCkge1xuICAgICAgICB0aGlzLl9ldmFsdWF0ZSgnZGVhbCcpO1xuICAgIH0sXG4gICAgdG9CZXQ6IGZ1bmN0aW9uIHRvQmV0KCkge1xuICAgICAgICB0aGlzLl9ldmFsdWF0ZSgnYmV0Jyk7XG4gICAgfSxcbiAgICBvbkRlYWxlZDogZnVuY3Rpb24gb25EZWFsZWQoKSB7XG4gICAgICAgIHRoaXMuX2V2YWx1YXRlKCdkZWFsZWQnKTtcbiAgICB9LFxuICAgIG9uUGxheWVyQWN0ZWQ6IGZ1bmN0aW9uIG9uUGxheWVyQWN0ZWQoKSB7XG4gICAgICAgIHRoaXMuX2V2YWx1YXRlKCdwbGF5ZXIgYWN0ZWQnKTtcbiAgICB9LFxuICAgIG9uRGVhbGVyQWN0ZWQ6IGZ1bmN0aW9uIG9uRGVhbGVyQWN0ZWQoKSB7XG4gICAgICAgIHRoaXMuX2V2YWx1YXRlKCdlbmQnKTtcbiAgICB9LFxuXG4gICAgX2V2YWx1YXRlOiBmdW5jdGlvbiBfZXZhbHVhdGUobWVzc2FnZSkge1xuICAgICAgICBpZiAoZXZhbHVhdGluZykge1xuICAgICAgICAgICAgLy8gY2FuIG5vdCBjYWxsIGZzbSdzIGV2YWx1YXRlIHJlY3Vyc2l2ZWx5XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTdGF0ZS5ldmFsdWF0ZShtb2RlbCwgaW5zdGFuY2UsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSwgMSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZXZhbHVhdGluZyA9IHRydWU7XG4gICAgICAgIFN0YXRlLmV2YWx1YXRlKG1vZGVsLCBpbnN0YW5jZSwgbWVzc2FnZSk7XG4gICAgICAgIGV2YWx1YXRpbmcgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgX2dldEluc3RhbmNlOiBmdW5jdGlvbiBfZ2V0SW5zdGFuY2UoKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9LFxuXG4gICAgX2dldE1vZGVsOiBmdW5jdGlvbiBfZ2V0TW9kZWwoKSB7XG4gICAgICAgIHJldHVybiBtb2RlbDtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHM7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICc3MWQ5MjkzbXg5Q0ZyeWhKdlJ3ODVaUycsICdzdGF0ZS5jb20nKTtcbi8vIHNjcmlwdHNcXGxpYlxcc3RhdGUuY29tLmpzXG5cbi8qXHJcbiAqIEZpbml0ZSBzdGF0ZSBtYWNoaW5lIGxpYnJhcnlcclxuICogQ29weXJpZ2h0IChjKSAyMDE0LTUgU3RlZWxicmVlemUgTGltaXRlZFxyXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGFuZCBHUEwgdjMgbGljZW5jZXNcclxuICogaHR0cDovL3d3dy5zdGVlbGJyZWV6ZS5uZXQvc3RhdGUuY3NcclxuICovXG52YXIgU3RhdGVKUztcbihmdW5jdGlvbiAoU3RhdGVKUykge1xuICAgIC8qKlxyXG4gICAgICogQmVoYXZpb3IgZW5jYXBzdWxhdGVzIG11bHRpcGxlIEFjdGlvbiBjYWxsYmFja3MgdGhhdCBjYW4gYmUgaW52b2tlZCBieSBhIHNpbmdsZSBjYWxsLlxyXG4gICAgICogQGNsYXNzIEJlaGF2aW9yXHJcbiAgICAgKi9cbiAgICB2YXIgQmVoYXZpb3IgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBCZWhhdmlvciBjbGFzcy5cclxuICAgICAgICAgKiBAcGFyYW0ge0JlaGF2aW9yfSBiZWhhdmlvciBUaGUgY29weSBjb25zdHJ1Y3Rvcjsgb21pdCB0aGlzIG9wdGlvbmFsIHBhcmFtZXRlciBmb3IgYSBzaW1wbGUgY29uc3RydWN0b3IuXHJcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIEJlaGF2aW9yKGJlaGF2aW9yKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGlvbnMgPSBbXTtcbiAgICAgICAgICAgIGlmIChiZWhhdmlvcikge1xuICAgICAgICAgICAgICAgIHRoaXMucHVzaChiZWhhdmlvcik7IC8vIE5PVEU6IHRoaXMgZW5zdXJlcyBhIGNvcHkgb2YgdGhlIGFycmF5IGlzIG1hZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBZGRzIGFuIEFjdGlvbiBvciBzZXQgb2YgQWN0aW9ucyBjYWxsYmFja3MgaW4gYSBCZWhhdmlvciBpbnN0YW5jZSB0byB0aGlzIGJlaGF2aW9yIGluc3RhbmNlLlxyXG4gICAgICAgICAqIEBtZXRob2QgcHVzaFxyXG4gICAgICAgICAqIEBwYXJhbSB7QmVoYXZpb3J9IGJlaGF2aW9yIFRoZSBBY3Rpb24gb3Igc2V0IG9mIEFjdGlvbnMgY2FsbGJhY2tzIHRvIGFkZCB0byB0aGlzIGJlaGF2aW9yIGluc3RhbmNlLlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtCZWhhdmlvcn0gUmV0dXJucyB0aGlzIGJlaGF2aW9yIGluc3RhbmNlIChmb3IgdXNlIGluIGZsdWVudCBzdHlsZSBkZXZlbG9wbWVudCkuXHJcbiAgICAgICAgICovXG4gICAgICAgIEJlaGF2aW9yLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKGJlaGF2aW9yKSB7XG4gICAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh0aGlzLmFjdGlvbnMsIGJlaGF2aW9yIGluc3RhbmNlb2YgQmVoYXZpb3IgPyBiZWhhdmlvci5hY3Rpb25zIDogYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBUZXN0cyB0aGUgQmVoYXZpb3IgaW5zdGFuY2UgdG8gc2VlIGlmIGFueSBhY3Rpb25zIGhhdmUgYmVlbiBkZWZpbmVkLlxyXG4gICAgICAgICAqIEBtZXRob2QgaGFzQWN0aW9uc1xyXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZXJlIGFyZSBhY3Rpb25zIGRlZmluZWQgd2l0aGluIHRoaXMgQmVoYXZpb3IgaW5zdGFuY2UuXHJcbiAgICAgICAgICovXG4gICAgICAgIEJlaGF2aW9yLnByb3RvdHlwZS5oYXNBY3Rpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aW9ucy5sZW5ndGggIT09IDA7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEludm9rZXMgYWxsIHRoZSBhY3Rpb24gY2FsbGJhY2tzIGluIHRoaXMgQmVoYXZpb3IgaW5zdGFuY2UuXHJcbiAgICAgICAgICogQG1ldGhvZCBpbnZva2VcclxuICAgICAgICAgKiBAcGFyYW0ge2FueX0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0aGF0IHRyaWdnZXJlZCB0aGUgdHJhbnNpdGlvbi5cclxuICAgICAgICAgKiBAcGFyYW0ge0lBY3RpdmVTdGF0ZUNvbmZpZ3VyYXRpb259IGluc3RhbmNlIFRoZSBzdGF0ZSBtYWNoaW5lIGluc3RhbmNlLlxyXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaGlzdG9yeSBJbnRlcm5hbCB1c2Ugb25seVxyXG4gICAgICAgICAqL1xuICAgICAgICBCZWhhdmlvci5wcm90b3R5cGUuaW52b2tlID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGluc3RhbmNlLCBoaXN0b3J5KSB7XG4gICAgICAgICAgICBpZiAoaGlzdG9yeSA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAgaGlzdG9yeSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5hY3Rpb25zLmZvckVhY2goZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhY3Rpb24obWVzc2FnZSwgaW5zdGFuY2UsIGhpc3RvcnkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBCZWhhdmlvcjtcbiAgICB9KSgpO1xuICAgIFN0YXRlSlMuQmVoYXZpb3IgPSBCZWhhdmlvcjtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcclxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xyXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xyXG4gKi9cbnZhciBTdGF0ZUpTO1xuKGZ1bmN0aW9uIChTdGF0ZUpTKSB7XG4gICAgLyoqXHJcbiAgICAgKiBBbiBlbnVtZXJhdGlvbiBvZiBzdGF0aWMgY29uc3RhbnRzIHRoYXQgZGljdGF0ZXMgdGhlIHByZWNpc2UgYmVoYXZpb3VyIG9mIHBzZXVkbyBzdGF0ZXMuXHJcbiAgICAgKlxyXG4gICAgICogVXNlIHRoZXNlIGNvbnN0YW50cyBhcyB0aGUgYGtpbmRgIHBhcmFtZXRlciB3aGVuIGNyZWF0aW5nIG5ldyBgUHNldWRvU3RhdGVgIGluc3RhbmNlcy5cclxuICAgICAqIEBjbGFzcyBQc2V1ZG9TdGF0ZUtpbmRcclxuICAgICAqL1xuICAgIChmdW5jdGlvbiAoUHNldWRvU3RhdGVLaW5kKSB7XG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFVzZWQgZm9yIHBzZXVkbyBzdGF0ZXMgdGhhdCBhcmUgYWx3YXlzIHRoZSBzdGFyaW5nIHBvaW50IHdoZW4gZW50ZXJpbmcgdGhlaXIgcGFyZW50IHJlZ2lvbi5cclxuICAgICAgICAgKiBAbWVtYmVyIHtQc2V1ZG9TdGF0ZUtpbmR9IEluaXRpYWxcclxuICAgICAgICAgKi9cbiAgICAgICAgUHNldWRvU3RhdGVLaW5kW1BzZXVkb1N0YXRlS2luZFtcIkluaXRpYWxcIl0gPSAwXSA9IFwiSW5pdGlhbFwiO1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBVc2VkIGZvciBwc2V1ZG8gc3RhdGVzIHRoYXQgYXJlIHRoZSB0aGUgc3RhcnRpbmcgcG9pbnQgd2hlbiBlbnRlcmluZyB0aGVpciBwYXJlbnQgcmVnaW9uIGZvciB0aGUgZmlyc3QgdGltZTsgc3Vic2VxdWVudCBlbnRyaWVzIHdpbGwgc3RhcnQgYXQgdGhlIGxhc3Qga25vd24gc3RhdGUuXHJcbiAgICAgICAgICogQG1lbWJlciB7UHNldWRvU3RhdGVLaW5kfSBTaGFsbG93SGlzdG9yeVxyXG4gICAgICAgICAqL1xuICAgICAgICBQc2V1ZG9TdGF0ZUtpbmRbUHNldWRvU3RhdGVLaW5kW1wiU2hhbGxvd0hpc3RvcnlcIl0gPSAxXSA9IFwiU2hhbGxvd0hpc3RvcnlcIjtcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQXMgcGVyIGBTaGFsbG93SGlzdG9yeWAgYnV0IHRoZSBoaXN0b3J5IHNlbWFudGljIGNhc2NhZGVzIHRocm91Z2ggYWxsIGNoaWxkIHJlZ2lvbnMgaXJyZXNwZWN0aXZlIG9mIHRoZWlyIGluaXRpYWwgcHNldWRvIHN0YXRlIGtpbmQuXHJcbiAgICAgICAgICogQG1lbWJlciB7UHNldWRvU3RhdGVLaW5kfSBEZWVwSGlzdG9yeVxyXG4gICAgICAgICAqL1xuICAgICAgICBQc2V1ZG9TdGF0ZUtpbmRbUHNldWRvU3RhdGVLaW5kW1wiRGVlcEhpc3RvcnlcIl0gPSAyXSA9IFwiRGVlcEhpc3RvcnlcIjtcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRW5hYmxlcyBhIGR5bmFtaWMgY29uZGl0aW9uYWwgYnJhbmNoZXM7IHdpdGhpbiBhIGNvbXBvdW5kIHRyYW5zaXRpb24uXHJcbiAgICAgICAgICogQWxsIG91dGJvdW5kIHRyYW5zaXRpb24gZ3VhcmRzIGZyb20gYSBDaG9pY2UgYXJlIGV2YWx1YXRlZCB1cG9uIGVudGVyaW5nIHRoZSBQc2V1ZG9TdGF0ZTpcclxuICAgICAgICAgKiBpZiBhIHNpbmdsZSB0cmFuc2l0aW9uIGlzIGZvdW5kLCBpdCB3aWxsIGJlIHRyYXZlcnNlZDtcclxuICAgICAgICAgKiBpZiBtYW55IHRyYW5zaXRpb25zIGFyZSBmb3VuZCwgYW4gYXJiaXRhcnkgb25lIHdpbGwgYmUgc2VsZWN0ZWQgYW5kIHRyYXZlcnNlZDtcclxuICAgICAgICAgKiBpZiBub25lIGV2YWx1YXRlIHRydWUsIGFuZCB0aGVyZSBpcyBubyAnZWxzZSB0cmFuc2l0aW9uJyBkZWZpbmVkLCB0aGUgbWFjaGluZSBpcyBkZWVtZWQgaWxsZm9ybWVkIGFuZCBhbiBleGNlcHRpb24gd2lsbCBiZSB0aHJvd24uXHJcbiAgICAgICAgICogQG1lbWJlciB7UHNldWRvU3RhdGVLaW5kfSBDaG9pY2VcclxuICAgICAgICAgKi9cbiAgICAgICAgUHNldWRvU3RhdGVLaW5kW1BzZXVkb1N0YXRlS2luZFtcIkNob2ljZVwiXSA9IDNdID0gXCJDaG9pY2VcIjtcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRW5hYmxlcyBhIHN0YXRpYyBjb25kaXRpb25hbCBicmFuY2hlczsgd2l0aGluIGEgY29tcG91bmQgdHJhbnNpdGlvbi5cclxuICAgICAgICAgKiBBbGwgb3V0Ym91bmQgdHJhbnNpdGlvbiBndWFyZHMgZnJvbSBhIENob2ljZSBhcmUgZXZhbHVhdGVkIHVwb24gZW50ZXJpbmcgdGhlIFBzZXVkb1N0YXRlOlxyXG4gICAgICAgICAqIGlmIGEgc2luZ2xlIHRyYW5zaXRpb24gaXMgZm91bmQsIGl0IHdpbGwgYmUgdHJhdmVyc2VkO1xyXG4gICAgICAgICAqIGlmIG1hbnkgb3Igbm9uZSBldmFsdWF0ZSB0cnVlLCBhbmQgdGhlcmUgaXMgbm8gJ2Vsc2UgdHJhbnNpdGlvbicgZGVmaW5lZCwgdGhlIG1hY2hpbmUgaXMgZGVlbWVkIGlsbGZvcm1lZCBhbmQgYW4gZXhjZXB0aW9uIHdpbGwgYmUgdGhyb3duLlxyXG4gICAgICAgICAqIEBtZW1iZXIge1BzZXVkb1N0YXRlS2luZH0gSnVuY3Rpb25cclxuICAgICAgICAgKi9cbiAgICAgICAgUHNldWRvU3RhdGVLaW5kW1BzZXVkb1N0YXRlS2luZFtcIkp1bmN0aW9uXCJdID0gNF0gPSBcIkp1bmN0aW9uXCI7XG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEVudGVyaW5nIGEgdGVybWluYXRlIGBQc2V1ZG9TdGF0ZWAgaW1wbGllcyB0aGF0IHRoZSBleGVjdXRpb24gb2YgdGhpcyBzdGF0ZSBtYWNoaW5lIGJ5IG1lYW5zIG9mIGl0cyBzdGF0ZSBvYmplY3QgaXMgdGVybWluYXRlZC5cclxuICAgICAgICAgKiBAbWVtYmVyIHtQc2V1ZG9TdGF0ZUtpbmR9IFRlcm1pbmF0ZVxyXG4gICAgICAgICAqL1xuICAgICAgICBQc2V1ZG9TdGF0ZUtpbmRbUHNldWRvU3RhdGVLaW5kW1wiVGVybWluYXRlXCJdID0gNV0gPSBcIlRlcm1pbmF0ZVwiO1xuICAgIH0pKFN0YXRlSlMuUHNldWRvU3RhdGVLaW5kIHx8IChTdGF0ZUpTLlBzZXVkb1N0YXRlS2luZCA9IHt9KSk7XG4gICAgdmFyIFBzZXVkb1N0YXRlS2luZCA9IFN0YXRlSlMuUHNldWRvU3RhdGVLaW5kO1xufSkoU3RhdGVKUyB8fCAoU3RhdGVKUyA9IHt9KSk7XG4vKlxyXG4gKiBGaW5pdGUgc3RhdGUgbWFjaGluZSBsaWJyYXJ5XHJcbiAqIENvcHlyaWdodCAoYykgMjAxNC01IFN0ZWVsYnJlZXplIExpbWl0ZWRcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBhbmQgR1BMIHYzIGxpY2VuY2VzXHJcbiAqIGh0dHA6Ly93d3cuc3RlZWxicmVlemUubmV0L3N0YXRlLmNzXHJcbiAqL1xudmFyIFN0YXRlSlM7XG4oZnVuY3Rpb24gKFN0YXRlSlMpIHtcbiAgICAvKipcclxuICAgICAqIEFuIGVudW1lcmF0aW9uIG9mIHN0YXRpYyBjb25zdGFudHMgdGhhdCBkaWN0YXRlcyB0aGUgcHJlY2lzZSBiZWhhdmlvdXIgb2YgdHJhbnNpdGlvbnMuXHJcbiAgICAgKlxyXG4gICAgICogVXNlIHRoZXNlIGNvbnN0YW50cyBhcyB0aGUgYGtpbmRgIHBhcmFtZXRlciB3aGVuIGNyZWF0aW5nIG5ldyBgVHJhbnNpdGlvbmAgaW5zdGFuY2VzLlxyXG4gICAgICogQGNsYXNzIFRyYW5zaXRpb25LaW5kXHJcbiAgICAgKi9cbiAgICAoZnVuY3Rpb24gKFRyYW5zaXRpb25LaW5kKSB7XG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoZSB0cmFuc2l0aW9uLCBpZiB0cmlnZ2VyZWQsIG9jY3VycyB3aXRob3V0IGV4aXRpbmcgb3IgZW50ZXJpbmcgdGhlIHNvdXJjZSBzdGF0ZS5cclxuICAgICAgICAgKiBUaHVzLCBpdCBkb2VzIG5vdCBjYXVzZSBhIHN0YXRlIGNoYW5nZS4gVGhpcyBtZWFucyB0aGF0IHRoZSBlbnRyeSBvciBleGl0IGNvbmRpdGlvbiBvZiB0aGUgc291cmNlIHN0YXRlIHdpbGwgbm90IGJlIGludm9rZWQuXHJcbiAgICAgICAgICogQW4gaW50ZXJuYWwgdHJhbnNpdGlvbiBjYW4gYmUgdGFrZW4gZXZlbiBpZiB0aGUgc3RhdGUgbWFjaGluZSBpcyBpbiBvbmUgb3IgbW9yZSByZWdpb25zIG5lc3RlZCB3aXRoaW4gdGhpcyBzdGF0ZS5cclxuICAgICAgICAgKiBAbWVtYmVyIHtUcmFuc2l0aW9uS2luZH0gSW50ZXJuYWxcclxuICAgICAgICAgKi9cbiAgICAgICAgVHJhbnNpdGlvbktpbmRbVHJhbnNpdGlvbktpbmRbXCJJbnRlcm5hbFwiXSA9IDBdID0gXCJJbnRlcm5hbFwiO1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGUgdHJhbnNpdGlvbiwgaWYgdHJpZ2dlcmVkLCB3aWxsIG5vdCBleGl0IHRoZSBjb21wb3NpdGUgKHNvdXJjZSkgc3RhdGUsIGJ1dCB3aWxsIGVudGVyIHRoZSBub24tYWN0aXZlIHRhcmdldCB2ZXJ0ZXggYW5jZXN0cnkuXHJcbiAgICAgICAgICogQG1lbWJlciB7VHJhbnNpdGlvbktpbmR9IExvY2FsXHJcbiAgICAgICAgICovXG4gICAgICAgIFRyYW5zaXRpb25LaW5kW1RyYW5zaXRpb25LaW5kW1wiTG9jYWxcIl0gPSAxXSA9IFwiTG9jYWxcIjtcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhlIHRyYW5zaXRpb24sIGlmIHRyaWdnZXJlZCwgd2lsbCBleGl0IHRoZSBzb3VyY2UgdmVydGV4LlxyXG4gICAgICAgICAqIEBtZW1iZXIge1RyYW5zaXRpb25LaW5kfSBFeHRlcm5hbFxyXG4gICAgICAgICAqL1xuICAgICAgICBUcmFuc2l0aW9uS2luZFtUcmFuc2l0aW9uS2luZFtcIkV4dGVybmFsXCJdID0gMl0gPSBcIkV4dGVybmFsXCI7XG4gICAgfSkoU3RhdGVKUy5UcmFuc2l0aW9uS2luZCB8fCAoU3RhdGVKUy5UcmFuc2l0aW9uS2luZCA9IHt9KSk7XG4gICAgdmFyIFRyYW5zaXRpb25LaW5kID0gU3RhdGVKUy5UcmFuc2l0aW9uS2luZDtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcclxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xyXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xyXG4gKi9cbnZhciBTdGF0ZUpTO1xuKGZ1bmN0aW9uIChTdGF0ZUpTKSB7XG4gICAgLyoqXHJcbiAgICAgKiBBbiBhYnN0cmFjdCBjbGFzcyB1c2VkIGFzIHRoZSBiYXNlIGZvciB0aGUgUmVnaW9uIGFuZCBWZXJ0ZXggY2xhc3Nlcy5cclxuICAgICAqIEFuIGVsZW1lbnQgaXMgYSBub2RlIHdpdGhpbiB0aGUgdHJlZSBzdHJ1Y3R1cmUgdGhhdCByZXByZXNlbnRzIGEgY29tcG9zaXRlIHN0YXRlIG1hY2hpbmUgbW9kZWwuXHJcbiAgICAgKiBAY2xhc3MgRWxlbWVudFxyXG4gICAgICovXG4gICAgdmFyIEVsZW1lbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBlbGVtZW50IGNsYXNzLlxyXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBlbGVtZW50LlxyXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBFbGVtZW50KG5hbWUsIHBhcmVudCkge1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgIHRoaXMucXVhbGlmaWVkTmFtZSA9IHBhcmVudCA/IHBhcmVudC5xdWFsaWZpZWROYW1lICsgRWxlbWVudC5uYW1lc3BhY2VTZXBhcmF0b3IgKyBuYW1lIDogbmFtZTtcbiAgICAgICAgfVxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIGEgdGhlIGVsZW1lbnQgbmFtZSBhcyBhIGZ1bGx5IHF1YWxpZmllZCBuYW1lc3BhY2UuXHJcbiAgICAgICAgICogQG1ldGhvZCB0b1N0cmluZ1xyXG4gICAgICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICAgICAgICovXG4gICAgICAgIEVsZW1lbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVhbGlmaWVkTmFtZTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhlIHN5bWJvbCB1c2VkIHRvIHNlcGFyYXRlIGVsZW1lbnQgbmFtZXMgd2l0aGluIGEgZnVsbHkgcXVhbGlmaWVkIG5hbWUuXHJcbiAgICAgICAgICogQ2hhbmdlIHRoaXMgc3RhdGljIG1lbWJlciB0byBjcmVhdGUgZGlmZmVyZW50IHN0eWxlcyBvZiBxdWFsaWZpZWQgbmFtZSBnZW5lcmF0ZWQgYnkgdGhlIHRvU3RyaW5nIG1ldGhvZC5cclxuICAgICAgICAgKiBAbWVtYmVyIHtzdHJpbmd9XHJcbiAgICAgICAgICovXG4gICAgICAgIEVsZW1lbnQubmFtZXNwYWNlU2VwYXJhdG9yID0gXCIuXCI7XG4gICAgICAgIHJldHVybiBFbGVtZW50O1xuICAgIH0pKCk7XG4gICAgU3RhdGVKUy5FbGVtZW50ID0gRWxlbWVudDtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xudmFyIF9fZXh0ZW5kcyA9IHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHtcbiAgICAgICAgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7XG4gICAgfVxuICAgIF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlO1xuICAgIGQucHJvdG90eXBlID0gbmV3IF9fKCk7XG59O1xuLypcclxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xyXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xyXG4gKi9cbnZhciBTdGF0ZUpTO1xuKGZ1bmN0aW9uIChTdGF0ZUpTKSB7XG4gICAgLyoqXHJcbiAgICAgKiBBbiBlbGVtZW50IHdpdGhpbiBhIHN0YXRlIG1hY2hpbmUgbW9kZWwgdGhhdCBpcyBhIGNvbnRhaW5lciBvZiBWZXJ0aWNlcy5cclxuICAgICAqXHJcbiAgICAgKiBSZWdpb25zIGFyZSBpbXBsaWNpdGx5IGluc2VydGVkIGludG8gY29tcG9zaXRlIHN0YXRlIG1hY2hpbmVzIGFzIGEgY29udGFpbmVyIGZvciB2ZXJ0aWNlcy5cclxuICAgICAqIFRoZXkgb25seSBuZWVkIHRvIGJlIGV4cGxpY2l0bHkgZGVmaW5lZCBpZiBvcnRob2dvbmFsIHN0YXRlcyBhcmUgcmVxdWlyZWQuXHJcbiAgICAgKlxyXG4gICAgICogUmVnaW9uIGV4dGVuZHMgdGhlIEVsZW1lbnQgY2xhc3MgYW5kIGluaGVyaXRzIGl0cyBwdWJsaWMgaW50ZXJmYWNlLlxyXG4gICAgICogQGNsYXNzIFJlZ2lvblxyXG4gICAgICogQGF1Z21lbnRzIEVsZW1lbnRcclxuICAgICAqL1xuICAgIHZhciBSZWdpb24gPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgICAgICBfX2V4dGVuZHMoUmVnaW9uLCBfc3VwZXIpO1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBSZWdpb24gY2xhc3MuXHJcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHJlZ2lvbi5cclxuICAgICAgICAgKiBAcGFyYW0ge1N0YXRlfSBzdGF0ZSBUaGUgcGFyZW50IHN0YXRlIHRoYXQgdGhpcyByZWdpb24gd2lsbCBiZSBhIGNoaWxkIG9mLlxyXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBSZWdpb24obmFtZSwgc3RhdGUpIHtcbiAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIG5hbWUsIHN0YXRlKTtcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBUaGUgc2V0IG9mIHZlcnRpY2VzIHRoYXQgYXJlIGNoaWxkcmVuIG9mIHRoZSByZWdpb24uXHJcbiAgICAgICAgICAgICAqIEBtZW1iZXIge0FycmF5PFZlcnRleD59XHJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy52ZXJ0aWNlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5yZWdpb25zLnB1c2godGhpcyk7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmdldFJvb3QoKS5jbGVhbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJldHVybnMgdGhlIHJvb3QgZWxlbWVudCB3aXRoaW4gdGhlIHN0YXRlIG1hY2hpbmUgbW9kZWwuXHJcbiAgICAgICAgICogQG1ldGhvZCBnZXRSb290XHJcbiAgICAgICAgICogQHJldHVybnMge1N0YXRlTWFjaGluZX0gVGhlIHJvb3Qgc3RhdGUgbWFjaGluZSBlbGVtZW50LlxyXG4gICAgICAgICAqL1xuICAgICAgICBSZWdpb24ucHJvdG90eXBlLmdldFJvb3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5nZXRSb290KCk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEFjY2VwdHMgYW4gaW5zdGFuY2Ugb2YgYSB2aXNpdG9yIGFuZCBjYWxscyB0aGUgdmlzaXRSZWdpb24gbWV0aG9kIG9uIGl0LlxyXG4gICAgICAgICAqIEBtZXRob2QgYWNjZXB0XHJcbiAgICAgICAgICogQHBhcmFtIHtWaXNpdG9yPFRBcmcxPn0gdmlzaXRvciBUaGUgdmlzaXRvciBpbnN0YW5jZS5cclxuICAgICAgICAgKiBAcGFyYW0ge1RBcmcxfSBhcmcxIEFuIG9wdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgaW50byB0aGUgdmlzaXRvci5cclxuICAgICAgICAgKiBAcGFyYW0ge2FueX0gYXJnMiBBbiBvcHRpb25hbCBhcmd1bWVudCB0byBwYXNzIGludG8gdGhlIHZpc2l0b3IuXHJcbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzMgQW4gb3B0aW9uYWwgYXJndW1lbnQgdG8gcGFzcyBpbnRvIHRoZSB2aXNpdG9yLlxyXG4gICAgICAgICAqIEByZXR1cm5zIHthbnl9IEFueSB2YWx1ZSBjYW4gYmUgcmV0dXJuZWQgYnkgdGhlIHZpc2l0b3IuXHJcbiAgICAgICAgICovXG4gICAgICAgIFJlZ2lvbi5wcm90b3R5cGUuYWNjZXB0ID0gZnVuY3Rpb24gKHZpc2l0b3IsIGFyZzEsIGFyZzIsIGFyZzMpIHtcbiAgICAgICAgICAgIHJldHVybiB2aXNpdG9yLnZpc2l0UmVnaW9uKHRoaXMsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGUgbmFtZSBnaXZlbiB0byByZWdpb25zIHRoYXQgYXJlIGFyZSBjcmVhdGVkIGF1dG9tYXRpY2FsbHkgd2hlbiBhIHN0YXRlIGlzIHBhc3NlZCBhcyBhIHZlcnRleCdzIHBhcmVudC5cclxuICAgICAgICAgKiBSZWdpb25zIGFyZSBhdXRvbWF0aWNhbGx5IGluc2VydGVkIGludG8gc3RhdGUgbWFjaGluZSBtb2RlbHMgYXMgdGhlIGNvbXBvc2l0ZSBzdHJ1Y3R1cmUgaXMgYnVpbHQ7IHRoZXkgYXJlIG5hbWVkIHVzaW5nIHRoaXMgc3RhdGljIG1lbWJlci5cclxuICAgICAgICAgKiBVcGRhdGUgdGhpcyBzdGF0aWMgbWVtYmVyIHRvIHVzZSBhIGRpZmZlcmVudCBuYW1lIGZvciBkZWZhdWx0IHJlZ2lvbnMuXHJcbiAgICAgICAgICogQG1lbWJlciB7c3RyaW5nfVxyXG4gICAgICAgICAqL1xuICAgICAgICBSZWdpb24uZGVmYXVsdE5hbWUgPSBcImRlZmF1bHRcIjtcbiAgICAgICAgcmV0dXJuIFJlZ2lvbjtcbiAgICB9KShTdGF0ZUpTLkVsZW1lbnQpO1xuICAgIFN0YXRlSlMuUmVnaW9uID0gUmVnaW9uO1xufSkoU3RhdGVKUyB8fCAoU3RhdGVKUyA9IHt9KSk7XG4vKlxyXG4gKiBGaW5pdGUgc3RhdGUgbWFjaGluZSBsaWJyYXJ5XHJcbiAqIENvcHlyaWdodCAoYykgMjAxNC01IFN0ZWVsYnJlZXplIExpbWl0ZWRcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBhbmQgR1BMIHYzIGxpY2VuY2VzXHJcbiAqIGh0dHA6Ly93d3cuc3RlZWxicmVlemUubmV0L3N0YXRlLmNzXHJcbiAqL1xudmFyIFN0YXRlSlM7XG4oZnVuY3Rpb24gKFN0YXRlSlMpIHtcbiAgICAvKipcclxuICAgICAqIEFuIGFic3RyYWN0IGVsZW1lbnQgd2l0aGluIGEgc3RhdGUgbWFjaGluZSBtb2RlbCB0aGF0IGNhbiBiZSB0aGUgc291cmNlIG9yIHRhcmdldCBvZiBhIHRyYW5zaXRpb24gKHN0YXRlcyBhbmQgcHNldWRvIHN0YXRlcykuXHJcbiAgICAgKlxyXG4gICAgICogVmVydGV4IGV4dGVuZHMgdGhlIEVsZW1lbnQgY2xhc3MgYW5kIGluaGVyaXRzIGl0cyBwdWJsaWMgaW50ZXJmYWNlLlxyXG4gICAgICogQGNsYXNzIFZlcnRleFxyXG4gICAgICogQGF1Z21lbnRzIEVsZW1lbnRcclxuICAgICAqL1xuICAgIHZhciBWZXJ0ZXggPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgICAgICBfX2V4dGVuZHMoVmVydGV4LCBfc3VwZXIpO1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBWZXJ0ZXggY2xhc3MuXHJcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHZlcnRleC5cclxuICAgICAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IHBhcmVudCBUaGUgcGFyZW50IHJlZ2lvbiBvciBzdGF0ZS5cclxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gVmVydGV4KG5hbWUsIHBhcmVudCkge1xuICAgICAgICAgICAgX3N1cGVyLmNhbGwodGhpcywgbmFtZSwgcGFyZW50ID0gcGFyZW50IGluc3RhbmNlb2YgU3RhdGVKUy5TdGF0ZSA/IHBhcmVudC5kZWZhdWx0UmVnaW9uKCkgOiBwYXJlbnQpOyAvLyBUT0RPOiBmaW5kIGEgY2xlYW5lciB3YXkgdG8gbWFuYWdlIGltcGxpY2l0IGNvbnZlcnNpb25cbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBUaGUgc2V0IG9mIHRyYW5zaXRpb25zIGZyb20gdGhpcyB2ZXJ0ZXguXHJcbiAgICAgICAgICAgICAqIEBtZW1iZXIge0FycmF5PFRyYW5zaXRpb24+fVxyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMub3V0Z29pbmcgPSBbXTtcbiAgICAgICAgICAgIHRoaXMucmVnaW9uID0gcGFyZW50OyAvLyBOT1RFOiBwYXJlbnQgd2lsbCBiZSBhIFJlZ2lvbiBkdWUgdG8gdGhlIGNvbmRpdGlvbmFsIGxvZ2ljIGluIHRoZSBzdXBlciBjYWxsIGFib3ZlXG4gICAgICAgICAgICBpZiAodGhpcy5yZWdpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lvbi52ZXJ0aWNlcy5wdXNoKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVnaW9uLmdldFJvb3QoKS5jbGVhbiA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJldHVybnMgdGhlIHJvb3QgZWxlbWVudCB3aXRoaW4gdGhlIHN0YXRlIG1hY2hpbmUgbW9kZWwuXHJcbiAgICAgICAgICogQG1ldGhvZCBnZXRSb290XHJcbiAgICAgICAgICogQHJldHVybnMge1N0YXRlTWFjaGluZX0gVGhlIHJvb3Qgc3RhdGUgbWFjaGluZSBlbGVtZW50LlxyXG4gICAgICAgICAqL1xuICAgICAgICBWZXJ0ZXgucHJvdG90eXBlLmdldFJvb3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWdpb24uZ2V0Um9vdCgpOyAvLyBOT1RFOiBuZWVkIHRvIGtlZXAgdGhpcyBkeW5hbWljIGFzIGEgc3RhdGUgbWFjaGluZSBtYXkgYmUgZW1iZWRkZWQgd2l0aGluIGFub3RoZXJcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ3JlYXRlcyBhIG5ldyB0cmFuc2l0aW9uIGZyb20gdGhpcyB2ZXJ0ZXguXHJcbiAgICAgICAgICogTmV3bHkgY3JlYXRlZCB0cmFuc2l0aW9ucyBhcmUgY29tcGxldGlvbiB0cmFuc2l0aW9uczsgdGhleSB3aWxsIGJlIGV2YWx1YXRlZCBhZnRlciBhIHZlcnRleCBoYXMgYmVlbiBlbnRlcmVkIGlmIGl0IGlzIGRlZW1lZCB0byBiZSBjb21wbGV0ZS5cclxuICAgICAgICAgKiBUcmFuc2l0aW9ucyBjYW4gYmUgY29udmVydGVkIHRvIGJlIGV2ZW50IHRyaWdnZXJlZCBieSBhZGRpbmcgYSBndWFyZCBjb25kaXRpb24gdmlhIHRoZSB0cmFuc2l0aW9ucyBgd2hlcmVgIG1ldGhvZC5cclxuICAgICAgICAgKiBAbWV0aG9kIHRvXHJcbiAgICAgICAgICogQHBhcmFtIHtWZXJ0ZXh9IHRhcmdldCBUaGUgZGVzdGluYXRpb24gb2YgdGhlIHRyYW5zaXRpb247IG9taXQgZm9yIGludGVybmFsIHRyYW5zaXRpb25zLlxyXG4gICAgICAgICAqIEBwYXJhbSB7VHJhbnNpdGlvbktpbmR9IGtpbmQgVGhlIGtpbmQgdGhlIHRyYW5zaXRpb247IHVzZSB0aGlzIHRvIHNldCBMb2NhbCBvciBFeHRlcm5hbCAodGhlIGRlZmF1bHQgaWYgb21pdHRlZCkgdHJhbnNpdGlvbiBzZW1hbnRpY3MuXHJcbiAgICAgICAgICogQHJldHVybnMge1RyYW5zaXRpb259IFRoZSBuZXcgdHJhbnNpdGlvbiBvYmplY3QuXHJcbiAgICAgICAgICovXG4gICAgICAgIFZlcnRleC5wcm90b3R5cGUudG8gPSBmdW5jdGlvbiAodGFyZ2V0LCBraW5kKSB7XG4gICAgICAgICAgICBpZiAoa2luZCA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAga2luZCA9IFN0YXRlSlMuVHJhbnNpdGlvbktpbmQuRXh0ZXJuYWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IFN0YXRlSlMuVHJhbnNpdGlvbih0aGlzLCB0YXJnZXQsIGtpbmQpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBBY2NlcHRzIGFuIGluc3RhbmNlIG9mIGEgdmlzaXRvci5cclxuICAgICAgICAgKiBAbWV0aG9kIGFjY2VwdFxyXG4gICAgICAgICAqIEBwYXJhbSB7VmlzaXRvcjxUQXJnPn0gdmlzaXRvciBUaGUgdmlzaXRvciBpbnN0YW5jZS5cclxuICAgICAgICAgKiBAcGFyYW0ge1RBcmd9IGFyZyBBbiBvcHRpb25hbCBhcmd1bWVudCB0byBwYXNzIGludG8gdGhlIHZpc2l0b3IuXHJcbiAgICAgICAgICogQHJldHVybnMge2FueX0gQW55IHZhbHVlIGNhbiBiZSByZXR1cm5lZCBieSB0aGUgdmlzaXRvci5cclxuICAgICAgICAgKi9cbiAgICAgICAgVmVydGV4LnByb3RvdHlwZS5hY2NlcHQgPSBmdW5jdGlvbiAodmlzaXRvciwgYXJnMSwgYXJnMiwgYXJnMykge307XG4gICAgICAgIHJldHVybiBWZXJ0ZXg7XG4gICAgfSkoU3RhdGVKUy5FbGVtZW50KTtcbiAgICBTdGF0ZUpTLlZlcnRleCA9IFZlcnRleDtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcclxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xyXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xyXG4gKi9cbnZhciBTdGF0ZUpTO1xuKGZ1bmN0aW9uIChTdGF0ZUpTKSB7XG4gICAgLyoqXHJcbiAgICAgKiBBbiBlbGVtZW50IHdpdGhpbiBhIHN0YXRlIG1hY2hpbmUgbW9kZWwgdGhhdCByZXByZXNlbnRzIGFuIHRyYW5zaXRvcnkgVmVydGV4IHdpdGhpbiB0aGUgc3RhdGUgbWFjaGluZSBtb2RlbC5cclxuICAgICAqXHJcbiAgICAgKiBQc2V1ZG8gc3RhdGVzIGFyZSByZXF1aXJlZCBpbiBhbGwgc3RhdGUgbWFjaGluZSBtb2RlbHM7IGF0IHRoZSB2ZXJ5IGxlYXN0LCBhbiBgSW5pdGlhbGAgcHNldWRvIHN0YXRlIGlzIHRoZSBkZWZhdWx0IHN0YXRpbmcgc3RhdGUgd2hlbiB0aGUgcGFyZW50IHJlZ2lvbiBpcyBlbnRlcmVkLlxyXG4gICAgICogT3RoZXIgdHlwZXMgb2YgcHNldWRvIHN0YXRlIGFyZSBhdmFpbGFibGU7IHR5cGljYWxseSBmb3IgZGVmaW5pbmcgaGlzdG9yeSBzZW1hbnRpY3Mgb3IgdG8gZmFjaWxpdGF0ZSBtb3JlIGNvbXBsZXggdHJhbnNpdGlvbnMuXHJcbiAgICAgKiBBIGBUZXJtaW5hdGVgIHBzZXVkbyBzdGF0ZSBraW5kIGlzIGFsc28gYXZhaWxhYmxlIHRvIGltbWVkaWF0ZWx5IHRlcm1pbmF0ZSBwcm9jZXNzaW5nIHdpdGhpbiB0aGUgZW50aXJlIHN0YXRlIG1hY2hpbmUgaW5zdGFuY2UuXHJcbiAgICAgKlxyXG4gICAgICogUHNldWRvU3RhdGUgZXh0ZW5kcyB0aGUgVmVydGV4IGNsYXNzIGFuZCBpbmhlcml0cyBpdHMgcHVibGljIGludGVyZmFjZS5cclxuICAgICAqIEBjbGFzcyBQc2V1ZG9TdGF0ZVxyXG4gICAgICogQGF1Z21lbnRzIFZlcnRleFxyXG4gICAgICovXG4gICAgdmFyIFBzZXVkb1N0YXRlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICAgICAgX19leHRlbmRzKFBzZXVkb1N0YXRlLCBfc3VwZXIpO1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBQc2V1ZG9TdGF0ZSBjbGFzcy5cclxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcHNldWRvIHN0YXRlLlxyXG4gICAgICAgICAqIEBwYXJhbSB7RWxlbWVudH0gcGFyZW50IFRoZSBwYXJlbnQgZWxlbWVudCB0aGF0IHRoaXMgcHNldWRvIHN0YXRlIHdpbGwgYmUgYSBjaGlsZCBvZi5cclxuICAgICAgICAgKiBAcGFyYW0ge1BzZXVkb1N0YXRlS2luZH0ga2luZCBEZXRlcm1pbmVzIHRoZSBiZWhhdmlvdXIgb2YgdGhlIFBzZXVkb1N0YXRlLlxyXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBQc2V1ZG9TdGF0ZShuYW1lLCBwYXJlbnQsIGtpbmQpIHtcbiAgICAgICAgICAgIGlmIChraW5kID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgICAgICBraW5kID0gU3RhdGVKUy5Qc2V1ZG9TdGF0ZUtpbmQuSW5pdGlhbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIG5hbWUsIHBhcmVudCk7XG4gICAgICAgICAgICB0aGlzLmtpbmQgPSBraW5kO1xuICAgICAgICB9XG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRlc3RzIGEgcHNldWRvIHN0YXRlIHRvIGRldGVybWluZSBpZiBpdCBpcyBhIGhpc3RvcnkgcHNldWRvIHN0YXRlLlxyXG4gICAgICAgICAqIEhpc3RvcnkgcHNldWRvIHN0YXRlcyBhcmUgb2Yga2luZDogSW5pdGlhbCwgU2hhbGxvd0hpc29yeSwgb3IgRGVlcEhpc3RvcnkuXHJcbiAgICAgICAgICogQG1ldGhvZCBpc0hpc3RvcnlcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgcHNldWRvIHN0YXRlIGlzIGEgaGlzdG9yeSBwc2V1ZG8gc3RhdGUuXHJcbiAgICAgICAgICovXG4gICAgICAgIFBzZXVkb1N0YXRlLnByb3RvdHlwZS5pc0hpc3RvcnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5raW5kID09PSBTdGF0ZUpTLlBzZXVkb1N0YXRlS2luZC5EZWVwSGlzdG9yeSB8fCB0aGlzLmtpbmQgPT09IFN0YXRlSlMuUHNldWRvU3RhdGVLaW5kLlNoYWxsb3dIaXN0b3J5O1xuICAgICAgICB9O1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBUZXN0cyBhIHBzZXVkbyBzdGF0ZSB0byBkZXRlcm1pbmUgaWYgaXQgaXMgYW4gaW5pdGlhbCBwc2V1ZG8gc3RhdGUuXHJcbiAgICAgICAgICogSW5pdGlhbCBwc2V1ZG8gc3RhdGVzIGFyZSBvZiBraW5kOiBJbml0aWFsLCBTaGFsbG93SGlzb3J5LCBvciBEZWVwSGlzdG9yeS5cclxuICAgICAgICAgKiBAbWV0aG9kIGlzSW5pdGlhbFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBwc2V1ZG8gc3RhdGUgaXMgYW4gaW5pdGlhbCBwc2V1ZG8gc3RhdGUuXHJcbiAgICAgICAgICovXG4gICAgICAgIFBzZXVkb1N0YXRlLnByb3RvdHlwZS5pc0luaXRpYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5raW5kID09PSBTdGF0ZUpTLlBzZXVkb1N0YXRlS2luZC5Jbml0aWFsIHx8IHRoaXMuaXNIaXN0b3J5KCk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEFjY2VwdHMgYW4gaW5zdGFuY2Ugb2YgYSB2aXNpdG9yIGFuZCBjYWxscyB0aGUgdmlzaXRQc2V1ZG9TdGF0ZSBtZXRob2Qgb24gaXQuXHJcbiAgICAgICAgICogQG1ldGhvZCBhY2NlcHRcclxuICAgICAgICAgKiBAcGFyYW0ge1Zpc2l0b3I8VEFyZzE+fSB2aXNpdG9yIFRoZSB2aXNpdG9yIGluc3RhbmNlLlxyXG4gICAgICAgICAqIEBwYXJhbSB7VEFyZzF9IGFyZzEgQW4gb3B0aW9uYWwgYXJndW1lbnQgdG8gcGFzcyBpbnRvIHRoZSB2aXNpdG9yLlxyXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmcyIEFuIG9wdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgaW50byB0aGUgdmlzaXRvci5cclxuICAgICAgICAgKiBAcGFyYW0ge2FueX0gYXJnMyBBbiBvcHRpb25hbCBhcmd1bWVudCB0byBwYXNzIGludG8gdGhlIHZpc2l0b3IuXHJcbiAgICAgICAgICogQHJldHVybnMge2FueX0gQW55IHZhbHVlIGNhbiBiZSByZXR1cm5lZCBieSB0aGUgdmlzaXRvci5cclxuICAgICAgICAgKi9cbiAgICAgICAgUHNldWRvU3RhdGUucHJvdG90eXBlLmFjY2VwdCA9IGZ1bmN0aW9uICh2aXNpdG9yLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gICAgICAgICAgICByZXR1cm4gdmlzaXRvci52aXNpdFBzZXVkb1N0YXRlKHRoaXMsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gUHNldWRvU3RhdGU7XG4gICAgfSkoU3RhdGVKUy5WZXJ0ZXgpO1xuICAgIFN0YXRlSlMuUHNldWRvU3RhdGUgPSBQc2V1ZG9TdGF0ZTtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcclxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xyXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xyXG4gKi9cbnZhciBTdGF0ZUpTO1xuKGZ1bmN0aW9uIChTdGF0ZUpTKSB7XG4gICAgLyoqXHJcbiAgICAgKiBBbiBlbGVtZW50IHdpdGhpbiBhIHN0YXRlIG1hY2hpbmUgbW9kZWwgdGhhdCByZXByZXNlbnRzIGFuIGludmFyaWFudCBjb25kaXRpb24gd2l0aGluIHRoZSBsaWZlIG9mIHRoZSBzdGF0ZSBtYWNoaW5lIGluc3RhbmNlLlxyXG4gICAgICpcclxuICAgICAqIFN0YXRlcyBhcmUgb25lIG9mIHRoZSBmdW5kYW1lbnRhbCBidWlsZGluZyBibG9ja3Mgb2YgdGhlIHN0YXRlIG1hY2hpbmUgbW9kZWwuXHJcbiAgICAgKiBCZWhhdmlvdXIgY2FuIGJlIGRlZmluZWQgZm9yIGJvdGggc3RhdGUgZW50cnkgYW5kIHN0YXRlIGV4aXQuXHJcbiAgICAgKlxyXG4gICAgICogU3RhdGUgZXh0ZW5kcyB0aGUgVmVydGV4IGNsYXNzIGFuZCBpbmhlcml0cyBpdHMgcHVibGljIGludGVyZmFjZS5cclxuICAgICAqIEBjbGFzcyBTdGF0ZVxyXG4gICAgICogQGF1Z21lbnRzIFZlcnRleFxyXG4gICAgICovXG4gICAgdmFyIFN0YXRlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICAgICAgX19leHRlbmRzKFN0YXRlLCBfc3VwZXIpO1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBTdGF0ZSBjbGFzcy5cclxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgc3RhdGUuXHJcbiAgICAgICAgICogQHBhcmFtIHtFbGVtZW50fSBwYXJlbnQgVGhlIHBhcmVudCBzdGF0ZSB0aGF0IG93bnMgdGhlIHN0YXRlLlxyXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBTdGF0ZShuYW1lLCBwYXJlbnQpIHtcbiAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIG5hbWUsIHBhcmVudCk7XG4gICAgICAgICAgICAvLyB1c2VyIGRlZmluZWQgYmVoYXZpb3VyICh2aWEgZXhpdCBtZXRob2QpIHRvIGV4ZWN1dGUgd2hlbiBleGl0aW5nIGEgc3RhdGUuXG4gICAgICAgICAgICB0aGlzLmV4aXRCZWhhdmlvciA9IG5ldyBTdGF0ZUpTLkJlaGF2aW9yKCk7XG4gICAgICAgICAgICAvLyB1c2VyIGRlZmluZWQgYmVoYXZpb3VyICh2aWEgZW50cnkgbWV0aG9kKSB0byBleGVjdXRlIHdoZW4gZW50ZXJpbmcgYSBzdGF0ZS5cbiAgICAgICAgICAgIHRoaXMuZW50cnlCZWhhdmlvciA9IG5ldyBTdGF0ZUpTLkJlaGF2aW9yKCk7XG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogVGhlIHNldCBvZiByZWdpb25zIHVuZGVyIHRoaXMgc3RhdGUuXHJcbiAgICAgICAgICAgICAqIEBtZW1iZXIge0FycmF5PFJlZ2lvbj59XHJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5yZWdpb25zID0gW107XG4gICAgICAgIH1cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmV0dXJucyB0aGUgZGVmYXVsdCByZWdpb24gZm9yIHRoZSBzdGF0ZS5cclxuICAgICAgICAgKiBOb3RlLCB0aGlzIHdpbGwgY3JlYXRlIHRoZSBkZWZhdWx0IHJlZ2lvbiBpZiBpdCBkb2VzIG5vdCBhbHJlYWR5IGV4aXN0LlxyXG4gICAgICAgICAqIEBtZXRob2QgZGVmYXVsdFJlZ2lvblxyXG4gICAgICAgICAqIEByZXR1cm5zIHtSZWdpb259IFRoZSBkZWZhdWx0IHJlZ2lvbi5cclxuICAgICAgICAgKi9cbiAgICAgICAgU3RhdGUucHJvdG90eXBlLmRlZmF1bHRSZWdpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWdpb25zLnJlZHVjZShmdW5jdGlvbiAocmVzdWx0LCByZWdpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVnaW9uLm5hbWUgPT09IFN0YXRlSlMuUmVnaW9uLmRlZmF1bHROYW1lID8gcmVnaW9uIDogcmVzdWx0O1xuICAgICAgICAgICAgfSwgdW5kZWZpbmVkKSB8fCBuZXcgU3RhdGVKUy5SZWdpb24oU3RhdGVKUy5SZWdpb24uZGVmYXVsdE5hbWUsIHRoaXMpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBUZXN0cyB0aGUgc3RhdGUgdG8gc2VlIGlmIGl0IGlzIGEgZmluYWwgc3RhdGU7XHJcbiAgICAgICAgICogYSBmaW5hbCBzdGF0ZSBpcyBvbmUgdGhhdCBoYXMgbm8gb3V0Ym91bmQgdHJhbnNpdGlvbnMuXHJcbiAgICAgICAgICogQG1ldGhvZCBpc0ZpbmFsXHJcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIHN0YXRlIGlzIGEgZmluYWwgc3RhdGUuXHJcbiAgICAgICAgICovXG4gICAgICAgIFN0YXRlLnByb3RvdHlwZS5pc0ZpbmFsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMub3V0Z29pbmcubGVuZ3RoID09PSAwO1xuICAgICAgICB9O1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBUZXN0cyB0aGUgc3RhdGUgdG8gc2VlIGlmIGl0IGlzIGEgc2ltcGxlIHN0YXRlO1xyXG4gICAgICAgICAqIGEgc2ltcGxlIHN0YXRlIGlzIG9uZSB0aGF0IGhhcyBubyBjaGlsZCByZWdpb25zLlxyXG4gICAgICAgICAqIEBtZXRob2QgaXNTaW1wbGVcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgc3RhdGUgaXMgYSBzaW1wbGUgc3RhdGUuXHJcbiAgICAgICAgICovXG4gICAgICAgIFN0YXRlLnByb3RvdHlwZS5pc1NpbXBsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZ2lvbnMubGVuZ3RoID09PSAwO1xuICAgICAgICB9O1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBUZXN0cyB0aGUgc3RhdGUgdG8gc2VlIGlmIGl0IGlzIGEgY29tcG9zaXRlIHN0YXRlO1xyXG4gICAgICAgICAqIGEgY29tcG9zaXRlIHN0YXRlIGlzIG9uZSB0aGF0IGhhcyBvbmUgb3IgbW9yZSBjaGlsZCByZWdpb25zLlxyXG4gICAgICAgICAqIEBtZXRob2QgaXNDb21wb3NpdGVcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgc3RhdGUgaXMgYSBjb21wb3NpdGUgc3RhdGUuXHJcbiAgICAgICAgICovXG4gICAgICAgIFN0YXRlLnByb3RvdHlwZS5pc0NvbXBvc2l0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZ2lvbnMubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGVzdHMgdGhlIHN0YXRlIHRvIHNlZSBpZiBpdCBpcyBhbiBvcnRob2dvbmFsIHN0YXRlO1xyXG4gICAgICAgICAqIGFuIG9ydGhvZ29uYWwgc3RhdGUgaXMgb25lIHRoYXQgaGFzIHR3byBvciBtb3JlIGNoaWxkIHJlZ2lvbnMuXHJcbiAgICAgICAgICogQG1ldGhvZCBpc09ydGhvZ29uYWxcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgc3RhdGUgaXMgYW4gb3J0aG9nb25hbCBzdGF0ZS5cclxuICAgICAgICAgKi9cbiAgICAgICAgU3RhdGUucHJvdG90eXBlLmlzT3J0aG9nb25hbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZ2lvbnMubGVuZ3RoID4gMTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQWRkcyBiZWhhdmlvdXIgdG8gYSBzdGF0ZSB0aGF0IGlzIGV4ZWN1dGVkIGVhY2ggdGltZSB0aGUgc3RhdGUgaXMgZXhpdGVkLlxyXG4gICAgICAgICAqIEBtZXRob2QgZXhpdFxyXG4gICAgICAgICAqIEBwYXJhbSB7QWN0aW9ufSBleGl0QWN0aW9uIFRoZSBhY3Rpb24gdG8gYWRkIHRvIHRoZSBzdGF0ZSdzIGV4aXQgYmVoYXZpb3VyLlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtTdGF0ZX0gUmV0dXJucyB0aGUgc3RhdGUgdG8gYWxsb3cgYSBmbHVlbnQgc3R5bGUgQVBJLlxyXG4gICAgICAgICAqL1xuICAgICAgICBTdGF0ZS5wcm90b3R5cGUuZXhpdCA9IGZ1bmN0aW9uIChleGl0QWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmV4aXRCZWhhdmlvci5wdXNoKGV4aXRBY3Rpb24pO1xuICAgICAgICAgICAgdGhpcy5nZXRSb290KCkuY2xlYW4gPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBBZGRzIGJlaGF2aW91ciB0byBhIHN0YXRlIHRoYXQgaXMgZXhlY3V0ZWQgZWFjaCB0aW1lIHRoZSBzdGF0ZSBpcyBlbnRlcmVkLlxyXG4gICAgICAgICAqIEBtZXRob2QgZW50cnlcclxuICAgICAgICAgKiBAcGFyYW0ge0FjdGlvbn0gZW50cnlBY3Rpb24gVGhlIGFjdGlvbiB0byBhZGQgdG8gdGhlIHN0YXRlJ3MgZW50cnkgYmVoYXZpb3VyLlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtTdGF0ZX0gUmV0dXJucyB0aGUgc3RhdGUgdG8gYWxsb3cgYSBmbHVlbnQgc3R5bGUgQVBJLlxyXG4gICAgICAgICAqL1xuICAgICAgICBTdGF0ZS5wcm90b3R5cGUuZW50cnkgPSBmdW5jdGlvbiAoZW50cnlBY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuZW50cnlCZWhhdmlvci5wdXNoKGVudHJ5QWN0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuZ2V0Um9vdCgpLmNsZWFuID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQWNjZXB0cyBhbiBpbnN0YW5jZSBvZiBhIHZpc2l0b3IgYW5kIGNhbGxzIHRoZSB2aXNpdFN0YXRlIG1ldGhvZCBvbiBpdC5cclxuICAgICAgICAgKiBAbWV0aG9kIGFjY2VwdFxyXG4gICAgICAgICAqIEBwYXJhbSB7VmlzaXRvcjxUQXJnMT59IHZpc2l0b3IgVGhlIHZpc2l0b3IgaW5zdGFuY2UuXHJcbiAgICAgICAgICogQHBhcmFtIHtUQXJnMX0gYXJnMSBBbiBvcHRpb25hbCBhcmd1bWVudCB0byBwYXNzIGludG8gdGhlIHZpc2l0b3IuXHJcbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzIgQW4gb3B0aW9uYWwgYXJndW1lbnQgdG8gcGFzcyBpbnRvIHRoZSB2aXNpdG9yLlxyXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmczIEFuIG9wdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgaW50byB0aGUgdmlzaXRvci5cclxuICAgICAgICAgKiBAcmV0dXJucyB7YW55fSBBbnkgdmFsdWUgY2FuIGJlIHJldHVybmVkIGJ5IHRoZSB2aXNpdG9yLlxyXG4gICAgICAgICAqL1xuICAgICAgICBTdGF0ZS5wcm90b3R5cGUuYWNjZXB0ID0gZnVuY3Rpb24gKHZpc2l0b3IsIGFyZzEsIGFyZzIsIGFyZzMpIHtcbiAgICAgICAgICAgIHJldHVybiB2aXNpdG9yLnZpc2l0U3RhdGUodGhpcywgYXJnMSwgYXJnMiwgYXJnMyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBTdGF0ZTtcbiAgICB9KShTdGF0ZUpTLlZlcnRleCk7XG4gICAgU3RhdGVKUy5TdGF0ZSA9IFN0YXRlO1xufSkoU3RhdGVKUyB8fCAoU3RhdGVKUyA9IHt9KSk7XG4vKlxyXG4gKiBGaW5pdGUgc3RhdGUgbWFjaGluZSBsaWJyYXJ5XHJcbiAqIENvcHlyaWdodCAoYykgMjAxNC01IFN0ZWVsYnJlZXplIExpbWl0ZWRcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBhbmQgR1BMIHYzIGxpY2VuY2VzXHJcbiAqIGh0dHA6Ly93d3cuc3RlZWxicmVlemUubmV0L3N0YXRlLmNzXHJcbiAqL1xudmFyIFN0YXRlSlM7XG4oZnVuY3Rpb24gKFN0YXRlSlMpIHtcbiAgICAvKipcclxuICAgICAqIEFuIGVsZW1lbnQgd2l0aGluIGEgc3RhdGUgbWFjaGluZSBtb2RlbCB0aGF0IHJlcHJlc2VudHMgY29tcGxldGlvbiBvZiB0aGUgbGlmZSBvZiB0aGUgY29udGFpbmluZyBSZWdpb24gd2l0aGluIHRoZSBzdGF0ZSBtYWNoaW5lIGluc3RhbmNlLlxyXG4gICAgICpcclxuICAgICAqIEEgZmluYWwgc3RhdGUgY2Fubm90IGhhdmUgb3V0Ym91bmQgdHJhbnNpdGlvbnMuXHJcbiAgICAgKlxyXG4gICAgICogRmluYWxTdGF0ZSBleHRlbmRzIHRoZSBTdGF0ZSBjbGFzcyBhbmQgaW5oZXJpdHMgaXRzIHB1YmxpYyBpbnRlcmZhY2UuXHJcbiAgICAgKiBAY2xhc3MgRmluYWxTdGF0ZVxyXG4gICAgICogQGF1Z21lbnRzIFN0YXRlXHJcbiAgICAgKi9cbiAgICB2YXIgRmluYWxTdGF0ZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgICAgIF9fZXh0ZW5kcyhGaW5hbFN0YXRlLCBfc3VwZXIpO1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBGaW5hbFN0YXRlIGNsYXNzLlxyXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBmaW5hbCBzdGF0ZS5cclxuICAgICAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IHBhcmVudCBUaGUgcGFyZW50IGVsZW1lbnQgdGhhdCBvd25zIHRoZSBmaW5hbCBzdGF0ZS5cclxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gRmluYWxTdGF0ZShuYW1lLCBwYXJlbnQpIHtcbiAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIG5hbWUsIHBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQWNjZXB0cyBhbiBpbnN0YW5jZSBvZiBhIHZpc2l0b3IgYW5kIGNhbGxzIHRoZSB2aXNpdEZpbmFsU3RhdGUgbWV0aG9kIG9uIGl0LlxyXG4gICAgICAgICAqIEBtZXRob2QgYWNjZXB0XHJcbiAgICAgICAgICogQHBhcmFtIHtWaXNpdG9yPFRBcmc+fSB2aXNpdG9yIFRoZSB2aXNpdG9yIGluc3RhbmNlLlxyXG4gICAgICAgICAqIEBwYXJhbSB7VEFyZ30gYXJnIEFuIG9wdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgaW50byB0aGUgdmlzaXRvci5cclxuICAgICAgICAgKiBAcmV0dXJucyB7YW55fSBBbnkgdmFsdWUgY2FuIGJlIHJldHVybmVkIGJ5IHRoZSB2aXNpdG9yLlxyXG4gICAgICAgICAqL1xuICAgICAgICBGaW5hbFN0YXRlLnByb3RvdHlwZS5hY2NlcHQgPSBmdW5jdGlvbiAodmlzaXRvciwgYXJnMSwgYXJnMiwgYXJnMykge1xuICAgICAgICAgICAgcmV0dXJuIHZpc2l0b3IudmlzaXRGaW5hbFN0YXRlKHRoaXMsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gRmluYWxTdGF0ZTtcbiAgICB9KShTdGF0ZUpTLlN0YXRlKTtcbiAgICBTdGF0ZUpTLkZpbmFsU3RhdGUgPSBGaW5hbFN0YXRlO1xufSkoU3RhdGVKUyB8fCAoU3RhdGVKUyA9IHt9KSk7XG4vKlxyXG4gKiBGaW5pdGUgc3RhdGUgbWFjaGluZSBsaWJyYXJ5XHJcbiAqIENvcHlyaWdodCAoYykgMjAxNC01IFN0ZWVsYnJlZXplIExpbWl0ZWRcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBhbmQgR1BMIHYzIGxpY2VuY2VzXHJcbiAqIGh0dHA6Ly93d3cuc3RlZWxicmVlemUubmV0L3N0YXRlLmNzXHJcbiAqL1xudmFyIFN0YXRlSlM7XG4oZnVuY3Rpb24gKFN0YXRlSlMpIHtcbiAgICAvKipcclxuICAgICAqIEFuIGVsZW1lbnQgd2l0aGluIGEgc3RhdGUgbWFjaGluZSBtb2RlbCB0aGF0IHJlcHJlc2VudHMgdGhlIHJvb3Qgb2YgdGhlIHN0YXRlIG1hY2hpbmUgbW9kZWwuXHJcbiAgICAgKlxyXG4gICAgICogU3RhdGVNYWNoaW5lIGV4dGVuZHMgdGhlIFN0YXRlIGNsYXNzIGFuZCBpbmhlcml0cyBpdHMgcHVibGljIGludGVyZmFjZS5cclxuICAgICAqIEBjbGFzcyBTdGF0ZU1hY2hpbmVcclxuICAgICAqIEBhdWdtZW50cyBTdGF0ZVxyXG4gICAgICovXG4gICAgdmFyIFN0YXRlTWFjaGluZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgICAgIF9fZXh0ZW5kcyhTdGF0ZU1hY2hpbmUsIF9zdXBlcik7XG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIFN0YXRlTWFjaGluZSBjbGFzcy5cclxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgc3RhdGUgbWFjaGluZS5cclxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gU3RhdGVNYWNoaW5lKG5hbWUpIHtcbiAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIG5hbWUsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAvLyBmbGFnIHVzZWQgdG8gaW5kaWNhdGUgdGhhdCB0aGUgc3RhdGUgbWFjaGluZSBtb2RlbCBoYXMgaGFzIHN0cnVjdHVyYWwgY2hhbmdlcyBhbmQgdGhlcmVmb3JlIHJlcXVpcmVzIGluaXRpYWxpc2luZy5cbiAgICAgICAgICAgIHRoaXMuY2xlYW4gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIHRoZSByb290IGVsZW1lbnQgd2l0aGluIHRoZSBzdGF0ZSBtYWNoaW5lIG1vZGVsLlxyXG4gICAgICAgICAqIE5vdGUgdGhhdCBpZiB0aGlzIHN0YXRlIG1hY2hpbmUgaXMgZW1iZWRlZCB3aXRoaW4gYW5vdGhlciBzdGF0ZSBtYWNoaW5lLCB0aGUgdWx0aW1hdGUgcm9vdCBlbGVtZW50IHdpbGwgYmUgcmV0dXJuZWQuXHJcbiAgICAgICAgICogQG1ldGhvZCBnZXRSb290XHJcbiAgICAgICAgICogQHJldHVybnMge1N0YXRlTWFjaGluZX0gVGhlIHJvb3Qgc3RhdGUgbWFjaGluZSBlbGVtZW50LlxyXG4gICAgICAgICAqL1xuICAgICAgICBTdGF0ZU1hY2hpbmUucHJvdG90eXBlLmdldFJvb3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWdpb24gPyB0aGlzLnJlZ2lvbi5nZXRSb290KCkgOiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBBY2NlcHRzIGFuIGluc3RhbmNlIG9mIGEgdmlzaXRvciBhbmQgY2FsbHMgdGhlIHZpc2l0U3RhdGVNYWNoaW5lIG1ldGhvZCBvbiBpdC5cclxuICAgICAgICAgKiBAbWV0aG9kIGFjY2VwdFxyXG4gICAgICAgICAqIEBwYXJhbSB7VmlzaXRvcjxUQXJnMT59IHZpc2l0b3IgVGhlIHZpc2l0b3IgaW5zdGFuY2UuXHJcbiAgICAgICAgICogQHBhcmFtIHtUQXJnMX0gYXJnMSBBbiBvcHRpb25hbCBhcmd1bWVudCB0byBwYXNzIGludG8gdGhlIHZpc2l0b3IuXHJcbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzIgQW4gb3B0aW9uYWwgYXJndW1lbnQgdG8gcGFzcyBpbnRvIHRoZSB2aXNpdG9yLlxyXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmczIEFuIG9wdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgaW50byB0aGUgdmlzaXRvci5cclxuICAgICAgICAgKiBAcmV0dXJucyB7YW55fSBBbnkgdmFsdWUgY2FuIGJlIHJldHVybmVkIGJ5IHRoZSB2aXNpdG9yLlxyXG4gICAgICAgICAqL1xuICAgICAgICBTdGF0ZU1hY2hpbmUucHJvdG90eXBlLmFjY2VwdCA9IGZ1bmN0aW9uICh2aXNpdG9yLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gICAgICAgICAgICByZXR1cm4gdmlzaXRvci52aXNpdFN0YXRlTWFjaGluZSh0aGlzLCBhcmcxLCBhcmcyLCBhcmczKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFN0YXRlTWFjaGluZTtcbiAgICB9KShTdGF0ZUpTLlN0YXRlKTtcbiAgICBTdGF0ZUpTLlN0YXRlTWFjaGluZSA9IFN0YXRlTWFjaGluZTtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcclxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xyXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xyXG4gKi9cbnZhciBTdGF0ZUpTO1xuKGZ1bmN0aW9uIChTdGF0ZUpTKSB7XG4gICAgLyoqXHJcbiAgICAgKiBBIHRyYW5zaXRpb24gYmV0d2VlbiB2ZXJ0aWNlcyAoc3RhdGVzIG9yIHBzZXVkbyBzdGF0ZXMpIHRoYXQgbWF5IGJlIHRyYXZlcnNlZCBpbiByZXNwb25zZSB0byBhIG1lc3NhZ2UuXHJcbiAgICAgKlxyXG4gICAgICogVHJhbnNpdGlvbnMgY29tZSBpbiBhIHZhcmlldHkgb2YgdHlwZXM6XHJcbiAgICAgKiBpbnRlcm5hbCB0cmFuc2l0aW9ucyByZXNwb25kIHRvIG1lc3NhZ2VzIGJ1dCBkbyBub3QgY2F1c2UgYSBzdGF0ZSB0cmFuc2l0aW9uLCB0aGV5IG9ubHkgaGF2ZSBiZWhhdmlvdXI7XHJcbiAgICAgKiBsb2NhbCB0cmFuc2l0aW9ucyBhcmUgY29udGFpbmVkIHdpdGhpbiBhIHNpbmdsZSByZWdpb24gdGhlcmVmb3JlIHRoZSBzb3VyY2UgdmVydGV4IGlzIGV4aXRlZCwgdGhlIHRyYW5zaXRpb24gdHJhdmVyc2VkLCBhbmQgdGhlIHRhcmdldCBzdGF0ZSBlbnRlcmVkO1xyXG4gICAgICogZXh0ZXJuYWwgdHJhbnNpdGlvbnMgYXJlIG1vcmUgY29tcGxleCBpbiBuYXR1cmUgYXMgdGhleSBjcm9zcyByZWdpb24gYm91bmRhcmllcywgYWxsIGVsZW1lbnRzIHVwIHRvIGJ1dCBub3Qgbm90IGluY2x1ZGluZyB0aGUgY29tbW9uIGFuY2VzdG9yIGFyZSBleGl0ZWQgYW5kIGVudGVyZWQuXHJcbiAgICAgKlxyXG4gICAgICogRW50ZXJpbmcgYSBjb21wb3NpdGUgc3RhdGUgd2lsbCBjYXVzZSB0aGUgZW50cnkgb2YgdGhlIGNoaWxkIHJlZ2lvbnMgd2l0aGluIHRoZSBjb21wb3NpdGUgc3RhdGU7IHRoaXMgaW4gdHVybiBtYXkgdHJpZ2dlciBtb3JlIHRyYW5zaXRpb25zLlxyXG4gICAgICogQGNsYXNzIFRyYW5zaXRpb25cclxuICAgICAqL1xuICAgIHZhciBUcmFuc2l0aW9uID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgVHJhbnNpdGlvbiBjbGFzcy5cclxuICAgICAgICAgKiBAcGFyYW0ge1ZlcnRleH0gc291cmNlIFRoZSBzb3VyY2Ugb2YgdGhlIHRyYW5zaXRpb24uXHJcbiAgICAgICAgICogQHBhcmFtIHtWZXJ0ZXh9IHNvdXJjZSBUaGUgdGFyZ2V0IG9mIHRoZSB0cmFuc2l0aW9uOyB0aGlzIGlzIGFuIG9wdGlvbmFsIHBhcmFtZXRlciwgb21pdHRpbmcgaXQgd2lsbCBjcmVhdGUgYW4gSW50ZXJuYWwgdHJhbnNpdGlvbi5cclxuICAgICAgICAgKiBAcGFyYW0ge1RyYW5zaXRpb25LaW5kfSBraW5kIFRoZSBraW5kIHRoZSB0cmFuc2l0aW9uOyB1c2UgdGhpcyB0byBzZXQgTG9jYWwgb3IgRXh0ZXJuYWwgKHRoZSBkZWZhdWx0IGlmIG9taXR0ZWQpIHRyYW5zaXRpb24gc2VtYW50aWNzLlxyXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBUcmFuc2l0aW9uKHNvdXJjZSwgdGFyZ2V0LCBraW5kKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgaWYgKGtpbmQgPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICAgIGtpbmQgPSBTdGF0ZUpTLlRyYW5zaXRpb25LaW5kLkV4dGVybmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdXNlciBkZWZpbmVkIGJlaGF2aW91ciAodmlhIGVmZmVjdCkgZXhlY3V0ZWQgd2hlbiB0cmF2ZXJzaW5nIHRoaXMgdHJhbnNpdGlvbi5cbiAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbkJlaGF2aW9yID0gbmV3IFN0YXRlSlMuQmVoYXZpb3IoKTtcbiAgICAgICAgICAgIC8vIHRoZSBjb2xsZWN0ZWQgYWN0aW9ucyB0byBwZXJmb3JtIHdoZW4gdHJhdmVyc2luZyB0aGUgdHJhbnNpdGlvbiAoaW5jbHVkZXMgZXhpdGluZyBzdGF0ZXMsIHRyYXZlcnNhbCwgYW5kIHN0YXRlIGVudHJ5KVxuICAgICAgICAgICAgdGhpcy5vblRyYXZlcnNlID0gbmV3IFN0YXRlSlMuQmVoYXZpb3IoKTtcbiAgICAgICAgICAgIHRoaXMuc291cmNlID0gc291cmNlO1xuICAgICAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICAgICAgICB0aGlzLmtpbmQgPSB0YXJnZXQgPyBraW5kIDogU3RhdGVKUy5UcmFuc2l0aW9uS2luZC5JbnRlcm5hbDtcbiAgICAgICAgICAgIHRoaXMuZ3VhcmQgPSBzb3VyY2UgaW5zdGFuY2VvZiBTdGF0ZUpTLlBzZXVkb1N0YXRlID8gVHJhbnNpdGlvbi5UcnVlR3VhcmQgOiBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtZXNzYWdlID09PSBfdGhpcy5zb3VyY2U7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5zb3VyY2Uub3V0Z29pbmcucHVzaCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuc291cmNlLmdldFJvb3QoKS5jbGVhbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFR1cm5zIGEgdHJhbnNpdGlvbiBpbnRvIGFuIGVsc2UgdHJhbnNpdGlvbi5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEVsc2UgdHJhbnNpdGlvbnMgY2FuIGJlIHVzZWQgYXQgYEp1bmN0aW9uYCBvciBgQ2hvaWNlYCBwc2V1ZG8gc3RhdGVzIGlmIG5vIG90aGVyIHRyYW5zaXRpb24gZ3VhcmRzIGV2YWx1YXRlIHRydWUsIGFuIEVsc2UgdHJhbnNpdGlvbiBpZiBwcmVzZW50IHdpbGwgYmUgdHJhdmVyc2VkLlxyXG4gICAgICAgICAqIEBtZXRob2QgZWxzZVxyXG4gICAgICAgICAqIEByZXR1cm5zIHtUcmFuc2l0aW9ufSBSZXR1cm5zIHRoZSB0cmFuc2l0aW9uIG9iamVjdCB0byBlbmFibGUgdGhlIGZsdWVudCBBUEkuXHJcbiAgICAgICAgICovXG4gICAgICAgIFRyYW5zaXRpb24ucHJvdG90eXBlW1wiZWxzZVwiXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuZ3VhcmQgPSBUcmFuc2l0aW9uLkZhbHNlR3VhcmQ7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRGVmaW5lcyB0aGUgZ3VhcmQgY29uZGl0aW9uIGZvciB0aGUgdHJhbnNpdGlvbi5cclxuICAgICAgICAgKiBAbWV0aG9kIHdoZW5cclxuICAgICAgICAgKiBAcGFyYW0ge0d1YXJkfSBndWFyZCBUaGUgZ3VhcmQgY29uZGl0aW9uIHRoYXQgbXVzdCBldmFsdWF0ZSB0cnVlIGZvciB0aGUgdHJhbnNpdGlvbiB0byBiZSB0cmF2ZXJzZWQuXHJcbiAgICAgICAgICogQHJldHVybnMge1RyYW5zaXRpb259IFJldHVybnMgdGhlIHRyYW5zaXRpb24gb2JqZWN0IHRvIGVuYWJsZSB0aGUgZmx1ZW50IEFQSS5cclxuICAgICAgICAgKi9cbiAgICAgICAgVHJhbnNpdGlvbi5wcm90b3R5cGUud2hlbiA9IGZ1bmN0aW9uIChndWFyZCkge1xuICAgICAgICAgICAgdGhpcy5ndWFyZCA9IGd1YXJkO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEFkZCBiZWhhdmlvdXIgdG8gYSB0cmFuc2l0aW9uLlxyXG4gICAgICAgICAqIEBtZXRob2QgZWZmZWN0XHJcbiAgICAgICAgICogQHBhcmFtIHtBY3Rpb259IHRyYW5zaXRpb25BY3Rpb24gVGhlIGFjdGlvbiB0byBhZGQgdG8gdGhlIHRyYW5zaXRpb25zIHRyYXZlcnNhbCBiZWhhdmlvdXIuXHJcbiAgICAgICAgICogQHJldHVybnMge1RyYW5zaXRpb259IFJldHVybnMgdGhlIHRyYW5zaXRpb24gb2JqZWN0IHRvIGVuYWJsZSB0aGUgZmx1ZW50IEFQSS5cclxuICAgICAgICAgKi9cbiAgICAgICAgVHJhbnNpdGlvbi5wcm90b3R5cGUuZWZmZWN0ID0gZnVuY3Rpb24gKHRyYW5zaXRpb25BY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbkJlaGF2aW9yLnB1c2godHJhbnNpdGlvbkFjdGlvbik7XG4gICAgICAgICAgICB0aGlzLnNvdXJjZS5nZXRSb290KCkuY2xlYW4gPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBBY2NlcHRzIGFuIGluc3RhbmNlIG9mIGEgdmlzaXRvciBhbmQgY2FsbHMgdGhlIHZpc2l0VHJhbnNpdGlvbiBtZXRob2Qgb24gaXQuXHJcbiAgICAgICAgICogQG1ldGhvZCBhY2NlcHRcclxuICAgICAgICAgKiBAcGFyYW0ge1Zpc2l0b3I8VEFyZzE+fSB2aXNpdG9yIFRoZSB2aXNpdG9yIGluc3RhbmNlLlxyXG4gICAgICAgICAqIEBwYXJhbSB7VEFyZzF9IGFyZzEgQW4gb3B0aW9uYWwgYXJndW1lbnQgdG8gcGFzcyBpbnRvIHRoZSB2aXNpdG9yLlxyXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmcyIEFuIG9wdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgaW50byB0aGUgdmlzaXRvci5cclxuICAgICAgICAgKiBAcGFyYW0ge2FueX0gYXJnMyBBbiBvcHRpb25hbCBhcmd1bWVudCB0byBwYXNzIGludG8gdGhlIHZpc2l0b3IuXHJcbiAgICAgICAgICogQHJldHVybnMge2FueX0gQW55IHZhbHVlIGNhbiBiZSByZXR1cm5lZCBieSB0aGUgdmlzaXRvci5cclxuICAgICAgICAgKi9cbiAgICAgICAgVHJhbnNpdGlvbi5wcm90b3R5cGUuYWNjZXB0ID0gZnVuY3Rpb24gKHZpc2l0b3IsIGFyZzEsIGFyZzIsIGFyZzMpIHtcbiAgICAgICAgICAgIHJldHVybiB2aXNpdG9yLnZpc2l0VHJhbnNpdGlvbih0aGlzLCBhcmcxLCBhcmcyLCBhcmczKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmV0dXJucyBhIHRoZSB0cmFuc2l0aW9uIG5hbWUuXHJcbiAgICAgICAgICogQG1ldGhvZCB0b1N0cmluZ1xyXG4gICAgICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICAgICAgICovXG4gICAgICAgIFRyYW5zaXRpb24ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiW1wiICsgKHRoaXMudGFyZ2V0ID8gdGhpcy5zb3VyY2UgKyBcIiAtPiBcIiArIHRoaXMudGFyZ2V0IDogdGhpcy5zb3VyY2UpICsgXCJdXCI7XG4gICAgICAgIH07XG4gICAgICAgIC8vIHRoZSBkZWZhdWx0IGd1YXJkIGNvbmRpdGlvbiBmb3IgcHNldWRvIHN0YXRlc1xuICAgICAgICBUcmFuc2l0aW9uLlRydWVHdWFyZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICAvLyB1c2VkIGFzIHRoZSBndWFyZCBjb25kaXRpb24gZm9yIGVsc2UgdHJhbml0aW9uc1xuICAgICAgICBUcmFuc2l0aW9uLkZhbHNlR3VhcmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBUcmFuc2l0aW9uO1xuICAgIH0pKCk7XG4gICAgU3RhdGVKUy5UcmFuc2l0aW9uID0gVHJhbnNpdGlvbjtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcclxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xyXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xyXG4gKi9cbnZhciBTdGF0ZUpTO1xuKGZ1bmN0aW9uIChTdGF0ZUpTKSB7XG4gICAgLyoqXHJcbiAgICAgKiBJbXBsZW1lbnRhdGlvbiBvZiBhIHZpc2l0b3IgcGF0dGVybi5cclxuICAgICAqIEBjbGFzcyBWaXNpdG9yXHJcbiAgICAgKi9cbiAgICB2YXIgVmlzaXRvciA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIFZpc2l0b3IoKSB7fVxuICAgICAgICAvKipcclxuICAgICAgICAgKiBWaXNpdHMgYW4gZWxlbWVudCB3aXRoaW4gYSBzdGF0ZSBtYWNoaW5lIG1vZGVsLlxyXG4gICAgICAgICAqIEBtZXRob2QgdmlzaXRFbGVtZW50XHJcbiAgICAgICAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IHRoZSBlbGVtZW50IGJlaW5nIHZpc2l0ZWQuXHJcbiAgICAgICAgICogQHBhcmFtIHtUQXJnMX0gYXJnMSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXHJcbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzIgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxyXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmczIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cclxuICAgICAgICAgKiBAcmV0dXJucyB7YW55fSBBbnkgdmFsdWUgbWF5IGJlIHJldHVybmVkIHdoZW4gdmlzaXRpbmcgYW4gZWxlbWVudC5cclxuICAgICAgICAgKi9cbiAgICAgICAgVmlzaXRvci5wcm90b3R5cGUudmlzaXRFbGVtZW50ID0gZnVuY3Rpb24gKGVsZW1lbnQsIGFyZzEsIGFyZzIsIGFyZzMpIHt9O1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBWaXNpdHMgYSByZWdpb24gd2l0aGluIGEgc3RhdGUgbWFjaGluZSBtb2RlbC5cclxuICAgICAgICAgKiBAbWV0aG9kIHZpc2l0UmVnaW9uXHJcbiAgICAgICAgICogQHBhcmFtIHtSZWdpb259IHJlZ2lvbiBUaGUgcmVnaW9uIGJlaW5nIHZpc2l0ZWQuXHJcbiAgICAgICAgICogQHBhcmFtIHtUQXJnMX0gYXJnMSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXHJcbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzIgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxyXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmczIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cclxuICAgICAgICAgKiBAcmV0dXJucyB7YW55fSBBbnkgdmFsdWUgbWF5IGJlIHJldHVybmVkIHdoZW4gdmlzaXRpbmcgYW4gZWxlbWVudC5cclxuICAgICAgICAgKi9cbiAgICAgICAgVmlzaXRvci5wcm90b3R5cGUudmlzaXRSZWdpb24gPSBmdW5jdGlvbiAocmVnaW9uLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMudmlzaXRFbGVtZW50KHJlZ2lvbiwgYXJnMSwgYXJnMiwgYXJnMyk7XG4gICAgICAgICAgICByZWdpb24udmVydGljZXMuZm9yRWFjaChmdW5jdGlvbiAodmVydGV4KSB7XG4gICAgICAgICAgICAgICAgdmVydGV4LmFjY2VwdChfdGhpcywgYXJnMSwgYXJnMiwgYXJnMyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFZpc2l0cyBhIHZlcnRleCB3aXRoaW4gYSBzdGF0ZSBtYWNoaW5lIG1vZGVsLlxyXG4gICAgICAgICAqIEBtZXRob2QgdmlzaXRWZXJ0ZXhcclxuICAgICAgICAgKiBAcGFyYW0ge1ZlcnRleH0gdmVydGV4IFRoZSB2ZXJ0ZXggYmVpbmcgdmlzaXRlZC5cclxuICAgICAgICAgKiBAcGFyYW0ge1RBcmcxfSBhcmcxIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cclxuICAgICAgICAgKiBAcGFyYW0ge2FueX0gYXJnMiBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXHJcbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzMgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxyXG4gICAgICAgICAqIEByZXR1cm5zIHthbnl9IEFueSB2YWx1ZSBtYXkgYmUgcmV0dXJuZWQgd2hlbiB2aXNpdGluZyBhbiBlbGVtZW50LlxyXG4gICAgICAgICAqL1xuICAgICAgICBWaXNpdG9yLnByb3RvdHlwZS52aXNpdFZlcnRleCA9IGZ1bmN0aW9uICh2ZXJ0ZXgsIGFyZzEsIGFyZzIsIGFyZzMpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy52aXNpdEVsZW1lbnQodmVydGV4LCBhcmcxLCBhcmcyLCBhcmczKTtcbiAgICAgICAgICAgIHZlcnRleC5vdXRnb2luZy5mb3JFYWNoKGZ1bmN0aW9uICh0cmFuc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbi5hY2NlcHQoX3RoaXMsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBWaXNpdHMgYSBwc2V1ZG8gc3RhdGUgd2l0aGluIGEgc3RhdGUgbWFjaGluZSBtb2RlbC5cclxuICAgICAgICAgKiBAbWV0aG9kIHZpc2l0UHNldWRvU3RhdGVcclxuICAgICAgICAgKiBAcGFyYW0ge1BzZXVkb1N0YXRlfSBwc2V1ZG9TdGF0ZSBUaGUgcHNldWRvIHN0YXRlIGJlaW5nIHZpc2l0ZWQuXHJcbiAgICAgICAgICogQHBhcmFtIHtUQXJnMX0gYXJnMSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXHJcbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzIgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxyXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmczIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cclxuICAgICAgICAgKiBAcmV0dXJucyB7YW55fSBBbnkgdmFsdWUgbWF5IGJlIHJldHVybmVkIHdoZW4gdmlzaXRpbmcgYW4gZWxlbWVudC5cclxuICAgICAgICAgKi9cbiAgICAgICAgVmlzaXRvci5wcm90b3R5cGUudmlzaXRQc2V1ZG9TdGF0ZSA9IGZ1bmN0aW9uIChwc2V1ZG9TdGF0ZSwgYXJnMSwgYXJnMiwgYXJnMykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmlzaXRWZXJ0ZXgocHNldWRvU3RhdGUsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBWaXNpdHMgYSBzdGF0ZSB3aXRoaW4gYSBzdGF0ZSBtYWNoaW5lIG1vZGVsLlxyXG4gICAgICAgICAqIEBtZXRob2QgdmlzaXRTdGF0ZVxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RhdGV9IHN0YXRlIFRoZSBzdGF0ZSBiZWluZyB2aXNpdGVkLlxyXG4gICAgICAgICAqIEBwYXJhbSB7VEFyZzF9IGFyZzEgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxyXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmcyIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cclxuICAgICAgICAgKiBAcGFyYW0ge2FueX0gYXJnMyBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXHJcbiAgICAgICAgICogQHJldHVybnMge2FueX0gQW55IHZhbHVlIG1heSBiZSByZXR1cm5lZCB3aGVuIHZpc2l0aW5nIGFuIGVsZW1lbnQuXHJcbiAgICAgICAgICovXG4gICAgICAgIFZpc2l0b3IucHJvdG90eXBlLnZpc2l0U3RhdGUgPSBmdW5jdGlvbiAoc3RhdGUsIGFyZzEsIGFyZzIsIGFyZzMpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy52aXNpdFZlcnRleChzdGF0ZSwgYXJnMSwgYXJnMiwgYXJnMyk7XG4gICAgICAgICAgICBzdGF0ZS5yZWdpb25zLmZvckVhY2goZnVuY3Rpb24gKHJlZ2lvbikge1xuICAgICAgICAgICAgICAgIHJlZ2lvbi5hY2NlcHQoX3RoaXMsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBWaXNpdHMgYSBmaW5hbCBzdGF0ZSB3aXRoaW4gYSBzdGF0ZSBtYWNoaW5lIG1vZGVsLlxyXG4gICAgICAgICAqIEBtZXRob2QgdmlzaXRGaW5hbFxyXG4gICAgICAgICAqIEBwYXJhbSB7RmluYWxTdGF0ZX0gZmluYWxTdGF0ZSBUaGUgZmluYWwgc3RhdGUgYmVpbmcgdmlzaXRlZC5cclxuICAgICAgICAgKiBAcGFyYW0ge1RBcmcxfSBhcmcxIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cclxuICAgICAgICAgKiBAcGFyYW0ge2FueX0gYXJnMiBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXHJcbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzMgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxyXG4gICAgICAgICAqIEByZXR1cm5zIHthbnl9IEFueSB2YWx1ZSBtYXkgYmUgcmV0dXJuZWQgd2hlbiB2aXNpdGluZyBhbiBlbGVtZW50LlxyXG4gICAgICAgICAqL1xuICAgICAgICBWaXNpdG9yLnByb3RvdHlwZS52aXNpdEZpbmFsU3RhdGUgPSBmdW5jdGlvbiAoZmluYWxTdGF0ZSwgYXJnMSwgYXJnMiwgYXJnMykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmlzaXRTdGF0ZShmaW5hbFN0YXRlLCBhcmcxLCBhcmcyLCBhcmczKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVmlzaXRzIGEgc3RhdGUgbWFjaGluZSB3aXRoaW4gYSBzdGF0ZSBtYWNoaW5lIG1vZGVsLlxyXG4gICAgICAgICAqIEBtZXRob2QgdmlzaXRWZXJ0ZXhcclxuICAgICAgICAgKiBAcGFyYW0ge1N0YXRlTWFjaGluZX0gc3RhdGUgbWFjaGluZSBUaGUgc3RhdGUgbWFjaGluZSBiZWluZyB2aXNpdGVkLlxyXG4gICAgICAgICAqIEBwYXJhbSB7VEFyZzF9IGFyZzEgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxyXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBhcmcyIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cclxuICAgICAgICAgKiBAcGFyYW0ge2FueX0gYXJnMyBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXHJcbiAgICAgICAgICogQHJldHVybnMge2FueX0gQW55IHZhbHVlIG1heSBiZSByZXR1cm5lZCB3aGVuIHZpc2l0aW5nIGFuIGVsZW1lbnQuXHJcbiAgICAgICAgICovXG4gICAgICAgIFZpc2l0b3IucHJvdG90eXBlLnZpc2l0U3RhdGVNYWNoaW5lID0gZnVuY3Rpb24gKHN0YXRlTWFjaGluZSwgYXJnMSwgYXJnMiwgYXJnMykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmlzaXRTdGF0ZShzdGF0ZU1hY2hpbmUsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcclxuICAgICAgICAgKiBWaXNpdHMgYSB0cmFuc2l0aW9uIHdpdGhpbiBhIHN0YXRlIG1hY2hpbmUgbW9kZWwuXHJcbiAgICAgICAgICogQG1ldGhvZCB2aXNpdFRyYW5zaXRpb25cclxuICAgICAgICAgKiBAcGFyYW0ge1RyYW5zaXRpb259IHRyYW5zaXRpb24gVGhlIHRyYW5zaXRpb24gYmVpbmcgdmlzaXRlZC5cclxuICAgICAgICAgKiBAcGFyYW0ge1RBcmcxfSBhcmcxIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgaW50byB0aGUgYWNjZXB0IG1ldGhvZC5cclxuICAgICAgICAgKiBAcGFyYW0ge2FueX0gYXJnMiBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgcGFzc2VkIGludG8gdGhlIGFjY2VwdCBtZXRob2QuXHJcbiAgICAgICAgICogQHBhcmFtIHthbnl9IGFyZzMgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIHRoZSBhY2NlcHQgbWV0aG9kLlxyXG4gICAgICAgICAqIEByZXR1cm5zIHthbnl9IEFueSB2YWx1ZSBtYXkgYmUgcmV0dXJuZWQgd2hlbiB2aXNpdGluZyBhbiBlbGVtZW50LlxyXG4gICAgICAgICAqL1xuICAgICAgICBWaXNpdG9yLnByb3RvdHlwZS52aXNpdFRyYW5zaXRpb24gPSBmdW5jdGlvbiAodHJhbnNpdGlvbiwgYXJnMSwgYXJnMiwgYXJnMykge307XG4gICAgICAgIHJldHVybiBWaXNpdG9yO1xuICAgIH0pKCk7XG4gICAgU3RhdGVKUy5WaXNpdG9yID0gVmlzaXRvcjtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcclxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xyXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xyXG4gKi9cbnZhciBTdGF0ZUpTO1xuKGZ1bmN0aW9uIChTdGF0ZUpTKSB7XG4gICAgLyoqXHJcbiAgICAgKiBEZWZhdWx0IHdvcmtpbmcgaW1wbGVtZW50YXRpb24gb2YgYSBzdGF0ZSBtYWNoaW5lIGluc3RhbmNlIGNsYXNzLlxyXG4gICAgICpcclxuICAgICAqIEltcGxlbWVudHMgdGhlIGBJQWN0aXZlU3RhdGVDb25maWd1cmF0aW9uYCBpbnRlcmZhY2UuXHJcbiAgICAgKiBJdCBpcyBwb3NzaWJsZSB0byBjcmVhdGUgb3RoZXIgY3VzdG9tIGluc3RhbmNlIGNsYXNzZXMgdG8gbWFuYWdlIHN0YXRlIG1hY2hpbmUgc3RhdGUgaW4gb3RoZXIgd2F5cyAoZS5nLiBhcyBzZXJpYWxpc2FibGUgSlNPTik7IGp1c3QgaW1wbGVtZW50IHRoZSBzYW1lIG1lbWJlcnMgYW5kIG1ldGhvZHMgYXMgdGhpcyBjbGFzcy5cclxuICAgICAqIEBjbGFzcyBTdGF0ZU1hY2hpbmVJbnN0YW5jZVxyXG4gICAgICogQGltcGxlbWVudHMgSUFjdGl2ZVN0YXRlQ29uZmlndXJhdGlvblxyXG4gICAgICovXG4gICAgdmFyIFN0YXRlTWFjaGluZUluc3RhbmNlID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgc3RhdGUgbWFjaGluZSBpbnN0YW5jZSBjbGFzcy5cclxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgb3B0aW9uYWwgbmFtZSBvZiB0aGUgc3RhdGUgbWFjaGluZSBpbnN0YW5jZS5cclxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gU3RhdGVNYWNoaW5lSW5zdGFuY2UobmFtZSkge1xuICAgICAgICAgICAgaWYgKG5hbWUgPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICAgIG5hbWUgPSBcInVubmFtZWRcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubGFzdCA9IHt9O1xuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEluZGljYXRlcyB0aGF0IHRoZSBzdGF0ZSBtYW5jaGluZSBpbnN0YW5jZSByZWFjaGVkIHdhcyB0ZXJtaW5hdGVkIGJ5IHJlYWNoaW5nIGEgVGVybWluYXRlIHBzZXVkbyBzdGF0ZS5cclxuICAgICAgICAgICAgICogQG1lbWJlciBpc1Rlcm1pbmF0ZWRcclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmlzVGVybWluYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBVcGRhdGVzIHRoZSBsYXN0IGtub3duIHN0YXRlIGZvciBhIGdpdmVuIHJlZ2lvbi5cbiAgICAgICAgU3RhdGVNYWNoaW5lSW5zdGFuY2UucHJvdG90eXBlLnNldEN1cnJlbnQgPSBmdW5jdGlvbiAocmVnaW9uLCBzdGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5sYXN0W3JlZ2lvbi5xdWFsaWZpZWROYW1lXSA9IHN0YXRlO1xuICAgICAgICB9O1xuICAgICAgICAvLyBSZXR1cm5zIHRoZSBsYXN0IGtub3duIHN0YXRlIGZvciBhIGdpdmVuIHJlZ2lvbi5cbiAgICAgICAgU3RhdGVNYWNoaW5lSW5zdGFuY2UucHJvdG90eXBlLmdldEN1cnJlbnQgPSBmdW5jdGlvbiAocmVnaW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXN0W3JlZ2lvbi5xdWFsaWZpZWROYW1lXTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmV0dXJucyB0aGUgbmFtZSBvZiB0aGUgc3RhdGUgbWFjaGluZSBpbnN0YW5jZS5cclxuICAgICAgICAgKiBAbWV0aG9kIHRvU3RyaW5nXHJcbiAgICAgICAgICogQHJldHVybnMge3N0cmluZ30gVGhlIG5hbWUgb2YgdGhlIHN0YXRlIG1hY2hpbmUgaW5zdGFuY2UuXHJcbiAgICAgICAgICovXG4gICAgICAgIFN0YXRlTWFjaGluZUluc3RhbmNlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5hbWU7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBTdGF0ZU1hY2hpbmVJbnN0YW5jZTtcbiAgICB9KSgpO1xuICAgIFN0YXRlSlMuU3RhdGVNYWNoaW5lSW5zdGFuY2UgPSBTdGF0ZU1hY2hpbmVJbnN0YW5jZTtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcclxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xyXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xyXG4gKi9cbnZhciBTdGF0ZUpTO1xuKGZ1bmN0aW9uIChTdGF0ZUpTKSB7XG4gICAgLyoqXHJcbiAgICAgKiBTZXRzIGEgbWV0aG9kIHRvIHNlbGVjdCBhbiBpbnRlZ2VyIHJhbmRvbSBudW1iZXIgbGVzcyB0aGFuIHRoZSBtYXggdmFsdWUgcGFzc2VkIGFzIGEgcGFyYW1ldGVyLlxyXG4gICAgICpcclxuICAgICAqIFRoaXMgaXMgb25seSB1c2VmdWwgd2hlbiBhIGN1c3RvbSByYW5kb20gbnVtYmVyIGdlbmVyYXRvciBpcyByZXF1aXJlZDsgdGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gaXMgZmluZSBpbiBtb3N0IGNpcmN1bXN0YW5jZXMuXHJcbiAgICAgKiBAZnVuY3Rpb24gc2V0UmFuZG9tXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBnZW5lcmF0b3IgQSBmdW5jdGlvbiB0aGF0IHRha2VzIGEgbWF4IHZhbHVlIGFuZCByZXR1cm5zIGEgcmFuZG9tIG51bWJlciBiZXR3ZWVuIDAgYW5kIG1heCAtIDEuXHJcbiAgICAgKiBAcmV0dXJucyBBIHJhbmRvbSBudW1iZXIgYmV0d2VlbiAwIGFuZCBtYXggLSAxXHJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzZXRSYW5kb20oZ2VuZXJhdG9yKSB7XG4gICAgICAgIHJhbmRvbSA9IGdlbmVyYXRvcjtcbiAgICB9XG4gICAgU3RhdGVKUy5zZXRSYW5kb20gPSBzZXRSYW5kb207XG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IG1ldGhvZCB1c2VkIHRvIHNlbGVjdCBhbiBpbnRlZ2VyIHJhbmRvbSBudW1iZXIgbGVzcyB0aGFuIHRoZSBtYXggdmFsdWUgcGFzc2VkIGFzIGEgcGFyYW1ldGVyLlxyXG4gICAgICpcclxuICAgICAqIFRoaXMgaXMgb25seSB1c2VmdWwgd2hlbiBhIGN1c3RvbSByYW5kb20gbnVtYmVyIGdlbmVyYXRvciBpcyByZXF1aXJlZDsgdGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gaXMgZmluZSBpbiBtb3N0IGNpcmN1bXN0YW5jZXMuXHJcbiAgICAgKiBAZnVuY3Rpb24gZ2V0UmFuZG9tXHJcbiAgICAgKiBAcmV0dXJucyB7ZnVuY3Rpb259IFRoZSBmdW5jdGlvbiB0aGF0IHRha2VzIGEgbWF4IHZhbHVlIGFuZCByZXR1cm5zIGEgcmFuZG9tIG51bWJlciBiZXR3ZWVuIDAgYW5kIG1heCAtIDEuXHJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRSYW5kb20oKSB7XG4gICAgICAgIHJldHVybiByYW5kb207XG4gICAgfVxuICAgIFN0YXRlSlMuZ2V0UmFuZG9tID0gZ2V0UmFuZG9tO1xuICAgIC8vIHRoZSBkZWZhdWx0IG1ldGhvZCB1c2VkIHRvIHByb2R1Y2UgYSByYW5kb20gbnVtYmVyOyBkZWZhdWx0aW5nIHRvIHNpbXBsaWZpZWQgaW1wbGVtZW50YXRpb24gc2VlbiBpbiBNb3ppbGxhIE1hdGgucmFuZG9tKCkgcGFnZTsgbWF5IGJlIG92ZXJyaWRlbiBmb3IgdGVzdGluZ1xuICAgIHZhciByYW5kb20gPSBmdW5jdGlvbiByYW5kb20obWF4KSB7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIH07XG59KShTdGF0ZUpTIHx8IChTdGF0ZUpTID0ge30pKTtcbi8qXHJcbiAqIEZpbml0ZSBzdGF0ZSBtYWNoaW5lIGxpYnJhcnlcclxuICogQ29weXJpZ2h0IChjKSAyMDE0LTUgU3RlZWxicmVlemUgTGltaXRlZFxyXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGFuZCBHUEwgdjMgbGljZW5jZXNcclxuICogaHR0cDovL3d3dy5zdGVlbGJyZWV6ZS5uZXQvc3RhdGUuY3NcclxuICovXG52YXIgU3RhdGVKUztcbihmdW5jdGlvbiAoU3RhdGVKUykge1xuICAgIC8qKlxyXG4gICAgICogRGV0ZXJtaW5lcyBpZiBhbiBlbGVtZW50IGlzIGN1cnJlbnRseSBhY3RpdmU7IHRoYXQgaXQgaGFzIGJlZW4gZW50ZXJlZCBidXQgbm90IHlldCBleGl0ZWQuXHJcbiAgICAgKiBAZnVuY3Rpb24gaXNBY3RpdmVcclxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgc3RhdGUgdG8gdGVzdC5cclxuICAgICAqIEBwYXJhbSB7SUFjdGl2ZVN0YXRlQ29uZmlndXJhdGlvbn0gaW5zdGFuY2UgVGhlIGluc3RhbmNlIG9mIHRoZSBzdGF0ZSBtYWNoaW5lIG1vZGVsLlxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIGVsZW1lbnQgaXMgYWN0aXZlLlxyXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNBY3RpdmUoX3gsIF94Mikge1xuICAgICAgICB2YXIgX2FnYWluID0gdHJ1ZTtcblxuICAgICAgICBfZnVuY3Rpb246IHdoaWxlIChfYWdhaW4pIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50ID0gX3gsXG4gICAgICAgICAgICAgICAgc3RhdGVNYWNoaW5lSW5zdGFuY2UgPSBfeDI7XG4gICAgICAgICAgICBfYWdhaW4gPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBTdGF0ZUpTLlJlZ2lvbikge1xuICAgICAgICAgICAgICAgIF94ID0gZWxlbWVudC5zdGF0ZTtcbiAgICAgICAgICAgICAgICBfeDIgPSBzdGF0ZU1hY2hpbmVJbnN0YW5jZTtcbiAgICAgICAgICAgICAgICBfYWdhaW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlIF9mdW5jdGlvbjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIFN0YXRlSlMuU3RhdGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudC5yZWdpb24gPyBpc0FjdGl2ZShlbGVtZW50LnJlZ2lvbiwgc3RhdGVNYWNoaW5lSW5zdGFuY2UpICYmIHN0YXRlTWFjaGluZUluc3RhbmNlLmdldEN1cnJlbnQoZWxlbWVudC5yZWdpb24pID09PSBlbGVtZW50IDogdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBTdGF0ZUpTLmlzQWN0aXZlID0gaXNBY3RpdmU7XG59KShTdGF0ZUpTIHx8IChTdGF0ZUpTID0ge30pKTtcbi8qXHJcbiAqIEZpbml0ZSBzdGF0ZSBtYWNoaW5lIGxpYnJhcnlcclxuICogQ29weXJpZ2h0IChjKSAyMDE0LTUgU3RlZWxicmVlemUgTGltaXRlZFxyXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGFuZCBHUEwgdjMgbGljZW5jZXNcclxuICogaHR0cDovL3d3dy5zdGVlbGJyZWV6ZS5uZXQvc3RhdGUuY3NcclxuICovXG52YXIgU3RhdGVKUztcbihmdW5jdGlvbiAoU3RhdGVKUykge1xuICAgIC8qKlxyXG4gICAgICogVGVzdHMgYW4gZWxlbWVudCB3aXRoaW4gYSBzdGF0ZSBtYWNoaW5lIGluc3RhbmNlIHRvIHNlZSBpZiBpdHMgbGlmZWN5Y2xlIGlzIGNvbXBsZXRlLlxyXG4gICAgICogQGZ1bmN0aW9uIGlzQ29tcGxldGVcclxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0LlxyXG4gICAgICogQHBhcmFtIHtJQWN0aXZlU3RhdGVDb25maWd1cmF0aW9ufSBpbnN0YW5jZSBUaGUgaW5zdGFuY2Ugb2YgdGhlIHN0YXRlIG1hY2hpbmUgbW9kZWwgdG8gdGVzdCBmb3IgY29tcGxldGVuZXNzLlxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIGVsZW1lbnQgaXMgY29tcGxldGUuXHJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc0NvbXBsZXRlKGVsZW1lbnQsIGluc3RhbmNlKSB7XG4gICAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgU3RhdGVKUy5SZWdpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZS5nZXRDdXJyZW50KGVsZW1lbnQpLmlzRmluYWwoKTtcbiAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50IGluc3RhbmNlb2YgU3RhdGVKUy5TdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQucmVnaW9ucy5ldmVyeShmdW5jdGlvbiAocmVnaW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzQ29tcGxldGUocmVnaW9uLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgU3RhdGVKUy5pc0NvbXBsZXRlID0gaXNDb21wbGV0ZTtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcclxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xyXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xyXG4gKi9cbnZhciBTdGF0ZUpTO1xuKGZ1bmN0aW9uIChTdGF0ZUpTKSB7XG4gICAgLyoqXHJcbiAgICAgKiBJbml0aWFsaXNlcyBhIHN0YXRlIG1hY2hpbmUgYW5kL29yIHN0YXRlIG1hY2hpbmUgbW9kZWwuXHJcbiAgICAgKlxyXG4gICAgICogUGFzc2luZyBqdXN0IHRoZSBzdGF0ZSBtYWNoaW5lIG1vZGVsIHdpbGwgaW5pdGlhbGlzZSB0aGUgbW9kZWwsIHBhc3NpbmcgdGhlIG1vZGVsIGFuZCBpbnN0YW5jZSB3aWxsIGluaXRpYWxzZSB0aGUgaW5zdGFuY2UgYW5kIGlmIG5lY2Vzc2FyeSwgdGhlIG1vZGVsLlxyXG4gICAgICogQGZ1bmN0aW9uIGluaXRpYWxpc2VcclxuICAgICAqIEBwYXJhbSB7U3RhdGVNYWNoaW5lfSBzdGF0ZU1hY2hpbmVNb2RlbCBUaGUgc3RhdGUgbWFjaGluZSBtb2RlbC4gSWYgYXV0b0luaXRpYWxpc2VNb2RlbCBpcyB0cnVlIChvciBubyBpbnN0YW5jZSBpcyBzcGVjaWZpZWQpIGFuZCB0aGUgbW9kZWwgaGFzIGNoYW5nZWQsIHRoZSBtb2RlbCB3aWxsIGJlIGluaXRpYWxpc2VkLlxyXG4gICAgICogQHBhcmFtIHtJQWN0aXZlU3RhdGVDb25maWd1cmF0aW9ufSBzdGF0ZU1hY2hpbmVJbnN0YW5jZSBUaGUgb3B0aW9uYWwgc3RhdGUgbWFjaGluZSBpbnN0YW5jZSB0byBpbml0aWFsaXNlLlxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBhdXRvSW5pdGlhbGlzZU1vZGVsIERlZmF1bHRpbmcgdG8gdHJ1ZSwgdGhpcyB3aWxsIGNhdXNlIHRoZSBtb2RlbCB0byBiZSBpbml0aWFsaXNlZCBwcmlvciB0byBpbml0aWFsaXNpbmcgdGhlIGluc3RhbmNlIGlmIHRoZSBtb2RlbCBoYXMgY2hhbmdlZC5cclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGluaXRpYWxpc2Uoc3RhdGVNYWNoaW5lTW9kZWwsIHN0YXRlTWFjaGluZUluc3RhbmNlLCBhdXRvSW5pdGlhbGlzZU1vZGVsKSB7XG4gICAgICAgIGlmIChhdXRvSW5pdGlhbGlzZU1vZGVsID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgIGF1dG9Jbml0aWFsaXNlTW9kZWwgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGF0ZU1hY2hpbmVJbnN0YW5jZSkge1xuICAgICAgICAgICAgLy8gaW5pdGlhbGlzZSB0aGUgc3RhdGUgbWFjaGluZSBtb2RlbCBpZiBuZWNlc3NhcnlcbiAgICAgICAgICAgIGlmIChhdXRvSW5pdGlhbGlzZU1vZGVsICYmIHN0YXRlTWFjaGluZU1vZGVsLmNsZWFuID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGluaXRpYWxpc2Uoc3RhdGVNYWNoaW5lTW9kZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gbG9nIGFzIHJlcXVpcmVkXG4gICAgICAgICAgICBTdGF0ZUpTLmNvbnNvbGUubG9nKFwiaW5pdGlhbGlzZSBcIiArIHN0YXRlTWFjaGluZUluc3RhbmNlKTtcbiAgICAgICAgICAgIC8vIGVudGVyIHRoZSBzdGF0ZSBtYWNoaW5lIGluc3RhbmNlIGZvciB0aGUgZmlyc3QgdGltZVxuICAgICAgICAgICAgc3RhdGVNYWNoaW5lTW9kZWwub25Jbml0aWFsaXNlLmludm9rZSh1bmRlZmluZWQsIHN0YXRlTWFjaGluZUluc3RhbmNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGxvZyBhcyByZXF1aXJlZFxuICAgICAgICAgICAgU3RhdGVKUy5jb25zb2xlLmxvZyhcImluaXRpYWxpc2UgXCIgKyBzdGF0ZU1hY2hpbmVNb2RlbC5uYW1lKTtcbiAgICAgICAgICAgIC8vIGluaXRpYWxpc2UgdGhlIHN0YXRlIG1hY2hpbmUgbW9kZWxcbiAgICAgICAgICAgIHN0YXRlTWFjaGluZU1vZGVsLmFjY2VwdChuZXcgSW5pdGlhbGlzZUVsZW1lbnRzKCksIGZhbHNlKTtcbiAgICAgICAgICAgIHN0YXRlTWFjaGluZU1vZGVsLmNsZWFuID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBTdGF0ZUpTLmluaXRpYWxpc2UgPSBpbml0aWFsaXNlO1xuICAgIC8qKlxyXG4gICAgICogUGFzc2VzIGEgbWVzc2FnZSB0byBhIHN0YXRlIG1hY2hpbmUgZm9yIGV2YWx1YXRpb247IG1lc3NhZ2VzIHRyaWdnZXIgc3RhdGUgdHJhbnNpdGlvbnMuXHJcbiAgICAgKiBAZnVuY3Rpb24gZXZhbHVhdGVcclxuICAgICAqIEBwYXJhbSB7U3RhdGVNYWNoaW5lfSBzdGF0ZU1hY2hpbmVNb2RlbCBUaGUgc3RhdGUgbWFjaGluZSBtb2RlbC4gSWYgYXV0b0luaXRpYWxpc2VNb2RlbCBpcyB0cnVlIChvciBubyBpbnN0YW5jZSBpcyBzcGVjaWZpZWQpIGFuZCB0aGUgbW9kZWwgaGFzIGNoYW5nZWQsIHRoZSBtb2RlbCB3aWxsIGJlIGluaXRpYWxpc2VkLlxyXG4gICAgICogQHBhcmFtIHtJQWN0aXZlU3RhdGVDb25maWd1cmF0aW9ufSBzdGF0ZU1hY2hpbmVJbnN0YW5jZSBUaGUgaW5zdGFuY2Ugb2YgdGhlIHN0YXRlIG1hY2hpbmUgbW9kZWwgdG8gZXZhbHVhdGUgdGhlIG1lc3NhZ2UgYWdhaW5zdC5cclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0b0luaXRpYWxpc2VNb2RlbCBEZWZhdWx0aW5nIHRvIHRydWUsIHRoaXMgd2lsbCBjYXVzZSB0aGUgbW9kZWwgdG8gYmUgaW5pdGlhbGlzZWQgcHJpb3IgdG8gaW5pdGlhbGlzaW5nIHRoZSBpbnN0YW5jZSBpZiB0aGUgbW9kZWwgaGFzIGNoYW5nZWQuXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgbWVzc2FnZSB0cmlnZ2VyZWQgYSBzdGF0ZSB0cmFuc2l0aW9uLlxyXG4gICAgICovXG4gICAgZnVuY3Rpb24gZXZhbHVhdGUoc3RhdGVNYWNoaW5lTW9kZWwsIHN0YXRlTWFjaGluZUluc3RhbmNlLCBtZXNzYWdlLCBhdXRvSW5pdGlhbGlzZU1vZGVsKSB7XG4gICAgICAgIGlmIChhdXRvSW5pdGlhbGlzZU1vZGVsID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgIGF1dG9Jbml0aWFsaXNlTW9kZWwgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIGxvZyBhcyByZXF1aXJlZFxuICAgICAgICBTdGF0ZUpTLmNvbnNvbGUubG9nKHN0YXRlTWFjaGluZUluc3RhbmNlICsgXCIgZXZhbHVhdGUgXCIgKyBtZXNzYWdlKTtcbiAgICAgICAgLy8gaW5pdGlhbGlzZSB0aGUgc3RhdGUgbWFjaGluZSBtb2RlbCBpZiBuZWNlc3NhcnlcbiAgICAgICAgaWYgKGF1dG9Jbml0aWFsaXNlTW9kZWwgJiYgc3RhdGVNYWNoaW5lTW9kZWwuY2xlYW4gPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBpbml0aWFsaXNlKHN0YXRlTWFjaGluZU1vZGVsKTtcbiAgICAgICAgfVxuICAgICAgICAvLyB0ZXJtaW5hdGVkIHN0YXRlIG1hY2hpbmUgaW5zdGFuY2VzIHdpbGwgbm90IGV2YWx1YXRlIG1lc3NhZ2VzXG4gICAgICAgIGlmIChzdGF0ZU1hY2hpbmVJbnN0YW5jZS5pc1Rlcm1pbmF0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXZhbHVhdGVTdGF0ZShzdGF0ZU1hY2hpbmVNb2RlbCwgc3RhdGVNYWNoaW5lSW5zdGFuY2UsIG1lc3NhZ2UpO1xuICAgIH1cbiAgICBTdGF0ZUpTLmV2YWx1YXRlID0gZXZhbHVhdGU7XG4gICAgLy8gZXZhbHVhdGVzIG1lc3NhZ2VzIGFnYWluc3QgYSBzdGF0ZSwgZXhlY3V0aW5nIHRyYW5zaXRpb25zIGFzIGFwcHJvcHJpYXRlXG4gICAgZnVuY3Rpb24gZXZhbHVhdGVTdGF0ZShzdGF0ZSwgc3RhdGVNYWNoaW5lSW5zdGFuY2UsIG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICAvLyBkZWxlZ2F0ZSB0byBjaGlsZCByZWdpb25zIGZpcnN0XG4gICAgICAgIHN0YXRlLnJlZ2lvbnMuZXZlcnkoZnVuY3Rpb24gKHJlZ2lvbikge1xuICAgICAgICAgICAgaWYgKGV2YWx1YXRlU3RhdGUoc3RhdGVNYWNoaW5lSW5zdGFuY2UuZ2V0Q3VycmVudChyZWdpb24pLCBzdGF0ZU1hY2hpbmVJbnN0YW5jZSwgbWVzc2FnZSkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBTdGF0ZUpTLmlzQWN0aXZlKHN0YXRlLCBzdGF0ZU1hY2hpbmVJbnN0YW5jZSk7IC8vIE5PVEU6IHRoaXMganVzdCBjb250cm9scyB0aGUgZXZlcnkgbG9vcDsgYWxzbyBpc0FjdGl2ZSBpcyBhIGxpdHRlIGNvc3RseSBzbyB1c2luZyBzcGFyaW5nbHlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBOT1RFOiB0aGlzIGp1c3QgY29udHJvbHMgdGhlIGV2ZXJ5IGxvb3BcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGlmIGEgdHJhbnNpdGlvbiBvY2N1cmVkIGluIGEgY2hpbGQgcmVnaW9uLCBjaGVjayBmb3IgY29tcGxldGlvbnNcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2UgIT09IHN0YXRlICYmIFN0YXRlSlMuaXNDb21wbGV0ZShzdGF0ZSwgc3RhdGVNYWNoaW5lSW5zdGFuY2UpKSB7XG4gICAgICAgICAgICAgICAgZXZhbHVhdGVTdGF0ZShzdGF0ZSwgc3RhdGVNYWNoaW5lSW5zdGFuY2UsIHN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSBsb29rIGZvciBhIHRyYW5zaXRpb24gZnJvbSB0aGlzIHN0YXRlXG4gICAgICAgICAgICB2YXIgdHJhbnNpdGlvbnMgPSBzdGF0ZS5vdXRnb2luZy5maWx0ZXIoZnVuY3Rpb24gKHRyYW5zaXRpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnNpdGlvbi5ndWFyZChtZXNzYWdlLCBzdGF0ZU1hY2hpbmVJbnN0YW5jZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICh0cmFuc2l0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAvLyBleGVjdXRlIGlmIGEgc2luZ2xlIHRyYW5zaXRpb24gd2FzIGZvdW5kXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJhdmVyc2UodHJhbnNpdGlvbnNbMF0sIHN0YXRlTWFjaGluZUluc3RhbmNlLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHJhbnNpdGlvbnMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIC8vIGVycm9yIGlmIG11bHRpcGxlIHRyYW5zaXRpb25zIGV2YWx1YXRlZCB0cnVlXG4gICAgICAgICAgICAgICAgU3RhdGVKUy5jb25zb2xlLmVycm9yKHN0YXRlICsgXCI6IG11bHRpcGxlIG91dGJvdW5kIHRyYW5zaXRpb25zIGV2YWx1YXRlZCB0cnVlIGZvciBtZXNzYWdlIFwiICsgbWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgLy8gdHJhdmVyc2VzIGEgdHJhbnNpdGlvblxuICAgIGZ1bmN0aW9uIHRyYXZlcnNlKHRyYW5zaXRpb24sIGluc3RhbmNlLCBtZXNzYWdlKSB7XG4gICAgICAgIHZhciBvblRyYXZlcnNlID0gbmV3IFN0YXRlSlMuQmVoYXZpb3IodHJhbnNpdGlvbi5vblRyYXZlcnNlKSxcbiAgICAgICAgICAgIHRhcmdldCA9IHRyYW5zaXRpb24udGFyZ2V0O1xuICAgICAgICAvLyBwcm9jZXNzIHN0YXRpYyBjb25kaXRpb25hbCBicmFuY2hlc1xuICAgICAgICB3aGlsZSAodGFyZ2V0ICYmIHRhcmdldCBpbnN0YW5jZW9mIFN0YXRlSlMuUHNldWRvU3RhdGUgJiYgdGFyZ2V0LmtpbmQgPT09IFN0YXRlSlMuUHNldWRvU3RhdGVLaW5kLkp1bmN0aW9uKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSAodHJhbnNpdGlvbiA9IHNlbGVjdFRyYW5zaXRpb24odGFyZ2V0LCBpbnN0YW5jZSwgbWVzc2FnZSkpLnRhcmdldDtcbiAgICAgICAgICAgIC8vIGNvbmNhdGVuYXRlIGJlaGF2aW91ciBiZWZvcmUgYW5kIGFmdGVyIGp1bmN0aW9uc1xuICAgICAgICAgICAgb25UcmF2ZXJzZS5wdXNoKHRyYW5zaXRpb24ub25UcmF2ZXJzZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZXhlY3V0ZSB0aGUgdHJhbnNpdGlvbiBiZWhhdmlvdXJcbiAgICAgICAgb25UcmF2ZXJzZS5pbnZva2UobWVzc2FnZSwgaW5zdGFuY2UpO1xuICAgICAgICAvLyBwcm9jZXNzIGR5bmFtaWMgY29uZGl0aW9uYWwgYnJhbmNoZXNcbiAgICAgICAgaWYgKHRhcmdldCAmJiB0YXJnZXQgaW5zdGFuY2VvZiBTdGF0ZUpTLlBzZXVkb1N0YXRlICYmIHRhcmdldC5raW5kID09PSBTdGF0ZUpTLlBzZXVkb1N0YXRlS2luZC5DaG9pY2UpIHtcbiAgICAgICAgICAgIHRyYXZlcnNlKHNlbGVjdFRyYW5zaXRpb24odGFyZ2V0LCBpbnN0YW5jZSwgbWVzc2FnZSksIGluc3RhbmNlLCBtZXNzYWdlKTtcbiAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQgJiYgdGFyZ2V0IGluc3RhbmNlb2YgU3RhdGVKUy5TdGF0ZSAmJiBTdGF0ZUpTLmlzQ29tcGxldGUodGFyZ2V0LCBpbnN0YW5jZSkpIHtcbiAgICAgICAgICAgIC8vIHRlc3QgZm9yIGNvbXBsZXRpb24gdHJhbnNpdGlvbnNcbiAgICAgICAgICAgIGV2YWx1YXRlU3RhdGUodGFyZ2V0LCBpbnN0YW5jZSwgdGFyZ2V0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLy8gc2VsZWN0IG5leHQgbGVnIG9mIGNvbXBvc2l0ZSB0cmFuc2l0aW9ucyBhZnRlciBjaG9pY2UgYW5kIGp1bmN0aW9uIHBzZXVkbyBzdGF0ZXNcbiAgICBmdW5jdGlvbiBzZWxlY3RUcmFuc2l0aW9uKHBzZXVkb1N0YXRlLCBzdGF0ZU1hY2hpbmVJbnN0YW5jZSwgbWVzc2FnZSkge1xuICAgICAgICB2YXIgcmVzdWx0cyA9IHBzZXVkb1N0YXRlLm91dGdvaW5nLmZpbHRlcihmdW5jdGlvbiAodHJhbnNpdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHRyYW5zaXRpb24uZ3VhcmQobWVzc2FnZSwgc3RhdGVNYWNoaW5lSW5zdGFuY2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHBzZXVkb1N0YXRlLmtpbmQgPT09IFN0YXRlSlMuUHNldWRvU3RhdGVLaW5kLkNob2ljZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHMubGVuZ3RoICE9PSAwID8gcmVzdWx0c1tTdGF0ZUpTLmdldFJhbmRvbSgpKHJlc3VsdHMubGVuZ3RoKV0gOiBmaW5kRWxzZShwc2V1ZG9TdGF0ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgU3RhdGVKUy5jb25zb2xlLmVycm9yKFwiTXVsdGlwbGUgb3V0Ym91bmQgdHJhbnNpdGlvbiBndWFyZHMgcmV0dXJuZWQgdHJ1ZSBhdCBcIiArIHRoaXMgKyBcIiBmb3IgXCIgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHNbMF0gfHwgZmluZEVsc2UocHNldWRvU3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8vIGxvb2sgZm9yIGVsc2UgdHJhbnNpdGlucyBmcm9tIGEganVuY3Rpb24gb3IgY2hvaWNlXG4gICAgZnVuY3Rpb24gZmluZEVsc2UocHNldWRvU3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHBzZXVkb1N0YXRlLm91dGdvaW5nLmZpbHRlcihmdW5jdGlvbiAodHJhbnNpdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHRyYW5zaXRpb24uZ3VhcmQgPT09IFN0YXRlSlMuVHJhbnNpdGlvbi5GYWxzZUd1YXJkO1xuICAgICAgICB9KVswXTtcbiAgICB9XG4gICAgLy8gZnVuY3Rpb25zIHRvIHJldHJlaXZlIHNwZWNpZiBlbGVtZW50IGJlaGF2aW9yXG4gICAgZnVuY3Rpb24gbGVhdmUoZWxlbWVudEJlaGF2aW9yKSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50QmVoYXZpb3JbMF0gfHwgKGVsZW1lbnRCZWhhdmlvclswXSA9IG5ldyBTdGF0ZUpTLkJlaGF2aW9yKCkpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBiZWdpbkVudGVyKGVsZW1lbnRCZWhhdmlvcikge1xuICAgICAgICByZXR1cm4gZWxlbWVudEJlaGF2aW9yWzFdIHx8IChlbGVtZW50QmVoYXZpb3JbMV0gPSBuZXcgU3RhdGVKUy5CZWhhdmlvcigpKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZW5kRW50ZXIoZWxlbWVudEJlaGF2aW9yKSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50QmVoYXZpb3JbMl0gfHwgKGVsZW1lbnRCZWhhdmlvclsyXSA9IG5ldyBTdGF0ZUpTLkJlaGF2aW9yKCkpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBlbnRlcihlbGVtZW50QmVoYXZpb3IpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdGF0ZUpTLkJlaGF2aW9yKGJlZ2luRW50ZXIoZWxlbWVudEJlaGF2aW9yKSkucHVzaChlbmRFbnRlcihlbGVtZW50QmVoYXZpb3IpKTtcbiAgICB9XG4gICAgLy8gZ2V0IGFsbCB0aGUgdmVydGV4IGFuY2VzdG9ycyBvZiBhIHZlcnRleCAoaW5jbHVkaW5nIHRoZSB2ZXJ0ZXggaXRzZWxmKVxuICAgIGZ1bmN0aW9uIGFuY2VzdG9ycyh2ZXJ0ZXgpIHtcbiAgICAgICAgcmV0dXJuICh2ZXJ0ZXgucmVnaW9uID8gYW5jZXN0b3JzKHZlcnRleC5yZWdpb24uc3RhdGUpIDogW10pLmNvbmNhdCh2ZXJ0ZXgpO1xuICAgIH1cbiAgICAvLyBkZXRlcm1pbmUgdGhlIHR5cGUgb2YgdHJhbnNpdGlvbiBhbmQgdXNlIHRoZSBhcHByb3ByaWF0ZSBpbml0aWxpYXNpdGlvbiBtZXRob2RcbiAgICB2YXIgSW5pdGlhbGlzZVRyYW5zaXRpb25zID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICAgICAgX19leHRlbmRzKEluaXRpYWxpc2VUcmFuc2l0aW9ucywgX3N1cGVyKTtcbiAgICAgICAgZnVuY3Rpb24gSW5pdGlhbGlzZVRyYW5zaXRpb25zKCkge1xuICAgICAgICAgICAgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICAgICAgSW5pdGlhbGlzZVRyYW5zaXRpb25zLnByb3RvdHlwZS52aXNpdFRyYW5zaXRpb24gPSBmdW5jdGlvbiAodHJhbnNpdGlvbiwgYmVoYXZpb3VyKSB7XG4gICAgICAgICAgICBpZiAodHJhbnNpdGlvbi5raW5kID09PSBTdGF0ZUpTLlRyYW5zaXRpb25LaW5kLkludGVybmFsKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbi5vblRyYXZlcnNlLnB1c2godHJhbnNpdGlvbi50cmFuc2l0aW9uQmVoYXZpb3IpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0cmFuc2l0aW9uLmtpbmQgPT09IFN0YXRlSlMuVHJhbnNpdGlvbktpbmQuTG9jYWwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZpc2l0TG9jYWxUcmFuc2l0aW9uKHRyYW5zaXRpb24sIGJlaGF2aW91cik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudmlzaXRFeHRlcm5hbFRyYW5zaXRpb24odHJhbnNpdGlvbiwgYmVoYXZpb3VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLy8gaW5pdGlhbGlzZSBpbnRlcm5hbCB0cmFuc2l0aW9uczogdGhlc2UgZG8gbm90IGxlYXZlIHRoZSBzb3VyY2Ugc3RhdGVcbiAgICAgICAgSW5pdGlhbGlzZVRyYW5zaXRpb25zLnByb3RvdHlwZS52aXNpdExvY2FsVHJhbnNpdGlvbiA9IGZ1bmN0aW9uICh0cmFuc2l0aW9uLCBiZWhhdmlvdXIpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICB0cmFuc2l0aW9uLm9uVHJhdmVyc2UucHVzaChmdW5jdGlvbiAobWVzc2FnZSwgaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0QW5jZXN0b3JzID0gYW5jZXN0b3JzKHRyYW5zaXRpb24udGFyZ2V0KSxcbiAgICAgICAgICAgICAgICAgICAgaSA9IDA7XG4gICAgICAgICAgICAgICAgLy8gZmluZCB0aGUgZmlyc3QgaW5hY3RpdmUgZWxlbWVudCBpbiB0aGUgdGFyZ2V0IGFuY2VzdHJ5XG4gICAgICAgICAgICAgICAgd2hpbGUgKFN0YXRlSlMuaXNBY3RpdmUodGFyZ2V0QW5jZXN0b3JzW2ldLCBpbnN0YW5jZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgKytpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBleGl0IHRoZSBhY3RpdmUgc2libGluZ1xuICAgICAgICAgICAgICAgIGxlYXZlKGJlaGF2aW91cihpbnN0YW5jZS5nZXRDdXJyZW50KHRhcmdldEFuY2VzdG9yc1tpXS5yZWdpb24pKSkuaW52b2tlKG1lc3NhZ2UsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAvLyBwZXJmb3JtIHRoZSB0cmFuc2l0aW9uIGFjdGlvbjtcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uLnRyYW5zaXRpb25CZWhhdmlvci5pbnZva2UobWVzc2FnZSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgIC8vIGVudGVyIHRoZSB0YXJnZXQgYW5jZXN0cnlcbiAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IHRhcmdldEFuY2VzdG9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuY2FzY2FkZUVsZW1lbnRFbnRyeSh0cmFuc2l0aW9uLCBiZWhhdmlvdXIsIHRhcmdldEFuY2VzdG9yc1tpKytdLCB0YXJnZXRBbmNlc3RvcnNbaV0sIGZ1bmN0aW9uIChiZWhhdmlvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmVoYXZpb3IuaW52b2tlKG1lc3NhZ2UsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHRyaWdnZXIgY2FzY2FkZVxuICAgICAgICAgICAgICAgIGVuZEVudGVyKGJlaGF2aW91cih0cmFuc2l0aW9uLnRhcmdldCkpLmludm9rZShtZXNzYWdlLCBpbnN0YW5jZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gaW5pdGlhbGlzZSBleHRlcm5hbCB0cmFuc2l0aW9uczogdGhlc2UgYXJlIGFicml0YXJpbHkgY29tcGxleFxuICAgICAgICBJbml0aWFsaXNlVHJhbnNpdGlvbnMucHJvdG90eXBlLnZpc2l0RXh0ZXJuYWxUcmFuc2l0aW9uID0gZnVuY3Rpb24gKHRyYW5zaXRpb24sIGJlaGF2aW91cikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZUFuY2VzdG9ycyA9IGFuY2VzdG9ycyh0cmFuc2l0aW9uLnNvdXJjZSksXG4gICAgICAgICAgICAgICAgdGFyZ2V0QW5jZXN0b3JzID0gYW5jZXN0b3JzKHRyYW5zaXRpb24udGFyZ2V0KSxcbiAgICAgICAgICAgICAgICBpID0gTWF0aC5taW4oc291cmNlQW5jZXN0b3JzLmxlbmd0aCwgdGFyZ2V0QW5jZXN0b3JzLmxlbmd0aCkgLSAxO1xuICAgICAgICAgICAgLy8gZmluZCB0aGUgaW5kZXggb2YgdGhlIGZpcnN0IHVuY29tbW9uIGFuY2VzdG9yIChvciBmb3IgZXh0ZXJuYWwgdHJhbnNpdGlvbnMsIHRoZSBzb3VyY2UpXG4gICAgICAgICAgICB3aGlsZSAoc291cmNlQW5jZXN0b3JzW2kgLSAxXSAhPT0gdGFyZ2V0QW5jZXN0b3JzW2kgLSAxXSkge1xuICAgICAgICAgICAgICAgIC0taTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGxlYXZlIHNvdXJjZSBhbmNlc3RyeSBhcyByZXF1aXJlZFxuICAgICAgICAgICAgdHJhbnNpdGlvbi5vblRyYXZlcnNlLnB1c2gobGVhdmUoYmVoYXZpb3VyKHNvdXJjZUFuY2VzdG9yc1tpXSkpKTtcbiAgICAgICAgICAgIC8vIHBlcmZvcm0gdGhlIHRyYW5zaXRpb24gZWZmZWN0XG4gICAgICAgICAgICB0cmFuc2l0aW9uLm9uVHJhdmVyc2UucHVzaCh0cmFuc2l0aW9uLnRyYW5zaXRpb25CZWhhdmlvcik7XG4gICAgICAgICAgICAvLyBlbnRlciB0aGUgdGFyZ2V0IGFuY2VzdHJ5XG4gICAgICAgICAgICB3aGlsZSAoaSA8IHRhcmdldEFuY2VzdG9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhc2NhZGVFbGVtZW50RW50cnkodHJhbnNpdGlvbiwgYmVoYXZpb3VyLCB0YXJnZXRBbmNlc3RvcnNbaSsrXSwgdGFyZ2V0QW5jZXN0b3JzW2ldLCBmdW5jdGlvbiAoYmVoYXZpb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zaXRpb24ub25UcmF2ZXJzZS5wdXNoKGJlaGF2aW9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHRyaWdnZXIgY2FzY2FkZVxuICAgICAgICAgICAgdHJhbnNpdGlvbi5vblRyYXZlcnNlLnB1c2goZW5kRW50ZXIoYmVoYXZpb3VyKHRyYW5zaXRpb24udGFyZ2V0KSkpO1xuICAgICAgICB9O1xuICAgICAgICBJbml0aWFsaXNlVHJhbnNpdGlvbnMucHJvdG90eXBlLmNhc2NhZGVFbGVtZW50RW50cnkgPSBmdW5jdGlvbiAodHJhbnNpdGlvbiwgYmVoYXZpb3VyLCBlbGVtZW50LCBuZXh0LCB0YXNrKSB7XG4gICAgICAgICAgICB0YXNrKGJlZ2luRW50ZXIoYmVoYXZpb3VyKGVsZW1lbnQpKSk7XG4gICAgICAgICAgICBpZiAobmV4dCAmJiBlbGVtZW50IGluc3RhbmNlb2YgU3RhdGVKUy5TdGF0ZSkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucmVnaW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChyZWdpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdGFzayhiZWdpbkVudGVyKGJlaGF2aW91cihyZWdpb24pKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWdpb24gIT09IG5leHQucmVnaW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXNrKGVuZEVudGVyKGJlaGF2aW91cihyZWdpb24pKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEluaXRpYWxpc2VUcmFuc2l0aW9ucztcbiAgICB9KShTdGF0ZUpTLlZpc2l0b3IpO1xuICAgIC8vIGJvb3RzdHJhcHMgYWxsIHRoZSBlbGVtZW50cyB3aXRoaW4gYSBzdGF0ZSBtYWNoaW5lIG1vZGVsXG4gICAgdmFyIEluaXRpYWxpc2VFbGVtZW50cyA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgICAgIF9fZXh0ZW5kcyhJbml0aWFsaXNlRWxlbWVudHMsIF9zdXBlcik7XG4gICAgICAgIGZ1bmN0aW9uIEluaXRpYWxpc2VFbGVtZW50cygpIHtcbiAgICAgICAgICAgIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgdGhpcy5iZWhhdmlvdXJzID0ge307XG4gICAgICAgIH1cbiAgICAgICAgSW5pdGlhbGlzZUVsZW1lbnRzLnByb3RvdHlwZS5iZWhhdmlvdXIgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmVoYXZpb3Vyc1tlbGVtZW50LnF1YWxpZmllZE5hbWVdIHx8ICh0aGlzLmJlaGF2aW91cnNbZWxlbWVudC5xdWFsaWZpZWROYW1lXSA9IFtdKTtcbiAgICAgICAgfTtcbiAgICAgICAgSW5pdGlhbGlzZUVsZW1lbnRzLnByb3RvdHlwZS52aXNpdEVsZW1lbnQgPSBmdW5jdGlvbiAoZWxlbWVudCwgZGVlcEhpc3RvcnlBYm92ZSkge1xuICAgICAgICAgICAgaWYgKFN0YXRlSlMuY29uc29sZSAhPT0gZGVmYXVsdENvbnNvbGUpIHtcbiAgICAgICAgICAgICAgICBsZWF2ZSh0aGlzLmJlaGF2aW91cihlbGVtZW50KSkucHVzaChmdW5jdGlvbiAobWVzc2FnZSwgaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFN0YXRlSlMuY29uc29sZS5sb2coaW5zdGFuY2UgKyBcIiBsZWF2ZSBcIiArIGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJlZ2luRW50ZXIodGhpcy5iZWhhdmlvdXIoZWxlbWVudCkpLnB1c2goZnVuY3Rpb24gKG1lc3NhZ2UsIGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTdGF0ZUpTLmNvbnNvbGUubG9nKGluc3RhbmNlICsgXCIgZW50ZXIgXCIgKyBlbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgSW5pdGlhbGlzZUVsZW1lbnRzLnByb3RvdHlwZS52aXNpdFJlZ2lvbiA9IGZ1bmN0aW9uIChyZWdpb24sIGRlZXBIaXN0b3J5QWJvdmUpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgcmVnaW9uSW5pdGlhbCA9IHJlZ2lvbi52ZXJ0aWNlcy5yZWR1Y2UoZnVuY3Rpb24gKHJlc3VsdCwgdmVydGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZlcnRleCBpbnN0YW5jZW9mIFN0YXRlSlMuUHNldWRvU3RhdGUgJiYgdmVydGV4LmlzSW5pdGlhbCgpID8gdmVydGV4IDogcmVzdWx0O1xuICAgICAgICAgICAgfSwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIHJlZ2lvbi52ZXJ0aWNlcy5mb3JFYWNoKGZ1bmN0aW9uICh2ZXJ0ZXgpIHtcbiAgICAgICAgICAgICAgICB2ZXJ0ZXguYWNjZXB0KF90aGlzLCBkZWVwSGlzdG9yeUFib3ZlIHx8IHJlZ2lvbkluaXRpYWwgJiYgcmVnaW9uSW5pdGlhbC5raW5kID09PSBTdGF0ZUpTLlBzZXVkb1N0YXRlS2luZC5EZWVwSGlzdG9yeSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGxlYXZlIHRoZSBjdXJlbnQgYWN0aXZlIGNoaWxkIHN0YXRlIHdoZW4gZXhpdGluZyB0aGUgcmVnaW9uXG4gICAgICAgICAgICBsZWF2ZSh0aGlzLmJlaGF2aW91cihyZWdpb24pKS5wdXNoKGZ1bmN0aW9uIChtZXNzYWdlLCBzdGF0ZU1hY2hpbmVJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWF2ZShfdGhpcy5iZWhhdmlvdXIoc3RhdGVNYWNoaW5lSW5zdGFuY2UuZ2V0Q3VycmVudChyZWdpb24pKSkuaW52b2tlKG1lc3NhZ2UsIHN0YXRlTWFjaGluZUluc3RhbmNlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gZW50ZXIgdGhlIGFwcHJvcHJpYXRlIGNoaWxkIHZlcnRleCB3aGVuIGVudGVyaW5nIHRoZSByZWdpb25cbiAgICAgICAgICAgIGlmIChkZWVwSGlzdG9yeUFib3ZlIHx8ICFyZWdpb25Jbml0aWFsIHx8IHJlZ2lvbkluaXRpYWwuaXNIaXN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICBlbmRFbnRlcih0aGlzLmJlaGF2aW91cihyZWdpb24pKS5wdXNoKGZ1bmN0aW9uIChtZXNzYWdlLCBzdGF0ZU1hY2hpbmVJbnN0YW5jZSwgaGlzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICBlbnRlcihfdGhpcy5iZWhhdmlvdXIoaGlzdG9yeSB8fCByZWdpb25Jbml0aWFsLmlzSGlzdG9yeSgpID8gc3RhdGVNYWNoaW5lSW5zdGFuY2UuZ2V0Q3VycmVudChyZWdpb24pIHx8IHJlZ2lvbkluaXRpYWwgOiByZWdpb25Jbml0aWFsKSkuaW52b2tlKG1lc3NhZ2UsIHN0YXRlTWFjaGluZUluc3RhbmNlLCBoaXN0b3J5IHx8IHJlZ2lvbkluaXRpYWwua2luZCA9PT0gU3RhdGVKUy5Qc2V1ZG9TdGF0ZUtpbmQuRGVlcEhpc3RvcnkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbmRFbnRlcih0aGlzLmJlaGF2aW91cihyZWdpb24pKS5wdXNoKGVudGVyKHRoaXMuYmVoYXZpb3VyKHJlZ2lvbkluaXRpYWwpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnZpc2l0RWxlbWVudChyZWdpb24sIGRlZXBIaXN0b3J5QWJvdmUpO1xuICAgICAgICB9O1xuICAgICAgICBJbml0aWFsaXNlRWxlbWVudHMucHJvdG90eXBlLnZpc2l0UHNldWRvU3RhdGUgPSBmdW5jdGlvbiAocHNldWRvU3RhdGUsIGRlZXBIaXN0b3J5QWJvdmUpIHtcbiAgICAgICAgICAgIF9zdXBlci5wcm90b3R5cGUudmlzaXRQc2V1ZG9TdGF0ZS5jYWxsKHRoaXMsIHBzZXVkb1N0YXRlLCBkZWVwSGlzdG9yeUFib3ZlKTtcbiAgICAgICAgICAgIC8vIGV2YWx1YXRlIGNvbXBwbGV0aW9uIHRyYW5zaXRpb25zIG9uY2UgdmVydGV4IGVudHJ5IGlzIGNvbXBsZXRlXG4gICAgICAgICAgICBpZiAocHNldWRvU3RhdGUuaXNJbml0aWFsKCkpIHtcbiAgICAgICAgICAgICAgICBlbmRFbnRlcih0aGlzLmJlaGF2aW91cihwc2V1ZG9TdGF0ZSkpLnB1c2goZnVuY3Rpb24gKG1lc3NhZ2UsIHN0YXRlTWFjaGluZUluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cmF2ZXJzZShwc2V1ZG9TdGF0ZS5vdXRnb2luZ1swXSwgc3RhdGVNYWNoaW5lSW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwc2V1ZG9TdGF0ZS5raW5kID09PSBTdGF0ZUpTLlBzZXVkb1N0YXRlS2luZC5UZXJtaW5hdGUpIHtcbiAgICAgICAgICAgICAgICAvLyB0ZXJtaW5hdGUgdGhlIHN0YXRlIG1hY2hpbmUgaW5zdGFuY2UgdXBvbiB0cmFuc2l0aW9uIHRvIGEgdGVybWluYXRlIHBzZXVkbyBzdGF0ZVxuICAgICAgICAgICAgICAgIGJlZ2luRW50ZXIodGhpcy5iZWhhdmlvdXIocHNldWRvU3RhdGUpKS5wdXNoKGZ1bmN0aW9uIChtZXNzYWdlLCBzdGF0ZU1hY2hpbmVJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGVNYWNoaW5lSW5zdGFuY2UuaXNUZXJtaW5hdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgSW5pdGlhbGlzZUVsZW1lbnRzLnByb3RvdHlwZS52aXNpdFN0YXRlID0gZnVuY3Rpb24gKHN0YXRlLCBkZWVwSGlzdG9yeUFib3ZlKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgLy8gTk9URTogbWFudWFsbHkgaXRlcmF0ZSBvdmVyIHRoZSBjaGlsZCByZWdpb25zIHRvIGNvbnRyb2wgdGhlIHNlcXVlbmNlIG9mIGJlaGF2aW91clxuICAgICAgICAgICAgc3RhdGUucmVnaW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChyZWdpb24pIHtcbiAgICAgICAgICAgICAgICByZWdpb24uYWNjZXB0KF90aGlzLCBkZWVwSGlzdG9yeUFib3ZlKTtcbiAgICAgICAgICAgICAgICBsZWF2ZShfdGhpcy5iZWhhdmlvdXIoc3RhdGUpKS5wdXNoKGxlYXZlKF90aGlzLmJlaGF2aW91cihyZWdpb24pKSk7XG4gICAgICAgICAgICAgICAgZW5kRW50ZXIoX3RoaXMuYmVoYXZpb3VyKHN0YXRlKSkucHVzaChlbnRlcihfdGhpcy5iZWhhdmlvdXIocmVnaW9uKSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnZpc2l0VmVydGV4KHN0YXRlLCBkZWVwSGlzdG9yeUFib3ZlKTtcbiAgICAgICAgICAgIC8vIGFkZCB0aGUgdXNlciBkZWZpbmVkIGJlaGF2aW91ciB3aGVuIGVudGVyaW5nIGFuZCBleGl0aW5nIHN0YXRlc1xuICAgICAgICAgICAgbGVhdmUodGhpcy5iZWhhdmlvdXIoc3RhdGUpKS5wdXNoKHN0YXRlLmV4aXRCZWhhdmlvcik7XG4gICAgICAgICAgICBiZWdpbkVudGVyKHRoaXMuYmVoYXZpb3VyKHN0YXRlKSkucHVzaChzdGF0ZS5lbnRyeUJlaGF2aW9yKTtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgcGFyZW50IHJlZ2lvbnMgY3VycmVudCBzdGF0ZVxuICAgICAgICAgICAgYmVnaW5FbnRlcih0aGlzLmJlaGF2aW91cihzdGF0ZSkpLnB1c2goZnVuY3Rpb24gKG1lc3NhZ2UsIHN0YXRlTWFjaGluZUluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLnJlZ2lvbikge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZU1hY2hpbmVJbnN0YW5jZS5zZXRDdXJyZW50KHN0YXRlLnJlZ2lvbiwgc3RhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBJbml0aWFsaXNlRWxlbWVudHMucHJvdG90eXBlLnZpc2l0U3RhdGVNYWNoaW5lID0gZnVuY3Rpb24gKHN0YXRlTWFjaGluZSwgZGVlcEhpc3RvcnlBYm92ZSkge1xuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIF9zdXBlci5wcm90b3R5cGUudmlzaXRTdGF0ZU1hY2hpbmUuY2FsbCh0aGlzLCBzdGF0ZU1hY2hpbmUsIGRlZXBIaXN0b3J5QWJvdmUpO1xuICAgICAgICAgICAgLy8gaW5pdGlhaXNlIGFsbCB0aGUgdHJhbnNpdGlvbnMgb25jZSBhbGwgdGhlIGVsZW1lbnRzIGhhdmUgYmVlbiBpbml0aWFsaXNlZFxuICAgICAgICAgICAgc3RhdGVNYWNoaW5lLmFjY2VwdChuZXcgSW5pdGlhbGlzZVRyYW5zaXRpb25zKCksIGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLmJlaGF2aW91cihlbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gZGVmaW5lIHRoZSBiZWhhdmlvdXIgZm9yIGluaXRpYWxpc2luZyBhIHN0YXRlIG1hY2hpbmUgaW5zdGFuY2VcbiAgICAgICAgICAgIHN0YXRlTWFjaGluZS5vbkluaXRpYWxpc2UgPSBlbnRlcih0aGlzLmJlaGF2aW91cihzdGF0ZU1hY2hpbmUpKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEluaXRpYWxpc2VFbGVtZW50cztcbiAgICB9KShTdGF0ZUpTLlZpc2l0b3IpO1xuICAgIHZhciBkZWZhdWx0Q29uc29sZSA9IHtcbiAgICAgICAgbG9nOiBmdW5jdGlvbiBsb2cobWVzc2FnZSkge1xuICAgICAgICAgICAgdmFyIG9wdGlvbmFsUGFyYW1zID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgIG9wdGlvbmFsUGFyYW1zW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB3YXJuOiBmdW5jdGlvbiB3YXJuKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25hbFBhcmFtcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICBvcHRpb25hbFBhcmFtc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25hbFBhcmFtcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICBvcHRpb25hbFBhcmFtc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG1lc3NhZ2U7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxyXG4gICAgICogVGhlIG9iamVjdCB1c2VkIGZvciBsb2csIHdhcm5pbmcgYW5kIGVycm9yIG1lc3NhZ2VzXHJcbiAgICAgKiBAbWVtYmVyIHtJQ29uc29sZX1cclxuICAgICAqL1xuICAgIFN0YXRlSlMuY29uc29sZSA9IGRlZmF1bHRDb25zb2xlO1xufSkoU3RhdGVKUyB8fCAoU3RhdGVKUyA9IHt9KSk7XG4vKlxyXG4gKiBGaW5pdGUgc3RhdGUgbWFjaGluZSBsaWJyYXJ5XHJcbiAqIENvcHlyaWdodCAoYykgMjAxNC01IFN0ZWVsYnJlZXplIExpbWl0ZWRcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBhbmQgR1BMIHYzIGxpY2VuY2VzXHJcbiAqIGh0dHA6Ly93d3cuc3RlZWxicmVlemUubmV0L3N0YXRlLmNzXHJcbiAqL1xudmFyIFN0YXRlSlM7XG4oZnVuY3Rpb24gKFN0YXRlSlMpIHtcbiAgICAvKipcclxuICAgICAqIFZhbGlkYXRlcyBhIHN0YXRlIG1hY2hpbmUgbW9kZWwgZm9yIGNvcnJlY3RuZXNzIChzZWUgdGhlIGNvbnN0cmFpbnRzIGRlZmluZWQgd2l0aGluIHRoZSBVTUwgU3VwZXJzdHJ1Y3R1cmUgc3BlY2lmaWNhdGlvbikuXHJcbiAgICAgKiBAZnVuY3Rpb24gdmFsaWRhdGVcclxuICAgICAqIEBwYXJhbSB7U3RhdGVNYWNoaW5lfSBzdGF0ZU1hY2hpbmVNb2RlbCBUaGUgc3RhdGUgbWFjaGluZSBtb2RlbCB0byB2YWxpZGF0ZS5cclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHZhbGlkYXRlKHN0YXRlTWFjaGluZU1vZGVsKSB7XG4gICAgICAgIHN0YXRlTWFjaGluZU1vZGVsLmFjY2VwdChuZXcgVmFsaWRhdG9yKCkpO1xuICAgIH1cbiAgICBTdGF0ZUpTLnZhbGlkYXRlID0gdmFsaWRhdGU7XG4gICAgZnVuY3Rpb24gYW5jZXN0b3JzKHZlcnRleCkge1xuICAgICAgICByZXR1cm4gKHZlcnRleC5yZWdpb24gPyBhbmNlc3RvcnModmVydGV4LnJlZ2lvbi5zdGF0ZSkgOiBbXSkuY29uY2F0KHZlcnRleCk7XG4gICAgfVxuICAgIHZhciBWYWxpZGF0b3IgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgICAgICBfX2V4dGVuZHMoVmFsaWRhdG9yLCBfc3VwZXIpO1xuICAgICAgICBmdW5jdGlvbiBWYWxpZGF0b3IoKSB7XG4gICAgICAgICAgICBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgICAgICBWYWxpZGF0b3IucHJvdG90eXBlLnZpc2l0UHNldWRvU3RhdGUgPSBmdW5jdGlvbiAocHNldWRvU3RhdGUpIHtcbiAgICAgICAgICAgIF9zdXBlci5wcm90b3R5cGUudmlzaXRQc2V1ZG9TdGF0ZS5jYWxsKHRoaXMsIHBzZXVkb1N0YXRlKTtcbiAgICAgICAgICAgIGlmIChwc2V1ZG9TdGF0ZS5raW5kID09PSBTdGF0ZUpTLlBzZXVkb1N0YXRlS2luZC5DaG9pY2UgfHwgcHNldWRvU3RhdGUua2luZCA9PT0gU3RhdGVKUy5Qc2V1ZG9TdGF0ZUtpbmQuSnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAvLyBbN10gSW4gYSBjb21wbGV0ZSBzdGF0ZW1hY2hpbmUsIGEganVuY3Rpb24gdmVydGV4IG11c3QgaGF2ZSBhdCBsZWFzdCBvbmUgaW5jb21pbmcgYW5kIG9uZSBvdXRnb2luZyB0cmFuc2l0aW9uLlxuICAgICAgICAgICAgICAgIC8vIFs4XSBJbiBhIGNvbXBsZXRlIHN0YXRlbWFjaGluZSwgYSBjaG9pY2UgdmVydGV4IG11c3QgaGF2ZSBhdCBsZWFzdCBvbmUgaW5jb21pbmcgYW5kIG9uZSBvdXRnb2luZyB0cmFuc2l0aW9uLlxuICAgICAgICAgICAgICAgIGlmIChwc2V1ZG9TdGF0ZS5vdXRnb2luZy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgU3RhdGVKUy5jb25zb2xlLmVycm9yKHBzZXVkb1N0YXRlICsgXCI6IFwiICsgcHNldWRvU3RhdGUua2luZCArIFwiIHBzZXVkbyBzdGF0ZXMgbXVzdCBoYXZlIGF0IGxlYXN0IG9uZSBvdXRnb2luZyB0cmFuc2l0aW9uLlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gY2hvaWNlIGFuZCBqdW5jdGlvbiBwc2V1ZG8gc3RhdGUgY2FuIGhhdmUgYXQgbW9zdCBvbmUgZWxzZSB0cmFuc2l0aW9uXG4gICAgICAgICAgICAgICAgaWYgKHBzZXVkb1N0YXRlLm91dGdvaW5nLmZpbHRlcihmdW5jdGlvbiAodHJhbnNpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnNpdGlvbi5ndWFyZCA9PT0gU3RhdGVKUy5UcmFuc2l0aW9uLkZhbHNlR3VhcmQ7XG4gICAgICAgICAgICAgICAgfSkubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICBTdGF0ZUpTLmNvbnNvbGUuZXJyb3IocHNldWRvU3RhdGUgKyBcIjogXCIgKyBwc2V1ZG9TdGF0ZS5raW5kICsgXCIgcHNldWRvIHN0YXRlcyBjYW5ub3QgaGF2ZSBtb3JlIHRoYW4gb25lIEVsc2UgdHJhbnNpdGlvbnMuXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gbm9uIGNob2ljZS9qdW5jdGlvbiBwc2V1ZG8gc3RhdGUgbWF5IG5vdCBoYXZlIGVsc2UgdHJhbnNpdGlvbnNcbiAgICAgICAgICAgICAgICBpZiAocHNldWRvU3RhdGUub3V0Z29pbmcuZmlsdGVyKGZ1bmN0aW9uICh0cmFuc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cmFuc2l0aW9uLmd1YXJkID09PSBTdGF0ZUpTLlRyYW5zaXRpb24uRmFsc2VHdWFyZDtcbiAgICAgICAgICAgICAgICB9KS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgU3RhdGVKUy5jb25zb2xlLmVycm9yKHBzZXVkb1N0YXRlICsgXCI6IFwiICsgcHNldWRvU3RhdGUua2luZCArIFwiIHBzZXVkbyBzdGF0ZXMgY2Fubm90IGhhdmUgRWxzZSB0cmFuc2l0aW9ucy5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChwc2V1ZG9TdGF0ZS5pc0luaXRpYWwoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHNldWRvU3RhdGUub3V0Z29pbmcubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBbMV0gQW4gaW5pdGlhbCB2ZXJ0ZXggY2FuIGhhdmUgYXQgbW9zdCBvbmUgb3V0Z29pbmcgdHJhbnNpdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFsyXSBIaXN0b3J5IHZlcnRpY2VzIGNhbiBoYXZlIGF0IG1vc3Qgb25lIG91dGdvaW5nIHRyYW5zaXRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICBTdGF0ZUpTLmNvbnNvbGUuZXJyb3IocHNldWRvU3RhdGUgKyBcIjogaW5pdGlhbCBwc2V1ZG8gc3RhdGVzIG11c3QgaGF2ZSBvbmUgb3V0Z29pbmcgdHJhbnNpdGlvbi5cIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBbOV0gVGhlIG91dGdvaW5nIHRyYW5zaXRpb24gZnJvbSBhbiBpbml0aWFsIHZlcnRleCBtYXkgaGF2ZSBhIGJlaGF2aW9yLCBidXQgbm90IGEgdHJpZ2dlciBvciBndWFyZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwc2V1ZG9TdGF0ZS5vdXRnb2luZ1swXS5ndWFyZCAhPT0gU3RhdGVKUy5UcmFuc2l0aW9uLlRydWVHdWFyZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0YXRlSlMuY29uc29sZS5lcnJvcihwc2V1ZG9TdGF0ZSArIFwiOiBpbml0aWFsIHBzZXVkbyBzdGF0ZXMgY2Fubm90IGhhdmUgYSBndWFyZCBjb25kaXRpb24uXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBWYWxpZGF0b3IucHJvdG90eXBlLnZpc2l0UmVnaW9uID0gZnVuY3Rpb24gKHJlZ2lvbikge1xuICAgICAgICAgICAgX3N1cGVyLnByb3RvdHlwZS52aXNpdFJlZ2lvbi5jYWxsKHRoaXMsIHJlZ2lvbik7XG4gICAgICAgICAgICAvLyBbMV0gQSByZWdpb24gY2FuIGhhdmUgYXQgbW9zdCBvbmUgaW5pdGlhbCB2ZXJ0ZXguXG4gICAgICAgICAgICAvLyBbMl0gQSByZWdpb24gY2FuIGhhdmUgYXQgbW9zdCBvbmUgZGVlcCBoaXN0b3J5IHZlcnRleC5cbiAgICAgICAgICAgIC8vIFszXSBBIHJlZ2lvbiBjYW4gaGF2ZSBhdCBtb3N0IG9uZSBzaGFsbG93IGhpc3RvcnkgdmVydGV4LlxuICAgICAgICAgICAgdmFyIGluaXRpYWw7XG4gICAgICAgICAgICByZWdpb24udmVydGljZXMuZm9yRWFjaChmdW5jdGlvbiAodmVydGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKHZlcnRleCBpbnN0YW5jZW9mIFN0YXRlSlMuUHNldWRvU3RhdGUgJiYgdmVydGV4LmlzSW5pdGlhbCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbml0aWFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTdGF0ZUpTLmNvbnNvbGUuZXJyb3IocmVnaW9uICsgXCI6IHJlZ2lvbnMgbWF5IGhhdmUgYXQgbW9zdCBvbmUgaW5pdGlhbCBwc2V1ZG8gc3RhdGUuXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGluaXRpYWwgPSB2ZXJ0ZXg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIFZhbGlkYXRvci5wcm90b3R5cGUudmlzaXRTdGF0ZSA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICAgICAgX3N1cGVyLnByb3RvdHlwZS52aXNpdFN0YXRlLmNhbGwodGhpcywgc3RhdGUpO1xuICAgICAgICAgICAgaWYgKHN0YXRlLnJlZ2lvbnMuZmlsdGVyKGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZS5uYW1lID09PSBTdGF0ZUpTLlJlZ2lvbi5kZWZhdWx0TmFtZTtcbiAgICAgICAgICAgIH0pLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBTdGF0ZUpTLmNvbnNvbGUuZXJyb3Ioc3RhdGUgKyBcIjogYSBzdGF0ZSBjYW5ub3QgaGF2ZSBtb3JlIHRoYW4gb25lIHJlZ2lvbiBuYW1lZCBcIiArIFN0YXRlSlMuUmVnaW9uLmRlZmF1bHROYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgVmFsaWRhdG9yLnByb3RvdHlwZS52aXNpdEZpbmFsU3RhdGUgPSBmdW5jdGlvbiAoZmluYWxTdGF0ZSkge1xuICAgICAgICAgICAgX3N1cGVyLnByb3RvdHlwZS52aXNpdEZpbmFsU3RhdGUuY2FsbCh0aGlzLCBmaW5hbFN0YXRlKTtcbiAgICAgICAgICAgIC8vIFsxXSBBIGZpbmFsIHN0YXRlIGNhbm5vdCBoYXZlIGFueSBvdXRnb2luZyB0cmFuc2l0aW9ucy5cbiAgICAgICAgICAgIGlmIChmaW5hbFN0YXRlLm91dGdvaW5nLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIFN0YXRlSlMuY29uc29sZS5lcnJvcihmaW5hbFN0YXRlICsgXCI6IGZpbmFsIHN0YXRlcyBtdXN0IG5vdCBoYXZlIG91dGdvaW5nIHRyYW5zaXRpb25zLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFsyXSBBIGZpbmFsIHN0YXRlIGNhbm5vdCBoYXZlIHJlZ2lvbnMuXG4gICAgICAgICAgICBpZiAoZmluYWxTdGF0ZS5yZWdpb25zLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIFN0YXRlSlMuY29uc29sZS5lcnJvcihmaW5hbFN0YXRlICsgXCI6IGZpbmFsIHN0YXRlcyBtdXN0IG5vdCBoYXZlIGNoaWxkIHJlZ2lvbnMuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gWzRdIEEgZmluYWwgc3RhdGUgaGFzIG5vIGVudHJ5IGJlaGF2aW9yLlxuICAgICAgICAgICAgaWYgKGZpbmFsU3RhdGUuZW50cnlCZWhhdmlvci5oYXNBY3Rpb25zKCkpIHtcbiAgICAgICAgICAgICAgICBTdGF0ZUpTLmNvbnNvbGUud2FybihmaW5hbFN0YXRlICsgXCI6IGZpbmFsIHN0YXRlcyBtYXkgbm90IGhhdmUgZW50cnkgYmVoYXZpb3IuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gWzVdIEEgZmluYWwgc3RhdGUgaGFzIG5vIGV4aXQgYmVoYXZpb3IuXG4gICAgICAgICAgICBpZiAoZmluYWxTdGF0ZS5leGl0QmVoYXZpb3IuaGFzQWN0aW9ucygpKSB7XG4gICAgICAgICAgICAgICAgU3RhdGVKUy5jb25zb2xlLndhcm4oZmluYWxTdGF0ZSArIFwiOiBmaW5hbCBzdGF0ZXMgbWF5IG5vdCBoYXZlIGV4aXQgYmVoYXZpb3IuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBWYWxpZGF0b3IucHJvdG90eXBlLnZpc2l0VHJhbnNpdGlvbiA9IGZ1bmN0aW9uICh0cmFuc2l0aW9uKSB7XG4gICAgICAgICAgICBfc3VwZXIucHJvdG90eXBlLnZpc2l0VHJhbnNpdGlvbi5jYWxsKHRoaXMsIHRyYW5zaXRpb24pO1xuICAgICAgICAgICAgLy8gTG9jYWwgdHJhbnNpdGlvbiB0YXJnZXQgdmVydGljZXMgbXVzdCBiZSBhIGNoaWxkIG9mIHRoZSBzb3VyY2UgdmVydGV4XG4gICAgICAgICAgICBpZiAodHJhbnNpdGlvbi5raW5kID09PSBTdGF0ZUpTLlRyYW5zaXRpb25LaW5kLkxvY2FsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFuY2VzdG9ycyh0cmFuc2l0aW9uLnRhcmdldCkuaW5kZXhPZih0cmFuc2l0aW9uLnNvdXJjZSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIFN0YXRlSlMuY29uc29sZS5lcnJvcih0cmFuc2l0aW9uICsgXCI6IGxvY2FsIHRyYW5zaXRpb24gdGFyZ2V0IHZlcnRpY2VzIG11c3QgYmUgYSBjaGlsZCBvZiB0aGUgc291cmNlIGNvbXBvc2l0ZSBzYXRlLlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBWYWxpZGF0b3I7XG4gICAgfSkoU3RhdGVKUy5WaXNpdG9yKTtcbn0pKFN0YXRlSlMgfHwgKFN0YXRlSlMgPSB7fSkpO1xuLypcclxuICogRmluaXRlIHN0YXRlIG1hY2hpbmUgbGlicmFyeVxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtNSBTdGVlbGJyZWV6ZSBMaW1pdGVkXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCB2MyBsaWNlbmNlc1xyXG4gKiBodHRwOi8vd3d3LnN0ZWVsYnJlZXplLm5ldC9zdGF0ZS5jc1xyXG4gKi9cbi8vdmFyIG1vZHVsZSA9IG1vZHVsZTtcbm1vZHVsZS5leHBvcnRzID0gU3RhdGVKUztcblxuY2MuX1JGcG9wKCk7Il19
