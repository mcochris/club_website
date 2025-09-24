<?php

declare(strict_types=1);

require_once "include.php";
my_session_start();

require_once "get_csrf_token.php";
//[$replacement, $csrf_token] = get_csrf_token();

?>
<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Club Website</title>
	<meta name="description" content="Club Website">
	<meta name="author" content="Chris Strawser">
	<meta name="keywords" content="club, website, example">
	<link rel="stylesheet" href="css/styles.css">
</head>

<body>
	<header>Welcome to the Club Website!</header>
	<main>
		<form>
			<label for="email">Please enter your email address: </label>
			<input type="email" id="email" required autocomplete="email" autofocus maxlength="100">
			<input type="hidden" id="csrf_token" value="<?= $csrf_token ?>">
			<button type="submit">Submit</button>
			<p id="message"><?= $_SESSION["TZ"] ?></p>
		</form>
	</main>
	<ul></ul>
	<footer>Club Website &copy; <?= date("Y") ?></footer>
	<script type="module" src="js/get_tz.js"></script>
	<script type="module" src="js/index2.js"></script>
	</div>
</body>

</html>