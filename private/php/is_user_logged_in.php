<?php

declare(strict_types=1);

require_once "include.php";

//==============================================================================
//	start the session
//==============================================================================
mySessionStart();

//==============================================================================
//	If session does not indicate user is logged in, we need to check the token
//	in the POST data against the DB. If the token is valid, we are logged in.
//	If the token is not valid, we are not logged in and return false.
//==============================================================================
if (empty($_SESSION["user_id"]))
	sendResponse(false, "No user ID in session");
else
	sendResponse(true, "User ID in session");

exit;