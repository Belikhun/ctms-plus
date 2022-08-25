/**
 * /tests/scenes/schedule.js
 * 
 * CTMS plus's schedule screen.
 * Scene will be loaded before tests framework and
 * wrapper for integration before scanning.
 * 
 * @author	@Belikhun
 * @version	1.0
 * @license	MIT
 */

/** @type {ScenesTree} */
tests.scenes.schedule = {
	name: "CTMS+ / lịch học",
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

		if (!ScheduleScreen.screen) {
			initGroup({ "schedule": ScheduleScreen }, "tests.schedule");
		}

		scene.field.appendChild(this.store.node);
	},

	dispose() {

	},

	"schedule1": {
		name: "Test Khóa Biểu 1",

		async "tải dữ liệu khóa biểu 1"(step) {
			let handler = oapi.serve("schedule1.html");
			await api.schedule();

			step.AssertIs("served", handler.served);
		},

		"ngày bắt đầu là 22/03/2021"(step) {
			let value = ScheduleScreen.view.control.dateInput.value;
			step.AssertEqual("date", value, "2021-03-22");
		},

		"phải có đủ 7 ngày trong tuần"(step) {
			let length = ScheduleScreen.view.querySelectorAll(".scheduleTable > tbody > .header").length;
			step.AssertIs("full week", length === 7);
		},

		"có đủ 4 trạng thái"(step) {
			for (let s of ["Học", "Nghỉ", "Học trực tuyến", "Thi"]) {
				let q = ScheduleScreen.view.querySelector(`.generalTag[data-status="${s}"]`);
				step.AssertIs(`status ${s.toLowerCase()}`, q);
			}
		},

		"toàn bộ môn đều đã trôi qua"(step) {
			let notPassed = ScheduleScreen.view.querySelector(".scheduleTable > tbody > .tr:not(.passed)");
			step.AssertIs("all passed", !notPassed);
		}
	},

	render: {
		name: "Test Renderer",

		"render dạng danh sách"() {
			ScheduleScreen.autoChangeRenderer = false;
			ScheduleScreen.defaultRenderMode = "list";
			ScheduleScreen.render();

			ScheduleScreen.autoChangeRenderer = true;
		},

		"render dạng bảng"() {
			ScheduleScreen.autoChangeRenderer = false;
			ScheduleScreen.defaultRenderMode = "table";
			ScheduleScreen.render();

			ScheduleScreen.autoChangeRenderer = true;
		}
	}
}