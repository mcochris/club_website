(function () {
    const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const CSRF_TOKEN = document.querySelector("#csrf-token");
    const CURRENT_YEAR = document.querySelector("#current-year");
    const DOCUMENT_MAIN = document.querySelector("main");
    const FORM = document.querySelector("form");
    const EMAIL = document.querySelector("#email");
    const MESSAGE = document.querySelector("#message");
    const FORM_BUTTON = document.querySelector("#form-button");
    // Set current year in footer
    CURRENT_YEAR.textContent = new Date().getFullYear().toString();
    //=============================================================
    // Function to post data to server
    //=============================================================
    async function postData(data) {
        const RESPONSE = await fetch("api.php", {
            method: 'POST',
            body: data,
            signal: AbortSignal.timeout(5000)
        });
        if (!RESPONSE.ok)
            throw new Error(`HTTP error! status: ${RESPONSE.status}`);
        const REPLY = await RESPONSE.json();
        return REPLY;
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
                MESSAGE.textContent = "If the email you entered is in our system, you will receive an email with instructions on how to access the member section of this website.";
            else
                MESSAGE.textContent = REPLY.message;
            return;
        })().catch(_error => {
            MESSAGE.textContent = 'Error processing email entry';
        }).finally(() => {
            disableEmailInput();
        });
    });
    //=============================================================
    // Disable email input and remove submit button
    //=============================================================
    function disableEmailInput() {
        EMAIL.disabled = true;
        FORM_BUTTON.remove();
    }
})();
export {};
//# sourceMappingURL=index.js.map