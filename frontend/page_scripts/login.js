var redirect;
async function login() {
	// TODO: form validation
	var baseurl = addhttp(document.querySelector("#baseurl").value);
	var post_data = {
		From: "",
		InterfaceSource: "WebApp",
		Username: document.querySelector("#username").value,
		Password: document.querySelector("#password").value
	};

	// store form data for future speed
	if (user.username != post_data.Username) {
		localforage.removeItem("user"); // clear data if different user
	}
	user.username = post_data.Username;
	user.baseurl = baseurl;
	save_data(user);

	// grey out login button
	document.querySelector("#loginbutton").classList.add("greyedout");
	document.querySelector("#loginbutton").value = "loading...";

	// logging in needs this token
	var token = await get_verification_token();

	// this request log you in.
	var login_response = await fetch(base_endpoint + baseurl + "/api/SignIn", {
		method: "POST",
		body: JSON.stringify(post_data),
		headers: {
			"RequestVerificationToken": token
		}
	});
	login_response = await login_response.json();

	if (!login_response.LoginSuccessful) {
		console.log("Login Unsucessful!");
		// shake login box if something goes wrong
		document.querySelector("#loginform").classList.add("shake");
		setTimeout(() => {
			document.querySelector("#loginform").classList.remove("shake");
		}, 550);
		document.querySelector("#loginbutton").classList.remove("greyedout");
		document.querySelector("#loginbutton").value = "log in";
		return;
	}
	console.log("Login successful!");
	// redirect to page. 
	location = redirect || user.last_page || "schedule.html";
}

async function init() {
	var url = new URL(location);
	redirect = url.searchParams.get("redirect");
	redirect = safe_decode(redirect);

	var popup = url.searchParams.get("popup");
	popup = safe_decode(popup);
	if (popup) {
		document.querySelector("#popup").innerText = popup;
		document.querySelector("#popup").classList.remove("ohidden");
	}

	user = await get_user();
	document.querySelector("#baseurl").value = removehttp(user.baseurl);
	document.querySelector("#username").value = user.username;

	// grey out login button
	document.querySelector("#loginbutton").classList.add("greyedout");
	document.querySelector("#loginbutton").value = "loading...";

	var loggedin = await logged_in();
	if (loggedin) {
		location = redirect || user.last_page || "schedule.html";
		return;
	}
	document.querySelector("#loginbutton").classList.remove("greyedout");
	document.querySelector("#loginbutton").value = "log in";
}

