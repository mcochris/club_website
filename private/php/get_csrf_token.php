<?php

declare(strict_types=1);

require_once 'include.php';

exit("Here's your damm token");

function get_csrf_token(): string
{
	////------------------------------------------------------------------------------
	////	send a JSON response to the client
	////------------------------------------------------------------------------------
	//function sendResponse(string $message): void
	//{
	//	header('Content-Type: application/json');
	//	echo json_encode(["status" => "error", "message" => $message], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
	//}

	////------------------------------------------------------------------------------
	////	log an internal error
	////------------------------------------------------------------------------------
	//function internalError(string $message): void
	//{
	//	error_log("Internal error: " . $message);
	//}

	////------------------------------------------------------------------------------
	////	validate an IP address
	////------------------------------------------------------------------------------
	//function isValidIPAddr(string $ip): bool
	//{
	//	if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false)
	//		if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false)
	//			return false;
	//	return true;
	//}

	//==============================================================================
	//	start the session
	//==============================================================================
	my_session_start();

	//==============================================================================
	//	set timezone
	//==============================================================================
	date_default_timezone_set($_SESSION["TZ"] ?? "UTC");

	//==============================================================================
	//	get out quick if user is locked out
	//==============================================================================
	if (isset($_SESSION["lockout_end_time"])) {
		$time_diff = $_SESSION["lockout_end_time"] - time();
		if ($time_diff > 0) {
			sendResponse("Site access lockout expires at " . date("g:i:s a", $_SESSION["lockout_end_time"]) . ".");
			exit;
		}
	}

	//==============================================================================
	//	get out quick if browser ID or IP address missing
	//==============================================================================
	if (empty($_SERVER["HTTP_USER_AGENT"]) or empty($_SERVER["REMOTE_ADDR"])) {
		sendResponse("Security issue " . __LINE__ . " detected, please refresh the page.");
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
				sendResponse("You are accessing too frequently. Please wait a one minute and try again.");
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
				sendResponse("Email entry limit exceeded, 10 minute lockout started. Once you confirm your email address please re-visit the site.");
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
			sendResponse("Site access lockout expires at " . date("g:i:s a", $_SESSION["lockout_end_time"]) . ".");
			exit;
		}
	}

	//==============================================================================
	//	Make sure browser stays the same
	//==============================================================================
	$_SESSION["browser"][] = $_SERVER['HTTP_USER_AGENT'] ?? "?";
	$_SESSION["browser"] = array_slice($_SESSION["browser"], -2);
	if (count(array_unique($_SESSION["browser"])) !== 1) {
		sendResponse("Security issue " . __LINE__ . " detected, please refresh the page.");
		internalError("Browser changed: " . print_r($_SESSION["browser"], true));
	}

	//==============================================================================
	//	Make sure IP address stays the same
	//==============================================================================
	$_SESSION["ip_address"][] = $_SERVER['REMOTE_ADDR'] ?? "?";
	$_SESSION["ip_address"] = array_slice($_SESSION["ip_address"], -2);
	if (count(array_unique($_SESSION["ip_address"])) !== 1) {
		sendResponse("Security issue " . __LINE__ . " detected, please refresh the page.");
		internalError("IP address changed: " . print_r($_SESSION["ip_address"], true));
	}

	//==============================================================================
	//	validate IP address
	//==============================================================================
	if (isValidIPAddr($_SESSION["ip_address"][0]) !== true) {
		sendResponse("Security issue " . __LINE__ . " detected, please refresh the page.");
		internalError("Invalid or missing IP address: \"" . $_SESSION["ip_address"] . "\"");
	}

	//==============================================================================
	//	If a CSRF has already been generated, return it
	//==============================================================================
	if (isset($_SESSION["csrf_token"]))
		exit($_SESSION["csrf_token"]);

	//==============================================================================
	//	Create a new CSRF tokens
	//==============================================================================
	$_SESSION["csrf_token"] = sodium_bin2base64(random_bytes(16), SODIUM_BASE64_VARIANT_URLSAFE_NO_PADDING);
	$_SESSION["secured_csrf_token"] = hash_hmac('sha3-256', $_SESSION["csrf_token"], getServerSecret());

	//==============================================================================
	//	return the CSRF token to the client
	//==============================================================================
	exit($_SESSION["csrf_token"]);
}
