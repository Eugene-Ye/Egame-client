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