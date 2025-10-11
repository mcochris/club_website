<?php

declare(strict_types=1);

$script = trim(filter_input(INPUT_POST, 'script', FILTER_SANITIZE_FULL_SPECIAL_CHARS));

if (empty($script))
	exit;

require __DIR__ . "/$script";

// If we get to here, the script was included and ran without throwing an exception or exiting.
// Normally if the script returns anything, it does so by calling sendResponse().
exit;
