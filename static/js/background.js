console.log("Hello World! From Deal Hunter Suite Background Script!");

chrome.browserAction.onClicked.addListener(tab => {
	var currentTab = tab;

	chrome.windows.create({
		url: chrome.extension.getURL("/mainPage/index.html"),
		width: 420,
		height: 720,
		type: "panel",
		setSelfAsOpener: true
	});
});

chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
	let purgeExclude = []
	let onlyFH = false;
	let haveFH = false;
	let headers = {}
	let FHeaders = {}

	for (let item of details.requestHeaders) {
		if (item.name === "FH_Purge-All") {
			if (item.value == "true")
				onlyFH = true;
				
			continue;
		}

		if (item.name === "FH_Purge-Exclude" && item.value) {
			purgeExclude = item.value.split("&");
			continue;
		}

		let h = /FH_(.+)/gm.exec(item.name);

		if (h && h[1]) {
			console.log(`Processing Headers: ${item.name} (${h[1]}) -> ${item.value}`);
			FHeaders[h[1]] = item.value;

			haveFH = true;
			continue;
		}

		if (!headers[item.name] && (!onlyFH || purgeExclude.includes(item.name)))
			headers[item.name] = item.value;
	}

	headers = { ...headers, ...FHeaders }
	let headersArray = Object.keys(headers).map(key => ({ name: key, value: headers[key] }));
	
	if (haveFH)
		console.debug(headersArray);

	return { requestHeaders: headersArray }
}, { urls: ["<all_urls>"] }, ["blocking", "requestHeaders", "extraHeaders"])