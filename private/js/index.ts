(function () {
	const PRODUCTION = false;
	const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone
	const DOCUMENT_CSRF_TOKEN = document.querySelector("#csrf-token") as HTMLInputElement;
	const DOCUMENT_FOOTER_YEAR = document.querySelector("#current-year") as HTMLSpanElement;
	const DOCUMENT_MAIN = document.querySelector("main") as HTMLElement;
	const DOCUMENT_FORM = document.querySelector("form") as HTMLFormElement;
	const DOCUMENT_EMAIL = document.querySelector("#email") as HTMLInputElement;
	const DOCUMENT_MESSAGE = document.querySelector("#message") as HTMLDivElement;
	const DOCUMENT_FORM_BUTTON = document.querySelector("#form-button") as HTMLButtonElement;
	const CLIENT_TOKEN_NAME = "client_token";

	// Set current year in page footer
	DOCUMENT_FOOTER_YEAR.textContent = new Date().getFullYear().toString();

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

		const REPLY = await RESPONSE.json();
		return REPLY as Promise<ServerResponse>;
	}

	//=============================================================
	// Send timezone to server
	//=============================================================
	(async function (): Promise<void> {
		const FORM_DATA = new FormData();
		FORM_DATA.append('script', "set_tz.php");
		FORM_DATA.append('timezone', TIMEZONE);
		const REPLY = await postData(FORM_DATA);
		if (!REPLY.display) {
			DOCUMENT_MESSAGE.textContent = "Internal error 1";
			PRODUCTION || console.error("Error setting timezone:", REPLY.message);
			DOCUMENT_MAIN.style.visibility = "visible";
			disableEmailInput();
			return;
		}
	})();

	//=============================================================
	// Check if user is already logged in
	//=============================================================
	async function isUserLoggedIn(): Promise<boolean> {
		const CLIENT_TOKEN = localStorage.getItem(CLIENT_TOKEN_NAME);
		if (!CLIENT_TOKEN)
			return Promise.resolve(false);

		// If we get to here, we have a client token in localstorage, now verify it
		const FORM_DATA = new FormData();
		FORM_DATA.append('script', "is_user_logged_in.php");
		FORM_DATA.append('client_token', CLIENT_TOKEN);

		const REPLY = await postData(FORM_DATA);
		if (REPLY.display) {
			localStorage.setItem(CLIENT_TOKEN_NAME, REPLY.message); // Store new client token in localstorage
			return Promise.resolve(true);
		} else {
			localStorage.removeItem(CLIENT_TOKEN_NAME);
			return Promise.resolve(false);
		}
	}

	isUserLoggedIn().then(loggedIn => {
		// If user is logged in, redirect to member area
		if (loggedIn) {
			(async () => {
				const FORM_DATA = new FormData();
				FORM_DATA.append('script', "members.php");
				FORM_DATA.append('token', localStorage.getItem(CLIENT_TOKEN_NAME) || "");
				const REPLY = await postData(FORM_DATA);
				if (REPLY.display) {
					DOCUMENT_MAIN.innerHTML = REPLY.message;	//	will be the members area HTML
					DOCUMENT_MAIN.style.visibility = "visible";
				} else
					getCSRFToken();
			})().catch(error => {
				PRODUCTION || console.error("Error fetching members.php:", error);
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

		const FORM_DATA = new FormData();
		FORM_DATA.append('script', "is_email_token_valid.php");
		FORM_DATA.append('token', TOKEN);

		const REPLY = await postData(FORM_DATA);
		if (REPLY.display) {
			localStorage.setItem(CLIENT_TOKEN_NAME, REPLY.message); // Store new session ID in localstorage
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
				FORM_DATA.append('token', localStorage.getItem(CLIENT_TOKEN_NAME) || "");
				const REPLY = await postData(FORM_DATA);
				if (REPLY.display)
					DOCUMENT_MAIN.innerHTML = REPLY.message;	//	will be the members area HTML
			})().catch(error => {
				PRODUCTION || console.error("Error fetching members.php:", error);
			});
		}
		else
			history.replaceState(null, '', window.location.href.split('?')[0]);
	});

	//=============================================================
	// Prevent form resubmission on page reload
	//=============================================================
	if (window.history.replaceState)
		window.history.replaceState(null, '', window.location.href.split('?')[0]);

	//=============================================================
	// Get CSRF token from server
	//=============================================================
	function getCSRFToken() {
		(async () => {
			const FORM_DATA = new FormData();
			FORM_DATA.append('script', "get_csrf_token.php");
			const REPLY = await postData(FORM_DATA);

			if (REPLY.display) {
				DOCUMENT_CSRF_TOKEN.value = REPLY.message;
				DOCUMENT_EMAIL.value = "";
				DOCUMENT_EMAIL.focus();
			} else {
				DOCUMENT_MAIN.innerHTML = REPLY.message;
			}
		})().catch(error => {
			PRODUCTION || console.error("Error fetching CSRF token:", error);
			DOCUMENT_MAIN.textContent = 'Internal error 2';
		});
		DOCUMENT_MAIN.style.visibility = "visible";
	}

	//=============================================================
	// Email form submit event listener
	//=============================================================
	DOCUMENT_FORM.addEventListener('submit', (event) => {
		event.preventDefault();
		(async () => {
			const FORM_DATA = new FormData();
			FORM_DATA.append('script', "email_entered.php");
			FORM_DATA.append('email', DOCUMENT_EMAIL.value);
			FORM_DATA.append('csrf_token', DOCUMENT_CSRF_TOKEN.value);
			const REPLY = await postData(FORM_DATA);
			if (REPLY.display)
				DOCUMENT_MESSAGE.textContent = "If the email you entered is in our system, you will receive an email with instructions on how to access the member section of this website.";
			else
				DOCUMENT_MESSAGE.textContent = REPLY.message;
		})().catch(_error => {
			DOCUMENT_MESSAGE.textContent = 'Error processing email entry';
		}).finally(() => {
			disableEmailInput();
		})
	});

	//=============================================================
	// Disable email input and remove submit button
	//=============================================================
	function disableEmailInput() {
		DOCUMENT_EMAIL.disabled = true;
		DOCUMENT_FORM_BUTTON.remove();
	}
})();

export { }