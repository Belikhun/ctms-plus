//? |-----------------------------------------------------------------------------------------------|
//? |  /tests/scenes/triangles.js                                                                   |
//? |                                                                                               |
//? |  Copyright (c) 2021 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|


/** @type {ScenesTree} */
tests.scenes.triangles = {
	name: "Triangle Background",
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
			this.store.instance = triBg(this.store.node);
			group.field.appendChild(this.store.node);
		},

		"reset"() {
			this.store.instance.set({
				scale: 2,
				speed: 34,
				count: 38
			});

			this.store.instance.color = "gray";
		},

		"50 triangles"() {
			this.store.instance.generate(50);
		},

		"100 triangles"() {
			this.store.instance.generate(100);
		},

		"200 triangles"() {
			this.store.instance.generate(200);
		},

		"color blue"() {
			this.store.instance.color = "blue";
		},

		"color green"() {
			this.store.instance.color = "green";
		},

		"color red"() {
			this.store.instance.color = "red";
		},

		"scale 8"() {
			this.store.instance.scale = 8;
		},

		"speed 50"() {
			this.store.instance.speed = 50;
		}
	}
}