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
	
	var topic_info = await fetch(base_endpoint + user.baseurl + "/api/datadirect/topicget/"+ topic_id +"/?format=json").then(a => a.json());
	document.title = topic_info[0].Name + " - portal++";
	fill_template("info_template", topic_info[0], "output");
	
	var topic_endpoint = `/api/datadirect/topiccontentget/${topic_id}/?format=json&index_id=${topic_info[0].TopicIndexId}&id=${topic_info[0].TopicId}`
	var topic_raw = await fetch(base_endpoint + user.baseurl + topic_endpoint).then(a => a.json());
	var topic_items = [];
	
	for (let item of topic_raw) {
		topic_items.push({
			title: item.ShortDescription || "",
			description: item.LongDescription || "",
			url: item.Url,
			download: item.AllowDownload
		});
	}
	
	console.log(topic_items);
}
