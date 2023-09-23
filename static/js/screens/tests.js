//? |-----------------------------------------------------------------------------------------------|
//? |  /static/js/screens/tests.js                                                                  |
//? |                                                                                               |
//? |  Copyright (c) 2022 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

core.screen = {
	...core.screen,

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

			// Check if we are testing using testing framework.
			// If not, temporary disable this screen.
			if (typeof oapi !== "object") {
				this.screen.overlay({
					show: true,
					icon: "seedling",
					title: "Tính năng tạm thời bị vô hiệu hóa!",
					description: "Tính năng này hiện đã tạm dừng hoạt động do thay đổi hệ thống mới. CTMS+ sẽ tạm dừng hoạt động cho tới khi có thông báo mới."
				});

				return false;
			}

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

				await api.tests();

				this.loading = false;
				this.screen.loading = false;
			} catch(e) {
				this.reset();
				this.screen.handleError(e, async () => await this.load());

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
	}
}