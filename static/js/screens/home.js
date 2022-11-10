//? |-----------------------------------------------------------------------------------------------|
//? |  /static/js/screens/home.js                                                                   |
//? |                                                                                               |
//? |  Copyright (c) 2022 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

const HomeScreen = {
	/** @type {CoreScreen} */
	screen: undefined,

	/** @type {HTMLDivElement} */
	view: null,

	/** @type {HTMLDivElement} */
	title: null,

	/** @type {HTMLDivElement} */
	emptyClassIDsNotice: null,

	loaded: false,
	loading: false,
	activeScreen: null,
	currentScreen: null,

	activeWeekday: null,
	currentWeekday: null,

	autoChangeRenderer: true,
	defaultRenderMode: "table",
	currentRenderer: "table",
	listRenderTrigger: 700,
	currentData: [],

	async init() {
		this.view = makeTree("div", "homeScreen", {
			control: { tag: "div", class: "control", child: {
				dateInput: createInput({
					type: "date",
					id: "schedule.date",
					label: "Ngày Bắt Đầu"
				}),

				confirm: createButton("XEM", {
					icon: "calendarWeek",
					color: "orange",
					style: "round",
					complex: true,
					disabled: true
				}),

				separatorLine1: {
					tag: "div",
					class: "separator"
				},

				homeDate: createSelectInput({
					icon: "table",
					color: "blue",
					fixed: true
				}),

				separatorLine2: {
					tag: "div",
					class: "separator"
				},

				edit: createButton(undefined, {
					icon: "pencil",
					color: "blue",
					style: "round",
					complex: true
				})
			}},

			list: { tag: "div", class: ["list", "showEmpty"] }
		});

		this.title = makeTree("div", "homeScreenTitle", {
			my: { tag: "span", class: "my", text: "của bạn" },
			home: { tag: "span", class: "home", text: "trang chủ" }
		});

		this.emptyClassIDsNotice = makeTree("div", "emptyClassIDsNotice", {
			icon: { tag: "icon", data: { icon: "pencil" } },
			titleNode: { tag: "t", class: "title", text: `Danh Sách Lớp Của Bạn Trống!` },
			description: {
				tag: "t",
				class: "description",
				html: `Hãy nhập danh sách mã lớp mà bạn đã đăng kí,
					lịch học của bạn sẽ được hiển thị tại đây.
					Lưu ý rằng lịch học này được lấy từ lịch học chung của khoa được hiển thị tại trang chủ của CTMS
					dựa trên danh sách mã lớp mà bạn đã nhập, vì vậy hãy đảm bảo chắc chắn rằng danh sách
					này là <b>CHÍNH XÁC</b>. Danh sách mã lớp cũng sẽ được cập nhật tự động khi bạn vào trang <b>Đăng Kí</b> của CTMS+`
			},

			buttons: { tag: "div", class: "buttons", child: {
				edit: createButton("CHỈNH SỬA", {
					color: "blue",
					style: "round",
					icon: "pencil",
					complex: true
				}),

				help: createButton("Video Hướng Dẫn", {
					color: "purple",
					style: "round",
					icon: "question",
					complex: true
				})
			}}
		});

		onInitGroup("core.screen.schedule.settings", (group) => {
			// Add new settings
			let settingsChild = new smenu.Child(
				{ label: "Trang Chủ" },
				group.group
			);
	
			new smenu.components.Button({
				label: "Chỉnh Sửa Danh Sách Mã Lớp",
				color: "orange",
				icon: "pencil",
				complex: true,
				onClick: () => this.showClassIDEditor()
			}, settingsChild);
		});

		// Attach to subscribe API to update Class ID list
		api.onResponse("subscribe", (data) => {
			if (!data.subscribed || data.subscribed.length <= 0)
				return;

			let classIDs = this.getClassID();

			/** @type {SubscribeEntry} */
			let item;

			for (item of data.subscribed)
				if (!classIDs.includes(item.classID)) {
					this.log("DEBG", `updateClassID: new class ID from subscribe: ${item.classID}`);
					classIDs.push(item.classID);
				}

			this.saveClassID(classIDs);
		});

		this.screen = new CoreScreen({
			id: "home",
			icon: "home",
			title: "trang chủ",
			description: "trang chủ của CTMS",
			applyScrollable: false
		});
		
		this.setScreen("my");
		this.setLoading(true);
		this.screen.onShow(() => this.load());
		new Scrollable(this.view, { content: this.view.list });
		this.screen.set({ title: this.title });
		this.screen.content = this.view;

		this.title.my.addEventListener("click", () => this.setScreen("my"));
		this.title.home.addEventListener("click", () => this.setScreen("home"));
		this.view.control.edit.addEventListener("click", () => this.showClassIDEditor());
		this.view.control.confirm.addEventListener("click", () => this.load(this.getInputDate()));
		this.emptyClassIDsNotice.buttons.edit.addEventListener("click", () => this.showClassIDEditor());

		this.emptyClassIDsNotice.buttons.help.addEventListener("click", () => {
			core.wavec.browse(META.link.classIDHelp);
		});

		this.view.control.homeDate.onChange((value) => {
			this.currentWeekday = value;
			this.log("DEBG", "Change Weekday:", value, `(loading: ${this.loading})`);

			if (!this.loading)
				this.render();
		});

		api.onResponse("home", (response) => {
			if (response.date)
				this.setInputNow(response.date);
			
			// Update weekday selector options
			let options = { all: "Toàn Bộ" }
			let defaultValue = null;

			for (let item of response.info) {
				options[item.weekDay] = item.weekDay;

				if (!defaultValue || isToday(item.date))
					defaultValue = item.weekDay;
			}

			this.view.control.homeDate.set({
				options,
				value: defaultValue
			});

			this.loaded = true;
			this.render(response.info);
		});

		// Event listener to update current render mode
		window.addEventListener("resize", () => {
			if (!this.autoChangeRenderer)
				return;

			this.render();
		});

		this.setInputNow();
	},

	/**
	 * Get Class ID List
	 * @returns {Array<String>}
	 */
	getClassID() {
		// Load list from storage
		let storage = localStorage.getItem("home.classID");

		if (!storage)
			return []
		else
			return storage.split("||");
	},

	/**
	 * Save Clas ID List
	 * @param {String[]} ids 
	 */
	saveClassID(ids) {
		localStorage.setItem("home.classID", ids.join("||"));

		if (this.activeScreen === "my")
			this.render(undefined, { force: true });
	},

	async showClassIDEditor() {
		let editor = document.createElement("textarea");
		editor.classList.add("classIDInput", "flatInput");
		editor.value = this.getClassID().join("\n");

		let command = await popup.show({
			windowTitle: `Trang Chủ`,
			title: "Sửa Danh Sách Mã Lớp",
			message: "Nhập các mã lớp mà bạn đang theo học, mỗi mã nằm trên một dòng",
			description: `Danh sách mã lớp cũng sẽ được tự động cập nhật nếu bạn vào trang <b>Đăng Kí</b> của CTMS+`,
			icon: "pencil",
			bgColor: "blue",
			customNode: editor,
			buttonList: {
				save: { icon: "save", text: "LƯU", color: "blue" },
				cancel: { icon: "close", text: "HỦY", color: "red" },
			}
		});

		if (command === "save") {
			let values = editor.value
				.toUpperCase()
				.split("\n")
				.filter((i) => i.length > 0);

			this.saveClassID(values);
			this.log("DEBG", "showClassIDEditor(): manually saved class ID list");
		}
	},

	setScreen(screen) {
		if (screen === this.currentScreen)
			return;

		if (screen === "home") {
			this.title.home.classList.add("active");
			this.title.my.classList.remove("active");
			this.currentScreen = "home";
			this.screen.set({ icon: "home" });
		} else {
			this.title.my.classList.add("active");
			this.title.home.classList.remove("active");
			this.currentScreen = "my";
			this.screen.set({ icon: "userPortrait" });
		}

		this.render();
	},

	reset() {
		this.loaded = false;
		emptyNode(this.view.list);
		this.setInputNow();
	},

	setLoading(loading = false) {
		this.loading = loading;

		if (this.screen.overlayShowing) {
			this.screen.loading = loading;
			this.view.control.confirm.loading(false);
		} else {
			this.screen.loading = false;
			this.view.control.confirm.loading(loading);
		}
	},

	/**
	 * @param {Date} date 
	 * @returns
	 */
	async load(date) {
		try {
			if (!this.loaded) {
				this.setLoading(true);
				this.screen.overlay({ show: false });
				await api.home();
				this.view.control.confirm.disabled = false;
				this.setLoading(false);
			} else {
				if (date) {
					this.setLoading(true);
					await api.home(date);
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
	 * Render handler
	 * @param 	{ScheduleWeekRow[]}		data
	 */
	render(data, {
		force = false
	} = {}) {
		if (!this.loaded)
			return;

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

		let needUpdate = force
			|| this.currentRenderer !== renderer
			|| newData
			|| this.activeScreen !== this.currentScreen
			|| this.activeWeekday !== this.currentWeekday;

		// Only re-render when render mode changed or we have
		// updated data to render
		if (needUpdate) {
			this.log("DEBG", `render(${renderer}): re-rendering`, `(force: ${force})`);
			emptyNode(this.view.list);

			/** @type {ScheduleWeekRow[]} */
			let renderData = Array();
			
			if (this.currentScreen === "my") {
				let classIDs = this.getClassID();

				if (classIDs.length > 0) {
					for (let item of data) {
						let rows = Array();

						for (let row of item.rows) {
							if (typeof row.classID !== "object" || !row.classID.length)
								continue;

							let match = false;
							for (let id of row.classID) {
								if (classIDs.includes(id)) {
									match = true;
									break;
								}
							}

							if (match)
								rows.push(row);
						}

						if (rows.length > 0) {
							renderData.push({
								time: item.time,
								date: item.date,
								dateString: item.dateString,
								weekDay: item.weekDay,
								rows
							});
						}
					}
				} else {
					this.view.list.appendChild(this.emptyClassIDsNotice);
					this.activeScreen = this.currentScreen;

					return;
				}
			} else {
				renderData = data;
			}

			// In home screen, we filter to only display selected date
			if (this.currentScreen === "home" && this.currentWeekday !== "all")
				renderData = renderData.filter((i) => i.weekDay === this.currentWeekday);

			if (renderer === "table")
				this.view.list.appendChild(core.screen.schedule.renderTable(renderData));
			else
				this.view.list.appendChild(core.screen.schedule.renderList(renderData));

			this.currentRenderer = renderer;
			this.activeScreen = this.currentScreen;
			this.activeWeekday = this.currentWeekday;
			this.view.control.dataset.render = renderer;
			this.view.control.dataset.screen = this.currentScreen;
		}
	}
}

core.screen = {
	...core.screen,

	home: HomeScreen
}