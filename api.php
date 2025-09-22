<?php
$script = trim(filter_input(INPUT_POST, 'script', FILTER_SANITIZE_FULL_SPECIAL_CHARS));

try {
	require __DIR__ . "/../club_website_php/$script";
} catch (\Throwable $e) {
	exit($e->getMessage());
}

exit("ok");
