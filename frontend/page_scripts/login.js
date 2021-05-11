var base_endpoint = "/.netlify/functions/cors/";
async function login() {
  // todo: form validation
  var baseurl = addhttp(document.querySelector("#baseurl").value);
  var post_data = {
    From: "",
    InterfaceSource: "WebApp",
    Username: document.querySelector("#username").value,
    Password: document.querySelector("#password").value
  };
  
  // parse the response to get the token
  var token_get = await fetch(base_endpoint + baseurl + "/app/");
  var token_plaintext = await token_get.text();
  var token_dom = (new DOMParser()).parseFromString(token_plaintext, "text/html");
  var antiforge_div = token_dom.querySelector("#__AjaxAntiForgery");
  var token = antiforge_div.firstElementChild.value;
  console.log(token);
  
  
  fetch(base_endpoint + baseurl + "/api/SignIn", {
    method: "POST",
    body: JSON.stringify(post_data),
    headers: {
      "RequestVerificationToken": token
    }
  });
}

// stolen from staccoverflow
function addhttp(url) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "https://" + url;
    }
    url = url.replace(/\/$/, "");
    return url;
}
