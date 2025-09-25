<?php
$script = trim(filter_input(INPUT_POST, 'script', FILTER_SANITIZE_FULL_SPECIAL_CHARS));

try {
	require __DIR__ . "/$script";
} catch (\Throwable $e) {
	exit(json_encode(["success" => false, "data" => $e->getMessage()]));
}

// If we get to here, the script was included and ran without throwing an exception or exiting.
// Normally if the script returns anything, it does so by calling sendResponse().
exit;
