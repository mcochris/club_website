(function () {
	const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone
	const CSRF_TOKEN = document.querySelector("#csrf-token") as HTMLInputElement;
	const CURRENT_YEAR = document.querySelector("#current-year") as HTMLSpanElement;
	const DOCUMENT_MAIN = document.querySelector("main") as HTMLElement;
	const FORM = document.querySelector("form") as HTMLFormElement;
	const EMAIL = document.querySelector("#email") as HTMLInputElement;
	const MESSAGE = document.querySelector("#message") as HTMLDivElement;
	const FORM_BUTTON = document.querySelector("#form-button") as HTMLButtonElement;
	const COOKIE_NAME = "PHPSESSID";

	// Set current year in page footer
	CURRENT_YEAR.textContent = new Date().getFullYear().toString();

	//=============================================================
	// Interface for server response
	//=============================================================
	interface ServerResponse {
		display: boolean;
		message: string;
	}

	//=============================================================
	// Function to post data to server
	//=============================================================
	async function postData(data: FormData): Promise<ServerResponse> {
		const RESPONSE = await fetch("api.php", {
			method: 'POST',
			body: data,
			signal: AbortSignal.timeout(5000)
		});

		if (!RESPONSE.ok)
			console.error(`Could not post data: ${RESPONSE.status}`);

		const REPLY = await RESPONSE.json();
		return REPLY as Promise<ServerResponse>;
	}

	//=============================================================
	// Check if user is already logged in
	//=============================================================
	async function isUserLoggedIn(): Promise<boolean> {
		const SESSION_ID = localStorage.getItem(COOKIE_NAME);
		if (!SESSION_ID)
			return Promise.resolve(false);

		// If we get to here, we got a session ID in localstorage, now verify it
		const FORM_DATA = new FormData();
		FORM_DATA.append('script', "is_user_logged_in.php");
		FORM_DATA.append('session_id', SESSION_ID);
		FORM_DATA.append('TZ', TIMEZONE);

		const REPLY = await postData(FORM_DATA);
		if (REPLY.display) {
			localStorage.setItem(COOKIE_NAME, REPLY.message); // Store new session ID in localstorage
			return Promise.resolve(true);
		} else {
			localStorage.removeItem(COOKIE_NAME);
			return Promise.resolve(false);
		}
	}

	isUserLoggedIn().then(loggedIn => {
		// If user is logged in, redirect to member area
		if (loggedIn) {
			(async () => {
				const FORM_DATA = new FormData();
				FORM_DATA.append('script', "members.php");
				FORM_DATA.append('timezone', TIMEZONE);
				FORM_DATA.append('token', localStorage.getItem(COOKIE_NAME) || "");
				const REPLY = await postData(FORM_DATA);
				if (REPLY.display)
					DOCUMENT_MAIN.innerHTML = REPLY.message;
			})().catch(error => {
				console.error("Error fetching members.php:", error);
			});
			return;
		}
	});

	//=============================================================
	// Check if user clicked on login link in email
	//=============================================================
	async function isEmailTokenValid(): Promise<boolean> {
		const URL_PARAMS = new URLSearchParams(window.location.search);
		const TOKEN = URL_PARAMS.get('token');
		if (!TOKEN)
			return Promise.resolve(false);

		// If we get to here, we got a session ID in localstorage, now verify it
		const FORM_DATA = new FormData();
		FORM_DATA.append('script', "is_email_token_valid.php");
		FORM_DATA.append('token', TOKEN);
		FORM_DATA.append('TZ', TIMEZONE);

		const REPLY = await postData(FORM_DATA);
		if (REPLY.display) {
			localStorage.setItem(COOKIE_NAME, REPLY.message); // Store new session ID in localstorage
			return Promise.resolve(true);
		} else
			return Promise.resolve(false);
	}

	isEmailTokenValid().then(valid => {
		// If email token is valid, redirect to member area
		if (valid) {
			(async () => {
				const FORM_DATA = new FormData();
				FORM_DATA.append('script', "members.php");
				FORM_DATA.append('timezone', TIMEZONE);
				FORM_DATA.append('token', localStorage.getItem(COOKIE_NAME) || "");
				const REPLY = await postData(FORM_DATA);
				if (REPLY.display)
					DOCUMENT_MAIN.innerHTML = REPLY.message;
			})().catch(error => {
				console.error("Error fetching members.php:", error);
			});
			return;
		}
	});

	//=============================================================
	// Prevent form resubmission on page reload
	//=============================================================
	if (window.history.replaceState) {
		window.history.replaceState(null, '', window.location.href.split('?')[0]);
	}

	//=============================================================
	// If we get to here user is not logged in. Send timezone to server
	//=============================================================
	(async () => {
		const FORM_DATA = new FormData();
		FORM_DATA.append('script', "set_tz.php");
		FORM_DATA.append('timezone', TIMEZONE);
		const REPLY = await postData(FORM_DATA);
		if (REPLY.display === false)
			DOCUMENT_MAIN.innerHTML = `<h1>Error 1 sending timezone</h1>`;
	})().catch(_error => {
		DOCUMENT_MAIN.innerHTML = '<h1>Error 2 sending timezone</h1>';
	});

	//=============================================================
	// Get CSRF token from server
	//=============================================================
	(async () => {
		const FORM_DATA = new FormData();
		FORM_DATA.append('script', "get_csrf_token.php");
		const REPLY = await postData(FORM_DATA);
		if (REPLY.display)
			CSRF_TOKEN.value = REPLY.message;
		else {
			DOCUMENT_MAIN.innerHTML = REPLY.message;
			disableEmailInput();
		}
	})().catch(_error => {
		DOCUMENT_MAIN.innerHTML = '<h1>Error getting CSRF token</h1>';
	}).finally(async () => {
		DOCUMENT_MAIN.style.visibility = 'visible';
		EMAIL.value = "";
		EMAIL.focus();
	});

	//=============================================================
	// Email form submit event listener
	//=============================================================
	FORM.addEventListener('submit', (event) => {
		event.preventDefault();
		(async () => {
			const FORM_DATA = new FormData();
			FORM_DATA.append('script', "email_entered.php");
			FORM_DATA.append('email', EMAIL.value);
			FORM_DATA.append('csrf_token', CSRF_TOKEN.value);
			const REPLY = await postData(FORM_DATA);
			if (REPLY.display)
				MESSAGE.textContent = "If the email you entered is in our system, you will receive an email with instructions on how to access the member section of this website.";
			else
				MESSAGE.textContent = REPLY.message;
		})().catch(_error => {
			MESSAGE.textContent = 'Error processing email entry';
		}).finally(() => {
			disableEmailInput();
		})
	});

	//=============================================================
	// Disable email input and remove submit button
	//=============================================================
	function disableEmailInput() {
		EMAIL.disabled = true;
		FORM_BUTTON.remove();
	}
})();

export { }