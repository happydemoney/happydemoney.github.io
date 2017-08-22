(function () {

    var videoPlayer = function (playerId, oVideoStreamUrl, playerType) {
        initPlayer(playerId, oVideoStreamUrl, playerType);
    }

    function initPlayer(playerId, oVideoStreamUrl, playerType) {
        console.log();
        switch (playerType.playerType) {
            case 'Flash':
                loadFlash(playerId, oVideoStreamUrl, playerType);
                break;
            case 'FlvJs':
                loadFlv(playerId, oVideoStreamUrl, playerType);
                break;
            case 'Html5':
                loadHtml5(playerId, oVideoStreamUrl, playerType);
                break;
            default:
                _defultPlayer();
                break;
        }
        function _defultPlayer() {
            // 1. 当前浏览器环境是否支持 flv.js
            if (flvjs.isSupported()) {
                loadFlv(playerId, oVideoStreamUrl, playerType);
            }
            // 2. 是否支持hls.js
            else if (Hls.isSupported()) {
                loadHtml5(playerId, oVideoStreamUrl, playerType);
            }
            // 3. 用flash播放
            else {
                loadFlash(playerId, oVideoStreamUrl, playerType);
            }
        }
    }

    function loadFlv(playerId, oVideoStreamUrl, playerType) {
        var playerId = document.getElementById(playerId),
            player = flvjs.createPlayer({
                type: 'flv',
                isLive: playerType.isLive,
                cors: playerType.isLive,
                url: oVideoStreamUrl.flv,
                Config: {
                    // fixAudioTimestampGap: false,
                    enableWorker: true,
                    enableStashBuffer: false,
                    stashInitialSize: 128   // 减少首桢显示等待时长
                }
            });

        player.attachMediaElement(playerId);
        player.load();
        console.log();
        player.on(flvjs.Events.LOADING_COMPLETE, function () {
            console.log('加载完成');
        });
        //player.play();
    }

    function loadHtml5(playerId, oVideoStreamUrl, playerType) {

        var videoUrl = oVideoStreamUrl.html5,
            hasM3u8 = videoUrl.lastIndexOf(".m3u8") < 0 ? false : true,
            player = document.getElementById(playerId);

        // 如果后缀为m3u8 通过Hls.js加载播放
        if (hasM3u8) {
            var hls = new Hls();
            hls.loadSource(videoUrl);
            hls.attachMedia(player);
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                player.play();
            });
        }
        // .mp4 / ogg / webM 用原声video标签播放
        else {
            player.src = videoUrl;
            player.oncanplay = function () {
                player.play();
            }
        }
    }

    function loadFlash(playerId, oVideoStreamUrl, playerType) {

        var swfVersionStr = "9.0.0",
            xiSwfUrlStr = "swf/expressInstall.swf",
            playerSwfUrlStr = "swf/player.swf",
            soFlashVars = {
                src: oVideoStreamUrl.flash,
                streamType: playerType.isLive ? 'live' : '',
                autoPlay: "true",
                controlBarAutoHide: "true",
                controlBarPosition: "bottom"
            },
            params = {
                quality: 'high',
                allowscriptaccess: 'sameDomain',
            };

        swfobject.embedSWF(playerSwfUrlStr, playerId, "100%", "100%", swfVersionStr, xiSwfUrlStr, soFlashVars, params);
    }

    window.videoPlayer = videoPlayer;
})(window);