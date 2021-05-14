// class.js
var current_class = {};
async function init() {
	user = await get_user();

	// check if user is logged in
	var loggedin = await logged_in();
	if (!loggedin) {
		location = "login.html?redirect=" + encodeURIComponent(location);
		return;
	}

	var url = new URL(location);
	var classid = url.searchParams.get("class");
	if (!classid) {
		location = user.last_page;
		return;
	}

	user.last_page = location;
	save_data(user);

	fetch_class_stuff(classid);
}


async function fetch_class_stuff(id) {
	var endpoints = [
		// links endpoint
		{
			url: `/api/link/forsection/${id}/?format=json&editMode=false&active=false&future=false&expired=false&contextLabelId=2`,
			handler: data => {
				if (data.length == 0) {
					return;
				}
				var links = []
				for (var item of data) {
					links.push({
						url: item.Url,
						short_desc: item.ShortDescription,
						desc: item.Description
					});
				}
				fill_template("links_template", {
					links
				}, "links", {
					noEscape: true
				});
				document.querySelector("#links").classList.remove("hidden");
				current_class.links = links;
			}
		},
		// class title endpoint
		{
			url: `/api/datadirect/SectionInfoView/?format=json&SectionId=${id}&associationId=1`,
			handler: data => {
				document.title = data[0].GroupName + " - portal++"
				document.querySelector("#title").innerHTML = data[0].GroupName + " - " + data[0].Identifier + ` (${data[0].Block})`;
				document.querySelector("#title").classList.remove("ohidden");
				current_class.name = data[0].GroupName;
				current_class.block = data[0].Block;
				current_class.identifier = data[0].Identifier;
			}
		},
		// bulletin board text endpoint
		{
			url: `/api/text/forsection/${id}/?format=json&contextLabelId=2`,
			handler: data => {
				if (!data.length) {
					return;
				}
				
				var forsection = { // what is a forsection?
					title: data[0].Description,
					desc: data[0].LongText
				}; // i have no idea
				
				fill_template("main-template", {data: forsection}, "top-bulletin-sections", {
					noEscape: true // there is no escape
				});
				current_class.forsection = forsection;
			}
		},
	]
	
	for (var endpoint of endpoints) {
		fetch(base_endpoint + user.baseurl + endpoint.url)
		.then(a => a.json())
		.then(endpoint.handler)
	}
}
