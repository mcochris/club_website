(function () {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    //=============================================================
    // Send timezone to server
    //=============================================================
    const formData = new FormData();
    formData.append('script', "receive_tz.php");
    formData.append('timezone', timezone);
    fetch("api.php", {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'text/plain' },
        signal: AbortSignal.timeout(5000)
    });
})();
export {};
//# sourceMappingURL=send_tz.js.map