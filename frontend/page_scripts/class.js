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

	get_header();

	user.last_page = location;
	save_data(user);
	
	var tab = url.hash.replace(/#/gi, "");
	tab = tab.toLowerCase();
	
	var tabs = [
		{
			hash: "bboard",
			label: "Bulletin Board",
			class_name: ((tab == "bboard" || !tab) ? "current-tab" : "")
		},
		{
			hash: "topics",
			label: "Topics",
			class_name: ((tab == "topics") ? "current-tab" : "")
		},
		{
			hash: "roster",
			label: "Roster",
			class_name:  ((tab == "roster") ? "current-tab" : "")
		}
	]
	
	empty_all(document.querySelector("#class-display"))
	fill_template("tab-template", {tabs}, "tabs");
	
	switch(tab) {
		case "topics":
			fetch_topics(classid);
			break;
		case "roster":
			fetch_roster(classid);
			break;
		default:
			fetch_bulletin(classid);
	}
}


async function fetch_bulletin(id) {
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
				fill_template("links_template", {links}, "bulletin-sidebar", {
					noEscape: true
				});
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
				
				fill_template("main-template", forsection, "top-bulletin-sections", {
					noEscape: true // there is no escape
				});
				current_class.forsection = forsection;
			}
		},
	]
	
	for (var endpoint of endpoints) {
		// in this case, use .then rather than await so that these happen simultaniouesutly
		fetch(base_endpoint + user.baseurl + endpoint.url)
		.then(a => a.json())
		.then(endpoint.handler)
	}
}

async function fetch_roster(id) {
	var ftp_image_path = await get_image_path();
	console.log(ftp_image_path)
	
	var roster = await fetch(base_endpoint + user.baseurl + `/api/datadirect/sectionrosterget/${id}/?format=json`).then(a => a.json());
	var people = [];
	
	for (var person of roster) {
		people.push({
			name: person.name,
			image: ftp_image_path + "/user/" + person.userPhotoLarge,
			url: ""
		})
	}
	
	fill_template("roster-template", {people}, "roster");
}

async function fetch_topics(id) {
	var ftp_image_path = await get_image_path();
	
	var topics_raw = await fetch(base_endpoint + user.baseurl + `/api/datadirect/sectiontopicsget/${id}/?format=json&active=true&future=false&expired=false&sharedTopics=false`).then(a => a.json());
	var topics = [];
	for (var topic of topics_raw) {
		topics.push({
			name: topic.Name,
			image: ftp_image_path + "topics/" + topic.ThumbFilename,
			url: "topics.html?topic=" + topic.TopicID
		});
	}
	
	// use the same template as the roster because it's basically the same
	fill_template("roster-template", {people: topics}, "roster");
}
