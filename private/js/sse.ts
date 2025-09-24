(function () {
	const evtSource = new EventSource('sse.php');
	console.log(evtSource.withCredentials);
	console.log(evtSource.readyState);
	console.log(evtSource.url);

	const eventList = document.querySelector('ul') as HTMLUListElement;

	evtSource.onopen = function () {
		console.log("Connection to server opened.");
	};

	evtSource.onmessage = function (e) {
		const newElement = document.createElement("li");
		newElement.textContent = "message: " + e.data;
		eventList.appendChild(newElement);
	};

	evtSource.onerror = function () {
		console.log("EventSource failed.");
	};

	//evtSource.addEventListener("ping", function (e) {
	//	var newElement = document.createElement("li");

	//	var obj = JSON.parse(e.data);
	//	newElement.innerHTML = "ping at " + obj.time;
	//	eventList.appendChild(newElement);
	//}, false);
})();
export {};