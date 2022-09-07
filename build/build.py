#!/usr/bin/env python
# -*- coding: utf-8 -*-

from json.decoder import JSONDecodeError
from lib import ehook
from lib.log import log

import os
log("OKAY", "Imported: os")

from colorama import Fore
log("OKAY", "Imported: colorama")

import requests
log("OKAY", "Imported: requests")

import json
log("OKAY", "Imported: json")

import random
log("OKAY", "Imported: random")

import string
log("OKAY", "Imported: string")

import hashlib
log("OKAY", "Imported: hashlib")

from glob import glob
log("OKAY", "Imported: glob.glob")

import shutil
log("OKAY", "Imported: shutil")

import re
log("OKAY", "Imported: re")

from rcssmin import cssmin
log("OKAY", "Imported: rcssmin.cssmin")

from rjsmin import jsmin
log("OKAY", "Imported: rjsmin.jsmin")

def scriptDir():
	return os.path.dirname(os.path.realpath(__file__))

def randString(length = 8):
	return ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(length))

log("INFO", "cwd = " + os.getcwd())
log("INFO", "swd = " + scriptDir())

def logStatus(text, status, overWrite = False):
	statusText = [f"{Fore.RED}✗ ERRR", f"{Fore.YELLOW}● WAIT", f"{Fore.GREEN}✓ OKAY"]
	logStatus = ["ERRR", "INFO", "OKAY"]

	log(logStatus[status + 1], "{:66}{}{}".format(text, statusText[status + 1], Fore.RESET), resetCursor = (not overWrite))


logStatus("Lấy Thông Tin Dự Án", 0)
metadata = {}
with open("metadata.json", "r", encoding="utf-8") as file:
	try:
		metadata = json.loads(file.read())
	except JSONDecodeError:
		logStatus("Lấy Thông Tin Dự Án", -1, True)
		log("ERRR", "{} → Reason: {}Lỗi giải mã JSON (metadata.json)".format(Fore.WHITE, Fore.LIGHTBLACK_EX))
		exit(-1)

logStatus("Lấy Thông Tin Dự Án", 1, True)

repos = [
	"Belikhun/ctms-plus",
	"Belikhun/libraries",
	"Belikhun/ctms-plus-middleware",
	"Belikhun/ctms-plus-middleware-node"
]

for repo in repos:
	logStatus(f"Cập Nhật Danh Sách Người Đóng Góp ({repo})", 0)
	contributors = requests.get(f"https://api.github.com/repos/{repo}/contributors")
	contributorsData = contributors.json()

	if (contributors.status_code != 200):
		logStatus(f"Cập Nhật Danh Sách Người Đóng Góp ({repo})", -1, True)
		log("ERRR", "{} → Reason: ({}) {}".format(Fore.LIGHTRED_EX, str(contributors.status_code), contributorsData["message"]))
		exit(-1)

	logStatus(f"Cập Nhật Danh Sách Người Đóng Góp ({repo})", 1, True)
	for user in contributorsData:
		log("DEBG", "User {}: {} contributions".format(user["login"], user["contributions"]))

		try:
			metadata["contributors"][user["login"]]["contributions"] += user["contributions"]
		except KeyError:
			metadata["contributors"][user["login"]] = {
				"contributions": user["contributions"]
			}

if (os.environ.get("CI")):
	log("INFO", "CI Environment Detected! Updaing Optional Data")
	metadata["branch"] = os.environ.get("GITHUB_REF")
	metadata["version"] += f".{os.environ.get('GITHUB_RUN_NUMBER')}/{os.environ.get('GITHUB_SHA')[0:7]}"

	log("DEBG", "branch = " + metadata["branch"])
	log("DEBG", "version = " + metadata["version"])

	with open("VERSION", "w") as file:
		file.write(metadata["version"])

logStatus("Lưu Thông Tin Dự Án", 0)
with open("metadata.json", "w", encoding="utf-8") as file:
	file.write(json.dumps(metadata, indent=4))

logStatus("Lưu Thông Tin Dự Án", 1, True)


logStatus("Minify Các Tệp Tài Nguyên (css, js)", 0, True)

if not os.path.exists("static/min"):
    os.mkdir("static/min")

with open("index.html", "r", encoding="utf-8") as file:
	content = file.read()

	cssRegex = r"\<\!-- START\: MINCSS -->(.+)\<\!-- END\: MINCSS -->"
	csses = re.findall(cssRegex, content, re.MULTILINE | re.DOTALL)

	for item in csses:
		cssContents = ""

		log("DEBG", "Getting css files")
		cssFilesRe = r"<link rel=\"stylesheet\" .+ href=\"(.+)\""
		cssFiles = re.findall(cssFilesRe, item)

		log("DEBG", "Generating css bundle")
		for file in cssFiles:
			log("DEBG", f"Reading {file}")

			with open(file, "r", encoding="utf-8") as cssF:
				cssContents += cssF.read() + "\n"

		log("DEBG", "Minifying css bundle")
		cssContents = cssmin(cssContents)

		cssMd5 = hashlib.md5(cssContents.encode('utf-8')).hexdigest()
		cssMinFile = f"{cssMd5[0:6]}.min.css"

		log("DEBG", f"Writing css bundle to {cssMinFile}")
		with open(f"static/min/{cssMinFile}", "w", encoding="utf-8") as cssMin:
			cssMin.write(cssContents)

		log("DEBG", f"Replacing css links")
		content = content.replace(item, f"""
			<link rel="stylesheet" type="text/css" media="screen" href="static/min/{cssMinFile}" />
		""")

	jsRegex = r"\<\!-- START\: MINJS -->(.+)\<\!-- END\: MINJS -->"
	jses = re.findall(jsRegex, content, re.MULTILINE | re.DOTALL)

	for item in jses:
		jsContents = ""

		log("DEBG", "Getting js files")
		jsFilesRe = r"<script src=\"(.+)\" type.+"
		jsFiles = re.findall(jsFilesRe, item)

		log("DEBG", "Generating js bundle")
		for file in jsFiles:
			log("DEBG", f"Reading {file}")

			with open(file, "r", encoding="utf-8") as jsF:
				jsContents += jsF.read() + "\n"

		log("DEBG", "Minifying js bundle")
		jsContents = jsmin(jsContents)

		jsMd5 = hashlib.md5(jsContents.encode('utf-8')).hexdigest()
		jsMinFile = f"{jsMd5[0:6]}.min.js"

		log("DEBG", f"Writing js bundle to {jsMinFile}")
		with open(f"static/min/{jsMinFile}", "w", encoding="utf-8") as jsMin:
			jsMin.write(jsContents)

		log("DEBG", f"Replacing js links")
		content = content.replace(item, f"""
			<script src="static/min/{jsMinFile}" type="text/javascript"></script>
		""")

	with open("index.html", "w", encoding="utf-8") as fileWrite:
		fileWrite.write(content)

logStatus("Minify Các Tệp Tài Nguyên (css, js)", 1, True)


logStatus("Cài Mã Xác Minh", 0)

for path in glob("build/verification/*.html"):
	name = os.path.basename(path)
	shutil.copyfile(path, name)

logStatus("Cài Mã Xác Minh", 1, True)


logStatus("Thay đổi .gitignore", 0)
shutil.copy("build/prod.gitignore", ".gitignore")
logStatus("Thay đổi .gitignore", 1, True)

exit(0)