//? |-----------------------------------------------------------------------------------------------|
//? |  /assets/js/tooltip.js                                                                        |
//? |                                                                                               |
//? |  Copyright (c) 2018-2021 Belikhun. All right reserved                                         |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

const tooltip = {
	initialized: false,
	container: HTMLDivElement.prototype,
	content: HTMLDivElement.prototype,
	render: false,
	prevData: null,
	nodeToShow: null,
	hideTimeout: null,
	fixedWidth: false,
	showTime: 100,

	hooks: [],

	__wait: false,
	__handlingMouseEvent: false,
	__sizeOberving: false,
	__backtrace: 1,

	processor: {
		/**
		 * Build-in element's dataset value processor
		 * 
		 * @param	{HTMLElement}	target		Target element
		 * @param	{String}		key			Key to get value from
		 * @returns	{String|null}				Return value
		 */
		dataset: (target, key) => {
			if (typeof target.dataset[key] === "string")
				return target.dataset[key];

			return null;
		},

		/**
		 * Build-in element's attribute value processor
		 * 
		 * @param	{HTMLElement}	target		Target element
		 * @param	{String}		key			Key to get value from
		 * @returns	{String|null}				Return value
		 */
		attribute: (target, key) => {
			return target.getAttribute(key);
		}
	},

	init() {
		this.container = document.createElement("div");
		this.container.classList.add("tooltip", "hide");
		this.content = document.createElement("div");
		this.content.classList.add("content");
		this.content.setAttribute("style", "");
		this.container.append(this.content);

		document.body.insertBefore(this.container, document.body.childNodes[0]);

		//* EVENTS
		new MutationObserver((mutationList) => {
			for (let mutation of mutationList)
				for (let child of mutation.addedNodes)
					this.attachEvent(child);
		}).observe(document, {
			childList: true,
			subtree: true
		});

		if (typeof ResizeObserver === "function") {
			new ResizeObserver(() => {
				this.container.style.width = this.content.clientWidth + "px";
				this.container.style.height = this.content.clientHeight + "px";
			}).observe(this.content);

			this.__sizeOberving = true;
		}

		//* BUILT IN HOOKS
		this.addHook({
			on: "dataset",
			key: "tip"
		});

		this.addHook({
			on: "attribute",
			key: "tooltip"
		});

		this.addHook({
			on: "attribute",
			key: "title",
			handler: ({ target, value }) => {
				target.setAttribute("tooltip", value);
				target.removeAttribute("title");

				return value;
			}
		});

		this.initialized = true;
	},

	addHook({
		on = null,
		key = null,
		handler = ({ target, value }) => value,
		priority = 1,
		noPadding = false
	} = {}) {
		if (typeof on !== "string" || !["dataset", "attribute"].includes(on))
			throw { code: -1, description: `tooltip.addHook(): \"on\": unexpected '${on}', expecting 'dataset'/'attribute'` }

		if (typeof key !== "string")
			throw { code: -1, description: `tooltip.addHook(): \"key\" is not a valid string` }

		if (typeof handler !== "function")
			throw { code: -1, description: `tooltip.addHook(): \"handler\" is not a valid function` }

		if (typeof priority !== "number")
			throw { code: -1, description: `tooltip.addHook(): \"priority\" is not a valid number` }

		if (typeof noPadding !== "boolean")
			throw { code: -1, description: `tooltip.addHook(): \"noPadding\" is not a valid boolean` }

		this.hooks.push({ on, key, handler, priority, noPadding });
		this.hooks.sort((a, b) => (a.priority < b.priority) ? 1 : (a.priority > b.priority) ? -1 : 0);
	},

	/**
	 * Try to get value from target with specified hook
	 * 
	 * @param	{HTMLElement}	target
	 * @param	{Object}		hook
	 * @returns	{String|null}
	 */
	getValue(target, hook) {
		if (!target.style || !target.dataset)
			throw { code: -1, description: `tooltip.getValue(): not a valid Element` }

		if (typeof this.processor[hook.on] !== "function")
			return null;

		return this.processor[hook.on](target);
	},

	/**
	 * Attach tooltip mouse event to Element (if possible)
	 * @param {HTMLElement} target 
	 */
	attachEvent(target) {
		// Check for hook that match current target
		for (let hook of this.hooks) {
			if (!this.getValue(target, hook))
				continue;

			target.addEventListener("mouseenter", () => {
				let value = this.getValue(target, hook);
				let showValue = item.handler({ target, value });

				if (showValue) {
					this.show(showValue, target, item.noPadding);
				}
			});

			break;
		}
	},

	mouseMove(event) {
		let checkNode = true;

		if (this.nodeToShow) {
			checkNode = false;
			
			if (!this.__checkSameNode(event.target, this.nodeToShow)) {
				checkNode = true;
				
				if (!this.hideTimeout)
					this.hideTimeout = setTimeout(() => {
						this.nodeToShow = null;
						this.prevData = null;
						this.container.classList.remove("show");

						this.hideTimeout = setTimeout(() => {
							this.container.classList.add("hide");
							this.fixedWidth = false;
							this.content.style.width = null;
						}, 300);
					}, this.showTime);
			} else {
				clearTimeout(this.hideTimeout);
				this.hideTimeout = null;
			}
		}

		if (checkNode)
			for (let item of this.hooks) {
				let _e = event.target;
				let _v = null;
				let _t = 0;

				while (_e && (_t <= item.backtrace || _e.getAttribute("tooltip-child"))) {
					switch (item.on) {
						case "dataset":
							if (typeof _e.dataset[item.key] === "string")
								_v = _e.dataset[item.key];
							break;
					
						case "attribute":
							_v = _e.getAttribute(item.key);
							break;
					}

					if (_v)
						break;
					
					_e = _e.parentElement;
					_t++;
				}

				if (!_v)
					continue;

				if (_v === this.prevData) {
					this.nodeToShow = _e;
					return;
				}

				this.prevData = _v;

				let _s = item.handler({
					target: _e,
					value: _v
				});

				if (_s) {
					this.__backtrace = item.backtrace;
					this.show(_s, _e, item.noPadding);

					break;
				}
			}

		if (this.container.classList.contains("hide"))
			return;

		let xPos = event.clientX + 20;
		let yPos = event.clientY + 30;

		// Set a specified width value if tooltip content width overflow
		// out of the viewbox
		if (!this.fixedWidth && event.view.innerWidth - event.clientX < this.content.clientWidth) {
			this.content.style.width = `${event.view.innerWidth - event.clientX - 10}px`;
			this.fixedWidth = true;
		}

		if (event.clientX > this.content.clientWidth)
			if ((event.view.innerWidth - this.content.clientWidth) / Math.max(xPos, 1) < 1.4)
				xPos -= (this.content.clientWidth + 20);

		if ((event.view.innerHeight - this.content.clientHeight) / Math.max(yPos, 1) < 1.1)
			yPos -= (this.content.clientHeight + 40);

		this.container.style.transform = `translate(${xPos}px, ${yPos}px)`;
	},

	/**
	 * Show the tooltip on node
	 * 
	 * @param {String|Object}	data			Text to show
	 * @param {HTMLElement}		showOnNode		Node to show text on
	 * @param {Boolean}			noPadding		Remove padding around tooltip
	 * @returns 
	 */
	async show(data, showOnNode, noPadding = false) {
		if (!this.initialized)
			return false;
		
		if (showOnNode && showOnNode.style)
			this.nodeToShow = showOnNode;
		
		clearTimeout(this.hideTimeout);
		this.hideTimeout = null;
		this.container.classList.remove("hide");

		this.fixedWidth = false;
		this.content.style.width = null;

		await nextFrameAsync();
		this.container.classList.add("show");

		switch (typeof data) {
			case "object":
				if (data.classList && data.dataset) {
					emptyNode(this.content);
					this.content.append(data);
					break;
				}

				this.content.innerText = JSON.stringify(data, null, 4);
				break;

			default:
				this.content.innerHTML = data;
				break;
		}

		this.content.dataset.noPadding = noPadding;

		//? TRIGGER REFLOW TO REPLAY ANIMATION
		this.container.style.animation = "none";
		requestAnimationFrame(() => {
			this.container.style.animation = null;

			if (!this.__sizeOberving) {
				this.container.style.width = this.content.clientWidth + "px";
				this.container.style.height = this.content.clientHeight + "px";
			}
		});

		return true;
	}
}