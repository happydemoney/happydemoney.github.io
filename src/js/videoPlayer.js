/**
 *  videoPlayer 1.0.2 
 *  https://github.com/happydemoney/happydemoney.github.io
 *  @license MIT licensed
 *  @author: happydemoney(6744255@qq.com)
 */
(function (global, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], function ($) {
            return factory($, global, global.document, global.Math);
        });
    } else if (typeof exports === "object" && exports) {
        module.exports = factory(require('jquery'), global, global.document, global.Math);
    } else {
        factory(jQuery, global, global.document, global.Math);
    }
})(typeof window !== 'undefined' ? window : this, function ($, window, document, Math, undefined) {

    'use strict';
    var $window = $(window);
    var $document = $(document);
    var VERSION = '1.0.2';
    var pluginName = 'videoPlayer';
    var idCount = { // 视频ID计数
        Html5: 0,
        Flash: 0
    };

    var videoPlayer = function (options, oParent) {
        // common jQuery objects
        var $htmlBody = $('html, body');
        var $body = $('body');

        // 是否是支持触摸的设备    
        var isTouchDevice = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|playbook|silk|BlackBerry|BB10|Windows Phone|Tizen|Bada|webOS|IEMobile|Opera Mini)/),
            // 是否支持触摸事件
            isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints)),
            isWebkitBrowser = /webkit/gi.test(navigator.userAgent),
            isIE11Browser = /rv/gi.test(navigator.userAgent) && /trident/gi.test(navigator.userAgent),
            isEdgeBrowser = /edge/gi.test(navigator.userAgent) && /trident/gi.test(navigator.userAgent),
            //  视频/视频流类别
            //  rtmp: Flash播放器(only)
            //  flv: 基于flv.js的HTML5播放器
            //  hls: 基于hls.js的HTML5播放器
            //  html5: video标签原生支持的视频格式 .mp4/.ogg/.webm
            videoType = {
                rtmp: 'RTMP',
                flv: 'FLV',
                hls: 'HLS',
                html5: 'HTML5'
            },
            // 弹幕控制对象 - 包含弹幕开启状态、定时器ID、请求延时时间设定
            barrageControl = {
                isOpen: false,
                intervalTime: 5000, // 5秒
                intervalId: undefined
            };

        options = $.extend({
            // 播放器容器
            playerContainer: oParent,
            // 直播(true)还是点播(false)
            isLive: false,
            // 视频加载完是否自动播放
            autoplay: true,
            // HTML5播放控件是否显示
            controls: true,
            // 是否使用默认HTML5播放器控件
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
            // 弹幕相关配置
            barrage: {
                // 是否显示弹幕按钮
                isShow: false,
                // 视频信息 - 名称和ID
                videoInfo: {
                    videoName: '',
                    videoId: ''
                },
                // 弹幕服务器地址
                serverUrl: '',
                // 弹幕客户端对象 - 处理弹幕发送、接收和显示
                clientObject: null
            },
            // 弹幕显示区域父节点DOM对象
            barrageContainer: undefined,
            // 自定义h5播放控制器相关
            h5player_setting: {
                // fullscreenHideTimeout - 全屏隐藏控制条时间间隔设置
                fullscreenHideTimeout: 2000
            }
        }, options);

        /**
         * 自定义html5播放控制器相关 - 事件处理
         */
        var h5player = {
            // 全屏状态
            fullscreenStatus: false,
            // h5player - volume - object
            playerVolumer: null,
            // 用户是否正在寻址，操作视频进度条
            seeking: false,
            // 播放器播放
            play: function () {
                var $videoParent = $(options.player_source).parent();
                if (options.player_source.paused) {
                    options.player_source.play();
                    $videoParent.addClass('h5player-status-playing').removeClass('h5player-status-paused');

                    updateBarrageData('play');
                }
            },
            // 播放器暂停
            pause: function () {
                var $videoParent = $(options.player_source).parent();
                if (!options.player_source.paused) {
                    options.player_source.pause();
                    $videoParent.addClass('h5player-status-paused').removeClass('h5player-status-playing');

                    updateBarrageData('pause');
                }
            },
            // 播放器刷新
            refresh: function () {
                refreshPlayer();
            },
            // 播放器静音
            muted: function () {
                var $videoParent = $(options.player_source).parent();
                if (options.player_source.muted) {
                    options.player_source.muted = false;
                    $videoParent.removeClass('h5player-status-muted');
                } else {
                    options.player_source.muted = true;
                    $videoParent.addClass('h5player-status-muted');
                }
            },
            // 播放器 声音调节
            volumeChange: function (volumeValue) {
                options.player_source.volume = volumeValue;
                if (options.player_source.muted) {
                    this.muted();
                }
            },
            // 播放器全屏
            fullscreen: function () {
                var $videoParent = $(options.player_source).parents('.videoContainer');
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
            // 更新视频进度
            onloadeddata: function () {
                options.player_source.oncanplay = h5player.oncanplay
                // 直播状态不进行之后事件绑定
                if (options.isLive) {
                    return;
                }
                h5player.initTimeline();
                options.player_source.onprogress = h5player.onprogress;
                options.player_source.ontimeupdate = h5player.ontimeupdate;
                options.player_source.ondurationchange = h5player.ondurationchange;
                options.player_source.onended = h5player.onended;
            },
            oncanplay: function () {
                if (options.autoplay && !h5player.seeking) {
                    options.player_source.play();
                }
            },
            // 视频数据加载进度更新 - buffered
            onprogress: function (e) {
                var currentTime = options.player_source.currentTime,
                    buffered = options.player_source.buffered,
                    nearLoadedTime = 0;
                for (var i = 0; i < buffered.length; i++) {
                    if (buffered.end(i) >= currentTime && buffered.start(i) <= currentTime) {
                        nearLoadedTime = buffered.end(i);
                    } else {
                        nearLoadedTime = currentTime + 1;
                    }
                }
                var param = {
                    loadedTime: nearLoadedTime
                };
                h5player.progressChange(param);
            },
            progressChange: function (oTime) {
                var $progressPlay = options.playerContainer.find('.h5player-progress-play'),
                    $progressBtnScrubber = options.playerContainer.find('.h5player-progress-btn-scrubber'),
                    $progressLoad = options.playerContainer.find('.h5player-progress-load'),
                    duration = options.player_source.duration,
                    currentTime = oTime.currentTime,
                    currentTimePercent = oTime.currentTimePercent,
                    loadedTime = oTime.loadedTime,
                    isSeek = oTime.isSeek;

                if (currentTimePercent) {
                    currentTime = Math.round(currentTimePercent * duration);
                    if (isSeek) {
                        options.player_source.currentTime = currentTime;
                    }
                }

                if (currentTime) {
                    // 更新播放视频进度
                    $progressPlay.css({
                        width: (currentTime / duration) * 100 + '%'
                    });
                    // 进度条小圆点
                    $progressBtnScrubber.css({
                        left: (currentTime / duration) * 100 + '%'
                    });
                }

                if (loadedTime) {
                    // 更新加载视频进度
                    $progressLoad.css({
                        width: (loadedTime / duration) * 100 + '%'
                    });
                }
            },
            // 视频进度更新 - currentTime
            ontimeupdate: function (e) {
                var currentTime = options.player_source.currentTime,
                    param = {
                        currentTime: currentTime
                    };
                h5player.progressChange(param);
                h5player.currentTimeChanage();
            },
            initTimeline: function () {
                this.currentTimeChanage();
                this.durationTimeChanage();
            },
            // 视频当前播放位置时间变化事件
            currentTimeChanage: function () {
                var $currentTime = options.playerContainer.find('.h5player-ctrl-timeline-container .current-time'),
                    currentTime = options.player_source.currentTime,
                    currentTime = secondToTime(Math.round(currentTime));

                $currentTime.text(currentTime);
            },
            // 视频持续时间变化事件
            durationTimeChanage: function () {
                var $durationTime = options.playerContainer.find('.h5player-ctrl-timeline-container .duration-time'),
                    durationTime = options.player_source.duration,
                    durationTime = secondToTime(Math.round(durationTime));
                $durationTime.text(durationTime);
            },
            ondurationchange: function () {
                h5player.durationTimeChanage();
            },
            // 视频播放到结尾
            onended: function () {
                var $videoParent = $(options.player_source).parent();
                if (!options.player_source.paused) {
                    options.player_source.pause();
                }
                $videoParent.addClass('h5player-status-paused').removeClass('h5player-status-playing');
            }
        };

        // 直播时初始化 videoUrl
        if (options.isLive) { initVideoUrl(); }
        // 初始化播放器
        initPlayer();

        /**
         * 直播播放时根据用户浏览器兼容情况选好直播流
         * 1. 优先选择 基于flv.js 的HTML5播放器播放,播 HTTP-FLV直播流
         * 2. 其次选择 基于hls.js 的HTML5播放器播放,播 HLS直播流
         * 3. 最后选择Flash播放器，播RTMP直播流(PC)
         */
        function initVideoUrl() {
            // 默认 playerType === Html5, IE11 / Edge 暂不支持 flv.js直播播放，但支持flv.js点播播放
            if (flvjs.isSupported() && options.liveStreamUrl.HTTPFLV && !isIE11Browser && !isEdgeBrowser) {
                options.videoUrl = options.liveStreamUrl.HTTPFLV;
            } else if (Hls.isSupported() && options.liveStreamUrl.HLS) {
                options.videoUrl = options.liveStreamUrl.HLS;
            } else if (options.liveStreamUrl.RTMP && !isTouchDevice) {
                options.videoUrl = options.liveStreamUrl.RTMP;
            }
            // 指定 playerType === Flash
            if (options.playerType === 'Flash' && options.liveStreamUrl.RTMP) {
                options.videoUrl = options.liveStreamUrl.RTMP;
            }
        }

        // 根据播放器类型选择不同播放方式
        function initPlayer() {
            if (!options.videoUrl) {
                if (options.isLive) alert('直播流为空！');
                else alert('视频地址未传入！');
                return;
            }
            // 根据播放器类型执行对应的播放方法
            switch (options.playerType) {
                case 'Html5':
                    Html5Player();
                    break;
                case 'Flash':
                    FlashPlayer();
                    break;
                default: break;
            }
        }

        // 刷新播放器
        function refreshPlayer() {
            var isFresh = true;
            if (!options.videoUrl) {
                if (options.isLive) alert('直播流为空！');
                else alert('视频地址未传入！');
                return;
            }
            // 根据播放器类型执行对应的播放方法
            switch (options.playerType) {
                case 'Html5':
                    Html5Player(isFresh);
                    break;
                case 'Flash':
                    FlashPlayer(isFresh);
                    break;
                default: break;
            }
        }

        // HTML5播放器    
        function Html5Player(isFresh) {
            switch (getVideoType(options.videoUrl)) {
                case videoType.flv:
                    FlvPlayer(isFresh);
                    break;
                case videoType.hls:
                    HlsPlayer(isFresh);
                    break;
                default:
                    if (options.isLive) alert('请传入正确的直播流地址！');
                    else Html5PlayerSource(options);
                    break;
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

        // 基于flv.js的html5播放器    
        function FlvPlayer(isFresh) {

            // 播放器刷新处理
            if (isFresh) {
                options.player.detachMediaElement(options.player_source);
                options.player.unload();

                options.player.attachMediaElement(options.player_source);
                options.player.load();
            } else {
                var oIds = initVideoStruct(),
                    videoDom = document.getElementById(oIds.playerId),
                    volumeSlidebar = document.getElementById(oIds.volumeSlidebarId),
                    player = flvjs.createPlayer({
                        type: 'flv',
                        isLive: options.isLive,
                        cors: options.isLive,
                        url: options.videoUrl,
                        options: {
                            //fixAudioTimestampGap: false,
                            //autoCleanupSourceBuffer: true,  // 自动清理MSE内存
                            enableWorker: true,
                            enableStashBuffer: true,
                            stashInitialSize: 128   // 减少首桢显示等待时长 默认384
                        }
                    });
                player.attachMediaElement(videoDom);
                player.load();

                options.player = player;
                options.player_source = videoDom;
                h5player.playerVolumer = volumeSlidebar;

                videoDom.onloadeddata = h5player.onloadeddata;
            }
        }

        // 基于hls.js的html5播放器        
        function HlsPlayer(isFresh) {

            // 播放器刷新处理
            if (isFresh) {

                options.player.detachMedia();
                // options.player_source

                options.player.loadSource(options.videoUrl);
                options.player.attachMedia(options.player_source);
                options.player.on(Hls.Events.MANIFEST_PARSED, function () {
                    options.player_source.play();
                });
                options.player.on(Hls.Events.ERROR, function (event, data) {
                    switch (data.type) {
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            showError('error', 'MEDIA error ...');
                            hls.destroy();
                            break;
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            showError('error', 'network error ...');
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                });
            } else {
                var oIds = initVideoStruct(),
                    player = document.getElementById(oIds.playerId),
                    volumeSlidebar = document.getElementById(oIds.volumeSlidebarId),
                    hls = new Hls();

                hls.loadSource(options.videoUrl);
                hls.attachMedia(player);

                hls.on(Hls.Events.ERROR, function (event, data) {
                    switch (data.type) {
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            showError('error', 'MEDIA error ...');
                            hls.destroy();
                            break;
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            showError('error', 'network error ...');
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                });

                options.player = hls;
                options.player_source = player;
                h5player.playerVolumer = volumeSlidebar;

                player.onloadeddata = h5player.onloadeddata;
            }
        }

        // 原生html5播放器          
        function Html5PlayerSource(isFresh) {

            var oIds = initVideoStruct(),
                player = document.getElementById(oIds.playerId),
                volumeSlidebar = document.getElementById(oIds.volumeSlidebarId);

            player.src = options.videoUrl;

            options.player = player;
            options.player_source = player;
            h5player.playerVolumer = volumeSlidebar;
            // 自定义 destroy
            options.player.destroy = function () {
                player.pause();
            };

            player.onloadeddata = h5player.onloadeddata;
        }

        // Flash播放器    
        function FlashPlayer(isFresh) {
            var oIds = initVideoStruct(),
                playerId = oIds.playerId;
            var swfVersionStr = "10.0.0",
                xiSwfUrlStr = "swf/expressInstall.swf",
                playerSwfUrlStr = "swf/player.swf",
                soFlashVars = {
                    src: options.videoUrl,
                    streamType: options.isLive ? 'live' : 'recorded', // live - recorded - dvr 
                    autoPlay: options.autoplay,
                    muted: false,
                    loop: !options.isLive,
                    tintColor: '#000',   // #B91F1F
                    controlBarAutoHide: "true"
                },
                params = {
                    allowFullScreen: true,
                    quality: 'high',
                    allowscriptaccess: 'sameDomain',
                };
            swfobject.embedSWF(playerSwfUrlStr, playerId, "100%", "100%", swfVersionStr, xiSwfUrlStr, soFlashVars, params);
            options.player = swfobject;
            // 自定义 destroy
            options.player.destroy = function () {
                swfobject.removeSWF(playerId);
            };
        }

        // 初始化播放器结构 并返回生成的播放器DOM ID    
        function initVideoStruct() {
            idCount.Html5++;
            var playerContainer = options.playerContainer,
                videoIdFormal = options.isLive ? 'live' : 'onDemand',
                playerId = videoIdFormal + options.playerType + '-' + idCount.Html5,
                volumeSlidebarId = 'volumeSlidebar' + '-' + idCount.Html5,
                videoClassName = options.isLive ? 'videoLive' : 'videoOnDemand',
                controlsTag = (options.controls && options.isDefaultControls) ? 'controls' : '',
                // autoplayTag = options.autoplay ? "autoplay" : "",
                h5playerStatusClass = options.autoplay ? 'h5player-status-playing' : 'h5player-status-paused',
                timelineTag = '<div class="h5player-ctrl-timeline-container"><span class="current-time">00:00:01</span>/<span class="duration-time">01:30:30</span></div>', // 点播视频显示 - 当前时间 / 视频长度

                // 是否开启弹幕功能
                barrageBtnString = options.barrage.isShow ? '<span class="h5player-ctrl-bar-btn btn-barrage" data-info="弹幕"></span>' : '',
                // 弹幕主体部分
                barrageContentString = options.barrage.isShow ? '<div class="h5player-barrage-wrap"></div>' : '',
                // 弹幕输入框部分
                barrageInputString = options.barrage.isShow ? '<div class="barrage-input-container">我要吐槽：\
                                        <input class="barrage-input" type= "text" data-info="弹幕输入" placeholder= "发弹幕是不可能不发弹幕的，这辈子不可能不发弹幕的。" />\
                                        <input class="barrage-send" type="button" data-info="发送弹幕" value="发送" /></div > ' : '',

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
                    barrageBtnString +
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
                    '</div></div>' + timelineTag +

                    '<span class="h5player-ctrl-bar-btn btn-fullScreen" data-info="全屏"></span>' +
                    barrageBtnString +
                    '</div></div></div>',

                html5ControlString = options.playerType !== 'Flash' && options.controls && !options.isDefaultControls ? (options.isLive ? html5ControlString_live : html5ControlString_onDemond) : '',
                // autoplayTag = isTouchDevice && options.autoplay ? "autoplay muted" : "",
                videoString = '<div class="videoContainer"><div class="liveContent ' + h5playerStatusClass + '">' +
                    '<video class="' + videoClassName + '" id="' + playerId + '" ' + controlsTag + '>' +
                    'Your browser is too old which does not support HTML5 video' +
                    '</video>' + barrageContentString + html5ControlString +
                    '</div>' + barrageInputString +
                    '</div>';

            playerContainer.append(videoString);
            initHtml5CtrlEvents(options);
            return {
                playerId: playerId,
                volumeSlidebarId: volumeSlidebarId
            };
        }

        function initHtml5CtrlEvents() {
            // webkit内核浏览器volue slidebar样式初始化
            var webkitVolumePseudoClassInited = false,
                timeoutId = undefined;

            // 缓存弹幕父节点DOM对象
            options.barrageContainer = options.playerContainer.find('.h5player-barrage-wrap');
            options.playerContainer.on('mouseenter.vp_custom_event', '.liveContent', function () {
                var $this = $(this);
                $this.hasClass('h5player-status-controls-in') ? '' : $this.addClass('h5player-status-controls-in');
            });
            // 全屏状态用户鼠标停留超过2s后关闭控制显示条，移动鼠标立即显示控制条
            options.playerContainer.on('mousemove.vp_custom_event', '.h5player-status-fullScreen .liveContent', function () {
                var $this = $(this);
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    $this.hasClass('h5player-status-controls-in') ? '' : $this.addClass('h5player-status-controls-in');
                }
                timeoutId = setTimeout(function () {
                    $this.hasClass('h5player-status-controls-in') ? $this.removeClass('h5player-status-controls-in') : '';
                }, options.h5player_setting.fullscreenHideTimeout);
            });
            options.playerContainer.on('mouseleave.vp_custom_event', '.liveContent', function () {
                var $this = $(this);
                $this.hasClass('h5player-status-controls-in') ? $this.removeClass('h5player-status-controls-in') : '';
            });
            options.playerContainer.on('click.vp_custom_event', '.h5player-status-playing .h5player-ctrl-bar .btn-play', function () {
                h5player.pause();
            });
            options.playerContainer.on('click.vp_custom_event', '.h5player-status-paused .h5player-ctrl-bar .btn-play', function () {
                h5player.play();
            });
            options.playerContainer.on('click.vp_custom_event', '.h5player-ctrl-bar .btn-refresh', function () {
                h5player.refresh();
            });
            options.playerContainer.on('click.vp_custom_event', '.h5player-ctrl-bar .btn-fullScreen', function () {
                h5player.fullscreen();
            });
            options.playerContainer.on('click.vp_custom_event', '.h5player-ctrl-bar .btn-volume', function () {
                h5player.muted();
            });

            // 弹幕相关事件 
            options.playerContainer.on('click.vp_custom_event', '.h5player-ctrl-bar .btn-barrage', barrageFuncSwitch);
            options.playerContainer.on('click.vp_custom_event', '.barrage-input-container .barrage-send', barrageSend);
            options.playerContainer.on('keydown.vp_custom_event', '.barrage-input-container .barrage-input', barrageInput);

            // 屏蔽视频进度条圆点的拖放事件
            options.playerContainer.on('dragstart.vp_custom_event', '.h5player-live-ctrl .h5player-progress-btn-scrubber', function (e) {
                e.preventDefault();
            });
            // 视频进度条容器 鼠标按下事件
            options.playerContainer.on('mousedown.vp_custom_event', '.h5player-live-ctrl .h5player-progress-bar-container', function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                var $this = $(this),
                    thisWidth = $this.width(),
                    thisParentsOffsetLeft = $this.parents('.videoContainer')[0].offsetLeft,
                    thisPageX = e.pageX,
                    currentTimePercent = (thisPageX - thisParentsOffsetLeft) / thisWidth,
                    param = {
                        currentTimePercent: currentTimePercent,
                        isSeek: true
                    };
                h5player.progressChange(param);
                h5player.seeking = true;
                h5player.pause();
            });
            // document mousemove
            $(document).on('mousemove.vp_custom_event', function (e) {
                if (h5player.seeking) {
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    var $this = $(this),
                        $progressBarContainer = options.playerContainer.find('.h5player-live-ctrl .h5player-progress-bar-container'),
                        containerWidth = $progressBarContainer.width(),
                        thisParentsOffsetLeft = $progressBarContainer.parents('.videoContainer')[0].offsetLeft,
                        thisPageX = e.pageX,
                        currentTimePercent = (thisPageX - thisParentsOffsetLeft) / containerWidth,
                        param = {
                            currentTimePercent: currentTimePercent,
                            isSeek: true
                        };

                    h5player.progressChange(param);
                }
            });
            // document mouseup 
            $(document).on('mouseup.vp_custom_event', function (e) {
                if (h5player.seeking) {
                    h5player.seeking = false;
                    h5player.play();
                }
            });
            // input range - input事件在IE10尚不支持，可以使用change替代
            options.playerContainer.on('input.vp_custom_event change.vp_custom_event', '.h5player-ctrl-bar .h5player-ctrl-bar-volume-slidebar', function () {
                var $this = $(this),
                    thisValue = $this.val();
                h5player.volumeChange(thisValue / 100);
                if (isWebkitBrowser) {
                    _initVolumePseudoClassStyle('.h5player-ctrl-bar-volume-slidebar');
                    $this.attr('data-process', thisValue);
                }
            });
            $(document).on('webkitfullscreenchange.vp_custom_event mozfullscreenchange.vp_custom_event MSFullscreenChange.vp_custom_event fullscreenchange.vp_custom_event', function () {
                var $videoContainer = options.playerContainer.find('.videoContainer ');
                if (h5player.fullscreenStatus && $videoContainer.hasClass('h5player-status-fullScreen') && !fullscreenElement()) {
                    h5player.fullscreenStatus = false;
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

        /**
         * 更新弹幕数据
         * methodName (open/close)
         */
        function updateBarrageData(methodName) {

            switch (methodName) {
                // 打开弹幕
                case 'open':
                    _open();
                    break;
                // 关闭弹幕
                case 'close':
                    _close();
                    break;
                // 暂停后再播放时打开弹幕
                case 'play':
                    _play();
                    break;
                // 暂停弹幕
                case 'pause':
                    _pause();
                    break;
                default:
                    break;
            }

            // 打开弹幕
            function _open() {
                if (!options.barrage.clientObject) {
                    options.barrage.clientObject = new Barrage(options.isLive);
                    options.barrage.clientObject.connectServer(options.barrage.serverUrl, options.barrage.videoInfo.videoName, options.barrage.videoInfo.videoId);
                }
                options.barrage.clientObject.getMessageByTime(Math.round(options.player_source.currentTime));
                updateBarrageDisplay();

                barrageControl.intervalId = setInterval(function () {
                    options.barrage.clientObject.getMessageByTime(Math.round(options.player_source.currentTime));
                    updateBarrageDisplay();
                }, barrageControl.intervalTime);
            }

            // 关闭弹幕
            function _close() {
                clearInterval(barrageControl.intervalId);
                barrageControl.intervalId = undefined;
                updateBarrageDisplay('clean');
            }

            // 暂停后再播放时打开弹幕
            function _play() {
                if (barrageControl.isOpen && !barrageControl.intervalId) {
                    barrageControl.intervalId = setInterval(function () {
                        options.barrage.clientObject.getMessageByTime(Math.round(options.player_source.currentTime));
                        updateBarrageDisplay();
                    }, barrageControl.intervalTime);
                }
            }

            // 暂停弹幕
            function _pause() {
                if (barrageControl.isOpen && barrageControl.intervalId) {
                    clearInterval(barrageControl.intervalId);
                    barrageControl.intervalId = undefined;
                }
            }
        }

        /**
         *  更新弹幕页面展示效果
         */
        function updateBarrageDisplay(method) {
            if (method == 'clean') {
                options.barrageContainer.empty();
            } else {
                var receiveMsg = options.barrage.clientObject.receiveMsg;
                if (receiveMsg.length > 0) {
                    for (var i = 0; i < receiveMsg.length; i++) {
                        options.barrageContainer.append(createBarrageDom(receiveMsg[i]));
                    }
                }
            }
        }

        // 弹幕开关处理程序
        function barrageFuncSwitch() {
            var $this = $(this),
                $parentLiveContent = $this.parents('.liveContent'),
                $h5playerBarrageWrap = $parentLiveContent.find('.h5player-barrage-wrap'),
                $barrageInputContainer = $parentLiveContent.siblings('.barrage-input-container');

            if (!$this.hasClass('active')) {
                $barrageInputContainer.addClass('active');
                $this.addClass('active');
                barrageControl.isOpen = true;
                updateBarrageData('open');
            } else {
                $barrageInputContainer.removeClass('active');
                $this.removeClass('active');
                $h5playerBarrageWrap.empty();
                barrageControl.isOpen = false;
                updateBarrageData('close');
            }
        }
        // 发送弹幕
        function barrageSend() {
            var $this = $(this),
                $barrageWrap = $this.parents('.videoContainer').find('.h5player-barrage-wrap'),
                $barrageInput = $this.siblings('.barrage-input'),
                barrageInfo = $barrageInput.val(),
                msg;

            if (!barrageInfo) {
                alert('请输入弹幕信息~');
            } else {
                // 直播
                if (options.isLive == 1) {
                    msg = {
                        'time': Math.round(options.player_source.currentTime),
                        'content': {
                            "ip": options.barrage.clientObject.curCity,
                            "msg": barrageInfo
                        },
                        'color': '#ffffff',
                        'font': '25',
                        'usr_id': options.barrage.clientObject.id,
                        'usr_type': 0
                    };
                } else {
                    // 点播
                    msg = {
                        'time': Math.round(options.player_source.currentTime),
                        'content': barrageInfo,
                        'color': '#ffffff',
                        'font': '25',
                        'usr_id': options.barrage.clientObject.id
                    };
                }
                options.barrage.clientObject.SendMsgToServer(msg);
                $barrageWrap.append(createBarrageDom(msg));
                $barrageInput.val('');
            }
        }
        // 弹幕输入处理
        function barrageInput(event) {
            // 回车
            if (event.keyCode == 13) {
                var $this = $(this),
                    $barrageSend = $this.siblings('.barrage-send');
                $barrageSend.trigger('click');
            }
        }
        // 创建弹幕dom节点
        function createBarrageDom(barrageData) {
            var barrageItem = '<div class="h5player-barrage-item animation_barrage" style="' +
                'color:' + barrageData.color + ';' +
                'font-size:' + barrageData.fontSize + 'px;' +
                'top:' + randomTop() + 'px;' +
                '">' + barrageData.content + '</div>';
            return barrageItem;
        }
        // 随机生成弹幕位置 - 距离视频顶部
        function randomTop() {
            var randomNum = Math.random(),
                randomTop = Math.floor(randomNum * (576 - 26));

            return randomTop;
        }

        /**
         * destroy
         */
        function destroy() {
            options.player.destroy();
            options.playerContainer.find('.videoContainer').remove();
            // 事件销毁
            options.playerContainer.off('.vp_custom_event');
            $(document).off('.vp_custom_event');
        }

        /**
         * Shows a message in the console of the given type.
         * type: error / warn
         */
        function showError(type, text) {
            console && console[type] && console[type]('videoPlayer: ' + text);
        }

        //  时间秒数格式化
        //  @param s 时间戳（单位：秒）
        //  @returns {*} 格式化后的时分秒
        function secondToTime(s) {
            var t;
            if (s > -1) {
                var hour = Math.floor(s / 3600);
                var min = Math.floor(s / 60) % 60;
                var sec = s % 60;
                if (hour < 10) {
                    t = '0' + hour + ":";
                } else {
                    t = hour + ":";
                }

                if (min < 10) { t += "0"; }
                t += min + ":";
                if (sec < 10) { t += "0"; }
                t += sec.toFixed(0);
            }
            return t;
        };

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

        // 返回函数
        return {
            version: VERSION,
            destroy: destroy
        };
    };// end of $.fn.videoPlayer

    $.fn[pluginName] = function (options) {
        return new videoPlayer(options, this);
    };
});