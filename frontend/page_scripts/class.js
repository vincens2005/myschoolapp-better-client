let association_id = 1;

function strip_css_color(text) {
	return text.replace(/(?:style=.*){0}(?:color:\s*(#000000|black));?/g, "");
}
async function init() {
	user = await get_user();

	// check if user is logged in
	let loggedin = await logged_in();
	if (!loggedin) {
		location = "login.html?redirect=" + encodeURIComponent(location);
		return;
	}

	let url = new URL(location);
	let classid = url.searchParams.get("class");
	if (!classid) {
		location = user.last_page;
		return;
	}

	get_header();

	user.last_page = location.toString();
	save_data(user);

	let tab = url.hash.replace(/#/gi, "");
	tab = tab.toLowerCase();

	let tabs = [
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
			hash: "assignments",
			label: "Assignments",
			class_name: ((tab == "assignments") ? "current-tab" : "")
		},
		{
			hash: "roster",
			label: "Roster",
			class_name: ((tab == "roster") ? "current-tab" : "")
		}
	]

	empty_all(document.querySelector("#class-display"));
	document.querySelector("#bulletin-sidebar").classList.add("hidden");
	fill_template("tab-template", {
		tabs
	}, "tabs");

	let context = await fetch(base_endpoint + user.baseurl + "/api/webapp/context").then(a => a.json());
	let current_class = context.Groups.find((a) => a.SectionId == classid) || {};
	association_id = current_class.Association || 1;

	let contextlabelid = { // TODO: more of these values
		"1": 2,
		"9": 12,
		"3": 12
	}[association_id];

	fetch(base_endpoint + user.baseurl + `/api/datadirect/SectionInfoView/?format=json&SectionId=${classid}&associationId=${association_id}`).then(a => a.json())
		.then(data => {
			document.title = data[0].GroupName + " - portal++"
			document.querySelector("#title").innerHTML = data[0].GroupName + " - " + data[0].Identifier + ` (${data[0].Block})`;
			document.querySelector("#title").classList.remove("ohidden");
		});

	switch (tab) {
		case "topics":
			fetch_topics(classid);
			break;
		case "roster":
			fetch_roster(classid);
			break;
		case "assignments":
			fetch_assignments(classid);
			break;
		default:
			fetch_bulletin(classid, contextlabelid);
	}
}

function syllabus_and_expectations(title, data) {
	let items = [];
	for (let item of data) {
		items.push({
			short_desc: item.ShortDescription,
			description: strip_css_color(item.Description)
		});
	}
	fill_template("syllabus_template", {items, title}, "top-bulletin-sections", {
		noEscape: true
	});
}

async function fetch_bulletin(id, contextlabelid) {
	// this is basically a list of callback functions
	// TODO: add more endpoints because there are more.
	let endpoints = [
		// links endpoint
		{
			url: `/api/link/forsection/${id}/?format=json&editMode=false&active=false&future=false&expired=false&contextLabelId=${contextlabelid}`,
			handler: data => {
				let links = []
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
			url: `/api/download/forsection/${id}/?format=json&editMode=false&active=false&future=false&expired=false&contextLabelId=${contextlabelid}`,
			handler: data => {
				let downloads = []
				for (let item of data) {
					downloads.push({
						url: base_endpoint + user.baseurl + item.DownloadUrl,
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
		// runric section
		{
			url: `/api/gradingrubric/forsection/${id}/?format=json&active=true&future=false&expired=false`,
			handler: data => {
				let rubric = [];
				for (let item of data) {
					rubric.push({
						is_link: false,
						short_desc: strip_css_color(item.ShortDescription)
					});
					rubric.push({
						is_link: false,
						short_desc: strip_css_color(item.Description)
					});
				}
					fill_template("links_template", {
						items: rubric,
						title: "Grading Rubric",
					},
					"bulletin-sidebar", {
						noEscape: true
					});
			}
		},
		// bulletin board text endpoint
		{
			url: `/api/text/forsection/${id}/?format=json&contextLabelId=${contextlabelid}`,
			handler: data => {
				if (!data[0].Description) return;

				let forsection = { // what is a forsection?
					title: data[0].Description,
					desc: strip_css_color(data[0].LongText)
				}; // i have no idea

				fill_template("main-template", forsection, "top-bulletin-sections", {
					noEscape: true // there is no escape
				});
			}
		},
		// syllabus section
		{
			url: `/api/syllabus/forsection/${id}/?format=json&active=true&future=false&expired=false`,
			handler: data => syllabus_and_expectations("Syllabus", data)
		},
		// expectations section
		{
			url: `/api/expectation/forsection/${id}/?format=json&active=true&future=false&expired=false`,
			handler: data => syllabus_and_expectations("Expectations", data)
		},
		// announcements endpoint
		{
			url: `/api/announcement/forsection/${id}/?format=json&active=true&future=false&expired=false&contextLabelId=${contextlabelid}`,
			handler: data => {
				let announcements = [];
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
			url: `/api/news/forsection/${id}/?format=json&editMode=false&active=true&future=false&expired=false&contextLabelId=${contextlabelid}`,
			handler: data => {
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
			url: `/api/media/sectionmediaget/${id}/?format=json&contentId=31&editMode=false&active=true&future=false&expired=false&contextLabelId=${contextlabelid}`,
			handler: data => {
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
			.then(a => {
				if (!a.length) return;
				endpoint.handler(a);
			});
	}
	document.querySelector("#bulletin-sidebar").classList.remove("hidden");
}

async function fetch_roster(id) {
	let ftp_image_path = await get_image_path();
	console.log(ftp_image_path)

	let roster = await fetch(base_endpoint + user.baseurl + `/api/datadirect/sectionrosterget/${id}/?format=json`).then(a => a.json());
	let people = [];

	for (let person of roster) {
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
	let ftp_image_path = await get_image_path();

	let topics_raw = await fetch(base_endpoint + user.baseurl + `/api/datadirect/sectiontopicsget/${id}/?format=json&active=true&future=false&expired=false&sharedTopics=false`).then(a => a.json());
	let topics = [];
	for (let topic of topics_raw) {
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

async function fetch_assignments(id) {
	dayjs.extend(window.dayjs_plugin_relativeTime);
	dayjs.extend(window.dayjs_plugin_isTomorrow);
	let assignment_req = await fetch(base_endpoint + user.baseurl + "/api/DataDirect/AssignmentCenterAssignments/?format=json&filter=2&dateStart=1/1/1977&dateEnd=" + dayjs().format("MM/DD/YYYY") + "&persona=2&sectionList="+id);
	let assignments_json = await assignment_req.json();
	let assignments = process_assignments(assignments_json, false, true);

	fill_template("templates/assignment_template.hbs", {assignments}, "assignments", {
			noEscape: true // there is no escape.
		}, true);
}

async function try_login() {
	let loggedin = await logged_in();
	if (!loggedin) {
		location = "login.html?redirect=" + encodeURIComponent(location) + "&popup=" + encodeURIComponent("please log in and try again");
		return false;
	}
	return true
}

let queue_update = () => false;

function toggle_announcement(id) {
	let element = document.querySelector("#toggle_announcement-" + id);
	if (element.classList.contains("hidden")) return void element.classList.remove("hidden"), element.scrollIntoView();
	element.classList.add("hidden");
	element.parentElement.scrollIntoView();
}

window.addEventListener("DOMContentLoaded", init);
window.addEventListener("hashchange", init);
