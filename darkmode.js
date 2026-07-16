// ── Dark mode toggle ─────────────────────────────────
// Adds a floating button (top-right) that switches the
// site between light and dark mode, and remembers the
// choice across pages/visits using localStorage.
(function () {
	const STORAGE_KEY = "zf-theme";

	const saved = localStorage.getItem(STORAGE_KEY);
	let theme = saved || "light";

	const btn = document.createElement("button");
	btn.id = "theme-toggle";
	btn.type = "button";
	btn.setAttribute("aria-label", "Toggle dark mode");

	function applyTheme() {
		document.body.classList.toggle("dark-mode", theme === "dark");
		btn.textContent = theme === "dark" ? "☀️" : "🌙";
	}

	btn.addEventListener("click", function () {
		theme = theme === "dark" ? "light" : "dark";
		localStorage.setItem(STORAGE_KEY, theme);
		applyTheme();
	});

	document.body.appendChild(btn);
	applyTheme();
})();