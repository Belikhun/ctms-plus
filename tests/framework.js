//? |-----------------------------------------------------------------------------------------------|
//? |  /tests/framework.js                                                                          |
//? |                                                                                               |
//? |  Copyright (c) 2021 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|


class TestFramework {
	/**
	 * Test framework instance
	 * @param	{HTMLElement}	container 
	 * @param	{Object}		options 
	 * @param	{Boolean}		autoplay	Auto perform tests
	 * @param	{Number}		timeout		Delay in each steps 
	 */
	constructor(container, {
		autoplay = false,
		timeout = 500
	} = {}) {
		if (typeof container !== "object" || !container.classList)
			throw { code: -1, description: `TestFramework(): not a valid container!` }

		this.container = container;
		this.autoplay = autoplay;
		this.timeout = timeout;

		/** @type {TestFrameworkScene[]} */
		this.scenes = []

		/** @type {TestFrameworkScene} */
		this.activeScene = undefined;

		this.scenesNode = document.createElement("span");
		this.scenesNode.classList.add("scenes");

		this.view = makeTree("span", "viewer", {
			header: { tag: "div", class: "header", child: {
				autoplay: { tag: "span", class: ["input", "autoplay"], child: {
					label: { tag: "span", class: "label", text: "autoplay" },
					input: {
						tag: "input",
						type: "checkbox",
						checked: this.autoplay
					}
				}},

				timeout: { tag: "span", class: ["input", "timeout"], child: {
					label: { tag: "span", class: "label", text: "timeout" },
					input: {
						tag: "input",
						type: "range",
						class: ["sq-slider", "blue"],
						min: 100,
						max: 5000,
						step: 100,
						value: this.timeout
					},

					value: { tag: "span", class: "value", text: this.timeout + "ms" }
				}}
			}},

			panel: { tag: "div", class: "panel", child: {
				steps: { tag: "div", class: "steps" },
				field: { tag: "div", id: "testField", class: "field" }
			}}
		});
		
		this.view.header.autoplay.input.addEventListener("input", () => {
			this.autoplay = this.view.header.autoplay.input.checked;
		});

		this.view.header.timeout.input.addEventListener("input", () => {
			this.timeout = parseInt(this.view.header.timeout.input.value);
			this.view.header.timeout.value.innerText = this.timeout + "ms";
		});

		this.container.append(this.scenesNode, this.view);
	}

	get stepsNode() {
		return this.view.panel.steps;
	}

	get field() {
		return this.view.panel.field;
	}

	/**
	 * Add a new scene
	 * @param	{TestFrameworkSceneOptions}		options
	 * @return	{TestFrameworkScene}
	 */
	addScene(options) {
		let scene = new TestFrameworkScene(this, options);
		this.scenes.push(scene);
		return scene;
	}
}

/**
 * @typedef {{
 * 	id: String
 * 	name: String
 * 	setup(scene: TestFrameworkScene)
 * 	activate(scene: TestFrameworkScene)
 * 	dispose(scene: TestFrameworkScene)
 * }} TestFrameworkSceneOptions
 */

class TestFrameworkScene {
	/**
	 * Construct a new scene
	 * @param	{TestFramework}					instance
	 * @param	{TestFrameworkSceneOptions}		options
	 */
	constructor(instance, {
		id = "SampleScene",
		name = "Sample Scene",
		setup = () => {},
		activate = () => {},
		dispose = () => {}
	} = {}) {
		this.id = id;
		this.name = name;
		this.instance = instance;
		this.setupHandler = setup;
		this.activateHandler = activate;
		this.disposeHandler = dispose;

		this.titleNode = document.createElement("div");
		this.titleNode.classList.add("title");
		this.titleNode.innerText = name;

		this.button = makeTree("button", ["tests-btn", "scene"], {
			idValue: { tag: "div", class: "id", text: this.id },
			nameValue: { tag: "div", class: "name", text: this.name }
		});

		this.button.addEventListener("click", () => this.activate());
		this.setup();

		/** @type {TestFrameworkGroup[]} */
		this.groups = []
	}

	async setup() {
		this.button.disabled = true;
		this.instance.scenesNode.appendChild(this.button);
		await this.setupHandler();
		this.button.disabled = false;
	}

	async activate() {
		this.button.disabled = true;

		if (this.instance.activeScene)
			this.instance.activeScene.dispose();

		this.instance.activeScene = this;
		await this.activateHandler(this);
		emptyNode(this.instance.stepsNode);
		this.instance.stepsNode.appendChild(this.titleNode);

		for (let group of this.groups)
			await group.setup();

		this.button.disabled = false;
		this.button.classList.add("active");
	}

	async dispose() {
		this.button.disabled = true;
		await this.disposeHandler(this);
		this.button.disabled = false;
		this.reset();
	}

	reset() {
		this.button.classList.remove("active");
		emptyNode(this.field);

		for (let group of this.groups)
			group.reset();
	}

	/**
	 * Add a new group
	 * @param	{TestFrameworkGroupOptions}		options
	 * @return	{TestFrameworkGroup}
	 */
	addGroup(options) {
		let group = new TestFrameworkGroup(this, options);
		this.groups.push(group);
		return group;
	}

	get field() {
		return this.instance.field;
	}
}

/**
 * @typedef {{
 * 	id: String
 * 	name: String
 * 	setup(group: TestFrameworkGroup)
 * 	activate(group: TestFrameworkGroup)
 * 	dispose(group: TestFrameworkGroup)
 * }} TestFrameworkGroupOptions
 */

class TestFrameworkGroup {
	/**
	 * Construct a new group that contain test steps
	 * @param	{TestFrameworkScene}			scene
	 * @param	{TestFrameworkGroupOptions}		options
	 */
	constructor(scene, {
		id = "Group1",
		name = "Sample Group",
		setup = () => {},
		activate = () => {},
		dispose = () => {}
	} = {}) {
		this.id = id;
		this.name = name;
		this.scene = scene;
		this.setupHandler = setup;
		this.activateHandler = activate;
		this.disposeHandler = dispose;

		this.button = makeTree("button", ["tests-btn", "group"], {
			idValue: { tag: "div", class: "id", text: this.id },
			nameValue: { tag: "div", class: "name", text: this.name }
		});

		this.button.addEventListener("click", () => this.activate());

		/** @type {TestFrameworkStep[]} */
		this.steps = []
	}

	async setup() {
		this.button.disabled = true;

		this.scene.instance.stepsNode.appendChild(this.button);
		await this.setupHandler(this);
		for (let step of this.steps)
			await step.setup();

		this.button.disabled = false;
	}

	async activate() {
		this.button.classList.add("active");
		this.button.disabled = true;

		this.reset();
		await this.activateHandler(this);
		await this.run();

		this.button.disabled = false;
		this.button.classList.remove("active");
	}

	async dispose() {
		this.button.disabled = true;
		this.reset();
		await this.disposeHandler(this);
		this.button.disabled = false;
	}

	async run() {
		for (let step of this.steps) {
			await delayAsync(this.scene.instance.timeout);

			if (!await step.run())
				break;
		}
	}

	reset() {
		for (let step of this.steps)
			step.reset();
	}

	/**
	 * Add a new group
	 * @param	{TestFrameworkStepOptions}		options
	 * @return	{TestFrameworkStep}
	 */
	addStep(options) {
		let step = new TestFrameworkStep(this, options);
		this.steps.push(step);
		return step;
	}

	get field() {
		return this.scene.field;
	}
}

/**
 * @typedef {{
 * 	name: String
 *	setup(step: TestFrameworkStep)
 *	run(step: TestFrameworkStep): Promise<Boolean>
 * }} TestFrameworkStepOptions
 */

class TestFrameworkStep {
	/**
	 * Construct a new step
	 * @param	{TestFrameworkGroup}			group
	 * @param	{TestFrameworkStepOptions}		options
	 */
	constructor(group, {
		name = "Sample Step",
		setup = () => {},
		run = () => {}
	} = {}) {
		this.group = group;
		this.setupHandler = setup;
		this.runHandler = run;
		this.failed = false;

		this.button = makeTree("button", ["tests-btn", "step"], {
			line: { tag: "span", class: "line" },
			nameValue: { tag: "span", class: "name" },
			detail: { tag: "span", class: "detail" }
		});

		this.button.addEventListener("click", () => this.run());
		this.name = name;
		this.status = "ready";
	}

	reset() {
		this.failed = false;
		this.status = "ready";
		this.detail = "";
		this.button.classList.remove("active");
		this.button.disabled = false;
	}

	async setup() {
		this.button.disabled = true;
		this.group.scene.instance.stepsNode.appendChild(this.button);
		await this.setupHandler(this);
		this.button.disabled = false;
	}

	/**
	 * Run this step!
	 * @return	{Promise<Boolean>}	step passed?
	 */
	async run() {
		this.reset();
		await nextFrameAsync();

		this.status = "running";
		let result;

		try {
			result = await this.runHandler(this);
		} catch(e) {
			this.failed = true;
			this.status = "broken";
			clog("EXCP", `test ${this.path} generated an exception!`, e);
			errorHandler(e);
		}

		// Not failed yet, keep checking!
		if (!this.failed) {
			if (result === false) {
				this.failed = true;
				this.status = "failed";
				clog("ERRR", `test ${this.path} failed!`);
			}
		}

		if (!this.failed) {
			this.status = "passed";
			clog("OKAY", `test ${this.path} passed!`);
		}

		this.button.disabled = false;
		this.button.classList.add("active");
		return !this.failed;
	}

	get path() {
		return [
			this.group.scene.id,
			this.group.id
		].join(".") + ` -> "${this.name}"`;
	}

	/**
	 * Update step name
	 * @param	{String}	name
	 */
	set name(name) {
		this.button.nameValue.innerText = name;
	}

	get name() {
		return this.button.nameValue.innerText;
	}

	/**
	 * Update step detail
	 * @param	{String}	detail
	 */
	set detail(detail) {
		this.button.detail.innerText = detail;
	}

	get detail() {
		return this.button.detail.innerText;
	}

	/**
	 * Set step status
	 * @param {"ready" | "running" | "passed" | "failed" | "broken"}	status
	 */
	set status(status) {
		this.button.dataset.status = status;
	}

	/**
	 * Get step status
	 * @return {"ready" | "running" | "passed" | "failed" | "broken"}
	 */
	get status() {
		return this.button.dataset.status;
	}
}