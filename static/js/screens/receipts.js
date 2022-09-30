//? |-----------------------------------------------------------------------------------------------|
//? |  /static/js/screens/receipts.js                                                               |
//? |                                                                                               |
//? |  Copyright (c) 2022 Belikhun. All right reserved                                              |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

const ReceiptScreen = {
	/** @type {CoreScreen} */
	screen: null,

	/** @type {TreeDOM} */
	view: undefined,

	init() {
		this.view = makeTree("div", "receiptScreen", {

		});

		this.screen = new CoreScreen({
			id: "receipts",
			icon: "receipt",
			title: "hóa đơn học phí",
			description: "xem toàn bộ hóa đơn học phí hiện tại của bạn!"
		});

		this.screen.content = this.view;
		
	}
}

core.screen = {
	...core.screen,

	receipts: ReceiptScreen
}
