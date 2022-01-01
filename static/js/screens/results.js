//? |-----------------------------------------------------------------------------------------------|
//? |  /static/js/screens/results.js                                                                |
//? |                                                                                               |
//? |  Copyright (c) 2021 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

core.screen = {
	...core.screen,

	results: {
		/** @type {CoreScreen} */
		screen: null,

		view: null,
		loaded: false,

		async init() {
			this.view = makeTree("div", "resultsScreen", {
				info: { tag: "div", class: "info", child: {
					cpa: { tag: "span", class: ["item", "infoCard"], child: {
						label: { tag: "t", class: "label", text: "Điểm TBC Tích Lũy" },
						value: { tag: "t", class: "value", text: "---" },
						tip: { tag: "tip", title: "<div><b>Điểm Trung Bình Chung Tích Lũy</b><br>Điểm được tính trên đây có thể không hoàn toàn chính xác 100% do trọng số của mỗi môn sẽ khác nhau</div>" }
					}},

					grade: { tag: "span", class: ["item", "infoCard"], child: {
						label: { tag: "t", class: "label", text: "Xếp Loại" },
						value: { tag: "t", class: "value", text: "---" }
					}},
				}},

				table: { tag: "table", class: "generalTable", child: {
					thead: { tag: "thead", child: {
						row: { tag: "tr", child: {
							stt: { tag: "th", class: "right", text: "Thứ Tự" },
							subject: { tag: "th", text: "Môn Học" },
							credits: { tag: "th", class: "right", text: "Số Tín Chỉ" },
							classroom: { tag: "th", class: "right", text: "Mã Lớp" },
							teacher: { tag: "th", text: "Giảng Viên" },
							
							diemCC: { tag: "th", class: "right", child: {
								content: { tag: "span", text: "Điểm CC" },
								tip: { tag: "tip", title: "Điểm Chuyên Cần (weighted 10%)" }
							}},

							diemDK: { tag: "th", class: "right", child: {
								content: { tag: "span", text: "Điểm ĐK" },
								tip: { tag: "tip", title: "Điểm Điều Kiện (weighted 20%)" }
							}},

							diemHK: { tag: "th", class: "right", child: {
								content: { tag: "span", text: "Điểm HK" },
								tip: { tag: "tip", title: "Điểm Học Kì (weighted 70%)" }
							}},

							average: { tag: "th", class: "right", child: {
								content: { tag: "span", text: "TB10" },
								tip: { tag: "tip", title: "Điểm Trung Bình Hệ Số 10" }
							}},

							gradePoint: { tag: "th", class: "right", child: {
								content: { tag: "span", text: "TB4" },
								tip: { tag: "tip", title: "Điểm Trung Bình Hệ Số 4" }
							}},

							gradeLetter: { tag: "th", class: "right" }
						}}
					}},

					tbody: { tag: "tbody" }
				}}
			});

			this.screen = new CoreScreen({
				id: "results",
				icon: "poll",
				title: "kết quả học tập",
				description: "xem toàn bộ kết quả học tập của các môn!",
				applyScrollable: false
			});

			this.screen.content = this.view;
			new Scrollable(this.view, { content: this.view.table });

			this.onLogout();
			this.screen.loading = true;

			core.account.onLogout(() => this.onLogout());
			this.screen.onReload(async () => await this.load());

			this.screen.onShow(async () => {
				if (this.loaded)
					return;

				await this.load();
			});

			core.account.onLogin(async () => {
				let resultCache = localStorage.getItem("cache.account");
				let needUpdate = true;

				if (resultCache) {
					/** @type {Object} */
					resultCache = JSON.parse(resultCache);

					// Check cache validity, if current logged in user data
					// has been cached, we don't need to fetch this api anymore.
					if (resultCache.email === core.account.email) {
						this.log("INFO", "Account data has been cached, we don't need to fetch it again.");
						core.account.updateInfo({ info: resultCache });
						this.screen.loading = false;
						needUpdate = false;
					}
				}

				if (needUpdate || this.screen.showing)
					await this.load();
			});

			api.onResponse("results", (response) => {
				if (!this.loaded)
					this.screen.overlay({ show: false });

				// Cache user info for applying in the future
				localStorage.setItem("cache.account", JSON.stringify({
					email: core.account.email,
					name: response.info.name,
					studentID: response.info.studentID,
					birthday: response.info.birthday,
					classroom: response.info.classroom,
					department: response.info.department,
					tForm: response.info.tForm,
				}));

				this.loaded = true;
				emptyNode(this.view.table.tbody);
				this.screen.set({ subTitle: response.info.mode });

				this.view.info.cpa.value.innerText = response.info.cpa.toFixed(3);
				this.view.info.grade.value.innerText = response.info.grade;

				for (let item of response.info.results)
					this.addListItem(item);

				this.screen.loading = false;
			});
		},

		reset() {
			this.loaded = false;
			emptyNode(this.view.table.tbody);
			this.view.info.cpa.value.innerText = "---";
			this.view.info.grade.value.innerText = "---";
			this.screen.set({ subTitle: "" });
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
				return;
			}

			try {
				this.screen.loading = true;
				await api.results();
				this.screen.loading = false;
			} catch(e) {
				this.reset();
				this.screen.handleError(e, async () => await this.load());

				this.screen.loading = false;
			}
		},

		addListItem({
			subject,
			credits,
			classID,
			teacher,
			diemCC,
			diemDK,
			diemHK,
			average,
			grade
		} = {}) {
			let row = makeTree("tr", "item", {
				stt: { tag: "td", class: ["bold", "right"] },
				subject: { tag: "td", text: subject },
				credits: { tag: "td", class: "right", text: credits },
				classID: { tag: "td", class: ["bold", "right"], text: classID },
				teacher: { tag: "td", text: teacher },

				diemCC: {
					tag: "td",
					class: "right",
					html: (typeof diemCC === "number")
						? diemCC.toFixed(2)
						: ((diemCC === "?")
							? `<span title="Chưa Xác Nhận">?</span>`
							: "")
				},

				diemDK: {
					tag: "td",
					class: "right",
					html: (typeof diemDK === "number")
						? diemDK.toFixed(2)
						: ((diemDK === "?")
							? `<span title="Chưa Xác Nhận">?</span>`
							: "")
				},

				diemHK: {
					tag: "td",
					class: "right",
					html: (typeof diemHK === "number")
						? diemHK.toFixed(2)
						: ((diemHK === "?")
							? `<span title="Chưa Xác Nhận">?</span>`
							: "")
				},

				average: { tag: "td", class: ["right", "bold"], text: average ? average.toFixed(2) : "" },
				gradePoint: { tag: "td", class: ["right", "bold"], text: grade ? grade.point.toFixed(2) : "" },

				gradeLetter: { tag: "td", class: "right", child: {
					inner: {
						tag: "span",
						class: "generalTag",
						data: { grade: grade ? grade.letter : "?" },
						text: grade ? grade.letter : "?" }
					}
				},
			});

			this.view.table.tbody.appendChild(row);
		}
	}
}