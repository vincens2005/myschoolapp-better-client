async function login() {
  var url = new URL(location);
	var redirect = url.searchParams.get("redirect");
	redirect = safe_decode(redirect);
  
  // TODO: form validation
  var baseurl = addhttp(document.querySelector("#baseurl").value);
  var post_data = {
    From: "",
    InterfaceSource: "WebApp",
    Username: document.querySelector("#username").value,
    Password: document.querySelector("#password").value
  };
  
  // store form data for future speed
  if(user.username != post_data.Username) {
    localforage.removeItem("user"); // clear data if different user
  }
  user.username = post_data.Username;
  user.baseurl = baseurl;
  save_data(user);
  
  // grey out login button
  document.querySelector("#loginbutton").classList.add("greyedout");
  document.querySelector("#loginbutton").innerHTML = "loading...";
  
  // parse the response to get the token
  var token_get = await fetch(base_endpoint + baseurl + "/app/");
  var token_plaintext = await token_get.text();
  var token_dom = (new DOMParser()).parseFromString(token_plaintext, "text/html");
  var antiforge_div = token_dom.querySelector("#__AjaxAntiForgery");
  var token = antiforge_div.firstElementChild.value;
  console.log(token);
  
  // this request log you in.
  var login_response = await fetch(base_endpoint + baseurl + "/api/SignIn", {
    method: "POST",
    body: JSON.stringify(post_data),
    headers: {
      "RequestVerificationToken": token
    }
  });
  login_response = await login_response.json();
  console.log(login_response);
  if (!login_response.LoginSuccessful) {
    console.log("Login Unsucessful!");
    // TODO: tell user something went wrong
    document.querySelector("#loginbutton").classList.remove("greyedout");
    document.querySelector("#loginbutton").innerHTML = "log in";
    return;
  }
  console.log("Login successful!");
  // redirect to page. 
  location = redirect || user.last_page || "schedule.html";
}

async function init() {
  user = await get_user();
  document.querySelector("#baseurl").value = removehttp(user.baseurl);
  document.querySelector("#username").value = user.username;
  
  // grey out login button
  document.querySelector("#loginbutton").classList.add("greyedout");
  document.querySelector("#loginbutton").innerHTML = "loading...";
  
  var loggedin = await logged_in();
  if (loggedin) {
    location = user.last_page || "schedule.html";
    return;
  }
  document.querySelector("#loginbutton").classList.remove("greyedout");
  document.querySelector("#loginbutton").innerHTML = "log in";
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
  url = url.replace(/^(?:f|ht)tps?\:\/\//, "");
  return url;
}
