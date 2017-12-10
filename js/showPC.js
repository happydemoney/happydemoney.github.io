'use strict';
browserRedirect();
if (document.getElementsByTagName('iframe')[0]) {
	isPC();
}
function browserRedirect() {
	var sUserAgent = navigator.userAgent.toLowerCase();
	/*var bIsIpad = sUserAgent.match(/ipad/i) == "ipad";*/
	var bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os";
	var bIsMidp = sUserAgent.match(/midp/i) == "midp";
	var bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
	var bIsUc = sUserAgent.match(/ucweb/i) == "ucweb";
	var bIsAndroid = sUserAgent.match(/android/i) == "android";
	var bIsCE = sUserAgent.match(/windows ce/i) == "windows ce";
	var bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile";
	if (!(bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM)) {
		console.log("PC");
		loadjscssfile('css/iphone.css', 'css');

		document.getElementsByTagName('html')[0].style.fontSize = '100px';
		document.getElementsByClassName("wrap")[0].style.height = "610px";
		var simope = document.body.innerHTML;
		var title = '江西省教育信息化工作推进会';
		var iphone = '<div class="iphone">' +
			'<div class="iphone-top">' +
			' <span class="camera"></span>' +
			' <span class="sensor"></span>' +
			' <span class="speaker"></span>' +
			'</div>' +
			'<div class="top-bar"></div>' +
			'<div class="iphone-screen">' +
			'<div class="iphone-nav">' + title + '</div>' + simope + '</div>' +
			'<div class="buttons">' +
			' <span class="on-off"></span>' +
			' <span class="sleep"></span>' +
			' <span class="up"></span>' +
			' <span class="down"></span>' +
			'</div>' +
			'<div class="bottom-bar"></div>' +
			'<div class="iphone-bottom">' +
			' <span></span>' +
			'</div>' +
			'</div>';
		document.body.innerHTML = iphone;

	} else {
		console.log("移动");
	}
}
function loadjscssfile(filename, filetype) {
	if (filetype == "js") {
		var fileref = document.createElement('script');
		fileref.setAttribute("type", "text/javascript");
		fileref.setAttribute("src", filename);
	} else if (filetype == "css") {

		var fileref = document.createElement('link');
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", filename);
	}
	if (typeof fileref != "undefined") {
		document.getElementsByTagName("head")[0].appendChild(fileref);
	}

}
function isPC() {
	var sUserAgent = navigator.userAgent.toLowerCase();
	/*var bIsIpad = sUserAgent.match(/ipad/i) == "ipad";*/
	var bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os";
	var bIsMidp = sUserAgent.match(/midp/i) == "midp";
	var bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
	var bIsUc = sUserAgent.match(/ucweb/i) == "ucweb";
	var bIsAndroid = sUserAgent.match(/android/i) == "android";
	var bIsCE = sUserAgent.match(/windows ce/i) == "windows ce";
	var bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile";
	if (!(bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM)) {
		document.getElementsByTagName('iframe')[0].style.height = '210px';
		document.getElementsByTagName('section')[0].style.height = '210px';
	} else {
		var iframeWidth = document.getElementsByTagName('iframe')[0].clientWidth;
		document.getElementsByTagName('iframe')[0].style.height = iframeWidth * 9 / 16 + 'px';
		document.getElementsByTagName('section')[0].style.height = iframeWidth * 9 / 16 + 'px';
	}
}