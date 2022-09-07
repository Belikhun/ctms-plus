//? |-----------------------------------------------------------------------------------------------|
//? |  /static/js/api.js                                                                            |
//? |                                                                                               |
//? |  Copyright (c) 2021 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

/**
 * This object contains CTMS api used to communicate
 * with the CTMS backend
 * 
 * Because CTMS don't have a proper api endpoint so we will need
 * to crawl the data from the response html, which will require
 * converting raw html into dom object
 * 
 * To minimize API call and reduce load on CTMS's server, we designed
 * a event-based api call. Which mean anything that need a certain data
 * from a specific api an register a listener that will be called
 * when the request is complete. You can register your listener with
 * `api.onResponse(<type>, <listener>)`
 * 
 * @author	Belikhun
 * @version	1.0
 */
const api = {
	/**
	 * Sepcial function to override default function `myajax`
	 * to request to specified path.
	 * @type {(APIRequest) => Promise<APIResponse>}
	 */
	requester: undefined,

	HOST: `http://ctms.fithou.net.vn`,
	MIDDLEWARE: `http://localhost`,

	__PATH: undefined,

	/**
	 * Store Current Viewstate
	 * @type {String}
	 */
	__VIEWSTATE: undefined,

	/**
	 * Store Current Viewstate Generator
	 * @type {String}
	 */
	__VIEWSTATEGENERATOR: undefined,

	/**
	 * Store Validator String to validate user event (idk)
	 * @type {String}
	 */
	__EVENTVALIDATION: undefined,

	/**
	 * @typedef		ResponseHandler
	 * @type		{Object}
	 * @property	{Function}		handler
	 * @property	{Boolean}		lock
	 */

	/** 
	 * Store API handlers
	 * @type {Object.<string, ResponseHandler[]>}
	 */
	responseHandlers: {},

	/**
	 * Regiter on reponse handler that will be triggered when an
	 * API call is completed.
	 * @param	{String}				type
	 * @param	{(response: Object)}	f
	 * @param	{{ lock: Boolean }}		options
	 */
	onResponse(type, f, { lock = false } = {}) {
		if (typeof f !== "function")
			throw { code: -1, description: `api.onResponse(${type}): not a valid function` }

		if (this.responseHandlers[type] === null || typeof this.responseHandlers[type] !== "object")
			this.responseHandlers[type] = []

		this.responseHandlers[type].push({
			handler: f,
			lock
		});
	},

	async __handleResponse(type, data) {
		if (this.responseHandlers[type] === null || typeof this.responseHandlers[type] !== "object" || this.responseHandlers[type].length === 0) {
			clog("WARN", `api.__handleResponse(${type}): no handler found`);
			return;
		}

		for (let item of this.responseHandlers[type]) {
			if (item.lock)
				await item.handler(data);
			else
				item.handler(data);
		}
	},

	/**
	 * Perform a HTTP request through middleware
	 * 
	 * @typedef		APIResponse
	 * @type		{Object}
	 * @property	{String}			path		Request Path
	 * @property	{DocumentFragment}	dom			DOM Object
	 * @property	{Number}			c2m			Time taken client -> middleware
	 * @property	{Number}			time		Total processing time in middleware
	 * @property	{Object[]}			headers		Response header from target
	 * @property	{Object[]}			sentHeaders	Headers sent to target
	 * @property	{String}			response	Raw response
	 * @property	{String}			session		Session
	 * 
	 * @param		{APIRequest}				options
	 * @returns		{Promise<APIResponse>}		API Response Object
	 */
	async request({
		path = "",
		method = "GET",
		query,
		form,
		json,
		header = {},
		target = "",
		argument = "",
		renewSession = false,
		ignoreAnnouncement = false
	} = {}) {
		if (method === "POST") {
			form.__EVENTTARGET = target;
			form.__EVENTARGUMENT = argument;

			if (this.__VIEWSTATE && !form.__VIEWSTATE) {
				form.__VIEWSTATE = this.__VIEWSTATE;
				form.__VIEWSTATEGENERATOR = this.__VIEWSTATEGENERATOR;
				form.__EVENTVALIDATION = this.__EVENTVALIDATION;
			}
		}
		
		this.__PATH = path;
		let start = new StopClock();
		let response;
		
		try {
			if (typeof this.requester === "function") {
				response = await this.requester(arguments[0]);
			} else {
				response = await myajax({
					url: `${this.MIDDLEWARE}/api/middleware`,
					method,
					header: {
						"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
						"Session-Cookie-Key": "ASP.NET_SessionId",
						"Session-Cookie-Value": localStorage.getItem("session") || "",
						"Set-Host": "ctms.fithou.net.vn",
						"Set-Origin": this.HOST,
						"Set-Referer": `${this.HOST}${path}`,
						"Upgrade-Insecure-Requests": 1,
						...header
					},
					query: {
						url: `${this.HOST}${path}`,
						...query
					},
					form,
					json,
					withCredentials: true,
					formEncodeURL: true
				});
			}
		} catch(error) {
			if (error.data) {
				error.c2m = start.tick() - error.data.runtime;
				await this.__handleResponse("error", error);

				// Check maintain mode
				if (error.data.status === 503 && error.data.data && error.data.data.response) {
					let dom = document.createElement("template");
					dom.innerHTML = error.data.data.response;

					throw { code: -1, description: `api.request(): CTMS đang bảo trì!`, data: {
						code: -1,
						description: dom.content.querySelector("h1").innerText
					}}
				}
	
				throw error;
			} else {
				error.c2m = start.tick();
				await this.__handleResponse("error", error);
				throw { code: -1, description: `api.request(${path}): invalid middleware response (middleware: ${this.MIDDLEWARE})`, data: error }
			}
		}

		if (response.data.session) {
			clog("DEBG", `api.request(${path}): session`, { text: response.data.session, color: oscColor("blue") });
			localStorage.setItem("session", response.data.session);
		}

		let dom = document.createElement("template");
		dom.innerHTML = response.data.response;

		// Check No Permission Page
		if (dom.content.querySelector(".NoPermission")) {
			if (!renewSession)
				throw { code: -1, description: `Phiên làm việc hết hạn hoặc bạn không có quyền truy cập chức năng này!` }

			clog("WARN", `api.request(${path}): session expired! requesting new session`);
			localStorage.removeItem("session");
			localStorage.removeItem("session.username");
			return await this.request(arguments[0]);
		}

		let __vs = dom.content.getElementById("__VIEWSTATE");
		let __vsg = dom.content.getElementById("__VIEWSTATEGENERATOR");
		let __ev = dom.content.getElementById("__EVENTVALIDATION");

		if (__vs && __vs.value !== "") {
			clog("DEBG", `api.request(${path}): update __VIEWSTATE`, { text: truncateString(__vs.value, 60), color: oscColor("pink") });
			this.__VIEWSTATE = __vs.value;
		}

		if (__vsg && __vsg.value !== "") {
			clog("DEBG", `api.request(${path}): update __VIEWSTATEGENERATOR`, { text: __vsg.value, color: oscColor("pink") });
			this.__VIEWSTATEGENERATOR = __vsg.value;
		}

		if (__ev && __ev.value !== "") {
			clog("DEBG", `api.request(${path}): update __EVENTVALIDATION`, { text: __ev.value, color: oscColor("pink") });
			this.__EVENTVALIDATION = __ev.value;
		}

		// Update logout state for home page
		if (path === "" || path === "/") {
			this.__LOGOUT_VIEWSTATE = this.__VIEWSTATE;
			this.__LOGOUT_VIEWSTATEGENERATOR = this.__VIEWSTATEGENERATOR;
		}

		// Check for forced change password
		if (dom.content.getElementById("LeftCol_UsersChangePassword1_lblUser")) {
			try {
				this.logout();
			} catch(e) {
				// Nothing needed here.
			}

			throw { code: -1, description: `api.request(${path}): CTMS yêu cầu bạn thay đổi mật khẩu, vui lòng thực hiện hành động này trên trang chủ của CTMS` }
		}

		// Check for announcement
		if (!ignoreAnnouncement) {
			let ann = dom.content.getElementById("thongbao");

			if (ann) {
				await popup.show({
					windowTitle: "Thông Báo",
					title: "Thông Báo",
					icon: "horn",
					bgColor: "blue",
					message: `api.request`,
					description: `${method} ${path}`,
					customNode: ann,
					buttonList: {
						close: { text: "ĐÓNG", color: "blue" }
					}
				});
			}
		}

		// Check for survey
		if (response.data.response.includes("sát ý kiến sinh viên")) {
			let msg = `Bạn cần hoàn thành <b>Khảo Sát Ý Kiến Sinh Viên</b> về hoạt động giảng dạy của giảng viên để có thể tiếp tục sử dụng CTMS`;

			await popup.show({
				windowTitle: "Thông Báo",
				title: "Thông Báo",
				icon: "horn",
				bgColor: "blue",
				message: `Khảo Sát`,
				description: msg,
				buttonList: {
					survey: {
						text: "KHẢO SÁT",
						color: "green",
						onClick: () => window.open("http://dbcl.hou.edu.vn/cntt", "_blank"),
						resolve: false
					},

					close: { text: "ĐÓNG", color: "blue" }
				}
			});

			throw { code: 101, description: msg }
		}

		let data = {
			path,
			dom: dom.content,
			c2m: start.tick() - response.runtime,
			...response.data
		}

		await this.__handleResponse("global", data);
		return data;
	},

	/**
	 * Đăng nhập vào CTMS với tài khoản và mật khẩu được đưa vào
	 * 
	 * @param		{Object}		credentials
	 * @param		{String}		credentials.username		Tên người dùng/email
	 * @param		{String}		credentials.password		Mật khẩu
	 * @returns		{Promise<APIResponse>}
	 */
	async login({
		username,
		password
	} = {}) {
		if (typeof username !== "string" || typeof password !== "string")
			throw { code: -1, description: `api.login(): invalid username or password` }

		let response = await this.request({
			path: "/login.aspx",
			method: "POST",
			form: {
				ctl00$LeftCol$UserLogin1$txtUsername: username,
				ctl00$LeftCol$UserLogin1$txtPassword: md5(password),
				ctl00$LeftCol$UserLogin1$btnLogin: "Đăng nhập"
			}
		});

		localStorage.setItem("session.username", username);
		await this.__handleResponse("login", response);
		return response;
	},

	// States used to perform logout call
	__LOGOUT_VIEWSTATE: undefined,
	__LOGOUT_VIEWSTATEGENERATOR: undefined,

	/**
	 * Đăng xuất khỏi tài khoản hiện tại
	 */
	async logout() {
		if (!this.__LOGOUT_VIEWSTATE || !this.__LOGOUT_VIEWSTATEGENERATOR)
			throw { code: -1, description: `api.logout(): cannot perform a logout without viewstate data` }

		let response = await this.request({
			method: "POST",
			form: {
				...this.__LOGOUT_FORM,
				__VIEWSTATE: this.__LOGOUT_VIEWSTATE,
				__VIEWSTATEGENERATOR: this.__LOGOUT_VIEWSTATEGENERATOR,
				__EVENTVALIDATION: this.__LOGOUT_EVENTVALIDATION,
				"__CALLBACKID": "ctl00$QuanlyMenu1",
				"__CALLBACKPARAM": "logout"
			}
		});

		this.reset();
		await this.__handleResponse("logout", response);

		return response;
	},

	/**
	 * Chuyển điểm hệ số 10 sang hệ số 4 và xếp loại
	 * @param 	{Number}		average
	 * @return	{ResultGrade}
	 */
	resultGrading(average) {
		let point = 0;
		let letter = "?";
		let color = "dark";
		let passed = true;

		if (average >= 9.5) {
			point = 4.0;
			letter = "A+";
			color = "green";
		} else if (average >= 8.5) {
			point = 4.0;
			letter = "A";
			color = "green";
		} else if (average >= 8.0) {
			point = 3.5;
			letter = "B+";
			color = "blue";
		} else if (average >= 7.0) {
			point = 3.0;
			letter = "B";
			color = "blue";
		} else if (average >= 6.5) {
			point = 2.5;
			letter = "C+";
			color = "yellow";
		} else if (average >= 5.5) {
			point = 2.0;
			letter = "C";
			color = "yellow";
		} else if (average >= 5.0) {
			point = 1.5;
			letter = "D+";
			color = "orange";
		} else if (average >= 4.0) {
			point = 1.0;
			letter = "D";
			color = "orange";
		} else {
			point = 0;
			letter = "F";
			color = "red";
			passed = false;
		}

		return { point, letter, color, passed }
	},

	/**
	 * Calculate result data from list of results
	 * @param	{Result[]}	results
	 */
	processResults(results) {
		let grade;
		let count = 0;
		let totalCPA = 0;
		let totalPoint = 0;
		let credits = 0;

		for (let result of results) {
			if (result.grade && result.grade.passed && !result.ignored) {
				totalCPA += result.grade.point * result.credits;
				credits += result.credits;
				totalPoint += result.average;
				count++;
			}
		}

		let average = totalPoint / count;
		let cpa = totalCPA / credits;

		if (cpa >= 3.6)
			grade = "Xuất Sắc";
		else if (cpa >= 3.2)
			grade = "Giỏi";
		else if (cpa >= 2.5)
			grade = "Khá";
		else if (cpa >= 2)
			grade = "Trung Bình";
		else
			grade = "Yếu";

		return {
			average,
			credits,
			cpa,
			grade
		}
	},

	/**
	 * Lấy kết quả học tập của sinh viên kèm theo thông tin cơ bản
	 * @returns		{Promise<APIResponse & Results>}
	 */
	async results() {
		let response = await this.request({
			path: "/KetquaHoctap.aspx",
			method: "GET"
		});

		response.info = {
			name: response.dom.querySelector(`#leftcontent > table.ThongtinSV > tbody > tr:nth-child(1) > td:nth-child(2)`).innerText.replace(":\n", "").trim().replace("  ", " "),
			birthday: response.dom.querySelector(`#leftcontent > table.ThongtinSV > tbody > tr:nth-child(1) > td:nth-child(4)`).innerText.replace(":\n", "").trim().replace("  ", " "),
			tForm: response.dom.querySelector(`#leftcontent > table.ThongtinSV > tbody > tr:nth-child(2) > td:nth-child(2)`).innerText.replace(":\n", "").trim().replace("  ", " "),
			studentID: response.dom.querySelector(`#leftcontent > table.ThongtinSV > tbody > tr:nth-child(2) > td:nth-child(4)`).innerText.replace(":\n", "").trim().replace("  ", " "),
			faculty: response.dom.querySelector(`#leftcontent > table.ThongtinSV > tbody > tr:nth-child(3) > td:nth-child(2)`).innerText.replace(":\n", "").trim().replace("  ", " "),
			department: response.dom.querySelector(`#leftcontent > table.ThongtinSV > tbody > tr:nth-child(3) > td:nth-child(4)`).innerText.replace(":\n", "").trim().replace("  ", " "),
			course: response.dom.querySelector(`#leftcontent > table.ThongtinSV > tbody > tr:nth-child(4) > td:nth-child(2)`).innerText.replace(":\n", "").trim().replace("  ", " "),
			classroom: response.dom.querySelector(`#leftcontent > table.ThongtinSV > tbody > tr:nth-child(4) > td:nth-child(4)`).innerText.replace(":\n", "").trim().replace("  ", " "),
			mode: response.dom.getElementById("leftcontent").childNodes.item(2).wholeText.trim().replace("\n", " "),
			results: [],
			average: 0,
			cpa: 0,
			credits: 0,
			grade: "Yếu"
		}

		let resultTableRows = [ ...response.dom.querySelectorAll(`#leftcontent > table.RowEffect.CenterElement > tbody > tr`) ]

		let __procPoint = (node) => {
			let v = node.innerText.trim();

			if (v === "")
				return undefined;

			return (v === "?")
				? "?"
				: parseFloat(v);
		}

		// Encountered subjects to check for re-attempts of subjects
		let encountered = {}

		for (let row of resultTableRows) {
			let data = {
				subject: row.children[0].innerText.trim(),
				credits: parseInt(row.children[1].innerText.trim()),
				classID: row.children[2].innerText.trim(),
				teacher: row.children[3].innerText.trim(),
				diemCC: __procPoint(row.children[4]),
				diemDK: __procPoint(row.children[5]),
				diemHK: __procPoint(row.children[6]),
				rawAverage: undefined,
				average: undefined,
				grade: undefined,
				ignored: false

				// We will add note later as currently we don't
				// know what kind of data goes in here
				// note: row.children[7].innerText.trim()
			}

			if (typeof data.diemCC === "number" && typeof data.diemDK === "number" && typeof data.diemHK === "number") {
				data.rawAverage = data.diemCC * 0.1 + data.diemDK * 0.2 + data.diemHK * 0.7;
				data.average = round(round(data.rawAverage, 2), 1);
				data.grade = this.resultGrading(data.average);
			}

			let index = response.info.results.push(data) - 1;
			let iden = data.subject.toLowerCase();

			// Check for subject re-attempts. Based on average score (for now)
			// but this will work in most cases because a re-attempt should have
			// a higher score or you have f-ed up.
			if (data.average) {
				if (!encountered[iden]) {
					encountered[iden] = {
						index,
						average: data.average
					}
				} else {
					if (encountered[iden].average > data.average) {
						data.ignored = true;
					} else {
						response.info.results[encountered[iden].index].ignored = true;
						encountered[iden] = { index, average: data.average }
					}
				}
			}
		}

		response.info = Object.assign(
			response.info,
			this.processResults(response.info.results)
		);

		await this.__handleResponse("results", response);
		return response;
	},

	/**
	 * Lấy danh sách dịch vụ và tình trạng đăng kí các dịch vụ
	 */
	async services() {
		let response = await this.request({
			path: "/services/BuyServices.aspx",
			method: "GET"
		});

		let dvList = [ ...response.dom.querySelectorAll("div.dichvu") ]
			.map(e => {
				let s = e.children[2]

				if (s && s.title !== "") {
					let t = s.title
						.substring(1, s.title.length - 1)
						.split("-")
						.map(i => {
							let t = /(\d+)\/(\d+)\/(\d+) (\d+)\:(\d+)/gm.exec(i);
							return new Date(t[3], parseInt(t[2]) - 1, t[1], t[4], t[5]);
						});

					return {
						from: t[0],
						to: t[1]
					}
				} else
					return null;
			});

		response.info = {
			email: response.dom.querySelector(`#LeftCol_MuaDichVu1_pnWrapperModule > table > tbody > tr:nth-child(1) > td:nth-child(2)`).innerText.trim(),
			occ: response.dom.querySelector(`#LeftCol_MuaDichVu1_pnWrapperModule > table > tbody > tr:nth-child(2) > td:nth-child(2)`).innerText.trim(),

			services: {
				basicAccess: dvList[0],
				unverifiedScore: dvList[1],
				payAsk: dvList[2],
				coupleCheckIn: dvList[3],
				shortAccess: dvList[4]
			}
		}

		await this.__handleResponse("services", response);
		return response;
	},

	// For current home page viewstate, we can use them if
	// global viewstate is being changed by another api
	// request
	__HOME_VIEWSTATE: undefined,
	__HOME_VIEWSTATEGENERATOR: undefined,
	__HOME_EVENTVALIDATION: undefined,
	__HOME_DATE: undefined,

	/**
	 * Lấy dữ liệu của trang chủ CTMS, trang này bao gồm lịch học chung của toàn khoa
	 * 
	 * @param		{Date}					date	Thời gian trong tuần cần xem
	 * @return		{Promise<APIResponse & Home>}
	 */
	async home(date) {
		/** @type {APIResponse & Home} */
		let response;

		if (typeof date !== "undefined") {
			this.__HOME_DATE = `${date.getFullYear()}-${pleft(date.getMonth() + 1, 2)}-${date.getDate()}`;

			response = await this.request({
				path: "/index.aspx",
				method: "POST",
				form: {
					__VIEWSTATE: this.__HOME_VIEWSTATE,
					__VIEWSTATEGENERATOR: this.__HOME_VIEWSTATEGENERATOR,
					__EVENTVALIDATION: this.__HOME_EVENTVALIDATION,
					"ctl00$LeftCol$ThoikhoabieuWeekView1$ddlCosoDaotao": 0,
					"ctl00$LeftCol$ThoikhoabieuWeekView1$cboKhunggio": 0,
					"ctl00$LeftCol$ThoikhoabieuWeekView1$txtNgaydautuan": this.__HOME_DATE,
					"ctl00$LeftCol$ThoikhoabieuWeekView1$btnOK": "Xem thời khóa biểu",
					"ctl00$LeftCol$ThoikhoabieuWeekView1$ddlKhunggio2": 1,
					"ctl00$LeftCol$ThoikhoabieuWeekView1$txtNgay2": "",
					"ctl00$LeftCol$ThoikhoabieuWeekView1$txtTongsoBuoihoc": "",
					"ctl00$LeftCol$ThoikhoabieuWeekView1$txtKhoangcach": 7,
					"ctl00$LeftCol$ThoikhoabieuWeekView1$txtNgay4Edit": ""
				}
			});
		} else {
			response = await this.request({
				path: "/index.aspx",
				method: "GET"
			});
		}

		// Update current home viewstate
		this.__HOME_VIEWSTATE = this.__VIEWSTATE;
		this.__HOME_VIEWSTATEGENERATOR = this.__VIEWSTATEGENERATOR;
		this.__HOME_EVENTVALIDATION = this.__EVENTVALIDATION;

		// Parse week start date displayed in the input
		response.date = null;
		let dateInput = response.dom.getElementById(`LeftCol_ThoikhoabieuWeekView1_txtNgaydautuan`);
		if (dateInput) {
			dateInput = dateInput.value.split("-");
			response.date = new Date(dateInput[0], dateInput[1] - 1, dateInput[2], 0, 0, 0);
		}

		// Get main table DOM Object
		let table = response.dom.getElementById("LeftCol_ThoikhoabieuWeekView1_grvThoikhoabieu");

		/** @type {ScheduleWeekRow[]} */
		response.info = Array();

		// Parse first row to get current week's day
		let header = [ ...table.querySelectorAll(`:scope > tbody > tr:first-child > th`) ];
		header.shift();

		for (let column of header) {
			/** @type {String[]} */
			let tokens = /([^0-9]+)(\d+\/\d+\/\d+)/gm.exec(column.innerText.trim());

			// Invalid format, we will skip it for now.
			// Valid format for example: Thứ hai01/11/2021
			if (!tokens)
				continue;

			let timeToken = tokens[2].split("/");
			let date = new Date(timeToken[2], timeToken[1] - 1, timeToken[0]);

			response.info.push({
				dateString: tokens[2],
				weekDay: tokens[1],
				date,
				time: `${tokens[2]} ${tokens[1]}`,
				rows: Array()
			});
		}

		// Parse each row to get schedule data, row contains subjects for each classroom
		let classroomRows = table.querySelectorAll(`:scope > tbody > tr:not(:first-child)`);

		for (let classroomRow of classroomRows) {
			let classroom = classroomRow.children[0].innerText.trim();

			for (let i = 1; i < classroomRow.children.length; i++) {
				if (typeof response.info[i - 1] === "undefined")
					continue;

				let timeToken = response.info[i - 1].dateString.split("/");
				let cell = classroomRow.children[i];
				let subjects = cell.querySelectorAll(`:scope > table`);

				for (let subject of subjects) {
					let tokens = subject.querySelectorAll(`:scope > tbody > tr > td`);
					let rowTime = tokens[0].innerText.trim().replace(" ->", " -> ").split(" -> ");
					let timeStartToken = rowTime[0].split(":");
					let timeEndToken = rowTime[1].split(":");
					let startDate = new Date(timeToken[2], timeToken[1] - 1, timeToken[0], timeStartToken[0], timeStartToken[1]);
					let endDate = new Date(timeToken[2], timeToken[1] - 1, timeToken[0], timeEndToken[0], timeEndToken[1]);

					// Parse subject (this can be null, ffs)
					let subjectName = (tokens[1].children.length !== 0)
						? `${tokens[1].children[0].title} (${tokens[1].innerText.trim()})`
						: null;

					response.info[i - 1].rows.push({
						time: rowTime,
						date: [startDate, endDate],
						classroom,
						subject: subjectName,
						teacher: tokens[2].innerText.trim(),
						classID: tokens[3].innerHTML.trim()
							.replace(/\[|\]/g, "")
							.split("<br>"),
						status: tokens[4].innerText.trim(),
						listID: null,
						noteID: null
					});
				}
				
				// Sort by start time
				response.info[i - 1].rows.sort((a, b) => a.date[0] - b.date[0]);
			}
		}

		await this.__handleResponse("home", response);
		return response;
	},

	// For current schedule viewstate, we can use them if
	// global viewstate is being changed by another api
	// request
	__SCHEDULE_VIEWSTATE: undefined,
	__SCHEDULE_VIEWSTATEGENERATOR: undefined,
	__SCHEDULE_EVENTVALIDATION: undefined,
	__SCHEDULE_DATE: undefined,

	/**
	 * Lấy lịch học với ngày đầu tuần (hoặc ngày trong tuần) cho trước
	 * 
	 * @param		{Date}							date 		Thời gian trong tuần cần xem
	 * @param		{{ triggerEvents: Boolean }}	options	
	 * @returns		{Promise<APIResponse & Schedule>}
	 */
	async schedule(date, { triggerEvents = true } = {}) {
		/** @type {APIResponse & Schedule} */
		let response;

		if (typeof date !== "undefined") {
			this.__SCHEDULE_DATE = `${date.getFullYear()}-${pleft(date.getMonth() + 1, 2)}-${date.getDate()}`;

			response = await this.request({
				path: "/Lichhoc.aspx",
				method: "POST",
				form: {
					__VIEWSTATE: this.__SCHEDULE_VIEWSTATE,
					__VIEWSTATEGENERATOR: this.__SCHEDULE_VIEWSTATEGENERATOR,
					__EVENTVALIDATION: this.__SCHEDULE_EVENTVALIDATION,
					ctl00$LeftCol$Lichhoc1$txtNgaydautuan: this.__SCHEDULE_DATE,
					ctl00$LeftCol$Lichhoc1$btnXemlich: "Xem lịch"
				}
			});
		} else {
			response = await this.request({
				path: "/Lichhoc.aspx",
				method: "GET"
			});

			this.__SCHEDULE_DATE = response.dom.getElementById("LeftCol_Lichhoc1_txtNgaydautuan").value;
		}

		// Update current schedule viewstate
		this.__SCHEDULE_VIEWSTATE = this.__VIEWSTATE;
		this.__SCHEDULE_VIEWSTATEGENERATOR = this.__VIEWSTATEGENERATOR;
		this.__SCHEDULE_EVENTVALIDATION = this.__EVENTVALIDATION;

		// Parse week start date displayed in the input
		response.date = null;
		let dateInput = response.dom.getElementById(`LeftCol_Lichhoc1_txtNgaydautuan`);
		if (dateInput) {
			dateInput = dateInput.value.split("-");
			response.date = new Date(dateInput[0], dateInput[1] - 1, dateInput[2], 0, 0, 0);
		}

		// Check if there is Tuition bill alert in the document.
		response.billAlert = !!response.dom.getElementById("LeftCol_pnlMessage");

		// Parse schedule table
		// The loop from 0 to 8 is just to make sure we parse all table
		// that exists on the page, unexpected behaviour may occured.
		response.info = Array();
		for (let i = 0; i <= 8; i++) {
			let table = response.dom.getElementById(`LeftCol_Lichhoc1_rptrLichhoc_grvLichhoc_${i}`);

			if (!table)
				continue;

			let time = table.parentElement.parentElement.children[0].innerText
				.replaceAll("\n", "")
				.replace(/\s\s+/g, " ")
				.trim();

			let dateString = time.split(" ").pop();
			let weekDay = time.replace(` ${dateString}`, "");
			let timeToken = dateString.split("/");
			let date = new Date(timeToken[2], timeToken[1] - 1, timeToken[0]);
			let item = { time, date, dateString, weekDay, rows: [] }
			let rows = table.querySelectorAll(`tbody > tr:not(:first-child)`);
			
			for (let row of [ ...rows ]) {
				let classCol = row.children[5].innerHTML.trim().split("<br>");
				let checkInID = undefined;

				let noteID = null;
				let note = row.children[6].querySelector(":scope > span > a[href]");
				let rowTime = row.children[1].innerText.trim().replace(" ->", " -> ").split(" -> ");
				let timeStartToken = rowTime[0].split(":");
				let timeEndToken = rowTime[1].split(":");
				let startDate = new Date(timeToken[2], timeToken[1] - 1, timeToken[0], timeStartToken[0], timeStartToken[1]);
				let endDate = new Date(timeToken[2], timeToken[1] - 1, timeToken[0], timeEndToken[0], timeEndToken[1]);

				if (note && note.children[0] && note.children[0].title === "Đã có ghi chú") {
					let noteRe = /javascript:getNote\((\d+)\);/gm.exec(note.href);

					if (noteRe)
						noteID = parseInt(noteRe[1]);
				}

				// Check for check-in list link.
				let checkInTest = /InDsDiemdanh\.aspx\?loptcID=(\d+)\" title=""\>([^<>]+)\<\/a>/gm.exec(classCol[0]);
				if (checkInTest) {
					classCol[0] = checkInTest[2];
					checkInID = parseInt(checkInTest[1]);
				}

				item.rows.push({
					time: rowTime,
					date: [startDate, endDate],
					classroom: row.children[2].innerText.trim(),
					subject: row.children[3].innerText.trim(),
					teacher: row.children[4].innerText.trim(),
					classID: classCol[0],
					listID: classCol[1],
					checkInID,
					status: row.children[6].innerText.trim(),
					noteID
				});
			}

			response.info.push(item);
		}

		if (triggerEvents)
			await this.__handleResponse("schedule", response);
		
		return response;
	},

	/**
	 * Lấy ghi chú với id cho trước
	 * 
	 * @param	{Number}	id	Note ID
	 * @returns	{Promise<APIResponse & ScheduleNote>}
	 */
	async getNote(id) {
		if (!this.__SCHEDULE_DATE || !this.__SCHEDULE_EVENTVALIDATION)
			throw { code: -1, description: `api.getNote(): a prefetch request to api.schedule() is required to use this api` }

		let response = await this.request({
			path: "/Lichhoc.aspx",
			method: "POST",
			form: {
				__VIEWSTATE: this.__SCHEDULE_VIEWSTATE,
				__VIEWSTATEGENERATOR: this.__SCHEDULE_VIEWSTATEGENERATOR,
				__EVENTVALIDATION: this.__SCHEDULE_EVENTVALIDATION,
				__CALLBACKID: "ctl00$LeftCol$Lichhoc1",
				__CALLBACKPARAM: `get-note$${id}`,
				ctl00$LeftCol$Lichhoc1$txtNgaydautuan: "2021-07-12"
			}
		});

		// Remove strage string at the begining
		let hashLength = parseInt(response.response.split("|")[0]);
		let cleanRes = response.response
			.replace(`${hashLength}|`, "")
			.substring(hashLength);

		response.data = { content: cleanRes }
		await this.__handleResponse("getNote", response);
		return response;	
	},

	/**
	 * Lấy danh sách điểm danh với id cho trước
	 * @param	{Number}	id			Class ID
	 * @param	{String}	studentID	Student ID for extra data validation
	 * @returns	{Promise<APIResponse & CheckIn>}
	 */
	async getCheckIn(id, studentID) {
		let response = await this.request({
			path: `/InDsDiemdanh.aspx?loptcID=${id}`,
			method: "GET"
		});

		/** @type {HTMLTableRowElement} */
		let row;
		let table = response.dom.querySelector("table.CenterElement");

		if (!table)
			throw { code: -1, description: `api.getCheckIn(): could not find target table!` }

		// If Student ID is supplied, find row for that ID,
		// else we will just need the first row.
		if (studentID) {
			let rows = table.querySelectorAll(":scope > tbody > tr");

			for (let r of rows) {
				if (r.children[1].innerText.trim() === studentID) {
					row = r;
					break;
				}
			}
		} else {
			row = table.querySelector(":scope > tbody > tr");
		}

		if (!row)
			throw { code: -1, description: `api.getCheckIn(${studentID || ""}): could not find matching row data` }

		// Length is total column minus first 7 columns.
		let checkInLength = row.children.length - 7;
		let checkIn = []

		for (let i = 0; i < checkInLength; i++) {
			// For now we don't have any idea what goes in here, so pass in
			// unknown item.
			checkIn.push({
				status: "unknown",
				label: "?"
			});
		}

		response.data = {
			nth: parseInt(row.children[0].innerText),
			healthDeclared: row.children[6].children[0].checked,
			checkIn
		}

		return response;
	},

	// For current tests viewstate, we can use them if
	// global viewstate is being changed by another api
	// request
	__TESTS_VIEWSTATE: undefined,
	__TESTS_VIEWSTATEGENERATOR: undefined,
	__TESTS_EVENTVALIDATION: undefined,

	/**
	 * API Lấy lịch thi
	 * 
	 * @param	{"all" | "ended" | "coming"}	type
	 * Loại danh sách cần lấy. Chấp nhận:
	 * + `all`:		Tất cả
	 * + `ended`:	Đã thi/Đã kết thúc
	 * + `coming`:	Sắp thi
	 */
	async tests(type) {
		let option = {
			all: "rbtnTatca",
			ended: "rbtnDathi",
			coming: "rbtnChuathi"
		}[type]

		// If viewstate for tests page haven't been set, that's mean
		// we will have to make a prefetch request first in order
		// to update current viewstate
		if (!this.__TESTS_VIEWSTATE) {
			clog("DEBG", "api.tests(): Starting prefetch request");
			await this.request({ path: `/Lichthi.aspx` });

			this.__TESTS_VIEWSTATE = this.__VIEWSTATE;
			this.__TESTS_VIEWSTATEGENERATOR = this.__VIEWSTATEGENERATOR;
			this.__TESTS_EVENTVALIDATION = this.__EVENTVALIDATION;
		}

		let response = await this.request({
			path: `/Lichthi.aspx`,
			method: "POST",
			form: {
				__VIEWSTATE: this.__TESTS_VIEWSTATE,
				__VIEWSTATEGENERATOR: this.__TESTS_VIEWSTATEGENERATOR,
				__EVENTVALIDATION: this.__TESTS_EVENTVALIDATION,
				ctl00$LeftCol$Lichthi1$Tuychon: option,
				ctl00$LeftCol$Lichthi1$btnHien: "   Hiện   "
			}
		});

		let list = []
		let curTime = time();
		let rows = response.dom.querySelectorAll(`#leftcontent > table > tbody > tr:not(:first-child)`);
		for (let row of rows) {
			let time = row.children[1].innerText.trim();
			time = /(\d+)\:(\d+) (\d+)\/(\d+)\/(\d+)/gm.exec(time);

			/** @type {Date} */
			time = new Date(time[5], parseInt(time[4]) - 1, time[3], time[1], time[2]);

			list.push({
				status: ((time.getTime() / 1000) < curTime)
					? "ended"
					: "coming",

				time,
				classroom: row.children[2].innerText.trim(),
				subject: row.children[3].innerText.trim(),
				listID: row.children[4].innerText.trim()
			});
		}

		// Sort list by start time
		list = list.sort((a, b) => b.time - a.time);
		response.list = list;

		await this.__handleResponse("tests", response);
		return response;
	},

	// For current subscribe viewstate, we can use them if
	// global viewstate is being changed by another api
	// request
	__SUBS_VIEWSTATE: undefined,
	__SUBS_VIEWSTATEGENERATOR: undefined,
	__SUBS_EVENTVALIDATION: undefined,
	__SUBS_STUDENTID: undefined,

	/**
	 * Parse Subscribe Entries
	 * @param	{HTMLTableElement}	node
	 * @returns	{SubscribeEntry[]}
	 */
	parseSubscribe(node) {
		let rows = node.querySelectorAll(":scope > tbody > tr:not(:first-child)");
		let items = []

		// Determine if the action column (where status and subscribe button belong)
		// is hidden, because of current student haven't paid all the required tuition
		let checkNoAction = node.querySelector(":scope > tbody > tr:first-child > th:first-child");
		let isNoAction = false;
		if (checkNoAction.innerText.trim() === "Tên lớp")
			isNoAction = true;

		for (let row of rows) {
			let item = {
				expired: false,
				isFull: false,
				classID: undefined,
				subject: undefined,
				teacher: undefined,
				credits: undefined,
				tuition: undefined,
				minimum: undefined,
				maximum: undefined,
				subscribed: undefined,
				schedule: [],
				classroom: [],
				action: {
					command: undefined,
					data: undefined,
					classID: undefined
				},
				date: {
					start: undefined,
					end: undefined,
					cancel: undefined
				}
			}

			// This is a hacky trick to shift column index in order
			// to prevent duplicate code
			let cellStart = isNoAction ? -1 : 0;

			if (!isNoAction) {
				// Parse first cell
				let firstCell = row.children[0];
				
				if (firstCell.innerText.includes("Hết hạn ĐK"))
					item.expired = true;
	
				if (firstCell.innerText.includes("Hết chỉ tiêu"))
					item.isFull = true;
	
				let actionBtn = firstCell.querySelector(":scope > a[href]");
				if (actionBtn) {
					// Test subscribe button
					let sub = /javascript:subcrible\((\d+)\, (\d+), (\d+)\)/gm.exec(actionBtn.href);
					if (sub) {
						item.action.command = "subscribe";
						item.action.classID = parseInt(sub[1]);
					}
	
					// Test unsubscribe button
					let unsub = /javascript:unSubcrible\((\d+)\,(\d+)\)/gm.exec(actionBtn.href);
					if (unsub) {
						item.action.command = "unsubscribe";
						item.action.classID = parseInt(unsub[1]);
					}
				} else {
					// Test condition button
					let conditionBtn = firstCell.querySelector(":scope > img[title]");
					if (conditionBtn) {
						item.action.command = "condition";
						item.action.data = conditionBtn.getAttribute("title");
					}
				}
			}

			item.classID = row.children[cellStart + 1].innerText.trim();

			// Try to find tuition fee lines
			let secondCell = row.children[cellStart + 2].innerText.trim();
			let secondCellLines = secondCell
				.split("\n")
				.map(i => i.trim())
				.filter(i => i.length > 2);

			// Subject name should present at all time
			let subjectLine = /(.+) \((\d+) tc\)/gm.exec(secondCell);
			item.subject = subjectLine[1];
			item.credits = parseInt(subjectLine[2]);

			let tuitionLine = /Học phí: (\d+)\*1000 \(đ\)/gm.exec(secondCell);
			if (tuitionLine) {
				item.tuition = parseInt(tuitionLine[1]) * 1000;

				if (secondCellLines.length === 2) {
					// Only subject name is present
					item.teacher = "Không Có Giảng Viên";
				} else {
					// Subject's teacher name is on second line
					item.teacher = secondCellLines[1];
				}
			} else {
				if (secondCellLines.length >= 2) {
					// Subject's teacher name is on second line
					item.teacher = secondCellLines[1];
				} else {
					// Only subject name is present
					item.teacher = "Không Có Giảng Viên";
				}
			}

			item.minimum = parseInt(row.children[cellStart + 3].innerText.trim().replace(" sv", ""));
			item.maximum = parseInt(row.children[cellStart + 4].innerText.trim().replace(" sv", ""));
			item.subscribed = parseInt(row.children[cellStart + 5].innerText.trim().replace(" sv", ""));

			// Parse time window
			let timeCell = [ ...row.children[cellStart + 6].innerText.trim()
				.matchAll(/(\d+):(\d+) (\d+)\/(\d+)\/(\d+)/gm) ];

			for (let i = 0; i < timeCell.length; i++) {
				let cell = timeCell[i];
				let parsedTime = new Date("20" + cell[5], parseInt(cell[4]) - 1, cell[3], cell[1], cell[2]);

				if (i === 0)
					item.date.start = parsedTime;
				else if (i === 1)
					item.date.end = parsedTime;
				else if (i === 2)
					item.date.cancel = parsedTime;
			}

			let scheduleCell = row.children[cellStart + 7].querySelectorAll(`:scope > ul > li`);
			for (let line of scheduleCell) {
				let t = line.innerText
					.replaceAll("\n", "")
					.replace(/\s\s+/g, " ")
					.trim();

				let c = t.split(" - ")[1];
				if (!item.classroom.includes(c))
					item.classroom.push(c);

				item.schedule.push(t);
			}

			// Subroute of parsing first cell, this code only run when no action
			// available. We need to determine status by fetched data
			if (isNoAction) {
				if (time(item.date.end) < time())
					item.expired = true;

				if (item.subscribed >= item.maximum)
					item.isFull = true;
			}

			items.push(item);
		}

		return items;
	},

	/**
	 * API Đăng kí tín chỉ
	 * 
	 * @param	{Object}													option
	 * @param	{"getmodule" | "subscribe" | "unsubscribe" | "subscribed"}	option.action
	 * @param	{String}													option.classID
	 * @returns	{Promise<APIResponse & Subscribe>}
	 */
	async subscribe({
		action = "getmodule",
		classID
	} = {}) {
		// If viewstate for subscribe page haven't been set, that's mean
		// we will have to make a prefetch request first in order
		// to update current viewstate
		if (!this.__SUBS_VIEWSTATE) {
			clog("DEBG", "api.subscribe(): Starting prefetch request");
			let response = await this.request({
				path: `/DangkyLoptinchi.aspx`,
				ignoreAnnouncement: true
			});

			this.__SUBS_VIEWSTATE = this.__VIEWSTATE;
			this.__SUBS_VIEWSTATEGENERATOR = this.__VIEWSTATEGENERATOR;
			this.__SUBS_EVENTVALIDATION = this.__EVENTVALIDATION;

			// Get Student ID
			let studentID = /"getmodule:" \+ (\d+)\;/gm.exec(response.response);
			
			if (!studentID)
				throw { code: -1, description: `api.subscribe(): student id not found` }

			this.__SUBS_STUDENTID = parseInt(studentID[1]);
			clog("INFO", `api.subscribe(): Got student ID: ${this.__SUBS_STUDENTID}`);
		}

		let args;
		let callID;
		switch (action) {
			case "getmodule":
				callID = "__Page";
				args = `getmodule:${this.__SUBS_STUDENTID}`;
				break;

			case "subscribe":
				callID = "ctl00$LeftCol$LoptinchiDangky1";
				args = `subcrible:${classID}:${this.__SUBS_STUDENTID}`;
				break;

			case "unsubscribe":
				callID = "ctl00$LeftCol$LoptinchiDangky1";
				args = `unsubcrible:${classID}:${this.__SUBS_STUDENTID}`;
				break;

			case "subscribed":
				callID = "ctl00$LeftCol$LoptinchiDangky1";
				args = `list:${this.__SUBS_STUDENTID}`;
				break;
		
			default:
				throw { code: -1, description: `api.subscribe(): undefined command: ${command}` }
		}

		clog("DEBG", "api.subscribe(): args", args || "empty");
		let response = await this.request({
			path: "/DangkyLoptinchi.aspx",
			method: "POST",
			form: {
				__CALLBACKID: callID,
				__CALLBACKPARAM: args,
				__VIEWSTATE: this.__SUBS_VIEWSTATE,
				__VIEWSTATEGENERATOR: this.__SUBS_VIEWSTATEGENERATOR,
				__EVENTVALIDATION: this.__SUBS_EVENTVALIDATION,
			}
		});

		// response: "eThere was an error in the callback.0|"
		let errorRe1 = /^e(.+)(\d+)\|$/gm.exec(response.response.trim());

		if (errorRe1)
			throw { code: parseInt(errorRe1[2]), description: `api.subscribe(${args}): ${errorRe1[1]}` }

		// Second pass of checking error response
		let errorRe2 = /^(\d+)\|(.*)$/g.exec(response.response.trim());

		if (errorRe2 && errorRe2[2] === "")
			throw { code: -1, description: `api.subscribe(${args}): got empty response, maybe subscribing has failed` }

		if (errorRe2 && errorRe2[2].includes("Lỗi:"))
			throw { code: -1, description: `api.subscribe(${args}): ${errorRe2[2]}` }

		// Check for existing tables and determine table type
		let haveCanSubscribe = response.response.includes("có thể đăng ký");
		let haveSubscribed = response.response.includes("vừa đăng ký");
		let tables = response.dom.querySelectorAll("table[border]");

		clog("DEBG", "api.subscribe(): data", { haveCanSubscribe, haveSubscribed });

		if (haveCanSubscribe && haveSubscribed) {
			response.waiting = this.parseSubscribe(tables[0]);
			response.subscribed = this.parseSubscribe(tables[1]);
		} else if (haveCanSubscribe)
			response.waiting = this.parseSubscribe(tables[0]);
		else if (haveSubscribed)
			response.subscribed = this.parseSubscribe(tables[0]);

		await this.__handleResponse("subscribe", response);
		return response;
	},

	reset() {
		this.__VIEWSTATE = undefined;
		this.__VIEWSTATEGENERATOR = undefined;
		this.__EVENTVALIDATION = undefined;

		this.__LOGOUT_VIEWSTATE = undefined;
		this.__LOGOUT_VIEWSTATEGENERATOR = undefined;

		this.__HOME_VIEWSTATE = undefined;
		this.__HOME_VIEWSTATEGENERATOR = undefined;
		this.__HOME_EVENTVALIDATION = undefined;
		this.__HOME_DATE = undefined;

		this.__SCHEDULE_VIEWSTATE = undefined;
		this.__SCHEDULE_VIEWSTATEGENERATOR = undefined;
		this.__SCHEDULE_EVENTVALIDATION = undefined;

		this.__TESTS_VIEWSTATE = undefined;
		this.__TESTS_VIEWSTATEGENERATOR = undefined;
		this.__TESTS_EVENTVALIDATION = undefined;

		this.__SUBS_VIEWSTATE = undefined;
		this.__SUBS_VIEWSTATEGENERATOR = undefined;
		this.__SUBS_EVENTVALIDATION = undefined;
		this.__SUBS_STUDENTID = undefined;
	}
}

//* ============= OBJECT DEFINITION =============

/**
 * @typedef {{
 * 	path: String
 * 	method: "GET" | "POST" | "PUT" | "DELETE"
 * 	query: Object<string, string>
 * 	form: Object<string, string>
 * 	json: Object<string, string>
 * 	header: Object<string, string>
 * 	target: String
 * 	argument: String
 * 	renewSession: Boolean
 * 	ignoreAnnouncement: Boolean
 * }} APIRequest
 */

/**
 * Schedule object
 * @typedef		Schedule
 * @type		{Object}
 * @property	{Date}					date		Schedule start date, will be the first day of that week.
 * @property	{Boolean}				billAlert	Tuition bill alert
 * @property	{ScheduleWeekRow[]}		info		Contain each day of week
 */

/**
 * Schedule subject object
 * @typedef		ScheduleSubject
 * @type		{Object}
 * @property	{String[]}			time
 * @property	{Date[]}			date
 * @property	{String}			classroom
 * @property	{String}			subject
 * @property	{String}			teacher
 * @property	{String|String[]}	classID
 * @property	{?String}			listID
 * @property	{?Number}			checkInID
 * @property	{String}			status
 * @property	{String}			noteID
 */

/**
 * Schedule week row object
 * @typedef		ScheduleWeekRow
 * @type		{Object}
 * @property	{String}				time
 * @property	{Date}					date
 * @property	{String}				dateString
 * @property	{String}				weekDay
 * @property	{ScheduleSubject[]}		rows
 */

/**
 * Schedule note object
 * @typedef		ScheduleNote
 * @type		{Object}
 * @property	{Object}				data
 * @property	{String}				data.content
 */

/**
 * CheckIn Object
 * @typedef		CheckIn
 * @type		{Object}
 * @property	{Object}				data
 * @property	{Number}				data.nth
 * @property	{Boolean}				data.healthDeclared
 * @property	{CheckInDay[]}			data.checkIn
 */

/**
 * CheckInDay Object
 * @typedef		CheckInDay
 * @type		{Object}
 * @property	{String}				status
 * @property	{String}				label
 */

/**
 * Home object
 * @typedef		Home
 * @type		{Object}
 * @property	{Date}					date	Schedule start date, will be the first day of that week.
 * @property	{ScheduleWeekRow[]}		info	Contain each day of week
 */

/**
 * Subscribe Entry
 * @typedef		SubscribeEntry
 * @type		{Object}
 * @property	{Date}												date	Schedule start date, will be the first day of that week.
 * @property	{ScheduleWeekRow[]}									info	Contain each day of week
 * @property	{Boolean}											expired
 * @property	{Boolean}											isFull
 * @property	{String}											classID
 * @property	{String}											subject
 * @property	{String}											teacher
 * @property	{Number}											credits
 * @property	{Number}											tuition
 * @property	{Number}											minimum
 * @property	{Number}											maximum
 * @property	{Number}											subscribed
 * @property	{String[]}											schedule
 * @property	{String[]}											classroom
 * @property	{Object}											action
 * @property	{"subscribe" | "unsubscribe" | "condition"}			action.command
 * @property	{?String}											action.data
 * @property	{?String}											action.classID
 * @property	{Object}											date
 * @property	{String}											date.start
 * @property	{String}											date.end
 * @property	{String}											date.cancel
 */

/**
 * Subscribe Object
 * @typedef		Subscribe
 * @type		{Object}
 * @property	{SubscribeEntry[]}		waiting
 * @property	{SubscribeEntry[]}		subscribed
 */

/**
 * Result object
 * @typedef		Result
 * @type		{Object}
 * @property	{String}				subject
 * @property	{Number}				credits
 * @property	{String}				classID
 * @property	{String}				teacher
 * @property	{Number}				diemCC
 * @property	{Number}				diemDK
 * @property	{Number}				diemHK
 * @property	{Number}				rawAverage
 * @property	{Number}				average
 * @property	{ResultGrade}			grade
 * @property	{Boolean}				ignored
 */

/**
 * Result Grading object
 * @typedef		ResultGrade
 * @type		{Object}
 * @property	{Number}				point
 * @property	{String}				letter
 * @property	{String}				color
 * @property	{Bool}					passed
 */

/**
 * UserInfo object
 * @typedef		UserInfo
 * @type		{Object}
 * @property	{String}				name
 * @property	{String}				birthday
 * @property	{String}				tForm
 * @property	{String}				studentID
 * @property	{String}				faculty
 * @property	{String}				department
 * @property	{String}				course
 * @property	{String}				classroom
 * @property	{String}				mode
 */

/**
 * Results object
 * @typedef		Results
 * @type		{Object}
 * @property	{Object}				info
 * @property	{String}				info.name
 * @property	{String}				info.birthday
 * @property	{String}				info.tForm
 * @property	{String}				info.studentID
 * @property	{String}				info.faculty
 * @property	{String}				info.department
 * @property	{String}				info.course
 * @property	{String}				info.classroom
 * @property	{String}				info.mode
 * @property	{Result[]}				info.results
 * @property	{Number}				info.average
 * @property	{Number}				info.cpa
 * @property	{Number}				info.credits
 * @property	{String}				info.grade
 */