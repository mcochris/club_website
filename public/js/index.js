(async function () {
    const DOCUMENT_FOOTER_YEAR = document.querySelector("#current-year");
    const DOCUMENT_MAIN = document.querySelector("main");
    const DOCUMENT_FORM = document.querySelector("form");
    const DOCUMENT_EMAIL = document.querySelector("#email");
    const LOGOUT_LINK = document.querySelector("#logout-link");
    DOCUMENT_FOOTER_YEAR.textContent = new Date().getFullYear().toString();
    DOCUMENT_EMAIL.value = "";
    DOCUMENT_MAIN.focus();
    async function postData(data) {
        const response = await fetch("api.php", {
            method: 'POST',
            body: data,
            credentials: 'same-origin',
            signal: AbortSignal.timeout(10000)
        });
        const reply = await response.json();
        return reply;
    }
    async function sendTimezone() {
        const form = new FormData();
        form.append('script', "set_tz.php");
        form.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
        await postData(form);
    }
    ;
    async function isUserLoggedIn() {
        const form = new FormData();
        form.append('script', "is_user_logged_in.php");
        const reply = await postData(form);
        return reply.status;
    }
    async function isEmailTokenValid(email_token) {
        history.replaceState(null, '', window.location.href.split('?')[0]);
        const form = new FormData();
        form.append('script', "is_email_token_valid.php");
        form.append('token', email_token);
        const reply = await postData(form);
        if (!reply.status) {
            if (reply.message)
                DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize(reply.message);
            return false;
        }
        return reply.status;
    }
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
                DOCUMENT_MAIN.innerHTML = DOMPurify.sanitize(reply.message);
        })();
    });
    async function displayMemberArea() {
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
            DOCUMENT_MAIN.style.visibility = "hidden";
            LOGOUT_LINK.style.visibility = "hidden";
        });
    }
    sendTimezone();
    const url_params = new URLSearchParams(window.location.search);
    const email_token = url_params.get('token');
    if (await isUserLoggedIn())
        displayMemberArea();
    else if (email_token) {
        const reply = await isEmailTokenValid(email_token);
        if (reply)
            displayMemberArea();
    }
    else {
        DOCUMENT_MAIN.style.visibility = "visible";
    }
    function isValidEmailStrict(email) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        return emailRegex.test(email);
    }
})();
export {};
//# sourceMappingURL=index.js.map