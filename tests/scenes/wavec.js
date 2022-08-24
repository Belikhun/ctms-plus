//? |-----------------------------------------------------------------------------------------------|
//? |  /tests/scenes/wavec.js                                                                       |
//? |                                                                                               |
//? |  Copyright (c) 2021 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|


/** @type {ScenesTree} */
tests.scenes.wavec = {
	name: "Wave Container",
	classes: ["grid", "center", "dark"],

	main: {
		name: "Main Tests",

		store: {
			node: undefined,
			instance: undefined
		},

		setup(group) {
			this.store.node = document.createElement("div");
			this.store.node.style.width = "500px";
			this.store.node.style.height = "500px";
			this.store.node.classList.add("relative");
			group.field.appendChild(this.store.node);

			let sampleContent = document.createElement("div");
			sampleContent.classList.add("grid", "center");
			sampleContent.innerText = "wave container";
			sampleContent.style.height = "100%";

			wavec.init(this.store.node);
			this.store.instance = new WaveContainer(sampleContent, { full: true });
		},

		dispose() {
			// Uninit wavec
			wavec.container = undefined;
			wavec.layer = undefined;
			wavec.active = [];
		},

		"color default"() {
			this.store.instance.set({ color: "default" });
		},

		async "show"() {
			this.store.instance.show();
			await delayAsync(800);
		},

		async "hide"() {
			this.store.instance.hide();
			await delayAsync(1200);
		},

		"color purple"() {
			this.store.instance.set({ color: "purple" });
		},

		async "show 2"() {
			this.store.instance.show();
			await delayAsync(800);
		},

		async "hide 2"() {
			await this.store.instance.hide();
			await delayAsync(1200);
		}
	}
}