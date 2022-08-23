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
			this.store.node.classList.add("grid-6", "center", "m-20", "buttons");

			this.store.buttons = [
				createButton("default button"),
				createButton("flat"),
				createButton("flat pink", { color: "pink" }),
				createButton("flat with icon", { icon: "clock" }),
				createButton("flat with icon right", { icon: "clock", align: "right" }),
				createButton("flat with complex bg", { complex: true }),
				createButton("flat with yellow complex bg", { complex: true, color: "yellow" }),
				createButton("", { complex: true, icon: "clock" }),
				createButton("round"),
				createButton("round pink", { style: "round", color: "pink" }),
				createButton("round with icon", { style: "round", icon: "clock" }),
				createButton("round with icon right", { style: "round", icon: "clock", align: "right" }),
				createButton("round with complex bg", { style: "round", complex: true }),
				createButton("round with yellow complex bg", { style: "round", complex: true, color: "yellow" }),
				createButton("", { style: "round", icon: "clock", complex: true, color: "red" }),
			]

			this.store.node.append(...this.store.buttons);
			group.field.appendChild(this.store.node);
		},

		"disable all buttons"() {
			for (let button of this.store.buttons)
				button.disabled = true;
		},

		"enable all buttons"() {
			for (let button of this.store.buttons)
				button.disabled = false;
		},

		"set loading all buttons"() {
			for (let button of this.store.buttons)
				button.loading(true);
		},

		"set normal all buttons"() {
			for (let button of this.store.buttons)
				button.loading(false);
		}
	},

	switch: {
		name: "Công Tắc",

		store: {
			node: undefined,
			switches: [],
		},

		setup(group) {
			this.store.node = document.createElement("div");
			this.store.node.classList.add("grid-6", "center", "m-20", "switch");

			this.store.switches = [
				createSwitch({ label: "default" }),
				createSwitch({ label: "pink", color: "pink" }),
				createSwitch({ label: "default true", value: true }),
				createSwitch({ label: "a very very very very looooooooooooooooong label" }),
				createSwitch({ label: "disabled", disabled: true }),
				createSwitch({ label: "disabled pink", color: "pink", disabled: true })
			]

			for (let s of this.store.switches)
				this.store.node.append(s.group);

			group.field.appendChild(this.store.node);
		},

		"reset"() {
			this.store.switches[0].value = false;
			this.store.switches[1].value = false;
			this.store.switches[2].value = true;
			this.store.switches[3].value = false;
			this.store.switches[4].value = false;
			this.store.switches[5].value = false;
			this.store.switches[4].disabled = true;
			this.store.switches[5].disabled = true;
		},

		"click on all switch"() {
			for (let s of this.store.switches)
				s.input.click();
		},

		"disabled switches should stay off"(step) {
			step.AssertEqual("switch 5", this.store.switches[4].value, false);
			step.AssertEqual("switch 6", this.store.switches[5].value, false);
		},

		"enabled switch should be disabled"(step) {
			step.AssertEqual("switch 3", this.store.switches[2].value, false);
		},

		"switch on all"() {
			for (let s of this.store.switches)
				s.value = true;
		},

		"disabled switches should be on"(step) {
			step.AssertEqual("switch 5", this.store.switches[4].value, true);
			step.AssertEqual("switch 6", this.store.switches[5].value, true);
		}
	},

	listInput: {
		name: "Danh Sách",

		store: {
			node: undefined,
			input: undefined,
		},

		setup(group) {
			this.store.node = document.createElement("div");
			this.store.node.classList.add("m-20", "listInput");

			this.store.input = createListInput({
				label: "sample list input!",
				values: [
					"hewo this is the first entry!",
					"wowo i can have more than 1 ?!?"
				]
			});

			this.store.node.append(this.store.input.group);
			group.field.appendChild(this.store.node);
		},

		"add new input field"() {
			this.store.input.addInput("nicee");
		},

		"third field is nicee"(step) {
			step.AssertEqual("value", this.store.input.values[2], "nicee");
		},

		"clear all fields"() {
			this.store.input.clearAll();
		},

		"should be no values left"(step) {
			step.AssertEqual("length", this.store.input.values.length, 0);
		},

		"reset"() {
			this.store.input.clearAll();
			this.store.input.values = [
				"hewo this is the first entry!",
				"wowo i can have more than 1 ?!?"
			]
		}
	}
}