var player;
function flash_load() {
    var urlinput = document.getElementsByName('urlinput')[0];
    // var liveUrl = urlinput.value + '.m3u8';
    var liveUrl = 'rtmp://192.168.1.249:1935/live/xmpolice';
    /*直播视频播放m3u8地址*/
    var liveFlash = document.getElementById("liveFlash");
    // var flashvars = {
    //     f: liveUrl,
    //     c: 0
    // };
    // var video = ['http://192.168.1.249:8080/live/xmpolice.m3u8'];
    // CKobject.embed('swf/ckplayer.swf', 'liveFlash', 'ckplayer_a1', '100%', '100%', false, flashvars, video);

    // var params = { bgcolor: '#FFF', allowFullScreen: true, allowScriptAccess: 'always', wmode: '#000' };
    // CKobject.embedSWF('swf/testhls.swf', 'liveFlash', 'ckplayer_a1', '100%', '100%', flashvars, params);

    var flashvars = {
        f: liveUrl,//视频地址  
        s: '0'
    };
    var params = { bgcolor: '#000000', allowFullScreen: true, allowScriptAccess: 'always', wmode: '#000' };
    CKobject.embedSWF('swf/ckplayer.swf', 'liveFlash', 'ckplayer_a1', '100%', '100%', flashvars, params);
}
function hls_load() {
    console.log('isSupported: ' + Hls.isSupported());
    var urlinput = document.getElementsByName('urlinput')[0];

    var video = document.getElementsByName('videoElement')[0];

    var liveUrl = urlinput.value + '.m3u8';

    if (Hls.isSupported()) {
        // var video = document.getElementById('video');
        var hls = new Hls();
        hls.loadSource(liveUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play();
        });
    }
}
function flv_load() {
    console.log('isSupported: ' + flvjs.isSupported());
    var urlinput = document.getElementsByName('urlinput')[0];

    var element = document.getElementsByName('videoElement')[0];

    var liveUrl = urlinput.value + '.flv';
    if (typeof player !== "undefined") {
        if (player != null) {
            player.unload();
            player.detachMediaElement();
            player.destroy();
            player = null;
        }
    }
    player = flvjs.createPlayer({
        type: 'flv',
        isLive: true,
        cors: true,
        url: liveUrl,
        Config: {
            enableWorker: true,
            enableStashBuffer: false,
            stashInitialSize: 128   // 减少首桢显示等待时长
        }
    });

    player.attachMediaElement(element);
    player.load();
    player.play();

    /*
    var xhr = new XMLHttpRequest();
    xhr.open('GET', urlinput.value, true);
    xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
    xhr.onload = function (e) {
        
    }
    xhr.send(null);
    */
}

function flv_start() {
    player.play();
}

function flv_pause() {
    player.pause();
}

function flv_destroy() {
    player.pause();
    player.unload();
    player.detachMediaElement();
    player.destroy();
    player = null;
}

function flv_seekto() {
    var input = document.getElementsByName('seekpoint')[0];
    player.currentTime = parseFloat(input.value);
}

function getUrlParam(key, defaultValue) {
    var pageUrl = window.location.search.substring(1);
    var pairs = pageUrl.split('&');
    for (var i = 0; i < pairs.length; i++) {
        var keyAndValue = pairs[i].split('=');
        if (keyAndValue[0] === key) {
            return keyAndValue[1];
        }
    }
    return defaultValue;
}

var urlInputBox = document.getElementsByName('urlinput')[0];
var url = decodeURIComponent(getUrlParam('src', urlInputBox.value));
urlInputBox.value = url;

var logcatbox = document.getElementsByName('logcatbox')[0];
flvjs.LoggingControl.addLogListener(function (type, str) {
    logcatbox.value = logcatbox.value + str + '\n';
    logcatbox.scrollTop = logcatbox.scrollHeight;
});