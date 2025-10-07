declare const DOMPurify: any;

//=============================================================
// Main script
//=============================================================

(function () {
	const DOCUMENT_FOOTER_YEAR = document.querySelector("#current-year") as HTMLSpanElement
	const DOCUMENT_MAIN = document.querySelector("main") as HTMLElement;
	const DOCUMENT_FORM = document.querySelector("form") as HTMLFormElement;
	const DOCUMENT_EMAIL = document.querySelector("#email") as HTMLInputElement;
	const LOADER = document.querySelector(".loader") as HTMLSpanElement;

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
		const response = await fetch("api.php", {
			method: 'POST',
			body: data,
			credentials: 'same-origin', // Important: includes cookies
			signal: AbortSignal.timeout(5000)
		});

		const reply = await response.json();
		return reply as Promise<ServerResponse>;
	}

	//=============================================================
	// Send timezone to server
	//=============================================================
	async function sendTimezone(): Promise<void> {
		const form_data = new FormData();
		form_data.append('script', "set_tz.php");
		form_data.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
		await postData(form_data);
	};

	//=============================================================
	// Check if user is already logged in
	//=============================================================
	async function isUserLoggedIn(): Promise<void> {
		const logged_in_token = localStorage.getItem("logged_in_token");
		if (!logged_in_token) return;

		// Verify the token with server
		const loginForm = new FormData();
		loginForm.append('script', "is_user_logged_in.php");
		loginForm.append('token', logged_in_token);

		const loginReply = await postData(loginForm);

		if (!loginReply.display) {
			localStorage.removeItem("logged_in_token");
			return;
		}

		// User is logged in, fetch member area
		await displayMemberArea();
	}

	//=============================================================
	// Check if user clicked on login link in email
	//=============================================================
	async function isEmailTokenValid(): Promise<void> {
		const url_params = new URLSearchParams(window.location.search);
		const email_token = url_params.get('token');
		if (!email_token) return;

		const form_data = new FormData();
		form_data.append('script', "is_email_token_valid.php");
		form_data.append('token', email_token);

		history.replaceState(null, '', window.location.href.split('?')[0]);

		const reply = await postData(form_data);

		// Token was not legitimate, display message from server (old token, already used, etc.)
		if (!reply.display) {
			if (reply.message)
				DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize(reply.message);
			return;
		}

		// User email token was legitimate, store new token in localStorage
		localStorage.setItem("logged_in_token", reply.message);

		await displayMemberArea();
	}

	//=============================================================
	// Email form submit event listener
	//=============================================================
	DOCUMENT_FORM.addEventListener('submit', (event) => {
		event.preventDefault();
		(async () => {
			const form_data = new FormData();
			form_data.append('script', "email_entered.php");
			form_data.append('email', DOCUMENT_EMAIL.value);
			const reply = await postData(form_data);
			if (reply.display)
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

		if (reply.display) DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize(reply.message);
	}

	//=============================================================
	// Initial actions
	//=============================================================
	sendTimezone();
	isUserLoggedIn();
	isEmailTokenValid();
	LOADER.style.display = "none";
	DOCUMENT_MAIN.style.visibility = "visible";
})();

export { }