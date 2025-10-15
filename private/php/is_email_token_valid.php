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
//	hash the token
//==============================================================================
$token_hash = hash("sha3-224", $token);

//==============================================================================
//	Open the DB
//==============================================================================
$pdo = openDb();

//==============================================================================
//	See if email token is in DB. If it is, get the user's name
//==============================================================================
try {
	$stmt = $pdo->prepare("
	SELECT magic_link_tokens.expires_at, magic_link_tokens.used, users.id, users.firstName, users.lastName, users.email
	FROM users JOIN magic_link_tokens ON users.id = magic_link_tokens.user_id
	WHERE magic_link_tokens.token_hash = :token_hash");
	$stmt->bindParam(':token_hash', $token_hash, PDO::PARAM_STR);
	$stmt->execute();
	$row = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
	sendResponse(false, "Internal error " . __LINE__);
	internalError("Database error: " . $e->getMessage());
}

//==============================================================================
//	If the hashed token is not in DB, we are done
//==============================================================================
if (empty($row)) {
	sendResponse(false, "");	// don't say "token not found" to avoid leaking info
	exit;
}

//==============================================================================
//	IF we get to here, the token was found in the DB. See if the token has been used
//==============================================================================
if ($row["used"] == 1) {
	sendResponse(false, "Token has already been used");
	exit;
}

//==============================================================================
//	See if token is expired
//==============================================================================
if ($row["expires_at"] < time()) {
	sendResponse(false, "Token has expired");
	exit;
}

//==============================================================================
//	If we get to here, the token is valid. Mark it as used
//==============================================================================
try {
	$stmt = $pdo->prepare("UPDATE magic_link_tokens SET used = 1 WHERE token_hash = :token");
	$stmt->bindParam(':token', $token, PDO::PARAM_STR);
	$stmt->execute();
} catch (PDOException $e) {
	sendResponse(false, "Internal error " . __LINE__);
	internalError("Database error: " . $e->getMessage());
}

//==============================================================================
//	Update logins table in DB with user ID and timestamp
//==============================================================================
try {
	$stmt = $pdo->prepare("INSERT INTO logins (user_id, ip_address) VALUES (:user_id, :ip_address)");
	$stmt->bindParam(':user_id', $row["id"], PDO::PARAM_INT);
	$ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
	$stmt->bindParam(':ip_address', $ip_address, PDO::PARAM_STR);
	$stmt->execute();
} catch (PDOException $e) {
	sendResponse(false, "Internal error " . __LINE__);
	internalError("Database error: " . $e->getMessage());
}

$_SESSION["user_id"] = $row["id"];
$_SESSION["users_first_name"] = $row["firstName"];
$_SESSION["users_last_name"] = $row["lastName"];
$_SESSION["users_email"] = $row["email"];
$_SESSION["login_time"] = time();

sendResponse(true, "Valid token");
exit;
