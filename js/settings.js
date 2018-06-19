(function () {
"use strict";

var defaultConfig;
defaultConfig = {region: 'DE', lang: 'de', types: {sec: 1, rel: 1},
	riseSet: 1, moon: 1, lat: 50, lon: 10, version: 1};

function updateData (data) {
	/*jshint onecase: true*/
	switch (data.version || 0) {
	case 0:
		data = defaultConfig;
	}
	return data;
}

function getSettings () {
	var data;
	try {
		data = JSON.parse(localStorage.getItem('config') || 'x');
	} catch (e) {
		data = defaultConfig;
	}
	data = updateData(data);
	return data;
}

function saveSettings (settings) {
	try {
		localStorage.setItem('config', JSON.stringify(settings));
	} catch (e) {
	}
}

function readSettings () {
	return {
		region: document.getElementById('region').value,
		lang: document.getElementById('lang').value,
		types: {
			sec: Number(document.getElementById('sec').value),
			rel: Number(document.getElementById('rel').value)
		},
		riseSet: document.getElementById('riseSet').checked ? 1 : 0,
		moon: Number(document.getElementById('moon').value),
		lat: Number(document.getElementById('lat').value),
		lon: Number(document.getElementById('lon').value),
		version: 1
	};
}

window.settings = {
	get: getSettings,
	save: saveSettings,
	read: readSettings
};

})();