async function init() {
	user = await get_user();

	// check if user is logged in
	var loggedin = await logged_in();
	if (!loggedin) {
		location = "login.html?redirect=" + encodeURIComponent(location);
		return;
	}
	
	var url = new URL(location);
	var topic_id = url.searchParams.get("topic");
	if (!topic_id) {
		location = user.last_page;
		return;
	}
	
	user.last_page = location;
	save_data(user);
	
	get_header();
	
	setup_handlebars_helper();
	
	var topic_info = await fetch(base_endpoint + user.baseurl + "/api/datadirect/topicget/"+ topic_id +"/?format=json").then(a => a.json());
	document.title = topic_info[0].Name + " - portal++";
	fill_template("info_template", topic_info[0], "title_stuff");
	
	var topic_endpoint = `/api/datadirect/topiccontentget/${topic_id}/?format=json&index_id=${topic_info[0].TopicIndexId}&id=${topic_info[0].TopicId}`
	var topic_raw = await fetch(base_endpoint + user.baseurl + topic_endpoint).then(a => a.json());
	var topic_items_tmp = [];
	
	for (let item of topic_raw) {
		if (item.ShortDescription || item.LongDescription) {
			topic_items_tmp.push({
				title: item.ShortDescription || "",
				description: item.LongDescription || "",
				url: item.Url,
				download: item.AllowDownload
			});
		}
	}
	
	var combined_items = [];
	var topic_items = [];
	
	for (let item of topic_items_tmp) {
		if ((item.description + item.title).length <= 100) {
			combined_items.push(item); // combine short items into one column
			continue;
		}
		topic_items.push(item);
	}
	
	var combine_len = 4; // max number of items in combined column
	for (let i = 0; i < combined_items.length; i += (combined_items.length >= combine_len ? combine_len + 1 : combined_items.length)) {
		topic_items.push({
			is_parent: true,
			children: combined_items.slice(i, i + combine_len)
		});
	}
	
	fill_template("topic_template", {topic_items}, "topic_items", {
		noEscape: true
	});
}

function setup_handlebars_helper() {
	Handlebars.registerHelper("def", (options) => {
		Handlebars.registerPartial(options.hash.name, options.fn());
		return;
	});
}
