var base_endpoint = "/.netlify/functions/cors/";
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
  if (!nuser) {
    nuser = {
      baseurl: "",
      username: "",
      last_page: "schedule.html"
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

// stolen from staccoverflow
function addhttp(url) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "https://" + url;
    }
    url = url.replace(/\/$/, "");
    return url;
}

function removehttp(url) {
  url = url.replace(/^(?:f|ht)tps?\:\/\//, "");
  return url;
}
