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
//	Verify token from clients' localStorage in DB
//==============================================================================
$pdo = openDb();

try {
	$stmt = $pdo->prepare("SELECT users.firstName, users.lastName FROM users JOIN logged_in_tokens ON users.id = logged_in_tokens.user_id where logged_in_tokens.token = :token");
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
if (empty($row)) {
	sendResponse(false, "Not logged in");
	mySessionDestroy();
	exit;
}

//==============================================================================
//	If we get to here, the token was found in the DB. We are logged in
//==============================================================================
sendResponse(true, json_encode(["firstName" => $row["firstName"], "lastName" => $row["lastName"]]));
exit;