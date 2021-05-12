async function login() {
  // TODO: form validation
  var baseurl = addhttp(document.querySelector("#baseurl").value);
  var post_data = {
    From: "",
    InterfaceSource: "WebApp",
    Username: document.querySelector("#username").value,
    Password: document.querySelector("#password").value
  };
  
  // store form data for future speed
  user.username = post_data.Username;
  user.baseurl = baseurl;
  save_data(user);
  
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
    return;
  }
  console.log("Login successful!");
  // redirect to page. 
  location = "assignments.html"; // TODO: implement last page save / default page
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

async function init() {
  user = await get_user();
  document.querySelector("#baseurl").value = removehttp(user.baseurl);
  document.querySelector("#username").value = user.username;
}
