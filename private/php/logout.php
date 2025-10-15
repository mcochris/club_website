<?php

declare(strict_types=1);

require_once "include.php";

mySessionStart();

$pdo = openDb();

$stmt = $pdo->prepare("INSERT INTO logouts (user_id) VALUES (:user_id)");
$stmt->bindValue(':user_id', $_SESSION["user_id"], PDO::PARAM_INT);
$stmt->execute();

sendResponse(true, "Logged out.");

mySessionDestroy();
