/**
 *  @description:   videoPlayer.js
 *  @version:   v1.0.1
 *  @author: happydemoney(6744255@qq.com)
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
    VERSION = '1.0.1';

    var pluginName = 'videoPlayer',
        videoPlayer = function (config, el) {

            var defaultConfig = {
                // 调试模式
                debug: false,
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
                // HTML5播放控件是否显示
                controls: true,
                // 是否使用默认HTML5播放器控件
                isDefaultControls: false,
                // 是否显示弹幕按钮
                showBarrageBtn: true,
                // 弹幕服务关联
                barrageServer: {
                    Live: '',      // 直播聊天室，广播用户弹幕
                    onDemand: ''    // 点播弹幕，存储视频不同时间节点弹幕数据，再次打开视频在不同时间节点展示弹幕数据
                },
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
                    // fullscreenHideTimeout - 全屏隐藏控制条时间间隔设置
                    fullscreenHideTimeout: 2000,
                    // h5player - volume - object
                    playerVolumer: undefined,
                    // 用户是否正在寻址，操作视频进度条
                    seeking: false,
                    // 播放器播放
                    play: function () {
                        var $videoParent = $(config.player_source).parent();
                        if (config.player_source.paused) {
                            config.player_source.play();
                            $videoParent.addClass('h5player-status-playing').removeClass('h5player-status-paused');
                        }
                    },
                    // 播放器暂停
                    pause: function () {
                        var $videoParent = $(config.player_source).parent();
                        if (!config.player_source.paused) {
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
                    // 更新视频进度
                    onloadeddata: function () {
                        config.player_source.oncanplay = config.h5player.oncanplay
                        // 直播状态不进行之后事件绑定
                        if (config.isLive) {
                            return;
                        }
                        config.h5player.initTimeline();
                        config.player_source.onprogress = config.h5player.onprogress;
                        config.player_source.ontimeupdate = config.h5player.ontimeupdate;
                        config.player_source.ondurationchange = config.h5player.ondurationchange;
                        config.player_source.onended = config.h5player.onended;
                    },
                    oncanplay: function () {
                        if (config.autoplay && !config.h5player.seeking) {
                            config.player_source.play();
                        }
                    },
                    // 视频数据加载进度更新 - buffered
                    onprogress: function (e) {
                        var currentTime = config.player_source.currentTime,
                            buffered = config.player_source.buffered,
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
                        config.h5player.progressChange(param);
                    },
                    /**
                     * params {
                     *  currentTime
                     *  loadedTime
                     *  isSeek
                     *  currentTimePercent
                     * }
                     */
                    progressChange: function (oTime) {
                        var $progressPlay = config.playerContainer.find('.h5player-progress-play'),
                            $progressBtnScrubber = config.playerContainer.find('.h5player-progress-btn-scrubber'),
                            $progressLoad = config.playerContainer.find('.h5player-progress-load'),
                            duration = config.player_source.duration,
                            currentTime = oTime.currentTime,
                            currentTimePercent = oTime.currentTimePercent,
                            loadedTime = oTime.loadedTime,
                            isSeek = oTime.isSeek;

                        if (currentTimePercent) {
                            currentTime = Math.round(currentTimePercent * duration);
                            if (isSeek) {
                                config.player_source.currentTime = currentTime;
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
                        var currentTime = config.player_source.currentTime,
                            param = {
                                currentTime: currentTime
                            };
                        config.h5player.progressChange(param);
                        config.h5player.currentTimeChanage();
                    },
                    initTimeline: function () {
                        this.currentTimeChanage();
                        this.durationTimeChanage();
                    },
                    /* 视频当前播放位置时间变化事件 */
                    currentTimeChanage: function () {
                        var $currentTime = config.playerContainer.find('.h5player-ctrl-timeline-container .current-time'),
                            currentTime = config.player_source.currentTime,
                            currentTime = secondToTime(Math.round(currentTime));

                        $currentTime.text(currentTime);
                    },
                    /* 视频持续时间变化事件 */
                    durationTimeChanage: function () {
                        var $durationTime = config.playerContainer.find('.h5player-ctrl-timeline-container .duration-time'),
                            durationTime = config.player_source.duration,
                            durationTime = secondToTime(Math.round(durationTime));
                        $durationTime.text(durationTime);
                    },
                    ondurationchange: function () {
                        config.h5player.durationTimeChanage();
                    },
                    // 视频播放到结尾
                    onended: function () {
                        var $videoParent = $(config.player_source).parent();
                        if (!config.player_source.paused) {
                            config.player_source.pause();
                        }
                        $videoParent.addClass('h5player-status-paused').removeClass('h5player-status-playing');
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
                    // 事件销毁
                    config.playerContainer.off('.vp_custom_event');
                    $(document).off('.vp_custom_event');
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
            // autoplayTag = config.autoplay ? "autoplay" : "",
            h5playerStatusClass = config.autoplay ? 'h5player-status-playing' : 'h5player-status-paused',
            timelineTag = '<div class="h5player-ctrl-timeline-container"><span class="current-time">00:00:01</span>/<span class="duration-time">01:30:30</span></div>', // 点播视频显示 - 当前时间 / 视频长度

            // 是否开启弹幕功能
            barrageBtnString = config.showBarrageBtn ? '<span class="h5player-ctrl-bar-btn btn-barrage" data-info="弹幕"></span>' : '',
            // 弹幕主体部分
            barrageContentString = config.showBarrageBtn ? '<div class="h5player-barrage-wrap"></div>' : '',
            // 弹幕输入框部分
            barrageInputString = config.showBarrageBtn ? '<div class="barrage-input-container">我要吐槽：\
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

            html5ControlString = config.playerType !== 'Flash' && config.controls && !config.isDefaultControls ? (config.isLive ? html5ControlString_live : html5ControlString_onDemond) : '',
            // autoplayTag = isTouchDevice && config.autoplay ? "autoplay muted" : "",
            videoString = '<div class="videoContainer"><div class="liveContent ' + h5playerStatusClass + '">' +
                '<video class="' + videoClassName + '" id="' + playerId + '" ' + controlsTag + '>' +
                'Your browser is too old which does not support HTML5 video' +
                '</video>' + barrageContentString + html5ControlString +
                '</div>' + barrageInputString +
                '</div>';

        playerContainer.append(videoString);
        initHtml5CtrlEvents(config);
        return {
            playerId: playerId,
            volumeSlidebarId: volumeSlidebarId
        };
    }

    function initHtml5CtrlEvents(config) {
        // webkit内核浏览器volue slidebar样式初始化
        var webkitVolumePseudoClassInited = false,
            timeoutId = undefined;
        config.playerContainer.on('mouseenter.vp_custom_event', '.liveContent', function () {
            var $this = $(this);
            $this.hasClass('h5player-status-controls-in') ? '' : $this.addClass('h5player-status-controls-in');
        });
        /* 全屏状态用户鼠标停留超过2s后关闭控制显示条，移动鼠标立即显示控制条 */
        config.playerContainer.on('mousemove.vp_custom_event', '.h5player-status-fullScreen .liveContent', function () {
            var $this = $(this);
            if (timeoutId) {
                clearTimeout(timeoutId);
                $this.hasClass('h5player-status-controls-in') ? '' : $this.addClass('h5player-status-controls-in');
            }
            timeoutId = setTimeout(function () {
                $this.hasClass('h5player-status-controls-in') ? $this.removeClass('h5player-status-controls-in') : '';
            }, config.h5player.fullscreenHideTimeout);
        });
        config.playerContainer.on('mouseleave.vp_custom_event', '.liveContent', function () {
            var $this = $(this);
            $this.hasClass('h5player-status-controls-in') ? $this.removeClass('h5player-status-controls-in') : '';
        });
        config.playerContainer.on('click.vp_custom_event', '.h5player-status-playing .h5player-ctrl-bar .btn-play', function () {
            config.h5player.pause();
        });
        config.playerContainer.on('click.vp_custom_event', '.h5player-status-paused .h5player-ctrl-bar .btn-play', function () {
            config.h5player.play();
        });
        config.playerContainer.on('click.vp_custom_event', '.h5player-ctrl-bar .btn-refresh', function () {
            config.h5player.refresh();
        });
        config.playerContainer.on('click.vp_custom_event', '.h5player-ctrl-bar .btn-fullScreen', function () {
            config.h5player.fullscreen();
        });
        config.playerContainer.on('click.vp_custom_event', '.h5player-ctrl-bar .btn-volume', function () {
            config.h5player.muted();
        });

        /* 弹幕相关事件 */
        config.playerContainer.on('click.vp_custom_event', '.h5player-ctrl-bar .btn-barrage', barrageFuncSwitch);
        config.playerContainer.on('click.vp_custom_event', '.barrage-input-container .barrage-send', barrageSend);
        config.playerContainer.on('keydown.vp_custom_event', '.barrage-input-container .barrage-input', barrageInput);

        /* 屏蔽视频进度条圆点的拖放事件 */
        config.playerContainer.on('dragstart.vp_custom_event', '.h5player-live-ctrl .h5player-progress-btn-scrubber', function (e) {
            e.preventDefault();
        });
        /* 视频进度条容器 鼠标按下事件 */
        config.playerContainer.on('mousedown.vp_custom_event', '.h5player-live-ctrl .h5player-progress-bar-container', function (e) {
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
            config.h5player.progressChange(param);
            config.h5player.seeking = true;
            config.h5player.pause();
        });
        /* document mousemove */
        $(document).on('mousemove.vp_custom_event', function (e) {
            if (config.h5player.seeking) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                var $this = $(this),
                    $progressBarContainer = config.playerContainer.find('.h5player-live-ctrl .h5player-progress-bar-container'),
                    containerWidth = $progressBarContainer.width(),
                    thisParentsOffsetLeft = $progressBarContainer.parents('.videoContainer')[0].offsetLeft,
                    thisPageX = e.pageX,
                    currentTimePercent = (thisPageX - thisParentsOffsetLeft) / containerWidth,
                    param = {
                        currentTimePercent: currentTimePercent,
                        isSeek: true
                    };

                config.h5player.progressChange(param);
            }
        });
        /* document mouseup */
        $(document).on('mouseup.vp_custom_event', function (e) {
            if (config.h5player.seeking) {
                config.h5player.seeking = false;
                config.h5player.play();
            }
        });
        /* input range - input事件在IE10尚不支持，可以使用change替代 */
        config.playerContainer.on('input.vp_custom_event change.vp_custom_event', '.h5player-ctrl-bar .h5player-ctrl-bar-volume-slidebar', function () {
            var $this = $(this),
                thisValue = $this.val();
            config.h5player.volumeChange(thisValue / 100);
            if (isWebkitBrowser) {
                _initVolumePseudoClassStyle('.h5player-ctrl-bar-volume-slidebar');
                $this.attr('data-process', thisValue);
            }
        });
        $(document).on('webkitfullscreenchange.vp_custom_event mozfullscreenchange.vp_custom_event MSFullscreenChange.vp_custom_event fullscreenchange.vp_custom_event', function () {
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

    /* 弹幕开关处理程序 */
    function barrageFuncSwitch() {
        var $this = $(this),
            $parentLiveContent = $this.parents('.liveContent'),
            $h5playerBarrageWrap = $parentLiveContent.find('.h5player-barrage-wrap'),
            $barrageInputContainer = $parentLiveContent.siblings('.barrage-input-container');

        if (!$this.hasClass('active')) {
            $barrageInputContainer.addClass('active');
            $this.addClass('active');
        } else {
            $barrageInputContainer.removeClass('active');
            $this.removeClass('active');
            $h5playerBarrageWrap.empty();
        }
    }
    /** 发送弹幕*/
    function barrageSend() {
        var $this = $(this),
            $barrageWrap = $this.parents('.videoContainer').find('.h5player-barrage-wrap'),
            $barrageInput = $this.siblings('.barrage-input'),
            barrageInfo = $barrageInput.val();

        if (!barrageInfo) {
            alert('请输入弹幕信息~');
        } else {

            var barrageItem = {
                version: '1.0.0',
                message: {
                    text: barrageInfo,
                    style: {
                        color: '#ffffff',  // 字体颜色
                        fontSize: '25px',   // 字体大小
                        time: 0    // 1 (ms) = 1/1000 (s)
                    }
                }
            };

            $barrageWrap.append(createBarrageDom(barrageItem));
            $barrageInput.val('');
        }
    }
    /* 弹幕输入处理 */
    function barrageInput(event) {
        // 回车
        if (event.keyCode == 13) {
            var $this = $(this),
                $barrageSend = $this.siblings('.barrage-send');
            $barrageSend.trigger('click');
        }
    }
    /* 创建弹幕dom节点 */
    function createBarrageDom(barrageData) {
        var barrageItem = '<div class="h5player-barrage-item animation_barrage" style="' +
            'color:' + barrageData.message.style.color + ';' +
            'font-size:' + barrageData.message.style.fontSize + ';' +
            'top:' + randomTop() + 'px;' +
            '">' + barrageData.message.text + '</div>';
        return barrageItem;
    }
    /* 随机生成弹幕位置 - 距离视频顶部 */
    function randomTop() {
        var randomNum = Math.random(),
            randomTop = Math.floor(randomNum * (576 - 26));

        return randomTop;
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

            videoDom.onloadeddata = config.h5player.onloadeddata;
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

            player.onloadeddata = config.h5player.onloadeddata;
        }
    }

    // 原生html5播放器          
    function Html5PlayerSource(config, isFresh) {

        var oIds = initVideoStruct(config),
            player = document.getElementById(oIds.playerId),
            volumeSlidebar = document.getElementById(oIds.volumeSlidebarId);

        player.src = config.videoUrl;

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

    /**
     * 时间秒数格式化
     * @param s 时间戳（单位：秒）
     * @returns {*} 格式化后的时分秒
     */
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

    jQuery.fn[pluginName] = function (options) {
        return new videoPlayer(options, this);
    };
}));