from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import time

# enable browser logging
d = DesiredCapabilities.CHROME
d["goog:loggingPrefs"] = { "browser": "ALL" }
driver = webdriver.Chrome(desired_capabilities=d)

# load the desired webpage
driver.get("http://localhost:5500/")

time.sleep(5)
# print messages
for entry in driver.get_log("browser"):
    print(entry["message"])