//=============================================================
// Main script
//=============================================================
(function () {
    const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
    //const DOCUMENT_CSRF_TOKEN = document.querySelector("#csrf-token") as HTMLInputElement;
    const DOCUMENT_FOOTER_YEAR = document.querySelector("#current-year");
    const DOCUMENT_MAIN = document.querySelector("main");
    const DOCUMENT_FORM = document.querySelector("form");
    const DOCUMENT_EMAIL = document.querySelector("#email");
    //const DOCUMENT_FORM_BUTTON = document.querySelector("#form-button") as HTMLButtonElement;
    //const COOKIE_NAME = "PHPSESSID";
    const LOADER = document.querySelector(".loader");
    // Set current year in page footer
    DOCUMENT_FOOTER_YEAR.textContent = new Date().getFullYear().toString();
    //=============================================================
    // Function to post data to server
    //=============================================================
    async function postData(data) {
        const response = await fetch("api.php", {
            method: 'POST',
            body: data,
            credentials: 'same-origin', // Important: includes cookies
            signal: AbortSignal.timeout(5000)
        });
        const reply = await response.json();
        return reply;
    }
    //=============================================================
    // Send timezone to server
    //=============================================================
    async function sendTimezone() {
        const form_data = new FormData();
        form_data.append('script', "set_tz.php");
        form_data.append('timezone', TIMEZONE);
        const reply = await postData(form_data);
        if (!reply.display) {
            DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize(reply.message);
            //DOCUMENT_MAIN.style.visibility = "visible";
        }
    }
    ;
    //=============================================================
    // Check if user is already logged in via browser localStorage
    //=============================================================
    async function isUserLoggedIn() {
        const logged_in_token = localStorage.getItem("logged_in_token");
        if (!logged_in_token)
            return;
        // Verify the token with server
        const loginForm = new FormData();
        loginForm.append('script', "is_user_logged_in.php");
        loginForm.append('token', logged_in_token);
        const loginReply = await postData(loginForm);
        if (!loginReply.display) {
            localStorage.removeItem("logged_in_token");
            return;
        }
        if (loginReply.message) {
            // User is logged, should return json array of first & last name
            const userInfo = JSON.parse(loginReply.message);
            DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize(`Welcome back ${userInfo.firstName} ${userInfo.lastName}`);
        }
        else
            DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize("Welcome back");
        // User is logged in, fetch member area
        await displayMemberArea();
    }
    //=============================================================
    // Check if user clicked on login link in email
    //=============================================================
    async function isEmailTokenValid() {
        const url_params = new URLSearchParams(window.location.search);
        const email_token = url_params.get('token');
        if (!email_token)
            return;
        const form_data = new FormData();
        form_data.append('script', "is_email_token_valid.php");
        form_data.append('token', email_token);
        const reply = await postData(form_data);
        // user may have a invalid link, need to display error message (if defined)
        if (!reply.display) {
            if (reply.message)
                DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize(reply.message);
            //DOCUMENT_MAIN.style.visibility = "visible";
            return;
        }
        history.replaceState(null, '', window.location.href.split('?')[0]);
        // User is logged in, store new token in localStorage
        localStorage.setItem("logged_in_token", reply.message);
        await displayMemberArea();
    }
    //=============================================================
    // Fetch and display member area
    //=============================================================
    async function displayMemberArea() {
        //const cookie = getCookie(COOKIE_NAME);
        //if (!cookie) return false;
        const form_data = new FormData();
        form_data.append('script', "members.php");
        //form_data.append('token', cookie);
        const reply = await postData(form_data);
        if (reply.display) {
            DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize(reply.message);
            //DOCUMENT_MAIN.style.visibility = "visible";
            return;
        }
        return;
    }
    //=============================================================
    // Get CSRF token from server
    //=============================================================
    //function getCSRFToken() {
    //	(async () => {
    //		const form_data = new FormData();
    //		form_data.append('script', "get_csrf_token.php");
    //		const reply = await postData(form_data);
    //		if (reply.display) {
    //			DOCUMENT_CSRF_TOKEN.value = reply.message;
    //			DOCUMENT_EMAIL.value = "";
    //			DOCUMENT_EMAIL.focus();
    //		} else
    //			DOCUMENT_MAIN.textContent = reply.message;
    //		DOCUMENT_MAIN.style.visibility = "visible";
    //	})()
    //}
    //=============================================================
    // Email form submit event listener
    //=============================================================
    DOCUMENT_FORM.addEventListener('submit', (event) => {
        event.preventDefault();
        (async () => {
            const form_data = new FormData();
            form_data.append('script', "email_entered.php");
            form_data.append('email', DOCUMENT_EMAIL.value);
            //form_data.append('csrf_token', DOCUMENT_CSRF_TOKEN.value);
            const reply = await postData(form_data);
            if (reply.display)
                DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize("If the email you entered is in our system, you will receive an email with instructions on how to access the member section of this website.");
            else if (reply.message)
                DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize(reply.message);
        })();
    });
    //=============================================================
    // Disable email input and remove submit button
    //=============================================================
    //function disableEmailInput() {
    //	DOCUMENT_EMAIL.disabled = true;
    //	DOCUMENT_FORM_BUTTON.remove();
    //}
    //=============================================================
    // Function to get cookie value by name
    //=============================================================
    //function getCookie(name: string): string | undefined {
    //	const value = `; ${document.cookie}`;
    //	const parts = value.split(`; ${name}=`);
    //	if (parts.length === 2)
    //		return decodeURIComponent(parts.pop()?.split(';').shift() || '');
    //	return undefined;
    //}
    // Initial actions
    sendTimezone();
    isUserLoggedIn();
    isEmailTokenValid();
    //getCSRFToken();
    LOADER.style.display = "none";
    DOCUMENT_MAIN.style.visibility = "visible";
})();
export {};
//# sourceMappingURL=index.js.map