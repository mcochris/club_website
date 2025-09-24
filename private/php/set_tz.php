<?php

declare(strict_types=1);

require_once "include.php";

my_session_start();

$timezone = filter_input(INPUT_POST, 'timezone', FILTER_SANITIZE_FULL_SPECIAL_CHARS);

if (empty($timezone))
	internalError("No timezone received from client");

$_SESSION["TZ"] = $timezone;
