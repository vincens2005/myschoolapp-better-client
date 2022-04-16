async function login(username, password) {
	let post_data = {
		From: "",
		InterfaceSource: "WebApp",
		Username: username,
		Password: password
	};
	
	if (user.username != post_data.Username) {
		localforage.removeItem("user"); // clear data if different user
	}
	// store form data for future speed
	user.token = await get_verification_token(); // logging in needs this token
	save_data(user);
	
	// this request to log you in.
	let login_response = await fetch(base_endpoint + user.baseurl + "/api/SignIn", {
		method: "POST",
		body: JSON.stringify(post_data),
		headers: {
			"RequestVerificationToken": user.token
		}
	});
	login_response = await login_response.json();
	return login_response.LoginSuccessful;
}
