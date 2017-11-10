/**
 *  @description:   videoBarrage.js （视频弹幕）
 *  @version:   v1.0.0
 *  @author: happydemoney(6744255@qq.com)
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(jQuery);
    }
}(function ($) {

    // 版本
    VERSION = '1.0.1';

    var pluginName = 'videoBarrage',
        videoBarrage = function (config, el) {

        };

    jQuery.fn[pluginName] = function (options) {
        return new videoBarrage(options, this);
    };
}));