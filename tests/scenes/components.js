//? |-----------------------------------------------------------------------------------------------|
//? |  /tests/scenes/components.js                                                                  |
//? |                                                                                               |
//? |  Copyright (c) 2021 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|


/** @type {ScenesTree} */
tests.scenes.components = {
	name: "Các Thành Phần",

	buttons: {
		name: "Nút Bấm",

		store: {
			node: undefined,
			buttons: [],
		},

		setup(group) {
			this.store.node = document.createElement("div");
			this.store.node.classList.add("grid-6", "m-20", "buttons");

			this.store.buttons = [
				createButton("default button"),
				createButton("flat"),
				createButton("flat pink", { color: "pink" }),
				createButton("flat with icon", { icon: "clock" }),
				createButton("flat with icon right", { icon: "clock", align: "right" }),
				createButton("flat with complex bg", { complex: true }),
				createButton("flat with yellow complex bg", { complex: true, color: "yellow" }),
				createButton("round"),
				createButton("round pink", { style: "round", color: "pink" }),
				createButton("round with icon", { style: "round", icon: "clock" }),
				createButton("round with icon right", { style: "round", icon: "clock", align: "right" }),
				createButton("round with complex bg", { style: "round", complex: true }),
				createButton("round with yellow complex bg", { style: "round", complex: true, color: "yellow" }),
			]

			this.store.node.append(...this.store.buttons);
			group.field.appendChild(this.store.node);
		},

		"disable all buttons"(step) {
			for (let button of this.store.buttons)
				button.disabled = true;
		},

		"enable all buttons"(step) {
			for (let button of this.store.buttons)
				button.disabled = false;
		},

		"set loading all buttons"(step) {
			for (let button of this.store.buttons)
				button.loading(true);
		},

		"set normal all buttons"(step) {
			for (let button of this.store.buttons)
				button.loading(false);
		}
	},

	
}