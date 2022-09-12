const base_endpoint = "/proxy/"; // this is a const because we don't want the risk of a man in the middle attack
let user;
let templates = {};
window.is_portalplus = true; // this makes it such that the browser extension knows where we are

/** saves data
 * @param {Object} user - the `user` object
 */
function save_data(nuser) {
	localforage.setItem("user", nuser).then(() => {
		console.log("saved stuff");
	});
}

/** returns a user object */
async function get_user() {
	let default_user = {
		baseurl: "https://bush.myschoolapp.com",
		username: "",
		last_page: "schedule.html",
		date_format: "MM/DD/YYYY",
		token: "",
		theme: "default.css",
		blackbaud_login: true, // is using the browser extension?

		// enabling debug mode allows the client to fetch test data and fill it in on blank templates
		debug_mode: false,
		default_description: ""
	};
	let nuser = await localforage.getItem("user");
	if (!nuser || !removehttp(nuser.baseurl)) return default_user;

	for (let i in default_user) {
		nuser[i] = nuser[i] || default_user[i];
	}

	return nuser;
}

/** automatically fills out handlebars template
 * @param {String} template_name - the id of the template element or URL of the template
 * @param {Object} data - the data to fill.
 * @param {String} target_id - the id of the element to put the final HTML
 * @param {Object} handlebar_options - extra handlebars config
 * @param {Boolean} is_url - fetch or use elem ID?
 */
async function fill_template(template_name, data, target_id, handlebar_options, is_url) {
	if (typeof data != "object") {
		return;
	}
	if (!handlebar_options) {
		handlebar_options = {};
	}
	let template_string;
	if (is_url) {
		template_string = templates[template_name];
		if (!template_string) {
			template_string = await fetch(template_name).then(a => a.text());
			templates[template_name] = template_string;
		}
	}
	else {
		template_string = document.querySelector("#" + template_name).innerHTML;
	}
	let template = Handlebars.compile(template_string, handlebar_options);
	let html = template(data);
	document.querySelector("#" + target_id).innerHTML += html;
}

/** returns whether use is logged in */
async function logged_in() {
	if (!user.baseurl) {
		return false;
	}
	let req = await fetch(base_endpoint + user.baseurl + "/api/webapp/userstatus/");
	let data = await req.json();
	return data.TokenValid;
}

/** decodes uri without throwing errors */
function safe_decode(uri) {
	if (!uri) {
		return uri;
	}
	try {
		return decodeURIComponent(uri.replace(/%(?![0-9][0-9a-fA-F]+)/gi, '%25'));
	}
	catch (err) {
		return decodeURIComponent(uri);
	}
}

/** makes horizontal overflow scroll with mouse wheel */
function scroll_horizontally(e) {
	e = window.event || e;
	e.currentTarget.scrollLeft += e.deltaY / 2;
	e.preventDefault();
}

/** fills in the header from the template */
async function get_header() {
	let header = document.querySelector("#header");
	if (!header.getAttribute("data-loaded")) header.classList.add("ohidden", "standard_transition");
	let tabs = [
		{
			title: "schedule", // the text that goes in the tab
			url: "schedule.html",
			url_matches: ["schedule"]
		},
		{
			title: "classes",
			url: "classes.html",
			url_matches: ["classes","class", "topic"]
		},
		{
			title: "assignments",
			url: "assignments.html",
			url_matches: ["assignments"]
		}
	];

	let cur_path = location.pathname.split("/");
	cur_path = cur_path[cur_path.length - 1];
	cur_path = cur_path.split(".")[0];
	cur_path = cur_path.toLowerCase();

	for (let tab of tabs) {
		tab.is_current = tab.url_matches.some((a) => a == cur_path); // this is the current tab if one of its URLs matches the current one
	}
	header.innerHTML = "";
	await fill_template("templates/header.hbs", {tabs}, "header", {}, true);
	header.classList.remove("ohidden");
	header.setAttribute("data-loaded", "true");

	fetch(`https://cukmekerb.goatcounter.com/count?p=${cur_path}.html&t=${document.title}&s=${window.innerWidth},${window.innerHeight}&rnd=${Math.random()}`);

	// settings button
	if (document.querySelector("#settings") || cur_path.endsWith("settings")) return;
	let settings_button = document.createElement("a");
	settings_button.id = "settings";
	settings_button.classList.add("round-button", "ohidden");
	settings_button.href = "settings.html";
	settings_button.innerText = "settings";
	document.body.appendChild(settings_button);
	setTimeout(() => {
		settings_button.classList.remove("ohidden");
	}, 100);
}

/** empties element while preserving children with ids
	* @param {Object} element - the element to empty
*/
function empty_all(element) {
	let children = Array.from(element.childNodes); // Array.from makes it so indexes won't change during deletion
	for (let node of children) {
		if (!node.id) {
			node.remove();
			continue;
		}
		empty_all(node);
	}
}

/** fetches the image path necessary for many images */
async function get_image_path() {
//  uses es9, which mobile safari doesn't support, ugh
//  supporting the old thing adds three extra lines. ew
//  es9 code:
//  let pattern = /(?<=\"FtpImagePath\"\s*:\s*\")([^\'*\"*\,*\}*]*)/g;
//  why doesn't apple just update their stupid browser?

	let pattern = /(\"FtpImagePath\"\s*:\s*\")([^\'*\,*\}*]*)/g
	let rosterpage = await fetch(base_endpoint + user.baseurl + "/app/student#academicclass/").then(a => a.text());
	let ftp_image_path = rosterpage.match(pattern);
	ftp_image_path = ftp_image_path[0];
	ftp_image_path = "{" + ftp_image_path + "}";
	ftp_image_path = JSON.parse(ftp_image_path);

	return ftp_image_path.FtpImagePath;
}

async function get_verification_token() {
	// parse the response to get the token
  let token_get = await fetch(base_endpoint + user.baseurl + "/app/");
  let token_plaintext = await token_get.text();
  let token_dom = (new DOMParser()).parseFromString(token_plaintext, "text/html");
  let antiforge_div = token_dom.querySelector("#__AjaxAntiForgery");
  let token = antiforge_div.firstElementChild.value;
  return token;
}

// stolen from staccoverflow
/** takes a url and appends https:// at the beginning
 * @param {String} url - the url
 */
function addhttp(url) {
	if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
		url = "https://" + url;
	}
	url = url.replace(/\/$/, "");
	return url;
}

/** takes a url and removes http:// or https:// from the beginning
 * @param {String} url - the url
 */
function removehttp(url) {
	url = url.replace(/^(?:f|ht)tps?\:\/+/, "");
	return url;
}

/** checks if a URL is valid
	* @param {String} url - the url
*/
function validurl(url) {
	try {
		let new_url = new URL(url);
		return true;
	}
	catch (error) {
		return false;
	}
}

/** removes html from text
	* @param {String} html - the html to clean
*/
function htmltotext(html) {
	let el = document.createElement("span");
	el.innerHTML = html;
	text = el.innerText;
	text = text.replace(/</g, "&lt;");
	text = text.replace(/>/g, "&gt;");
	return text;
}

// service worker
window.addEventListener("DOMContentLoaded", () => {
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.register("serviceworker.js");
	}
});
