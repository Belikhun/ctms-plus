//? |-----------------------------------------------------------------------------------------------|
//? |  /static/js/ctms.js                                                                           |
//? |                                                                                               |
//? |  Copyright (c) 2021 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

core.userSettings.ctms = {
	priority: -1,

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
						ended: "ĐÃ HẾT HẠN!"
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
}