#!/usr/bin/env python
# -*- coding: utf-8 -*-

from itertools import count
import json
from math import floor
from colorama import Fore, Style
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
		desired_capabilities = desiredCapabilities,
		service_log_path=os.devnull
	)
except Exception as e:
	server.stop()
	raise e

# load the desired webpage
driver.get("http://localhost:8000/tests?autotest=true")
localStorage = LocalStorage(driver)
loadStart = time.time()
logIndex = -1
sceneNames = {}
groupNames = {}
TIME_OUT = 20

log("DEBG", f"Page load started at {loadStart}")

def timeOf(t):
	if t < 1:
		return f"{Fore.LIGHTBLACK_EX}[{t * 1000:>4.0f} ms]{Fore.RESET}"
	elif t > 60:
		return f"{Fore.LIGHTBLACK_EX}[{floor(t / 60):0>2}m {t % 60:0>2}s]{Fore.RESET}"
	else:
		return f"{Fore.LIGHTBLACK_EX}[{t:>5.02f} s]{Fore.RESET}"

actionTimes = { "setup": 0, "activate": 0, "run": 0, "dispose": 0 }
lastTimes = { "setup": 0, "activate": 0, "run": 0, "dispose": 0 }

def updateTiming(type, cmd, cTime):
	if (cmd == "start"):
		lastTimes[type] = cTime
	else:
		actionTimes[type] += cTime - lastTimes[type]

def processLine(line):
	ltime = line[0]
	cmd = line[1]
	args = line[2:]
	output = ""
	status = "INFO"
	data = None
	padd = 0
	resetCursor = False

	if (cmd == "start"):
		output = [
			"",
			f"{Fore.LIGHTCYAN_EX}TEST BEGIN",
			f"{Fore.LIGHTCYAN_EX}-----------------------------------------------"
		]
	elif (cmd == "scene"):
		padd = 2
		data = processScene(args[0], args[1], args[2:], ltime)
	elif (cmd == "group"):
		padd = 4
		data = processGroup(args[0], args[1], args[2:], ltime)
	elif (cmd == "step"):
		if (args[1] == "run"):
			padd = 6
			data = processStepRun(args[0], args[2], args[3:], ltime)
	elif (cmd == "completed"):
		data = completedReport(args, ltime)
	else:
		output = f"Unknown command: {cmd}"
		status = "WARN"

	# Unpack data
	if (isinstance(data, str)):
		output = data
	elif (isinstance(data, tuple)):
		status, output = data
	elif (output == "" or len(output) == 0):
		output = f"{Fore.LIGHTBLACK_EX}No output for cmd {cmd}"
		status = "WARN"

	if (status == "SKIP"):
		return

	# Special case for step start
	if (status == "SRUN"):
		status = "INFO"
		resetCursor = True

	# Output can have multiple line, if so output
	# will be a list.
	# Just convert to list to avoid duplicate code.
	if (not isinstance(output, list)):
		output = [output]

	# Print each line
	for o in output:
		log(status, f"{Fore.GREEN}{ltime:6.2f}s", f"{Fore.LIGHTMAGENTA_EX}{cmd:>10}", f"{' ' * padd}{o}", resetCursor = resetCursor)


def handleSubCmd(cmd, args, name, type, vIng, vEd, color):
	if (cmd == "start"):
		return "INFO", f"{color}{vIng.capitalize()}{Fore.RESET} {type} {Fore.LIGHTBLACK_EX}\"{name}{Fore.LIGHTBLACK_EX}\""
	elif (cmd == "complete"):
		return "OKAY", f" ⮩ {Fore.RESET}{type.capitalize()} {color}{vEd} {Fore.LIGHTGREEN_EX}successfully{Fore.RESET}!"
	elif (cmd == "errored"):
		return "ERRR", [
			f" ⮩ {Fore.LIGHTRED_EX}{type.capitalize()} generated an error {Fore.RESET}while {color}{vIng}!",
			f"  {Fore.LIGHTBLACK_EX}→ Reason: (code:{args[0]}) {args[1]}"
		]

def processScene(id, cmd, args, ltime = 0):
	global sceneNames
	name = id

	if (cmd == "name"):
		sceneNames[id] = args[0]
		return "SKIP", ""

	try:
		name = Fore.LIGHTBLUE_EX + sceneNames[id]
	except KeyError:
		pass

	updateTiming(cmd, args[0], ltime)

	if (cmd == "setup"):
		return handleSubCmd(args[0], args[1:], name, "scene", "setting up", "setted-up", Fore.BLUE)
	elif (cmd == "activate"):
		return handleSubCmd(args[0], args[1:], name, "scene", "activating", "activated", Fore.MAGENTA)
	elif (cmd == "run"):
		return handleSubCmd(args[0], args[1:], name, "scene", "running", "completed running", Fore.CYAN)
	elif (cmd == "dispose"):
		return handleSubCmd(args[0], args[1:], name, "scene", "disposing", "disposed", Fore.YELLOW)

def processGroup(id, cmd, args, ltime = 0):
	global groupNames
	name = id

	if (cmd == "name"):
		groupNames[id] = args[0]
		return "SKIP", ""

	try:
		name = Fore.LIGHTYELLOW_EX + groupNames[id]
	except KeyError:
		pass

	if (cmd == "setup"):
		return handleSubCmd(args[0], args[1:], name, "group", "setting up", "setted-up", Fore.BLUE)
	elif (cmd == "activate"):
		return handleSubCmd(args[0], args[1:], name, "group", "activating", "activated", Fore.MAGENTA)
	elif (cmd == "run"):
		return handleSubCmd(args[0], args[1:], name, "group", "running", "completed running", Fore.CYAN)
	elif (cmd == "dispose"):
		return handleSubCmd(args[0], args[1:], name, "group", "disposing", "disposed", Fore.YELLOW)

stepStart = 0

def processStepRun(name, cmd, args, ltime = 0):
	global stepStart
	name = f"{Fore.LIGHTBLACK_EX}\"{Fore.LIGHTMAGENTA_EX}{name}{Fore.LIGHTBLACK_EX}\""

	if (cmd == "start"):
		stepStart = ltime
		return "SRUN", f"{Fore.CYAN}[●] {Fore.WHITE}Running step {name}"

	runTime = ltime - stepStart
	failedLine = f"{Fore.LIGHTRED_EX}[✗] {timeOf(runTime)} {Fore.WHITE}Step {name} {Fore.LIGHTRED_EX}FAILED{Fore.WHITE}!"

	if (cmd == "errored"):
		return "ERRR", [
			failedLine,
			f" ⮩ {Fore.LIGHTRED_EX}Assert failed!",
			f"  {Fore.LIGHTBLACK_EX}→ Reason: {args[0]}"
		]
	elif (cmd == "broken"):
		return "EXCP", [
			failedLine,
			f" ⮩ {Fore.LIGHTRED_EX}An exception occured!",
			f"  {Fore.LIGHTBLACK_EX}→ Reason: (code:{args[0]}) {args[1]}"
		]
	elif (cmd == "failed"):
		return "ERRR", [
			failedLine,
			f" ⮩ {Fore.LIGHTRED_EX}Sorry, but thats all I know <(＿　＿)>"
		]
	elif (cmd == "skipped"):
		return "INFO", f"{Fore.LIGHTBLACK_EX}[∅] {timeOf(runTime)} {Fore.WHITE}Step {name} {Fore.LIGHTBLACK_EX}SKIPPED{Fore.WHITE}."
	elif (cmd == "complete"):
		return "OKAY", f"{Fore.LIGHTGREEN_EX}[✓] {timeOf(runTime)} {Fore.WHITE}Step {name} {Fore.LIGHTGREEN_EX}PASSED{Fore.WHITE}!"

def completedReport(args, totalTimes):
	total, passed, skipped, failed, broken, errored = args

	tFailed = failed + broken + errored
	color = Fore.WHITE
	text = "NO FAILED TEST"
	level = "INFO"

	if (total == passed):
		color = Fore.LIGHTGREEN_EX
		text = "ALL TESTS PASSED!"
		level = "OKAY"
	elif (total == tFailed):
		color = Fore.LIGHTRED_EX
		text = "ALL TESTS FAILED!"
		level = "ERRR"
	elif (tFailed > 0):
		color = Fore.LIGHTYELLOW_EX
		text = "SOME TESTS FAILED!"
		level = "WARN"

	datas = [
		[Fore.WHITE, "TOTAL", total],
		[Fore.LIGHTGREEN_EX, "PASSED", passed],
		[Fore.LIGHTRED_EX, "FAILED", failed],
		[Fore.LIGHTBLACK_EX, "SKIPPED", skipped],
		[Fore.LIGHTMAGENTA_EX, "BROKEN", broken],
		[Fore.LIGHTYELLOW_EX, "ERRORED", errored]
	]

	lines = [
		"",
		f"{Fore.WHITE}TEST COMPLETED: {color}{text}",
		f"{color}------------------------------------------------------------------------------------",
		"",
		"",
		"",
		f" ●     TOTAL TIME : {timeOf(totalTimes):>24}"
	]

	for data in datas:
		lines[3] += f"{data[0]}{data[1]:>12} |"
		lines[4] += f"{data[0]}{data[2]:>12} |"

	for key, value in actionTimes.items():
		lines.append(f" ● {key.upper():>14} : {timeOf(value):>24}")

	return level, lines

while True:
	logs = localStorage.get("test.framework.logs")
	
	if logs is not None:
		logs = json.loads(logs)

		if (logIndex < len(logs) - 1):
			for line in logs[logIndex + 1:]:
				processLine(line)

		logIndex = len(logs) - 1
	
	time.sleep(0.1)
