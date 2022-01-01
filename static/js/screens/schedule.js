//? |-----------------------------------------------------------------------------------------------|
//? |  /static/js/screens/schedule.js                                                               |
//? |                                                                                               |
//? |  Copyright (c) 2021 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

core.screen = {
	...core.screen,

	schedule: {
		/** @type {CoreScreen} */
		screen: undefined,

		/** @type {HTMLDivElement} */
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

			this.setLoading(true);
			this.screen.view.header.reload.style.display = "none";
			this.screen.content = this.view;
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
				// always return current week data.
				if (!this.loaded && core.account.userInfo) {
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

					// Validate cache age (7 days)
					if (time(cache.date) >= time() - 604800) {
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
								Thông tin được lưu vào lúc <b>${humanReadableTime(cache.stored)}</b>, do vậy nó có thể đã bị thay đổi trong tương lai!<br>
								Hãy <a href="javascript:core.account.subWindow.show()">đăng nhập</a> để cập nhật dữ liệu!
							`
						});
	
						note.group.style.marginBottom = "30px";
						this.view.list.insertBefore(note.group, this.view.list.firstChild);
						this.screen.overlay({ show: false });
	
						let autoLogin = localStorage.getItem("autoLogin.enabled");
						if (autoLogin === "true") {
							// Switch to button loading indicator because we have just
							// hided the screen loading overlay
							this.setLoading(true);
						} else {
							this.setLoading(false);
							this.view.control.confirm.disabled = true;
						}
					}
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
				title: "Bạn Chưa Đăng Nhập",
				description: `Hãy đăng nhập vào CTMS để xem nội dung này! Hoặc bạn <b>có thể</b> xem lịch học của khoa mà không cần đăng nhập.`,
				buttons: {
					login: { text: "ĐĂNG NHẬP", icon: "signin", onClick: () => core.account.clickable.active = true },
					viewHome: { text: "Xem Lịch Học", icon: "table", color: "purple", onClick: () => core.screen.home.screen.show() }
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
				this.reset();
				this.view.control.confirm.disabled = true;
				this.screen.handleError(e, async () => await this.load());

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
		 * @param 	{ScheduleWeekRow[]}		data
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
				emptyNode(this.view.list);

				if (renderer === "table")
					this.view.list.appendChild(this.renderTable(data));
				else
					this.view.list.appendChild(this.renderList(data));

				this.currentRenderer = renderer;
			}
		},

		/**
		 * Render schedule data in table format
		 * 
		 * @param		{ScheduleWeekRow[]}		data 	Schedule data
		 * @returns		{HTMLTableElement}
		 */
		renderTable(data, {
			removeListID = true
		} = {}) {
			let today = new Date();
			let foundNextDay = false;

			let table = makeTree("table", ["generalTable", "scheduleTable"], {
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
						
						...((!removeListID)
							? { listID: { tag: "th", class: "right", text: "Mã DS Thi" } }
							: {})
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

						classID: {
							tag: "td",
							class: ["bold", "right"],
							html: (typeof row.classID === "object")
								? row.classID.join("<br>")
								: row.classID
						},

						...((!removeListID)
							? { listID: { tag: "td", class: ["bold", "right"], text: row.listID } }
							: {})
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

			return table;
		},

		/**
		 * Render schedule data in list format.
		 * This format is mobile-fiendly
		 * 
		 * @param		{ScheduleWeekRow[]}		data 	Schedule data
		 * @returns		{HTMLTableElement}
		 */
		renderList(data) {
			let today = new Date();
			let foundNextDay = false;
			let container = document.createElement("div");
			container.classList.add("scheduleList");

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
	
				container.appendChild(group);
			}

			return container;
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
	}
}