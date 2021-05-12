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
      username: ""
    };
  }
  return nuser;
}

/** automatically fills out handlebars template
 * @param {String} template_id - the id of the template element
 * @param {Object} data - the data to fill. If it's an array it will be looped through
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
  if (Array.isArray(data)) {
    document.querySelector("#" + target_id).innerHTML = "";
    // loop and fill out template
    for (var entry of data) {
      let html = template(entry);
      document.querySelector("#" + target_id).innerHTML += html;
    }
    return;
  }
  var html = template(data);
  document.querySelector("#" + target_id).innerHTML = html;
}
