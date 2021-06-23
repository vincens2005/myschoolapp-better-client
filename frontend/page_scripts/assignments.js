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
		location = "login.html?redirect=" + encodeURIComponent(location);
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
	var assignments_tmp = [];
	for (var assign of assignments_raw) {
		assignments_tmp.push({
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
	
	if (!assignments_tmp.length) {
    // TODO: tell the user
    return;
	}
	
	var assignments = {
		todo: [],
		progress: [],
		done: []
	};
	for (var assign of assignments_tmp) {
		if (assign.indicator.class == "good") {
			assignments.done.push(assign);
			continue;
		}
		
		else if (assign.indicator.class == "okay") {
			assignments.progress.push(assign);
			continue;
		}
		
		else {
			assignments.todo.push(assign);
			continue;
		}
	}
	
	document.querySelector("#todo").innerHTML = "";
	document.querySelector("#progress").innerHTML = "";
	document.querySelector("#done").innerHTML = "";
	
	
	for (var i in assignments) {
		fill_template("assignment_template", {assignments: assignments[i]}, i, {
			noEscape: true // there is no escape.
		});
	}
	
	// enable drag and drop
	dnd_init();
}

function status_to_readable(ind) {
	ind = String(ind);
	
	var indicators = { // css class .indicator- + indicator
		"4": "good",
		"1": "good",
		"0": "okay",
		"-1": "todo",
		"2": "bad"
	}
	
	var text_indicators = { // the actual text to display
		"4": "completed",
		"1": "completed",
		"0": "in progress",
		"-1": "todo",
		"2": "overdue"
	}
	
	return {
		class: indicators[ind] || "blank",
		text: text_indicators[ind] || "unknown (oo spooky)"
	};
}

function dnd_init() {
  var containers = [document.querySelector("#todo"), document.querySelector("#progress"), document.querySelector("#done")];
  var drake = dragula(containers);
}
