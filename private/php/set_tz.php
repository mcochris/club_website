<?php

declare(strict_types=1);

require_once "include.php";

mySessionStart();

$timezone = filter_input(INPUT_POST, 'timezone', FILTER_SANITIZE_FULL_SPECIAL_CHARS);

if(empty($timezone)) {
	sendResponse(false, "No timezone sent to server.");
	exit;
}

if(!date_default_timezone_set($timezone)) {
	sendResponse(false, "Invalid timezone sent to server.");
	exit;
}

$_SESSION["TZ"] = $timezone;

sendResponse(true, "Valid timezone sent to server.");