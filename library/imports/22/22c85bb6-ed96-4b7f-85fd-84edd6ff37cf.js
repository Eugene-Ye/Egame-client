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