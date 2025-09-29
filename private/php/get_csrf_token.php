<?php

declare(strict_types=1);

require_once 'include.php';

//==============================================================================
//	start the session
//==============================================================================
mySessionStart();

//==============================================================================
//	set timezone
//==============================================================================
date_default_timezone_set($_SESSION["TZ"] ?? "UTC");

getCSRFToken();

function getCSRFToken(): void
{
	//==============================================================================
	//	get out quick if user is locked out
	//==============================================================================
	if (isset($_SESSION["lockout_end_time"])) {
		$time_diff = $_SESSION["lockout_end_time"] - time();
		if ($time_diff > 0) {
			sendResponse(false, "Site access lockout expires at " . date("g:i:s a", $_SESSION["lockout_end_time"]) . ".");
			exit;
		}
	}

	//==============================================================================
	//	get out quick if browser ID or IP address missing
	//==============================================================================
	if (empty($_SERVER["HTTP_USER_AGENT"])) {
		sendResponse(false, "Unknown browser.");
		exit;
	}

	if (empty($_SERVER["REMOTE_ADDR"])) {
		sendResponse(false, "Missing IP address.");
		exit;
	}

	//==============================================================================
	//	Update accessed time arrays
	//==============================================================================
	$_SESSION["time_accessed"][] = time();
	$_SESSION["time_accessed_human"][] = date("r");

	//	Keep only the last 10 entries
	$_SESSION["time_accessed"] = array_slice($_SESSION["time_accessed"], -10);
	$_SESSION["time_accessed_human"] = array_slice($_SESSION["time_accessed_human"], -10);

	//==============================================================================
	//	Is user back too soon?
	//==============================================================================
	if (empty(($_SESSION["lockout_end_time"])))
		if (count($_SESSION["time_accessed"]) >= 2) {
			$time_diff = time() - $_SESSION["time_accessed"][count($_SESSION["time_accessed"]) - 2];
			if ($time_diff === 0) {
				sendResponse(false, "You are accessing too frequently. Please wait a one minute and try again.");
				$_SESSION["lockout_end_time"] = time() + 60;
				$_SESSION["lockout_end_time_human"] = date("r", time() + 60);
				exit;
			}
		}

	//==============================================================================
	//	Has user accessed too many times?
	//==============================================================================
	if (empty($_SESSION["lockout_end_time"]))
		if (isset($_SESSION["time_accessed"]))
			if (count($_SESSION["time_accessed"]) >= 9) {
				sendResponse(false, "Email entry limit exceeded, 10 minute lockout started. Once you confirm your email address please re-visit the site.");
				$_SESSION["lockout_end_time"] = time() + 600;
				$_SESSION["lockout_end_time_human"] = date("r", time() + 600);
				exit;
			}

	//==============================================================================
	//	see if user is supposed to be locked out
	//==============================================================================
	if (isset($_SESSION["lockout_end_time"])) {
		$time_diff = $_SESSION["lockout_end_time"] - time();
		if ($time_diff <= 0) {
			//	lockout period has ended
			unset($_SESSION["lockout_end_time"]);
			unset($_SESSION["lockout_end_time_human"]);
			unset($_SESSION["time_accessed"]);
			unset($_SESSION["time_accessed_human"]);
		} else {
			sendResponse(false, "Site access lockout expires at " . date("g:i:s a", $_SESSION["lockout_end_time"]) . ".");
			exit;
		}
	}

	//==============================================================================
	//	Make sure browser stays the same
	//==============================================================================
	$_SESSION["browser"][] = $_SERVER['HTTP_USER_AGENT'] ?? "?";
	$_SESSION["browser"] = array_slice($_SESSION["browser"], -2);
	if (count(array_unique($_SESSION["browser"])) !== 1) {
		sendResponse(false, "New browser?");
		internalError("Browser changed: " . print_r($_SESSION["browser"]));
	}

	//==============================================================================
	//	Make sure IP address stays the same
	//==============================================================================
	$_SESSION["ip_address"][] = $_SERVER['REMOTE_ADDR'] ?? "?";
	$_SESSION["ip_address"] = array_slice($_SESSION["ip_address"], -2);
	if (count(array_unique($_SESSION["ip_address"])) !== 1) {
		sendResponse(false, "IP address changed.");
		internalError("IP address changed: " . print_r($_SESSION["ip_address"]));
	}

	//==============================================================================
	//	validate IP address
	//==============================================================================
	if (isValidIPAddr($_SESSION["ip_address"][0]) !== true) {
		sendResponse(false, "Invalid IP address.");
		internalError("Invalid or missing IP address: \"" . $_SESSION["ip_address"] . "\"");
	}

	//==============================================================================
	//	If a CSRF has already been generated, return it
	//==============================================================================
	if (isset($_SESSION["csrf_token"]))
		sendResponse(true, $_SESSION["csrf_token"]);
	else {
		//==============================================================================
		//	Create a new CSRF tokens
		//==============================================================================
		$_SESSION["csrf_token"] = sodium_bin2base64(random_bytes(16), SODIUM_BASE64_VARIANT_URLSAFE_NO_PADDING);
		$_SESSION["secured_csrf_token"] = hash_hmac('sha3-256', $_SESSION["csrf_token"], getServerSecret("CSRF_SECRET"));

		//==============================================================================
		//	return the CSRF token to the client
		//==============================================================================
		sendResponse(true, $_SESSION["csrf_token"]);
	}
}
