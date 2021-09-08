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

	user.last_page = location.toString();
	save_data(user);

	var tab = url.hash.replace(/#/gi, "");
	tab = tab.toLowerCase();

	var tabs = [{
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
			class_name: ((tab == "roster") ? "current-tab" : "")
		}
	]

	empty_all(document.querySelector("#class-display"))
	fill_template("tab-template", {
		tabs
	}, "tabs");

	switch (tab) {
		case "topics":
			fetch_topics(classid);
			break;
		case "roster":
			fetch_roster(classid);
			break;
		default:
			fetch_bulletin(classid);
	}

	fetch(base_endpoint + user.baseurl + `/api/datadirect/SectionInfoView/?format=json&SectionId=${classid}&associationId=1`).then(a => a.json())
		.then(data => {
			document.title = data[0].GroupName + " - portal++"
			document.querySelector("#title").innerHTML = data[0].GroupName + " - " + data[0].Identifier + ` (${data[0].Block})`;
			document.querySelector("#title").classList.remove("ohidden");
		});
}


async function fetch_bulletin(id) {
	// this is basically a list of callback functions
	// TODO: add more endpoints because there are more.
	var endpoints = [
		// links endpoint
		{
			url: `/api/link/forsection/${id}/?format=json&editMode=false&active=false&future=false&expired=false&contextLabelId=2`,
			handler: data => {
				if (!data.length) return;
				var links = []
				for (let item of data) {
					links.push({
						url: item.Url,
						short_desc: item.ShortDescription,
						is_link: true,
						desc: item.Description
					});
				}
				fill_template("links_template", {
					items: links,
					title: "Links"
				}, "bulletin-sidebar");
			}
		},
		//downloads endpoint
		{
			url: `/api/download/forsection/${id}/?format=json&editMode=false&active=false&future=false&expired=false&contextLabelId=2`,
			handler: data => {
				if (!data.length) return;
				var downloads = []
				for (let item of data) {
					downloads.push({
						url: download_endpoint + user.baseurl + item.DownloadUrl,
						short_desc: item.Description,
						desc: item.Description,
						is_link: true,
						filename: item.FileName
					});
				}
				fill_template("links_template", {
						items: downloads,
						title: "Downloads",
					},
					"bulletin-sidebar");
			}
		},
		// bulletin board text endpoint
		{
			url: `/api/text/forsection/${id}/?format=json&contextLabelId=2`,
			handler: data => {
				if (!data.length) return;
				if (!data[0].Description) return;

				var forsection = { // what is a forsection?
					title: data[0].Description,
					desc: data[0].LongText
				}; // i have no idea

				fill_template("main-template", forsection, "top-bulletin-sections", {
					noEscape: true // there is no escape
				});
			}
		},
		// announcements endpoint
		{
			url: `/api/announcement/forsection/${id}/?format=json&active=true&future=false&expired=false&contextLabelId=2`,
			handler: data => {
				if (!data.length) return;
				var announcements = [];
				for (let item of data) {
					announcements.push({
						is_link: !!item.Description,
						short_desc: item.Name,
						desc: item.Description || false,
						date: item.PublishDateDisplay,
						func: "toggle_announcement"
					});
				}

				fill_template("links_template", {
						items: announcements,
						title: "Annoncements"
					}, "bulletin-sidebar", {
						noEscape: true
					});
			}
		},
		// news endpoint
		{
			url: `/api/news/forsection/${id}/?format=json&editMode=false&active=true&future=false&expired=false&contextLabelId=2`,
			handler: data => {
				if (!data.length) return;
				let items = [];
				
				for (let item of data) {
					items.push({
						name: item.Name,
						short_desc: item.BriefDescription,
						desc: item.Description
					});
				}
				
				fill_template("news_template", {items}, "top-bulletin-sections", {
					noEscape: true
				});
			}
		},
		// photos endpoint
		{
			url: `/api/media/sectionmediaget/${id}/?format=json&contentId=31&editMode=false&active=true&future=false&expired=false&contextLabelId=2`,
			handler: data => {
				if (!data.length) return;
				fill_template("photos_template", {items: data}, "top-bulletin-sections", {
					noEscape: true
				});
			}
		}
	]

	for (let endpoint of endpoints) {
		// in this case, use .then rather than await so that these happen simultaniouesutly
		fetch(base_endpoint + user.baseurl + endpoint.url)
			.then(a => a.json())
			.then(endpoint.handler);
	}
	document.querySelector("#bulletin-sidebar").classList.remove("ohidden");
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
			url: "#roster" // TODO: profile page
		})
	}

	fill_template("roster-template", {
		people
	}, "roster-container");
}

async function fetch_topics(id) {
	var ftp_image_path = await get_image_path();

	var topics_raw = await fetch(base_endpoint + user.baseurl + `/api/datadirect/sectiontopicsget/${id}/?format=json&active=true&future=false&expired=false&sharedTopics=false`).then(a => a.json());
	var topics = [];
	for (var topic of topics_raw) {
		topics.push({
			name: topic.Name,
			image: ftp_image_path + "topics/" + topic.ThumbFilename,
			url: "topic.html?topic=" + topic.TopicID
		});
	}

	// use the same template as the roster because it's basically the same
	fill_template("roster-template", {
		people: topics
	}, "roster-container");
}

function toggle_announcement(id) {
	let element = document.querySelector("#toggle_announcement-" + id);
	if (element.classList.contains("hidden")) return void element.classList.remove("hidden"), element.scrollIntoView();
	element.classList.add("hidden");
	element.parentElement.scrollIntoView();
}
