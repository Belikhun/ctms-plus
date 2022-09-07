
const debug = {
	priority: 0,
	
	isEnabled: false,
	loggerOn: false,

	/** @type {HTMLDivElement} */
	loggerView: undefined,

	logDuration: 5000,

	init() {
		this.loggerView = document.createElement("div");
		this.loggerView.classList.add("debugLogger");
		this.loggerView.setAttribute("tooltip-excluded", "");

		onCLOG((level, args) => {
			if (!this.loggerOn)
				return;

			this.makeLog(level, args, this.logDuration);
		});

		let enabled = localStorage.getItem("debug.enabled") === "true";

		// Debug is enabled by default
		// or debug mode is enabled manually.
		if (window.DEBUG || enabled) {
			localStorage.setItem("debug.enabled", true);
			this.enabled = true;
		}
	},

	makeLog(level, args, duration) {
		let instance = new DebugLoggerInstance(level, args, duration);
		instance.show();
	},

	/**
	 * Set debug enable state
	 * @param {Boolean} enabled
	 */
	set enabled(enabled) {
		this.isEnabled = enabled;
		window.DEBUG = enabled;
	},
	
	/**
	 * Set logger visibility
	 * @param {Boolean} logger
	 */
	set logger(logger) {
		this.loggerOn = logger;

		if (this.loggerOn)
			core.container.appendChild(this.loggerView);
		else {
			if (core.container.contains(this.loggerView))
				core.container.removeChild(this.loggerView);
		}
	},

	settings: {
		group: smenu.Group.prototype,

		async init() {
			onInitGroup("core.userSettings.sounds", (group) => {
				this.group = new smenu.Group({
					label: "debug",
					icon: "wrench",
					after: group.group
				});
	
				let tools = new smenu.Child({ label: "tools" }, this.group);
	
				new smenu.components.Checkbox({
					label: "enable debug",
					color: "pink",
					save: "debug.enabled",
					defaultValue: false,
					toast: true,
					onChange: (value) => debug.enabled = value
				}, tools);

				new smenu.components.Checkbox({
					label: "show debug logger",
					color: "blue",
					save: "debug.logger",
					defaultValue: false,
					toast: true,
					onChange: (value) => debug.logger = value
				}, tools);
	
				let fw = new smenu.Child({ label: "framework" }, this.group);
				new smenu.components.Button({
					label: "open testing framework",
					color: "brown",
					icon: "flaskVial",
					complex: true,
					onClick: () => window.open("/tests")
				}, fw);
			});
		}
	}
}

class DebugLoggerInstance {
	/**
	 * New debug logger instance (line)
	 * @param	{CLogLevel}				level 
	 * @param	{CLogArg[]}				args 
	 * @param	{Number}				[duration] 
	 */
	constructor(level, args, duration = 500) {
		this.level = level;
		this.args = args;
		this.duration = duration;
		this.timeout = null;
		this.showing = false;

		this.view = document.createElement("div");
		this.view.classList.add("line");

		this.args.unshift({
			color: oscColor({
				DEBG: "blue",
				OKAY: "green",
				INFO: "whitesmoke",
				WARN: "yellow",
				ERRR: "red",
				CRIT: "purple",
			}[level]),
			text: level,
			padding: 6,
			separate: true
		});

		for (let item of this.args) {
			let node = document.createElement("span");
			node.classList.add("item");

			if (typeof item === "object") {
				if (typeof item.text !== "undefined") {
					if (item.separate) {
						node.classList.add("generalTag", "separate");
						
						if (item.color)
							node.style.backgroundColor = item.color;
					} else {
						if (item.color)
							node.style.color = item.color;
					}

					if (item.padding)
						node.style.minWidth = `${item.padding * 7}px`;

					node.innerText = item.text;
				} else {
					if (item && item.code && item.description)
						node.innerText = `[${item.code}] ${item.description}`;
					else if (item && item.name && item.message)
						node.innerText = `${item.name} >>> ${item.message}`;
					else if (typeof item.toString === "function")
						node.innerText = item.toString();
					else
						node.innerText = JSON.stringify(item);
				}
			} else {
				if (typeof item === "boolean")
					item = item ? "true" : "false";

				if (typeof item === "undefined")
					item = "undefined";

				node.innerText = item;
			}

			this.view.appendChild(node);
		}
	}

	async show() {
		debug.loggerView.appendChild(this.view);
		await nextFrameAsync();
		this.view.style.height = `${this.view.scrollHeight}px`;
		this.timeout = setTimeout(() => this.hide(), this.duration);
	}

	async hide() {
		this.view.classList.add("fade");
		await delayAsync(500);
		debug.loggerView.removeChild(this.view);
	}
}

core = {
	...core,
	debug
}