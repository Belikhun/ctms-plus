//? |-----------------------------------------------------------------------------------------------|
//? |  /static/js/splash.js                                                                         |
//? |                                                                                               |
//? |  Copyright (c) 2021 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

class Splash {
	constructor({
		container,
		name = "Sample App",
		icon = "/api/images/icon",
		onInit,
		onPostInit,
		onError
	} = {}) {
		if (!container || !container.classList)
			throw { code: -1, description: `Splash(): container is not a valid Element!` }

		// Initialize variables for testing with selenium
		localStorage.setItem("__TEST_STATUS", "loading");
		localStorage.setItem("__TEST_CODE", 0);
		localStorage.setItem("__TEST_DESCRIPTION", "Hello World!");

		/**
		 * The container will contain splash
		 * @type {HTMLElement}
		 */
		this.container = container;

		this.splash = makeTree("div", "splash", {
			icon: new lazyload({
				source: icon,
				classes: "icon"
			}),

			phase: { tag: "t", class: "phase", text: "Phase 0/0: Init Splash" },
			
			progress: { tag: "div", class: ["progressBar", "light"], child: {
				bar: { tag: "div", class: "bar" },
				error: { tag: "t", class: "error" },

				detail: { tag: "div", class: "detail", child: {
					module: { tag: "t", class: "module", text: "splash" },
					status: { tag: "t", class: "status", text: "Building Up Splash Screen" }
				}}
			}}
		});

		this.container.insertBefore(this.splash, this.container.childNodes[0]);

		/** @type {HTMLElement} */
		this.bar = this.splash.progress.bar;

		/** @type {HTMLElement} */
		this.phase = this.splash.phase;

		/** @type {HTMLElement} */
		this.module = this.splash.progress.detail.module;

		/** @type {HTMLElement} */
		this.status = this.splash.progress.detail.status;

		/** @type {HTMLElement} */
		this.error = this.splash.progress.error;

		this.bar.dataset.color = "pink";
		this.bar.dataset.blink = "grow";
		this.onInitHandlers = []
		this.onPostInitHandlers = []
		this.onErrorHandlers = []

		if (onInit)
			this.onInit(onInit);

		if (onPostInit)
			this.onPostInit(onPostInit);

		if (onError)
			this.onError(onError);

		try {
			this.preLoad();
		} catch(e) {
			this.panic(e);
			throw e;
		}
	}

	onInit(f) {
		if (!f || typeof f !== "function")
			throw { code: -1, description: "splash.onInit(): not a valid function" }

		this.onInitHandlers.push(f);
	}

	onPostInit(f) {
		if (!f || typeof f !== "function")
			throw { code: -1, description: "splash.onPostInit(): not a valid function" }

		this.onPostInitHandlers.push(f);
	}

	onError(f) {
		if (!f || typeof f !== "function")
			throw { code: -1, description: "splash.onError(): not a valid function" }

		this.onErrorHandlers.push(f);
	}

	preLoad() {
		this.bar.dataset.slow = 30;
		this.phase.innerText = "Phase 1/3: Page Initialization";
		this.status.innerText = "Đang Tải Dữ Liệu";

		requestAnimationFrame(() => this.bar.style.width = "30%");

		if (["complete", "interactive"].includes(document.readyState))
			this.load();
		else
			window.addEventListener("load", () => this.load());
	}

	async load() {
		this.bar.removeAttribute("data-slow");
		this.preLoaded = true;
		this.loaded = false;

		this.phase.innerText = "Phase 2/3: Script Initialization";
		this.bar.style.width = `30%`;
		this.bar.dataset.color = "blue";
		this.bar.removeAttribute("data-blink");

		let _mp = 1 / this.onInitHandlers.length;
		for (let i = 0; i < this.onInitHandlers.length; i++) {
			let f = this.onInitHandlers[i];

			await f(({ p, m, d }) => {
				if (m)
					this.module.innerText = m;
	
				if (d)
					this.status.innerText = d;
	
				if (p)
					this.bar.style.width = `${30 + ((i * _mp) + (p / 100) * _mp) * 60}%`;
			}).catch((e) => this.panic(e));
		}

		await this.post();
	}

	async post() {
		this.phase.innerText = "Phase 3/3: Post Initialization";
		this.bar.style.width = `90%`;
		this.bar.dataset.color = "green";

		let _mp = 1 / this.onPostInitHandlers.length;
		for (let i = 0; i < this.onPostInitHandlers.length; i++) {
			let f = this.onPostInitHandlers[i];

			await f(({ p, m, d }) => {
				if (m)
					this.module.innerText = m;
	
				if (d)
					this.status.innerText = d;
	
				if (p)
					this.bar.style.width = `${90 + ((i * _mp) + (p / 100) * _mp) * 10}%`;
			}).catch((e) => this.panic(e, false));
		}

		this.bar.style.width = `100%`;
		this.status.innerText = "Tải Hoàn Thành";
		cookie.set("splashInitSuccess", true, 1);
		this.splash.classList.add("hide");

		localStorage.setItem("__TEST_STATUS", "complete");
	}

	async panic(error, stop = true) {
		let e = parseException(error);

		this.splash.classList.add("errored");
		this.status.innerText = "LỖI ĐÃ XẢY RA!";
		this.error.innerText = `[${e.code}] >>> ${e.description}`;
		this.bar.dataset.color = "red";
		this.bar.dataset.blink = "grow";
		cookie.set("splashInitSuccess", false, 1);
		clog("ERRR", error);

		localStorage.setItem("__TEST_STATUS", "complete");
		localStorage.setItem("__TEST_CODE", e.code);
		localStorage.setItem("__TEST_DESCRIPTION", e.description);
		
		for (let f of this.onErrorHandlers)
			await f(error, e.code, e.description, e.stack)

		if (stop)
			throw error;
	}
}