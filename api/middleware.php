<?php
    //? |-----------------------------------------------------------------------------------------------|
    //? |  /api/middleware.php                                                                          |
    //? |                                                                                               |
    //? |  Copyright (c) 2020 Belikhun. All right reserved                                              |
    //? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
    //? |-----------------------------------------------------------------------------------------------|

	define("PAGE_TYPE", "API");
	require_once $_SERVER["DOCUMENT_ROOT"] ."/libs/belibrary.php";

	$url = reqQuery("url");
	$data = Array();
	$headers = getAllHeadersUC();
	$craftedHeaders = Array();
	$resHeaders = Array();
	$ignHeaders = Array("content-length", "location", "pragma");

	header("Access-Control-Allow-Origin: ". (isset($headers["Origin"]) ? $headers["Origin"] : "*"));
	header("Access-Control-Allow-Credentials: true");
	header("Access-Control-Allow-Headers: Accept, Session-Cookie-Key, Session-Cookie-Value, Set-Host, Upgrade-Insecure-Requests, Set-Origin, Set-Referer");

	if ($_SERVER["REQUEST_METHOD"] === "OPTIONS")
		stop(0, "Options Request", 200);

	if (isset($headers["Session-Cookie-Key"])) {
		$sessCookieKey = $headers["Session-Cookie-Key"];
		unset($headers["Session-Cookie-Key"]);
	} else
		$sessCookieKey = getQuery("sesskey");

	if (isset($headers["Session-Cookie-Value"]) && $headers["Session-Cookie-Value"] !== "") {
		$sessCookieValue = $headers["Session-Cookie-Value"];
		unset($headers["Session-Cookie-Value"]);
	} else
		$sessCookieValue = getQuery("sessval");

	if (isset($headers["Set-Host"])) {
		$headers["Host"] = $headers["Set-Host"];
		unset($headers["Set-Host"]);
	}

	if (isset($headers["Set-Origin"])) {
		$headers["Origin"] = $headers["Set-Origin"];
		unset($headers["Set-Origin"]);
	}

	if (isset($headers["Set-Referer"])) {
		$headers["Referer"] = $headers["Set-Referer"];
		unset($headers["Set-Referer"]);
	}

	if (isset($sessCookieKey) && isset($sessCookieValue) && $sessCookieValue !== "") {
		if (isset($headers["Cookie"]))
			$headers["Cookie"] .= "; $sessCookieKey=$sessCookieValue";
		else
			$headers["Cookie"] = "$sessCookieKey=$sessCookieValue";
	}

	if (isset($headers["Content-Type"])) {
		if (strpos($headers["Content-Type"], "json") > 0)
			$data = reqData("json");
		else if (strpos($headers["Content-Type"], "x-www-form-urlencoded") > 0)
			$data = reqData("raw");
		else
			$data = reqData("form");
	}

	foreach ($headers as $key => $value) {
		if (in_array(strtolower($key), $ignHeaders)) {
			unset($headers[$key]);
			continue;
		}

		array_push($craftedHeaders, "$key: $value");
	}

	function curlHandleLine($curl, $line) {
		global $resHeaders;
		global $ignHeaders;
		global $sessCookieKey;
		global $sessCookieValue;

		$t = explode(": ", $line);
		
		if (isset($t[0]) && isset($t[1])) {
			$t[0] = trim($t[0]);
			$t[1] = trim($t[1]);

			if (in_array(strtolower($t[0]), $ignHeaders))
				return strlen($line);

			if ($t[0] === "Set-Cookie") {
				$v = explode("=", explode("; ", $t[1])[0]);

				if ($v[0] === $sessCookieKey)
					$sessCookieValue = $v[1];

				$resHeaders[$t[0]] = $t[1];
				return strlen($line);
			}

			if ($t[0] === "Content-Type")
				return strlen($line);

			header($line);
			$resHeaders[$t[0]] = $t[1];
		}

		return strlen($line);
	}

	$ch = curl_init($url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_ENCODING, "");
	curl_setopt($ch, CURLOPT_MAXREDIRS, 10);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
	curl_setopt($ch, CURLOPT_TIMEOUT, 30);
	curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $craftedHeaders);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER["REQUEST_METHOD"]);
	curl_setopt($ch, CURLOPT_HEADERFUNCTION, "curlHandleLine");
	curl_setopt($ch, CURLOPT_POSTFIELDS, $data);

	// Set proxy for debugging
	// curl_setopt($ch, CURLOPT_PROXY, "127.0.0.1:8080");

	// Start request
	$m2sRuntime = new StopClock();
	$response = curl_exec($ch);
	$m2sRuntime = $m2sRuntime -> stop();

	if ($code = curl_errno($ch))
		stop($code, "Request Error: ". curl_error($ch), 500);

	stop(0, "Completed", curl_getinfo($ch, CURLINFO_HTTP_CODE), Array(
		"session" => $sessCookieValue,
		"headers" => $resHeaders,
		"sentHeaders" => $headers,
		"response" => $response,
		"time" => $m2sRuntime
	));