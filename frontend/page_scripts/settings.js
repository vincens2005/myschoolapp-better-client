let themes = [];
let current_theme = 0;
let theme_element;

let settings = [];

async function change_theme(id) {
	Cookies.set("theme", themes[id].file, {expires: 100000});
	let url = "themes/" + themes[id].file;
	let theme_text = themes[id].cached ?? await fetch(url).then(a => a.text());
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
			options: ["MM/DD/YYYY", "M/D/YY", "DD/MM/YYYY", "D/M/YY", "YYYY/MM/DD", "YY/M/D"]
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
		// TODO: more types
	}
}

function change_setting(e) {
	if (e.target.classList.contains("button")) {
		let setting_index = e.target.id.split("_")[0].replace("setting", "");
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
		let setting_index = e.target.id.replace("input", "");
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
	save_data(user);
}

async function init() {
	get_header();
	themes = await fetch("themes/themes.json").then(a => a.json());
	current_theme = themes.findIndex(a => a.file == Cookies.get("theme")) || 0;
	themes[current_theme].current = true;
	
	user = await get_user();
	init_settings();
	fill_template("settings_template", {themes, settings}, "output");
	document.querySelector("#output").classList.remove("ohidden");

}
window.addEventListener("DOMContentLoaded", init);
