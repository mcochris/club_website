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

	try {
		$pdo = open_db();
		$stmt = $pdo->prepare("INSERT INTO exceptions (exception) VALUES (:exception)");
		$stmt->bindParam(':exception', $contents, PDO::PARAM_STR);
		$stmt->execute();
	} catch (PDOException $e) {
		my_session_destroy();
		exit;
	}

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
function sendResponse(bool $display, string $message): void
{
	header('Content-Type: application/json');
	echo json_encode(["display" => $display, "message" => $message]);
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
		//	Don't call internalError() here as it would try to open DB again
		sendResponse(false, "Internal error " . __LINE__);
		my_session_destroy();
		exit;
	}

	return $pdo;
}
