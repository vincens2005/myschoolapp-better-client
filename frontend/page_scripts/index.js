function init() {
	document.querySelector("#desc_span").innerHTML = "";
	document.querySelector("#title").innerHTML = "";

	console.log("initializing ityped");
	ityped.init(document.querySelector("#title"), {
		strings: ["portal++"],
		typeSpeed: 155,
		loop: false,
		showCursor: false,
		onFinished: () => {
			setTimeout(() => {
				ityped.init(document.querySelector("#desc_span"), {
					strings: [
						"A better client for MySchoolApp.",
						"Reverse-engineered from the original webapp.",
						"Faster & lighter than the stock webapp.",
						"Mobile friendly.",
						"Aesthetically pleasing.",
						"Are you still reading this?",
						"Click log in if your school uses BlackBaud's learning management system.",
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
					backDelay: 780
				});
			}, 150);
		}
	});
	document.querySelector("#landing_page_cont").classList.remove("hidden");
}