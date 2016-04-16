/*global DATA, MS_PER_DAY, astro*/
(function () {
"use strict";

var cachedYears = {};

function getFallbackLang (lang) {
	var pos;
	if (lang in DATA.languageFallback) {
		return DATA.languageFallback[lang];
	}
	pos = lang.indexOf('-');
	if (pos > -1) {
		return lang.slice(0, pos);
	}
	return 'en';
}

function getLocalizedName (name, lang) {
	if (typeof name === 'string') {
		return name;
	}
	if (lang in name) {
		return name[lang];
	}
	return getLocalizedName(name, getFallbackLang(lang));
}

function getIslamicShift (region) {
	var index;
	while (true) {
		if (DATA.shiftIslamic[region]) {
			return DATA.shiftIslamic[region];
		}
		index = region.lastIndexOf('-');
		if (index === -1) {
			return {};
		}
		region = region.slice(0, index);
	}
}

function checkRegion (regions, region) {
	var i;
	for (i = 0; i < regions.length; i++) {
		if ((region + '-').indexOf(regions[i] + '-') === 0) {
			return true;
		}
	}
	return false;
}

function checkType (type, desired) {
	type = type.split('-');
	return type[1] < (desired[type[0]] || 0);
}

function getMoonData (date, extended, lang) {
	var data = astro.getMoonData(date);
	return {
		phase: data.type,
		image: Math.round(data.phase * 30) % 30,
		time: data.time,
		zodiac: extended && data.zodiac,
		//changeTo
		//changeToTime
		good: extended && good(data.type, data.zodiac),
		bad: extended && bad(data.type, data.zodiac),
		l10n: getLocalizedName(DATA.l10n.moonData, lang)
	};
}

function good (/*phase, zodiac*/) {
	//FIXME
	return [];
}

function bad (/*phase, zodiac*/) {
	//FIXME
	return [];
}

function getDateOtherCalender (d, m, start, months) {
	var i;
	d--;
	for (i = 0; i < m - 1; i++) {
		d += months[i];
	}
	return new Date(Number(start) + d * MS_PER_DAY);
}

function getDatesOtherCalender (d, m, y, data) {
	var ret = [], date, i;
	for (i = 0; i < data.length; i++) {
		date = getDateOtherCalender(d, m, data[i].start, data[i].months);
		if (date.getFullYear() === y) {
			ret.push(date);
		}
	}
	return ret;
}

function getDate (day, year, easter, islamicData, jewishData, shiftData) {
	var date, i;
	if (
		('y' in day && year < day.y) ||
		('Y' in day && day.Y < year)
	) {
		return [];
	}
	if ('e' in day) {
		date = [new Date(easter + day.e * MS_PER_DAY)];
	} else if (day.islamic) {
		date = getDatesOtherCalender(day.d, day.m, year, islamicData);
		astro.shiftDates(date, shiftData);
	} else if (day.jewish) {
		date = getDatesOtherCalender(day.d, day.m, year, jewishData);
	} else {
		date = [new Date(year, day.m - 1, day.d)];
	}
	if ('w' in day) {
		for (i = 0; i < date.length; i++) {
			date[i] = new Date(Number(date[i]) + ((7 + day.w - date[i].getDay()) % 7) * MS_PER_DAY);
		}
	}
	return date;
}

function compileYear (year, shiftData) {
	var i, j, dates, result = [],
		easter = astro.getEaster(year),
		islamicData = astro.getIslamicData(year),
		jewishData = astro.getJewishData(year);

	function add (d, m, entry) {
		if (!result[m]) {
			result[m] = [];
		}
		if (!result[m][d]) {
			result[m][d] = [];
		}
		result[m][d].push(entry);
	}

	for (i = 0; i < DATA.days.length; i++) {
		dates = getDate(DATA.days[i], year, easter, islamicData, jewishData, shiftData);
		for (j = 0; j < dates.length; j++) {
			add(dates[j].getDate() - 1, dates[j].getMonth(), DATA.days[i]);
		}
	}
	return result;
}

function getRiseSet (date, lat, long, lang) {
	return {
		sun: astro.getSunTimes(date, lat, long),
		moon: astro.getMoonTimes(date, lat, long),
		l10n: getLocalizedName(DATA.l10n.riseSet, lang)
	};
}

function searchInDay (data, search) {
	search = search.toLowerCase();
	return data.texts.join(' ').toLowerCase().indexOf(search) > -1;
}

function getDataForDay (d, m, y, settings, fast) {
	if (!cachedYears[y]) {
		cachedYears[y] = compileYear(y, getIslamicShift(settings.region));
	}
	var date = new Date(y, m - 1, d, 12), entries = cachedYears[y][m - 1][d - 1] || [], i, isHoliday = false, texts = [];
	for (i = 0; i < entries.length; i++) {
		if (entries[i].region && !checkRegion(entries[i].region, settings.region)) {
			continue;
		}
		if (entries[i].holiday && checkRegion(entries[i].holiday, settings.region)) {
			isHoliday = true;
			texts.push(getLocalizedName(entries[i].name, settings.lang));
			continue;
		}
		if (checkType(entries[i].type, settings.types)) {
			texts.push(getLocalizedName(entries[i].name, settings.lang));
		}
	}
	return {
		navigation: !fast && getLocalizedName(DATA.l10n.navigation, settings.lang),
		type: isHoliday ? 'holiday' : date.getDay() === 0 ? 'sunday' : date.getDay() === 6 ? 'saturday' : 'workday',
		day: !fast && getLocalizedName(DATA.l10n.days, settings.lang)[date.getDay()],
		date: d,
		month: !fast && getLocalizedName(DATA.l10n.months, settings.lang)[m - 1],
		year: y,
		texts: texts,
		riseSet: !fast && settings.riseSet && getRiseSet(date, settings.lat, settings.lon, settings.lang),
		moonData: !fast && settings.moon > 0 && getMoonData(date, settings.moon === 2, settings.lang)
	};
}

function getDataForMonth (m, y, settings, search) {
	var start = new Date(y, m - 1, 1, 12), types = [], date = start, data;
	while (date.getMonth() === m - 1) {
		data = getDataForDay(date.getDate(), m, y, settings, true);
		types.push(data.type);
		if (search && searchInDay(data, search)) {
			types[types.length - 1] += ' match';
		}
		date = new Date(Number(date) + MS_PER_DAY);
	}
	return {
		startDay: start.getDay(),
		month: getLocalizedName(DATA.l10n.months, settings.lang)[m - 1],
		year: y,
		types: types,
		days: getLocalizedName(DATA.l10n.daysShort, settings.lang)
	};
}

function getDataForSearch (d, m, y, search, dir, settings) {
	var current = new Date(y, m - 1, d, 12), fail = 0, data;
	while (fail < 400) {
		data = getDataForDay(current.getDate(), current.getMonth() + 1, current.getFullYear(), settings, true);
		if (searchInDay(data, search)) {
			return current;
		}
		fail++;
		if (dir) {
			current = new Date(Number(current) + MS_PER_DAY);
		} else {
			current = new Date(Number(current) - MS_PER_DAY);
		}
	}
}

function getDataForSettings (settings) {
	function translateObject (o, lang) {
		var n = {}, k;
		for (k in o) {
			if (o.hasOwnProperty(k)) {
				n[k] = getLocalizedName(o[k], lang);
			}
		}
		return n;
	}
	return {
		languages: translateObject(DATA.languages, settings.lang),
		regions: translateObject(DATA.regions, settings.lang),
		types: translateObject(DATA.types, settings.lang),
		libraries: translateObject(DATA.libraries, settings.lang),
		l10n: getLocalizedName(DATA.l10n.settings, settings.lang)
	};
}

window.getDataForDay = getDataForDay;
window.getDataForMonth = getDataForMonth;
window.getDataForSearch = getDataForSearch;
window.getDataForSettings = getDataForSettings;

})();