/**
 * /tests/scenes/subscribe.js
 * 
 * CTMS plus's subscribe screen.
 * Scene will be loaded before tests framework and
 * wrapper for integration before scanning.
 * 
 * @author	@Belikhun
 * @version	1.0
 * @license	MIT
 */

/** @type {ScenesTree} */
tests.scenes.subscribe = {
	name: "CTMS+ / đăng kí",
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

		if (!SubscribeScreen.screen)
			initGroup({ "subscribe": SubscribeScreen }, "tests.subscribe");

		this.store.node.appendChild(SubscribeScreen.screen.view);
		scene.field.appendChild(this.store.node);
	},

	load: {
		name: "Tải Dữ Liệu",

		async "load"(step) {
			let landing = oapi.serve("subscribe-landing.html");
			let info = oapi.serve("subscribe-info.html");
			await api.subscribe();

			step.AssertIs("served", landing.served);
			step.AssertIs("served", info.served);
		}
	}
}