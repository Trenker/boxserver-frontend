/*                                                                     *
 * This file is brought to you by Georg Großberger                     *
 * (c) 2014 by Georg Großberger <contact@grossberger-ge.org>           *
 *                                                                     *
 * It is free software; you can redistribute it and/or modify it under *
 * the terms of the MIT aka X11 license                                *
 *                                                                     */


var
	boxes = [],
	pollTimeout,
	baseUrl = "boxserver_url";

function pollBoxes() {
	if (pollTimeout) {
		clearTimeout(pollTimeout);
	}

	boxes = [];

	var template = document.querySelector('#BoxItem');

	xhrGet("", function(projects) {
		projects.forEach(function(project) {
			xhrGet(project, function(boxnames) {
				boxnames.forEach(function(box) {
					boxes.push(project + "/" + box);
				});
				console.log(boxes)
			});
		});
	});

	pollTimeout = setTimeout(pollBoxes, 5000);
}

function xhrGet(res, cb) {
	var
		xhr = new XMLHttpRequest(),
		onload = function() {
			try {
				var data = JSON.parse(xhr.responseText);
				cb(null, data);

			} catch (err) {
				cb(err, null)
			}
			cleanup();
		},
		onerror = function() {
			console.error(xhr);
			cb(new Error("Invalid request", xhr.status), null)
			cleanup();
		},
		cleanup = function() {
			xhr.removeEventListener("load", onload);
			xhr.removeEventListener("error", onerror);
			xhr = null;
		};

	xhr.addEventListener("load", onload);
	xhr.addEventListener("error", onerror);
	xhr.open("GET", baseUrl + res, true);
	xhr.send(null)
}

document.addEventListener("DOMContentLoaded", function() {
	pollBoxes();
});
