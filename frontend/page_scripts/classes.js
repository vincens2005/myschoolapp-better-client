async function init() {
	user = await get_user();
	user.last_page = location.toString();
	save_data(user);

	// check if user is logged in
	var loggedin = await logged_in();
	if (!loggedin) {
		location = "login.html?redirect=classes.html";
		return;
	}

	get_header();
	
	var endpoint_url = "/api/webapp/context";
	
	var request = await fetch(base_endpoint + user.baseurl + endpoint_url);
	var data = await request.json();
	
	if (!data.Groups) {
		console.log("tf? y u no classes");
		return;
	}
	
	var classes = [];
	for (var group of data.Groups) {
		if (!group.PublishGroupToUser || !group.CurrentEnrollment /* this only shows you your current classes */) continue;
		
		classes.push({
			id: group.SectionId,
			name: group.GroupName,
			teacher: group.OwnerName || "nobody",
			category: group.Category
		});
	}
	
	fill_template("class_template", {classes}, "output");
	document.querySelector("#output").classList.remove("ohidden");
}

window.addEventListener("DOMContentLoaded", init);
