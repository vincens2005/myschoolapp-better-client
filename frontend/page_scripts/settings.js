let themes = [];
let current_theme = 0;
let theme_element;

async function change_theme(id) {
	Cookies.set("theme", themes[id].file, {expires: 100000});
	let url = "themes/" + themes[id].file;
	
	if (theme_element) theme_element.remove();
	theme_element = document.createElement("style");
	theme_element.innerHTML = await fetch(url).then(a => a.text());
	document.querySelector("head").appendChild(theme_element);
	
	current_theme = id;
}

async function init() {
	get_header();
	themes = await fetch("themes/themes.json").then(a => a.json());
}
window.addEventListener("DOMContentLoaded", init);
