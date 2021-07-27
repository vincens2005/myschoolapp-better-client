var redirect;
async function login() {
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

	user = await get_user();
	if (!validurl(user.baseurl)) return;
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
