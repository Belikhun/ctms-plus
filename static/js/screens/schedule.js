//? |-----------------------------------------------------------------------------------------------|
//? |  /static/js/screens/schedule.js                                                               |
//? |                                                                                               |
//? |  Copyright (c) 2022 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

const ScheduleScreen = {
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
			note: createNote({
				level: "warning",
				message: "",
				style: "round"
			}),

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
				}),

				prev: createButton(undefined, {
					icon: "backward",
					color: "blue",
					classes: "controlWeekLeft",
					complex: true,
					disabled: true,
				}),

				next: createButton(undefined, {
					icon: "forward",
					color: "blue",
					align: "right",
					classes: "controlWeekRight",
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

		this.view.note.group.style.display = "none";
		this.loading = true;
		this.screen.content = this.view;
		this.screen.onShow(() => this.load());
		new Scrollable(this.view, { content: this.view.list });

		this.view.control.confirm.addEventListener("click", () => this.load(this.getInputDate()));
		this.view.control.next.addEventListener("click", () => this.load(this.getNextWeek()));
		this.view.control.prev.addEventListener("click", () => this.load(this.getLastWeek()));

		core.account.onLogin(async () => {
			if (this.screen.showing)
				this.load();
		});

		core.account.onLogout(() => {
			// Disable confirm button to prevent confusion
			this.view.control.confirm.loading(false);
			this.view.control.confirm.disabled = true;

			if (!this.haveCacheData)
				this.onLogout()
		});

		api.onResponse("schedule", (response) => {
			if (response.date)
				this.setInputNow(response.date);

			let today = new Date();
			let currentOrNext = (response.date.setDate(response.date.getDate() + 6) > today)
				&& (response.date.setDate(response.date.getDate() - 7) < today);

			this.log("DEBG", "currentOrNext =", currentOrNext);

			// Check schedule data is current week or next week, first response
			// always return current week data.
			if (!this.loaded && currentOrNext) {
				// Warp this inside a async function so the code bellow can
				// continue to execute.
				(async () => {
					// Wait for user info data to be available
					if (!core.account.userInfo) {
						this.log("DEBG", "userInfo is not available! waiting for it...");
						await waitFor(() => (typeof core.account.userInfo === "object"), () => {}, 120, 1000);
					}

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
				})()
			}
			
			this.view.note.group.style.display = "none";
			this.loaded = true;
			this.loading = false;
			this.render(response);
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

					this.render({ info: cache.info });

					// Render notice for user
					this.view.note.set({
						message: `
							Đây là dữ liệu lịch học của tuần từ ngày
							<b>${cache.date.getDate()}/${cache.date.getMonth() + 1}/${cache.date.getFullYear()}</b>
							của tài khoản <b>${cache.name}</b>.<br>
							Thông tin được lưu vào lúc <b>${humanReadableTime(cache.stored)}</b>, do vậy thông tin đã có thể được cập nhật!<br>
							Hãy <a href="javascript:core.account.subWindow.show()">đăng nhập</a> để cập nhật dữ liệu!
						`
					});

					this.view.note.group.style.display = null;

					let autoLogin = localStorage.getItem("autoLogin.enabled");
					if (autoLogin === "true") {
						// Switch to button loading indicator because we have just
						// hided the screen loading overlay
						this.loading = true;
					} else {
						this.loading = false;
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

	set loading(loading = false) {
		if (this.screen.overlayShowing) {
			this.screen.loading = loading;
			this.view.control.confirm.loading(false);
			this.view.control.next.loading(false);
			this.view.control.prev.loading(false);
		} else {
			this.screen.loading = false;
			this.view.control.confirm.loading(loading);
			this.view.control.next.disabled = loading;
			this.view.control.prev.disabled = loading;
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

		this.loading = false;
	},

	/**
	 * @param	{Date}	[date] 
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
				this.loading = true;
				this.screen.overlay({ show: false });
				await api.schedule();
				this.view.control.confirm.disabled = false;
			} else {
				if (date) {
					this.loading = true;
					await api.schedule(date);
				}
			}
		} catch(e) {
			this.reset();
			this.view.control.confirm.disabled = true;
			this.screen.handleError(e, async () => await this.load());

			this.loading = false;
		}
	},

	setInputNow(date = new Date()) {
		setDateTimeValue(this.view.control.dateInput.input, null, time(date));
	},

	getInputDate() {
		return new Date(this.view.control.dateInput.input.value);
	},

	getNextWeek() {
		let date = this.getInputDate();
		date.setDate(date.getDate() + 7);
		return date;
	},

	getLastWeek() {
		let date = this.getInputDate();
		date.setDate(date.getDate() - 7);
		return date;
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
	 * @param 	{Object}				data
	 * @param 	{Boolean}				data.billAlert				
	 * @param 	{ScheduleWeekRow[]}		data.info				
	 * @param 	{Boolean}				force	Force re-render
	 */
	render({ info, billAlert = false } = {}, force = false) {
		let renderer = this.defaultRenderMode;
		let data = info;
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
		if (this.currentRenderer !== renderer || newData || force) {
			this.log("DEBG", `render(${renderer}): re-rendering`);
			emptyNode(this.view.list);

			// Hide overlay to make sure data is always visible
			this.screen.overlay({ show: false });

			if (billAlert) {
				this.view.note.set({
					message: `
						<h3>Cảnh báo</h3>
						Bạn còn hóa đơn học phí chưa thanh toán!`
				});

				this.view.note.group.style.display = null;
			}

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

		let table = makeTree("table", ["generalTable", "scheduleTable", "noBackground"], {
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

				if (row.checkInID) {
					tableRow.classID.classList.add("clickable");
					tableRow.classID.addEventListener(
						"click",
						() => this.viewCheckIn(row.checkInID, row.subject)
					);

					let checkInData = localStorage.getItem(`cache.checkin.${row.checkInID}`);
					if (checkInData) {
						checkInData = JSON.parse(checkInData);
						tableRow.classID.innerText += ` (STT ${checkInData.nth})`;

						// Code for determining online/offline classes. Obsoleted.
						// if (!row.subject.toLocaleLowerCase().includes("thực hành")) {
						// 	let isOffline;
						// 	let methodBadge = document.createElement("span");
						// 	methodBadge.classList.add("generalTag");
						// 	methodBadge.style.marginLeft = "5px";

						// 	// Odd-Even date to determine online or offline.
						// 	if (date.getDate() % 2 === 0)
						// 		isOffline = (checkInData.nth % 2 === 0);
						// 	else
						// 		isOffline = (checkInData.nth % 2 === 1);
							
						// 	if (isOffline) {
						// 		methodBadge.dataset.color = "orange";
						// 		methodBadge.innerText = "offline";
						// 	} else {
						// 		methodBadge.dataset.color = "pink";
						// 		methodBadge.innerText = "online";
						// 	}

						// 	tableRow.status.appendChild(methodBadge);
						// }
					}
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
						classID: {
							tag: "t",
							class: "classID",
							html: (typeof row.classID === "object")
								? row.classID.join("<br>")
								: row.classID
						},

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

				if (row.checkInID) {
					item.bottom.classID.classList.add("clickable");
					item.bottom.classID.addEventListener(
						"click",
						() => this.viewCheckIn(row.checkInID, row.subject)
					);

					let checkInData = localStorage.getItem(`cache.checkin.${row.checkInID}`);
					if (checkInData) {
						checkInData = JSON.parse(checkInData);
						item.bottom.classID.innerText += ` (STT ${checkInData.nth})`;

						// Code for determining online/offline classes. Obsoleted.
						// if (!row.subject.toLocaleLowerCase().includes("thực hành")) {
						// 	let methodBadge = document.createElement("span");
						// 	methodBadge.classList.add("generalTag");
						// 	methodBadge.style.marginLeft = "5px";

						// 	// Odd-Even date to determine online or offline.
						// 	if (date.getDate() % 2 === 0)
						// 		isOffline = (checkInData.nth % 2 === 0);
						// 	else
						// 		isOffline = (checkInData.nth % 2 === 1);
							
						// 	if (isOffline) {
						// 		methodBadge.dataset.color = "orange";
						// 		methodBadge.innerText = "offline";
						// 	} else {
						// 		methodBadge.dataset.color = "pink";
						// 		methodBadge.innerText = "online";
						// 	}

						// 	item.top.insertBefore(methodBadge, item.top.classroom);
						// }
					}
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
	},

	async viewCheckIn(id, title) {
		this.screen.loading = true;
		let response;

		try {
			response = await api.getCheckIn(id);

			// Save to cache for rendering nth in schedule.
			localStorage.setItem(`cache.checkin.${id}`, JSON.stringify(response.data));
			this.render(undefined, true);
		} catch(e) {
			errorHandler(e);
			this.screen.loading = false;
			return;
		}

		this.screen.loading = false;
		let view = makeTree("div", "checkInView", {
			header: { tag: "div", class: "header", child: {
				nth: { tag: "span", class: "item", child: {
					label: { tag: "t", class: "label", text: "MÃ DANH SÁCH" },
					value: { tag: "span", class: "value", text: response.data.nth }
				}},

				healthDeclared: { tag: "span", class: "item", child: {
					label: { tag: "t", class: "label", text: "KHAI Y TẾ" },
					value: { tag: "span", class: ["value", "check"], data: { checked: response.data.healthDeclared } }
				}}
			}},

			checkIn: { tag: "div", class: "checkIn" }
		}, "view");

		for (let check of response.data.checkIn) {
			let item = makeTree("span", "item", {
				label: { tag: "t", class: "label", text: check.label },
				check: { tag: "div", class: "check", data: { status: check.status } }
			});

			view.checkIn.appendChild(item);
		}

		await popup.show({
			windowTitle: `Danh Sách Điểm Danh ${id}`,
			title,
			icon: "table",
			level: "offline",
			message: "",
			description: "",
			customNode: view,
			buttonList: {
				close: { text: "Đóng" }
			}
		});
	},

	clearCheckInData() {
		for (let key of Object.keys(localStorage)) {
			if (!key.startsWith("cache.checkin"))
				continue;

			this.log("DEBG", `Clearing ${key}`);
			localStorage.removeItem(key);
		}

		this.render(undefined, true);
	},

	settings: {
		group: smenu.Group.prototype,

		init() {
			this.group = new smenu.Group({
				label: "lịch học",
				icon: "calendarWeek",
				after: core.userSettings.display.group
			});

			let ux = new smenu.Child({ label: "Giao Diện" }, this.group);

			new smenu.components.Checkbox({
				label: "Tự động thay đổi kiểu hiển thị",
				color: "pink",
				save: "schedule.autoChangeRenderer",
				defaultValue: true,
				onChange: (v) => {
					if (typeof HomeScreen === "object")
						HomeScreen.setAutoChangeRenderer(v);

					ScheduleScreen.setAutoChangeRenderer(v);
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
					if (typeof HomeScreen === "object")
						HomeScreen.setDefaultRenderMode(v);
					
					ScheduleScreen.setDefaultRenderMode(v);
				},

				toast: true
			}, ux);

			let data = new smenu.Child({ label: "Dữ Liệu" }, this.group);

			new smenu.components.Button({
				label: "xóa dữ liệu điểm danh",
				color: "red",
				complex: true,
				onClick: () => ScheduleScreen.clearCheckInData()
			}, data);
		}
	}
}

core.screen = {
	...core.screen,
	schedule: ScheduleScreen
}