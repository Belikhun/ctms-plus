/**
 * /tests/scenes/results.js
 * 
 * CTMS plus's results screen.
 * Scene will be loaded before tests framework and
 * wrapper for integration before scanning.
 * 
 * @author	@Belikhun
 * @version	1.0
 * @license	MIT
 */

/** @type {ScenesTree} */
tests.scenes.results = {
	name: "CTMS+ / kết quả học tập",
	classes: "gray",

	store: {
		node: undefined
	},

	activate(scene) {
		if (!this.store.node) {
			this.store.node = document.createElement("div");
			this.store.node.id = "content";

			core.screen.container = this.store.node;
		}

		if (!ResultScreen.screen)
			initGroup({ "results": ResultScreen }, "tests.results");

		this.store.node.appendChild(ResultScreen.screen.view);
		scene.field.appendChild(this.store.node);
	},

	main: {
		name: "Test Chính",

		"reset"() {
			localStorage.removeItem("results.grouping");
			api.HOST_NAME = "fithou";
		},

		async "tải dữ liệu"(step) {
			let handler = oapi.serve("results.html");
			await api.results();

			step.AssertIs("served", handler.served);
		},

		"render lại"(step) {
			ResultScreen.render(null, true);
		}
	},

	kinhte: {
		name: "Dữ Liệu Khoa Kinh Tế",

		"reset"() {
			localStorage.removeItem("results.grouping");
			api.HOST_NAME = "kinhte";
		},

		async "tải dữ liệu"(step) {
			let handler = oapi.serve("results-kinhte.html");
			await api.results();

			step.AssertIs("served", handler.served);
		},

		"render lại"(step) {
			ResultScreen.render(null, true);
		}
	}
}