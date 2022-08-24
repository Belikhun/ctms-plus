//? |-----------------------------------------------------------------------------------------------|
//? |  /tests/scenes/components.js                                                                  |
//? |                                                                                               |
//? |  Copyright (c) 2021 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|


/** @type {ScenesTree} */
tests.scenes.components = {
	name: "Các Thành Phần",
	classes: "overflow",

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

		async "toggle all switch"() {
			for (let s of this.store.switches) {
				s.input.click();
				s.input.blur();
				await delayAsync(100);
			}
		},

		"disabled switches should stay off"(step) {
			step.AssertEqual("switch 5", this.store.switches[4].value, false);
			step.AssertEqual("switch 6", this.store.switches[5].value, false);
		},

		"enabled switch should be disabled"(step) {
			step.AssertEqual("switch 3", this.store.switches[2].value, false);
		},

		async "switch on all"() {
			for (let s of this.store.switches) {
				s.value = true;
				await delayAsync(100);
			}
		},

		"disabled switches should be on"(step) {
			step.AssertEqual("switch 5", this.store.switches[4].value, true);
			step.AssertEqual("switch 6", this.store.switches[5].value, true);
		}
	},

	slider: {
		name: "Thanh Trượt",

		store: {
			node: undefined,
			sliders: [],
		},

		setup(group) {
			this.store.node = document.createElement("div");
			this.store.node.classList.add("grid-6", "m-20", "switch");

			this.store.sliders = [
				createSlider({ value: 0 }),
				createSlider({ color: "blue", value: 0 }),
				createSlider({ min: 10, max: 20, step: 1, value: 10 }),
				createSlider({ min: 0, max: 2, step: 0.1, value: 1 }),
				createSlider({ min: -10, max: 10, step: 5, value: 5 }),
				createSlider({ min: 0, max: 1, step: 1, value: 0, color: "blue", disabled: true }),
			]

			for (let s of this.store.sliders)
				this.store.node.append(s.group);

			group.field.appendChild(this.store.node);
		},

		"reset"() {
			this.store.sliders[0].value = 0;
			this.store.sliders[1].value = 0;
			this.store.sliders[2].value = 10;
			this.store.sliders[3].value = 1;
			this.store.sliders[4].value = 5;
			this.store.sliders[5].value = 0;
		},

		async "set all to 1000"() {
			for (let s of this.store.sliders) {
				s.value = 1000;
				await delayAsync(100);
			}
		},

		"values should be capped at max"(step) {
			step.AssertEqual("slider 1", this.store.sliders[0].value, 10);
			step.AssertEqual("slider 2", this.store.sliders[1].value, 10);
			step.AssertEqual("slider 3", this.store.sliders[2].value, 20);
			step.AssertEqual("slider 4", this.store.sliders[3].value, 2);
			step.AssertEqual("slider 5", this.store.sliders[4].value, 10);
			step.AssertEqual("slider 6", this.store.sliders[5].value, 1);
		},

		async "set all to -1000"() {
			for (let s of this.store.sliders) {
				s.value = -1000;
				await delayAsync(100);
			}
		},

		"values should be capped at min"(step) {
			step.AssertEqual("slider 1", this.store.sliders[0].value, 0);
			step.AssertEqual("slider 2", this.store.sliders[1].value, 0);
			step.AssertEqual("slider 3", this.store.sliders[2].value, 10);
			step.AssertEqual("slider 4", this.store.sliders[3].value, 0);
			step.AssertEqual("slider 5", this.store.sliders[4].value, -10);
			step.AssertEqual("slider 6", this.store.sliders[5].value, 0);
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

		async "add new input field"() {
			this.store.input.addInput("nicee");
			await delayAsync(100);
			this.store.input.addInput("the second");
		},

		"third field is nicee"(step) {
			step.AssertEqual("value", this.store.input.values[2], "nicee");
		},

		"clear all fields"() {
			this.store.input.clearAll();
		},

		"should be empty"(step) {
			step.AssertEqual("length", this.store.input.values.length, 0);
		},

		"reset"() {
			this.store.input.clearAll();
			this.store.input.values = [
				"hewo this is the first entry!",
				"wowo i can have more than 1 ?!?"
			]
		}
	},

	selectInput: {
		name: "Lựa Chọn",

		store: {
			node: undefined,
			selects: undefined,

			options: {
				default: "default options!",
				option1: "option numba wan",
				option2: "option numba too",
				option3: "option numba thee"
			}
		},

		setup(group) {
			this.store.node = document.createElement("div");
			this.store.node.classList.add("grid-3", "v-base", "m-20", "selects");

			this.store.selects = [
				createSelectInput({ options: this.store.options }),
				createSelectInput({ color: "pink", icon: "hive", options: this.store.options }),
				createSelectInput({ fixed: true, icon: "clock", options: this.store.options }),
			]

			for (let s of this.store.selects)
				this.store.node.append(s.group);

			group.field.appendChild(this.store.node);
		},

		"expand all"() {
			for (let s of this.store.selects)
				s.show();
		},

		async "select each options"() {
			let keys = Object.keys(this.store.options);

			for (let key of keys) {
				for (let s of this.store.selects) {
					s.value = key;
					await delayAsync(100);
				}
			}
		},

		async "collapse all"() {
			for (let s of this.store.selects) {
				s.hide();
				await delayAsync(100);
			}
		}
	},

	input: {
		name: "Hộp Văn Bản",

		store: {
			node: undefined,
			inputs: undefined
		},

		setup(group) {
			this.store.node = document.createElement("div");
			this.store.node.classList.add("grid-6", "v-base", "m-20", "inputs");

			this.store.inputs = [
				createInput({ label: "default" }),
				createInput({ label: "default with value", value: "hey!" }),
				createInput({ label: "number purple", type: "number", color: "purple" }),
				createInput({ label: "password", type: "password", value: "censored..." }),
				createInput({ label: "animated", animated: true }),
				createInput({ label: "disabled", disabled: true })
			]

			for (let s of this.store.inputs)
				this.store.node.append(s.group);

			group.field.appendChild(this.store.node);
		},

		"show animated input"() {
			this.store.inputs[4].group.classList.add("show");
		},

		"number input accept only numbers"(step) {
			this.store.inputs[2].input.focus();
			this.store.inputs[2].value = "1npu7th15t0y0ursp1n3";
			step.AssertEqual("value", this.store.inputs[2].value, "");
		},

		async "set messages"() {
			for (let i of this.store.inputs) {
				i.set({ message: "dis is input message" });
				await delayAsync(100);
			}
		},

		async "set random values"() {
			for (let i of this.store.inputs) {
				i.input.focus();
				i.value = randItem([ "hey", "hee", "haa", "hoo", "hii" ]);
				await delayAsync(100);
			}
		},

		"all messages should be removed"(step) {
			for (let [i, input] of this.store.inputs.entries())
				step.AssertIs(`input ${i + 1}`, !input.group.classList.contains("message"));
		}
	},

	choice: {
		name: "Lựa Chọn",

		store: {
			node: undefined,
			choices: [],

			default: {
				clock: { title: "This is a clock", icon: "clock" },
				laptop: { title: "This is a laptop", icon: "laptop" },
				lock: { title: "This is a lock", icon: "lock" }
			}
		},

		setup(group) {
			this.store.node = document.createElement("div");
			this.store.node.classList.add("grid-3", "v-base", "p-20", "bg-gray", "choices");

			this.store.choices = [
				createChoiceInput({ color: "blue", choices: this.store.default }),
				createChoiceInput({ color: "pink", choices: this.store.default })
			]

			for (let s of this.store.choices)
				this.store.node.append(s.group);

			group.field.appendChild(this.store.node);
		},

		async "reset"() {
			for (let choice of this.store.choices)
				choice.set({ choices: this.store.default });
		},

		async "add random items"() {
			for (let choice of this.store.choices) {
				for (let i = 0; i < 3; i++) {
					choice.add({
						key: randString(6),
						icon: randItem(["hand", "play", "note", "print", "atom", "shapes", "compass"]),
						title: "random item"
					});

					await delayAsync(100);
				}
			}
		},

		async "select each choice"() {
			for (let choice of this.store.choices) {
				for (let key of Object.keys(choice.choices)) {
					choice.value = key;
					await delayAsync(100);
				}
			}
		},

		"value should not be null"(step) {
			for (let [i, choice] of this.store.choices.entries())
				step.AssertNotNull(`choice ${i + 1}`, choice.value);
		}
	},

	progress: {
		name: "Thanh Tiến Trình",

		store: {
			node: undefined,
			bars: []
		},

		setup(group) {
			this.store.node = document.createElement("div");
			this.store.node.classList.add("grid-6", "v-base", "m-20", "progress");

			this.store.bars = [
				createProgressBar(),
				createProgressBar({ warningZone: 20, progress: 10 }),
				createProgressBar({ color: "pink", warningZone: 20, progress: 20 }),
				createProgressBar({ color: "yellow", warningZone: 40, progress: 30, style: "round" }),
				createProgressBar({ color: "green", warningZone: 40, progress: 30, style: "round", blink: "fade" }),
				createProgressBar({
					color: "red",
					warningZone: 10,
					progress: 40,
					style: "round",
					blink: "grow",
					left: "left",
					right: "right"
				}),
			]

			for (let s of this.store.bars)
				this.store.node.append(s.group);

			group.field.appendChild(this.store.node);
		},

		async "set 20"() {
			for (let bar of this.store.bars) {
				bar.value = 20;
				await delayAsync(100);
			}
		},

		async "set 50"() {
			for (let bar of this.store.bars) {
				bar.value = 50;
				await delayAsync(100);
			}
		},

		async "set 80"() {
			for (let bar of this.store.bars) {
				bar.value = 80;
				await delayAsync(100);
			}
		},

		async "set 100"() {
			for (let bar of this.store.bars) {
				bar.value = 100;
				await delayAsync(100);
			}
		}
	}
}