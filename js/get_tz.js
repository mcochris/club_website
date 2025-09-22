var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function () {
    const PRODUCTION = false;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    PRODUCTION || console.log("User timezone: ", timezone);
    //=============================================================
    // Send timezone to server
    //=============================================================
    const formData = new FormData();
    formData.append('script', "receive_tz.php");
    formData.append('timezone', timezone);
    function set_tz() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                PRODUCTION || console.log('POSTing to api.php');
                const response = yield fetch("api.php", {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'text/plain' },
                    signal: AbortSignal.timeout(5000)
                });
                if (!response.ok) {
                    PRODUCTION || console.error('POST to api.php failed');
                    return;
                }
                const result = yield response.text();
                PRODUCTION || console.log('POST to api.php call returns: ', result);
                return result.trim();
            }
            catch (error) {
                document.body.innerHTML = '<h1>Network Error 4</h1><p>Please refresh the page.</p>';
                PRODUCTION || console.error('Error POSTing to api.php: ', error);
                document.body.style.visibility = 'visible';
                return null;
            }
        });
    }
    set_tz().then(response => {
        if (response === "ok")
            PRODUCTION || console.log('Timezone sent to server');
        else
            document.body.innerHTML = '<h1>Internal Error</h1><p>Website inoperative at this time.</p>';
    });
})();
export {};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0X3R6LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vY2x1Yl93ZWJzaXRlX3BocC9nZXRfdHoudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsQ0FBQztJQUNBLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQTtJQUN4QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsZUFBZSxFQUFFLENBQUMsUUFBUSxDQUFBO0lBQ2pFLFVBQVUsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBRXRELCtEQUErRDtJQUMvRCwwQkFBMEI7SUFDMUIsK0RBQStEO0lBQy9ELE1BQU0sUUFBUSxHQUFHLElBQUksUUFBUSxFQUFFLENBQUM7SUFDaEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQUM1QyxRQUFRLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUV0QyxTQUFlLE1BQU07O1lBQ3BCLElBQUksQ0FBQztnQkFDSixVQUFVLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxTQUFTLEVBQUU7b0JBQ3ZDLE1BQU0sRUFBRSxNQUFNO29CQUNkLElBQUksRUFBRSxRQUFRO29CQUNkLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUU7b0JBQ25DLE1BQU0sRUFBRSxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztpQkFDakMsQ0FBQyxDQUFDO2dCQUVILElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ2xCLFVBQVUsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7b0JBQ3RELE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDckMsVUFBVSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3BFLE9BQU8sTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3RCLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyx5REFBeUQsQ0FBQztnQkFDcEYsVUFBVSxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ2pFLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7Z0JBQzNDLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztRQUNGLENBQUM7S0FBQTtJQUVELE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUN4QixJQUFJLFFBQVEsS0FBSyxJQUFJO1lBQ3BCLFVBQVUsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLENBQUM7O1lBRXJELFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLGlFQUFpRSxDQUFDO0lBQzlGLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNMLE9BQU8sRUFBRyxDQUFBIn0=