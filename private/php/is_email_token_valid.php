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
if (empty($token)) {
	sendResponse(false, "No token provided");
	exit;
}

//==============================================================================
//	Open the DB
//==============================================================================
$pdo = openDb();

//==============================================================================
//	See if email token is in DB. If it is, get the user's name
//==============================================================================
try {
	$stmt = $pdo->prepare("SELECT magic_link_tokens.expires_at, magic_link_tokens.used FROM users JOIN magic_link_tokens ON users.id = magic_link_tokens.user_id where magic_link_tokens.token_hash = :token_hash");
	$stmt->bindParam(':token_hash', $token, PDO::PARAM_STR);
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
	sendResponse(false, "");	// don't say "token not found" to avoid leaking info
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
	$stmt = $pdo->prepare("UPDATE email_tokens SET used = 1 WHERE token = :token");
	$stmt->bindParam(':token', $token, PDO::PARAM_STR);
	$stmt->execute();
} catch (PDOException $e) {
	sendResponse(false, "Internal error " . __LINE__);
	internalError("Database error: " . $e->getMessage());
}

sendResponse(true, "Valid token");
exit;