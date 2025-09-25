<?php

declare(strict_types=1);

require_once "include.php";

email_entered();

function email_entered(): void
{
	//==============================================================================
	//	start the session
	//==============================================================================
	my_session_start();

	//------------------------------------------------------------------------------
	//	set the timezone
	//------------------------------------------------------------------------------
	date_default_timezone_set($_SESSION["TZ"] ?? "UTC");

	//==============================================================================
	//	get out quick if user is locked out
	//==============================================================================
	if (isset($_SESSION["lockout_end_time"])) {
		$time_diff = $_SESSION["lockout_end_time"] - time();
		if ($time_diff > 0) {
			sendResponse(true, "Site access lockout expires at " . date("g:i:s a", $_SESSION["lockout_end_time"]) . ".");
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
	//	validate the CSRF token
	//==============================================================================
	$csrf_token = filter_input(INPUT_POST, 'csrf_token', FILTER_SANITIZE_FULL_SPECIAL_CHARS);

	if (empty($csrf_token)) {
		sendResponse(false, "Security issue " . __LINE__);
		internalError("No CSRF token in session");
	}

	//if (hash_equals($_SESSION["csrf_token"], $csrf_token) === false) {
	if ($_SESSION["csrf_token"] !== $csrf_token) {
		sendResponse(false, "Security issue " . __LINE__);
		internalError("Invalid CSRF token in session");
	}

	//==============================================================================
	//	validate the secure CSRF token
	//==============================================================================
	$secured_csrf_token = hash_hmac('sha3-256', $csrf_token, getServerSecret());

	//if (hash_equals($_SESSION["secured_csrf_token"], $secured_csrf_token) === false) {
	if ($_SESSION["secured_csrf_token"] !== $secured_csrf_token) {
		sendResponse(false, "Security issue " . __LINE__);
		internalError("Invalid secured CSRF token in session");
	}

	//==============================================================================
	//	validate email address
	//==============================================================================
	$email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
	if (empty($email) or filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
		sendResponse(true, "Please enter a valid email address.");
		internalError("Invalid email address: \"" . $email . "\"");
	}

	//==============================================================================
	//	If we get to here, we got a valid email address. Time to see if they are in
	//	the DB. Open DB connection
	//==============================================================================
	$pdo = open_db();

	//==============================================================================
	//	See if users' email is in DB
	//==============================================================================
	try {
		$stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
		$stmt->bindParam(':email', $email, PDO::PARAM_STR);
		$stmt->execute();
		$row = $stmt->fetch(PDO::FETCH_ASSOC);
	} catch (PDOException $e) {
		sendResponse(false, "Internal error " . __LINE__);
		internalError("Database error: " . $e->getMessage());
	}

	//==============================================================================
	//	If users' email not in DB, we are done
	//==============================================================================
	if ($row === false) {
		sendResponse(true, "If the email you entered is in our system, you will receive an email with instructions on how to access the member section of this website.");
		my_session_destroy();
		exit;
	}

	//==============================================================================
	//	If users' email in in DB, generate a token for them
	//==============================================================================
	try {
		$stmt = $pdo->prepare("INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (:id, :token, :expires_at)");
		$stmt->bindParam(':id', $row["id"], PDO::PARAM_INT);
		$stmt->bindParam(':token', hash_hmac('sha3-256', random_bytes(16), getServerSecret()), PDO::PARAM_STR);
		$stmt->bindParam(':expires_at', date("r", time() + 1800), PDO::PARAM_STR);
		$stmt->execute();
		$row = $stmt->fetch(PDO::FETCH_ASSOC);
	} catch (PDOException $e) {
		echo "Database error: " . $e->getMessage();
		sendResponse(false, "Internal error " . __LINE__);
		internalError("Database error: " . $e->getMessage());
	}

	sendResponse(true, "If the email you entered is in our system, you will receive an email with instructions on how to access the member section of this website.");
	my_session_destroy();
	exit;
}
