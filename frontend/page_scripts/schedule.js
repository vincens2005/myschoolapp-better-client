let current_view_date = dayjs();
let today = dayjs();
let schedule_header = false;
async function init() {
	let url = new URL(location);
	let schedule_date = url.searchParams.get("date");
	schedule_date = safe_decode(schedule_date);

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

	let endpoint_url = "/api/schedule/MyDayCalendarStudentList";
	if (schedule_date) {
		let new_date = dayjs(schedule_date, "MM/DD/YYYY");
		if (new_date.isValid() && !new_date.isSame(today, "day")) {
			endpoint_url += "?scheduleDate=" + schedule_date;
			current_view_date = new_date;
		}
		else {
			url.searchParams.delete("date");
			history.pushState({}, "", url);
		}
	}
	document.querySelector("#date").innerHTML = "schedule for " + current_view_date.format(user.date_format);
	let request = await fetch(base_endpoint + user.baseurl + endpoint_url);
	let data = await request.json();

	if (!data.length) {
		console.log("no data!")
		if (!schedule_header) {
			schedule_header = document.querySelector("#schedule_tbody").innerHTML;
		}
		document.querySelector("#schedule_tbody").innerHTML = schedule_header;
		fill_template("nodata_template", {
			date: current_view_date.format(user.date_format)
		}, "schedule_tbody");
		document.querySelector("#schedule_cont").classList.remove("ohidden");
		return;
	}

	let schedule = [];
	for (let item of data) {
		schedule.push({
			class_name: item.CourseTitle,
			class_id: item.SectionId,
			start_time: item.MyDayStartTime,
			end_time: item.MyDayEndTime,
			block: item.Block,
			room_number: item.RoomNumber,
			building: item.BuildingName,
			contact: item.Contact,
			contact_email: item.ContactEmail,
			indicator_text: item.AttendanceDisplay,
			indicator_class: attendance_to_color(item.AttendanceInd)
		});
	}

	if (!schedule_header) {
		schedule_header = document.querySelector("#schedule_tbody").innerHTML;
	}
	document.querySelector("#schedule_tbody").innerHTML = schedule_header; // replace current schedule with header if it exists

	fill_template("schedule_template", {schedule}, "schedule_tbody");
	document.querySelector("#schedule_cont").classList.remove("ohidden");
}

function attendance_to_color(ind) {
	let indicators = {
		"1": "good",
		"2": "okay",
		"0": "blank"
	}
	return indicators[String(ind)] || "blank";
}

/** changes the current view date by a factor in days
 * @param {Number} fac - factor in days to change the date by
 */
function chschedule_date(fac) {
	current_view_date = current_view_date.set("date", current_view_date.get("date") + fac);
	let formatted_date = current_view_date.format("MM/DD/YYYY");
	setschedule_date(formatted_date);
}

/** changes the current view date 
	* @param {String} date - the date to set the schedule to
	*/
function setschedule_date(date) {
	history.pushState({}, "", "?date=" + date);
	init();
}

window.addEventListener("DOMContentLoaded", init);
