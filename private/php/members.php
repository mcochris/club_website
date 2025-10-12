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

if(empty($_SESSION["user_id"])) {
	sendResponse(false, "Not logged in");
	exit;
}

//==============================================================================
//	Updated visits table in DB with this visit
//==============================================================================
$pdo = openDb();
try {
	$stmt = $pdo->prepare("INSERT INTO visits (user_id, ip_address) VALUES (:user_id, :ip_address)");
	$stmt->bindParam(':user_id', $_SESSION["user_id"], PDO::PARAM_INT);
	$stmt->bindParam(':ip_address', $_SERVER["REMOTE_ADDR"], PDO::PARAM_STR);
	$stmt->execute();
} catch (PDOException $e) {
	internalError("Database error: " . $e->getMessage());
}

sendResponse(true, "Hello from the members area");