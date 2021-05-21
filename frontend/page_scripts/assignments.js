// TODO: for full assign details fetch /api/assignment2/read/ASSIGN_ID/?format=json

async function init() {
	var url = new URL(location);
	var assign_date = url.searchParams.get("date");
	assign_date = safe_decode(assign_date);
	
	user = await get_user();
	user.last_page = "assignments.html";
	save_data(user);
	
	// check if user is logged in
	var loggedin = await logged_in();
	if (!loggedin) {
		location = "login.html";
		return;
	}
	
	get_header();
	
	var date_to_send = dayjs().format("MM/DD/YYYY");
	if (assign_date) {
		var possible_date = dayjs(assign_date, "MM/DD/YYYY");
		if (possible_date.isValid()) {
			date_to_send = possible_date.format("MM/DD/YYYY");
		}
	}
	// send the request
	// TODO: figure out what the `persona` param does
	var assignment_req = await fetch(base_endpoint + user.baseurl + "/api/DataDirect/AssignmentCenterAssignments/?format=json&filter=2&dateStart=" + date_to_send + "&dateEnd=" + date_to_send + "&persona=2");

	// TODO: validate response
	var assignments_json = await assignment_req.json();
	fill_in_assignments(assignments_json);
}

function fill_in_assignments(assignments_raw) {
	var assignments = [];
	for (var assign of assignments_raw) {
		assignments.push({
			class: assign.groupname,
			assign_date: assign.date_assigned,
			due_date: assign.date_due,
			title: assign.short_description,
			type: assign.assignment_type,
			desc: assign.long_description,
			id: assign.assignment_id,
			indicator: status_to_readable(assign.assignment_status)
		});
	}
	
	document.querySelector("#assignments").innerHTML = "";
	fill_template("assignment_template", {assignments}, "assignments", {
		noEscape: true // there is no escape.
	});
}

function status_to_readable(ind) {
	ind = String(ind);
	
	var indicators = { // css class .indicator- + indicator
		"4": "good",
		"0": "okay",
		"-1": "todo",
		"2": "bad"
	}
	
	var text_indicators = { // the actual text to display
		"4": "completed",
		"0": "in progress",
		"-1": "todo",
		"2": "overdue"
	}
	
	return {
		class: indicators[ind] || "blank",
		text: text_indicators[ind] || "unknown (oo spooky)"
	};
}
