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

import re
log("OKAY", "Imported: re")

def logStatus(text, status, overWrite = False):
	statusText = [f"{Fore.RED}✗ ERRR", f"{Fore.YELLOW}● WAIT", f"{Fore.GREEN}✓ OKAY"]
	logStatus = ["ERRR", "INFO", "OKAY"]

	log(logStatus[status + 1], "{:48}{}{}".format(text, statusText[status + 1], Fore.RESET), resetCursor = (not overWrite))


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


logStatus("Cập Nhật Danh Sách Người Đóng Góp", 0)
contributors = requests.get("https://api.github.com/repos/Belikhun/ctms-plus/contributors")
contributorsData = contributors.json()

if (contributors.status_code != 200):
	logStatus("Cập Nhật Danh Sách Người Đóng Góp", -1, True)
	log("ERRR", "{} → Reason: ({}) {}".format(Fore.LIGHTRED_EX, str(contributors.status_code), contributorsData["message"]))
	exit(-1)

logStatus("Cập Nhật Danh Sách Người Đóng Góp", 1)
for user in contributorsData:
	log("DEBG", "User {}: {} contributions".format(user["login"], user["contributions"]))
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


logStatus("Cập Nhật Phiên Bản Các Liên Kết", 0)

with open("index.html", "r", encoding="utf-8") as file:
	content = file.read()
	srcRegex = r"(?:assets|static)\/.+\.(?:css|js)"
	search = re.findall(srcRegex, content)

	for item in search:
		log("DEBG", "Update " + item)
		content = content.replace(item, f"{item}?v={metadata['version']}")

	with open("index.html", "w", encoding="utf-8") as fileWrite:
		fileWrite.write(content)

logStatus("Cập Nhật Phiên Bản Các Liên Kết", 1, True)
exit(0)