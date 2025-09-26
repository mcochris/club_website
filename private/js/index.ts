(function () {
	const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone
	const CSRF_TOKEN = document.querySelector("#csrf-token") as HTMLInputElement;
	const CURRENT_YEAR = document.querySelector("#current-year") as HTMLSpanElement;
	const DOCUMENT_MAIN = document.querySelector("main") as HTMLElement;
	const FORM = document.querySelector("form") as HTMLFormElement;
	const EMAIL = document.querySelector("#email") as HTMLInputElement;
	const MESSAGE = document.querySelector("#message") as HTMLDivElement;
	const FORM_BUTTON = document.querySelector("#form-button") as HTMLButtonElement;

	// Set current year in footer
	CURRENT_YEAR.textContent = new Date().getFullYear().toString();
	EMAIL.value = "";

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
			throw new Error(`HTTP error! status: ${RESPONSE.status}`);

		const REPLY = await RESPONSE.json();
		return REPLY as Promise<ServerResponse>;
	}

	//=============================================================
	// Send timezone to server
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
			DOCUMENT_MAIN.innerHTML = `<h1>Error 1 getting CSRF token</h1>`;
			disableEmailInput();
		}
	})().catch(_error => {
		DOCUMENT_MAIN.innerHTML = '<h1>Error 2 getting CSRF token</h1>';
	}).finally(async () => {
		DOCUMENT_MAIN.style.visibility = 'visible';
	});

	//=============================================================
	// Form submit event listener
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
				MESSAGE.innerHTML = `<p>${REPLY.message}</p>`;
			else
				DOCUMENT_MAIN.innerHTML = `<h1>Error 1 processing email entry</h1>`;
			disableEmailInput();
		})().catch(_error => {
			DOCUMENT_MAIN.innerHTML = '<h1>Error 2 processing email entry</h1>';
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