let drake_started = false;
let current_view_date;
let lastfocused_assign = null;
let assignment_queue = [];
let user_id = null;
async function init() {
	// reset element transitions
	document.querySelector("#noassignments").classList.add("ohidden");
	setTimeout(() => {
		document.querySelector("#noassignments").classList.add("hidden");
	}, 300);

	dayjs.extend(window.dayjs_plugin_relativeTime);
	let url = new URL(location);
	let assign_date = url.searchParams.get("date");
	assign_date = safe_decode(assign_date);

	let start_date = safe_decode(url.searchParams.get("start"));
	let end_date = safe_decode(url.searchParams.get("end"));

	user = await get_user();
	user.last_page = location.toString();
	save_data(user);

	// check if user is logged in
	let loggedin = await logged_in();
	if (!loggedin) {
		location = "login.html?redirect=" + encodeURIComponent(location);
		return;
	}

	get_header();

	let date_today = dayjs();
	let date_to_send = {
		start: date_today,
		end: date_today
	};

	if (assign_date) {
		let possible_date = dayjs(assign_date, "MM/DD/YYYY");
		if (possible_date.isValid()) {
			let tmp_send = possible_date;
			date_to_send.start = tmp_send;
			date_to_send.end = tmp_send;
			if (possible_date.isSame(date_today, "day")) {
				url.searchParams.delete("date");
				history.pushState({}, "", url);
			}
		}
	}

	if (start_date && end_date) {
		let tmp_send = {
			start: dayjs(start_date, "MM/DD/YYYY"),
			end: dayjs(end_date, "MM/DD/YYYY")
		}
		if (tmp_send.start.isValid() && tmp_send.end.isValid()) {
			date_to_send.start = tmp_send.start;
			date_to_send.end = tmp_send.end;
		}
	}

	current_view_date = "";
	current_view_date = date_to_send.start.isSame(date_to_send.end, "day") ? date_to_send.start.format(user.date_format) : date_to_send.start.format(user.date_format) + " - " + date_to_send.end.format(user.date_format);
	document.querySelector("#date").innerHTML = "assignments for " + current_view_date;

	// send the request
	let assignment_req = await fetch(base_endpoint + user.baseurl + "/api/DataDirect/AssignmentCenterAssignments/?format=json&filter=2&dateStart=" + date_to_send.start.format("MM/DD/YYYY") + "&dateEnd=" + date_to_send.end.format("MM/DD/YYYY") + "&persona=2");
	let assignments_json = await assignment_req.json();

	if (!assignments_json.length) {
		document.querySelector("#noassignments").classList.remove("hidden");
		document.querySelector("#assignment_container").classList.add("ohidden");
		setTimeout(() => {
			document.querySelector("#noassignments").classList.remove("ohidden");
		}, 50);
		return;
	}

	let assignments_tmp = process_assignments(assignments_json, true); // this is in utilies/assignments.js

	let assignments = {
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

	if(!templates["templates/assignment_template.hbs"]) templates["templates/assignment_template.hbs"] = await fetch("templates/assignment_template.hbs").then(a => a.text());
	for (let i in assignments) {
		fill_template("templates/assignment_template.hbs", {
			assignments: assignments[i]
		}, i, {
			noEscape: true // there is no escape.
		}, true);
	}

	for (let assignment of expanded_assignments) {
		if (assignment.currently_expanded) toggle_expand(assignment.assign_id);
	}

	document.querySelector("#assignment_container").classList.remove("ohidden");

	// enable drag and drop and initialize keymap
	if (!drake_started) {
		dnd_init();
		setup_keymaster();
	}
}


function dnd_init() {
	drake_started = true;
	var containers = [document.querySelector("#todo"), document.querySelector("#progress"), document.querySelector("#done")];
	var options = {
		moves: (el, source, handle, sibling) => {
			if (document.body.clientWidth < 900) return false;
			if (key.isPressed("ctrl") || key.isPressed("alt") || key.isPressed("command")) return true;
			if (handle.tagName == "P") return false;
			let parent = handle.parentNode;
			while (parent.parentNode != document) {
				if (parent.tagName == "P") return false;
				if (parent == el) return true;

				parent = parent.parentNode;
			}
			return (handle == el ||
				handle.parentElement.classList.contains("long_header"));
		}
	}
	let drake = dragula(containers, options);

	drake.on("drop", async (el, target, source, sibling) => {
		if (!target) return;
		var assign_id = el.getAttribute("data-assign-id");
		var index_id = el.getAttribute("data-index-id");
		var to_status = target.id == "progress" ? "in progress" : target.id;
		to_status = to_status == "done" ? "done" : to_status;
		to_status = status_ind.to_number(to_status);
		var user_task = el.getAttribute("data-user-task") == "true";

		set_status(index_id, assign_id, user_task, to_status);

		var indicator = document.querySelector("#assignment-ind-" + assign_id);
		var new_status = status_ind.to_readable(to_status);
		indicator.classList.remove(...indicator.classList);
		indicator.classList.add("round-indicator", "indicator-" + new_status.class);
		indicator.innerHTML = new_status.text;
	});
}

/** this function handles keyboard shortcuts and stuff **/
function setup_keymaster() {
	let keymap = [
		{
			key: "esc",
			scope: "default",
			action: () => {
				toggle_expand(lastfocused_assign);
			}
		},
		{
			key: "esc",
			scope: "edittask",
			action: () => {
				hide_add_popup(lastfocused_assign);
			}
		},
		{
			key: "enter",
			scope: "edittask",
			action: () => {
				save_assignment(user_id, lastfocused_assign);
			}
		},
		{
			key: "shift+a",
			scope: "default",
			action: () => {
				show_add_popup();
			}
		}
	];
	for (let action of keymap) {
		key(action.key, action.scope, action.action);
	}
	key.setScope("default");
	key.filter = () => true; // allow keypresses on inputs
}

function fake_addinput(editing) {
	// fill in add template to make page appear snappier
	let template_data = {
		classes: [],
		fakedata: true,
		editing,
		user_id: "",
		assign_id: "",
		assign_date: dayjs().format("YYYY-MM-DD"),
		due_date: dayjs().add(1, "d").format("YYYY-MM-DD")
	}
	document.querySelector("#add_task").innerHTML = "";
	fill_template("usertaskadd_template", template_data, "add_task");
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

function queue_update(index_id, assign_id, user_task, event) {
	event.stopPropagation(); // prevent from bubbling
	let test_function = a => (!!a && a.assign_id == assign_id);
	if (assignment_queue.find(test_function)) {
		let i = assignment_queue.findIndex(test_function);
		clearTimeout(assignment_queue[i].timeout);
		delete assignment_queue[i];
	}

	let indicator = document.querySelector("#assignment-ind-" + assign_id);
	let ind_text = indicator.innerText.toLowerCase();
	let statuses = ["to do", "in progress", "done"];
	// cycle status
	let new_status_index = statuses.findIndex(a => a == ind_text) + 1;
	new_status_index = new_status_index < statuses.length ? new_status_index : 0;
	ind_text = statuses[new_status_index];

	let to_status = status_ind.to_number(ind_text);

	let timeout = setTimeout(() => {
		set_status(index_id, assign_id, user_task, to_status);
	}, 500);

	assignment_queue.push({timeout, assign_id});

	// update css class
	let new_status = status_ind.to_readable(to_status);
	indicator.classList.remove(...indicator.classList);
	indicator.classList.add("round-indicator", "indicator-" + new_status.class);
	indicator.innerHTML = new_status.text;
}


/** sets the status of an assignment
	* @param {String} index_id - the index id of the assignment
	* @param {String} to_status - the status to which the assignment will be set
	*/
async function set_status(index_id, assign_id, user_task, to_status) {
	lastfocused_assign = assign_id;
	let send_id = index_id || assign_id; // fallback to assignment id if index id is null
	fetch_url = base_endpoint + user.baseurl + `/api/assignment2/assignmentstatusupdate/?format=json&assgnmentIndexId=${send_id}&assignmentStatus=${to_status}`;
	let response = await fetch(fetch_url, {
		method: "POST",
		body: JSON.stringify({
			assignmentIndexId: send_id,
			assignmentStatus: to_status,
			userTaskInd: user_task // this tells it whether it was created by the user
		}),
		headers: {
			"content-type": "application/json",
			"RequestVerificationToken": user.token
		}
	}).then(a => a.json());
	if (response.Error) {
		let loggedin = await try_login();
		if (loggedin) return set_status(index_id, assign_id, user_task, to_status);
		location = "login.html?popup=" + encodeURIComponent("please log in and try again") + "&redirect=" + encodeURIComponent(location);
		return;
	}
	init();
}


async function save_assignment(user_id, assign_id, second_try) {
	document.querySelector("#add_button").classList.remove("greyedout");
	document.querySelector("#save_assign").classList.add("greyedout");
	document.querySelector("#save_assign").value = "loading...";

	var fetch_url = base_endpoint + user.baseurl + "/api/usertask/edit" + (assign_id ? "/" + assign_id : "");

	var body = {
		AssignedDate: dayjs(document.querySelector("#add_assign_date").value, "YYYY-MM-DD").format("MM/DD/YYYY"),
		DueDate: dayjs(document.querySelector("#add_due_date").value, "YYYY-MM-DD").format("MM/DD/YYYY"),
		ShortDescription: document.querySelector("#add_task_name").value,
		UserId: user_id
	}

	if (assign_id) body.UserTaskId = assign_id;
	if (document.querySelector("#add_classname").value != "null") body.SectionId = Number(document.querySelector("#add_classname").value);

	var response = await fetch(fetch_url, {
		method: assign_id ? "PUT" : "POST",
		body: JSON.stringify(body),
		headers: {
			"Content-Type": "application/json",
			"RequestVerificationToken": user.token
		}
	}).then(a => a.json());

	hide_add_popup();

	if (response.Error) {
		if (second_try) location = "login.html?popup=" + encodeURIComponent("this is a huge error that you should never see") + "&redirect=" + encodeURIComponent(location); return;
		let loggedin = await try_login();
		if (loggedin) return save_assignment(user_id, assign_id, true);
		location = "login.html?popup=" + encodeURIComponent("please log in and try again") + "&redirect=" + encodeURIComponent(location);
		return;
	}

	init();
}

async function show_add_popup(assign_id) {
	var editing = !!assign_id;

	fake_addinput(editing);
	if (editing) {
		lastfocused_assign = assign_id;
		document.querySelector("#edit-button-" + assign_id).innerHTML = "loading...";
		document.querySelector("#edit-button-" + assign_id).classList.add("greyedout");
	}

	document.querySelector("#add_button").classList.add("greyedout");
	document.querySelector("#add_task").classList.remove("hidden");
	setTimeout(() => {
		document.querySelector("#add_task").classList.remove("ohidden");
	}, 50);
	key.setScope("edittask");

	// check if user is logged in
	var loggedin = await try_login();
	if (!loggedin) {
		location = "login.html?redirect=" + encodeURIComponent(location);
		return;
	}

	var context_endpoint_url = "/api/webapp/context";
	var context = await fetch(base_endpoint + user.baseurl + context_endpoint_url).then(a => a.json());

	user_id = context.UserInfo.UserId;
	var classes = [];

	for (var group of context.Groups) {
		if (!group.PublishGroupToUser || !group.CurrentEnrollment /* this only shows you your current classes */) continue;

		classes.push({
			id: group.SectionId,
			name: group.GroupName.slice(0, 20)
		});
	}

	var template_data = {
		classes,
		editing,
		user_id,
		assign_id,
		assign_date: dayjs().format("YYYY-MM-DD"),
		due_date: dayjs().add(1, "d").format("YYYY-MM-DD") // default due date is +1 days
	}

	if (editing) {
		var edit_endpoint_url = "/api/usertask/edit/" + assign_id;
		var assignment_data = await fetch(base_endpoint + user.baseurl + edit_endpoint_url).then(a => a.json());
		template_data.assign_name = assignment_data.ShortDescription;
		template_data.due_date = dayjs(assignment_data.DueDate, "M/DD/YYYY").format("YYYY-MM-DD");
		template_data.assign_date = dayjs(assignment_data.AssignedDate, "M/DD/YYYY").format("YYYY-MM-DD");
		template_data.class_id = assignment_data.SectionId;
		document.querySelector("#edit-button-" + assign_id).innerHTML = "edit";
		document.querySelector("#edit-button-" + assign_id).classList.remove("greyedout");
	}

	document.querySelector("#add_task").innerHTML = "";
	fill_template("usertaskadd_template", template_data, "add_task");
	customselect.init();
	document.querySelector("#add_task_name").focus();

	if (editing && template_data.classid) document.querySelector("#edit-option-" + template_data.class_id).setAttribute("selected", "true");
}

async function delete_assignment(assign_id, user_id) {
	expanded_assignments.splice(expanded_assignments.findIndex(a => a.assign_id == assign_id), 1);
	lastfocused_assign = null;
	document.querySelector("#add_due_date").value = "1970-01-01";
	document.querySelector("#add_assign_date").value = "1970-01-01";
	save_assignment(user_id, assign_id)
}

function hide_add_popup(assign_id) {
	document.querySelector("#add_button").classList.remove("greyedout");
	document.querySelector("#add_task").classList.add("ohidden");
	document.querySelector("#add_task_name").blur();
	setTimeout(() => {
		document.querySelector("#add_task").classList.add("hidden");
	}, 400);
	key.setScope("default");
	// if there's no edit button then return
	if (!document.querySelector("#edit-button-" + assign_id)) return;

	// make edit button go back to normal
	document.querySelector("#edit-button-" + assign_id).innerHTML = "edit";
	document.querySelector("#edit-button-" + assign_id).classList.remove("greyedout");
}

async function try_login() {
	let old_scope = key.getScope();
	key.setScope("loginform");
	let loggedin = await logged_in();
	if (loggedin) return key.setScope(old_scope), loggedin;

	document.querySelector("#loginform").classList.remove("hidden");
	setTimeout(() => {
		document.querySelector("#loginform").classList.remove("ohidden");
		document.querySelector("#password").focus();
	}, 50);

	return new Promise(async (resolve, reject) => {
		// the function to be given to the log in form's onsubmit
		let onsub_func = async (e) => {
			e.preventDefault();

			let password = document.querySelector("#password").value;
			if (!password) return false;

			document.querySelector("#loginbutton").classList.add("greyedout");
			document.querySelector("#loginbutton").value = "loading...";

			let success = await login(user.username, password);


			resolve(success); // resolve the promise

			document.querySelector("#password").blur();
			document.querySelector("#loginform").classList.add("ohidden");
			setTimeout(() => {
				document.querySelector("#loginform").classList.add("hidden");
				document.querySelector("#loginbutton").classList.remove("greyedout");
				document.querySelector("#loginbutton").value = "log in";
			}, 400);
			key.setScope(old_scope);
		}
		document.querySelector("#actual_form").onsubmit = onsub_func;
	});
}

window.addEventListener("DOMContentLoaded", init);
