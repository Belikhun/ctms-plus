//? |-----------------------------------------------------------------------------------------------|
//? |  /static/js/news.js                                                                           |
//? |                                                                                               |
//? |  Copyright (c) 2021 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

core.news = {
	priority: 2,
	HOST: "http://fithou.edu.vn",

	categories: {
		"c3": { id: 3, name: "Tin đào tạo", color: "green", icon: "personChalkboard" },
		"c4": { id: 4, name: "Tin hoạt động", color: "blue", icon: "shapes" },
		"c14": { id: 14, name: "Kế hoạch", color: "pink", icon: "bell" },
		"c5": { id: 5, name: "Tuyển sinh", color: "yellow", icon: "userGraduate" },
		"c7": { id: 7, name: "Tuyển dụng", color: "gray", icon: "laptopCode" },
		"c9": { id: 9, name: "Bản tin OTSC", color: "gray", icon: "bookReader" },
		"c12": { id: 12, name: "Quy định, Biểu mẫu", color: "gray", icon: "paragraph" },
		"c13": { id: 13, name: "Nghiên cứu khoa học", color: "gray", icon: "microscope" }
	},

	button: navbar.iconButton({
		icon: "news",
		tooltip: {
			title: "tin tức",
			description: "các bài viết mới từ fithou"
		}
	}),

	loaded: false,
	activeCID: undefined,
	activePage: 0,
	activeMaxPage: 0,
	catLoading: false,

	/** @type {WaveContainer} */
	container: undefined,

	/** @type {TreeDOM} */
	content: undefined,
	
	/** @type {HTMLElement} */
	loadIndicator: undefined,

	/**
	 * @typedef {{
	 * 	id: Number
	 * 	cid: Number
	 * 	title: String
	 * 	abstract: String
	 * 	date: String
	 * 	node: TreeDOM
	 * }} NewArticle
	 * 
	 * @type {NewArticle[]}
	 */
	articles: [],

	init() {
		navbar.insert(this.button, "right", 2);
		core.darkmode.onToggle((dark) => this.button.set({ color: dark ? "dark" : "whitesmoke" }));

		this.content = makeTree("div", "news", {
			listing: { tag: "div", class: "listing", child: {
				cats: { tag: "div", class: "cats" },
				articles: { tag: "div", class: "articles" }
			}},

			viewer: { tag: "div", class: "viewer", child: {
				header: { tag: "div", class: "header", child: {
					top: { tag: "div", class: "top", child: {
						back: { tag: "icon", data: { icon: "left" } },
						articleName: { tag: "span", class: "title", text: "Sample title" }
					}},

					metas: { tag: "div", class: "metas", child: {
						cat: { tag: "span", class: ["generalTag", "cat"], text: "X" },
						views: { tag: "icon", class: "views", data: { icon: "eye" } },
						time: { tag: "icon", class: "time", data: { icon: "clock" } },
						original: { tag: "a", class: ["text-btn", "original"], target: "_blank", child: {
							label: { tag: "span", text: "mở link gốc" },
							icon: { tag: "icon", data: { icon: "externalLink" } }
						}}
					}},
				}},
				
				abstract: { tag: "div", class: "abstract", text: "hi abstract" },
				content: { tag: "div", class: "content" },

				nav: { tag: "div", class: "nav", child: {
					newer: { tag: "div", class: ["item", "newer"], child: {
						label: { tag: "span", class: "label", child: {
							subtitle: { tag: "div", class: "subtitle", text: "Bài đăng mới hơn" },
							articleName: { tag: "div", class: "title", text: "Sample text" }
						}},

						icon: { tag: "icon", data: { icon: "arrowRight" } }
					}},

					older: { tag: "div", class: ["item", "older"], child: {
						icon: { tag: "icon", data: { icon: "arrowLeft" } },

						label: { tag: "span", class: "label", child: {
							subtitle: { tag: "div", class: "subtitle", text: "Bài đăng cũ hơn" },
							articleName: { tag: "div", class: "title", text: "Sample text" }
						}}
					}}
				}}
			}}
		});

		new Scrollable(this.content.listing, {
			content: this.content.listing.cats,
			horizontal: true,
			scrollbar: false
		});

		this.content.id = "news";
		this.layout = "listing";
		this.content.viewer.header.top.back.addEventListener("click", () => {
			this.layout = "listing";
			emptyNode(this.content.viewer.content);
		});

		this.loadIndicator = document.createElement("div");
		this.loadIndicator.classList.add("loading");
		this.loadIndicator.innerHTML = `<div class="simpleSpinner"></div>`;

		for (let [id, value] of Object.entries(this.categories)) {
			let item = makeTree("span", "item", {
				line: { tag: "div", class: "line" },
				icon: { tag: "icon", data: { icon: value.icon } },
				titleNode: { tag: "div", class: "title", text: value.name },
				lastDate: { tag: "div", class: "last" },
				counts: { tag: "div", class: "counts" }
			});

			let lastDate = this.get(value.id, "lastDate");
			if (lastDate)
				item.lastDate.innerText = lastDate;

			let counts = this.get(value.id, "counts");
			if (counts)
				item.counts.innerText = `${counts} trang`;

			item.dataset.id = value.id;
			item.dataset.color = value.color;
			item.addEventListener("click", () => this.category(value.id));
			this.content.listing.cats.appendChild(item);
			this.categories[id].node = item;
		}

		this.container = new WaveContainer(this.content, {
			title: "tin tức",
			icon: "news",
			color: "purple"
		});

		this.container.setToggler(this.button);
		this.container.onScroll((e) => this.check(e));
		this.container.onToggle(async (active) => {
			if (active) {
				if (!this.loaded)
					this.category(3);
			} else {
				this.loaded = false;
				this.activeCID = undefined;
				await delayAsync(1000);
				emptyNode(this.content.listing.articles);
				emptyNode(this.content.viewer.content);
			}
		});
	},

	/**
	 * @param {Number} id
	 * @param {String} key
	 * @param {String} value
	 */
	save(id, key, value) {
		localStorage.setItem(`news.${id}.${key}`, value);
	},

	/**
	 * @param {Number} id
	 * @param {String} key
	 * @return {String|null}
	 */
	get(id, key) {
		return localStorage.getItem(`news.${id}.${key}`);
	},

	ctmsRelativeLink(url) {
		url = encodeURIComponent(`${this.HOST}${url}`);
		return `${api.MIDDLEWARE}/api/middleware?url=${url}&raw=1`;
	},

	/**
	 * @returns {{
	 * 	path: String
	 * 	dom: HTMLTemplateElement
	 * 	c2m: Number
	 * }}
	 */
	async fetch({
		path,
		method = "GET",
		query = {},
		targetQuery = {},
		header = {},
		form,
		json
	}) {
		let start = new StopClock();
		let response;

		let tQs = []
		for (let [key, value] of Object.entries(targetQuery))
			tQs.push(`${key}=${value}`);
		
		try {
			response = await myajax({
				url: `${api.MIDDLEWARE}/api/middleware`,
				method,
				header: {
					"Set-Host": "fithou.edu.vn",
					"Set-Origin": this.HOST,
					"Set-Referer": `${this.HOST}${path}`,
					...header
				},
				query: {
					url: `${this.HOST}${path}` + ((tQs.length > 0)
						? "?" + tQs.join("&")
						: ""),
					...query
				},
				form,
				json,
				withCredentials: true,
				formEncodeURL: true
			});
		} catch(error) {
			error.c2m = start.tick();
			await api.__handleResponse("error", error);
			throw { code: -1, description: `news.fetch(${path}): invalid middleware response (middleware: ${api.MIDDLEWARE})`, data: error }
		}

		let dom = document.createElement("template");
		dom.innerHTML = response.data.response;

		return {
			path,
			dom: dom.content,
			c2m: start.tick() - response.runtime,
			...response.data
		}
	},

	/**
	 * @param	{Number}	id 
	 * @returns {{
	 * 	id: Number
	 * 	name: String
	 * 	color: String
	 * 	icon: String
	 * 	node: TreeDOM
	 * }}
	 */
	__c(id) {
		return this.categories["c" + id];
	},

	/**
	 * Handle scroll event
	 * @param {Event} e
	 */
	async check(e) {
		if (!this.loaded || this.catLoading || this.activePage >= this.activeMaxPage)
			return;

		let rect = this.content.listing.articles.getBoundingClientRect();
		if (window.outerHeight - rect.bottom > 50) {
			this.content.listing.appendChild(this.loadIndicator);
			await this.fetchCategory(this.activeCID, this.activePage + 1);
			this.content.listing.removeChild(this.loadIndicator);
		}
	},

	/**
	 * View specified category id
	 * @param	{Number}	id
	 */
	async category(id) {
		if (this.activeCID === id)
			return;

		if (this.activeCID) {
			this.__c(this.activeCID).node.classList.remove("active");
		}
		
		this.__c(id).node.classList.add("active");
		this.activeCID = id;
		this.layout = "listing";

		this.container.loading = true;
		await this.fetchCategory(id, 1);
		this.container.loading = false;
		this.loaded = true;
	},

	async fetchCategory(id, page = 1) {
		this.log("DEBG", `fetching category ${id} page ${page}`);
		this.catLoading = true;

		let response = await this.fetch({
			path: "/Category.aspx",
			targetQuery: { "cid": id, "pi": page - 1 }
		});

		let articles = response.dom.querySelectorAll("#LeftCol_pnlCategory > .article");
		let lists = []

		for (let article of articles) {
			let title = article.querySelector(":scope > a");

			lists.push({
				id: parseInt(/aid=(\d+)/gm.exec(title.href)[1]),
				title: title.innerText.trim(),
				abstract: article.children[5].innerText.trim(),
				date: article.children[3].innerText.trim()
			});
		}

		let pager = response.dom.getElementById("pager");
		this.activeMaxPage = pager.children.length;
		this.activePage = page;

		if (page === 1) {
			this.__c(id).node.lastDate.innerText = lists[0].date;
			this.__c(id).node.counts.innerText = this.activeMaxPage + " trang";
			this.save(id, "lastDate", lists[0].date);
			this.save(id, "counts", this.activeMaxPage);
		}

		// Render
		if (page === 1) {
			emptyNode(this.content.listing.articles);
			this.articles = []
		}

		for (let item of lists) {
			let dateParts = item.date.split("/");
			let postDate = new Date(dateParts[2], parseInt(dateParts[1]) - 1, dateParts[0]);

			let node = makeTree("div", "article", {
				content: { tag: "span", class: "content", child: {
					left: { tag: "span", class: "left", child: {
						top: { tag: "div", class: "top", child: {
							articleTitle: { tag: "a", class: "title", text: item.title },
							tag: {
								tag: "span",
								class: "generalTag",
								text: this.__c(id).name,
								data: { color: this.__c(id).color }
							}
						}},

						abstract: (item.abstract.length > 0)
							? { tag: "div", class: "abstract", text: item.abstract }
							: null
					}},
	
					right: { tag: "span", class: "right", child: {
						date: { tag: "div", class: "date", child: {
							value: {
								tag: "span",
								class: "value",
								text: relativeTime(postDate.getTime() / 1000),
								title: humanReadableTime(postDate, { onlyDate: true })
							},

							icon: { tag: "icon", data: { icon: "calendar" } }
						}},

						readTime: { tag: "div", class: "readTime" }
					}}
				}},

				actions: { tag: "span", class: "actions", child: {
					view: { tag: "icon", data: { icon: "eye" }, title: "xem bài viết" },
					markRead: { tag: "icon", data: { icon: "check" }, title: "đánh dẫu đã đọc" }
				}}
			});

			let readTime = this.get(item.id, "readTime");
			if (readTime) {
				readTime = parseInt(readTime);
				node.content.right.readTime.innerText = `đã đọc ${relativeTime(readTime)}`;
				node.dataset.color = "green";
				node.actions.markRead.style.display = "none";
			} else {
				let color = this.get(item.id, "color");
				if (!color) {
					color = randItem([
						"blue", "yellow", "red", "pink",
						"orange", "purple"
					]);

					this.save(item.id, "color", color);
				}

				node.dataset.color = color;
			}

			/** @type {NewArticle} */
			item = { ...item, cid: id, node }

			node.content.left.top.articleTitle.addEventListener("click", () => this.article(item));
			node.actions.view.addEventListener("click", () => this.article(item));
			node.actions.markRead.addEventListener("click", () => this.markRead(item));
			this.content.listing.articles.appendChild(node);
			this.articles.push(item);
		}

		this.catLoading = false;
	},

	/**
	 * Mark an article as read
	 * @param {Number|NewArticle} article
	 */
	markRead(article) {
		if (typeof article === "number") {
			for (let item of this.articles) {
				if (item.id === article) {
					article = item;
					break;
				}
			}
		}

		let readTime = time();
		article.node.content.right.readTime.innerText = `đã đọc`;
		article.node.dataset.color = "green";
		article.node.actions.markRead.style.display = "none";
		this.save(article.id, "readTime", readTime);
	},

	/**
	 * Start reading an article
	 * @param {NewArticle} article
	 */
	async article(article) {
		this.container.loading = true;

		let cat = this.__c(article.cid);
		this.content.viewer.header.top.articleName.innerText = article.title;
		this.content.viewer.header.metas.cat.innerText = cat.name;
		this.content.viewer.header.metas.cat.dataset.color = cat.color;
		this.content.viewer.header.metas.views.innerText = "";
		this.content.viewer.header.metas.time.innerText = "";
		this.content.viewer.header.metas.original.href = `${this.HOST}/Article.aspx?aid=${article.id}`;
		this.content.viewer.abstract.innerText = article.abstract;
		this.layout = "viewer";

		// Get index
		let index = this.articles.indexOf(article);

		// Next article
		if (this.articles[index - 1]) {
			let newer = this.articles[index - 1];
			this.content.viewer.nav.newer.label.articleName.innerText = newer.title;
			this.content.viewer.nav.newer.onclick = () => this.article(newer);
			this.content.viewer.nav.newer.style.display = null;
		} else {
			this.content.viewer.nav.newer.style.display = "none";
		}

		// Previous article
		if (this.articles[index + 1]) {
			let older = this.articles[index + 1];
			this.content.viewer.nav.older.label.articleName.innerText = older.title;
			this.content.viewer.nav.older.onclick = () => this.article(older);
			this.content.viewer.nav.older.style.display = null;
		} else {
			this.content.viewer.nav.older.style.display = "none";
		}

		let response = await this.fetch({
			path: "/Article.aspx",
			targetQuery: { "aid": article.id }
		});

		let publishTime = response.dom.getElementById("LeftCol_lblThoigianDang").innerText;
		this.content.viewer.header.metas.time.innerText = publishTime.trim();

		let views = response.dom.querySelector("#leftcontent > div > .lanxem").innerText;
		views = /(\d+)/gm.exec(views);
		this.content.viewer.header.metas.views.innerText = (views) ? views[1] : "";

		let content = response.dom.querySelector("#leftcontent > div > div.articleContent");
		
		// Preprocess links
		let links = [
			...content.querySelectorAll("[href]"),
			...content.querySelectorAll("[src]") ]

		for (let link of links) {
			let value;

			if (link.href) {
				value = link.getAttribute("href");
			} else if (link.src) {
				value = link.getAttribute("src");
			}

			if (!value)
				continue;

			if (value[0] === "/") {
				// Relative link
				value = this.ctmsRelativeLink(value);
			}

			if (link.href) {
				link.href = value;
				link.target = "_blank";
			} else if (link.src) {
				link.src = value;
			}
		}

		// Preprocess elements with black text style
		let styleNodes = content.querySelectorAll("[style]");
		for (let n of styleNodes) {
			if (n.style.color === "rgb(0, 0, 0)")
				n.style.color = null;
		}

		// Process tables
		let tables = content.getElementsByTagName("table");
		for (let table of tables) {
			table.classList.add("generalTable");
			table.removeAttribute("border");
			table.removeAttribute("cellpadding");
			table.removeAttribute("cellspacing");
			table.removeAttribute("style");

			let cleans = [ ...table.getElementsByTagName("th"),
				...table.getElementsByTagName("td") ]

			for (let i of cleans) {
				while (i.attributes.length > 0)
					i.removeAttribute(i.attributes[0].name);
			}
		}

		// Process images
		let images = content.getElementsByTagName("img");
		for (let image of images) {
			let newImage = new lazyload({ source: image.src, spinner: "spinner" });
			image.parentElement.replaceChild(newImage.container, image);
		}

		// Append each childrens
		emptyNode(this.content.viewer.content);
		this.content.viewer.content.append(...content.children);

		this.markRead(article);
		this.container.loading = false;
	},

	/**
	 * @param	{"listing" | "viewer"}	layout
	 */
	set layout(layout) {
		this.content.dataset.layout = layout;
	}
}