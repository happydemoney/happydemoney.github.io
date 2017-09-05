#   videoPlayer

##  config
* isLive(true/false) 
```javascript
   {
       isLive: false
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