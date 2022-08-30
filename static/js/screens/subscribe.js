//? |-----------------------------------------------------------------------------------------------|
//? |  /static/js/screens/subscribe.js                                                              |
//? |                                                                                               |
//? |  Copyright (c) 2021 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

core.screen = {
	...core.screen,

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
								this.itemList[classID].actions.right.toggle.dataset.triColor = "orange";
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

			if (action.command === "condition") {
				item.actions.right.toggle.disabled = true;
				item.actions.right.toggle.changeText(action.data);
				item.actions.right.toggle.dataset.triColor = "orange";
				item.actions.right.toggle.querySelector(":scope > icon")
					.dataset.icon = "exclamation";
			} else {
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
			}
			
			if (type === "waiting" && !this.view.waiting.contains(item))
				this.view.waiting.appendChild(item);

			if (type === "subscribed" && !this.view.subscribed.contains(item))
				this.view.subscribed.appendChild(item);
		}
	}
}