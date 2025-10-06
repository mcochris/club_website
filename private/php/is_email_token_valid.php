<?php

declare(strict_types=1);

require_once "include.php";

//==============================================================================
//	start the session
//==============================================================================
mySessionStart();

//==============================================================================
//	set the timezone
//==============================================================================
date_default_timezone_set($_SESSION["TZ"] ?? "UTC");

//==============================================================================
//	get the token from the POST data
//==============================================================================
$token = filter_input(INPUT_POST, 'token', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
if ($token === null || $token === false) {
	sendResponse(false, "No token provided");
	exit;
}

//==============================================================================
//	Open the DB
//==============================================================================
$pdo = openDb();

//==============================================================================
//	See if email token is in DB, if so get the user's name
//==============================================================================
try {
	$stmt = $pdo->prepare("SELECT users.name, auth_tokens.expires_at, auth_tokens.used FROM users JOIN auth_tokens ON users.id = auth_tokens.user_id where auth_tokens.token = :token");
	$stmt->bindParam(':token', $token, PDO::PARAM_STR);
	$stmt->execute();
	$row = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
	sendResponse(false, "Internal error " . __LINE__);
	internalError("Database error: " . $e->getMessage());
}

//==============================================================================
//	If the token is not in DB, we are done
//==============================================================================
if ($row === false) {
	sendResponse(false, "Invalid token");
	mySessionDestroy();
	exit;
}

//==============================================================================
//	IF we get to here, the token was found in the DB. See if the token has been used
//==============================================================================
if ($row["used"] == 1) {
	sendResponse(false, "Token has already been used");
	mySessionDestroy();
	exit;
}

//==============================================================================
//	See if token is expired
//==============================================================================
$expires_at = strtotime($row["expires_at"]);
if ($expires_at < time()) {
	sendResponse(false, "Token has expired");
	mySessionDestroy();
	exit;
}

//==============================================================================
//	If we get to here, the token is valid. Mark it as used
//==============================================================================
try {
	$stmt = $pdo->prepare("UPDATE auth_tokens SET used = 1 WHERE token = :token");
	$stmt->bindParam(':token', $token, PDO::PARAM_STR);
	$stmt->execute();
} catch (PDOException $e) {
	sendResponse(false, "Internal error " . __LINE__);
	internalError("Database error: " . $e->getMessage());
}

//==============================================================================
//	Generate a local session token
//==============================================================================
$hex_token = hash_hmac('sha3-256', random_bytes(16), getServerSecret("CSRF_SECRET"), true);
$_SESSION["local_token"] = sodium_bin2base64($hex_token, SODIUM_BASE64_VARIANT_URLSAFE_NO_PADDING);
$_SESSION["secured_local_token"] = hash_hmac('sha3-256', $_SESSION["local_token"], getServerSecret("CSRF_SECRET"));

sendResponse(true, $_SESSION["local_token"]);