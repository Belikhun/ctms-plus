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
	HOST: `http://ctms.fithou.net.vn`,
	MIDDLEWARE: `http://localhost`,

	__PATH: undefined,
	__FORM: {},
	__VIEWSTATE: undefined,
	__VIEWSTATEGENERATOR: undefined,
	__EVENTVALIDATION: undefined,

	responseHandlers: {},

	onResponse(type, f) {
		if (typeof f !== "function")
			throw { code: -1, description: `api.onResponse(${type}): not a valid function` }

		if (this.responseHandlers[type] === null || typeof this.responseHandlers[type] !== "object")
			this.responseHandlers[type] = []

		this.responseHandlers[type].push(f);
	},

	__handleResponse(type, data) {
		if (this.responseHandlers[type] === null || typeof this.responseHandlers[type] !== "object" || this.responseHandlers[type].length === 0) {
			clog("WARN", `api.__handleResponse(${type}): no handler found`);
			return;
		}

		this.responseHandlers[type].forEach(f => f(data));
	},

	async request({
		path = "",
		method = "GET",
		query,
		form,
		json,
		header = {},
		target = "",
		argument = "",
		renewSession = false
	} = {}) {
		if (method === "POST") {
			this.__FORM = form || {}
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
		} catch(error) {
			if (error.data) {
				error.c2m = start.tick() - error.data.runtime;
				this.__handleResponse("error", error);
	
				throw error;
			} else {
				error.c2m = start.tick();
				this.__handleResponse("error", error);
				throw { code: -1, description: `api.request(): invalid middleware response (middleware: ${this.MIDDLEWARE})`, data: error }
			}
		}

		if (response.data.session) {
			clog("DEBG", "api.request(): session", { text: response.data.session, color: oscColor("blue") });
			localStorage.setItem("session", response.data.session);
		}

		let dom = document.createElement("template");
		dom.innerHTML = response.data.response;

		// Check No Permission Page
		if (dom.content.querySelector(".NoPermission")) {
			if (!renewSession)
				throw { code: -1, description: `Phiên làm việc hết hạn hoặc bạn không có quyền truy cập chức năng này!` }

			clog("WARN", `api.request(): session expired! requesting new session`);
			localStorage.setItem("session", "");
			return await this.request(arguments[0]);
		}

		let __vs = dom.content.getElementById("__VIEWSTATE");
		let __vsg = dom.content.getElementById("__VIEWSTATEGENERATOR");
		let __ev = dom.content.getElementById("__EVENTVALIDATION");

		if (__vs && __vs.value !== "") {
			clog("DEBG", `api.request(): update __VIEWSTATE`, { text: truncateString(__vs.value, 60), color: oscColor("pink") });
			this.__VIEWSTATE = __vs.value;
		}

		if (__vsg && __vsg.value !== "") {
			clog("DEBG", `api.request(): update __VIEWSTATEGENERATOR`, { text: __vsg.value, color: oscColor("pink") });
			this.__VIEWSTATEGENERATOR = __vsg.value;
		}

		if (__ev && __ev.value !== "") {
			clog("DEBG", `api.request(): update __EVENTVALIDATION`, { text: __ev.value, color: oscColor("pink") });
			this.__EVENTVALIDATION = __ev.value;
		}

		let data = {
			dom: dom.content,
			c2m: start.tick() - response.runtime,
			...response.data
		}

		this.__handleResponse("global", data);
		return data;
	},

	/**
	 * Đăng nhập vào CTMS với tài khoản và mật khẩu được đưa vào
	 * 
	 * @param	{Object} param0
	 * Bao gồm 2 giá trị
	 *  + **String** `username`: Tên người dùng/email
	 *  + **String** `password`: Mật khẩu
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
				"ctl00$LeftCol$UserLogin1$txtUsername": username,
				"ctl00$LeftCol$UserLogin1$txtPassword": md5(password),
				"ctl00$LeftCol$UserLogin1$btnLogin": "Đăng nhập"
			}
		});

		this.__handleResponse("login", response);
		return response;
	},

	/**
	 * Đăng xuất khỏi tài khoản hiện tại
	 */
	async logout() {
		let response = await this.request({
			path: this.__PATH,
			method: "POST",
			form: {
				...this.__FORM,
				"__CALLBACKID": "ctl00$QuanlyMenu1",
				"__CALLBACKPARAM": "logout"
			}
		});

		this.__handleResponse("logout", response);
		return response;
	},

	/**
	 * Lấy kết quả học tập của sinh viên kèm theo thông tin cơ bản
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
			results: []
		}

		let resultTableRows = [ ...response.dom.querySelectorAll(`#leftcontent > table.RowEffect.CenterElement > tbody > tr`) ]
		for (let row of resultTableRows) {
			response.info.results.push({
				subject: row.children[0].innerText.trim(),
				tinChi: parseInt(row.children[1].innerText.trim()),
				classID: row.children[2].innerText.trim(),
				teacher: row.children[3].innerText.trim(),
				diemCC: parseFloat(row.children[4].innerText.trim()),
				diemDK: parseFloat(row.children[5].innerText.trim()),
				diemHK: parseFloat(row.children[6].innerText.trim())

				// We will add note later as currently we don't
				// know what kind of data goes in here
				// note: row.children[7].innerText.trim()
			});
		}

		this.__handleResponse("results", response);
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

		this.__handleResponse("services", response);
		return response;
	},

	// For current schedule viewstate, we can use them if
	// global viewstate is being changed by another api
	// request
	__SCHEDULE_VIEWSTATE: undefined,
	__SCHEDULE_VIEWSTATEGENERATOR: undefined,
	__SCHEDULE_EVENTVALIDATION: undefined,

	/**
	 * Lấy lịch học với ngày đầu tuần (hoặc ngày trong tuần) cho trước
	 * 
	 * @param	{Date} date	Thời gian trong tuần cần xem
	 */
	async schedule(date) {
		let response
		
		if (typeof date !== "undefined")
			response = await this.request({
				path: "/Lichhoc.aspx",
				method: "POST",
				form: {
					__VIEWSTATE: this.__SCHEDULE_VIEWSTATE,
					__VIEWSTATEGENERATOR: this.__SCHEDULE_VIEWSTATEGENERATOR,
					__EVENTVALIDATION: this.__SCHEDULE_EVENTVALIDATION,
					"ctl00$LeftCol$Lichhoc1$txtNgaydautuan": `${date.getFullYear()}-${pleft(date.getMonth() + 1, 2)}-${date.getDate()}`,
					"ctl00$LeftCol$Lichhoc1$btnXemlich": "Xem lịch"
				}
			});
		else {
			response = await this.request({
				path: "/Lichhoc.aspx",
				method: "GET"
			});

			this.__FORM = {
				"ctl00$LeftCol$Lichhoc1$txtNgaydautuan": response.dom.getElementById("LeftCol_Lichhoc1_txtNgaydautuan").value,
				"ctl00$LeftCol$Lichhoc1$btnXemlich": "Xem lịch"
			}
		}

		// Update current schedule viewstate
		this.__SCHEDULE_VIEWSTATE = this.__VIEWSTATE;
		this.__SCHEDULE_VIEWSTATEGENERATOR = this.__VIEWSTATEGENERATOR;
		this.__SCHEDULE_EVENTVALIDATION = this.__EVENTVALIDATION;

		response.info = Array();
		for (let i = 0; i < 7; i++) {
			let table = response.dom.getElementById(`LeftCol_Lichhoc1_rptrLichhoc_grvLichhoc_${i}`);

			if (!table)
				continue;

			let time = table.parentElement.parentElement.children[0].innerText
				.replaceAll("\n", "")
				.replace(/\s\s+/g, " ")
				.trim();

			let item = { time, rows: [] }
			let rows = table.querySelectorAll(`tbody > tr:not(:first-child)`);
			
			for (let row of [ ...rows ]) {
				let classCol = row.children[5].innerHTML.trim().split("<br>");

				item.rows.push({
					time: row.children[1].innerText.trim(),
					classroom: row.children[2].innerText.trim(),
					subject: row.children[3].innerText.trim(),
					teacher: row.children[4].innerText.trim(),
					classID: classCol[0],
					listID: classCol[1],
					status: row.children[6].innerText.trim()
				});
			}

			response.info.push(item);
		}

		this.__handleResponse("schedule", response);
		return response;
	}
}