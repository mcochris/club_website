(function () {
    const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const CSRF_TOKEN = document.querySelector("#csrf-token");
    const CURRENT_YEAR = document.querySelector("#current-year");
    const DOCUMENT_MAIN = document.querySelector("main");
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
        if (!REPLY.success)
            DOCUMENT_MAIN.innerHTML = `<h1>Error 1 sending timezone</h1><p>${REPLY.data}</p>`;
    })().catch(_error => {
        DOCUMENT_MAIN.innerHTML = '<h1>Error 2 sending timezone</h1>';
    }).finally(async () => {
        DOCUMENT_MAIN.style.visibility = 'visible';
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
        else
            DOCUMENT_MAIN.innerHTML = `<h1>Error 1 getting CSRF token</h1><p>${REPLY.data}</p>`;
    })().catch(_error => {
        DOCUMENT_MAIN.innerHTML = '<h1>Error 2 getting CSRF token</h1>';
    }).finally(async () => {
        DOCUMENT_MAIN.style.visibility = 'visible';
    });
})();
export {};
//# sourceMappingURL=index.js.map