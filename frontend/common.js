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
