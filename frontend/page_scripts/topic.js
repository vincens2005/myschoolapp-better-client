async function init() {
	user = await get_user();

	// check if user is logged in
	let loggedin = await logged_in();
	if (!loggedin) {
		location = "login.html?redirect=" + encodeURIComponent(location);
		return;
	}

	let url = new URL(location);
	let topic_id = url.searchParams.get("topic");
	if (!topic_id) {
		location = user.last_page;
		return;
	}

	user.last_page = location.toString();
	save_data(user);

	get_header();

	setup_handlebars_helper();

	let topic_info = await fetch(base_endpoint + user.baseurl + "/api/datadirect/topicget/"+ topic_id +"/?format=json").then(a => a.json());
	document.title = topic_info[0].Name + " - portal++";
	fill_template("info_template", topic_info[0], "title_stuff");

	let topic_endpoint = `/api/datadirect/topiccontentget/${topic_id}/?format=json&index_id=${topic_info[0].TopicIndexId}&id=${topic_info[0].TopicId}`
	let topic_raw = await fetch(base_endpoint + user.baseurl + topic_endpoint).then(a => a.json());
	let topic_items_tmp = [];

	for (let item of topic_raw) {
		if (item.ShortDescription || item.LongDescription) {
			let full_len = (item.LongDescription || "" + item.ShortDescription || "").length
			topic_items_tmp.push({
				title: item.ShortDescription,
				description: item.LongDescription,
				url: item.FileName ? (item.FileName ? base_endpoint + user.baseurl + item.FilePath + item.FileName : "") : item.Url,
				download: !!item.FileName,
				filename: item.FriendlyFileName || item.FileName,
				size: full_len >= 100 ? Math.min(Math.round(full_len / 120), 4) : 1 // magic algorithm
			});
		}
	}

	let topic_items = [];
	let current_chunk = {
		len: 0,
		items: []
	}

	let clear_chunk = () => {
		if (current_chunk.items.length > 1) {
			topic_items.push({
				is_parent: true,
				children: current_chunk.items
			});
		}
		else {
			topic_items.push(current_chunk.items[0]);
		}
		current_chunk.len = 0;
		current_chunk.items = [];
	}

	for (let item of topic_items_tmp) {
		if (current_chunk.len + item.size > 4) {
			clear_chunk();
		}
		current_chunk.items.push(item);
		current_chunk.len += item.size;
	}

	clear_chunk();

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

window.addEventListener("DOMContentLoaded", init);
