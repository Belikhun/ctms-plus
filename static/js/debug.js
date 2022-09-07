
const debug = {
	priority: 2,

	init() {

	},

	settings: {
		group: smenu.Group.prototype,

		async init() {
			this.group = new smenu.Group({
				label: "debug",
				icon: "wrench",
				after: core.userSettings.sounds.group
			});

			let tools = new smenu.Child({ label: "tools" }, this.group);

			

			let fw = new smenu.Child({ label: "framework" }, this.group);
			new smenu.components.Button({
				label: "open testing framework",
				color: "brown",
				icon: "flaskVial",
				complex: true,
				onClick: () => window.open("/tests")
			}, fw);
		}
	}
}

core = {
	...core,
	debug
}