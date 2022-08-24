//? |-----------------------------------------------------------------------------------------------|
//? |  /tests/tests.js                                                                              |
//? |                                                                                               |
//? |  Copyright (c) 2021 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|


const tests = {
	container: $("#app"),

	/** @type {TestFramework} */
	framework: undefined,

	init() {
		this.framework = new TestFramework(this.container, {
			timeout: 200
		});

		// Register
		let sceneIDs = Object.keys(this.scenes);
		for (let sceneID of sceneIDs) {
			if (typeof this.scenes[sceneID].name !== "string")
				continue;

			this.log("DEBG", `registering scene "${sceneID}"`);
			let sceneObj = this.scenes[sceneID];
			let scene = this.framework.addScene({
				id: sceneID,
				name: sceneObj.name,

				setup: (typeof sceneObj.setup === "function")
					? async (scene) => await sceneObj.setup(scene)
					: () => {},
				
				activate: (typeof sceneObj.activate === "function")
					? async (scene) => await sceneObj.activate(scene)
					: () => {},

				dispose: (typeof sceneObj.dispose === "function")
					? async (scene) => await sceneObj.dispose(scene)
					: () => {}
			});

			let groupIDs = Object.keys(sceneObj);
			for (let groupID of groupIDs) {
				if (typeof sceneObj[groupID] !== "object")
					continue;

				if (typeof sceneObj[groupID].name !== "string")
					continue;

				this.log("DEBG", `registering group "${groupID}"`);
				let groupObj = sceneObj[groupID];
				let group = scene.addGroup({
					id: groupID,
					name: groupObj.name,

					setup: (typeof groupObj.setup === "function")
						? async (group) => await groupObj.setup(group)
						: () => {},

					activate: (typeof groupObj.activate === "function")
						? async (group) => await groupObj.activate(group)
						: () => {},

					dispose: (typeof groupObj.dispose === "function")
						? async (group) => await groupObj.dispose(group)
						: () => {}
				});

				let stepIDs = Object.keys(groupObj);
				for (let stepID of stepIDs) {
					if (["setup", "activate", "dispose"].includes(stepID))
						continue;

					if (typeof groupObj[stepID] !== "function")
						continue;

					this.log("DEBG", `registering step "${stepID}"`);
					group.addStep({
						name: stepID,
						run: async (step) => await groupObj[stepID](step)
					});
				}
			}
		}

		// Activate first scene
		if (this.framework.scenes[0])
			this.framework.scenes[0].activate();
	},

	/**
	 * @typedef {{
	 * 	[x: String]: {
	 * 		[x: String]: (step: TestFrameworkStep) => Promise<Boolean>
	 * 		store: {
	 * 			node: HTMLElement
	 * 			buttons: SQButton[]
	 * 		}
	 * 	} & TestFrameworkGroupOptions
	 * } & TestFrameworkSceneOptions} ScenesTree
	 * 
	 * @type {Object<string, ScenesTree>}
	 */
	scenes: {}
}