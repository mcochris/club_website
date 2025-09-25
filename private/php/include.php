<?php

declare(strict_types=1);

//==============================================================================
//	Configuration
//==============================================================================
define("PRODUCTION", false);
define("DSN", "sqlite:" . __DIR__ . "/../clubWebsite.db");

define(
	"SESSION_SETTINGS",
	[
		"session.auto_start" => "0",
		"session.use_only_cookies" => "1",
		"session.gc_maxlifetime" => "3600",	// 1 hour
		"session.cookie_lifetime" => "0",	// until browser is closed
		"session.cookie_httponly" => "1",
		"session.cookie_secure" => "1",
		"session.cookie_samesite" => "Strict",
		"session.use_strict_mode" => "1"
	]
);

if (session_status() === PHP_SESSION_NONE)
	foreach (SESSION_SETTINGS as $key => $value)
		ini_set($key, $value);

foreach (SESSION_SETTINGS as $key => $value)
	ini_get($key) === $value or internalError("Wrong session setting: $key = " . ini_get($key) . ", expected $value");

//==============================================================================
//	handle internal errors
//==============================================================================
function internalError(string $error_message = ""): void
{
	// user should have been informed already via sendResponse()
	$contents = my_var_dump(debug_backtrace());

	$pdo = open_db();
	$stmt = $pdo->prepare("INSERT INTO exceptions (exception) VALUES (:exception)");
	$stmt->bindParam(':exception', $contents, PDO::PARAM_STR);
	$stmt->execute();

	my_session_destroy();
	exit;
}

//==============================================================================
//	var_dump to string
//==============================================================================
function my_var_dump($mixed = null): string
{
	ob_start();
	var_dump($mixed);
	$content = ob_get_contents();
	ob_end_clean();
	return $content;
}

//==============================================================================
//	Send results back to client
//==============================================================================
function sendResponse(bool $success, string $data): void
{
	header('Content-Type: application/json');

	//if($success)
	//	$include = ["success" => true, "data" => $data];
	//else {
	//	$include = ["success" => false, "data" => ""];
	//	// what todo with $data?
	//}

	//echo json_encode($include);
	echo json_encode(["success" => $success, "data" => $data]);
}

//==============================================================================
//	get the CSRF secret from the environment
//==============================================================================
function getServerSecret(): string
{
	$s = getenv('CSRF_SECRET');
	if (empty($s)) {
		sendResponse(false, "Internal error " . __LINE__);
		internalError("Could not get CSRF secret from environment");
	}

	return $s;
}

//==============================================================================
//	validate IP address (allowing for mobile users)
//==============================================================================
function isValidIPAddr(string $ipAddr = ""): bool
{
	if (!PRODUCTION)
		return true;

	if (
		filter_var($ipAddr, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false
		and
		filter_var($ipAddr, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false
	)
		return false;
	else
		return true;
}

//==============================================================================
//	destroy session securely
//==============================================================================
function my_session_destroy(): void
{
	$_SESSION = [];

	// Clear session cookie
	$params = session_get_cookie_params();
	setcookie(
		session_name(),
		'',
		time() - 42000,
		$params['path'],
		$params['domain'],
		$params['secure'],
		$params['httponly']
	);

	//my_session_regenerate_id(true);
	session_destroy();
}

//==============================================================================
// My session start function support timestamp management
// TODO: "do not use ol session" logic not working as expected
//==============================================================================
function my_session_start()
{
	if (session_start() === false) {
		sendResponse(false, "Internal error " . __LINE__);
		internalError("Could not start session");
	}

	//if (isset($_SESSION['destroyed'])) {
	//	if ($_SESSION['destroyed'] < time() - 300) {
	//		// Should not happen usually. This could be attack or due to unstable network.
	//		// Remove all authentication status of this users session.
	//		my_session_destroy();
	//		if (session_start() === false) {
	//			sendResponse("Internal error " . __LINE__ . ". Please refresh the page.");
	//			internalError("Could not start session after destroying old one");
	//		}
	//		return;
	//	}

	//	if (isset($_SESSION['new_session_id'])) {
	//		// Not fully expired yet. Could be lost cookie by unstable network.
	//		// Try again to set proper session ID cookie.
	//		// NOTE: Do not try to set session ID again if you would like to remove
	//		// authentication flag.
	//		if (session_commit() === false) {
	//			sendResponse("Internal error " . __LINE__ . ". Please refresh the page.");
	//			internalError("Could not commit session");
	//		}

	//		if (session_id($_SESSION['new_session_id']) === false) {
	//			sendResponse("Internal error " . __LINE__ . ". Please refresh the page.");
	//			internalError("Could not set session ID");
	//		}

	//		// New session ID should exist
	//		if (session_start() === false) {
	//			sendResponse("Internal error " . __LINE__ . ". Please refresh the page.");
	//			internalError("Could not start session with new session ID");
	//		}

	//return;
	//	}
	//}
}

//==============================================================================
// My session regenerate id function
//
// Session ID must be regenerated when
//  - User logged in
//  - User logged out
//  - Certain period has passed
//
//	TODO: session data is lost?
//	TODO: this function may not be needed any more
//==============================================================================
function my_session_regenerate_id()
{
	// New session ID is required to set proper session ID
	// when session ID is not set due to unstable network.
	$new_session_id = session_create_id();
	if ($new_session_id === false) {
		sendResponse(false, "Internal error " . __LINE__);
		internalError("Could not create new session ID");
	}

	$_SESSION['new_session_id'] = $new_session_id;

	// Set destroy timestamp
	$_SESSION['destroyed'] = time();

	// Write and close current session;
	if (session_commit() === false) {
		sendResponse(false, "Internal error " . __LINE__);
		internalError("Could not commit session");
	}

	// Start session with new session ID
	if (session_id($new_session_id) === false) {
		sendResponse(false, "Internal error " . __LINE__);
		internalError("Could not set new session ID");
	}

	// Disable strict mode temporarily to avoid "session ID not found" error
	ini_set('session.use_strict_mode', 0);
	session_start();
	ini_set('session.use_strict_mode', 1);

	// New session does not need them
	unset($_SESSION['destroyed']);
	unset($_SESSION['new_session_id']);
}

//==============================================================================
//	Open database
//==============================================================================
function open_db(): PDO
{
	try {
		$pdo = new PDO(DSN);
		$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
	} catch (PDOException $e) {
		sendResponse(false, "Internal error " . __LINE__);
		internalError("Could not connect to database: " . $e->getMessage());
	}

	return $pdo;
}
