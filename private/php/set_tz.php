<?php

declare(strict_types=1);

require_once "include.php";

my_session_start();

$timezone = filter_input(INPUT_POST, 'timezone', FILTER_SANITIZE_FULL_SPECIAL_CHARS);

empty($timezone) and exit(sendResponse(false, "No timezone sent to server."));

date_default_timezone_set($timezone) or exit(sendResponse(false, "Invalid timezone sent to server."));

$_SESSION["TZ"] = $timezone;

sendResponse(true, "Valid timezone sent to server.");