const base_endpoint = "/.netlify/functions/cors/"; // this is a const because we don't want the risk of a man in the middle attack
// this endpoint is for non-plaintext. for plaintext, always use base_endpoint
const download_endpoint = "/.netlify/functions/download/"; // this is a const for the same reason
var user;

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
	nuser = await localforage.getItem("user");
	if (!nuser || !removehttp(nuser.baseurl)) {
		nuser = {
			baseurl: "",
			username: "",
			last_page: "schedule.html",
			// enabling debug mode allows the client to fetch test data and fill it in on blank templates
			debug_mode: false,
			default_description: "",
			token: ""
		};
	}
	return nuser;
}

/** automatically fills out handlebars template
 * @param {String} template_id - the id of the template element
 * @param {Object} data - the data to fill.
 * @param {String} target_id - the id of the element to put the final HTML
 * @param {Object} handlebar_options - extra handlebars config
 */
function fill_template(template_id, data, target_id, handlebar_options) {
	if (typeof data != "object") {
		return;
	}
	if (!handlebar_options) {
		handlebar_options = {};
	}
	var template = Handlebars.compile(document.querySelector("#" + template_id).innerHTML, handlebar_options);
	var html = template(data);
	document.querySelector("#" + target_id).innerHTML += html;
}

/** returns whether use is logged in */
async function logged_in() {
	if (!user.baseurl) {
		return false;
	}
	var req = await fetch(base_endpoint + user.baseurl + "/api/webapp/userstatus/");
	var data = await req.json();
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
	document.querySelector("#header").classList.add("ohidden", "standard_transition");
	var template_data = await fetch("templates/header.hbs").then(a => a.text());
	var tabs = [
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
	]
	for (var tab of tabs) {
		var cur_url = new URL(location);
		var cur_path = cur_url.pathname.split("/");
		cur_path = cur_path[cur_path.length - 1];
		cur_path = cur_path.split(".")[0];
		cur_path = cur_path.toLowerCase();
		tab.class_name = "";
		if (tab.url_matches.some((a) => a == cur_path)) {
			tab.class_name = "current-tab"; // add class name if URL matches the `url_matches` key
		}
	}
	var template = Handlebars.compile(template_data);
	var html = template({tabs});
	document.querySelector("#header").innerHTML = html;
	document.querySelector("#header").classList.remove("ohidden")
}

/** empties element while preserving children with ids
	* @param {Object} element - the element to empty
*/
function empty_all(element) {
	var children = Array.from(element.childNodes); // Array.from makes it so indexes won't change during deletion
	for (var node of children) {
		if (!node.id) {
			node.remove();
			continue;
		}
		empty_all(node)
	}
}

/** fetches the image path necessary for many images */
async function get_image_path() {
//  uses es9, which mobile safari doesn't support, ugh
//  supporting the old thing adds three extra lines. ew
//  es9 code:
//  var pattern = /(?<=\"FtpImagePath\"\s*:\s*\")([^\'*\"*\,*\}*]*)/g;
//  why doesn't apple just update their stupid browser?

	var pattern = /(\"FtpImagePath\"\s*:\s*\")([^\'*\,*\}*]*)/g
	var rosterpage = await fetch(base_endpoint + user.baseurl + "/app/student#academicclass/").then(a => a.text());
	var ftp_image_path = rosterpage.match(pattern);
	ftp_image_path = ftp_image_path[0];
	ftp_image_path = "{" + ftp_image_path + "}";
	ftp_image_path = JSON.parse(ftp_image_path);
	
	return ftp_image_path.FtpImagePath;
}

async function get_verification_token() {
	// parse the response to get the token
  var token_get = await fetch(base_endpoint + user.baseurl + "/app/");
  var token_plaintext = await token_get.text();
  var token_dom = (new DOMParser()).parseFromString(token_plaintext, "text/html");
  var antiforge_div = token_dom.querySelector("#__AjaxAntiForgery");
  var token = antiforge_div.firstElementChild.value;
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
		var new_url = new URL(url);
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
	return el.innerText;
}
