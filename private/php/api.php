<?php
$script = trim(filter_input(INPUT_POST, 'script', FILTER_SANITIZE_FULL_SPECIAL_CHARS));

try {
	require __DIR__ . "/$script";
} catch (\Throwable $e) {
	exit("❌ " . $e->getMessage());
}

exit("👍");
