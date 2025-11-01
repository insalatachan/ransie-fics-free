
// Very simple, privacy-friendly ad placeholder system.
// Replace with AdSense or other ad scripts when approved.
(function(){
  const config = {
    // For a new site, start with house ads or affiliate banners.
    // You can replace these with real network tags later.
    creatives: [
      {html: '<a href="https://ko-fi.com" target="_blank" rel="noopener">Supportami su Ko-fi</a>'},
      {html: '<a href="https://www.patreon.com" target="_blank" rel="noopener">Diventa Patron</a>'},
      {html: '<a href="/about.html">Leggi chi sono</a>'}
    ]
  };

  const slots = document.querySelectorAll(".ad-slot");
  let i = 0;
  slots.forEach(slot => {
    const c = config.creatives[i % config.creatives.length];
    slot.innerHTML = '<span class="ad-label">PUBBLICITÀ</span><div class="ad-content">'+ c.html +'</div>';
    i++;
  });

  // If migrating to Google AdSense later:
  // 1) Create account, verify domain, add site to "Sites".
  // 2) Replace a slot's innerHTML with AdSense code and include their script:
  // <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX" crossorigin="anonymous"></script>
  // <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXX" data-ad-slot="YYYY" data-ad-format="auto" data-full-width-responsive="true"></ins>
  // <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
})();
