'use strict';
$(function () {

	var warningTimeout = 600,     // 提示关注隐藏时间 - 单位毫秒
		warningCircleTime = 2500; // 提示关注循环显示时间 - 单位毫秒

	setInterval(function () {
		showQRtips(warningTimeout);
	}, warningCircleTime);

	// 滚动动画
	var controller = $.superscrollorama();

	var tweenBgNone = TweenMax.to($('.scheduling-image'), .5, { css: { backgroundImage: 'none' } });

	var tweenMove1 = TweenMax.to($('.status-1'), 1, { css: { right: '2.65rem' } }),
		tweenMove3 = TweenMax.to($('.status-3'), 1, { css: { left: '2.6rem' } }),
		tweenMove5 = TweenMax.to($('.status-5'), 1, { css: { right: '2.7rem' } });

	var tweenVisibility1 = TweenMax.to($('.item-edu'), 1, { css: { visibility: 'visible' } }),
		tweenVisibility2 = TweenMax.to($('.item-school'), 1, { css: { visibility: 'visible' } }),
		tweenVisibility3 = TweenMax.to($('.item-museum'), 1, { css: { visibility: 'visible' } });

	controller.addTween('.scheduling-image', tweenBgNone, 500);

	controller.addTween('.status-1', tweenMove1, 500);
	controller.addTween('.status-3', tweenMove3, 500);
	controller.addTween('.status-5', tweenMove5, 500);

	controller.addTween('.item-edu', tweenVisibility1, 500);
	controller.addTween('.item-school', tweenVisibility2, 500);
	controller.addTween('.item-museum', tweenVisibility3, 500);
});

function showQRtips(warningTimeout) {
	var $tips = $('.QR-code > .warning');

	$tips.show();

	setTimeout(function () {
		$tips.hide();
	}, warningTimeout);
}