
(function(){
  const THEME_KEY = "ff_theme";
  const SIZE_KEY = "ff_fontscale";
  const body = document.body;

  // theme
  const savedTheme = localStorage.getItem(THEME_KEY);
  if(savedTheme === "dark"){ body.classList.add("theme-dark"); body.classList.remove("theme-light"); }
  else { body.classList.add("theme-light"); }

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    body.classList.toggle("theme-dark");
    body.classList.toggle("theme-light");
    localStorage.setItem(THEME_KEY, body.classList.contains("theme-dark") ? "dark" : "light");
  });

  // text size (scales only .reader area if present, otherwise body)
  function applyScale(scale){
    const target = document.querySelector(".reader") || body;
    target.style.fontSize = `${scale}%`;
  }
  let scale = parseInt(localStorage.getItem(SIZE_KEY) || "100", 10);
  applyScale(scale);
  document.getElementById("increaseText")?.addEventListener("click", () => {
    scale = Math.min(200, scale + 10);
    localStorage.setItem(SIZE_KEY, String(scale));
    applyScale(scale);
  });
  document.getElementById("decreaseText")?.addEventListener("click", () => {
    scale = Math.max(70, scale - 10);
    localStorage.setItem(SIZE_KEY, String(scale));
    applyScale(scale);
  });

  // inline ads auto-insertion after first paragraph if .reader-content exists
  const reader = document.querySelector(".reader-content");
  if(reader){
    const paras = Array.from(reader.querySelectorAll("p"));
    if(paras.length > 1){
      const slot = document.createElement("div");
      slot.className = "ad-slot";
      slot.dataset.position = "inline-1";
      reader.insertBefore(slot, paras[1].nextSibling);
    }
  }
})();
