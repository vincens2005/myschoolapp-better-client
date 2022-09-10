let themes = [];
let current_theme = 0;
let theme_element;

let settings = [];

async function change_theme(id) {
	Cookies.set("theme", themes[id].file, {expires: 100000});
	user.theme = themes[id].file;
	save_data(user);

	let url = "themes/" + themes[id].file;
	let theme_text = themes[id].cached || await fetch(url).then(a => a.text());
	themes[id].cached = theme_text;

	if (theme_element) theme_element.remove();
	theme_element = document.createElement("style");
	theme_element.innerHTML = theme_text;
	document.querySelector("head").appendChild(theme_element);

	document.querySelector("#theme-" + current_theme).classList.add("indicator-blank");
	document.querySelector("#theme-" + id).classList.remove("indicator-blank");

	themes[current_theme].current = false;
	themes[id].current = true;
	current_theme = id;
}

function init_settings() {
	settings = [
		{
			key: "date_format",
			name: "Date Format",
			type: "radio", // currenly the only type
			can_have_custom: true,
			options: ["MM/DD/YYYY", "M/D/YY", "DD/MM/YYYY", "D/M/YY", "YYYY/MM/DD", "YY/M/D"],
			example_id: "date_elem",
			make_example: () => {
				return dayjs().format(user.date_format);
			}
		},
	];

	for (let setting of settings) {
		if (setting.type == "radio") {
			setting.is_radio = true;
			if (!setting.options.includes(user[setting.key]) && setting.can_have_custom) {
				setting.custom_value = user[setting.key];
			}
			for (let i in setting.options) {
				setting.options[i] = {
					value: setting.options[i],
					current: user[setting.key] == setting.options[i]
				};
			}
		}
		if (!setting.make_example) {
			setting.make_example = () => {return};
		}
		else {
			setting.example = setting.make_example();
		}
		// TODO: more types
	}
}

function change_setting(e) {
	let setting_index;
	if (e.target.classList.contains("button")) {
		setting_index = e.target.id.split("_")[0].replace("setting", "");
		let value_index = e.target.id.split("_")[1];
		if (value_index == "custom" && !e.target.querySelector("input").value) return
		if (e.target.classList.contains("indicator-blank")) {
			e.target.classList.remove("indicator-blank");

			let old_value = settings[setting_index].options.findIndex(a => a.current);
			old_value = old_value >= 0 ? old_value : "custom";
			console.log(old_value)
			document.querySelector("#setting" + setting_index + "_" + old_value).classList.add("indicator-blank")
			if (old_value != "custom") settings[setting_index].options[old_value].current = false;
		}
		if (value_index != "custom") {
			settings[setting_index].options[value_index].current = true;
			user[settings[setting_index].key] = settings[setting_index].options[value_index].value;
		}
		else {
			user[settings[setting_index].key] = e.target.querySelector("input").value;
		}
	}
	else if (e.target.nodeName == "INPUT") {
		setting_index = e.target.id.replace("input", "");
		if (!e.target.value && settings[setting_index].type == "radio") {
			if (!e.target.parentNode.classList.contains("indicator-blank")) {
				document.querySelector("#setting" + setting_index + "_0").click();
			}
			return;
		}
		if (settings[setting_index].type == "radio" && e.target.parentNode.classList.contains("indicator-blank")) {
			e.target.parentNode.classList.remove("indicator-blank");
			let old_value = settings[setting_index].options.findIndex(a => a.current);
			document.querySelector("#setting" + setting_index + "_" + old_value).classList.add("indicator-blank");
			settings[setting_index].options[old_value].current = false;
		}

		user[settings[setting_index].key] = e.target.value;
	}
	if (settings[setting_index].example) {
		document.querySelector(`#${settings[setting_index].example_id}`).innerHTML = settings[setting_index].make_example();
	}
	save_data(user);
}

async function handle_feedback(e) {
	document.querySelector("#feedbackform").classList.add("ohidden");
	let body = new FormData(e.target);
	let response = await fetch("https://formsubmit.co/a9fe7b9046627bf0e34d4c301f90da63", {
		method: "POST",
		body
	}).then(a => a.text());
	let feedback_text = "Thanks for your feedback :)";
	if (response.error) {
		feedback_text = "There was an error submitting the form. Please try again";
	}
	document.querySelector("#feedbackform").innerHTML = `<h4>${feedback_text}</h4>`;
	document.querySelector("#feedbackform").classList.remove("ohidden");
}

async function init() {
	let cookie_theme = Cookies.get("theme");
	get_header();
	themes = await fetch("themes/themes.json").then(a => a.json());
	current_theme = themes.findIndex(a => a.file == cookie_theme);
	current_theme = current_theme >= 0 ? current_theme : 0;
	themes[current_theme].current = true;


	user = await get_user();
	if (cookie_theme != user.theme) {
		user.theme = cookie_theme;
		save_data(user);
	}

	init_settings();
	fill_template("settings_template", {themes, settings}, "output");
	document.querySelector("#main-div").classList.remove("ohidden");

}
window.addEventListener("DOMContentLoaded", init);
