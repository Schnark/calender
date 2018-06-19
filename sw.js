/*global caches, fetch, Promise */
(function (worker) {
"use strict";

var VERSION = 'v2.9',
	FILES = [
		'index.html',
		'style.css',
		'img/moon-0.jpg',
		'img/moon-1.jpg',
		'img/moon-2.jpg',
		'img/moon-3.jpg',
		'img/moon-4.jpg',
		'img/moon-5.jpg',
		'img/moon-6.jpg',
		'img/moon-7.jpg',
		'img/moon-8.jpg',
		'img/moon-9.jpg',
		'img/moon-10.jpg',
		'img/moon-11.jpg',
		'img/moon-12.jpg',
		'img/moon-13.jpg',
		'img/moon-14.jpg',
		'img/moon-15.jpg',
		'img/moon-16.jpg',
		'img/moon-17.jpg',
		'img/moon-18.jpg',
		'img/moon-19.jpg',
		'img/moon-20.jpg',
		'img/moon-21.jpg',
		'img/moon-22.jpg',
		'img/moon-23.jpg',
		'img/moon-24.jpg',
		'img/moon-25.jpg',
		'img/moon-26.jpg',
		'img/moon-27.jpg',
		'img/moon-28.jpg',
		'img/moon-29.jpg',
		'search.png',
		'settings.png',
		'js/app.js',
		'js/astro.js',
		'js/data.js',
		'js/manage-data.js',
		'js/render.js',
		'js/settings.js',
		'js/lib/lune.js',
		'js/lib/suncalc.js'
	];

worker.addEventListener('install', function (e) {
	e.waitUntil(
		caches.open(VERSION).then(function (cache) {
			return cache.addAll(FILES);
		})
	);
});

worker.addEventListener('activate', function (e) {
	e.waitUntil(
		caches.keys().then(function (keys) {
			return Promise.all(keys.map(function (key) {
				if (key !== VERSION) {
					return caches.delete(key);
				}
			}));
		})
	);
});

worker.addEventListener('fetch', function (e) {
	e.respondWith(caches.match(e.request, {ignoreSearch: true})
		.then(function (response) {
			return response || fetch(e.request);
		})
	);
});

})(this);