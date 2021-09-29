var redirect;
async function login() {
	// grey out login button
	document.querySelector("#loginbutton").classList.add("greyedout");
	document.querySelector("#loginbutton").value = "loading...";
	
	var baseurl = addhttp(document.querySelector("#baseurl").value);
	var post_data = {
		From: "",
		InterfaceSource: "WebApp",
		Username: document.querySelector("#username").value,
		Password: document.querySelector("#password").value
	};
	
	if (!validurl(baseurl)) {
		shake_login();
		show_popup("please enter your base URL");
		return;
	}
	
	if (!post_data.Username) {
		shake_login();
		show_popup("please enter your username");
		return;
	}
	
	if (!post_data.Password) {
		shake_login();
		show_popup("please enter your password");
		return;
	}
	
	if (user.username != post_data.Username) {
		localforage.removeItem("user"); // clear data if different user
	}
	// store form data for future speed
	user.username = post_data.Username;
	user.baseurl = baseurl;
	user.token = await get_verification_token(); // logging in needs this token
	save_data(user);

	// this request to log you in.
	var login_response = await fetch(base_endpoint + baseurl + "/api/SignIn", {
		method: "POST",
		body: JSON.stringify(post_data),
		headers: {
			"RequestVerificationToken": user.token
		}
	});
	login_response = await login_response.json();

	if (!login_response.LoginSuccessful) {
		console.log("login unsucessful!");
		show_popup("login failed");
		shake_login();
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
		show_popup(popup);
	}

	var baseurl = url.searchParams.get("baseurl");
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

	var loggedin = await logged_in();
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
