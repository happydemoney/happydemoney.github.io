/**
 *  @description:   videoPlayer.js
 *  @version:   v1.0.0
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(jQuery);
    }
}(function ($) {

    // 是否是支持触摸的设备    
    var isTouchDevice = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|playbook|silk|BlackBerry|BB10|Windows Phone|Tizen|Bada|webOS|IEMobile|Opera Mini)/),
        // 是否支持触摸事件
        isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints)),
        isWebkitBrowser = /webkit/gi.test(navigator.userAgent),
        isIE11Browser = /rv/gi.test(navigator.userAgent) && /trident/gi.test(navigator.userAgent),
        isEdgeBrowser = /edge/gi.test(navigator.userAgent) && /trident/gi.test(navigator.userAgent);

    // 版本
    VERSION = '1.0.0';

    var pluginName = 'videoPlayer',
        videoPlayer = function (config, el) {

            var defaultConfig = {
                // 调试模式
                debug: true,
                // log print
                log: function (msg) {
                    if (config.debug) {
                        if (console.log && !isTouchDevice) {
                            console.log(msg);
                        } else {
                            alert(msg);
                        }
                    }
                },
                vesion: VERSION,
                // 播放器容器
                playerContainer: el,
                // 直播(true)还是点播(false)
                isLive: false,
                // 视频加载完是否自动播放
                autoplay: true,
                // HTML5播放器是否显示
                controls: true,
                // 是否使用默认HTML5播放器
                isDefaultControls: false,
                // 播放器类型
                playerType: 'Html5',    // Html5 - Flash
                // 直播视频流 rtmp视频流 - http-flv视频流 - hls分片视频索引文件(m3u8)
                liveStreamUrl: {
                    RTMP: '',
                    HLS: '',
                    HTTPFLV: ''
                },
                // 播放视频源  - .flv - .mp4 - .m3u8 等等
                videoUrl: '',
                // 播放器对象
                player: undefined,
                // 播放器源video对象
                player_source: undefined,
                // H5播放器事件
                h5player: {
                    // 全屏状态
                    fullscreenStatus: false,
                    // h5player - volume - object
                    playerVolumer: undefined,
                    // 播放器播放
                    play: function () {
                        var $videoParent = $(config.player_source).parent();
                        if (config.player_source.paused) {
                            config.player_source.play();
                            $videoParent.addClass('h5player-status-playing').removeClass('h5player-status-paused');
                        } else {
                            config.player_source.pause();
                            $videoParent.addClass('h5player-status-paused').removeClass('h5player-status-playing');
                        }
                    },
                    // 播放器刷新
                    refresh: function () {
                        refreshPlayer(config);
                    },
                    // 播放器静音
                    muted: function () {
                        var $videoParent = $(config.player_source).parent();
                        if (config.player_source.muted) {
                            config.player_source.muted = false;
                            $videoParent.removeClass('h5player-status-muted');
                        } else {
                            config.player_source.muted = true;
                            $videoParent.addClass('h5player-status-muted');
                        }
                    },
                    // 播放器 声音调节
                    volumeChange: function (volumeValue) {
                        config.player_source.volume = volumeValue;
                        if (config.player_source.muted) {
                            this.muted();
                        }
                    },
                    // 播放器全屏
                    fullscreen: function () {
                        var $videoParent = $(config.player_source).parents('.videoContainer');
                        if (!$videoParent.hasClass('h5player-status-fullScreen')) {
                            launchFullScreen($videoParent.get(0));
                            $videoParent.addClass('h5player-status-fullScreen');
                            this.fullscreenStatus = true;
                        } else {
                            exitFullscreen();
                            $videoParent.removeClass('h5player-status-fullScreen');
                            this.fullscreenStatus = false;
                        }
                    },
                    // 视频进度更新
                    ontimeupdate: function (e, setValue) {
                        // console.log(setValue);

                        var duration = config.player_source.duration;

                        if (setValue) {
                            config.player_source.currentTime = Math.floor(setValue * duration);
                        }

                        var $progressLoad = config.playerContainer.find('.h5player-progress-load'),
                            $progressPlay = config.playerContainer.find('.h5player-progress-play'),
                            $progressBtnScrubber = config.playerContainer.find('.h5player-progress-btn-scrubber'),
                            currentTime = config.player_source.currentTime,
                            buffered = config.player_source.buffered,
                            nearLoadedTime = 0;

                        for (var i = 0; i < buffered.length; i++) {
                            if (buffered.end(i) > currentTime) {
                                nearLoadedTime = buffered.end(i);
                            }
                        }
                        // 更新加载视频进度
                        $progressLoad.css({
                            width: (nearLoadedTime / duration) * 100 + '%'
                        });
                        // 更新播放视频进度
                        $progressPlay.css({
                            width: (currentTime / duration) * 100 + '%'
                        });
                        // 进度条小圆点
                        $progressBtnScrubber.css({
                            left: (currentTime / duration) * 100 + '%'
                        });
                    },
                    // 视频播放到结尾
                    onended: function () {
                        var $videoParent = $(config.player_source).parent();
                        if (!config.player_source.paused) {
                            config.player_source.pause();
                        }
                        $videoParent.addClass('h5player-status-paused').removeClass('h5player-status-playing');
                    },
                    // 更新视频进度
                    onloadeddata: function () {
                        config.player_source.ontimeupdate = config.h5player.ontimeupdate;
                        config.player_source.onended = config.h5player.onended;
                    }
                }
            };

            config = $.extend(defaultConfig, config);

            // 直播时初始化 videoUrl
            if (config.isLive) initVideoUrl(config);
            initPlayer(config);

            var _oFunc = {
                destroy: function () {
                    config.player.destroy();
                    config.playerContainer.find('.videoContainer ').remove();
                }
            };

            return _oFunc;
        },
        /*
         *  视频/视频流类别
         *  rtmp: Flash播放器(only)
         *  flv: 基于flv.js的HTML5播放器
         *  hls: 基于hls.js的HTML5播放器
         *  html5: video标签原生支持的视频格式 .mp4/.ogg/.webm
         */
        videoType = {
            rtmp: 'RTMP',
            flv: 'FLV',
            hls: 'HLS',
            html5: 'HTML5'
        },
        // 视频ID计数
        idCount = {
            Html5: 0,
            Flash: 0
        };

    /**
     *  直播播放时根据用户浏览器兼容情况选好直播流
     *  1. 优先选择 基于flv.js 的HTML5播放器播放,播 HTTP-FLV直播流
     *  2. 其次选择 基于hls.js 的HTML5播放器播放,播 HLS直播流
     *  3. 最后选择Flash播放器，播RTMP直播流(PC)
     */
    function initVideoUrl(config) {
        // 默认 playerType === Html5, IE11 / Edge 暂不支持 flv.js直播播放，但支持flv.js点播播放
        if (flvjs.isSupported() && config.liveStreamUrl.HTTPFLV && !isIE11Browser && !isEdgeBrowser) {
            config.videoUrl = config.liveStreamUrl.HTTPFLV;
        } else if (Hls.isSupported() && config.liveStreamUrl.HLS) {
            config.videoUrl = config.liveStreamUrl.HLS;
        } else if (config.liveStreamUrl.RTMP && !isTouchDevice) {
            config.videoUrl = config.liveStreamUrl.RTMP;
        }
        // 指定 playerType === Flash
        if (config.playerType === 'Flash' && config.liveStreamUrl.RTMP) {
            config.videoUrl = config.liveStreamUrl.RTMP;
        }
        config.log('videoUrl = ' + config.videoUrl);
    }

    function initPlayer(config) {

        if (!config.videoUrl) {
            if (config.isLive) alert('直播流为空！');
            else alert('视频地址未传入！');
            return;
        }

        // 根据播放器类型执行对应的播放方法
        switch (config.playerType) {
            case 'Html5':
                Html5Player(config);
                break;
            case 'Flash':
                FlashPlayer(config);
                break;
            default: break;
        }
    }

    // 刷新播放器
    function refreshPlayer(config) {
        var isFresh = true;
        if (!config.videoUrl) {
            if (config.isLive) alert('直播流为空！');
            else alert('视频地址未传入！');
            return;
        }
        // 根据播放器类型执行对应的播放方法
        switch (config.playerType) {
            case 'Html5':
                Html5Player(config, isFresh);
                break;
            case 'Flash':
                FlashPlayer(config, isFresh);
                break;
            default: break;
        }
    }

    // getVideoType - 获取视频类型
    function getVideoType(videoUrl) {

        var regHLS = /\.m3u8\?|\.m3u8$/gi,
            regFLV = /\.flv\?|\.flv$/gi,
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

    // HTML5播放器    
    function Html5Player(config, isFresh) {
        switch (getVideoType(config.videoUrl)) {
            case videoType.flv:
                FlvPlayer(config, isFresh);
                break;
            case videoType.hls:
                HlsPlayer(config, isFresh);
                break;
            default:
                if (config.isLive) alert('请传入正确的直播流地址！');
                else Html5PlayerSource(config);
                break;
        }
    }

    // 初始化播放器结构 并返回生成的播放器DOM ID    
    function initVideoStruct(config) {

        var playerContainer = config.playerContainer,
            videoIdFormal = config.isLive ? 'live' : 'onDemand',
            playerId = videoIdFormal + config.playerType + '-' + idCount.Html5++,
            volumeSlidebarId = 'volumeSlidebar' + '-' + idCount.Html5++,
            videoClassName = config.isLive ? 'videoLive' : 'videoOnDemand',
            controlsTag = (config.controls && config.isDefaultControls) ? 'controls' : '',
            autoplayTag = config.autoplay ? "autoplay" : "",
            html5ControlString_live,    // 直播播放控制器字符串
            html5ControlString_onDemond,    // 点播播放控制器字符串

            html5ControlString_live = '<div class="h5player-live-ctrl">' +
                '<div class="h5player-live-bar">' +
                '<div class="h5player-ctrl-bar clearfix">' +
                '<span class="h5player-ctrl-bar-btn btn-play" data-info="播放/暂停"></span>' +
                '<span class="h5player-ctrl-bar-btn btn-refresh" data-info="刷新"></span>' +

                '<div class="h5player-ctrl-bar-volume-container">' +
                '<span class="h5player-ctrl-bar-btn btn-volume"></span>' +
                '<div class="h5player-ctrl-bar-btn h5player-ctrl-bar-volume-slide">' +
                '<input id="' + volumeSlidebarId + '" class="h5player-ctrl-bar-volume-slidebar" type="range" min="0" value="100" max="100" data-info="音量调整"/>' +
                '</div></div>' +

                '<span class="h5player-ctrl-bar-btn btn-fullScreen" data-info="全屏"></span>' +
                // '<span class="h5player-ctrl-bar-btn btn-lines" data-info="线路">线路</span>' +
                // '<span class="h5player-ctrl-bar-btn btn-kbps" data-info="超清">超清</span>' +
                // '<span class="h5player-ctrl-bar-btn btn-barrage" data-info="弹幕"></span>' +
                '</div></div></div>',

            html5ControlString_onDemond = '<div class="h5player-live-ctrl">' +
                '<div class="h5player-live-bar">' +
                '<div class="h5player-progress-bar-container">' +
                '<div class="h5player-progress-list">' +
                '<div class="h5player-progress-load"></div>' +
                '<div class="h5player-progress-play"></div></div>' +
                '<div class="h5player-progress-btn-scrubber">' +
                '<div class="h5player-progress-btn-scrubber-indicator"></div></div></div>' +
                '<div class="h5player-ctrl-bar clearfix">' +
                '<span class="h5player-ctrl-bar-btn btn-play" data-info="播放/暂停"></span>' +
                '<div class="h5player-ctrl-bar-volume-container">' +
                '<span class="h5player-ctrl-bar-btn btn-volume"></span>' +
                '<div class="h5player-ctrl-bar-btn h5player-ctrl-bar-volume-slide">' +
                '<input id="' + volumeSlidebarId + '" class="h5player-ctrl-bar-volume-slidebar" type="range" min="0" value="100" max="100" data-info="音量调整"/>' +
                '</div></div>' +

                '<span class="h5player-ctrl-bar-btn btn-fullScreen" data-info="全屏"></span>' +
                '</div></div></div>',

            html5ControlString = config.playerType !== 'Flash' ? (config.isLive ? html5ControlString_live : html5ControlString_onDemond) : '',
            // autoplayTag = isTouchDevice && config.autoplay ? "autoplay muted" : "",
            videoString = '<div class="videoContainer"><div class="liveContent h5player-status-playing">' +
                '<video class="' + videoClassName + '" id="' + playerId + '" ' + controlsTag + " " + autoplayTag + '>' +
                'Your browser is too old which does not support HTML5 video' +
                '</video>' + html5ControlString +
                '</div></div>';

        playerContainer.append(videoString);
        initHtml5CtrlEvents(config);
        return {
            playerId: playerId,
            volumeSlidebarId: volumeSlidebarId
        };
    }

    function initHtml5CtrlEvents(config) {
        // webkit内核浏览器volue slidebar样式初始化
        var webkitVolumePseudoClassInited = false;
        config.playerContainer.on('click', '.h5player-ctrl-bar .btn-play', function () {
            config.h5player.play();
        });
        config.playerContainer.on('click', '.h5player-ctrl-bar .btn-refresh', function () {
            config.h5player.refresh();
        });
        config.playerContainer.on('click', '.h5player-ctrl-bar .btn-fullScreen', function () {
            config.h5player.fullscreen();
        });
        config.playerContainer.on('click', '.h5player-ctrl-bar .btn-volume', function () {
            config.h5player.muted();
        });
        config.playerContainer.on('mousedown', '.h5player-live-ctrl .h5player-progress-bar-container', function (e) {
            var $this = $(this),
                thisWidth = $this.width(),
                isOneClick = true;

            config.h5player.ontimeupdate(e, e.offsetX / thisWidth);

            $this.on('mousemove', function (e) {
                if (isOneClick) {
                    config.h5player.ontimeupdate(e, e.offsetX / thisWidth);
                }
            });

            $this.one('mouseup', function (e) {
                isOneClick = false;
                $this.off('mousemove');
            });
        });
        /* input range - input事件在IE10尚不支持，可以使用change替代 */
        config.playerContainer.on('input change', '.h5player-ctrl-bar .h5player-ctrl-bar-volume-slidebar', function () {

            var $this = $(this),
                thisValue = $this.val();
            config.h5player.volumeChange(thisValue / 100);
            if (isWebkitBrowser) {
                _initVolumePseudoClassStyle('.h5player-ctrl-bar-volume-slidebar');
                $this.attr('data-process', thisValue);
            }
        });

        $(document).on('webkitfullscreenchange mozfullscreenchange MSFullscreenChange fullscreenchange', function () {
            var $videoContainer = config.playerContainer.find('.videoContainer ');
            if (config.h5player.fullscreenStatus && $videoContainer.hasClass('h5player-status-fullScreen') && !fullscreenElement()) {
                config.h5player.fullscreenStatus = false;
                $videoContainer.removeClass('h5player-status-fullScreen');
            }
        });
        // 只针对webkit内核的浏览器
        function _initVolumePseudoClassStyle(selecter) {
            if (webkitVolumePseudoClassInited) return;
            var newStyle = '<style>';

            for (var i = 0; i <= 100; i++) {
                newStyle += selecter + '[data-process="' + i + '"]:after{';
                newStyle += 'background: linear-gradient(to right, #1CD388 ' + (i - 1 < 0 ? 0 : i - 1) + '%, #b9b9b9 ' + i + '%,#b9b9b9);}';
            }

            newStyle += '</style>';
            $(newStyle).appendTo('head');
            webkitVolumePseudoClassInited = true;
        }
    }

    // 基于flv.js的html5播放器    
    function FlvPlayer(config, isFresh) {

        // 播放器刷新处理
        if (isFresh) {
            config.player.detachMediaElement(config.player_source);
            config.player.unload();

            config.player.attachMediaElement(config.player_source);
            config.player.load();
        } else {
            var oIds = initVideoStruct(config),
                videoDom = document.getElementById(oIds.playerId),
                volumeSlidebar = document.getElementById(oIds.volumeSlidebarId),
                player = flvjs.createPlayer({
                    type: 'flv',
                    isLive: config.isLive,
                    cors: config.isLive,
                    url: config.videoUrl,
                    Config: {
                        //fixAudioTimestampGap: false,
                        //autoCleanupSourceBuffer: true,  // 自动清理MSE内存
                        enableWorker: true,
                        enableStashBuffer: true,
                        stashInitialSize: 128   // 减少首桢显示等待时长 默认384
                    }
                });
            player.attachMediaElement(videoDom);
            player.load();

            config.player = player;
            config.player_source = videoDom;
            config.h5player.playerVolumer = volumeSlidebar;
        }
    }

    // 基于hls.js的html5播放器        
    function HlsPlayer(config, isFresh) {

        // 播放器刷新处理
        if (isFresh) {

            config.player.detachMedia();
            // config.player_source

            config.player.loadSource(config.videoUrl);
            config.player.attachMedia(config.player_source);
            config.player.on(Hls.Events.MANIFEST_PARSED, function () {
                config.player_source.play();
            });
            config.player.on(Hls.Events.ERROR, function (event, data) {
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
        } else {
            var oIds = initVideoStruct(config),
                player = document.getElementById(oIds.playerId),
                volumeSlidebar = document.getElementById(oIds.volumeSlidebarId),
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
            config.player_source = player;
            config.h5player.playerVolumer = volumeSlidebar;
        }
    }

    // 原生html5播放器          
    function Html5PlayerSource(config, isFresh) {

        var oIds = initVideoStruct(config),
            player = document.getElementById(oIds.playerId),
            volumeSlidebar = document.getElementById(oIds.volumeSlidebarId);

        player.src = config.videoUrl;

        if (config.autoplay) {
            player.oncanplay = function () {
                player.play();
            };
        }
        config.player = player;
        config.player_source = player;
        config.h5player.playerVolumer = volumeSlidebar;
        // 自定义 destroy
        config.player.destroy = function () {
            player.pause();
        };

        player.onloadeddata = config.h5player.onloadeddata;
    }

    // Flash播放器    
    function FlashPlayer(config, isFresh) {
        var oIds = initVideoStruct(config),
            playerId = oIds.playerId;
        var swfVersionStr = "10.0.0",
            xiSwfUrlStr = "swf/expressInstall.swf",
            playerSwfUrlStr = "swf/player.swf",
            soFlashVars = {
                src: config.videoUrl,
                streamType: config.isLive ? 'live' : 'recorded', // live - recorded - dvr 
                autoPlay: config.autoplay,
                muted: false,
                loop: !config.isLive,
                tintColor: '#000',   // #B91F1F
                controlBarAutoHide: "true"
            },
            params = {
                allowFullScreen: true,
                quality: 'high',
                allowscriptaccess: 'sameDomain',
            };
        swfobject.embedSWF(playerSwfUrlStr, playerId, "100%", "100%", swfVersionStr, xiSwfUrlStr, soFlashVars, params);
        config.player = swfobject;
        // 自定义 destroy
        config.player.destroy = function () {
            swfobject.removeSWF(playerId);
        };
    }

    // Find the right method, call on correct element
    function launchFullScreen(element) {
        if (element.requestFullScreen) {
            element.requestFullScreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullScreen) {
            element.webkitRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }
    // 退出全屏
    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
    // 返回全屏的元素对象，注意：要在用户授权全屏后才能获取全屏的元素，否则 fullscreenEle为null
    function fullscreenElement() {
        var fullscreenEle = document.fullscreenElement ||
            document.mozFullScreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement;
        return fullscreenEle;
    }

    function fullscreenEnable() {
        var isFullscreen = document.fullscreenEnabled ||
            window.fullScreen ||
            document.webkitIsFullScreen ||
            document.msFullscreenEnabled;
        //注意：要在用户授权全屏后才能准确获取当前的状态
        return Boolean(isFullscreen);
    }

    jQuery.fn[pluginName] = function (options) {
        return new videoPlayer(options, this);
    };
}));