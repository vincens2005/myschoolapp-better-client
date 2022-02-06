var assignment_queue = [];
var drake_started = false;
var current_view_date;
var autolink_options = {target: "_blank", onclick: "event.stopPropagation();"};
var expanded_assignments = [];
var lastfocused_assign = null;
var user_id = null;
async function init() {
	// reset element transitions
	document.querySelector("#noassignments").classList.add("ohidden");
	setTimeout(() => {
		document.querySelector("#noassignments").classList.add("hidden");
	}, 300);
	
	dayjs.extend(window.dayjs_plugin_relativeTime);
	var url = new URL(location);
	var assign_date = url.searchParams.get("date");
	assign_date = safe_decode(assign_date);

	var start_date = safe_decode(url.searchParams.get("start"));
	var end_date = safe_decode(url.searchParams.get("end"));

	user = await get_user();
	user.last_page = location.toString();
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
			if (possible_date.isSame(date_today)) {
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
			date_to_send.start = tmp_send.start.format("MM/DD/YYYY");
			date_to_send.end = tmp_send.end.format("MM/DD/YYYY");
		}
	}

	current_view_date = "";
	current_view_date = date_to_send.start == date_to_send.end ? date_to_send.start : date_to_send.start + " - " + date_to_send.end;
	document.querySelector("#date").innerHTML = "assignments for " + current_view_date;

	// send the request
	var assignment_req = await fetch(base_endpoint + user.baseurl + "/api/DataDirect/AssignmentCenterAssignments/?format=json&filter=2&dateStart=" + date_to_send.start + "&dateEnd=" + date_to_send.end + "&persona=2");
	var assignments_json = await assignment_req.json();
	
	if (!assignments_json.length) {
		document.querySelector("#noassignments").classList.remove("hidden");
		document.querySelector("#assignment_container").classList.add("ohidden");
		setTimeout(() => {
			document.querySelector("#noassignments").classList.remove("ohidden");
		}, 50);
		return;
	}
	fill_in_assignments(assignments_json);
	
	// enable drag and drop and initialize keymap
	if (!drake_started) {
		dnd_init();
		setup_keymaster();
	}
}

function fill_in_assignments(assignments_raw) {
	user.default_description = user.default_description || "";
	var assignments_tmp = [];
	var screen_width = document.body.clientWidth;
	var max_title_len = 25;
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
		let long_title = parser.parseFromString(assign.short_description, "text/html").body.innerHTML; // make sure HTML isn't broken
		
		// TODO: there is probably also a special page for assesments.
		let official_url = "";
		if (assign.discussion_ind) {
			official_url = user.baseurl + `/app/student#discussiondetail/${assign.assignment_id}/${assign.assignment_index_id}/Assignments`;
		}
		else {
			official_url = user.baseurl + `/app/student#assignmentdetail/${assign.assignment_id}/${assign.assignment_index_id}/0/assignmentdetail--${assign.assignment_id}--${assign.assignment_index_id}--0`;
		}
		
		assignments_tmp.push({
			short_class: assign.groupname.length > 21 ? assign.groupname.slice(0, 21) + "..." : assign.groupname,
			long_class: assign.groupname,
			assign_date: dayjs(assign.date_assigned, "M/DD/YYYY").fromNow(),
			due_date: dayjs(assign.date_due, "M/DD/YYYY").fromNow(),
			raw_due_date: dayjs(assign.date_due, "M/DD/YYYY").unix(),
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
		if (dates[0] > dates[1]) return 1;
		if (dates[1] > dates[0]) return -1;
		return 0;
	});

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
	
	for (var assignment of expanded_assignments) {
		if (assignment.currently_expanded) toggle_expand(assignment.assign_id);
	}
	
	document.querySelector("#assignment_container").classList.remove("ohidden");
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
	var drake = dragula(containers, options);

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

/** sets the status of an assignment
	* @param {String} index_id - the index id of the assignment
	* @param {String} to_status - the status to which the assignment will be set
	*/
async function set_status(index_id, assign_id, user_task, to_status) {
	lastfocused_assign = assign_id;
	var send_id = index_id || assign_id; // fallback to assignment id if index id is null
	fetch_url = base_endpoint + user.baseurl + `/api/assignment2/assignmentstatusupdate/?format=json&assgnmentIndexId=${send_id}&assignmentStatus=${to_status}`;
	var response = await fetch(fetch_url, {
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
			fill_template("assignment_expanded_template", expanded_assignments[assignment_index], "desc-" + assign_id,{
				noEscape: true // do not escape html
			});
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
		fill_template("assignment_expanded_template", assignment_data, "desc-" + assign_id,{
			noEscape: true // do not escape html
		});
		
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
			user.token = await get_verification_token(); // this token needs to be regenerated per session
			save_data(user);
			let post_data = {
				From: "",
				InterfaceSource: "WebApp",
				Username: user.username,
				Password: document.querySelector("#password").value
			};
			if (!post_data.Password) return false;
			
			document.querySelector("#loginbutton").classList.add("greyedout");
			document.querySelector("#loginbutton").value = "loading...";
			
			let login_response = await fetch(base_endpoint + user.baseurl + "/api/SignIn", {
				method: "POST",
				body: JSON.stringify(post_data),
				headers: {
					"RequestVerificationToken": user.token
				}
			});
			login_response = await login_response.json();
			
			resolve(login_response.LoginSuccessful); // resolve the promise
			
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
