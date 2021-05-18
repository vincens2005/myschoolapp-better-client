// TODO: use /api/webapp/context to get list of classes
async function init() {
	user = await get_user();
	user.last_page = location;
	save_data(user);

	// check if user is logged in
	var loggedin = await logged_in();
	if (!loggedin) {
		location = "login.html";
		return;
	}

	get_header();
}
