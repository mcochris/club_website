declare const DOMPurify: any;

//=============================================================
// Main script
//=============================================================

(async function () {
	const DOCUMENT_FOOTER_YEAR = document.querySelector("#current-year") as HTMLSpanElement
	const DOCUMENT_MAIN = document.querySelector("main") as HTMLElement;
	const DOCUMENT_FORM = document.querySelector("form") as HTMLFormElement;
	const DOCUMENT_EMAIL = document.querySelector("#email") as HTMLInputElement;
	const LOGOUT_LINK = document.querySelector("#logout-link") as HTMLAnchorElement;

	// Set current year in page footer
	DOCUMENT_FOOTER_YEAR.textContent = new Date().getFullYear().toString();
	DOCUMENT_EMAIL.value = "";
	DOCUMENT_MAIN.focus();

	//=============================================================
	// Interface for server response
	//=============================================================
	interface ServerResponse {
		status: boolean;
		message: string;
	}

	//=============================================================
	// Function to post data to server
	//=============================================================
	async function postData(data: FormData): Promise<ServerResponse> {
		const response = await fetch("api.php", {
			method: 'POST',
			body: data,
			credentials: 'same-origin', // Important: include cookies
			signal: AbortSignal.timeout(10000)
		});

		const reply = await response.json();
		return reply as Promise<ServerResponse>;
	}

	//=============================================================
	// Send timezone to server
	//=============================================================
	async function sendTimezone(): Promise<void> {
		const form = new FormData();
		form.append('script', "set_tz.php");
		form.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
		await postData(form);
	};

	//=============================================================
	// Check if user is already logged in
	//=============================================================
	async function isUserLoggedIn(): Promise<boolean> {
		const form = new FormData();
		form.append('script', "is_user_logged_in.php");
		const reply = await postData(form);
		return reply.status;
	}

	//=============================================================
	// Check if user clicked the magic link in email
	//=============================================================
	async function isEmailTokenValid(email_token: string): Promise<boolean> {
		history.replaceState(null, '', window.location.href.split('?')[0]);
		const form = new FormData();
		form.append('script', "is_email_token_valid.php");
		form.append('token', email_token);

		const reply = await postData(form);

		// Token was not legitimate, display message from server (old token, already used, etc.)
		if (!reply.status) {
			if (reply.message)
				DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize(reply.message);
			return false;
		}

		return reply.status;
	}

	//=============================================================
	// User clicked the email submit button
	//=============================================================
	DOCUMENT_FORM.addEventListener('submit', (event) => {
		event.preventDefault();
		(async () => {
			if (!isValidEmailStrict(DOCUMENT_EMAIL.value)) {
				DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize("The email address you entered is not valid. Please check the address and try again.");
				return;
			}
			const form_data = new FormData();
			form_data.append('script', "email_entered.php");
			form_data.append('email', DOCUMENT_EMAIL.value);
			const reply = await postData(form_data);
			if (reply.status)
				DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize("If the email you entered is in our system, you will receive an email with instructions on how to access the member section of this website.");
			else if (reply.message)
				//	Display error message from server (lockout, invalid email, etc.)
				DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize(reply.message);
		})()
	});

	//=============================================================
	// Fetch and display member area
	//=============================================================
	async function displayMemberArea(): Promise<void> {
		const form_data = new FormData();
		form_data.append('script', "members.php");
		const reply = await postData(form_data);

		DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize(reply.message);
		DOCUMENT_MAIN.style.visibility = "visible";
		LOGOUT_LINK.style.visibility = "visible";

		LOGOUT_LINK.addEventListener('click', async (event) => {
			event.preventDefault();
			const form = new FormData();
			form.append('script', "logout.php");
			await postData(form);
			document.location.reload();
		});
	}

	//=============================================================
	// Initial actions
	//=============================================================
	sendTimezone();

	const url_params = new URLSearchParams(window.location.search);
	const email_token = url_params.get('token');

	if (await isUserLoggedIn())
		displayMemberArea();
	else if (email_token) {
		const reply = await isEmailTokenValid(email_token);
		if (reply) displayMemberArea();
	} else {
		// User is not logged in, display email form
		DOCUMENT_MAIN.style.visibility = "visible";
	}

	//=============================================================
	// Email validation function (strict)
	//=============================================================
	function isValidEmailStrict(email: string): boolean {
		const emailRegex =
			/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
		return emailRegex.test(email);
	}
})();
export { };