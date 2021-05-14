var current_view_date = new Date();
async function init() {
	var url = new URL(location);
	var schedule_date = url.searchParams.get("date");
	schedule_date = safe_decode(schedule_date);
	
	user = await get_user();
	user.last_page = location;
	save_data(user);
	
	// check if user is logged in
	var loggedin = await logged_in();
	if (!loggedin) {
		location = "login.html";
		return;
	}
	
	var endpoint_url = "/api/schedule/MyDayCalendarStudentList";
	
	if (schedule_date) {
		current_view_date = dayjs(schedule_date, "MM/DD/YYYY");
		if (current_view_date.isValid()) {
			endpoint_url += "?scheduleDate=" + schedule_date;
		}
		else {
			current_view_date = new Date();
		}
	}
	var request = await fetch(base_endpoint + user.baseurl + endpoint_url);
	var data = await request.json();
	// TODO: validate response
	var schedule = [];
	for (var item of data) {
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
	fill_template("schedule_template", {schedule}, "schedule_tbody");
	document.querySelector("#schedule_tbody").classList.remove("ohidden");
}

function attendance_to_color(ind) {
	var indicators = {
		"1": "good",
		"0": "blank"
	}
	return indicators[String(ind)] || "blank";
}
