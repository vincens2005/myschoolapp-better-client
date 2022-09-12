async function init() {
	user = await get_user();
	user.last_page = location.toString();
	save_data(user);

	// check if user is logged in
	let loggedin = await logged_in();
	if (!loggedin) {
		location = "login.html?redirect=classes.html";
		return;
	}

	get_header();

	let endpoint_url = "/api/webapp/context";

	let request = await fetch(base_endpoint + user.baseurl + endpoint_url);
	let data = await request.json();

	if (!data.Groups) {
		console.log("tf? y u no classes");
		return;
	}

	let classes = [];
	for (let group of data.Groups) {
		if (!group.PublishGroupToUser || !group.CurrentEnrollment /* this only shows you your current classes */) continue;

		classes.push({
			id: group.SectionId,
			name: group.GroupName,
			teacher: group.OwnerName,
			category: group.Category
		});
	}

	fill_template("class_template", {classes}, "output");
	document.querySelector("#output").classList.remove("ohidden");
}

window.addEventListener("DOMContentLoaded", init);
