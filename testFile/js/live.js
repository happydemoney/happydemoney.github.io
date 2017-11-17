$(function () {
    // stream url param
    setStreamUrl();
    $('.ant-switch').on('click', antSwitch);
});

function antSwitch() {

    var $this = $(this),
        $parentRenderItem = $this.parents('.render-item'),
        dataType = $this.attr('data-type'),
        isLive = $parentRenderItem.attr('data-isLive') == 'true' ? true : false;

    if (!$this.hasClass('ant-switch-checked')) {
        if (isLive) {

            switch (dataType) {
                case 'FlvJs':
                    var player = $parentRenderItem.videoPlayer({
                        liveStreamUrl: liveStreamUrl,
                        isLive: true,
                        barrage: {
                            isShow: true,
                            videoInfo: {
                                videoName: 'liveTest',
                                videoId: 999
                            },
                            serverUrl: 'http://192.168.1.89:3001'
                        }
                    });
                    $parentRenderItem.data('player', player);
                    break;
                case 'HlsJs':
                    var player = $parentRenderItem.videoPlayer({
                        isLive: true,
                        videoUrl: liveStreamUrl.HLS
                    });
                    $parentRenderItem.data('player', player);
                    break;
                case 'Flash':
                    var player = $parentRenderItem.videoPlayer({
                        liveStreamUrl: liveStreamUrl,
                        isLive: true,
                        playerType: 'Flash'
                    });
                    $parentRenderItem.data('player', player);
                    break;
                default: break;
            }
        } else {
            switch (dataType) {
                case 'FlvJs':
                    var player = $parentRenderItem.videoPlayer({
                        videoUrl: oVideoUrl.flv,
                        barrage: {
                            isShow: true,
                            videoInfo: {
                                videoName: 'videoTest',
                                videoId: 1000
                            },
                            serverUrl: 'http://192.168.1.89:3000'
                        }
                    });

                    $parentRenderItem.data('player', player);
                    break;
                case 'HlsJs':
                    var player = $parentRenderItem.videoPlayer({
                        videoUrl: oVideoUrl.hls
                    });
                    $parentRenderItem.data('player', player);
                    break;
                case 'Flash':
                    var player = $parentRenderItem.videoPlayer({
                        videoUrl: oVideoUrl.flash,
                        playerType: 'Flash'
                    });
                    $parentRenderItem.data('player', player);
                    break;
                default: break;
            }
        }
    } else {
        var curPlayer = $parentRenderItem.data('player');
        curPlayer.destroy();
        $parentRenderItem.removeData('player');
    }
    $this.toggleClass('ant-switch-checked');
}

function setStreamUrl() {

    var hostName = $('input[name="hostName"]').val(),
        appName = $('input[name="appName"]').val(),
        streamName = $('input[name="streamName"]').val(),
        palyerType = '', // 'Flash' - 'FlvJs' - 'HlsJs'
        flashPort = '1935',
        flvPort = '7001',
        hlsPort = '7002',
        onDemandPort = '8080',
        videoServerPath = 'videoTest',
        liveStreamUrl = {
            RTMP: 'rtmp://' + hostName + ':' + flashPort + '/' + appName + '/' + streamName,
            // RTMP: 'rtmp://live.hkstv.hk.lxdns.com/live/hks',
            HTTPFLV: 'http://' + hostName + ':' + flvPort + '/' + appName + '/' + streamName + '.flv',
            HLS: 'http://' + hostName + ':' + hlsPort + '/' + appName + '/' + streamName + '.m3u8'
            // HLS: 'http://ivi.bupt.edu.cn/hls/cctv6hd.m3u8'
            // HLS: 'http://27.152.181.77:490/22490906_22490906_22902_0_0_15013.m3u8?uuid=e27009d73ef642b0b71a1ff13eb28d21&org=yyweb&m=097797f12c8e52a1400fc1ce052efc48&r=331508567&v=1&t=1504764367&uid=0&ex_audio=0&ex_coderate=700&ex_spkuid=0'
        },
        oVideoUrl = {
            flash: 'https://cdn.memorieslab.com//video/mgn_brand_video.mp4',
            flv: 'http://' + hostName + ':' + onDemandPort + '/videoTest/demo.flv',
            // flv: 'https://cdn.memorieslab.com//video/mgn_brand_video.mp4',
            // flv: 'http://' + hostName + ':' + onDemandPort + '/videoTest/神奇女侠.mp4',
            // hls: 'http://ivi.bupt.edu.cn/hls/cctv5hd.m3u8'
            hls: 'http://' + hostName + ':' + onDemandPort + '/videoTest/m3u8/xmpolice.m3u8',
        };

    window.liveStreamUrl = liveStreamUrl;
    window.oVideoUrl = oVideoUrl;
}