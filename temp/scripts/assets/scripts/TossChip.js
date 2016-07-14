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