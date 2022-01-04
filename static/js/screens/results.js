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

		/** @type {APIResponse & Results} */
		currentData: null,

		/** @type {Animator} */
		animator: undefined,
		currentCPA: 0,
		timing: (t) => (1 - Math.pow(2, -14 * t)),

		scanPerSemester: 2,
		view: null,
		loaded: false,

		async init() {
			this.view = makeTree("div", "resultsScreen", {
				info: {
					tag: "div",
					class: "info",
					child: {
						points: {
							tag: "span",
							class: "points",
							child: {
								ruler: { tag: "div", class: "ruler", child: {
									gradeF: { tag: "span", class: ["bar", "D"], child: {
										tag: { tag: "span", class: "generalTag", text: "YẾU" }
									}},

									gradeD: { tag: "span", class: ["bar", "C"], child: {
										tag: { tag: "span", class: "generalTag", text: "TB" }
									}},

									gradeC: { tag: "span", class: ["bar", "B"], child: {
										tag: { tag: "span", class: "generalTag", text: "KHÁ" }
									}},

									gradeB: { tag: "span", class: ["bar", "A"], child: {
										tag: { tag: "span", class: "generalTag", text: "GIỎI" }
									}},

									gradeA: { tag: "span", class: ["bar", "S"], child: {
										tag: { tag: "span", class: "generalTag", text: "XS" }
									}}
								}},

								progress: { tag: "div", class: "progress", child: {
									bar: { tag: "div", class: "bar", child: {
										value: { tag: "span", class: "value", child: {
											grade: { tag: "span", class: "generalTag", data: { grade: "TB" }, text: "OK" },
											point: { tag: "t", class: "point", text: "0.000" }
										}}
									}}
								}}
							}
						},

						stats: {
							tag: "span",
							class: "stats",
							child: {
								grades: { tag: "div", class: "grades", child: {
									gradeA: { tag: "span", class: ["item", "A"], child: {
										tag: { tag: "div", class: "generalTag", data: { color: "green" }, text: "A/A+" },
										value: { tag: "t", class: "value", text: "0" }
									}},
	
									gradeB: { tag: "span", class: ["item", "B"], child: {
										tag: { tag: "div", class: "generalTag", data: { color: "blue" }, text: "B/B+" },
										value: { tag: "t", class: "value", text: "0" }
									}},
	
									gradeC: { tag: "span", class: ["item", "C"], child: {
										tag: { tag: "div", class: "generalTag", data: { color: "yellow" }, text: "C/C+" },
										value: { tag: "t", class: "value", text: "0" }
									}},
	
									gradeD: { tag: "span", class: ["item", "D"], child: {
										tag: { tag: "div", class: "generalTag", data: { color: "orange" }, text: "D/D+" },
										value: { tag: "t", class: "value", text: "0" }
									}},
	
									gradeF: { tag: "span", class: ["item", "F"], child: {
										tag: { tag: "div", class: "generalTag", data: { color: "red" }, text: "F" },
										value: { tag: "t", class: "value", text: "0" }
									}},
	
									gradeU: { tag: "span", class: ["item", "U"], child: {
										tag: { tag: "div", class: "generalTag", text: "?" },
										value: { tag: "t", class: "value", text: "0" }
									}}
								}},

								other: { tag: "div", class: "other", child: {
									avg10: { tag: "span", class: "item", child: {
										tag: { tag: "div", class: "generalTag", data: { color: "light" }, text: "ĐIỂM TB HỆ 10" },
										value: { tag: "t", class: "value", text: "0.00" }
									}},

									credits: { tag: "span", class: "item", child: {
										tag: { tag: "div", class: "generalTag", data: { color: "light" }, text: "TÍN CHỈ ĐÃ TÍCH LŨY" },
										value: { tag: "t", class: "value", text: "100" }
									}},
								}}
							}
						}
					}
				},

				table: {
					tag: "table",
					class: ["generalTable", "noBackground"],
					child: {
						thead: {
							tag: "thead",
							child: {
								row: {
									tag: "tr",
									child: {
										stt: { tag: "th", class: "right", text: "Thứ Tự" },
										subject: { tag: "th", text: "Môn Học" },
										credits: { tag: "th", class: "right", text: "Số Tín Chỉ" },
										classroom: { tag: "th", class: "right", text: "Mã Lớp" },
										teacher: { tag: "th", text: "Giảng Viên" },

										diemCC: {
											tag: "th",
											class: "right",
											child: {
												content: { tag: "span", text: "Điểm CC" },
												tip: { tag: "tip", title: "Điểm Chuyên Cần (weighted 10%)" }
											}
										},

										diemDK: {
											tag: "th",
											class: "right",
											child: {
												content: { tag: "span", text: "Điểm ĐK" },
												tip: { tag: "tip", title: "Điểm Điều Kiện (weighted 20%)" }
											}
										},

										diemHK: {
											tag: "th",
											class: "right",
											child: {
												content: { tag: "span", text: "Điểm HK" },
												tip: { tag: "tip", title: "Điểm Học Kì (weighted 70%)" }
											}
										},

										average: {
											tag: "th",
											class: "right",
											child: {
												content: { tag: "span", text: "TB10" },
												tip: { tag: "tip", title: "Điểm Trung Bình Hệ Số 10" }
											}
										},

										gradePoint: {
											tag: "th",
											class: "right",
											child: {
												content: { tag: "span", text: "TB4" },
												tip: { tag: "tip", title: "Điểm Trung Bình Hệ Số 4" }
											}
										},

										gradeLetter: { tag: "th", class: "right" }
									}
								}
							}
						},

						tbody: { tag: "tbody" }
					}
				}
			});

			this.screen = new CoreScreen({
				id: "results",
				icon: "poll",
				title: "kết quả học tập",
				description: "xem toàn bộ kết quả học tập của các môn!"
			});

			let scanButton = createButton("XẾP NHÓM", {
				icon: "search",
				color: "orange",
				style: "round",
				complex: true
			});

			this.screen.addButton(scanButton);
			scanButton.addEventListener("click", async () => {
				scanButton.loading(true);

				try {
					await this.scan();
				} catch(e) {
					errorHandler(e);
				}

				scanButton.loading(false);
			});
			
			this.screen.content = this.view;

			this.onLogout();
			this.screen.loading = true;

			core.account.onLogout(() => this.onLogout());
			this.screen.onReload(async() => await this.load());

			this.screen.onShow(async() => {
				if (this.loaded) {
					// Replay animation
					if (this.currentData) {
						this.currentCPA = 0;
						this.updateCPA(this.currentData.info.cpa);
					}

					return;
				}

				await this.load();
			});

			core.account.onLogin(async() => {
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
					birthday: response.info.birthday,
					tForm: response.info.tForm,
					studentID: response.info.studentID,
					faculty: response.info.faculty,
					department: response.info.department,
					course: response.info.course,
					classroom: response.info.classroom,
					mode: response.info.mode
				}));

				this.loaded = true;
				this.render(response);

				this.screen.loading = false;
			});

			api.onResponse("schedule",
				/**
				 * Update grouping data when user fetch schedule data
				 * @param	{APIResponse & Schedule}	response
				 */
				(response) => {
					/** @type {ResultGroupStore[]} */
					let groupingData = localStorage.getItem("results.grouping");
					groupingData = (groupingData)
						? JSON.parse(groupingData)
						: [];

					let year = response.date.getFullYear();
					let month = response.date.getMonth() + 1;
					let semester;

					if (month <= 4)
						semester = 2;
					else if (month <= 8)
						semester = 3;
					else
						semester = 1;

					this.log("DEBG", `schedule handler: updating entries for year ${year} semester ${semester}`);
					let index;

					// Find location of current group in the stored grouping data,
					// we will create one if not exist.
					for (let i = 0; i < groupingData.length; i++)
						if (groupingData[i].year === year && groupingData[i].semester === semester) {
							index = i;
							break;
						}

					// Create new group
					if (typeof index !== "number") {
						index = groupingData.push({
							year,
							semester,
							classID: []
						}) - 1;
					}

					for (let day of response.info)
						for (let subject of day.rows)
							if (!groupingData[index].classID.includes(subject.classID)) {
								this.log("DEBG", "schedule handler: adding", subject.classID);
								groupingData[index].classID.push(subject.classID);
							}

					// Save changes
					localStorage.setItem("results.grouping", JSON.stringify(groupingData));
					this.render(undefined, true);
				}
			);
		},

		async updateCPA(cpa) {
			// To prevent troll.
			cpa = Math.min(cpa, 4);

			if (cpa === this.currentCPA)
				return;

			if (this.animator)
				this.animator.cancel();

			let start = this.currentCPA;
			let delta = cpa - start;
			let grade, color, pColor;

			// Only play animation when screen is showing,
			// otherwise we are just wasting resources.
			let duration = (this.screen.showing)
				? Math.sqrt(3.2 * Math.abs(delta))
				: -1;

			this.log("DEBG", `updateCPA(): changing to ${cpa} in ${duration}s`);

			this.animator = new Animator(duration, this.timing, (t) => {
				this.currentCPA = start + (delta * t);
				this.view.info.points.progress.bar.style.width = `${(this.currentCPA / 4) * 100}%`;
				this.view.info.points.progress.bar.value.point.innerText = this.currentCPA.toFixed(3);

				if (this.currentCPA >= 3.6) {
					grade = "Xuất Xắc";
					color = "yellow";
				} else if (this.currentCPA >= 3.2) {
					grade = "Giỏi";
					color = "green";
				} else if (this.currentCPA >= 2.5) {
					grade = "Khá";
					color = "blue";
				} else if (this.currentCPA >= 2) {
					grade = "Trung Bình";
					color = "orange";
				} else {
					grade = "Yếu";
					color = "red";
				}

				let transform = 0.5;
				if (this.currentCPA < 0.7)
					transform = 1 - scaleValue(this.currentCPA, [0, 0.7], [0, 0.5]);
				else if (this.currentCPA > 3.5)
					transform = 4 - this.currentCPA;

				this.view.info.points.progress.bar.value.style.transform = `translateX(${transform * 100}%)`;

				if (color !== pColor) {
					this.view.info.points.progress.bar.value.grade.innerText = grade;
					this.view.info.points.progress.bar.value.grade.dataset.color = color;
					pColor = color;
				}
			});
		},

		reset() {
			this.loaded = false;
			emptyNode(this.view.table.tbody);
			this.view.info.stats.other.avg10.value.innerText = "---";
			this.view.info.stats.other.credits.value.innerText = "---";
			this.view.info.stats.grades.gradeA.value.innerText = "0";
			this.view.info.stats.grades.gradeB.value.innerText = "0";
			this.view.info.stats.grades.gradeC.value.innerText = "0";
			this.view.info.stats.grades.gradeD.value.innerText = "0";
			this.view.info.stats.grades.gradeF.value.innerText = "0";
			this.view.info.stats.grades.gradeU.value.innerText = "0";
			this.updateCPA(0);
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

		/**
		 * Return list of date that is the first day of week that we want to check
		 * schedule for determining Subject's Semester.
		 * 
		 * @param	{Object}    params
		 * @param	{Number}	params.year			Year of semester want to get dates
		 * @param	{Number}	params.semester		Semester want to get dates
		 * @param	{Number}	params.isK20		If true, return dates that match schedule for K20 students
		 * @param	{Number}	params.count		Number of dates that will return
		 * @returns {Date[]}	An array of date
		 */
		getScanDates({ year, semester, isK20 = false, count = 2 } = {}) {
			let dates = [];
			if (semester === 1) {
				let dateDefault = (isK20 && year === 2020)
					? new Date(`November 1, ${year}`)
					: new Date(`October 1, ${year}`);
				dateDefault = new Date(dateDefault.setDate(dateDefault.getDate() - dateDefault.getDay() + 1));
				
				for (let i = 0; i < count; ++i) {
					dates.push(dateDefault);
					dateDefault = new Date(dateDefault.setDate(dateDefault.getDate() + 7));
				}
			} else if (semester === 2) {
				let dateDefault1 = new Date(`January 12, ${year}`);
				let dateDefault2 = new Date(`March 3, ${year}`);
				dateDefault1 = new Date(dateDefault1.setDate(dateDefault1.getDate() - dateDefault1.getDay() + 1));
				dateDefault2 = new Date(dateDefault2.setDate(dateDefault2.getDate() - dateDefault2.getDay() + 1));

				if (count < 3) {
					dates.push(dateDefault1);
					dates.push(dateDefault2);
				} else if (count === 3) {
					for (let i = 0; i < count - 2; ++i) {
						dateDefault2 = new Date(dateDefault2.setDate(dateDefault2.getDate() + 7));
						dates.push(dateDefault2);
					}
				} else {
					let count2 = Math.floor((count - 2) / 2);
					for (let i = 0; i < count2; ++i) {
						dateDefault1 = new Date(dateDefault1.setDate(dateDefault1.getDate() + 7));
						dates.push(dateDefault1);
					}

					for (let i = 0; i < count - count2; ++i) {
						dateDefault2 = new Date(dateDefault2.setDate(dateDefault2.getDate() + 7));
						dates.push(dateDefault2);
					}
				}
			} else {
				let dateDefault = new Date(`July 7, ${year}`);
				dateDefault = new Date(dateDefault.setDate(dateDefault.getDate() - dateDefault.getDay() + 1));
				for (let i = 0; i < count; ++i) {
					dates.push(dateDefault);
					dateDefault = new Date(dateDefault.setDate(dateDefault.getDate() + 7));
				}
			}

			return dates;
		},

		/**
		 * Object structure definition
		 * 
		 * @typedef		ResultGroup
		 * @type		{Object}
		 * @property	{Number}				year
		 * @property	{Number}				semester
		 * @property	{Number}				average
		 * @property	{Number}				cpa
		 * @property	{String}				grade
		 * @property	{Result[]}				results
		 * 
		 * @typedef		ResultGroupObject
		 * @type		{Object}
		 * @property	{ResultGroup[]}			groups
		 * @property	{ResultGroup}			other
		 * 
		 * @typedef		ResultGroupStore
		 * @type		{Object}
		 * @property	{Number}				year
		 * @property	{Number}				semester
		 * @property	{String[]}				classID
		 */

		/**
		 * Scan schedule for grouping results
		 */
		async scan() {
			if (!this.currentData)
				throw { code: 22, description: `core.screen.results.scan(): no data available` }

			/** @type {ResultGroupStore[]} */
			let groupingData = localStorage.getItem("results.grouping");
			groupingData = (groupingData)
				? JSON.parse(groupingData)
				: [];

			// Set Up Progress Popup
			let progress = createProgressBar();
			let cancelled = false;
			popup.show({
				windowTitle: "Kết Quả Học Tập",
				title: "Trình Quét Học Kì",
				icon: "search",
				message: "Đang khởi tạo...",
				description: "Trình quét hiện đang quét lịch học của bạn để xác định thời gian học cho các môn. Quá trình này có thể mất 1-2 phút.",
				customNode: progress.group,
				buttonList: {
					close: { text: "HỦY", color: "red" }
				}
			}).then((action) => {
				if (action === "close")
					cancelled = true;
			});

			let now = new Date();
			let startYear = parseInt("20" + core.account.userInfo.course.substring(0, 2));
			let currentYear = now.getFullYear();

			this.log("DEBG", "scan(): scanning year from ", startYear, "to", currentYear);
			let steps = 0;
			let step = 0;

			let list = []

			if (startYear === currentYear) {
				list.push({
					year: startYear,
					semester: [1]
				});

				steps += 1;
			} else {
				for (let year = startYear; year <= currentYear; year++) {
					let pos = list.push({
						year,
						semester: []
					}) - 1;

					if (year === startYear)
						list[pos].semester = [1]
					else if (year === currentYear) {
						if (now.getMonth() > -1)
							list[pos].semester.push(2);

						if (now.getMonth() > 3)
							list[pos].semester.push(3);

						if (now.getMonth() > 7)
							list[pos].semester.push(1);
					} else
						list[pos].semester = [2, 3, 1]

					steps += list[pos].semester.length;
				}
			}

			steps *= this.scanPerSemester;
			this.log("DEBG", `scan(): scanning list:`, list, `(${steps} steps)`);

			for (let item of list) {
				for (let semester of item.semester) {
					let year = item.year;
					this.log("INFO", `scan(): scanning subjects of year ${year} semester ${semester}`);
					
					let isK20 = startYear === 2020;
					let dates = this.getScanDates({ year, semester, isK20, count: this.scanPerSemester });

					for (let date of dates) {
						if (cancelled)
							return;

						step++;
						let dateString = humanReadableTime(date, { onlyDate: true });

						this.log("DEBG", `scan(): fetching ${dateString}`);
						popup.popupNode.popup.body.top.message.innerText = `Đang Quét ${year} HK${semester} (${dateString})`;
						progress.set({
							right: `${step}/${steps}`,
							progress: (step / steps) * 100
						});

						let response = await api.schedule(date, { triggerEvents: false });
						let index;

						// Find location of current group in the stored grouping data,
						// we will create one if not exist.
						for (let i = 0; i < groupingData.length; i++)
							if (groupingData[i].year === year && groupingData[i].semester === semester) {
								index = i;
								break;
							}

						// Create new group
						if (typeof index !== "number") {
							index = groupingData.push({
								year,
								semester,
								classID: []
							}) - 1;
						}

						for (let day of response.info)
							for (let subject of day.rows)
								if (!groupingData[index].classID.includes(subject.classID))
									groupingData[index].classID.push(subject.classID);

						if (cancelled)
							return;
					}
				}
			}

			// Save changes
			localStorage.setItem("results.grouping", JSON.stringify(groupingData));
			popup.hide();
			this.render(undefined, true);
		},

		clearGroupingData() {
			localStorage.removeItem("results.grouping");
			this.render(undefined, true);
		},

		/**
		 * Group results data and calculate score for each group
		 * 
		 * @param		{Result[]}	list
		 * @returns		{ResultGroupObject}
		 */
		group(list) {
			// Clone list so we don't mess with the original data
			list = [ ...list ]

			/** @type {ResultGroupStore[]} */
			let groupingData = localStorage.getItem("results.grouping");
			groupingData = (groupingData)
				? JSON.parse(groupingData)
				: [];

			/** @type {ResultGroupObject} */
			let data = { groups: [], other: undefined }

			// Add new group data for other group
			groupingData.push({ classID: undefined });

			for (let groupData of groupingData) {
				/** @type {Result[]} */
				let results = []

				if (groupData.classID) {
					for (let i = 0; i < list.length; i++)
						if (groupData.classID.includes(list[i].classID))
							results.push(list.splice(i--, 1)[0]);
				} else
					results = list;

				// Process filtered list
				let resultsData = api.processResults(results);

				if (groupData.classID) {
					data.groups.push({
						year: groupData.year,
						semester: groupData.semester,
						average: resultsData.average,
						cpa: resultsData.cpa,
						grade: resultsData.grade,
						results
					});
				} else {
					data.other = {
						year: undefined,
						semester: undefined,
						average: resultsData.average,
						cpa: resultsData.cpa,
						grade: resultsData.grade,
						results
					}
				}
			}

			// Sort by date descending
			data.groups = data.groups.sort((a, b) => {
				return ((b.year * 10) + [3, 1, 2][b.semester - 1])
					 - ((a.year * 10) + [3, 1, 2][a.semester - 1]);
			});

			return data;
		},

		/**
		 * Render results handler
		 * @param	{APIResponse & Results}		data
		 * @param	{Boolean}					force
		 */
		render(data, force = false) {
			if (!this.loaded)
				return;

			let newData = false;
			if (typeof data === "object") {
				newData = true;
				this.currentData = data;
			} else
				data = this.currentData;

			if (newData || force) {
				this.log("DEBG", `render(): re-rendering`);
				emptyNode(this.view.table.tbody);

				this.screen.set({ subTitle: data.info.mode });
				let groups = this.group(data.info.results);
				let count = { A: 0, B: 0, C: 0, D: 0, F: 0, U: 0 }

				this.view.info.stats.other.avg10.value.innerText = data.info.average.toFixed(2);
				this.view.info.stats.other.credits.value.innerText = data.info.credits;
				this.updateCPA(data.info.cpa);

				for (let group of [ ...groups.groups, groups.other ]) {
					let headerLabel;

					if (group.year && group.semester) {
						let yearString = (group.semester === 1)
							? `${group.year} - ${group.year + 1}`
							: `${group.year - 1} - ${group.year}`;
	
						headerLabel = `<b>HK${group.semester}</b> ${yearString}`;
					} else
						headerLabel = `Chưa Phân Loại`;
					
					let header = makeTree("tr", "header", {
						label: { tag: "td", class: "label", colSpan: 11, child: {
							wrapper: { tag: "span", class: "wrapper", child: {
								inner: { tag: "t", class: "inner", html: headerLabel },

								...(group.cpa ?
									{
										tags: { tag: "span", class: "tags", child: {
											cpa: { tag: "span", class: ["item", "parallelogram"], child: {
												label: { tag: "t", class: "label", text: "GPA" },
												value: { tag: "span", class: ["parallelogram", "value"], text: group.cpa.toFixed(2) }
											}},

											grade: { tag: "span", class: ["item", "parallelogram"], child: {
												label: { tag: "t", class: "label", text: "Xếp Loại" },
												value: { tag: "span", class: ["parallelogram", "value"], data: { grade: group.grade }, text: group.grade }
											}}
										}}
									} : {}
								)
							}}
						}},
					});

					this.view.table.tbody.appendChild(header);
					let nth = 0;

					for (let result of group.results) {
						this.addListItem(++nth, result);

						if (typeof result.average !== "number" || result.average == NaN) {
							count.U++;
							continue;
						}

						if (result.average >= 8.5)		count.A++;
						else if (result.average >= 7.0)	count.B++;
						else if (result.average >= 5.5)	count.C++;
						else if (result.average >= 4.0)	count.D++;
						else							count.F++;
					}
				}

				this.view.info.stats.grades.gradeA.value.innerText = count.A;
				this.view.info.stats.grades.gradeB.value.innerText = count.B;
				this.view.info.stats.grades.gradeC.value.innerText = count.C;
				this.view.info.stats.grades.gradeD.value.innerText = count.D;
				this.view.info.stats.grades.gradeF.value.innerText = count.F;
				this.view.info.stats.grades.gradeU.value.innerText = count.U;
			}
		},

		/**
		 * Add item row to table
		 * @param	{Number}	stt
		 * @param	{Result}	result
		 */
		addListItem(stt, {
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
			let row = makeTree("tr", ["item", (stt % 2 === 0) ? "even" : "odd"], {
				stt: { tag: "td", class: ["bold", "right"], text: stt },
				subject: { tag: "td", text: subject },
				credits: { tag: "td", class: "right", text: credits },
				classID: { tag: "td", class: ["bold", "right"], text: classID },
				teacher: { tag: "td", text: teacher },

				diemCC: {
					tag: "td",
					class: "right",
					html: (typeof diemCC === "number") ?
						diemCC.toFixed(2) :
						((diemCC === "?") ?
							`<span title="Chưa Xác Nhận">?</span>` :
							"")
				},

				diemDK: {
					tag: "td",
					class: "right",
					html: (typeof diemDK === "number") ?
						diemDK.toFixed(2) :
						((diemDK === "?") ?
							`<span title="Chưa Xác Nhận">?</span>` :
							"")
				},

				diemHK: {
					tag: "td",
					class: "right",
					html: (typeof diemHK === "number") ?
						diemHK.toFixed(2) :
						((diemHK === "?") ?
							`<span title="Chưa Xác Nhận">?</span>` :
							"")
				},

				average: {
					tag: "td",
					class: ["right", "bold"],
					...(average) ? {
						text: average ? round(average, 1).toFixed(1) : "",
						title: `raw score: ${average}`
					} : {
						text: ""
					}
				},

				gradePoint: { tag: "td", class: ["right", "bold"], text: grade ? grade.point.toFixed(1) : "" },
				gradeLetter: { tag: "td", class: "right", child: {
					inner: {
						tag: "span",
						class: "generalTag",
						data: { color: grade ? grade.color : "none" },
						text: grade ? grade.letter : "?"
					}
				}},
			});

			this.view.table.tbody.appendChild(row);
		}
	}
}

