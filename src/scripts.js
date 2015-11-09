/*                                                                     *
 * This file is brought to you by Georg Großberger                     *
 * (c) 2014 by Georg Großberger <contact@grossberger-ge.org>           *
 *                                                                     *
 * It is free software; you can redistribute it and/or modify it under *
 * the terms of the MIT aka X11 license                                *
 *                                                                     */

var Global = {};

(function(win, doc, exp) {

	var
		boxes = [],
		baseUrl = "boxserver_url",
		noop = function() {},

		errorBox,
		errorText,
		errorBackdrop,

		rxpVersion = /^[0-9]+\.[0-9]+\.[0-9]+$/,
		rxpKey = /^[a-z0-9][a-z0-9_\-\.]+[a-z0-9]$/,
		rxpId = /^([a-z0-9][a-z0-9_\-\.]+[a-z0-9])\/([a-z0-9][a-z0-9_\-\.]+[a-z0-9])$/,

		confirmBox,
		confirmText,
		confirmCallback,

		lastHash,
		tooltip,

		selector_List = "#List",
		selector_Upload = "#Upload",
		selector_Add = "#AddBox",

		style_Hide = "none",
		style_Show = "block";

	function getElement(selector) {
		return doc.querySelector(selector);
	}

	function emptyElement(element) {
		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}
		return element;
	}

	function makeBoxesList(callback) {

		getElement(selector_List).style.display = style_Show;
		getElement(selector_Upload).style.display = style_Hide;
		getElement(selector_Add).style.display = style_Hide;

		boxes = [];

		xhrGet("", function(err, projects) {

			if (err) {
				showError(err.msg ? err.msg : err + "");
				return;
			}

			var
				done = 0,
				needed = projects.length;

			boxes = [];

			projects.forEach(function(project) {
				xhrGet(project, function(err, boxnames) {

					boxnames.forEach(function(box) {
						boxes.push(project + "/" + box);
					});

					done++;

					if (done == needed) {

						var
							template = getElement('#BoxListItem'),
							container = getElement("#BoxList");

						emptyElement(container);
						boxes.sort().forEach(function(box) {
							var el = template.cloneNode(true);

							el.id = "Box_" + box.replace(/\/+/g, "_");
							el.dataset.box = box;

							el.querySelector("a").textContent = box;
							el.querySelector("a").href = "#" + box;

							container.appendChild(el);
						});

						if (callback) {
							callback();
						}
					}
				});
			});
		});
	}

	function xhrGet(res, cb) {
		var
			xhr = new XMLHttpRequest(),
			onReadyStateChange = function() {
				if (xhr.readyState == 4) {
					var err = null, data = null;

					try {
						data = JSON.parse(xhr.responseText);

						if (data && data.msg) {
							data = data.msg;
						}

						if (xhr.status !== 200) {
							err = data;
							data = null;
						}

					} catch (e) {
						err = e;
					}

					cb(err, data);
					cleanup();
				}
			},
			cleanup = function() {
				xhr.removeEventListener("readystatechange", onReadyStateChange);
				xhr = null;
			};

		xhr.addEventListener("readystatechange", onReadyStateChange);
		xhr.open("GET", baseUrl + res, true);
		xhr.send(null);
	}

	function setDocumentByHash() {
		var hash = ("" + location.hash).replace(/#+/, "");

		if (hash === lastHash) {
			return;
		}

		if (hash == "") {
			makeBoxesList()
		} else if (rxpId.test(hash)) {
			makeBoxesList(function() {
				xhrGet(hash, function(err, data) {

					if (err) {
						showError(err);
						return;
					}

					var
						item = getElement("#Box_" + hash.replace(/\/+/, "_")),
						version = getElement("#VersionItem").cloneNode(true),
						provider = version.querySelector(".provider-template").cloneNode(true),
						container = getElement("#ListVersions").cloneNode(true),
						versionAdd = getElement("#NewVersionItem").cloneNode(true),
						providerSuper = version.querySelector(".provider-template"),
						nextVersion,
						availableVersions = [];

					versionAdd.removeAttribute("id");
					version.removeAttribute("id");
					container.removeAttribute("id");

					providerSuper.parentNode.removeChild(providerSuper);
					providerSuper = null;

					container = emptyElement(container);

					item.querySelector("a").classList.add("active");
					item.appendChild(container);

					data.versions.forEach(function(versionData) {

						var versionItem = version.cloneNode(true);

						versionItem.querySelector(".version-name").textContent = versionData.version;
						versionItem.querySelector(".delete-version").href = "#_delete/" + item.dataset.box + "/" + versionData.version;

						container.appendChild(versionItem);
						availableVersions.push(versionData.version);

						versionData.providers.forEach(function(p) {
							var providerItem = provider.cloneNode(true),
								after = versionItem.querySelector(".last-provider-row");

							providerItem.querySelector(".delete-provider").href = "#_delete/" + item.dataset.box + "/" + versionData.version + "/" + p.name;
							providerItem.querySelector(".provider-name").textContent = p.name;
							providerItem.querySelector(".provider-download").href = p.url;

							if (p.size) {
								providerItem.querySelector(".box-size").textContent = "(" + p.size + ")"
							}

							after.parentNode.insertBefore(providerItem, after);
						});

						container.querySelector(".provider-add").href = "#_add/" + item.dataset.box + "/" + versionData.version;
					});

					nextVersion = availableVersions.sort(compareVersions).pop().split(".");
					nextVersion = nextVersion[0] + "."+ nextVersion[1] + "." + (parseInt(nextVersion[2]) + 1);

					versionAdd.querySelector("a").href = "#_add/" + item.dataset.box + "/" + nextVersion;
					container.appendChild(versionAdd);

					win.scrollTo(item.offsetTop - 20, 0);
				});
			});
		} else if (hash.length > 3 && hash.substr(0, 4) == "_add") {
			showAddBox(hash.substr(4).replace(/^\/+/, ""));
		} else if (hash.length > 6 && hash.substr(0, 7) == "_delete") {
			deleteBox(hash.substr(7).replace(/^\/+/, ""));
		} else {
			location.hash = lastHash;
			return;
		}

		lastHash = hash;
	}

	function deleteBox(key) {
		showConfirm("Delete box with key " + key, function() {
			var
				xhr = new XMLHttpRequest(),
				onreadystatechange = function() {
					if (xhr.readyState == 4) {
						if (xhr.status == 200) {
							location.hash = "";
							return;
						}

						var err = xhr.statusText, data;

						try {
							data = JSON.parse(xhr.responseText);
							if (data && data.msg) {
								err = data.msg;
							}
						} catch (e) {}

						showError(err);
						cleanup();
					}
				},
				cleanup = function() {
					xhr.removeEventListener("readystatechange", onreadystatechange);
					xhr = null;
				};

			xhr.addEventListener("readystatechange", onreadystatechange);

			xhr.open('DELETE', baseUrl + key);
			xhr.send(null);
		});
	}

	function showAddBox(prefills) {

		getElement(selector_List).style.display = style_Hide;
		getElement(selector_Upload).style.display = style_Hide;
		getElement(selector_Add).style.display = style_Show;

		var
			data = prefills.split("/"),
			copyOptions = getElement("#NewSourceCopyFrom");

		getElement("#NewProject").value = (data.length > 0 && rxpKey.test(data[0]) ? data[0] : '');
		getElement("#NewBox").value = (data.length > 1 && rxpKey.test(data[1]) ? data[1] : '');
		getElement("#NewVersion").value = (data.length > 2 && rxpVersion.test(data[2]) ? data[2] : '1.0.0');

		getElement("#NewSourceUpload").checked = true;

		setSourceMode();

		emptyElement(copyOptions);

		boxes = [];

		xhrGet("", function(err, projects) {
			projects.forEach(function(project) {
				xhrGet(project, function(err, projectBoxes) {
					projectBoxes.forEach(function(box) {

						var key = project + "/" + box;

						boxes.push(key);

						xhrGet(key, function(err, data) {
							if (err) {
								showError(err)
								return;
							}

							data.versions.map(function(v) {
								return v.version;
							}).sort().reverse().forEach(function(v) {
								var el = doc.createElement("option");
								el.value = key + "/" + v;
								el.text = key + " " + v;
								copyOptions.appendChild(el);
							});
						});
					});
				});
			});
		});
	}

	function setSourceMode() {

		var
			upload = getElement("#NewSourceUploadContainer").style,
			copy   = getElement("#NewSourceCopyContainer").style;

		if (getElement("#NewSourceUpload").checked) {
			upload.display = style_Show;
			copy.display = style_Hide;
		} else {
			upload.display = style_Hide;
			copy.display = style_Show;
		}
	}

	function compareVersions(v1, v2) {

		v1 = v1.split(".").map(function(i) {return parseInt(i) || 0;});
		v2 = v2.split(".").map(function(i) {return parseInt(i) || 0;});

		if (v1[0] > v2[0]) {
			return 1;
		} else if (v1[0] < v2[0]) {
			return -1;
		}

		if (v1[1] > v2[1]) {
			return 1;
		} else if (v1[1] < v2[1]) {
			return -1;
		}

		if (v1[2] > v2[2]) {
			return 1;
		} else if (v1[2] < v2[2]) {
			return -1;
		}

		return 0;
	}

	function createTooltip(element, content) {
		if (tooltip) {
			removeTooltip(function() {
				showTooltip(element, content);
			});
		} else {
			showTooltip(element, content);
		}
	}

	function showTooltip(element, content) {
		tooltip = getElement("#Template_Tooltip").cloneNode(true);
		element.parentNode.insertBefore(tooltip, element);
		tooltip.querySelector(".tooltip-inner").textContent = content;
		tooltip.style.left = (element.offsetLeft + (element.clientWidth / 2) - (tooltip.clientWidth / 2)) + "px";
		tooltip.style.top = (element.offsetTop - tooltip.clientHeight - 2) + "px";
		tooltip.classList.add("in");
	}

	function removeTooltip(callback) {
		if (tooltip) {
			tooltip.classList.remove("in");
			setTimeout(function() {
				tooltip.parentNode.removeChild(tooltip);
				tooltip = null;
				if (callback) {
					setTimeout(callback, 300);
				}
			}, 300);
		} else {
			if (callback) {
				callback();
			}
		}
	}

	function showConfirm(msg, callback) {
		if (confirmBox.style.display = style_Hide) {
			closeConfirm(function() {
				makeConfirm(msg, callback);
			});
		} else {
			makeConfirm(msg, callback);
		}
	}

	function makeConfirm(msg, callback) {
		confirmBox.style.display = style_Show;
		errorBackdrop.style.display = style_Show;
		confirmText.textContent = msg;

		setTimeout(function() {
			confirmBox.classList.add("in");
			errorBackdrop.classList.add("in");

			confirmCallback = callback || noop;
		});
	}

	function closeConfirm(callback) {
		confirmBox.classList.remove("in");
		errorBackdrop.classList.remove("in");
		setTimeout(function() {
			confirmBox.style.display = style_Hide;
			errorBackdrop.style.display = style_Hide;

			if (callback) {
				callback();
			}

			confirmCallback = noop;

		}, 300);
	}

	function showError(msg) {
		if (errorBox.style.display == style_Show) {
			closeError(function() {
				displayError(msg);
			})
		} else {
			displayError(msg);
		}
	}

	function displayError(msg) {
		errorText.innerHTML = msg;
		errorBox.style.display = style_Show;
		errorBackdrop.style.display = style_Show;
		setTimeout(function() {
			errorBox.classList.add("in");
			errorBackdrop.classList.add("in");
		}, 100);
	}

	function closeError(callback) {
		errorBox.classList.remove("in");
		errorBackdrop.classList.remove("in");
		setTimeout(function() {
			errorBox.style.display = style_Hide;
			errorBackdrop.style.display = style_Hide;
			if (callback) {
				callback()
			}
		}, 300);
	}

	doc.addEventListener("DOMContentLoaded", function() {

		var body = getElement("body").firstChild;

		errorText = getElement("#ErrorText");
		errorBox = getElement("#ErrorBox");
		errorBackdrop = getElement("#ErrorBackdrop");

		confirmBox = getElement("#ConfirmBox");
		confirmText = getElement("#ConfirmText");

		errorBox.classList.remove("in");
		errorBackdrop.classList.remove("in");
		confirmBox.classList.remove("in");

		errorBox.style.display = style_Hide;
		errorBackdrop.style.display = style_Hide;
		confirmBox.style.display = style_Hide;

		body.parentNode.insertBefore(errorBackdrop, body);
		body.parentNode.insertBefore(errorBox, body);
		body.parentNode.insertBefore(confirmBox, body);

		setDocumentByHash();
	});

	win.addEventListener("hashchange", function() {
		setDocumentByHash();
	});

	exp.AddBox = function(form) {
		removeTooltip(function() {
			var
				box = form.querySelector("#NewProject").value + "/" + form.querySelector("#NewBox").value,
				version = form.querySelector("#NewVersion").value,
				source = form.querySelector("#NewSourceUpload").checked ? "upload" : "copy",
				file = form.querySelector("#NewUploadFile"),
				provider = form.querySelector("#NewProvider").value,
				resource = box + "/" + version,
				data,
				xhr,
				onProgress = function(e) {

					var total = Math.ceil(e.loaded / e.total * 100).toString();

					if (total == "100") {
						total = "Upload done<br>waiting for response";
					} else {
						total += "%";
					}

					getElement("#Percent").innerHTML = total;
				},
				onReadyStateChange = function() {
					if (xhr.readyState == 4) {

						if (xhr.status == 200) {
							location.hash = box;
						} else {
							showError("Error during from");
						}

						xhr.upload.removeEventListener('progress', onProgress);
						xhr.removeEventListener('readystatechange', onReadyStateChange);
						xhr = null;
					}
				};

			if (!rxpId.test(box)) {
				createTooltip(form.querySelector("#NewProject"), "Not a valid box name");
			} else if (!rxpVersion.test(version)) {
				createTooltip(form.querySelector("#NewVersion"), "Not a valid version");
			} else if (source == "upload" && file.files.length !== 1) {
				createTooltip(form.querySelector("#NewUploadFile"), "Select one box file");
			} else {

				data = new FormData();
				xhr  = new XMLHttpRequest();

				if (source == "upload") {
					data.append('box', file.files[0]);
					resource += "/" + provider
				} else {
					data.append("source", form.querySelector("#NewSourceCopyFrom").value);
				}

				xhr.upload.addEventListener('progress', onProgress);
				xhr.addEventListener('readystatechange', onReadyStateChange);

				getElement("#Percent").textContent = "0";

				getElement(selector_List).style.display = style_Hide;
				getElement(selector_Upload).style.display = style_Show;
				getElement(selector_Add).style.display = style_Hide;

				xhr.open('POST', baseUrl + resource, true);
				xhr.send(data);
			}
		});
	};

	exp.ShowModal = showError;
	exp.CloseModal = closeError;

	exp.ConfirmNo = exp.CloseConfirm = function() {
		closeConfirm();
	};

	exp.ConfirmYes = function() {
		if (confirmCallback) {
			confirmCallback();
		}
		closeConfirm();
	};

	exp.SetAddMode = setSourceMode;
})(window, document, Global);
