window.customselect = {
	init: function() {
		if (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement) return;
		let selects = document.querySelectorAll(".select-cont");
		for (let container of Array.from(selects)) {
			if (container.hasAttribute("customselect")) continue;
			container.setAttribute("customselect", "yes");
			let select = container.querySelector("select");
			select.classList.add("hidden");

			let selected = document.createElement("div");
			selected.classList.add("select-selected");
			selected.innerHTML = select.options[select.selectedIndex].innerHTML;

			container.appendChild(selected);

			let options_div = document.createElement("div");
			options_div.classList.add("select-items", "hidden", "ohidden", "rounded-cont", "standard_transition", "popup");
			for (let i in select.options) {
				if (!select.options[i].innerHTML) continue;
				let option = document.createElement("div");
				option.innerHTML = select.options[i].innerHTML;
				option.addEventListener("click", e => {
					e.stopPropagation();
					let select = e.target.parentNode.parentNode.querySelector("select");
					let selected = e.target.parentNode.parentNode.querySelector(".select-selected");
					for (let i in select.options) {
						if (select.options[i].innerHTML == e.target.innerHTML) {
							select.selectedIndex = Number(i);
							selected.innerHTML = e.target.innerHTML;
							break;
						}
					}
					this.hideall();
				});
				options_div.appendChild(option);
			}
			container.appendChild(options_div);
			container.addEventListener("click", e => {
				e.stopPropagation();
				let options_div = e.target.parentNode.querySelector(".select-items");

				options_div.style.top = e.target.offsetTop + "px";
				options_div.style.left = e.target.offsetLeft + "px";
				options_div.style.maxHeight = (window.innerHeight - e.target.offsetTop - e.target.offsetParent.offsetTop + 140) + "px";

				if (options_div.classList.contains("ohidden")) {
					setTimeout(() => options_div.classList.toggle("ohidden"), 10);
					options_div.classList.toggle("hidden");
					if ('key' in window) {
						this.old_scope = key.getScope();
						key.setScope("customselect");
					}
				}
			});
		}
		if (!this.hasinitted) {
			this.hideall = () => {
				for (let cont of document.querySelectorAll(".select-items")) {
					cont.classList.add("ohidden");
					setTimeout(() => cont.classList.add("hidden"), 400);
				}
				if ('key' in window) {
					key.setScope(this.old_scope);
				}
			}
			document.addEventListener("click", this.hideall);
			if ('key' in window) key("esc", "customselect", this.hideall);
		}
		this.hasinitted = true;
	},
	hasinitted: false,
	old_scope: "default"
};
