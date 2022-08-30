#!/usr/bin/env python
# -*- coding: utf-8 -*-

from lib import ehook
from lib.log import log

import os
log("OKAY", "Imported: os")

from colorama import Fore
log("OKAY", "Imported: colorama")

from selenium import webdriver
log("OKAY", "Imported: selenium.webdriver")

from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
log("OKAY", "Imported: selenium.webdriver.common.desired_capabilities.DesiredCapabilities")

import time
log("OKAY", "Imported: time")

from threading import Thread
log("OKAY", "Imported: threading.Thread")

from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
log("OKAY", "Imported: http.server")

log("INFO", "cwd = " + os.getcwd())

class LocalStorage:
	# Provide access to localStorage API
    def __init__(self, driver):
        self.driver = driver

    def __len__(self):
        return self.driver.execute_script("return window.localStorage.length;")

    def items(self):
        return self.driver.execute_script(
            "let ls = window.localStorage, items = {}; "
            "for (let i = 0, k; i < ls.length; ++i) "
            "  items[k = ls.key(i)] = ls.getItem(k); "
            "return items; ")

    def keys(self):
        return self.driver.execute_script(
            "let ls = window.localStorage, keys = []; "
            "for (let i = 0; i < ls.length; ++i) "
            "  keys[i] = ls.key(i); "
            "return keys; ")

    def get(self, key):
        return self.driver.execute_script("return window.localStorage.getItem(arguments[0]);", key)

    def set(self, key, value):
        self.driver.execute_script(
            "window.localStorage.setItem(arguments[0], arguments[1]);", key, value)

    def has(self, key):
        return key in self.keys()

    def remove(self, key):
        self.driver.execute_script(
            "window.localStorage.removeItem(arguments[0]);", key)

    def clear(self):
        self.driver.execute_script("window.localStorage.clear();")

    def __getitem__(self, key):
        value = self.get(key)
        if value is None:
            raise KeyError(key)
        return value

    def __setitem__(self, key, value):
        self.set(key, value)

    def __contains__(self, key):
        return key in self.keys()

    def __iter__(self):
        return self.items().__iter__()

    def __repr__(self):
        return self.items().__str__()

PORT = 8000
class MyServer(Thread):
	class MyHTTPHandler(SimpleHTTPRequestHandler):
		def log_message(self, logFormat, *args):
			try:
				if (int(args[0]) >= 400):
					log("WARN", f"HTTP {int(args[0])} {args[1]} {self.path}")
					return
			except ValueError:
				return

			if (int(args[1]) >= 400):
				log("WARN", f"{args[0]} >>> HTTP {args[1]}")

	def run(self):
		log("INFO", f"HTTP Server Will Start At Port {PORT}")
		self.server = ThreadingHTTPServer(("", PORT), self.MyHTTPHandler)
		self.server.serve_forever()
	def stop(self):
		self.server.shutdown()
		log("INFO", f"HTTP Server Stopped")

server = MyServer()
server.start()

# Initialize chrome driver
chromeOptions = webdriver.ChromeOptions()
chromeOptions.add_argument("--headless")
chromeOptions.add_argument("--no-sandbox")
chromeOptions.add_argument("--disable-dev-shm-usage")
chromeOptions.add_argument("--log-level=3")
desiredCapabilities = DesiredCapabilities.CHROME

try:
	driver = webdriver.Chrome(
		options = chromeOptions,
		desired_capabilities = desiredCapabilities
	)
except Exception as e:
	server.stop()
	raise e

# load the desired webpage
driver.get("http://localhost:8000")
localStorage = LocalStorage(driver)
loadStart = time.time()
TIME_OUT = 20

log("DEBG", f"Page load started at {loadStart}")

while True:
	status = localStorage.get("__TEST_STATUS")

	if (status == "complete"):
		log("DEBG", f"Page load completed")
		code = localStorage.get("__TEST_CODE")
		description = localStorage.get("__TEST_DESCRIPTION")

		if (code != "0"):
			log("ERRR", f"{Fore.LIGHTRED_EX}LOAD FAILED!")
			log("ERRR", f"{Fore.LIGHTRED_EX}-------------------------------------------------------")
			log("ERRR", f"  ⚠ {Fore.LIGHTYELLOW_EX}AN CRITICAL ERROR OCCURED AT INITIALIZATION")
			log("ERRR", "{}    → CODE: {}{}".format(Fore.LIGHTBLACK_EX, Fore.LIGHTYELLOW_EX, code))
			log("ERRR", "{}    → DESC: {}{}".format(Fore.LIGHTBLACK_EX, Fore.LIGHTRED_EX, description))
			log("ERRR", "")
		else:
			log("OKAY", f"{Fore.LIGHTGREEN_EX}LOAD COMPLETED!")
			log("OKAY", f"{Fore.LIGHTGREEN_EX}-------------------------------------------------------")
			log("OKAY", f"  ✔ {Fore.WHITE}PAGE LOADED WITHOUT ANY ERROR!")
			log("OKAY", "{}    → TIME: {}{:.2f}s".format(Fore.LIGHTBLACK_EX, Fore.LIGHTBLUE_EX, time.time() - loadStart))
			log("OKAY", "")

		server.stop()
		exit(int(code))

	if (time.time() - loadStart > TIME_OUT):
		amount = time.time() - loadStart
		log("ERRR", f"{Fore.LIGHTRED_EX}LOAD FAILED!")
		log("ERRR", f"{Fore.LIGHTRED_EX}-------------------------------------------------------")
		log("ERRR", f"  🕒 {Fore.LIGHTYELLOW_EX}PAGE LOAD TIMED OUT AFTER {amount:2.2f}s!")
		log("ERRR", "")

		server.stop()
		exit(-1)

	time.sleep(0.5)