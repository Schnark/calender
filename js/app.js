/*global MS_PER_DAY, renderDay, renderMonth, renderSettings, getDataForSearch, settings*/

(function () {
"use strict";

var currentView, currentConfig, currentDate, currentSearch;

function initEvents (swipe, click, input) {
	var startX = 0, startY = 0, body = document.getElementsByTagName('body')[0];

	function calcSwipe (x, y) {
		var diffX, diffY;
		diffX = startX - x;
		diffY = startY - y;
		if (2 * Math.abs(diffY) < Math.abs(diffX) && Math.abs(diffX) > 50) {
			if (diffX > 0) {
				swipe(true);
			} else {
				swipe(false);
			}
		}
	}

	body.addEventListener('touchstart', function (e) {
		var touch = e.changedTouches[0];
		startX = touch.pageX;
		startY = touch.pageY;
	}, false);
	body.addEventListener('touchend', function (e) {
		var touch = e.changedTouches[0];
		calcSwipe(touch.pageX, touch.pageY);
	}, false);
	body.addEventListener('mousedown', function (e) {
		startX = e.pageX;
		startY = e.pageY;
	}, false);
	body.addEventListener('mouseup', function (e) {
		calcSwipe(e.pageX, e.pageY);
	}, false);
	body.addEventListener('click', function (e) {
		var id = e.target.id;
		if (id) {
			click(id);
		}
	}, false);
	body.addEventListener('input', function (e) {
		var id = e.target.id;
		if (id) {
			input(id);
		}
	}, false);
}

function showDay () {
	var html = renderDay(currentDate.getDate(), currentDate.getMonth() + 1, currentDate.getFullYear(), settings.get());
	document.getElementById('content').innerHTML = html;
	currentView = 'date';
	currentConfig = false;
}

function showMonth () {
	var html = renderMonth(currentDate.getMonth() + 1, currentDate.getFullYear(), settings.get(), currentSearch);
	document.getElementById('content').innerHTML = html;
	currentView = 'month';
	currentConfig = false;
}

function showSettings () {
	var html = renderSettings(settings.get());
	toggleSearch(false);
	document.getElementById('content').innerHTML = html;
	currentConfig = true;
}

function toggleSearch (on) {
	var search = document.getElementById('search-input'), body = document.getElementsByTagName('body')[0];
	if (on === undefined) {
		on = body.className !== 'search-visible';
	}
	if (on) {
		body.className = 'search-visible';
		search.focus();
	} else {
		currentSearch = '';
		search.value = '';
		body.className = '';
		updateSearchStatus(true);
		if (currentView === 'month') {
			showMonth();
		}
	}
}

function updateSearchStatus (matches) {
	document.getElementById('search-input').className = matches ? '' : 'no-match';
}

function exactDate (date) {
	if (!date || isNaN(Number(date))) {
		date = new Date();
	}
	currentDate = date;
	currentDate.setHours(12);
	showDay();
}

function chooseDay (d) {
	currentDate.setDate(d);
	showDay();
}

function prevNextDay (dir) {
	var date;
	if (dir) {
		currentDate = new Date(Number(currentDate) + MS_PER_DAY);
	} else {
		currentDate = new Date(Number(currentDate) - MS_PER_DAY);
	}
	if (currentSearch) {
		date = getDataForSearch(currentDate.getDate(), currentDate.getMonth() + 1, currentDate.getFullYear(),
			currentSearch, dir, settings.get());
		if (date) {
			currentDate = date;
		} else {
			toggleSearch(false);
		}
	}
	showDay();
}

function prevNextMonth (dir) {
	currentDate.setDate(1);
	if (dir) {
		currentDate.setMonth(currentDate.getMonth() + 1);
	} else {
		currentDate.setMonth(currentDate.getMonth() - 1);
	}
	showMonth();
}

function incrSearch (search) {
	var date;
	currentSearch = search;
	if (currentView === 'date') {
		date = getDataForSearch(currentDate.getDate(), currentDate.getMonth() + 1, currentDate.getFullYear(),
			currentSearch, true, settings.get());
		if (!date) {
			updateSearchStatus(false);
		} else {
			updateSearchStatus(true);
			currentDate = date;
			showDay();
		}
	} else {
		showMonth();
	}
}

function swipeHandler (dir) {
	if (currentConfig) {
		return;
	}
	if (currentView === 'date') {
		prevNextDay(dir);
	} else {
		prevNextMonth(dir);
	}
}

function clickHandler (id) {
	var geoWait, geoDone, geoFail;
	switch (id) {
	case 'button-config':
		showSettings();
		break;
	case 'button-search':
		toggleSearch();
		break;
	case 'button-month':
		showMonth();
		break;
	case 'button-today':
		exactDate();
		break;
	case 'button-choose':
		focusDateSelector(currentDate);
		break;
	case 'button-current-location':
		geoWait = document.getElementById('geoWait');
		geoDone = document.getElementById('geoDone');
		geoFail = document.getElementById('geoFail');
		geoWait.hidden = false;
		geoDone.hidden = true;
		geoFail.hidden = true;
		getLatLon(function (data) {
			if (!currentConfig) {
				return;
			}
			geoWait.hidden = true;
			if (!data) {
				geoFail.hidden = false;
				return;
			}
			geoDone.hidden = false;
			document.getElementById('lat').value = data.lat;
			document.getElementById('lon').value = data.lon;
		});
		break;
	case 'button-save':
		settings.save(settings.read());
		document.documentElement.lang = settings.get().lang;
		/*falls through*/
	case 'button-discard':
		if (currentView === 'date') {
			showDay();
		} else {
			showMonth();
		}
		break;
	default:
		if (id.slice(0, 4) === 'day-') {
			chooseDay(id.slice(4));
		}
	}
}

function inputHandler (id) {
	var input;
	switch (id) {
	case 'search-input':
		incrSearch(document.getElementById('search-input').value);
		break;
	case 'date-input':
		input = document.getElementById('date-input');
		exactDate(new Date(input.value));
		input.blur();
		break;
	}
}

function focusDateSelector (date) {
	var dateInput = document.getElementById('date-input');
	date = date.toISOString().slice(0, 10);
	if (dateInput.type !== 'date') {
		date = window.prompt(document.getElementById('button-choose').textContent, date);
		if (date) {
			exactDate(new Date(date));
		}
	} else {
		dateInput.value = date;
		dateInput.focus();
	}
}

function getLatLon (callback) {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function (pos) {
			callback({lat: pos.coords.latitude, lon: pos.coords.longitude});
		}, function () {
			callback();
		}, {timeout: 60 * 1000, maximumAge: 60 * 1000});
	} else {
		callback();
	}
}

function init () {
	initEvents(swipeHandler, clickHandler, inputHandler);
	exactDate();
	toggleSearch(false);
	document.documentElement.lang = settings.get().lang;
}

init();

})();