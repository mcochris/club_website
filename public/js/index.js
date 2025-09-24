(function () {
    const PRODUCTION = false; // Set to false for debugging
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const csrf_token = document.querySelector("#csrf-token");
    const current_year = document.querySelector("#current-year");
    current_year.textContent = new Date().getFullYear().toString();
    //=============================================================
    // Send timezone to server
    //=============================================================
    var formData = new FormData();
    formData.append('script', "set_tz.php");
    formData.append('timezone', timezone);
    fetch("api.php", {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'text/plain' },
        signal: AbortSignal.timeout(5000)
    });
    PRODUCTION || console.log('Timezone ' + timezone + ' sent to server');
    //=============================================================
    // Get CSRF token from server
    //=============================================================
    var formData = new FormData();
    formData.append('script', "get_csrf_token.php");
    //fetch("api.php", {
    //	method: 'POST',
    //	body: formData,
    //	headers: { 'Accept': 'text/plain' },
    //	signal: AbortSignal.timeout(5000)
    //});
    async function getCSRFtoken() {
        const formData = new FormData();
        formData.append('script', "get_csrf_token.php");
        try {
            PRODUCTION || console.log('Fetching CSRF token...');
            const response = await fetch('api.php', {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'text/plain' },
                signal: AbortSignal.timeout(5000)
            });
            if (!response.ok) {
                document.body.innerHTML = '<h1>Network error 1</h1><p>Please refresh the page.</p>';
                PRODUCTION || console.error('Network response was not ok');
                document.body.style.visibility = 'visible';
                return "";
            }
            const token = await response.text();
            PRODUCTION || console.log('CSRF token ' + token + ' fetched successfully');
            return token.trim();
        }
        catch (error) {
            document.body.innerHTML = '<h1>Network Error 2</h1><p>Please refresh the page.</p>';
            PRODUCTION || console.error('Fetch error:', error);
            document.body.style.visibility = 'visible';
            return "";
        }
    }
    (async () => {
        const token = await getCSRFtoken();
        csrf_token.value = token;
        console.log("Token:", token);
    })();
    //getCSRFtoken().then(token => {
    //	if (token) {
    //		// If token includes a space character, get_csrf_token.php likely returned an error message
    //		if (token.includes(" ")) {
    //			document.body.innerHTML = '<p>' + token + '</p>';
    //			PRODUCTION || console.error('CSRF token contains spaces:', token);
    //			document.body.style.visibility = 'visible';
    //			return null;
    //		}
    //		if (token.length !== 22) {
    //			document.body.innerHTML = '<h1>Internal Error 1</h1><p>Please refresh the page.</p>';
    //			PRODUCTION || console.error('CSRF token has invalid length:', token.length);
    //			document.body.style.visibility = 'visible';
    //			return null;
    //		}
    //		csrf_token.value = token;
    //		PRODUCTION || console.log('CSRF token populated in form');
    //		return token;
    //	} else {
    //		document.body.innerHTML = '<h1>Network Error 3</h1><p>Please refresh the page.</p>';
    //		PRODUCTION || console.error('Failed to retrieve CSRF token');
    //		return null;
    //	}
    //}).finally(() => {
    //	document.body.style.visibility = 'visible';
    //});
})();
export {};
//# sourceMappingURL=index.js.map