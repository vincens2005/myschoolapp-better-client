let expanded_assignments = [];
let autolink_options = {target: "_blank", onclick: "event.stopPropagation();"};

function process_assignments(assignments_raw, sort_ascending, ignore_screenwidth) {
	user.default_description = user.default_description || "";
	let assignments_tmp = [];
	let screen_width = document.body.clientWidth;
	let max_title_len = ignore_screenwidth ? 1e9 : 25;
	if (screen_width <= 900) {
		max_title_len = -30.5507 + 0.1154 * screen_width; // don't worry about where these numbers came from
		max_title_len = Math.max(max_title_len, 5);
	}
	let parser = new DOMParser();
	for (let assign of assignments_raw) {
		// set user.default_description to something for testing capabilities
		assign.long_description = assign.long_description || user.default_description;
		assign.long_description = htmltotext(assign.long_description);
		assign.long_description = assign.long_description.autoLink(autolink_options);
		assign.text_title = htmltotext(assign.short_description);
		let long_title = parser.parseFromString(assign.short_description, "text/html");
		Array.from(long_title.querySelectorAll("a")).forEach(a => a.setAttribute("target", "_blank")); // make links open in new tabs
		long_title = long_title.body.innerHTML;
		
		// TODO: there is probably also a special page for assesments.
		let official_url = "";
		if (assign.discussion_ind) {
			official_url = user.baseurl + `/app/student#discussiondetail/${assign.assignment_id}/${assign.assignment_index_id}/Assignments`;
		}
		else {
			official_url = user.baseurl + `/app/student#assignmentdetail/${assign.assignment_id}/${assign.assignment_index_id}/0/assignmentdetail--${assign.assignment_id}--${assign.assignment_index_id}--0`;
		}
		
		let raw_due_date = dayjs(assign.date_due, "M/DD/YYYY").valueOf();

		assignments_tmp.push({
			short_class: assign.groupname.length > 21 ? assign.groupname.slice(0, 21) + "..." : assign.groupname,
			long_class: assign.groupname,
			assign_date: dayjs(assign.date_assigned, "M/DD/YYYY").fromNow(),
			due_date: raw_due_date - Date.now() <= 1000 * 60 * 60 * 24 * 3 ? dayjs(assign.date_due, "M/DD/YYYY").fromNow() : dayjs(assign.date_due, "M/DD/YYYY").format(user.date_format),
			raw_due_date,
			title: assign.text_title.length > max_title_len - 1 ? assign.text_title.slice(0, max_title_len) + "..." : assign.text_title,
			long_title,
			type: assign.assignment_type,
			desc: assign.long_description,
			id: assign.assignment_id,
			index_id: assign.assignment_index_id,
			is_special: assign.drop_box_ind || assign.discussion_ind || assign.assessment_ind || false,
			special_type: assign.drop_box_ind ? "submission" : (assign.discussion_ind ? "discussion" : (assign.assessment_ind ? "assessment" : "")),
			official_url,
			indicator: status_ind.to_readable(assign.assignment_status),
			user_task: assign.user_task_ind,
			section_id: assign.section_id || false
		});
	}

	// sort by due date ascending
	assignments_tmp = assignments_tmp.sort((a,b) => {
		let dates = [a.raw_due_date, b.raw_due_date];
		if (dates[0] > dates[1]) return sort_ascending ? 1 : -1;
		if (dates[1] > dates[0]) return sort_ascending ? -1 : 1;
		return 0;
	});

	return assignments_tmp;
}


let status_ind = {
	indicators: { // css class .indicator- + indicator
		"4": "good",
		"1": "good",
		"0": "okay",
		"-1": "todo",
		"2": "bad"
	},

	text_indicators: { // the actual text to display
		"4": "done",
		"1": "done",
		"0": "in progress",
		"-1": "to do",
		"2": "overdue"
	},

	to_readable: function(ind) {
		ind = String(ind);
		return {
			class: this.indicators[ind] || "blank",
			text: this.text_indicators[ind] || "unknown (oo spooky)"
		};
	},

	to_number: function(ind) {
		ind = String(ind);
		for (let i in this.indicators) {
			if (this.indicators[i] == ind) {
				return i;
			}
		}
		for (let i in this.text_indicators) {
			if (this.text_indicators[i] == ind) {
				return i;
			}
		}
	}
};

async function toggle_expand(assign_id) {
	if (!assign_id) return;
	
	lastfocused_assign = assign_id; // for keymap
	
	var is_user_task = document.querySelector("#assignment-"+ assign_id).getAttribute("data-user-task") == "true";
	
	var hidden_when_expanded = ["assign-title", "short-class"];
	var shown_when_expanded = ["long-header", "desc", "edit-div"];
	
	let assignment_index = expanded_assignments.findIndex(a => a.assign_id == assign_id);
	
	if (document.querySelector("#assignment-" + assign_id).getAttribute("data-expanded") != "true") {
		// expand the assignment
		// disable onclick event (now it's just in the long-header)
		document.querySelector("#assignment-" + assign_id).setAttribute("onclick", "");
		
		for (let id of hidden_when_expanded) {
			document.querySelector("#" + id + "-" + assign_id).classList.add("hidden");
		}
		for (let id of shown_when_expanded) {
			document.querySelector("#" + id + "-" + assign_id).classList.remove("hidden");
		}
		document.querySelector("#assignment-" + assign_id).classList.add("flex-wrap");
		document.querySelector("#assignment-" + assign_id).setAttribute("data-expanded", "true");
		
		var endpoint_url = base_endpoint + user.baseurl + "/api/assignment2/read/" + assign_id + "/?format=json";
		
		if (is_user_task && user.debug_mode) {
			// if it's a user task and debug mode is enabled, fetch the test assignment
			endpoint_url = "test_data/test_assignment.json";
		}
		
		if (assignment_index >= 0) {
			expanded_assignments[assignment_index].currently_expanded = true;
			
			document.querySelector("#desc-" + assign_id).innerHTML = "";
			fill_template("templates/assignment_expanded.hbs", expanded_assignments[assignment_index], "desc-" + assign_id,{
				noEscape: true // do not escape html
			}, true);
			return;
		}
		
		var assignment_data = {
			assign_id,
			currently_expanded: true,
			description: "",
			links: [],
			downloads: []
		}
		
		if (!is_user_task || user.debug_mode) {
			var response = await fetch(endpoint_url).then(a => a.json());
			if (response.Error) {
				let loggedin = await try_login();
				if (loggedin) {
					response = await fetch(endpoint_url).then(a => a.json()); // do it again
				}
				else {
					location = "login.html?popup=" + encodeURIComponent("this shouldn't happen, but please log in and try again") + "&redirect=" + encodeURIComponent(location);
					return;
				}
			}
			assignment_data = {
				assign_id,
				currently_expanded: true,
				description: response.LongDescription.autoLink(autolink_options),
				links: [],
				downloads: []
			}
			
			let parser = new DOMParser();
			let desc_html = parser.parseFromString(assignment_data.description, "text/html");
			Array.from(desc_html.querySelectorAll("a")).forEach(a => a.setAttribute("target", "_blank"));
			assignment_data.description = desc_html.body.innerHTML;
			
			for (let link of response.LinkItems) {
				assignment_data.links.push({
					url: link.Url,
					title: link.ShortDescription
				});
			}
			
			for(let dl of response.DownloadItems) {
				assignment_data.downloads.push({
					url: download_endpoint + user.baseurl + dl.DownloadUrl,
					title: dl.ShortDescription,
					filename: dl.FriendlyFileName
				});
			}
		}
		
		expanded_assignments.push(assignment_data);
		
		document.querySelector("#desc-" + assign_id).innerHTML = "";
		fill_template("templates/assignment_expanded.hbs", assignment_data, "desc-" + assign_id,{
			noEscape: true // do not escape html
		}, true);
		
		return;
	}
	
	// un-expand assignment
	for (let id of hidden_when_expanded) {
		document.querySelector("#" + id + "-" + assign_id).classList.remove("hidden");
	}
	for (let id of shown_when_expanded) {
		document.querySelector("#" + id + "-" + assign_id).classList.add("hidden");
	}
	document.querySelector("#assignment-" + assign_id).classList.remove("flex-wrap")
	document.querySelector("#assignment-" + assign_id).setAttribute("data-expanded", "false");
	// add onclick attribute back
	setTimeout(() => {
		document.querySelector("#assignment-" + assign_id).setAttribute("onclick", "toggle_expand('" + assign_id + "')");
	}, 50); // this is given a timeout because otherwise the click event will be triggered instantly
	expanded_assignments[assignment_index].currently_expanded = false;
}
