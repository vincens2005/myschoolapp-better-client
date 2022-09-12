let redirect;
async function do_login() {
	// grey out login button
	document.querySelector("#loginbutton").classList.add("greyedout");
	document.querySelector("#loginbutton").value = "loading...";

	let baseurl = addhttp(document.querySelector("#baseurl").value);
	let username = document.querySelector("#username").value;
	let password = document.querySelector("#password").value;

	if (!validurl(baseurl)) {
		shake_login();
		show_popup("please enter your base URL");
		return;
	}

	if (!username) {
		shake_login();
		show_popup("please enter your username");
		return;
	}

	if (user.username != username) {
		localforage.removeItem("user"); // clear data if different user
		user = await get_user();
	}
	// store form data for future speed
	user.username = username;
	user.baseurl = baseurl;

	let success = false;

	if (!user.blackbaud_login) {
		let response_json = await fetch(base_endpoint + baseurl + "/api/Bbid/StatusByName", {
			method: "POST",
			body: JSON.stringify({
				userName: username,
				rememberType: 2 // idk
			}),
			headers: {
				"content-type": "application/json"
			}
		}).then(a => a.json());
		if (response_json.Linked) user.blackbaud_login = true;
	}

	if (user.blackbaud_login && !window.bb_login) {
		document.querySelector("#extension_popup").classList.remove("hidden");
		setTimeout(() => {
			document.querySelector("#extension_popup").classList.remove("ohidden");
		}, 50);
		return;
	}

	if (user.blackbaud_login && window.bb_login) {
		user.token = await get_verification_token();
		save_data(user);
		success = await window.bb_login(username, baseurl);
	}

	if (!password && !success && !user.blackbaud_login) {
		shake_login();
		show_popup("please enter your password");
		return;
	}


	success = success || await login(username, password); // we're not saving user data here because login() saves it

	if (!success) {
		console.log("login unsucessful!");
		show_popup("login failed");
		shake_login();
		document.querySelector("#loginbutton").classList.remove("greyedout");
		document.querySelector("#loginbutton").value = "log in";
		return;
	}

	console.log("we did it!")

	// redirect to page.
	location = redirect || user.last_page || "schedule.html";
}

async function init() {
	let url = new URL(location);
	redirect = url.searchParams.get("redirect");
	redirect = safe_decode(redirect);

	let popup = url.searchParams.get("popup");
	popup = safe_decode(popup);
	if (popup) {
		show_popup(popup);
	}

	let baseurl = url.searchParams.get("baseurl");
	baseurl = safe_decode(baseurl);
	if (baseurl) {
		document.querySelector("#baseurl").value = removehttp(baseurl);
	}

	user = await get_user();
	if (!validurl(user.baseurl)) return;
	// I know this is kind of a dumb way to prioritize the query string, but idgaf
	document.querySelector("#baseurl").value = baseurl || removehttp(user.baseurl);
	document.querySelector("#username").value = user.username;

	// grey out login button
	document.querySelector("#loginbutton").classList.add("greyedout");
	document.querySelector("#loginbutton").value = "loading...";

	let loggedin = await logged_in();
	if (loggedin) {
		location = redirect || user.last_page || "schedule.html";
		return;
	}
	user.token = "";
	save_data(user);
	document.querySelector("#loginbutton").classList.remove("greyedout");
	document.querySelector("#loginbutton").value = "log in";
}

function shake_login() {
	document.querySelector("#loginform").classList.add("shake");
	setTimeout(() => {
		document.querySelector("#loginform").classList.remove("shake");
	}, 550);
}

function show_popup(text) {
	document.querySelector("#popup").innerText = text;
	document.querySelector("#popup").classList.remove("ohidden");
}

window.addEventListener("DOMContentLoaded", init);
