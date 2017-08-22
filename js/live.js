$(function () {
    // stream url param
    setStreamUrl();
    $('.ant-switch').on('click', antSwitch);
});

function antSwitch() {

    var $this = $(this),
        $parentRenderItem = $this.parents('.render-item'),
        dataType = $this.attr('data-type'),
        isLive = $parentRenderItem.attr('data-isLive') == 'true' ? true : false,
        playerType = {
            playerType: dataType,
            isLive: isLive
        },

        videoString = "",
        videoIdFormal = playerType.isLive ? 'live' : 'onDemand';

    if (!$this.hasClass('ant-switch-checked')) {

        videoString = '<div class="liveContent">\
                        <video id="'+ videoIdFormal + playerType.playerType + '" name="videoElement" controls autoplay>\
                            Your browser is too old which does not support HTML5 video\
                        </video >\
                    </div > ';

        $parentRenderItem.append(videoString);

        if (playerType.isLive) {
            videoPlayer(videoIdFormal + playerType.playerType, oVideoStreamUrl, playerType);
        } else {
            videoPlayer(videoIdFormal + playerType.playerType, oVideoUrl, playerType);
        }

    } else {
        $parentRenderItem.find('.liveContent').remove();
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
        oVideoStreamUrl = {
            flash: 'rtmp://' + hostName + ':' + flashPort + '/' + appName + '/' + streamName,
            flv: 'http://' + hostName + ':' + flvPort + '/' + appName + '/' + streamName + '.flv',
            html5: 'http://' + hostName + ':' + hlsPort + '/' + appName + '/' + streamName + '.m3u8'
        },
        oVideoUrl = {
            flash: 'http://' + hostName + ':' + onDemandPort + '/' + videoServerPath + '/' + 'test.mp4',
            flv: 'http://' + hostName + ':' + onDemandPort + '/' + videoServerPath + '/' + 'demo.flv',
            html5: 'http://' + hostName + ':' + onDemandPort + '/' + videoServerPath + '/m3u8/' + 'xmpolice.m3u8' // .mp4 - .ogg - .webm
        };

    window.oVideoStreamUrl = oVideoStreamUrl;
    window.oVideoUrl = oVideoUrl;
}