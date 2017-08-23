(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(jQuery);
    }
}(function ($) {

    var pluginName = 'videoPlayer',
        videoPlayer = function (config, el) {
            var defaultConfig = {
                // 播放器容器
                playerContainer: el,
                // 直播(true)还是点播(false)
                isLive: false,
                // 播放器类型
                playerType: 'Html5',    // Html5 - Flash
                // 直播视频流 rtmp视频流 - http-flv视频流 - hls分片视频索引文件(m3u8)
                liveStramUrl: {
                    RTMP: '',
                    HLS: '',
                    HTTPFLV: ''
                },
                // 播放视频源  - .flv - .mp4 - .ts 等等
                videoUrl: '',
                // 播放器主体
                player: ''
            };
            config = $.extend(defaultConfig, config);
            initVideoUrl(config);
            initPlayer(config);

            var _oFunc = {
                destroy: function () {
                    config.player.destroy();
                    config.playerContainer.find('.liveContent').remove();
                }
            };

            return _oFunc;
        },
        videoType = {
            rtmp: 'RTMP',
            flv: 'FLV',
            hls: 'HLS',
            html5: 'HTML5'
        },
        idCount = {
            Html5: 0,
            Flash: 0
        };

    function initVideoUrl(config) {
        if (config.isLive) {
            if (flvjs.isSupported() && config.liveStramUrl.HTTPFLV) {
                config.videoUrl = config.liveStramUrl.HTTPFLV;
            } else if (Hls.isSupported() && config.liveStramUrl.HLS) {
                config.videoUrl = config.liveStramUrl.HLS;
            } else if (config.liveStramUrl.RTMP) {
                config.videoUrl = config.liveStramUrl.RTMP;
            }
        }
    }
    function initPlayer(config) {
        if (!config.videoUrl) {
            alert('请传入视频路径！');
            return;
        }
        // 1. 直播
        if (config.isLive) {
            switch (config.playerType) {
                case 'Html5':
                    liveHtml5(config);
                    break;
                case 'Flash':
                    liveFlash(config);
                    break;
                default:
                    liveFlash(config);
                    break;
            }
        }
        // 2. 点播
        else {
            switch (config.playerType) {
                case 'Html5':
                    onDemandHtml5(config);
                    break;
                case 'Flash':
                    onDemandFlash(config);
                    break;
                default:
                    onDemandFlash(config);
                    break;
            }
        }
    }

    // liveHtml5 - HTML5直播处理
    function liveHtml5(config) {
        switch (getVideoType(config.videoUrl)) {
            case videoType.flv:
                loadFlv(config);
                break;
            case videoType.hls:
                loadHls(config);
                break;
            default:
                alert('请传入正确的直播流地址！');
                break;
        }
    }
    // liveFlash - FLASH直播处理
    function liveFlash(config) {
        loadFlash(config);
    }
    // onDemandHtml5 - HTML5点播处理
    function onDemandHtml5(config) {
        switch (getVideoType(config.videoUrl)) {
            case videoType.flv:
                loadFlv(config);
                break;
            case videoType.hls:
                loadHls(config);
                break;
            default:
                loadHtml5(config);
                break;
        }
    }
    // onDemandFlash - Flash点播处理
    function onDemandFlash(config) {
        loadFlash(config);
    }

    // getVideoType - 获取视频类型
    function getVideoType(videoUrl) {

        var regHLS = /\.m3u8$/gi,
            regFLV = /\.flv$/gi,
            regHTML5 = /\.mp4|\.ogg|\.webm/gi,
            regRTMP = /^rtmp:/gi;

        if (regRTMP.test(videoUrl)) {
            return videoType.rtmp;
        } else if (regFLV.test(videoUrl)) {
            return videoType.flv;
        }
        else if (regHLS.test(videoUrl)) {
            return videoType.hls;
        }
        else if (regHTML5.test(videoUrl)) {
            return videoType.html5;
        }
    }

    // 初始化播放器结构 并返回生成的播放器DOM ID    
    function initVideoStruct(config) {

        var playerContainer = config.playerContainer,
            videoIdFormal = config.isLive ? 'live' : 'onDemand',
            playerId = videoIdFormal + config.playerType + '-' + idCount.Html5++,
            videoString = '<div class="liveContent">\
                        <video id="'+ playerId + '" controls autoplay>\
                            Your browser is too old which does not support HTML5 video\
                        </video >\
                    </div > ';
        playerContainer.append(videoString);

        return playerId;
    }

    function loadFlv(config) {
        var playerId = initVideoStruct(config),
            videoDom = document.getElementById(playerId),
            player = flvjs.createPlayer({
                type: 'flv',
                isLive: config.isLive,
                cors: config.isLive,
                url: config.videoUrl,
                Config: {
                    //fixAudioTimestampGap: false,
                    //autoCleanupSourceBuffer: true,  // 自动清理MSE内存
                    enableWorker: true,
                    enableStashBuffer: false,
                    stashInitialSize: 128   // 减少首桢显示等待时长
                }
            });
        player.attachMediaElement(videoDom);
        player.load();

        config.player = player;
    }

    function loadHls(config) {
        var playerId = initVideoStruct(config),
            player = document.getElementById(playerId),
            hls = new Hls();

        hls.loadSource(config.videoUrl);
        hls.attachMedia(player);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            player.play();
        });
        hls.on(Hls.Events.ERROR, function (event, data) {
            switch (data.type) {
                case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log("MEDIA error ...");
                    hls.destroy();
                    break;
                case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log("network error ...");
                    break;
                default:
                    _hls.destroy();
                    break;
            }
        });

        config.player = hls;
    }

    function loadHtml5(config) {
        var playerId = initVideoStruct(config),
            player = document.getElementById(playerId);
        player.src = config.videoUrl;
        player.oncanplay = function () {
            player.play();
        }
        config.player = player;
        // 自定义 destroy
        config.player.destroy = function () {
            player.pause();
        }
    }

    function loadFlash(config) {
        var playerId = initVideoStruct(config);
        var swfVersionStr = "9.0.0",
            xiSwfUrlStr = "swf/expressInstall.swf",
            playerSwfUrlStr = "swf/player.swf",
            soFlashVars = {
                src: config.videoUrl,
                streamType: config.isLive ? 'live' : '',
                autoPlay: "true",
                controlBarAutoHide: "true",
                controlBarPosition: "bottom"
            },
            params = {
                quality: 'high',
                allowscriptaccess: 'sameDomain',
            };

        swfobject.embedSWF(playerSwfUrlStr, playerId, "100%", "100%", swfVersionStr, xiSwfUrlStr, soFlashVars, params);
        config.player = swfobject;
        // 自定义 destroy
        config.player.destroy = function () {
            swfobject.removeSWF(playerId);
        }
    }

    jQuery.fn[pluginName] = function (options) {
        return new videoPlayer(options, this);
    };
}));