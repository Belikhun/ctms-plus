#!/usr/bin/env python
# -*- coding: utf-8 -*-

from colorama import Fore
from lib import ehook
from lib.log import log

import os
log("OKAY", "Imported: os")

import sys
log("OKAY", "Imported: sys")

import json
log("OKAY", "Imported: json")

from math import floor
log("OKAY", "Imported: math.floor")

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

def scriptDir():
	return os.path.dirname(os.path.realpath(__file__))

log("INFO", "cwd = " + os.getcwd())
log("INFO", "swd = " + scriptDir())

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

loadStart = time.time()
log("DEBG", f"Page load started at {loadStart:.2f}")

# load the desired webpage
driver.get("http://localhost:8000/tests?autotest=true")
localStorage = LocalStorage(driver)
logIndex = -1
lastLog = 0
stepStart = 0
sceneNames = {}
groupNames = {}
currentScene = None
currentGroup = None
failures = []
TIME_OUT = 20

def timeOf(t, color = Fore.LIGHTBLACK_EX):
	if t < 1:
		string = f"[{t * 1000:>4.0f} ms]"
	elif t > 60:
		string = f"[{floor(t / 60):0>2}m {t % 60:0>2}s]"
	else:
		string = f"[{t:>5.02f} s]"

	if (color is not None):
		string = f"{color}{string}{Fore.RESET}"

	return string

actionTimes = { "load": None, "setup": 0, "activate": 0, "run": 0, "dispose": 0 }
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
	code = None
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
		data, code = completedReport(args, ltime)
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
		log(status, f"{Fore.MAGENTA}{ltime:7.2f}s", f"{' ' * padd}{o}", resetCursor = resetCursor)

	# Exit
	if (isinstance(code, int)):
		sys.exit(code)

def handleSubCmd(cmd, args, name, type, vIng, vEd, color):
	if (cmd == "start"):
		return "INFO", f"{color}{vIng.capitalize()}{Fore.RESET} {type} {Fore.LIGHTBLACK_EX}\"{name}{Fore.LIGHTBLACK_EX}\""
	elif (cmd == "complete"):
		return "OKAY", f" ⮩ {Fore.RESET}{type.capitalize()} {color}{vEd} {Fore.LIGHTGREEN_EX}successfully{Fore.RESET}!"
	elif (cmd == "errored"):
		return "ERRR", [
			f" ⮩ {Fore.LIGHTRED_EX}{type.capitalize()} generated an error {Fore.RESET}while {color}{vIng}!",
			f"  {Fore.LIGHTBLACK_EX}→ Reason: {f'(code:{args[0]})' if (isinstance(args[0], int)) else f'{args[0]}():'} {args[1]}"
		]

def processScene(id, cmd, args, ltime = 0):
	global sceneNames, currentScene
	name = id
	fname = name

	if (cmd == "name"):
		sceneNames[id] = args[0]
		return "SKIP", ""

	try:
		name = sceneNames[id]
		fname = Fore.LIGHTBLUE_EX + name
	except KeyError:
		pass

	updateTiming(cmd, args[0], ltime)

	if (cmd == "setup"):
		return handleSubCmd(args[0], args[1:], fname, "scene", "setting up", "setted-up", Fore.BLUE)
	elif (cmd == "activate"):
		return handleSubCmd(args[0], args[1:], fname, "scene", "activating", "activated", Fore.MAGENTA)
	elif (cmd == "run"):
		currentScene = name
		return handleSubCmd(args[0], args[1:], fname, "scene", "running", "completed running", Fore.CYAN)
	elif (cmd == "dispose"):
		return handleSubCmd(args[0], args[1:], fname, "scene", "disposing", "disposed", Fore.YELLOW)

def processGroup(id, cmd, args, ltime = 0):
	global groupNames, currentGroup
	name = id
	fname = name

	if (cmd == "name"):
		groupNames[id] = args[0]
		return "SKIP", ""

	try:
		name = groupNames[id]
		fname = Fore.LIGHTYELLOW_EX + name
	except KeyError:
		pass

	if (cmd == "setup"):
		return handleSubCmd(args[0], args[1:], fname, "group", "setting up", "setted-up", Fore.BLUE)
	elif (cmd == "activate"):
		return handleSubCmd(args[0], args[1:], fname, "group", "activating", "activated", Fore.MAGENTA)
	elif (cmd == "run"):
		currentGroup = name
		return handleSubCmd(args[0], args[1:], fname, "group", "running", "completed running", Fore.CYAN)
	elif (cmd == "dispose"):
		return handleSubCmd(args[0], args[1:], fname, "group", "disposing", "disposed", Fore.YELLOW)

def processStepRun(name, cmd, args, ltime = 0):
	global stepStart
	fname = f"{Fore.LIGHTBLACK_EX}\"{Fore.LIGHTMAGENTA_EX}{name}{Fore.LIGHTBLACK_EX}\""

	if (cmd == "start"):
		stepStart = ltime
		return "SRUN", f"{Fore.CYAN}[●] {Fore.WHITE}Running step {fname}"

	runTime = ltime - stepStart
	failedLine = f"{Fore.LIGHTRED_EX}[✗] {timeOf(runTime)} {Fore.WHITE}Step {fname} {Fore.LIGHTRED_EX}FAILED{Fore.WHITE}!"

	if (cmd == "errored"):
		failures.append({
			"name": name,
			"path": [currentScene, currentGroup],
			"fail": "Assert failed!",
			"reason": args[0]
		})

		return "ERRR", [
			failedLine,
			f" ⮩ {Fore.LIGHTRED_EX}Assert failed!",
			f"  {Fore.LIGHTBLACK_EX}→ Reason: {args[0]}"
		]
	elif (cmd == "broken"):
		reason = f"{f'(code:{args[0]})' if (isinstance(args[0], int)) else f'{args[0]}():'} {args[1]}"
		failures.append({
			"name": name,
			"path": [currentScene, currentGroup],
			"fail": "An exception occured!",
			"reason": reason
		})

		return "EXCP", [
			failedLine,
			f" ⮩ {Fore.LIGHTRED_EX}An exception occured!",
			f"  {Fore.LIGHTBLACK_EX}→ Reason: {reason}"
		]
	elif (cmd == "failed"):
		failures.append({
			"name": name,
			"fail": "Test failed!",
			"reason": "Sorry, but thats all I know <(＿　＿)>"
		})

		return "ERRR", [
			failedLine,
			f" ⮩ {Fore.LIGHTRED_EX}Sorry, but thats all I know <(＿　＿)>"
		]
	elif (cmd == "skipped"):
		return "INFO", f"{Fore.LIGHTBLACK_EX}[∅] {timeOf(runTime)} {Fore.WHITE}Step {fname} {Fore.LIGHTBLACK_EX}SKIPPED{Fore.WHITE}."
	elif (cmd == "complete"):
		return "OKAY", f"{Fore.LIGHTGREEN_EX}[✓] {timeOf(runTime)} {Fore.WHITE}Step {fname} {Fore.LIGHTGREEN_EX}PASSED{Fore.WHITE}!"

def completedReport(args, totalTimes):
	total, passed, skipped, failed, broken, errored = args

	tFailed = failed + broken
	color = Fore.WHITE
	text = "NO FAILED TEST"
	level = "INFO"
	code = 1

	if (total == passed and errored == 0):
		color = Fore.LIGHTGREEN_EX
		text = "ALL TESTS PASSED!"
		level = "OKAY"
		code = 0
	elif (total == tFailed):
		color = Fore.LIGHTRED_EX
		text = "ALL TESTS FAILED!"
		level = "ERRR"
	elif (tFailed > 0):
		color = Fore.LIGHTYELLOW_EX
		text = "SOME TESTS FAILED!"
		level = "WARN"
	elif (errored > 0):
		color = Fore.LIGHTMAGENTA_EX
		text = "SOME SCENES/GROUPS FAILED TO INITIALIZE"
		level = "WARN"

	datas = [
		[Fore.LIGHTBLUE_EX, "TOTAL", total],
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
		lines[3] += f"{data[0]}{data[1]:>8} |"
		lines[4] += f"{data[0]}{data[2]:>8} |"

	for key, value in actionTimes.items():
		lines.append(f" ● {key.upper():>14} : {timeOf(value):>24}")

	# Fill the report file
	with open(f"{scriptDir()}/report.md", "r", encoding = "utf-8") as f:
		report = f.read()

		# Draft the failures
		failuresStr = []

		for f in failures:
			failuresStr.append("```")
			failuresStr.append(f"🌃 {f['path'][0]} ➜ 🧪 {f['path'][1]}")
			failuresStr.append(f"  ❌ {f['name']}")
			failuresStr.append(f"    ⮩ {f['fail']}")
			failuresStr.append(f"      → Reason: {f['reason']}")
			failuresStr.append("```")

		replaces = {
			"name": os.getenv("GITHUB_ACTION") or "Direct Run",
			"workflow": os.getenv("GITHUB_WORKFLOW") or "No Workflow",
			"runNum": os.getenv("GITHUB_RUN_NUMBER") or 0,
			"event": os.getenv("GITHUB_EVENT_NAME") or "no event",
			"commit": os.getenv("GITHUB_SHA") or "none",
			"author": os.getenv("GITHUB_ACTOR") or os.getlogin(),
			"ref": os.getenv("GITHUB_REF") or "direct/test",
			"failures": "\n".join(failuresStr) if len(failuresStr) > 0 else "None 🥳",
			"total": total,
			"passed": passed,
			"failed": failed,
			"skipped": skipped,
			"broken": broken,
			"errored": errored,
			"tFailed": tFailed,
			"totalTime": timeOf(totalTimes, color = None),
			"loadTime": timeOf(actionTimes["load"], color = None),
			"setupTime": timeOf(actionTimes["setup"], color = None),
			"activateTime": timeOf(actionTimes["activate"], color = None),
			"runTime": timeOf(actionTimes["run"], color = None),
			"disposeTime": timeOf(actionTimes["dispose"], color = None)
		}

		for key, value in replaces.items():
			report = report.replace(f"{{{key}}}", str(value))

		with open(f"{scriptDir()}/report-generated.md", "w", encoding = "utf-8") as fg:
			fg.write(report)

		with open(os.getenv("GITHUB_STEP_SUMMARY"), "w", encoding = "utf-8") as fr:
			fr.write(report)

	return (level, lines), code

# Init last log time for timeout killswitch
lastLog = time.time()

while True:
	logs = localStorage.get("test.framework.logs")
	
	if logs is not None:
		logs = json.loads(logs)

		if (logIndex < len(logs) - 1):
			if (actionTimes["load"] is None):
				# Update loadtime since we received first log item
				actionTimes["load"] = time.time() - loadStart
				log("INFO", f"Received first log after {timeOf(actionTimes['load'])}")

			lastLog = time.time()

			for line in logs[logIndex + 1:]:
				processLine(line)

		logIndex = len(logs) - 1
	
	# Check log timeout
	if (time.time() - lastLog > TIME_OUT):
		log("ERRR", f"No log were sent for {time.time() - lastLog:2.2f}s! {Fore.LIGHTRED_EX}TEST FAILED!")
		sys.exit(-1)

	time.sleep(0.1)
