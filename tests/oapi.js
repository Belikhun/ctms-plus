/**
 * /tests/oapi.js
 * 
 * Overlaying the API. For rerouting API requests to dummy test
 * data, and stuff...
 * 
 * @author	@Belikhun
 * @version	1.0
 * @package	oapi
 */
const oapi = {
	initialized: false,

	/** @type {OverlayAPIHandler[]} */
	handlers: [],

	init() {
		if (this.initialized)
			return;

		// Overwrite the api.request() function. This is basically
		// the heart of the API wrapper.
		api.requester = async (options) => await this.handle(options);

		this.initialized = true;
	},

	/**
	 * Handle the request
	 * @param	{APIRequest}	options
	 * @return	{Promise<APIResponse>}
	 */
	async handle(options) {
		let start = new StopClock();

		for (let handler of this.handlers) {
			let response = await handler.handle(options);

			if (typeof response !== "string" || response.length === 0)
				continue;

			this.log("OKAY", `handle(): request served with options`, options);

			return {
				code: 0,
				status: 200,
				description: "This is dummy test data",
				data: {
					session: "hahawhatisthissessionstring727?",
					headers: {},
					sentHeaders: options.header,
					response,
					time: start.stop
				},
				hash: null,
				user: null,
				runtime: start.stop
			};
		}

		this.log("WARN", `handle(): no handler found to serve request`, options);
	},

	/**
	 * Register a new API handler.
	 * @param	{(options: APIRequest) => Promise<String>}		f
	 * @return	{OverlayAPIHandler}
	 */
	register(f) {
		let handler = new OverlayAPIHandler(f);
		this.handlers.push(handler);
		handler.registered = true;
		return handler;
	},

	/**
	 * Register one-time-handler that will serve a file for
	 * the next request, then un-register immediately.
	 * 
	 * @param	{String}		file
	 * @param	{APIRequest}	options
	 * @return	{OverlayAPIHandler}
	 */
	serve(file, {
		path,
		method,
		query,
		form,
		json,
		header
	} = {}) {
		if (!file)
			throw { code: -1, description: `opai.serve(): file is required!` }

		let handler = this.register(async (options) => {
			if (typeof path === "string" && options.path !== path)
				return false;

			if (typeof method === "string" && options.method !== method)
				return false;

			if (!this.__compare(query, options.query))
				return false;

			if (!this.__compare(form, options.form))
				return false;

			if (!this.__compare(json, options.json))
				return false;

			if (!this.__compare(header, options.header))
				return false;

			let response = await myajax({
				url: `/tests/files/${file}`,
				method: "GET",
				type: "text"
			});

			this.unregister(handler);
			return response;
		});

		this.log("INFO", `serve(${file}): registered`, arguments[1] || "default");
		return handler;
	},

	/**
	 * Unregister a new API handler
	 * @param {OverlayAPIHandler} handler
	 */
	unregister(handler) {
		let pos = this.handlers.indexOf(handler);

		if (pos >= 0)
			this.handlers.splice(pos, 1);

		handler.registered = false;
	},

	__compare(what, to) {
		if (what && typeof what === "object") {
			if (!to || typeof to !== "object")
				return false;

			for (let [key, value] of Object.entries(what)) {
				if (!to[key] || to[key] !== value)
					return false;
			}
		}

		return true;
	}
}

class OverlayAPIHandler {
	/**
	 * New Overlay API Handler Instance
	 * @param	{(options: APIRequest) => Promise<String>}		f
	 */
	constructor(f) {
		this.handler = f;
		this.served = false;
		this.registered = false;
	}

	/**
	 * Handle the request call.
	 * @param	{APIRequest}		options
	 * @return	{Promise<String>}	Raw response body
	 */
	async handle(options) {
		if (!this.handler)
			return false;

		let response = await this.handler(options);
		this.served = true;
		return response;
	}
}