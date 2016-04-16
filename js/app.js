/*global MS_PER_DAY, renderDay, renderMonth, renderSettings, getDataForSearch, settings*/

(function () {
"use strict";

var currentView, currentDate, currentSearch;

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
}

function showMonth () {
	var html = renderMonth(currentDate.getMonth() + 1, currentDate.getFullYear(), settings.get(), currentSearch);
	document.getElementById('content').innerHTML = html;
	currentView = 'month';
}

function showSettings () {
	var html = renderSettings(settings.get());
	toggleSearch(false);
	document.getElementById('content').innerHTML = html;
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
	if (currentView === 'date') {
		prevNextDay(dir);
	} else {
		prevNextMonth(dir);
	}
}

function clickHandler (id) {
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
		getLatLon(function (data) {
			if (!data) {
				//FIXME
				return;
			}
			document.getElementById('lat').value = data.lat;
			document.getElementById('lon').value = data.lon;
		});
		break;
	case 'button-save':
		settings.save(settings.read());
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
	switch (id) {
	case 'search-input':
		incrSearch(document.getElementById('search-input').value);
		break;
	case 'date-input':
		exactDate(new Date(document.getElementById('date-input').value));
		break;
	}
}

function focusDateSelector (date) {
	var dateInput = document.getElementById('date-input');
	date = date.toISOString().slice(0, 10);
	if (dateInput.type !== 'date') {
		date = window.prompt('', date); //FIXME
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
		});
	} else {
		callback();
	}
}

function init () {
	initEvents(swipeHandler, clickHandler, inputHandler);
	exactDate();
	toggleSearch(false);
}

init();

})();