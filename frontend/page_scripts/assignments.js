// TODO: for full assign details fetch /api/assignment2/read/ASSIGN_ID/?format=json

var drake_started = false;
var current_view_date;
async function init() {
	var url = new URL(location);
	var assign_date = url.searchParams.get("date");
	assign_date = safe_decode(assign_date);

	var start_date = safe_decode(url.searchParams.get("start"));
	var end_date = safe_decode(url.searchParams.get("end"));

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

	var date_today = dayjs().format("MM/DD/YYYY");
	var date_to_send = {
		start: date_today,
		end: date_today
	};

	if (assign_date) {
		var possible_date = dayjs(assign_date, "MM/DD/YYYY");
		if (possible_date.isValid()) {
			let tmp_send = possible_date.format("MM/DD/YYYY");
			date_to_send.start = tmp_send;
			date_to_send.end = tmp_send;
		}
	}

	if (start_date && end_date) {
		let tmp_send = {
			start: dayjs(start_date, "MM/DD/YYYY"),
			end: dayjs(end_date, "MM/DD/YYYY")
		}
		if (tmp_send.start.isValid() && tmp_send.end.isValid()) {
			date_to_send.start = tmp_send.start.format("MM/DD/YYYY");
			date_to_send.end = tmp_send.end.format("MM/DD/YYYY");
		}
	}

	current_view_date = "";
	current_view_date = date_to_send.start == date_to_send.end ? date_to_send.start : date_to_send.start + " - " + date_to_send.end;
	document.querySelector("#date").innerHTML = "assignments for " + current_view_date;

	// send the request
	// TODO: figure out what the `persona` param does
	var assignment_req = await fetch(base_endpoint + user.baseurl + "/api/DataDirect/AssignmentCenterAssignments/?format=json&filter=2&dateStart=" + date_to_send.start + "&dateEnd=" + date_to_send.end + "&persona=2");

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
			index_id: assign.assignment_index_id,
			indicator: status_ind.to_readable(assign.assignment_status),
			user_task: String(assign.user_task_ind)
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
	for (let assign of assignments_tmp) {
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
		fill_template("assignment_template", {
			assignments: assignments[i]
		}, i, {
			noEscape: true // there is no escape.
		});
	}

	// enable drag and drop
	if (!drake_started) {
		dnd_init();
	}
}

var status_ind = {
	indicators: { // css class .indicator- + indicator
		"4": "good",
		"1": "good",
		"0": "okay",
		"-1": "todo",
		"2": "bad"
	},

	text_indicators: { // the actual text to display
		"4": "completed",
		"1": "completed",
		"0": "in progress",
		"-1": "todo",
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

function dnd_init() {
	drake_started = true;
	var containers = [document.querySelector("#todo"), document.querySelector("#progress"), document.querySelector("#done")];
	var drake = dragula(containers);

	drake.on("drop", async (el, target, source, sibling) => {
		if (!target) return;
		var assign_id = el.getAttribute("data-assign-id");
		var index_id = el.getAttribute("data-index-id");
		var to_status = target.id == "progress" ? "in progress" : target.id;
		to_status = to_status == "done" ? "completed" : to_status;
		to_status = status_ind.to_number(to_status);
		var user_task = el.getAttribute("data-user-task") == "true";
		
		console.log(user_task)
		console.log(assign_id)
		console.log(to_status);
		
		set_status(index_id, assign_id, user_task, to_status);
		
		var indicator = document.querySelector("#assignment-ind-" + assign_id);
		indicator.classList.remove(...indicator.classList);
		indicator.classList.add("round-indicator", "indicator-blank");
		indicator.innerHTML = target.id;
	});
}

/** changes the current view date
	* @param {Number} fac - factor in days to change the date by
	*/
function change_date(fac) {
	var tmp_view_date = dayjs(current_view_date, "MM/DD/YYYY");
	tmp_view_date = tmp_view_date.set("date", tmp_view_date.get("date") + fac);
	var formatted_date = tmp_view_date.format("MM/DD/YYYY");
	history.pushState({}, "", "?date=" + formatted_date);
	init();
}

/** sets the status of an assignment
	* @param {String} index_id - the index id of the assignment
	* @param {String} to_status - the status to which the assignment will be set
	*/
async function set_status(index_id, assign_id, user_task, to_status) {
	var send_id = index_id || assign_id; // fallback to assignment id if index id is null
	fetch_url = base_endpoint + user.baseurl + `/api/assignment2/assignmentstatusupdate/?format=json&assgnmentIndexId=${send_id}&assignmentStatus=${to_status}`;
	var response = await fetch(fetch_url, {
		method: "POST",
		body: JSON.stringify({
			assignmentIndexId: send_id,
			assignmentStatus: to_status,
			userTaskInd: user_task // this tells it whether it was created by the user
		})
	}).then(a => a.json());

	if (response.Error) {
		location = "login.html?popup=" + encodeURIComponent("please log in and try again") + "&redirect=" + encodeURIComponent(location);
		return;
	}
	init();
}
