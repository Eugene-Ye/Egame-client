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