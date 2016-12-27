/*global SunCalc, lune*/
/*jshint camelcase: false*/
//jscs:disable requireCamelCaseOrUpperCaseIdentifiers
(function () {
"use strict";

var MS_PER_DAY = 1000 * 60 * 60 * 24;

function isSameDay (d1, d2) {
	return d1.getFullYear() === d2.getFullYear() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getDate() === d2.getDate();
}

function pad (n) {
	return n < 10 ? '0' + String(n) : String(n);
}

function makeTime (date) {
	return date.getHours() + ':' + pad(date.getMinutes());
}

function getFullNew (date) {
	var dates = lune.phase_hunt(date);
	if (isSameDay(date, dates.new_date)) {
		return {
			type: 'new',
			time: makeTime(dates.new_date)
		};
	}
	if (isSameDay(date, dates.nextnew_date)) {
		return {
			type: 'new',
			time: makeTime(dates.nextnew_date)
		};
	}
	if (isSameDay(date, dates.full_date)) {
		return {
			type: 'full',
			time: makeTime(dates.full_date)
		};
	}
	return {
		type: Math.abs(date - dates.q1_date) < Math.abs(date - dates.q3_date) ?
			'waxing' : 'waning'
	};
}

function getMoonData (date) {
	var zodiac = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
		'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
		result, data;
	result = getFullNew(date);
	data = lune.phase(date);
	result.phase = data.phase;
	result.zodiac = zodiac[(12 + Math.floor(data.longitude / 30.0)) % 12];
	return result;
}

function getSunTimes (date, lat, lon) {
	var times = SunCalc.getTimes(date, lat, lon);
	return {
		rise: makeTime(times.sunrise),
		set: makeTime(times.sunset)
	};
}

function getMoonTimes (date, lat, lon) {
	var times = SunCalc.getMoonTimes(date, lat, lon);
	return {
		rise: times.rise ? makeTime(times.rise) : '–',
		set: times.set ? makeTime(times.set) : '–'
	};
}

function getEaster (y) {
//https://de.wikipedia.org/wiki/Gaußsche_Osterformel#Eine_ergänzte_Osterformel
	var k = Math.floor(y / 100),
		m = 15 + Math.floor((3 * k + 3) / 4) - Math.floor((8 * k + 13) / 25),
		s = 2 - Math.floor((3 * k + 3) / 4),
		a = y % 19,
		d = (19 * a + m) % 30,
		r = Math.floor((d + Math.floor(a / 11)) / 29),
		og = 21 + d - r,
		sz = 7 - (y + Math.floor(y / 4) + s) % 7,
		oe = 7 - (og - sz) % 7;
	return Number(new Date(y, 2, 1)) + (og + oe - 0.5) * MS_PER_DAY;
}

function getIslamicYears (y) {
	y = Math.round(33 / 32 * (y - 622));
	return [y - 1, y, y + 1];
}

function getJewishYears (y) {
	return [y + 3760, y + 3761];
}

function getIslamicMonths (y) {
	return {
		start: ((y - 1) * 354 + Math.floor((3 + (11 * y)) / 30) + 1948440).Julian2Date(),
		months: [
			30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30 /*, 29 oder 30*/
		]
	};
}

function getJewishMonths (y) {

	function delay (y) {
		var m = Math.floor(((235 * y) - 234) / 19),
			d = (m * 29) + Math.floor((12084 + 13753 * m) / 25920);
		if (3 * (d + 1) % 7 < 3) {
			d++;
		}
		return d;
	}

	function start (y) {
		var a = delay(y - 1),
			b = delay(y),
			c = delay(y + 1);
		return (347998 + b + (c - b === 356 ? 2 : b - a === 382 ? 1 : 0)).Julian2Date();
	}

	var s = start(y), d = Math.round((Number(start(y + 1)) - Number(s)) / MS_PER_DAY);
	return {
		start: s,
		months: [
			30,
			d === 355 || d === 385 ? 30 : 29,
			d === 353 || d === 383 ? 29 : 30,
			29,
			d > 380 ? 60 : 30, /*inkl. Adar I*/
			29, 30, 29, 30, 29, 30 /*, 29*/
		]
	};
}

function getIslamicData (y) {
	var i;
	y = getIslamicYears(y);
	for (i = 0; i < y.length; i++) {
		y[i] = getIslamicMonths(y[i]);
	}
	return y;
}

function getJewishData (y) {
	var i;
	y = getJewishYears(y);
	for (i = 0; i < y.length; i++) {
		y[i] = getJewishMonths(y[i]);
	}
	return y;
}

function shiftDate (date, shiftData) {
	var d, shift, diff = 0;
	d = String(date.getFullYear()) + pad(date.getMonth() + 1) + pad(date.getDate());
	for (shift in shiftData) {
		if (shiftData.hasOwnProperty(shift)) {
			if (d < shift) {
				break;
			}
			diff = shiftData[shift];
		}
	}
	return new Date(Number(date) + diff * MS_PER_DAY);
}

function shiftDates (dates, shiftData) {
	var i;
	for (i = 0; i < dates.length; i++) {
		dates[i] = shiftDate(dates[i], shiftData);
	}
}

function equinoxSolstice (y) {
	var y1 = (y - 2000) / 1000, y2 = y1 * y1, y3 = y2 * y1, y4 = y3 * y1;
	return [
		(2451623.80984 + 365242.37404 * y1 + 0.05169 * y2 - 0.00411 * y3 - 0.00057 * y4).Julian2Date(),
		(2451716.56767 + 365241.62603 * y1 + 0.00325 * y2 + 0.00888 * y3 - 0.00030 * y4).Julian2Date(),
		(2451810.21715 + 365242.01767 * y1 - 0.11575 * y2 + 0.00337 * y3 + 0.00078 * y4).Julian2Date(),
		(2451900.05952 + 365242.74049 * y1 - 0.06223 * y2 - 0.00823 * y3 + 0.00032 * y4).Julian2Date()
	];
}

window.astro = {
	getMoonData: getMoonData,
	getSunTimes: getSunTimes,
	getMoonTimes: getMoonTimes,
	getEaster: getEaster,
	getIslamicData: getIslamicData,
	getJewishData: getJewishData,
	shiftDates: shiftDates,
	equinoxSolstice: equinoxSolstice
};
window.MS_PER_DAY = MS_PER_DAY;

})();