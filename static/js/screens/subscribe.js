//? |-----------------------------------------------------------------------------------------------|
//? |  /static/js/screens/subscribe.js                                                              |
//? |                                                                                               |
//? |  Copyright (c) 2022 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

const SubscribeScreen = {
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
			icon: "signout",
			title: "Bạn Chưa Đăng Nhập",
			description: `Hãy đăng nhập vào CTMS để xem nội dung này!`,
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
			this.reset();
			this.screen.handleError(e, async () => await this.load());

			this.screen.loading = false;
		}
	},

	/**
	 * Render subject card
	 * @param {{ type: "waiting" | "subscribed" } & SubscribeEntry} 
	 */
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
			data: undefined,
			classID: undefined,
		},
		date = {
			start: undefined,
			end: undefined,
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
							progress: { tag: "span", class: ["subProgress", "progressBar"], child: {
								label: { tag: "div", class: "label", text: "Đã Đăng Kí" },
		
								bar: { tag: "div", class: "bar", child: {
									minimum: { tag: "div", class: "minimum" },
									inner: { tag: "div", class: "inner" }
								}},
		
								min: { tag: "div", class: "min", text: "0" },
								subs: { tag: "div", class: "subs", text: "0" },
								max: { tag: "div", class: "max", text: "0" }
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
								value: { tag: "t", class: "value", text: "---" },
								sub: { tag: "t", class: "sub", text: "---" }
							}},

							endDate: { tag: "span", class: "endDate", child: {
								label: { tag: "t", class: "label", text: "Đóng Đăng Kí" },
								value: { tag: "t", class: "value", text: "---" },
								sub: { tag: "t", class: "sub", text: "---" }
							}},

							cancel: { tag: "span", class: "cancel", child: {
								label: { tag: "t", class: "label", text: "Hủy Trước" },
								value: { tag: "t", class: "value", text: "---" },
								sub: { tag: "t", class: "sub", text: "---" }
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
							style: "big",
							icon: "circle",
							complex: true,
							triangleCount: 2
						}),

						schedule: createButton(undefined, {
							style: "big",
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

			if (action.command !== "condition") {
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

						if (action.command === "subscribe") {
							// Temporary append to Subscribed without removing loading
							// indicator.
							this.itemList[classID].actions.right.toggle.background.color = "orange";
							this.view.subscribed.appendChild(this.itemList[classID]);
						}
					} catch(e) {
						errorHandler(e);
					}

					try {
						await api.subscribe({ action: "subscribed" });
					} catch(e) {
						errorHandler(e);
					}
					
					this.itemList[classID].actions.right.toggle.loading(false);
				});
			}
		}

		this.itemList[classID].action = action;
		let item = this.itemList[classID];

		item.details.right.top.classroom.value.innerText = classroom.join(", ");
		item.details.right.top.credits.value.innerText = credits;
		item.details.right.bottom.startDate.value.innerText = humanReadableTime(date.start);
		item.details.right.bottom.startDate.sub.innerText = relativeTime(time(date.start));
		item.details.right.bottom.endDate.value.innerText = humanReadableTime(date.end);
		item.details.right.bottom.endDate.sub.innerText = relativeTime(time(date.end));

		requestAnimationFrame(() => {
			let progress = (subscribed / maximum) * 100;
			let minProg = (minimum / maximum) * 100;
			let color = (subscribed >= minimum)
				? (subscribed === maximum ? "green" : "blue")
				: "red";

			item.details.right.top.progress.bar.minimum.style.width = `${minProg}%`;
			item.details.right.top.progress.bar.inner.dataset.color = color;
			item.details.right.top.progress.bar.inner.style.width = `${progress}%`;
			item.details.right.top.progress.subs.style.left = `${progress}%`;
			item.details.right.top.progress.subs.innerText = subscribed;
	
			item.details.right.top.progress.min.style.left = `${(minimum / maximum) * 100}%`;
			item.details.right.top.progress.min.innerText = minimum;
			item.details.right.top.progress.max.innerText = maximum;
		});
		
		if (date.cancel) {
			item.details.right.bottom.cancel.style.display = null;
			item.details.right.bottom.cancel.value.innerText = humanReadableTime(date.cancel);
			item.details.right.bottom.cancel.sub.innerText = relativeTime(time(date.cancel));
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

		if (action.command === "condition") {
			item.actions.right.toggle.disabled = true;
			item.actions.right.toggle.changeText(action.data);
			item.actions.right.toggle.background.color = "orange";
			item.actions.right.toggle.querySelector(":scope > icon")
				.dataset.icon = "exclamation";
		} else {
			switch (type) {
				case "waiting":
					item.actions.right.toggle.changeText("ĐĂNG KÍ");
					item.actions.right.toggle.background.color = "green";
					item.actions.right.toggle.querySelector(":scope > icon")
						.dataset.icon = "signin";
					break;
			
				case "subscribed":
					item.actions.right.toggle.changeText("HỦY ĐĂNG KÍ");
					item.actions.right.toggle.background.color = "red";
					item.actions.right.toggle.querySelector(":scope > icon")
						.dataset.icon = "signout";
					break;
			}

			item.actions.right.toggle.disabled = !(action && action.command && action.classID);
		}
		
		if (type === "waiting" && !this.view.waiting.contains(item))
			this.view.waiting.appendChild(item);

		if (type === "subscribed" && !this.view.subscribed.contains(item))
			this.view.subscribed.appendChild(item);
	}
}

core.screen = {
	...core.screen,

	subscribe: SubscribeScreen
}
