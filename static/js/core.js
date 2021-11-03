//? |-----------------------------------------------------------------------------------------------|
//? |  /static/js/core.js                                                                           |
//? |                                                                                               |
//? |  Copyright (c) 2021 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

var APPNAME = "CTMS+";
var VERSION = "0.1";
var STATE = "local";

/**
 * Screen class, used to construct new screen
 * 
 * @author		Belikhun
 * @version		1.0
 */
class CoreScreen {
	constructor({
		id = "sample",
		icon = "circle",
		title = "sample screen",
		description = "this is a sample screen description",
		subTitle = "",
		applyScrollable = true
	} = {}) {
		this.id = id;
		this.showing = false;
		this.overlayShowing = false;
		this.reloadHandlers = []
		this.showHandlers = []
		this.hideHandlers = []

		this.button = core.navbar.switch.component.button({
			icon,
			tooltip: {
				title,
				description
			}
		});

		this.view = makeTree("div", ["screen", id], {
			loading: { tag: "div", class: "loading", child: {
				spinner: { tag: "span", class: "spinner" }
			}},

			overlay: { tag: "div", class: "overlay", child: {
				icon: { tag: "icon" },
				oTitle: { tag: "t", class: "title" },
				description: { tag: "t", class: "description" },
				buttons: { tag: "div", class: "buttons" }
			}},

			header: { tag: "div", class: "header", child: {
				icon: { tag: "icon", data: { icon } },
				detail: { tag: "span", class: "detail", child: {
					sTitle: { tag: "t", class: "title", text: title },
					subTitle: { tag: "t", class: "subTitle", html: subTitle }
				}},

				reload: createButton("TẢI LẠI", {
					style: "round",
					icon: "reload",
					complex: true
				})
			}},

			content: { tag: "div", class: "content" }
		});

		if (applyScrollable)
			new Scrollable(this.view, { content: this.view.content });

		this.view.header.reload.addEventListener("click", async () => {
			this.view.header.reload.disabled = true;

			try {
				for (let f of this.reloadHandlers)
					await f();
			} catch(error) {
				errorHandler(error);
			}

			this.view.header.reload.disabled = false;
		});

		this.view.overlay.style.display = "none";
		core.screen.container.appendChild(this.view);
		this.button.click.setHandler((a) => a ? this.__show() : this.__hide());
	}

	show() {
		this.button.click.active = true;
	}

	__show() {
		this.showing = true;
		core.screen.container.dataset.screen = this.id;
		this.showHandlers.forEach(f => f());
	}

	onShow(f) {
		if (typeof f !== "function")
			throw { code: -1, description: `CoreScreen(${this.id}).onShow(): not a valid function` }

		this.showHandlers.push(f);
	}

	hide() {
		this.button.click.active = false;
	}

	__hide() {
		this.showing = false;
		this.hideHandlers.forEach(f => f());
	}

	onHide(f) {
		if (typeof f !== "function")
			throw { code: -1, description: `CoreScreen(${this.id}).onHide(): not a valid function` }

		this.hideHandlers.push(f);
	}

	onReload(f) {
		if (typeof f !== "function")
			throw { code: -1, description: `CoreScreen(${this.id}).onReload(): not a valid function` }

		this.reloadHandlers.push(f);
	}

	set({
		icon,
		title,
		subTitle
	} = {}) {
		if (typeof icon === "string")
			this.view.header.icon.dataset.icon = icon;

		if (typeof title === "string")
			this.view.header.detail.sTitle.innerText = title;

		if (typeof subTitle === "string")
			this.view.header.detail.subTitle.innerHTML = subTitle;
	}

	overlay({
		show = true,
		icon = "circle",
		title = "Screen Overlay Example",
		description = " This is an example of screen overlay, which is immortal 😇",
		buttons = {}
	} = {}) {
		if (!show) {
			this.view.overlay.style.display = "none";
			this.overlayShowing = false;
			return;
		}

		this.overlayShowing = true;
		this.view.overlay.style.display = null;
		this.view.overlay.icon.dataset.icon = icon;
		this.view.overlay.oTitle.innerText = title;
		this.view.overlay.description.innerHTML = description;
		
		emptyNode(this.view.overlay.buttons);
		for (let key of Object.keys(buttons)) {
			let b = createButton(buttons[key].text, {
				color: buttons[key].color || "blue",
				style: "round",
				icon: buttons[key].icon,
				complex: true
			});

			if (typeof buttons[key].onClick === "function")
				b.addEventListener("click", () => buttons[key].onClick());

			this.view.overlay.buttons.appendChild(b);
		}
	}

	/** @param {Boolean} loading */
	set loading(loading) {
		this.view.loading.classList[loading ? "add" : "remove"]("show");
	}

	/** @param {String|HTMLElement} content */
	set content(content) {
		this.view.overlay.style.display = "none";
		emptyNode(this.view.content);

		if (typeof content === "object" && content.classList)
			this.view.content.appendChild(content);
		else
			this.view.content.innerHTML = content;
	}
}

/**
 * This object contains CTMS+ core modules and will be
 * initialized after every resources on the page is loaded
 * 
 * @author	Belikhun
 * @version	1.0
 */
const core = {
	container: $("#container"),
	content: $("#content"),

	/**
	 * Initialize CTMS+ Core
	 * @param {Function}	set			Report Progress to Initializer
	 */
	async init(set = () => {}) {
		let start = time();

		// Disable connection state change
		__connection__.enabled = false;

		await this.initGroup(this, "core", ({ p, m, d }) => {
			clog("DEBG", {
				color: oscColor("pink"),
				text: truncateString(m, 34),
				padding: 34,
				separate: true
			}, d);

			set({ p, m, d });
		});
		
		set({ p: 100, m: "core", d: "CTMS+ Core Loaded" });
		this.initialized = true;

		clog("OKAY", {
			color: oscColor("pink"),
			text: "core",
			padding: 34,
			separate: true
		}, `CTMS+ Core Loaded In ${time() - start}s`);
	},

	/**
	 * Initialize A Group Object
	 * @param {Object}		group			The Target Object
	 * @param {String}		name			Group Name
	 * @param {Function}	set				Report Progress to Initializer
	 */
	async initGroup(group, name, set = () => {}) {
		let modulesList = []

		// Search for modules and initialize it
		set({ p: 0, m: name, d: `Scanning Modules Of ${name}` });

		for (let key of Object.keys(group)) {
			if (key === "super")
				continue;

			let item = group[key];
			if (item && !item.initialized && typeof item.init === "function") {
				// Set Up Module Constants
				item.__NAME__ = key;
				item.super = group;

				item.log = (level, ...args) => clog(level, {
					color: oscColor("pink"),
					text: truncateString(`${name}.${item.__NAME__}`, 34),
					padding: 34,
					separate: true
				}, ...args);

				// Push To Queues
				modulesList.push(item);
			}
		}

		if (modulesList.length === 0)
			return;

		// Sort modules by priority
		// The lower the value is, the higher the priority
		set({ p: 5, m: name, d: `Sorting Modules By Priority` });
		modulesList = modulesList.sort((a, b) => (a.priority || 0) - (b.priority || 0));
		
		if (modulesList.length > 0) {
			clog("DEBG", {
				color: oscColor("pink"),
				text: truncateString(name, 34),
				padding: 34,
				separate: true
			}, `Modules of`, {
				text: name,
				color: oscColor("pink")
			}, `(initialize from top to bottom)`);
	
			for (let [i, module] of modulesList.entries())
				clog("DEBG", {
					color: oscColor("pink"),
					text: truncateString(name, 34),
					padding: 34,
					separate: true
				}, " + ", pleft(i, 2), pleft(module.__NAME__, 38), pleft(module.priority || 0, 3));
		}

		// Initialize modules
		for (let i = 0; i < modulesList.length; i++) {
			let moduleStart = time();
			let item = modulesList[i];
			let path = `${name}.${item.__NAME__}`;
			let mP = 5 + (i / modulesList.length) * 95;

			set({ p: mP, m: path, d: `Initializing` });
			try {
				let returnValue = await item.init(({ p, m, d }) => set({
					p: mP + (p * (1 / modulesList.length) * 0.95),
					m: (m) ? `${path}.${m}` : path,
					d
				}), { clog: item.log });

				if (returnValue === false) {
					clog("INFO", {
						color: oscColor("pink"),
						text: truncateString(path, 34),
						padding: 34,
						separate: true
					}, `Module DISABLED! Skipping all Submodules`);

					item.initialized = false;
					continue;
				}

				item.initialized = true;

				// Try to find and initialize submodules
				await this.initGroup(item, path, ({ p, m, d }) => set({ m, d }));
			} catch(error) {
				if (error.code === 12)
					throw error;

				let e = parseException(error);
				throw { code: 12, description: `core.initGroup(${path}): ${e.description}`, data: error }
			}

			clog("OKAY", {
				color: oscColor("pink"),
				text: truncateString(path, 34),
				padding: 34,
				separate: true
			}, `Initialized in ${time() - moduleStart}s`);
		}

		delete modulesList;
	},

	serviceWorker: {
		init() {
			if (!"serviceWorker" in navigator)
				return false;

			navigator.serviceWorker.register("/service-worker.js", {
				scope: "/"
			})
				.then((res) => this.log("OKAY", "Service Worker registered", res))
				.catch((e) => this.log("ERRR", e));
		}
	},

	popup: {
		priority: 0,
		init: () => popup.init()
	},

	metadata: {
		priority: 0,

		async init(set) {
			try {
				set({ p: 0, d: `Fetching Metadata` });
				let response = await myajax({
					url: "metadata.json",
					method: "GET"
				});

				set({ p: 100, d: `Updating Metadata` });
				window.META = response;
				window.APPNAME = response.name;
				window.VERSION = response.version;
				window.STATE = response.branch;
				window.REPORT_ERROR = response.link.report;
				window.REPO_ADDRESS = response.link.repo;
			} catch(e) {
				this.log("WARN", "Could not fetch metadata file! Maybe it's missing?");
				this.log("DEBG", e);
			}
		}
	},

	tooltip: {
		priority: 0,

		init(set) {
			set({ p: 0, d: `Initializing Tooltip` });
			tooltip.init();
		}
	},

	https: {
		priority: 0,

		init() {
			if (location.protocol !== "https:") {
				this.log("WARN", "Page is not served through https! Anyone can easily alter your data!");
				return false;
			}

			let upgradeInsecure = document.createElement("meta");
			upgradeInsecure.httpEquiv = "Content-Security-Policy";
			upgradeInsecure.content = "upgrade-insecure-requests";
			document.head.appendChild(upgradeInsecure);
		}
	},

	darkmode: {
		priority: 4,
		enabled: false,
		toggleHandlers: [],

		init() {
			this.update();
		},

		set(dark) {
			this.enabled = dark;

			if (this.initialized)
				this.update();
		},

		onToggle(f) {
			if (!f || typeof f !== "function")
				throw { code: -1, description: `core.Panel().button(${icon}).onClick(): not a valid function` }

			this.toggleHandlers.push(f);
			f(this.enabled);
		},

		update() {
			this.toggleHandlers.forEach(f => f(this.enabled));
			document.body.classList[this.enabled ? "add" : "remove"]("dark");
		}
	},

	sounds: {
		priority: 3,

		__set: () => {},
		__clog: window.clog,
		/** @type	{Function[]} */
		handlers: [],

		async init(set, { clog } = {}) {
			if (typeof set === "function")
				this.__set = set;

			if (typeof clog === "function")
				this.__clog = clog;

			await sounds.init(({ p, m, d, c } = {}) => {
				this.__set({ p, m, d });
				this.handlers.forEach(f => f({ p, m, d, c }));
			}, { clog: this.__clog });
		},

		attach(f) {
			if (typeof f !== "function")
				throw { code: -1, description: `core.sounds.attach(): not a valid function` }

			return this.handlers.push(f);
		}
	},

	navbar: {
		priority: 1,
		container: $("#navbar"),

		title: navbar.title({
			icon: "./assets/img/icon.png",
			title: APPNAME
		}),

		/**
		 * Hamburger icon
		 * 
		 * User Settings Panel Toggler
		 * 
		 * @var navbar.menuButton
		 */
		menu: navbar.menuButton({
			tooltip: {
				title: "settings",
				description: `thay đổi cài đặt của ${APPNAME}`
			}
		}),

		/**
		 * Initialize Navigation Bar Module
		 * @param {Function}	set		Report Progress to Initializer
		 */
		init(set) {
			set({ p: 0, d: "Setting Up Navigation Bar" });
			navbar.init(this.container);

			set({ p: 20, d: "Adding Default Navigation Bar Modules" });
			smenu.onShow(() => {
				this.menu.click.setActive(true);
				this.title.click.setActive(true);
			});

			smenu.onHide(() => {
				this.menu.click.setActive(false);
				this.title.click.setActive(false);
			});

			this.menu.click.setHandler((active) => (active) ? smenu.show() : smenu.hide());
			this.menu.click.onClick((active) => (active) ? smenu.setAlignment("right") : "");

			navbar.insert(this.title, "left");
			navbar.insert(this.menu, "right");

			// Set up title click event
			this.title.click.setHandler((active) => {
				if (active)
					smenu.setAlignment("left");
				
				this.menu.click.active = active
			});
		},

		switch: {
			component: navbar.switch(),
			schedule: null,
			tests: null,
			results: null,

			init() {
				navbar.insert(this.component, "left");
				core.darkmode.onToggle((dark) => this.component.set({ color: dark ? "dark" : "whitesmoke" }));
			}
		},
	},

	userSettings: {
		priority: 2,
		container: $("#userSettings"),

		/**
		 * Initialize User Settings Module
		 * @param {Function}	set		Report Progress to Initializer
		 */
		init(set) {
			set({ p: 0, d: "Setting Up User Settings Panel" });
			smenu.init(this.container, {
				title: "cài đặt",
				description: `thay đổi cách ${APPNAME} hoạt động`
			});

			smenu.onShow(() => {
				core.content.classList.add("parallax");
				core.content.dataset.direction = smenu.align;
			});

			smenu.onHide(() => {
				core.content.classList.remove("parallax");
				core.content.dataset.direction = smenu.align;
			});

			if (["beta", "indev", "debug", "test", "development"].includes(STATE)) {
				new smenu.components.Note({
					level: "warning",
					message: `
						Đây là bản thử nghiệm không ổn định dùng để kiểm tra tính ổn định trước khi xuất bản!<br>
						Nếu bạn tìm thấy lỗi, hãy báo cáo lỗi tại link ở phần <b>LIÊN KẾT NGOÀI</b> bên dưới!
					`
				},
					new smenu.Child({ label: "Cảnh Báo" },
						new smenu.Group({
							icon: "exclamation",
							label: "thử nghiệm"
						})
					)
				)
			}
		},

		ctms: {
			/** @type {smenu.Group} */
			group: undefined,
			
			init() {
				this.group = new smenu.Group({
					icon: "circle",
					label: "CTMS"
				});
			},

			status: {
				/** @type {smenu.Child} */
				child: undefined,

				view: undefined,
				
				requests: 0,
				online: 0,
				c2m: { total: 0, count: 0 },
				m2s: { total: 0, count: 0 },
				server: { success: 0, failed: 0 },
				middleware: { success: 0, failed: 0 },

				init() {
					this.child = new smenu.Child({
						label: "Tình Trạng"
					}, this.super.group);

					this.view = makeTree("div", ["component", "ctmsStatus"], {
						basic: { tag: "div", class: "row", child: {
							online: { tag: "span", class: ["item", "infoCard"], child: {
								label: { tag: "t", class: "label", text: "Số Truy Cập" },
								value: { tag: "t", class: "value", text: "---" }
							}},

							request: { tag: "span", class: ["item", "infoCard"], child: {
								label: { tag: "t", class: "label", text: "Số Yêu Cầu" },
								value: { tag: "t", class: "value", text: "0" }
							}}
						}},

						network: { tag: "div", class: ["item", "infoCard", "network"], child: {
							label: { tag: "t", class: "label", text: "Mạng" },
							nodes: { tag: "div", class: "nodes", child: {
								server: { tag: "span", class: "node", child: {
									label: { tag: "t", class: "label", text: "CTMS" },
									icon: { tag: "icon", data: { icon: "server" } },
									status: { tag: "div", class: "status", child: {
										success: { tag: "t", class: "success", text: "0" },
										failed: { tag: "t", class: "failed", text: "0" }
									}}
								}},

								m2s: { tag: "t", class: ["value", "m2s"], text: "--- ms" },

								middleware: { tag: "span", class: "node", child: {
									label: { tag: "t", class: "label", text: "Middleware" },
									icon: { tag: "icon", data: { icon: "hive" } },
									status: { tag: "div", class: "status", child: {
										success: { tag: "t", class: "success", text: "0" },
										failed: { tag: "t", class: "failed", text: "0" }
									}}
								}},

								c2m: { tag: "t", class: ["value", "c2m"], text: "--- ms" },

								client: { tag: "span", class: "node", child: {
									label: { tag: "t", class: "label", text: "Client" },
									icon: { tag: "icon", data: { icon: "laptop" } }
								}}
							}}
						}}
					});

					this.child.insert(this.view);

					api.onResponse("global", (data) => {
						this.requests++;
						this.server.success++;
						this.middleware.success++;

						this.m2s.count++;
						this.m2s.total += data.time;

						this.c2m.count++;
						this.c2m.total += data.c2m;

						let onlineNode = data.dom.getElementById("menubottom");
						if (onlineNode)
							this.online = parseInt(onlineNode.innerText.match(/\d+/)[0]);

						this.update();
					});

					api.onResponse("error", (error) => {
						this.requests++;
						this.c2m.count++;
						this.c2m.total += error.c2m;
						
						if (!error.data || error.data.code > 0 && error.data.code < 100) {
							this.middleware.failed++;
						} else {
							this.middleware.success++;

							if (error.data.status >= 400)
								this.server.failed++;
							else
								this.server.success++;
						}

						this.update();
					});
				},

				update() {
					this.view.basic.online.value.innerText = this.online;
					this.view.basic.request.value.innerText = this.requests;
					this.view.network.nodes.server.status.success.innerText = this.server.success;
					this.view.network.nodes.server.status.failed.innerText = this.server.failed;
					this.view.network.nodes.middleware.status.success.innerText = this.middleware.success;
					this.view.network.nodes.middleware.status.failed.innerText = this.middleware.failed;
					this.view.network.nodes.m2s.innerText = `${this.m2s.count > 0 ? round((this.m2s.total / this.m2s.count) * 1000, 2) : "X"} ms`;
					this.view.network.nodes.c2m.innerText = `${this.c2m.count > 0 ? round((this.c2m.total / this.c2m.count) * 1000, 2) : "X"} ms`;

					if (this.middleware.success === 0 && this.middleware.failed > 0)
						this.view.network.nodes.middleware.classList.add("failed");
					else
						this.view.network.nodes.middleware.classList.remove("failed");

					if (this.server.success === 0 && this.server.failed > 0)
						this.view.network.nodes.server.classList.add("failed");
					else
						this.view.network.nodes.server.classList.remove("failed");
				}
			},

			services: {
				/** @type {smenu.Child} */
				child: undefined,

				/** @type {HTMLDivElement} */
				view: undefined,
				
				/** @type {smenu.Panel} */
				panel: undefined,

				serviceInfo: undefined,

				name: {
					basicAccess: "Truy Cập CTMS",
					unverifiedScore: "Xem Điểm Không Chờ Xác Nhận",
					payAsk: "Vấn Đáp Có Trả Phí PayAsk",
					coupleCheckIn: "Couple Check-In",
					shortAccess: "Truy Cập CTMS Ngắn Hạn"
				},

				price: {
					basicAccess: "? occ ? ngày",
					unverifiedScore: "16500 occ 150 ngày",
					payAsk: "0 occ 30 ngày",
					coupleCheckIn: "13419 occ 7 ngày",
					shortAccess: "5968 occ 3 ngày"
				},

				Service: class {
					constructor({
						id = "sample",
						name = "Sample Service",
						price = "0 occ 0 ngày",
						time: timeData,
						panel
					} = {}) {
						if (timeData && timeData.from && timeData.to) {
							this.container = makeTree("div", "infoCard", {
								label: { tag: "t", class: "label", text: name },
								time: { tag: "t", class: "text", html: `${timeData.from.toLocaleString()}<arr></arr>${timeData.to.toLocaleString()}` },
								value: { tag: "div", class: "value" }
							});

							liveTime(this.container.value, time(timeData.to), {
								type: "minimal",
								count: "down",
								ended: "VỪA HẾT HẠN!"
							});
						} else {
							// TODO: Enable buy services button after implementing buying
							this.container = makeTree("div", "infoCard", {
								label: { tag: "t", class: "label", text: name },
								buttons: { tag: "div", class: "buttons", child: {
									serviceInfo: createButton(undefined, { color: "blue", icon: "infoCircle" }),
									buyService: createButton(price.toUpperCase(), { color: "pink", icon: "shoppingCart", disabled: true })
								}}
							});

							if (panel)
								this.container.buttons.serviceInfo.addEventListener("click", () => {
									panel.content(`iframe:./static/services/${id.toLowerCase()}.html`);
									panel.show();
								});
						}
					}
				},

				init() {
					this.child = new smenu.Child({
						label: "Dịch Vụ"
					}, this.super.group);

					let autoload = new smenu.components.Checkbox({
						label: "Tự động tải thông tin",
						color: "pink",
						save: "ctms.services.autoload",
						defaultValue: false
					}, this.child);

					let reload = new smenu.components.Button({
						label: "tải thông tin dịch vụ",
						color: "red",
						complex: true,
						disabled: true,
						onClick: async () => await api.services()
					}, this.child);

					this.panel = new smenu.Panel(undefined, { size: "large" });

					this.view = makeTree("div", ["component", "ctmsServices"], {
						occCard: { tag: "div", class: "infoCard", child: {
							label: { tag: "t", class: "label", text: "OCC" },
							value: { tag: "t", class: "value", text: "X occ" }
						}},

						list: { tag: "div", class: "list" }
					});

					this.child.insert(this.view);

					core.account.onLogout(() => {
						reload.set({ label: "tải thông tin dịch vụ", color: "red", disabled: true });
						this.view.occCard.value.innerText = "X occ";
						emptyNode(this.view.list);
					});

					core.account.onLogin(async () => {
						if (autoload.checkbox.input.checked) {
							reload.button.loading(true);
							await api.services();
							reload.button.loading(false);
						} else {
							// When logged in and user does not want to automatically load
							// services data, re-enable the button so user can load it if they want.
							reload.set({ disabled: false });
						}
					});

					api.onResponse("services", (data) => {
						reload.set({ label: "làm mới", color: "blue" });
						this.view.occCard.value.innerText = data.info.occ;
						emptyNode(this.view.list);

						for (let key of Object.keys(data.info.services)) {
							let s = new this.Service({
								id: key,
								name: this.name[key] || key,
								price: this.price[key] || "MUA",
								time: data.info.services[key],
								panel: this.panel
							});

							this.view.list.appendChild(s.container);
						}
					});
				},

				buy(id) {
					// TODO: Buying Services Implementation
				}
			},
		},

		server: {
			group: smenu.Group.prototype,

			init() {
				this.group = new smenu.Group({ label: "máy chủ", icon: "server" });
				let general = new smenu.Child({ label: "Chung" }, this.group);

				let mwOptions = {}
				let mwDefault = undefined;

				for (let key of Object.keys(META.middleware)) {
					mwOptions[key] = META.middleware[key].name;

					if (META.middleware[key].default)
						mwDefault = key;
				}

				let mwSelect = new smenu.components.Select({
					label: "Middleware",
					icon: "hive",
					options: mwOptions,
					defaultValue: mwDefault,
					save: `server.middleware.${VERSION}`,
					onChange: (v) => api.MIDDLEWARE = META.middleware[v].host
				}, general);
			}
		},

		display: {
			group: smenu.Group.prototype,

			init() {
				this.group = new smenu.Group({ label: "hiển thị", icon: "window" });

				let ux = new smenu.Child({ label: "Giao Diện" }, this.group);
				
				new smenu.components.Checkbox({
					label: "Chế độ ban đêm",
					color: "pink",
					save: "display.nightmode",
					defaultValue: false,
					onChange: (v) => core.darkmode.set(v)
				}, ux);

				new smenu.components.Checkbox({
					label: "Hoạt ảnh",
					color: "blue",
					save: "display.transition",
					defaultValue: true,
					onChange: (v) => document.body.classList[v ? "remove" : "add"]("disableTransition")
				}, ux);

				new smenu.components.Checkbox({
					label: "Bảng cài đặt bên trái",
					color: "blue",
					save: "display.leftSmenu",
					defaultValue: false,
					onChange: (v) => {
						core.navbar.menu.container.style.display = v ? "none" : null;
						smenu.setAlignment(v ? "left" : "right");
						core.content.dataset.direction = v ? "left" : "right";
					}
				}, ux);

				let other = new smenu.Child({ label: "Khác" }, this.group);

				new smenu.components.Checkbox({
					label: "Thông báo",
					color: "pink",
					save: "display.notification",
					defaultValue: false,
					disabled: true
				}, other);
			}
		},

		schedule: {
			group: smenu.Group.prototype,

			init() {
				this.group = new smenu.Group({ label: "lịch học", icon: "calendarWeek" });

				let ux = new smenu.Child({ label: "Giao Diện" }, this.group);

				new smenu.components.Checkbox({
					label: "Tự động thay đổi kiểu hiển thị",
					color: "pink",
					save: "schedule.autoChangeRenderer",
					defaultValue: true,
					onChange: (v) => core.screen.schedule.setAutoChangeRenderer(v)
				}, ux);

				new smenu.components.Choice({
					label: "Kiểu hiển thị mặc định",
					color: "blue",
					choice: {
						table: { title: "Bảng", icon: "table" },
						list: { title: "Danh Sách", icon: "list" }
					},
					save: "schedule.renderMode",
					defaultValue: "table",
					onChange: (v) => core.screen.schedule.setDefaultRenderMode(v)
				}, ux);
			}
		},

		sounds: {
			group: smenu.Group.prototype,

			init() {
				this.group = new smenu.Group({ label: "âm thanh", icon: "volume" });
	
				let status = new smenu.Child({ label: "Trạng Thái" }, this.group);
				let loadDetail = new smenu.components.Text({ content: "Chưa khởi tạo âm thanh" });
				status.insert(loadDetail, -3);

				core.sounds.attach(({ c } = {}) => {
					if (typeof c === "string")
						loadDetail.content = c
				});

				let volume = new smenu.components.Slider({
					label: "Âm lượng",
					color: "blue",
					save: "sounds.volume",
					min: 0,
					max: 100,
					unit: "%",
					defaultValue: 60
				});

				status.insert(volume, -1);
				volume.onInput((v) => {
					sounds.volume = (v / 100);
					volume.set({ color: (v >= 80) ? "red" : "blue" })
				});
	
				let cat = new smenu.Child({ label: "Loại" }, this.group);
				let mouseOver = new smenu.components.Checkbox({
					label: "Mouse Over",
					color: "blue",
					save: "sounds.mouseOver",
					defaultValue: true,
					onChange: (v) => sounds.enable.mouseOver = v
				}, cat);
	
				let btnClick = new smenu.components.Checkbox({
					label: "Button Click/Toggle",
					color: "blue",
					save: "sounds.btnClick",
					defaultValue: true,
					onChange: (v) => sounds.enable.btnClick = v
				}, cat);
	
				let panelToggle = new smenu.components.Checkbox({
					label: "Panel Show/Hide",
					color: "blue",
					save: "sounds.panelToggle",
					defaultValue: true,
					onChange: (v) => sounds.enable.panelToggle = v
				}, cat);
	
				let others = new smenu.components.Checkbox({
					label: "Others",
					color: "blue",
					save: "sounds.others",
					defaultValue: true,
					onChange: (v) => sounds.enable.others = v
				}, cat);
	
				let notification = new smenu.components.Checkbox({
					label: "Notification",
					color: "blue",
					save: "sounds.notification",
					defaultValue: true,
					onChange: (v) => sounds.enable.notification = v
				}, cat);
	
				let master = new smenu.components.Checkbox({
					label: "Bật âm thanh",
					color: "pink",
					save: "sounds.master",
					defaultValue: false,
					onChange: async (v) => {
						sounds.enable.master = v;
						mouseOver.set({ disabled: !v });
						btnClick.set({ disabled: !v });
						panelToggle.set({ disabled: !v });
						others.set({ disabled: !v });
						notification.set({ disabled: !v });

						if (v)
							sounds.soundToggle(sounds.sounds.checkOn);
	
						if (core.initialized && !sounds.initialized)
							await core.sounds.init();
					}
				});

				status.insert(master, -2);
			}
		},

		projectInfo: {
			group: smenu.Group.prototype,
			licensePanel: smenu.Panel.prototype,

			async init() {
				this.group = new smenu.Group({ label: "thông tin", icon: "info" });
				let links = new smenu.Child({ label: "Liên Kết Ngoài" }, this.group);

				// Project Info View
				let projectInfo = makeTree("div", "projectInfo", {
					header: { tag: "div", class: "header", child: {
						icon: new lazyload({ source: "./assets/img/icon.png", classes: "icon" })
					}},

					pTitle: { tag: "t", class: "title", text: APPNAME },
					description: { tag: "t", class: "description", text: "The Next Generation Of CTMS" },

					note: createNote({
						level: "info",
						message: "CTMS+ không được hỗ trợ bởi OTSC hoặc các bên liên quan"
					}),

					authorLabel: { tag: "t", class: "label", text: "Tác Giả" },
					author: { tag: "span", class: "author" },

					contributorLabel: { tag: "t", class: "label", child: {
						content: { tag: "span", text: "Người Đóng Góp" },
						tip: { tag: "tip", title: `<div style="white-space: normal;">Tên của bạn sẽ xuất hiện trong danh sách này nếu bạn có đóng góp cho dự án (bằng cách tạo commit hoặc pull request)</div>` }
					}},

					contributors: { tag: "span", class: "contributor" },
				});

				for (let username of Object.keys(META.author))
					projectInfo.author.appendChild(makeTree("span", "item", {
						avatar: new lazyload({ source: `https://github.com/${username}.png?size=80`, classes: "avatar" }),
						aName: { tag: "a", target: "_blank", href: META.author[username].link, class: "name", text: META.author[username].name },
						department: { tag: "t", class: "department", text: META.author[username].department },
						aRole: { tag: "t", class: "role", text: META.author[username].role }
					}));
				
				for (let username of Object.keys(META.contributors))
					projectInfo.contributors.appendChild(makeTree("div", "item", {
						avatar: new lazyload({ source: `https://github.com/${username}.png?size=40`, classes: "avatar" }),
						username: { tag: "a", target: "_blank", href: `https://github.com/${username}`, class: "username", text: username },
						contributions: { tag: "t", class: "contributions", text: META.contributors[username].contributions }
					}));

				// Components
				new smenu.components.Button({
					label: "Báo Lỗi",
					color: "pink",
					icon: "externalLink",
					complex: true,
					onClick: () => window.open(REPORT_ERROR, "_blank")
				}, links);
				
				new smenu.components.Button({
					label: "Mã Nguồn",
					color: "pink",
					icon: "externalLink",
					complex: true,
					onClick: () => window.open(REPO_ADDRESS, "_blank")
				}, links);

				let project = new smenu.Child({ label: "Dự Án" }, this.group);

				let detailsButton = new smenu.components.Button({
					label: "Thông Tin",
					color: "blue",
					icon: "arrowLeft",
					complex: true
				}, project);

				(new smenu.Panel(projectInfo)).setToggler(detailsButton);

				let licenseButton = new smenu.components.Button({
					label: "LICENSE",
					color: "blue",
					icon: "arrowLeft",
					complex: true
				}, project);

				this.licensePanel = new smenu.Panel(undefined, { size: "large" });
				this.licensePanel.setToggler(licenseButton);
				await this.licensePanel.content("iframe:./license.html");
				core.darkmode.onToggle((enabled) => {
					if (this.licensePanel.iframe.contentDocument)
						this.licensePanel.iframe.contentDocument.body.classList[enabled ? "add" : "remove"]("dark");
				});

				new smenu.components.Footer({
					icon: "./assets/img/icon.png",
					appName: APPNAME,
					version: `${VERSION} - ${STATE}`
				}, project);
			}
		}
	},

	account: {
		priority: 4,

		loggedIn: false,
		background: null,
		email: undefined,
		userInfo: undefined,

		/** @type {HTMLElement} */
		nameNode: null,

		/** @type {lazyload} */
		avatarNode: null,

		navtip: navbar.Tooltip.prototype,
		clickable: navbar.Clickable.prototype,
		subWindow: navbar.SubWindow.prototype,

		loginView: null,
		detailView: null,

		loginHandlers: [],
		logoutHandlers: [],

		async init(set) {
			set({ p: 0, d: `Setting Up Account Panel` });
			let container = document.createElement("span");
			container.classList.add("component", "account");

			this.background = triBg(container, { color: "darkBlue", scale: 1, triangleCount: 8, speed: 6 });

			this.avatarNode = new lazyload({
				source: "./assets/img/guest.png",
				classes: ["avatar", "light"]
			});

			this.nameNode = document.createElement("t");
			this.nameNode.classList.add("name");
			this.nameNode.innerText = "Khách";

			container.append(this.avatarNode.container, this.nameNode);

			this.navtip = new navbar.Tooltip(container, {
				title: "account",
				description: "nhấn để đăng nhập!"
			});

			this.clickable = new navbar.Clickable(container);
			
			this.subWindow = new navbar.SubWindow(container);
			this.clickable.setHandler(() => this.subWindow.toggle());
			this.subWindow.color = "blue";

			this.loginView = makeTree("form", "loginView", {
				label: { tag: "div", class: "label", child: {
					content: { tag: "t", class: "content", text: "Đăng Nhập CTMS" },
					tip: { tag: "tip", title: `Chúng tôi không lưu lại dữ liệu của bạn khi gửi và nhận tới CTMS.\nMã nguồn của API và Middleware có thể tìm thấy ở trong repository của dự án!` }
				}},

				note: createNote({
					level: "warning",
					message: "This is a sample warning"
				}),

				username: createInput({
					type: "text",
					id: "account.login.username",
					label: "Tên Truy Cập",
					required: true
				}),

				password: createInput({
					type: "password",
					id: "account.login.password",
					label: "Mật Khẩu",
					required: true
				}),

				autoLogin: createCheckbox({
					label: "tự động đăng nhập",
					value: false
				}),

				submitBtn: createButton("ĐĂNG NHẬP", {
					color: "blue",
					type: "submit",
					classes: "submit",
					style: "round",
					icon: "signin",
					complex: true
				}),

				forgotBtn: createButton("Quên Mật Khẩu", {
					color: "pink",
					classes: "forgot",
					style: "round",
					icon: "key",
					complex: true,
					disabled: true
				})
			});

			this.loginView.addEventListener("submit", () => {});
			this.loginView.action = "javascript:void(0);";
			this.loginView.dataset.active = "main";
			this.loginView.note.group.style.display = "none";
			this.loginView.addEventListener("submit", () => {
				this.login({
					username: this.loginView.username.input.value,
					password: this.loginView.password.input.value
				});
			});

			// Add event for autologin change to automatically
			// save value without submitting the form
			this.loginView.autoLogin.input.addEventListener("input", (e) => {
				localStorage.setItem("autoLogin.enabled", e.target.checked);
			});

			let autoLogin = localStorage.getItem("autoLogin.enabled");
			if (autoLogin === "true")
				this.loginView.autoLogin.input.checked = true;

			this.detailView = makeTree("div", "userDetailView", {
				label: { tag: "t", class: "label", text: "Đã Đăng Nhập" },

				userCard: { tag: "div", class: "userCard", child: {
					top: { tag: "div", class: "top", child: {
						avatar: new lazyload({
							source: "./assets/img/guest.png",
							classes: "avatar"
						}),

						info: { tag: "span", class: "info", child: {
							name: { tag: "t", class: "name", text: "Họ Tên" },
							studentID: { tag: "t", class: "id", text: "00A00000000" },
							email: { tag: "t", class: "email" }
						}}
					}},

					bottom: { tag: "span", class: "bottom", child: {
						birthday: { tag: "t", class: "birthday", title: "ngày sinh", text: "00/00/0000" },
						classroom: { tag: "t", class: "classroom", title: "lớp hành chính", text: "0000A00" }
					}}
				}},

				department: { tag: "div", class: ["infoCard", "department"], child: {
					label: { tag: "t", class: "label", text: "Ngành Học" },
					content: { tag: "t", class: ["value", "small"], text: "Không rõ" }
				}},

				tForm: { tag: "div", class: ["infoCard", "tForm"], child: {
					label: { tag: "t", class: "label", text: "Hình Thức Đào Tạo" },
					content: { tag: "t", class: ["value", "small"], text: "Không rõ" }
				}},

				signoutBtn: createButton("ĐĂNG XUẤT", {
					color: "blue",
					classes: "logout",
					style: "round",
					icon: "signout",
					complex: true
				})
			});

			let userCardBG = triBg(this.detailView.userCard, {
				color: "whitesmoke",
				scale: 5,
				speed: 64
			});

			set({ p: 30, d: `Attaching Listeners` });
			core.darkmode.onToggle((dark) => userCardBG.setColor(dark ? "dark" : "whitesmoke"));
			navbar.insert({ container }, "right");

			// Attach response handlers
			this.detailView.signoutBtn.addEventListener("click", () => this.logout());
			api.onResponse("global", (response) => this.check(response));
			api.onResponse("results", (response) => this.updateInfo(response));
			api.onResponse("services", (response) => this.updateEmail(response.info.email));

			set({ p: 50, d: `Đang Kiểm Tra Phiên Làm Việc` });
			await api.request();

			if (!this.loggedIn) {
				// This code will be executed if app started with
				// no session / session expired
				// Handle autologin here
				let username = localStorage.getItem("autoLogin.username");
				let password = localStorage.getItem("autoLogin.password");
				let enabled = localStorage.getItem("autoLogin.enabled");
	
				if (enabled === "true" && username && password) {
					this.log("DEBG", `Auto login enabled. Logging in to ${username}`);
					set({ p: 80, d: `Đang Tự Động Đăng Nhập Vào CTMS` });
					await this.login({ username, password });
				}
			}
		},

		onLogin(f) {
			if (typeof f !== "function")
				throw { code: -1, description: `core.account.onLogin(): not a valid function` }

			this.loginHandlers.push(f);
		},

		onLogout(f) {
			if (typeof f !== "function")
				throw { code: -1, description: `core.account.onLogout(): not a valid function` }

			this.logoutHandlers.push(f);
		},

		async check(response) {
			if (response.dom.getElementById("LeftCol_UserLogin1_pnlLogin")) {
				this.loggedIn = false;
				this.email = undefined;
				this.userInfo = undefined;
				
				this.nameNode.innerText = "Khách";
				this.avatarNode.src = this.detailView.userCard.top.avatar.src = "./assets/img/guest.png";
				this.detailView.userCard.top.info.email.innerText = "";
				this.navtip.set({ description: `nhấn để đăng nhập!` });
				this.background.setColor("darkRed");

				if (!this.subWindow.content || !this.subWindow.content.isSameNode(this.loginView)) {
					this.log("OKAY", "User Signed Out");
					this.subWindow.content = this.loginView;
					this.logoutHandlers.forEach(f => f());
				}

				let errMsg = response.dom.getElementById("LeftCol_UserLogin1_lblMess");
				if (errMsg && errMsg.innerText !== "") {
					this.loginView.note.group.style.display = null;
					this.loginView.note.set({ message: errMsg.innerText });
				} else
					this.loginView.note.group.style.display = "none";

				this.subWindow.loading = false;
			} else if (this.loggedIn === false) {
				this.log("OKAY", "User Signed In");
				this.loggedIn = true;

				let username = localStorage.getItem("session.username");
				if (username)
					this.updateEmail(username);

				this.subWindow.loading = true;
				this.subWindow.content = this.detailView;
				this.background.setColor("navyBlue");
				
				let promises = []
				this.loginHandlers.forEach(f => promises.push(f()));
				
				try {
					await Promise.all(promises);
				} catch(e) {
					errorHandler(e);
				}
				
				this.subWindow.loading = false;
			}
		},

		updateInfo(response) {
			this.userInfo = response.info;
			this.nameNode.innerText = response.info.name;
			this.detailView.userCard.top.info.name.innerText = response.info.name;
			this.detailView.userCard.top.info.studentID.innerText = response.info.studentID;
			this.detailView.userCard.bottom.birthday.innerText = response.info.birthday;
			this.detailView.userCard.bottom.classroom.innerText = response.info.classroom;
			this.detailView.department.content.innerText = response.info.department;
			this.detailView.tForm.content.innerText = response.info.tForm;
		},

		updateEmail(email) {
			// Check email to prevent avatar reloading
			if (email === this.email)
				return;

			this.avatarNode.src = this.detailView.userCard.top.avatar.src = `https://www.gravatar.com/avatar/${md5(email)}?s=160`;
			this.detailView.userCard.top.info.email.innerText = email;
			this.email = email;
		},

		async login({
			username,
			password
		} = {}) {
			if (!username || !password)
				throw { code: -1, description: `Cannot login with an empty username or password` }

			this.subWindow.loading = true;

			let autoLogin = this.loginView.autoLogin.input.checked;
			localStorage.setItem("autoLogin.enabled", autoLogin);

			if (autoLogin) {
				localStorage.setItem("autoLogin.username", username);
				localStorage.setItem("autoLogin.password", password);
			} else {
				localStorage.removeItem("autoLogin.username");
				localStorage.removeItem("autoLogin.password");
			}

			try {
				await api.login({ username, password });
				this.updateEmail(username);
			} catch(e) {
				let error = parseException(e);
				this.loginView.note.group.style.display = null;
				this.loginView.note.set({
					level: "error",
					message: `<pre class="break">${error.code} >>> ${error.description}</pre>`
				});

				if (autoLogin)
					errorHandler(e);

				this.subWindow.loading = false;
			}
		},

		async logout() {
			this.detailView.signoutBtn.disabled = true;
			this.subWindow.loading = true;

			try {
				await api.logout();
				await api.request();
			} catch(error) {
				errorHandler(error);
			}

			this.detailView.signoutBtn.disabled = false;
			this.subWindow.loading = false;
		},
	},

	screen: {
		container: $("#content"),
		priority: 3,

		init() {
			
		},

		home: {
			/** @type {CoreScreen} */
			screen: undefined,

			async init() {
				this.screen = new CoreScreen({
					id: "home",
					icon: "home",
					title: "trang chủ",
					description: "trang chủ của CTMS",
					applyScrollable: false
				});
			}
		},

		schedule: {
			/** @type {CoreScreen} */
			screen: undefined,

			view: null,
			loaded: false,
			autoChangeRenderer: true,
			defaultRenderMode: "table",
			listRenderTrigger: 700,
			haveCacheData: false,

			currentRenderer: "table",
			currentData: [],

			async init() {
				this.view = makeTree("div", "scheduleScreen", {
					control: { tag: "div", class: "control", child: {
						dateInput: createInput({
							type: "date",
							id: "schedule.date",
							label: "Ngày Bắt Đầu"
						}),

						confirm: createButton("XEM LỊCH", {
							icon: "calendarWeek",
							color: "brown",
							style: "round",
							complex: true,
							disabled: true
						})
					}},

					list: { tag: "div", class: ["list", "showEmpty"] }
				});

				this.screen = new CoreScreen({
					id: "schedule",
					icon: "calendarWeek",
					title: "lịch học",
					description: "xem lịch học trong tuần!",
					applyScrollable: false
				});

				this.screen.view.header.reload.style.display = "none";
				this.screen.content = this.view;
				this.setLoading(true);
				this.screen.onShow(() => this.load());
				new Scrollable(this.view, { content: this.view.list });

				this.view.control.confirm.addEventListener("click", () => this.load(this.getInputDate()));
				core.account.onLogin(async () => {
					if (this.screen.showing)
						this.load();
				});

				core.account.onLogout(() => {
					if (!this.haveCacheData)
						this.onLogout()
				});

				api.onResponse("schedule", (response) => {
					if (response.date)
						this.setInputNow(response.date);

					// Check schedule data is current week or next week, first response
					// always return current week data, so we can use this.loaded to
					// determine is current data is from first request.
					if (!this.loaded) {
						this.log("INFO", `Updating schedule cache for`, {
							text: core.account.userInfo.name,
							color: oscColor("blue")
						});

						// Update schedule cache
						localStorage.setItem("cache.schedule", JSON.stringify({
							name: core.account.userInfo.name,
							date: response.date,
							stored: new Date(),
							info: response.info
						}));
					}

					
					this.loaded = true;
					this.render(response.info);
				});

				// Event listener to update current render mode
				window.addEventListener("resize", () => {
					if (!this.autoChangeRenderer)
						return;

					this.render();
				});

				let cacheRaw = localStorage.getItem("cache.schedule");
				if (cacheRaw) {
					try {
						/** @type {Object} */
						let cache = JSON.parse(cacheRaw);
						this.haveCacheData = true;
	
						// Convert date string back to date object
						cache.stored = new Date(cache.stored);
						cache.date = new Date(cache.date);
	
						for (let item of cache.info) {
							item.date = new Date(item.date);
	
							for (let row of item.rows) {
								row.date[0] = new Date(row.date[0]);
								row.date[1] = new Date(row.date[1]);
							}
						}
	
						this.render(cache.info);
	
						// Render notice for user
						let note = createNote({
							level: "warning",
							style: "round",
							message: `
								Đây là dữ liệu lịch học của tuần từ ngày
								<b>${cache.date.getDate()}/${cache.date.getMonth() + 1}/${cache.date.getFullYear()}</b>
								của tài khoản <b>${cache.name}</b>.<br>
								Thông tin được lưu vào lúc <b>${humanReadableTime(cache.stored)}</b>, do vậy nó có thể không chính xác!<br>
							`
						});
	
						note.group.style.marginBottom = "30px";
						this.view.list.insertBefore(note.group, this.view.list.firstChild);
						this.view.control.confirm.disabled = true;
						this.screen.overlay({ show: false });
	
						// Switch to button loading indicator because we have just
						// hided the screen loading overlay
						this.setLoading(true);
					} catch(e) {
						this.log("WARN", "Loading cache data failed! Ignoring cache for now...", e);
					}
				}

				this.setInputNow();
				this.screen.show();
			},

			reset() {
				this.loaded = false;
				emptyNode(this.view.list);
				this.setInputNow();
			},

			setLoading(loading = false) {
				if (this.screen.overlayShowing) {
					this.screen.loading = loading;
					this.view.control.confirm.loading(false);
				} else {
					this.screen.loading = false;
					this.view.control.confirm.loading(loading);
				}
			},

			onLogout() {
				this.reset();
				this.view.control.confirm.disabled = true;
				this.screen.overlay({
					icon: "exclamation",
					title: "Yêu Cầu Đăng Nhập",
					description: `Bạn phải đăng nhập vào CTMS trước khi xem nội dung này!`,
					buttons: {
						login: { text: "ĐĂNG NHẬP", icon: "signin", onClick: () => core.account.clickable.active = true }
					}
				});

				this.setLoading(false);
			},

			/**
			 * @param {Date} date 
			 * @returns
			 */
			async load(date) {
				if (!core.account.loggedIn) {
					if (!this.haveCacheData)
						this.onLogout();
					
					return;
				}

				try {
					if (!this.loaded) {
						this.haveCacheData = false;
						this.setLoading(true);
						this.screen.overlay({ show: false });
						await api.schedule();
						this.view.control.confirm.disabled = false;
						this.setLoading(false);
					} else {
						if (date) {
							this.setLoading(true);
							await api.schedule(date);
							this.setLoading(false);
						}
					}
				} catch(e) {
					let error = parseException(e);

					this.reset();
					this.view.control.confirm.disabled = true;
					this.screen.overlay({
						icon: "bomb",
						title: "Toang Rồi Ông Giáo Ạ!",
						description: `<pre class="break">[${error.code}] >>> ${error.description}</pre>`,
						buttons: {
							login: { text: "THỬ LẠI", color: "pink", icon: "reload", onClick: () => this.load() }
						}
					});

					this.setLoading(false);
				}
			},

			setInputNow(date = new Date()) {
				setDateTimeValue(this.view.control.dateInput.input, null, time(date));
			},

			getInputDate() {
				return new Date(this.view.control.dateInput.input.value);
			},

			setAutoChangeRenderer(enabled) {
				this.autoChangeRenderer = enabled;

				if (this.initialized)
					this.render();
			},

			setDefaultRenderMode(mode) {
				this.defaultRenderMode = mode;

				if (this.initialized && !this.autoChangeRenderer)
					this.render();
			},

			/**
			 * Render schedule handler
			 * @param 	{Array}		data
			 */
			render(data) {
				let renderer = this.defaultRenderMode;
				let newData = false;

				if (typeof data === "object" && typeof data.length === "number") {
					newData = true;
					this.currentData = data;
				} else
					data = this.currentData;

				if (this.autoChangeRenderer) {
					if (window.innerWidth <= this.listRenderTrigger)
						renderer = "list";
					else
						renderer = "table";
				}

				// Only re-render when render mode changed or we have
				// updated data to render
				if (this.currentRenderer !== renderer || newData) {
					this.log("DEBG", `render(${renderer}): re-rendering`);

					if (renderer === "table")
						this.renderTable(data);
					else
						this.renderList(data);

					this.currentRenderer = renderer;
				}
			},

			renderTable(data) {
				emptyNode(this.view.list);
				let today = new Date();
				let foundNextDay = false;

				let table = makeTree("table", "generalTable", {
					thead: { tag: "thead", child: {
						row: { tag: "tr", child: {
							state: { tag: "th" },
							stt: { tag: "th", class: "right", text: "Thứ Tự" },
							status: { tag: "th" },
							subject: { tag: "th", text: "Môn Học" },
							classroom: { tag: "th", text: "Lớp Học" },
							time: { tag: "th", class: "bold", text: "Giờ" },
							teacher: { tag: "th", text: "Giảng Viên" },
							classID: { tag: "th", class: "right", text: "Mã Lớp" },
							listID: { tag: "th", class: "right", text: "Mã DS Thi" },
						}}
					}},

					tbody: { tag: "tbody" }
				});

				for (let { time, date, dateString, weekDay, rows = [] } of data) {
					let isItemToday = false;
					let tags = {}
		
					// Is date today?
					if (isToday(date, today)) {
						tags.today = { tag: "span", class: ["generalTag", "today"], text: "Hôm Nay" }
						isItemToday = true;
					} else if (!foundNextDay && date > today) {
						tags.next = { tag: "span", class: ["generalTag", "next"], text: "Sắp Tới" }
						foundNextDay = true;
					}

					let header = makeTree("tr", "header", {
						state: { tag: "td", class: "state" },
						label: { tag: "td", class: "label", colSpan: 8, child: {
							wrapper: { tag: "span", class: "wrapper", child: {
								inner: { tag: "t", class: "inner", html: `<b>${weekDay}</b> ${dateString}` },
								tags: { tag: "span", class: "tags", child: tags }
							}}
						}},
					});

					if (isItemToday)
						header.classList.add("today");
					else if (date < today)
						header.classList.add("passed");

					table.tbody.appendChild(header);
					let nth = 0;

					for (let row of rows) {
						nth++;

						let tableRow = makeTree("tr", ["row", (nth % 2 === 0) ? "even" : "odd"], {
							state: { tag: "td", class: "state" },
							stt: { tag: "td", class: ["right", "bold"], text: nth },
	
							status: { tag: "td", class: "status", child: {
								inner: { tag: "span", class: "generalTag", data: { status: row.status }, text: row.status }
							}},
	
							subject: { tag: "td", text: row.subject },
							classroom: { tag: "td", text: row.classroom },
							time: { tag: "td", class: "bold", html: `${row.time[0]}<arr></arr>${row.time[1]}` },
							teacher: { tag: "td", text: row.teacher },
							classID: { tag: "td", class: ["bold", "right"], text: row.classID },
							listID: { tag: "td", class: ["bold", "right"], text: row.listID }
						});
	
						if (today > row.date[1]) {
							tableRow.classList.add("passed");
							tableRow.state.dataset.tip = "đã học xong";
						} else if (today > row.date[0]) {
							tableRow.classList.add("inProgress");
							tableRow.state.dataset.tip = "đang học";
						}

						if (typeof row.noteID === "number") {
							let note = document.createElement("icon");
							note.classList.add("openNote");
							note.dataset.icon = "note";
							note.dataset.id = row.noteID;
							note.title = `Xem Ghi Chú ${row.noteID}`;
							note.addEventListener("click", () => this.viewNote(row.noteID));
	
							tableRow.subject.appendChild(note);
						}
	
						table.tbody.appendChild(tableRow);
					}
				}

				this.view.list.appendChild(table);
			},

			renderList(data) {
				emptyNode(this.view.list);
				let today = new Date();
				let foundNextDay = false;

				for (let { time, date, dateString, weekDay, rows = [] } of data) {
					let isItemToday = false;
					let tags = {}
		
					// Is date today?
					if (isToday(date, today)) {
						tags.today = { tag: "span", class: ["generalTag", "today"], text: "Hôm Nay" }
						isItemToday = true;
					} else if (!foundNextDay && date > today) {
						tags.next = { tag: "span", class: ["generalTag", "next"], text: "Sắp Tới" }
						foundNextDay = true;
					}

					let group = makeTree("div", "listItem", {
						label: { tag: "div", class: "label", child: {
							inner: { tag: "t", class: "inner", html: `<b>${weekDay}</b> ${dateString}` },
							tags: { tag: "span", class: "tags", child: tags }
						}},
		
						items: { tag: "div", class: "items" }
					});

					if (isItemToday)
						group.classList.add("today");
					else if (date < today)
						group.classList.add("passed");

					for (let row of rows) {
						let item = makeTree("div", "item", {
							gradient: { tag: "div", class: "gradient", data: { status: row.status } },

							top: { tag: "div", class: "top", child: {
								tag: { tag: "span", class: ["generalTag", "status"], data: { status: row.status }, text: row.status },
								classroom: { tag: "t", class: "classroom", text: row.classroom },
								time: { tag: "t", class: "time", html: `${row.time[0]}<arr></arr>${row.time[1]}` },
							}},
		
							subject: { tag: "span", class: "subject", child: {
								inner: { tag: "t", class: "inner", text: row.subject }
							}},
		
							teacher: { tag: "t", class: "teacher", text: row.teacher },
		
							bottom: { tag: "div", class: "bottom", child: {
								classID: { tag: "t", class: "classID", text: row.classID },
								separator: { tag: "span" },
								listID: { tag: "t", class: "listID", text: row.listID }
							}}
						});

						if (today > row.date[1])
							item.classList.add("passed");
						else if (today > row.date[0])
							item.classList.add("inProgress");
		
						if (typeof row.noteID === "number") {
							let note = document.createElement("icon");
							note.classList.add("openNote");
							note.dataset.icon = "note";
							note.dataset.id = row.noteID;
							note.title = `Xem Ghi Chú ${row.noteID}`;
							note.addEventListener("click", () => this.viewNote(row.noteID));
		
							item.subject.appendChild(note);
						}
		
						group.items.appendChild(item);
					}
		
					this.view.list.appendChild(group);
				}
			},

			async viewNote(id) {
				this.screen.loading = true;
				let response;

				try {
					response = await api.getNote(id);
				} catch(e) {
					errorHandler(e);
					this.screen.loading = false;
					return;
				}

				this.screen.loading = false;
				let noteContent = document.createElement("div");
				noteContent.classList.add("scheduleNoteContent");
				noteContent.innerHTML = response.data.content;

				await popup.show({
					windowTitle: `Note ${id}`,
					title: "Ghi Chú",
					icon: "note",
					message: "",
					description: "",
					customNode: noteContent,
					buttonList: {
						close: { text: "Đóng" }
					}
				});
			}
		},

		tests: {
			/** @type {CoreScreen} */
			screen: null,

			view: null,
			loaded: false,
			loading: false,

			init() {
				this.view = makeTree("div", "testsScreen", {
					table: { tag: "table", class: "generalTable", child: {
						thead: { tag: "thead", child: {
							row: { tag: "tr", child: {
								status: { tag: "th", class: "right" },
								time: { tag: "th", class: "right", text: "Thời Gian" },
								date: { tag: "th", text: "Ngày" },
								classroom: { tag: "th", class: "right", text: "Phòng" },
								subject: { tag: "th", text: "Môn Thi" },
								listID: { tag: "th", class: "right", text: "Mã DS" } 
							}}
						}},
	
						tbody: { tag: "tbody" }
					}}
				});

				this.screen = new CoreScreen({
					id: "tests",
					icon: "pencil",
					title: "lịch thi",
					description: "theo dõi lịch thi của bạn!",
					subTitle: `Lịch thi có thể bị thay đổi, bạn nên kiểm tra lại trước ngày thi`,
					applyScrollable: false
				});

				this.screen.content = this.view;
				new Scrollable(this.view, { content: this.view.table });

				this.onLogout();
				this.screen.loading = true;
				core.account.onLogout(() => this.onLogout());
				this.screen.onReload(async () => await this.load());

				core.account.onLogin(async () => {
					if (this.loaded || !this.screen.showing)
						return;

					await this.load();
				});

				this.screen.onShow(async () => {
					if (this.loaded)
						return;

					await this.load();
				});

				api.onResponse("tests", (response) => {
					if (!this.loaded)
						this.screen.overlay({ show: false });

					this.loaded = true;
					emptyNode(this.view.table.tbody);

					for (let item of response.list)
						this.addListItem(item);

					this.screen.loading = false;
				});
			},

			reset() {
				this.loading = false;
				this.loaded = false;
				emptyNode(this.view.table.tbody);
			},

			onLogout() {
				this.reset();
				this.screen.overlay({
					icon: "exclamation",
					title: "Yêu Cầu Đăng Nhập",
					description: `Bạn phải đăng nhập vào CTMS trước khi xem nội dung này!`,
					buttons: {
						login: { text: "ĐĂNG NHẬP", icon: "signin", onClick: () => core.account.clickable.active = true }
					}
				});

				this.screen.loading = false;
			},

			async load() {
				if (!core.account.loggedIn) {
					this.onLogout();
					return false;
				}

				if (this.loading)
					return false;

				try {
					this.loading = true;
					this.screen.loading = true;
	
					await api.tests();
	
					this.loading = false;
					this.screen.loading = false;
				} catch(e) {
					let error = parseException(e);

					this.reset();
					this.screen.overlay({
						icon: "bomb",
						title: "Toang Rồi Ông Giáo Ạ!",
						description: `<pre class="break">[${error.code}] >>> ${error.description}</pre>`,
						buttons: {
							login: { text: "THỬ LẠI", color: "pink", icon: "reload", onClick: () => this.load() }
						}
					});

					this.screen.loading = false;
				}
			},

			addListItem({
				status,
				time,
				classroom,
				subject,
				listID
			} = {}) {
				let hours = time.getHours();
				let dDays = daysBetween(time, new Date());
				let dow = time.getDay() + 1;
				dow = (dow === 1) ? "CN" : `T${dow}`;

				let row = makeTree("tr", "item", {
					status: { tag: "td", class: "right", child: {
						inner: {
							tag: "span",
							class: ["generalTag", "status"],
							data: { status },
							text: { ended: "Đã Thi", coming: "Chưa Thi" }[status]
						}
					}},

					time: { tag: "td", class: ["right", "bold"], child: {
						value: {
							tag: "span",
							class: "value",
							text: `${pleft((hours > 12) ? (hours - 12) : hours, 2)}:${pleft(time.getMinutes(), 2)}`
						},

						phase: {
							tag: "span",
							class: ["generalTag", "phase"],
							data: { phase: (hours >= 12) ? "pm" : "am" }
						}
					}},

					date: {
						tag: "td",
						html: `<b>${dow}</b> ${pleft(time.getDate(), 2)}/${pleft(time.getMonth() + 1, 2)}/${time.getFullYear()} <b>(${dDays > 0 ? "+" : ""}${round(dDays, 1)})</b>`
					},

					classroom: { tag: "td", class: ["right", "bold"], text: classroom },
					subject: { tag: "td", text: subject },
					listID: { tag: "td", class: "right", text: listID }
				});

				this.view.table.tbody.appendChild(row);
			}
		},

		subscribe: {
			/** @type {CoreScreen} */
			screen: null,

			view: null,
			loaded: false,
			loading: false,
			itemList: {},

			init() {
				this.view = makeTree("div", "subscribeScreen", {
					waitingLabel: { tag: "t", class: ["label", "waiting"], text: "Có Thể Đăng Kí" },
					waiting: { tag: "div", class: ["content", "showEmpty", "waiting"] },

					subscribedLabel: { tag: "t", class: ["label", "subscribed"], text: "Đã Đăng Kí" },
					subscribed: { tag: "div", class: ["content", "showEmpty", "subscribed"] }
				});

				this.screen = new CoreScreen({
					id: "subscribe",
					icon: "play",
					title: "đăng kí lớp",
					description: "đăng kí lớp tín chỉ!"
				});

				this.screen.content = this.view;

				this.onLogout();
				this.screen.loading = true;
				core.account.onLogout(() => this.onLogout());
				this.screen.onReload(async () => await this.load());

				core.account.onLogin(async () => {
					if (this.loaded || !this.screen.showing)
						return;

					await this.load();
				});

				this.screen.onShow(async () => {
					if (this.loaded)
						return;

					await this.load();
				});

				api.onResponse("subscribe", (response) => {
					if (!this.loaded)
						this.screen.overlay({ show: false });

					this.loaded = true;

					if (typeof response.waiting === "object" && response.waiting) {
						emptyNode(this.view.waiting);

						for (let item of response.waiting)
							this.processListItem({ type: "waiting", ...item });
					}

					if (typeof response.subscribed === "object" && response.subscribed) {
						emptyNode(this.view.subscribed);

						for (let item of response.subscribed)
							this.processListItem({ type: "subscribed", ...item });
					}

					this.screen.loading = false;
				});
			},

			reset() {
				this.loading = false;
				this.loaded = false;
				this.itemList = {};
				emptyNode(this.view.waiting);
				emptyNode(this.view.subscribed);
			},

			onLogout() {
				this.reset();
				this.screen.overlay({
					icon: "exclamation",
					title: "Yêu Cầu Đăng Nhập",
					description: `Bạn phải đăng nhập vào CTMS trước khi xem nội dung này!`,
					buttons: {
						login: { text: "ĐĂNG NHẬP", icon: "signin", onClick: () => core.account.clickable.active = true }
					}
				});

				this.screen.loading = false;
			},

			async load() {
				if (!core.account.loggedIn) {
					this.onLogout();
					return false;
				}

				if (this.loading)
					return false;

				try {
					this.loading = true;
					this.screen.loading = true;
	
					await api.subscribe();
	
					this.loading = false;
					this.screen.loading = false;
				} catch(e) {
					let error = parseException(e);

					this.reset();
					this.screen.overlay({
						icon: "bomb",
						title: "Toang Rồi Ông Giáo Ạ!",
						description: `<pre class="break">[${error.code}] >>> ${error.description}</pre>`,
						buttons: {
							login: { text: "THỬ LẠI", color: "pink", icon: "reload", onClick: () => this.load() }
						}
					});

					this.screen.loading = false;
				}
			},

			processListItem({
				type = "waiting",
				expired,
				isFull,
				classID,
				subject,
				teacher,
				credits,
				tuition,
				minimum,
				maximum,
				subscribed,
				schedule = [],
				classroom = [],
				action = {
					command: undefined,
					classID: undefined,
				},
				date = {
					/** @type {Date} */
					start: undefined,
					
					/** @type {Date} */
					end: undefined,
					
					/** @type {Date} */
					cancel: undefined
				}
			} = {}) {
				if (!this.itemList[classID]) {
					this.itemList[classID] = makeTree("div", "item", {
						details: { tag: "div", class: "details", child: {
							left: { tag: "span", class: "left", child: {
								subject: { tag: "t", class: "subject", text: subject },
								teacher: { tag: "t", class: "teacher", text: teacher },
								status: { tag: "div", class: "status", child: {
									expired: { tag: "span", class: ["generalTag", "expired"], text: "Hết Hạn ĐK" },
									noCancel: { tag: "span", class: ["generalTag", "noCancel"], text: "Hết Hạn Hủy" },
									full: { tag: "span", class: ["generalTag", "full"], text: "Hết Chỉ Tiêu" },
									notEnough: { tag: "span", class: ["generalTag", "notEnough"], text: "Chưa Đạt Chỉ Tiêu" }
								}}
							}},

							right: { tag: "span", class: "right", child: {
								top: { tag: "div", class: "top", child: {
									subscribed: { tag: "span", class: "subscribed", child: {
										label: { tag: "t", class: "label", text: "Đã Đăng Kí" },
										value: { tag: "t", class: "value", text: "---" }
									}},

									minimum: { tag: "span", class: "minimum", child: {
										label: { tag: "t", class: "label", text: "Tối Thiểu" },
										value: { tag: "t", class: "value", text: "---" }
									}},

									classroom: { tag: "span", class: "minimum", child: {
										label: { tag: "t", class: "label", text: "Lớp Học" },
										value: { tag: "t", class: "value", text: "---" }
									}},

									credits: { tag: "span", class: "credits", child: {
										label: { tag: "t", class: "label", text: "Số Tín Chỉ" },
										value: { tag: "t", class: "value", text: "---" }
									}},
								}},

								bottom: { tag: "div", class: "bottom", child: {
									startDate: { tag: "span", class: "startDate", child: {
										label: { tag: "t", class: "label", text: "Mở Đăng Kí" },
										value: { tag: "t", class: "value", text: "---" }
									}},

									endDate: { tag: "span", class: "endDate", child: {
										label: { tag: "t", class: "label", text: "Đóng Đăng Kí" },
										value: { tag: "t", class: "value", text: "---" }
									}},

									cancel: { tag: "span", class: "cancel", child: {
										label: { tag: "t", class: "label", text: "Hủy Trước" },
										value: { tag: "t", class: "value", text: "---" }
									}}
								}}
							}}
						}},

						actions: { tag: "div", class: "actions", child: {
							left: { tag: "span", class: "left", child: {
								tuition: { tag: "span", class: "tuition", child: {
									label: { tag: "t", class: "label", text: "Học Phí" },
									value: { tag: "t", class: "value", text: "---" }
								}}
							}},

							right: { tag: "span", class: "right", child: {
								toggle: createButton("TOGGLE BUTTON", {
									style: "round",
									icon: "circle",
									complex: true,
									triangleCount: 2
								}),

								schedule: createButton(undefined, {
									style: "round",
									icon: "table",
									complex: true,
									triangleCount: 2
								}),
							}}
						}}
					});

					this.itemList[classID].actions.right.schedule.addEventListener("click", () => {
						popup.show({
							windowTitle: `Lịch Học ${classID}`,
							title: "Lịch Học",
							message: subject,
							description: "<ul>" + schedule
								.map(i => `<li>${i}</li>`)
								.join("") + "</ul>",
							icon: "table"
						});
					});

					this.itemList[classID].actions.right.toggle.addEventListener("click", async () => {
						let action = this.itemList[classID].action;

						if (!action.command || !action.classID) {
							clog("WARN", "core.screen.subscribe(): undefined command or classID");
							return;
						}

						let response;
						switch (action.command) {
							case "subscribe":
								response = await popup.show({
									windowTitle: `Đăng Kí ${classID}`,
									title: "Đăng Kí",
									message: subject,
									icon: "signin",
									bgColor: "darkBlue",
									description: `Bạn có chắc muốn đăng kí lớp tín chỉ này không?`,
									buttonList: {
										confirm: { text: "XÁC NHẬN", color: "green" },
										cancel: { text: "Hủy", color: "red" }
									}
								});
								break;

							case "unsubscribe":
								response = await popup.show({
									windowTitle: `Hủy Đăng Kí ${classID}`,
									title: "Hủy Đăng Kí",
									message: subject,
									icon: "signout",
									bgColor: "red",
									description: `Bạn có chắc muốn hủy đăng kí lớp tín chỉ này không?`,
									buttonList: {
										confirm: { text: "XÁC NHẬN", color: "red" },
										cancel: { text: "Hủy", color: "blue" }
									}
								});
								break;
						
							default:
								break;
						}

						if (response !== "confirm") {
							clog("DEBG", `core.screen.subscribe(): user cancelled ${action.command}:${action.classID}`);
							return;
						}

						this.itemList[classID].actions.right.toggle.loading(true);

						try {
							await api.subscribe({ action: action.command, classID: action.classID });
						} catch(e) {
							errorHandler(e);
						}

						this.itemList[classID].actions.right.toggle.loading(false);

						try {
							await api.subscribe({ action: "subscribed" });
						} catch(e) {
							errorHandler(e);
						}
					});
				}

				this.itemList[classID].action = action;
				let item = this.itemList[classID];

				item.details.right.top.subscribed.value.innerText = `${subscribed}/${maximum}`;
				item.details.right.top.minimum.value.innerText = minimum;
				item.details.right.top.classroom.value.innerText = classroom.join(", ");
				item.details.right.top.credits.value.innerText = credits;
				item.details.right.bottom.startDate.value.innerText = humanReadableTime(date.start);
				item.details.right.bottom.endDate.value.innerText = humanReadableTime(date.end);
				
				if (date.cancel) {
					item.details.right.bottom.cancel.style.display = null;
					item.details.right.bottom.cancel.value.innerText = humanReadableTime(date.cancel);
				} else {
					item.details.right.bottom.cancel.style.display = "none";
				}

				if (typeof tuition === "number") {
					item.actions.left.tuition.style.display = null;
					item.actions.left.tuition.value.innerText = Intl.NumberFormat("vi-VN").format(tuition * credits);
				} else {
					item.actions.left.tuition.style.display = "none";
				}

				item.details.left.status.expired.style.display = expired ? null : "none";
				item.details.left.status.full.style.display = isFull ? null : "none";
				item.details.left.status.notEnough.style.display = (subscribed < minimum) ? null : "none";

				if (date.cancel && time() > (date.cancel.getTime() / 1000))
					item.details.left.status.noCancel.style.display = null;
				else
					item.details.left.status.noCancel.style.display = "none";

				switch (type) {
					case "waiting":
						item.actions.right.toggle.changeText("ĐĂNG KÍ");
						item.actions.right.toggle.dataset.triColor = "green";
						item.actions.right.toggle.querySelector(":scope > icon")
							.dataset.icon = "signin";
						break;
				
					case "subscribed":
						item.actions.right.toggle.changeText("HỦY ĐĂNG KÍ");
						item.actions.right.toggle.dataset.triColor = "red";
						item.actions.right.toggle.querySelector(":scope > icon")
							.dataset.icon = "signout";
						break;
				}

				item.actions.right.toggle.disabled = !(action && action.command && action.classID);
				
				if (type === "waiting" && !this.view.waiting.contains(item))
					this.view.waiting.appendChild(item);

				if (type === "subscribed" && !this.view.subscribed.contains(item))
					this.view.subscribed.appendChild(item);
			}
		},

		results: {
			/** @type {CoreScreen} */
			screen: null,

			view: null,
			loaded: false,

			async init() {
				this.view = makeTree("div", "resultsScreen", {
					info: { tag: "div", class: "info", child: {
						cpa: { tag: "span", class: ["item", "infoCard"], child: {
							label: { tag: "t", class: "label", text: "Điểm TBC Tích Lũy" },
							value: { tag: "t", class: "value", text: "---" },
							tip: { tag: "tip", title: "<div><b>Điểm Trung Bình Chung Tích Lũy</b><br>Điểm được tính trên đây có thể không hoàn toàn chính xác 100% do trọng số của mỗi môn sẽ khác nhau</div>" }
						}},

						grade: { tag: "span", class: ["item", "infoCard"], child: {
							label: { tag: "t", class: "label", text: "Xếp Loại" },
							value: { tag: "t", class: "value", text: "---" }
						}},
					}},

					table: { tag: "table", class: "generalTable", child: {
						thead: { tag: "thead", child: {
							row: { tag: "tr", child: {
								stt: { tag: "th", class: "right", text: "Thứ Tự" },
								subject: { tag: "th", text: "Môn Học" },
								credits: { tag: "th", class: "right", text: "Số Tín Chỉ" },
								classroom: { tag: "th", class: "right", text: "Mã Lớp" },
								teacher: { tag: "th", text: "Giảng Viên" },
								
								diemCC: { tag: "th", class: "right", child: {
									content: { tag: "span", text: "Điểm CC" },
									tip: { tag: "tip", title: "Điểm Chuyên Cần (weighted 10%)" }
								}},
	
								diemDK: { tag: "th", class: "right", child: {
									content: { tag: "span", text: "Điểm ĐK" },
									tip: { tag: "tip", title: "Điểm Điều Kiện (weighted 20%)" }
								}},
	
								diemHK: { tag: "th", class: "right", child: {
									content: { tag: "span", text: "Điểm HK" },
									tip: { tag: "tip", title: "Điểm Học Kì (weighted 70%)" }
								}},
	
								average: { tag: "th", class: "right", child: {
									content: { tag: "span", text: "TB10" },
									tip: { tag: "tip", title: "Điểm Trung Bình Hệ Số 10" }
								}},
	
								gradePoint: { tag: "th", class: "right", child: {
									content: { tag: "span", text: "TB4" },
									tip: { tag: "tip", title: "Điểm Trung Bình Hệ Số 4" }
								}},
	
								gradeLetter: { tag: "th", class: "right" }
							}}
						}},
	
						tbody: { tag: "tbody" }
					}}
				});

				this.screen = new CoreScreen({
					id: "results",
					icon: "poll",
					title: "kết quả học tập",
					description: "xem toàn bộ kết quả học tập của các môn!",
					applyScrollable: false
				});

				this.screen.content = this.view;
				new Scrollable(this.view, { content: this.view.table });

				this.onLogout();
				this.screen.loading = true;

				core.account.onLogout(() => this.onLogout());
				this.screen.onReload(async () => await this.load());

				this.screen.onShow(async () => {
					if (this.loaded)
						return;

					await this.load();
				});

				core.account.onLogin(async () => {
					let resultCache = localStorage.getItem("cache.account");
					let needUpdate = true;

					if (resultCache) {
						/** @type {Object} */
						resultCache = JSON.parse(resultCache);
	
						// Check cache validity, if current logged in user data
						// has been cached, we don't need to fetch this api anymore.
						if (resultCache.email === core.account.email) {
							this.log("INFO", "Account data has been cached, we don't need to fetch it again.");
							core.account.updateInfo({ info: resultCache });
							this.screen.loading = false;
							needUpdate = false;
						}
					}

					if (needUpdate)
						await this.load();
				});

				api.onResponse("results", (response) => {
					if (!this.loaded)
						this.screen.overlay({ show: false });
	
					// Cache user info for applying in the future
					localStorage.setItem("cache.account", JSON.stringify({
						email: core.account.email,
						name: response.info.name,
						studentID: response.info.studentID,
						birthday: response.info.birthday,
						classroom: response.info.classroom,
						department: response.info.department,
						tForm: response.info.tForm,
					}));

					this.loaded = true;
					emptyNode(this.view.table.tbody);
					this.screen.set({ subTitle: response.info.mode });

					this.view.info.cpa.value.innerText = response.info.cpa.toFixed(3);
					this.view.info.grade.value.innerText = response.info.grade;

					for (let item of response.info.results)
						this.addListItem(item);

					this.screen.loading = false;
				});
			},

			reset() {
				this.loaded = false;
				emptyNode(this.view.table.tbody);
				this.view.info.cpa.value.innerText = "---";
				this.view.info.grade.value.innerText = "---";
				this.screen.set({ subTitle: "" });
			},

			onLogout() {
				this.reset();
				this.screen.overlay({
					icon: "exclamation",
					title: "Yêu Cầu Đăng Nhập",
					description: `Bạn phải đăng nhập vào CTMS trước khi xem nội dung này!`,
					buttons: {
						login: { text: "ĐĂNG NHẬP", icon: "signin", onClick: () => core.account.clickable.active = true }
					}
				});

				this.screen.loading = false;
			},

			async load() {
				if (!core.account.loggedIn) {
					this.onLogout();
					return;
				}

				try {
					this.screen.loading = true;
					await api.results();
					this.screen.loading = false;
				} catch(e) {
					let error = parseException(e);

					this.reset();
					this.screen.overlay({
						icon: "bomb",
						title: "Toang Rồi Ông Giáo Ạ!",
						description: `<pre class="break">[${error.code}] >>> ${error.description}</pre>`,
						buttons: {
							login: { text: "THỬ LẠI", color: "pink", icon: "reload", onClick: () => this.load() }
						}
					});

					this.screen.loading = false;
				}
			},

			addListItem({
				subject,
				credits,
				classID,
				teacher,
				diemCC,
				diemDK,
				diemHK,
				average,
				grade
			} = {}) {
				let row = makeTree("tr", "item", {
					stt: { tag: "td", class: ["bold", "right"] },
					subject: { tag: "td", text: subject },
					credits: { tag: "td", class: "right", text: credits },
					classID: { tag: "td", class: ["bold", "right"], text: classID },
					teacher: { tag: "td", text: teacher },

					diemCC: {
						tag: "td",
						class: "right",
						html: (typeof diemCC === "number")
							? diemCC.toFixed(2)
							: ((diemCC === "?")
								? `<span title="Chưa Xác Nhận">?</span>`
								: "")
					},

					diemDK: {
						tag: "td",
						class: "right",
						html: (typeof diemDK === "number")
							? diemDK.toFixed(2)
							: ((diemDK === "?")
								? `<span title="Chưa Xác Nhận">?</span>`
								: "")
					},

					diemHK: {
						tag: "td",
						class: "right",
						html: (typeof diemHK === "number")
							? diemHK.toFixed(2)
							: ((diemHK === "?")
								? `<span title="Chưa Xác Nhận">?</span>`
								: "")
					},

					average: { tag: "td", class: ["right", "bold"], text: average ? average.toFixed(2) : "" },
					gradePoint: { tag: "td", class: ["right", "bold"], text: grade ? grade.point.toFixed(2) : "" },

					gradeLetter: { tag: "td", class: "right", child: {
						inner: {
							tag: "span",
							class: "generalTag",
							data: { grade: grade ? grade.letter : "?" },
							text: grade ? grade.letter : "?" }
						}
					},
				});

				this.view.table.tbody.appendChild(row);
			}
		},
	}
}