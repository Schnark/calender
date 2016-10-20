/*global getDataForDay, getDataForMonth, getDataForSettings*/
(function () {
"use strict";

function renderDay (d, m, y, settings) {
	var data = getDataForDay(d, m, y, settings), html = [], i;

	html.push('<nav class="top">');
	html.push('<img id="button-config" src="img/settings.png">');
	html.push('<img id="button-search" src="img/search.png">');
	html.push('</nav>');

	html.push('<div id="container" class="dayview day-' + data.type + '">');

	html.push('<div class="year">' + data.year + '</div>');
	html.push('<div class="day">' + data.date + '</div>');
	html.push('<div class="month">' + data.month + '</div>');
	html.push('<div class="dow">' + data.day + '</div>'); //FIXME Reihenfolge?
	html.push('<div class="dedication">');
	for (i = 0; i < data.texts.length; i++) {
		html.push(data.texts[i] + '<br>');
	}
	html.push('</div>');
	if (data.riseSet) {
		html.push('<ul class="rise-decline">');
		html.push('<li class="sun-rise">' + data.riseSet.l10n.sunRise + data.riseSet.sun.rise + '</li>');
		html.push('<li class="sun-decline">' + data.riseSet.l10n.sunSet + data.riseSet.sun.set + '</li>');
		html.push('<li class="moon-rise">' + data.riseSet.l10n.moonRise + data.riseSet.moon.rise + '</li>');
		html.push('<li class="moon-decline">' + data.riseSet.l10n.moonSet + data.riseSet.moon.set + '</li>');
		html.push('</ul>');
	}
	if (data.moonData) {
		html.push('<img class="moon" src="img/moon-' + data.moonData.image + '.jpg">');
		html.push('<ul class="moon-data">');
		html.push('<li>' + data.moonData.l10n[data.moonData.phase] +
			(data.moonData.time ? ' (' + data.moonData.time + ')' : ''));
		if (data.moonData.zodiac) {
			html.push(data.moonData.l10n.zodiac + data.moonData.l10n[data.moonData.zodiac] +
				(data.moonData.changeTo ?
					'(' + data.moonData.l10n[data.moonData.changeTo] + ' ' +
						data.moonData.l10n.from + ' ' + data.moonData.changeToTime + ')' :
					'')
			);
		}
		html.push('</li>');
		if (data.moonData.good) {
			for (i = 0; i < data.moonData.good.length; i++) {
				html += '<li class="good">' + data.moonData.l10n['good-' + data.moonData.good[i]] + '</li>';
			}
		}
		if (data.moonData.bad) {
			for (i = 0; i < data.moonData.bad.length; i++) {
				html += '<li class="bad">' + data.moonData.l10n['bad-' + data.moonData.bad[i]] + '</li>';
			}
		}
		html.push('</ul>');
		html.push('<span class="clear"></span>');
	}
	html.push('</div>');
	html.push('<nav class="bottom">');
	html.push('<button id="button-month">' + data.navigation.month + '</button>');
	html.push('<button id="button-today">' + data.navigation.today + '</button>');
	html.push('<button id="button-choose">' + data.navigation.choose + '</button>');
	html.push('</nav>');
	return html.join('');
}

function renderMonth (m, y, settings, search) {
	var data = getDataForMonth(m, y, settings, search), html = [], i, j;

	html.push('<nav class="top">');
	html.push('<img id="button-config" src="img/settings.png">');
	html.push('<img id="button-search" src="img/search.png">');
	html.push('</nav>');

	html.push('<div id="container">');

	html.push('<div class="year">' + data.year + '</div>');
	html.push('<div class="month">' + data.month + '</div>');

	html.push('<table class="month-view">');
	html.push('<tr>');
	for (i = 1; i <= 7; i++) {
		html.push('<th>' + data.days[i % 7] + '</th>');
	}
	i = 0;
	while (true) {
		if (i % 7 === 0) {
			html.push('</tr>');
			html.push('<tr>');
		}
		j = i - (data.startDay + 6) % 7;
		if (j < 0) {
			html.push('<td></td>');
		} else if (data.types[j]) {
			html.push('<td id="day-' + (j + 1) + '" class="day-' + data.types[j] + '">' + (j + 1) + '</td>');
		} else {
			break;
		}
		i++;
	}
	html.push('</tr>');
	html.push('</table>');

	html.push('</div>');
	return html.join('');
}

function makeSelect (id, label, items, defaultValue) {
	var html = [], val;
	html.push('<label>');
	html.push(label);
	html.push('<select id="' + id + '">');
	for (val in items) {
		if (items.hasOwnProperty(val)) {
			html.push('<option value="' + val + '"' + (String(val) === String(defaultValue) ? ' selected' : '') + '>');
			html.push(items[val]);
			html.push('</option>');
		}
	}
	html.push('</select>');
	html.push('</label>');
	return html.join('');
}

function makeSlider (id, label, defaultValue) {
	var html = [];
	html.push('<label>');
	html.push(label);
	html.push('<br>');
	html.push('<input id="' + id + '" type="range" min="0" max="4" step="1" value="' + defaultValue + '">');
	html.push('</label>');
	return html.join('');
}

function makeNumberinput (id, label, defaultValue) {
	var html = [];
	html.push('<label>');
	html.push(label);
	html.push('<input id="' + id + '" type="number" step="any" lang="en" value="' + defaultValue + '">');
	html.push('</label>');
	return html.join('');
}

function renderSettings (settings) {
	var data = getDataForSettings(settings), html = [], id;
	html.push('<div id="container">');
	html.push('<header><h1>');
	html.push(data.l10n.heading);
	html.push('</h1></header>');
	html.push('<p>');
	html.push(makeSelect('lang', data.l10n.lang, data.languages, settings.lang));
	html.push('<br>');
	html.push(makeSelect('region', data.l10n.region, data.regions, settings.region));
	html.push('</p>');
	html.push('<p>');
	for (id in data.types) {
		if (data.types.hasOwnProperty(id)) {
			html.push(makeSlider(id, data.types[id], settings.types[id]));
			html.push('<br>');
		}
	}
	html.push('</p>');
	html.push('<p>');
	html.push('<label>');
	html.push('<input id="riseSet" type="checkbox"' + (settings.riseSet ? ' checked' : '') + '>&nbsp;');
	html.push(data.l10n.riseSet);
	html.push('</label>');
	html.push('<br>');
	html.push(makeNumberinput('lat', data.l10n.lat, settings.lat));
	html.push('<br>');
	html.push(makeNumberinput('lon', data.l10n.long, settings.lon));
	html.push('<br>');
	html.push('<button id="button-current-location">' + data.l10n.currentLocation + '</button>');
	html.push('<br>');
	html.push('<span id="geoWait" hidden>' + data.l10n.geoWait + '</span>');
	html.push('<span id="geoDone" hidden>' + data.l10n.geoDone + '</span>');
	html.push('<span id="geoFail" hidden>' + data.l10n.geoFail + '</span>');
	html.push('</p>');
	html.push('<p>');
	html.push(makeSelect('moon', data.l10n.moon, [data.l10n.none, data.l10n.phase, data.l10n.zodiac], settings.moon));
	html.push('</p>');
	html.push('<p id="thanks">');
	html.push(data.l10n.thanks);
	html.push('<ul>');
	for (id in data.libraries) {
		if (data.libraries.hasOwnProperty(id)) {
			html.push('<li>' + id + data.l10n['for'] + data.libraries[id] + '</li>');
		}
	}
	html.push('</ul>');
	html.push('</p>');
	html.push('<p>');
	html.push(data.l10n.source);
	html.push('</p>');
	html.push('<p>');
	html.push(data.l10n.help);
	html.push('</p>');
	html.push('</div>');
	html.push('<nav class="bottom">');
	html.push('<button id="button-save">' + data.l10n.save + '</button>');
	html.push('<button id="button-discard">' + data.l10n.discard + '</button>');
	html.push('</nav>');
	return html.join('');
}

window.renderDay = renderDay;
window.renderMonth = renderMonth;
window.renderSettings = renderSettings;
})();