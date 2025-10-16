<?php

declare(strict_types=1);

require_once "include.php";

mySessionStart();

$pdo = openDb();

if(empty($_SESSION["user_id"])) {
	sendResponse(false, "Not logged in");
	exit;
}

//==============================================================================
//	set used field in magic_link_tokens table to true
//==============================================================================
$stmt = $pdo->prepare("UPDATE magic_link_tokens SET used = TRUE WHERE user_id = :user_id");
$stmt->bindValue(':user_id', $_SESSION["user_id"], PDO::PARAM_INT);
$stmt->execute();

//==============================================================================
//	log the logout in the logouts table
//==============================================================================
$stmt = $pdo->prepare("INSERT INTO logouts (user_id) VALUES (:user_id)");
$stmt->bindValue(':user_id', $_SESSION["user_id"], PDO::PARAM_INT);
$stmt->execute();

//==============================================================================
//	destroy the session
//==============================================================================
mySessionDestroy();

sendResponse(true, "Logged out.");
