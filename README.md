#   videoPlayer

##  config
* isLive(true/false) 
```javascript
   {
       isLive: false
   } 
   (default: false)
```
* autoplay(true/false)
```javascript
   {
       autoplay: true
   } 
   (default: true)
```
* controls(true/false)
```javascript
   {
       controls: true
   } 
   (default: true)
```
* isDefaultControls (true/false)
```javascript
   {
       isDefaultControls: false
   } 
   (default: false)
```
* playerType(Html5/Flash)
```javascript
    {
        playerType: 'Html5'
    }
    (default: Html5)
```
* liveStreamUrl(object)
```javascript
// if -- (isLive: true)  -- to set --
    {
        isLive: true,
        liveStreamUrl: {
            RTMP: 'rtmp://<hostName>:1935/<appName>/<sreamName>',
            HLS: 'http://<hostName>:HLSport/<appName>/<streamName>.m3u8',
            HTTPFLV: 'http://<hostName>:FLVport/<appName>/<streamName>.flv'
        }
    }

```
* videoUrl(string)
```javascript
// if -- (isLive: false)  -- must be set --
// otherwise (isLive: true && liveStreamUrl(not set)) -- must be set --
    {
        videoUrl: 'http://***.mp4(.ogg/.webm/.flv/.m3u8)'
    }
```

* barrage(object)
```javascript
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
}
```


##  How to use
```javascript
<link rel="stylesheet" type="text/css" href="dist/css/videoPlayer.css" />

<div id="videoWrap"></div>

<script type="text/javascript" charset="utf-8" src="http://apps.bdimg.com/libs/jquery/1.9.1/jquery.min.js"></script>
<script type="text/javascript" charset="utf-8" src="dist/js/videoPlayer.js"></script>
<script type="text/javascript" charset="utf-8" >
    // 1. on demand(点播)
    $('#videoWrap').videoPlayer({
        videoUrl: 'http://***.mp4(.ogg/.webm/.flv/.m3u8)'
    });
    // 2. live(直播)
    $('#videoWrap').videoPlayer({
        isLive: true,
        liveStreamUrl: {
            RTMP: 'rtmp://<hostName>:1935/<appName>/<sreamName>',
            HLS: 'http://<hostName>:HLSport/<appName>/<streamName>.m3u8',
            HTTPFLV: 'http://<hostName>:FLVport/<appName>/<streamName>.flv'
        }
    });
</script>
```