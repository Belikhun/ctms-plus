//? |-----------------------------------------------------------------------------------------------|
//? |  /static/js/core.js                                                                           |
//? |                                                                                               |
//? |  Copyright (c) 2021 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

var APPNAME = "CTMS+";
var VERSION = "0.1";
var STATE = "local";
var DEBUG = true;

/**
 * Screen class, used to construct new screen
 * 
 * @author		Belikhun
 * @version		1.0
 */
class CoreScreen {
	/**
	 * Create a new Screen
	 * @param	{Object}				options
	 * @param	{String}				options.id				Screen ID
	 * @param	{String}				options.icon			Icon name
	 * @param	{String|HTMLElement}	options.title			Title
	 * @param	{String}				options.description		Description for menu icon
	 * @param	{String}				options.subTitle		Subtitle, will display under title
	 * @param	{Boolean}				options.applyScrollable	Automatically apply scrollable for content
	 */
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

				buttons: { tag: "span", class: "buttons", child: {

					reload: createButton("TẢI LẠI", {
						style: "round",
						icon: "reload",
						complex: true
					})
				}}
			}},

			content: { tag: "div", class: "content" }
		});

		if (applyScrollable)
			new Scrollable(this.view, { content: this.view.content });

		this.view.header.buttons.reload.style.display = "none";
		this.view.header.buttons.reload.addEventListener("click", async () => {
			this.view.header.buttons.reload.loading(true);

			try {
				for (let f of this.reloadHandlers)
					await f();
			} catch(error) {
				errorHandler(error);
			}

			this.view.header.buttons.reload.loading(false);
		});

		this.view.overlay.style.display = "none";
		this.button.click.setHandler((a) => a ? this.__show() : this.__hide());
	}

	show() {
		this.button.click.active = true;
	}

	async __show() {
		this.showing = true;
		
		if (core.activeScreen)
			core.activeScreen.hide();

		// Wait for screen to actually clear.
		await delayAsync();

		core.screen.container.appendChild(this.view);
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
		core.screen.container.removeChild(this.view);
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

		// Show the reload button because we know
		// it's in use now.
		this.view.header.buttons.reload.style.display = null;
		this.reloadHandlers.push(f);
	}

	/**
	 * Add a new button on the header. The button will be appended on the left
	 * side of other buttons.
	 * 
	 * @param		{HTMLButtonElement}		button
	 */
	addButton(button) {
		if (typeof button !== "object" || !button.tagName)
			throw { code: -1, description: `CoreScreen(${this.id}).addButton(): not a valid node` }

		this.view.header.buttons.insertBefore(button, this.view.header.buttons.firstChild);
	}

	/**
	 * Update Screen Info
	 * @param	{Object}				info				General info
	 * @param	{String}				info.icon			Icon name
	 * @param	{String|HTMLElement}	info.title			Title
	 * @param	{String}				info.subTitle		Subtitle, will display under title
	 */
	set({
		icon,
		title,
		subTitle
	} = {}) {
		if (typeof icon === "string")
			this.view.header.icon.dataset.icon = icon;

		if (typeof title === "string") {
			this.view.header.detail.sTitle.innerText = title;
			this.button.navtip.set({ title });
		} else if (typeof title === "object" && title.tagName) {
			emptyNode(this.view.header.detail.sTitle);
			this.view.header.detail.sTitle.appendChild(title);
		}

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
				b.addEventListener("click", async () => {
					b.loading(true);

					try {
						await buttons[key].onClick();
					} catch(e) {
						errorHandler(e);
					}
					
					b.loading(false);
				});

			this.view.overlay.buttons.appendChild(b);
		}
	}

	handleError(e, onRetry = async () => {}) {
		let error = parseException(e);

		if (error.description.includes("Phiên làm việc hết hạn")) {
			this.overlay({
				icon: "unlink",
				title: "Không Có Quyền Truy Cập!",
				description: `Phiên làm việc của bạn đã hết hạn hoặc bạn không có quyền truy cập chức năng này. `,
				buttons: {
					retry: { text: "THỬ LẠI", color: "pink", icon: "reload", onClick: async () => await onRetry() },
					renew: { text: "Làm Mới Phiên", color: "blue", icon: "signin", onClick: async () => await core.account.renew() }
				}
			});
		} else {
			this.overlay({
				icon: "bomb",
				title: "Toang Rồi Ông Giáo Ạ!",
				description: `<pre class="break">[${error.code}] >>> ${error.description}</pre>`,
				buttons: {
					retry: { text: "THỬ LẠI", color: "pink", icon: "reload", onClick: async () => await onRetry() }
				}
			});
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
	 * Currently active screen
	 * @type {CoreScreen}
	 */
	activeScreen: null,

	/**
	 * Initialize CTMS+ Core
	 * @param {Function}	set			Report Progress to Initializer
	 */
	async init(set = () => {}) {
		let start = time();

		// Disable connection state change
		__connection__.enabled = false;

		await initGroup(this, "core", ({ p, m, d }) => {
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

	serviceWorker: {
		init() {
			if (!navigator 
				|| !navigator.serviceWorker
				|| typeof navigator.serviceWorker.register !== "function")
				return false;

			navigator.serviceWorker.register("/service-worker.js", { scope: "/" })
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
				window.SERVER = { REPORT_ERROR: window.REPORT_ERROR };
				window.REPO_ADDRESS = response.link.repo;
				window.DEBUG = (META.branch === "development");

				if (DEBUG)
					this.log("INFO", "Development Mode Enabled. Detailed logs will be printed in verbose level.");
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
			icon: "./static/img/icon.png",
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
			}
		},

		display: {
			group: smenu.Group.prototype,

			/** @type {Animator} */
			animator: null,
			currentZoom: 1,

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

				new smenu.components.Slider({
					label: "Kích cỡ giao diện",
					color: "blue",
					min: 0.6,
					max: 1.2,
					step: 0.1,
					defaultValue: 1,
					save: "display.scale",
					onInput: (v) => this.changeZoom(v)
				}, ux);

				let other = new smenu.Child({ label: "Khác" }, this.group);

				new smenu.components.Checkbox({
					label: "Thông báo",
					color: "pink",
					save: "display.notification",
					defaultValue: false,
					disabled: true
				}, other);

				new smenu.components.Checkbox({
					label: "super triangles! (mobile)",
					color: "blue",
					save: "display.supertriangles",
					defaultValue: false
				}, other);
			},

			changeZoom(zoom) {
				if (this.animator)
					this.animator.cancel();

				let begin = this.currentZoom;
				let delta = zoom - this.currentZoom;

				this.animator = new Animator(1, Easing.OutQuart, (v) => {
					this.currentZoom = begin + (delta * v);
					core.container.style.zoom = this.currentZoom;
				});

				this.animator.onComplete(() => this.animator = null);
			}
		},

		schedule: {
			group: smenu.Group.prototype,

			init() {
				if (typeof core.screen.schedule !== "object") {
					this.log("WARN", `core.screen.schedule module is missing! init cancelled.`);
					return false;
				}

				this.group = new smenu.Group({ label: "lịch học", icon: "calendarWeek" });

				let ux = new smenu.Child({ label: "Giao Diện" }, this.group);

				new smenu.components.Checkbox({
					label: "Tự động thay đổi kiểu hiển thị",
					color: "pink",
					save: "schedule.autoChangeRenderer",
					defaultValue: true,
					onChange: (v) => {					
						core.screen.home.setAutoChangeRenderer(v);
						core.screen.schedule.setAutoChangeRenderer(v);
					}
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
					onChange: (v) => {
						core.screen.home.setDefaultRenderMode(v);
						core.screen.schedule.setDefaultRenderMode(v);
					}
				}, ux);

				let data = new smenu.Child({ label: "Dữ Liệu" }, this.group);

				new smenu.components.Button({
					label: "xóa dữ liệu điểm danh",
					color: "red",
					complex: true,
					onClick: () => core.screen.schedule.clearCheckInData()
				}, data);
			}
		},

		results: {
			group: smenu.Group.prototype,

			init() {
				if (typeof core.screen.results !== "object") {
					this.log("WARN", `core.screen.results module is missing! init cancelled.`);
					return false;
				}

				this.group = new smenu.Group({ label: "kết quả học", icon: "poll" });
				let grouping = new smenu.Child({ label: "Sắp Xếp Nhóm" }, this.group);

				new smenu.components.Slider({
					label: `Số tuần quét mỗi kì`,
					min: 2,
					max: 6,
					defaultValue: 2,
					unit: "tuần",
					save: "results.scanPerSemester",
					onChange: (v) => core.screen.results.scanPerSemester = v
				}, grouping);

				let data = new smenu.Child({ label: "Dữ Liệu" }, this.group);

				new smenu.components.Button({
					label: "xóa dữ liệu nhóm",
					color: "red",
					complex: true,
					onClick: () => core.screen.results.clearGroupingData()
				}, data);
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
						icon: new lazyload({ source: "./static/img/icon.png", classes: "icon" })
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
						tip: { tag: "tip", title: `Tên của bạn sẽ xuất hiện trong danh sách này nếu bạn có đóng góp cho dự án (bằng cách tạo commit hoặc pull request)` }
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
					icon: "./static/img/icon.png",
					appName: APPNAME,
					version: `${VERSION} - ${STATE}`
				}, project);
			}
		}
	},

	middleware: {
		priority: 2,
		list: {},
		select: smenu.components.Select.prototype,

		init() {
			if (typeof META === "undefined" || !META.middleware)
				return false;

			this.list = META.middleware;
			let general = new smenu.Child({ label: "Middleware" }, core.userSettings.server.group);

			let mwOptions = {}
			let mwDefault;

			for (let key of Object.keys(META.middleware)) {
				mwOptions[key] = META.middleware[key].name;

				if (META.middleware[key].default)
					mwDefault = key;
			}

			this.select = new smenu.components.Select({
				label: "Middleware",
				icon: "hive",
				options: mwOptions,
				defaultValue: mwDefault,
				save: `server.middleware.${VERSION}`,
				onChange: (v) => api.MIDDLEWARE = META.middleware[v].host
			}, general);

			new smenu.components.Button({
				label: "chọn máy chủ tốt nhất",
				color: "pink",
				complex: true,
				onClick: async () => await this.check()
			}, general);
		},

		async check({
			message = "Đang tìm middleware phù hợp",
			description = "CTMS+ sẽ tự động chọn máy chủ nhanh nhất, quá trình này sẽ mất vài giây."
		} = {}) {
			let promises = []
			let checkData = {}
			let cancelled = false;

			let checkStatus = makeTree("table", ["generalTable", "middlewareStatus"], {
				thead: { tag: "thead", child: {
					row: { tag: "tr", child: {
						mw: { tag: "th", text: "middleware" },
						ping: { tag: "th", class: "right", text: "ping" },
						status: { tag: "th", class: "center", text: "status" }
					}}
				}},

				tbody: { tag: "tbody" }
			});

			for (let key of Object.keys(this.list)) {
				let item = this.list[key];

				let row = makeTree("tr", "row", {
					mw: { tag: "td", class: "middleware", child: {
						mwName: { tag: "t", class: "name", text: item.name },
						mwHost: { tag: "t", class: "host", text: item.host }
					}},

					ping: { tag: "td", class: ["right", "ping"] },
					
					status: {
						tag: "td",
						class: ["center", "status"],
						data: { status: "loading" },
						child: {
							spinner: { tag: "div", class: "simpleSpinner" },
							icon: { tag: "icon" }
						}
					}
				});

				checkStatus.tbody.appendChild(row);
				checkData[key] = {
					status: "loading",
					ping: null
				}

				// Start check request
				promises.push(new Promise(async (resolve) => {
					let start = performance.now();

					try {
						await myajax({ url: `${item.host}/api/ping` });
					} catch(e) {
						checkData[key].status = "error";
						row.status.dataset.status = "error";

						resolve();
						return;
					}

					checkData[key].status = "good";
					checkData[key].ping = performance.now() - start;
					row.status.dataset.status = "good";
					row.ping.innerText = `${round(checkData[key].ping, 2)}ms`;
					resolve();
				}));
			}

			popup.show({
				windowTitle: `Middleware Status Check`,
				title: "Middleware",
				icon: "server",
				message,
				description,
				customNode: checkStatus,
				buttonList: {
					cancel: { color: "red", text: "HỦY" }
				}
			}).then((value) => {
				if (value === "cancel")
					cancelled = true;
			});

			// Await all check to complete
			await Promise.all(promises);

			if (cancelled)
				return;

			// Find suitable middleware
			let minPing = 999999;
			let target;
			for (let key of Object.keys(checkData)) {
				if (checkData[key].status !== "good")
					continue;

				if (checkData[key].ping < minPing) {
					target = key;
					minPing = checkData[key].ping;
				}
			}
			
			// Hack the popup
			popup.popup.body.top.message.innerText = "Kiểm Tra Hoàn Thành!";
			popup.popup.body.button.children[0].dataset.color = "blue";
			popup.popup.body.button.children[0].children[0].innerText = "ĐÓNG";

			if (target) {
				this.log("OKAY", `Switched to middleware`, {
					text: target,
					color: oscColor("blue")
				}, `(${this.list[target].host})`);

				popup.popup.header.dataset.triColor = "green";
				popup.popup.body.top.description.innerHTML = `Đã chuyển sang middleware <b>${this.list[target].name}</b>!`;
				this.select.set({ value: target });
			} else {
				this.log("WARN", `No suitable middleware found!`);
				popup.popup.header.dataset.triColor = "red";
				popup.popup.body.top.description.innerHTML = `Không tìm thấy middleware phù hợp!
					Bạn có thể <a target="_blank" href="${REPORT_ERROR}">báo cáo sự cố này</a> để được khắc phục sớm nhất!`;
			}
		}
	},

	account: {
		priority: 4,

		loggedIn: false,
		background: null,
		email: undefined,
		password: undefined,

		/** @type {UserInfo} */
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
				source: "./static/img/guest.png",
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
					message: "This is a sample warning",
					style: "round"
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
							source: "./static/img/guest.png",
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

				renewBtn: createButton("Làm Mới Phiên", {
					color: "orange",
					classes: "logout",
					style: "round",
					icon: "reload",
					complex: true
				}),

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
			this.detailView.renewBtn.addEventListener("click", () => this.renew());
			this.detailView.signoutBtn.addEventListener("click", () => this.logout());
			api.onResponse("global", (response) => this.check(response));
			api.onResponse("results", (response) => this.updateInfo(response));
			api.onResponse("services", (response) => this.updateEmail(response.info.email));

			set({ p: 50, d: `Đang Kiểm Tra Phiên Làm Việc` });
			try {
				await api.request();
			} catch(error) {
				let check = (error.code < 100 && error.code != 0)
					|| (error.data && (error.data.code === 106 || (error.data.code > 0 && error.data.code < 100)))

				if (check) {
					this.log("ERRR", "Session check request failed! Error indicate middleware failue!");
					this.log("ERRR", "We will perform a auto middleware change to resolve this problem and try again.");
					set({ p: 60, d: `Đang Chọn Middleware Khác` });
					await core.middleware.check({
						message: "Middleware hiện tại đã bị lỗi!",
						description: "CTMS+ đang tìm kiếm middleware phù hợp để sử dụng, quá trình này sẽ mất vài giây!"
					});

					set({ p: 70, d: `Đang Kiểm Tra Phiên Làm Việc (LẦN 2)` });
					await api.request();
				}
			}

			if (!this.loggedIn) {
				// This code will be executed if app started with
				// no session / session expired
				// Handle autologin here
				let username = localStorage.getItem("session.username");
				let password = localStorage.getItem("session.password");
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

		/**
		 * Check for login state from other requests.
		 * @param	{APIResponse}	response
		 */
		async check(response) {
			// Skip check for page that don't require login
			if (response.path.includes("index.aspx"))
				return;

			if (response.dom.getElementById("LeftCol_UserLogin1_pnlLogin")) {
				this.loggedIn = false;
				this.email = undefined;
				this.userInfo = undefined;
				
				this.nameNode.innerText = "Khách";
				this.avatarNode.src = this.detailView.userCard.top.avatar.src = "./static/img/guest.png";
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

		/**
		 * Update user info from results api response.
		 * @param	{APIResponse & Results}		response 
		 */
		updateInfo(response) {
			this.userInfo = {
				name: response.info.name,
				birthday: response.info.birthday,
				tForm: response.info.tForm,
				studentID: response.info.studentID,
				faculty: response.info.faculty,
				department: response.info.department,
				course: response.info.course,
				classroom: response.info.classroom,
				mode: response.info.mode
			};

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
			localStorage.removeItem("session.username");
			localStorage.removeItem("session.password");

			try {
				await api.login({ username, password });
				this.updateEmail(username);

				// Update current session credentials
				localStorage.setItem("session.username", username);
				localStorage.setItem("session.password", password);
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

			this.password = undefined;
			this.detailView.signoutBtn.disabled = false;
			this.subWindow.loading = false;
		},

		async renew({ showAccountPanel = true } = {}) {
			let username = localStorage.getItem("session.username");
			let password = localStorage.getItem("session.password");

			if (!username || !password)
				throw { code: 33, description: `core.account.renew(): cannot renew session without active username or password` }

			if (showAccountPanel) {
				this.subWindow.loading = true;
				this.subWindow.show();
			}

			this.log("INFO", `Renewing Current Session`);
			localStorage.removeItem("session");
			await api.request();
			await this.login({ username, password });
		}
	},

	screen: {
		/** @type {HTMLDivElement} */
		container: $("#content"),
		priority: 3,

		init() {}
	}
}

// Wrap createButton to prevent adding complex background
// on mobile to reduce 'lag'.
if (localStorage.getItem("display.supertriangles") !== "true") {
	if (window && typeof window.createButton === "function") {
		window.__createButton = window.createButton;
		window.createButton = (text, options = {}) => {
			if (checkAgentMobile() && options.complex)
				options.triangleCount = 3;
	
			return window.__createButton(text, options);
		}
	}
}
