<?php

declare(strict_types=1);

require_once 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

//==============================================================================
//	Configuration
//==============================================================================
define("PRODUCTION", $_SERVER['HTTP_HOST'] === "chrisstrawser.com");
define("DSN", "sqlite:" . __DIR__ . "/../clubWebsite.db");
define("LOGFILE", __DIR__ . "/../php.log");

define(
	"SESSION_SETTINGS",
	[
		"session.auto_start" => "0",
		"session.use_only_cookies" => "1",
		"session.gc_maxlifetime" => "31536000",		// 1 year
		"session.cookie_path" => "/",
		"session.cookie_domain" => "",				// current domain only
		"session.cookie_lifetime" => "31536000",	// 1 year
		"session.cookie_httponly" => "1",
		"session.cookie_secure" => "1",
		"session.cookie_samesite" => "Strict",
		"session.use_strict_mode" => "1",
		"log_errors" => "1",
		"error_log" => LOGFILE,
		"display_errors" => PRODUCTION ? "0" : "1",
		"error_reporting" => "E_ALL"
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
	$contents = myVarDump(debug_backtrace());
	error_log(date('Y-m-d H:i:s') . " Internal error: $error_message\n$contents\n", 3, LOGFILE);
	exit;
}

//==============================================================================
//	var_dump to string
//==============================================================================
function myVarDump($mixed = null): string
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
function sendResponse(bool $status, string $message): void
{
	header('Content-Type: application/json');
	echo json_encode(["status" => $status, "message" => $message]);
}

//==============================================================================
//	get the secrets from the environment
//==============================================================================
function getServerSecret(string $key): string
{
	$s = getenv($key);
	if (empty($s)) {
		sendResponse(false, "Internal error " . __LINE__);
		internalError("Could not get server secret from environment");
	}

	return $s;
}

//==============================================================================
//	validate IP address
//==============================================================================
function isValidIPAddr(string $ipAddr = ""): bool
{
	if (PRODUCTION === false)
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
function mySessionDestroy(): void
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

	session_destroy();
}

//==============================================================================
// My session start function support timestamp management
// TODO: "do not use old session" logic not working as expected
//==============================================================================
function mySessionStart()
{
	if (session_start() === false) {
		sendResponse(false, "Internal error " . __LINE__);
		internalError("Could not start session");
	}
}

//==============================================================================
//	Open database
//==============================================================================
function openDb(): PDO
{
	try {
		$pdo = new PDO(DSN);
		$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
	} catch (PDOException $e) {
		//	Don't call internalError() here as it would try to open DB again
		sendResponse(false, "Internal error " . __LINE__);
		mySessionDestroy();
		exit;
	}

	return $pdo;
}

//==============================================================================
//	Send email with login link
//==============================================================================
function sendEmail(string $to, string $token): bool
{
	if (PRODUCTION === false)
		return true;

	error_log(date('Y-m-d H:i:s') . " Sending email to $to with token $token\n", 3, LOGFILE);

	$subject = "Your Club Website login link";

	$login_url = "https://" . $_SERVER['HTTP_HOST'] . "?token=$token";

	$body = "Click on the link below to log in. The link is valid for 30 minutes and can only be used once.\n\n" . $login_url . "\n\nIf you did not request this email, you can safely ignore it.";

	$mail = new PHPMailer();

	try {
		//		$mail->SMTPDebug	= SMTP::DEBUG_SERVER;
		$mail->isSMTP();
		$mail->Host			= 'smtp.improvmx.com';
		$mail->SMTPAuth 	= true;
		$mail->Username 	= getServerSecret("MAIL_USERNAME");	// improvmx username
		$mail->Password 	= getServerSecret("MAIL_PASSWORD");	// improvmx password
		$mail->SMTPSecure 	= PHPMailer::ENCRYPTION_STARTTLS;
		$mail->Port 		= 587;

		$mail->setFrom(getServerSecret("MAIL_USERNAME"), 'Chris');
		$mail->addAddress($to);
		$reply_to = 'no-reply@' . $_SERVER['HTTP_HOST'];
		$mail->addReplyTo($reply_to, 'Do Not Reply');
		$mail->Subject		= $subject;
		$mail->Body			= $body;

		$mail->send();
	} catch (Exception $e) {
		$info = $mail->ErrorInfo;
		error_log(date('Y-m-d H:i:s') . " Email could not be sent to $to. Mailer Error: $info\n", 3, LOGFILE);
		return false;
	}

	error_log(date('Y-m-d H:i:s') . " Email sent to $to\n", 3, LOGFILE);

	return true;
}
