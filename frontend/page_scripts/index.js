function init() {
	document.querySelector("#desc_span").innerHTML = "";
	document.querySelector("#title").innerHTML = "";

	console.log("initializing wiatal");
	wiatal("#title", {
		strings: ["portal++"],
		typeSpeed: 155,
		loop: false,
		showCursor: false,
		startDelay: 100,
		onFinished: () => {
			setTimeout(() => {
				wiatal("#desc_span", {
					strings: [
						"A better client for MySchoolApp.",
						"Reverse-engineered from the original webapp.",
						"\"A godsend\" -Josh",
						"Faster & lighter than the stock webapp.",
						"Mobile friendly.",
						"Proudly made with vanilla JS",
						"Are you still reading this?",
						"Click log in if your school uses BlackBaud's Learning Management System.",
						"Fine, whatever.",
						"This thing is fast though.",
						"The mobile site is better too.",
						"It has dark mode.",
						"Actually, it only has dark mode.",
						"screw light mode.",
						"haha it go brrrrrrrrrrrr.",
						"no?",
						"please log in",
						"AAAAAAAAAAAAAAAAAAAAAAAAAAAA",
						"really, you're still here?",
						"c'mon push the button.",
						"please?",
						"pretty please?",
						"pretty please with sugar and ice cream on top?",
						"pretty please with suger and ice cream and candy on top?",
						"you don't like ice cream?",
						"who doesn't like ice cream?",
						"are you lactose intolerant or something?",
						"whatever.",
						"i give up.",
						"goodbye."
					],
					typeSpeed: 85,
					backSpeed: 45,
					backDelay: 780,
					loopDelay: 12000
				});
			}, 150);
		}
	});
	document.querySelector("#landing_page_cont").classList.remove("hidden");
	
	let url = new URL(location);

	let baseurl = url.searchParams.get("baseurl");
	baseurl = safe_decode(baseurl);
	if (!baseurl) return;
	url = new URL("login", window.location);
	url.searchParams.append("baseurl", baseurl);
	document.querySelector("#loginbutton").href = url.href;
}

/** stolen from common.js because common.js is 6kb and that's not worth it */
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
