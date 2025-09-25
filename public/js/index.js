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
    EMAIL.value = "";
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
        if (!REPLY.success)
            DOCUMENT_MAIN.innerHTML = `<h1>Error 1 sending timezone</h1><p>${REPLY.data}</p>`;
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
        if (REPLY.success)
            CSRF_TOKEN.value = REPLY.data;
        else {
            DOCUMENT_MAIN.innerHTML = `<h1>Error 1 getting CSRF token</h1><p>${REPLY.data}</p>`;
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
            if (REPLY.success)
                MESSAGE.innerHTML = `<p>${REPLY.data}</p>`;
            else
                DOCUMENT_MAIN.innerHTML = `<h1>Error 1 processing email entry</h1>`;
            disableEmailInput();
        })().catch(_error => {
            DOCUMENT_MAIN.innerHTML = '<h1>Error 2 processing email entry</h1>';
        }).finally(() => {
            disableEmailInput();
        });
    });
    function disableEmailInput() {
        EMAIL.disabled = true;
        FORM_BUTTON.remove();
    }
})();
export {};
//# sourceMappingURL=index.js.map