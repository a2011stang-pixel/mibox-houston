// MI-BOX Houston — Reviews Grid
(function () {
  'use strict';

  var API = 'https://mibox-houston-api.cmykprnt.workers.dev/api/public/reviews';

  function esc(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function badge(type) {
    var label = '';
    if (type === 'moving') label = 'Moved';
    else if (type === 'storage') label = 'Stored';
    else if (type === 'both') label = 'Moved & Stored';
    else if (type === 'event') label = 'Event';

    if (!label) return '';
    return '<span class="rv-badge">' + label + '</span>';
  }

  function sourceIcon(src) {
    if (src === 'yelp') return '<img class="rv-src" src="images/yelp-icon.png" alt="Yelp" title="Yelp" width="16" height="16">';
    if (src === 'facebook') return '<span class="rv-src rv-src-fb" title="Facebook">f</span>';
    return '<img class="rv-src" src="images/google-icon.png" alt="Google" title="Google" width="16" height="16">';
  }

  function boldSnippet(body, snippet) {
    if (!snippet) return body;
    var idx = body.toLowerCase().indexOf(snippet.toLowerCase());
    if (idx === -1) return body;
    var before = body.slice(0, idx);
    var match = body.slice(idx, idx + snippet.length);
    var after = body.slice(idx + snippet.length);
    return before + '<strong>' + match + '</strong>' + after;
  }

  function card(r) {
    var snippet = r.review_snippet ? esc(r.review_snippet) : '';
    var body = boldSnippet(esc(r.review_text), snippet);

    var html = '<div class="rv-card">';
    // Header: name + tiny source icon + badge
    html += '<div class="rv-card-top">';
    html += '<span class="rv-name">' + esc(r.reviewer_name) + '</span>';
    html += sourceIcon(r.source);
    html += '</div>';
    html += badge(r.service_type);
    // Stars
    html += '<div class="rv-stars">★★★★★</div>';
    // Body text with snippet bolded inline
    html += '<p class="rv-body">' + body + '</p>';
    html += '</div>';
    return html;
  }

  function init() {
    var grid = document.getElementById('reviewsGrid');
    if (!grid) return;

    fetch(API + '?tag=homepage&featured=1&limit=12')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.reviews || !d.reviews.length) return;
        var html = '';
        for (var i = 0; i < d.reviews.length; i++) {
          html += card(d.reviews[i]);
        }
        grid.innerHTML = html;

        // Add "Read more" only for reviews that overflow 6 lines
        var bodies = grid.querySelectorAll('.rv-body');
        for (var j = 0; j < bodies.length; j++) {
          (function (el) {
            if (el.scrollHeight > el.clientHeight + 1) {
              var link = document.createElement('a');
              link.className = 'rv-read-more';
              link.href = '#';
              link.textContent = 'Read more';
              link.addEventListener('click', function (e) {
                e.preventDefault();
                el.classList.add('rv-body-expanded');
                link.style.display = 'none';
              });
              el.parentNode.appendChild(link);
            }
          })(bodies[j]);
        }

        // Arrow scroll
        var prevBtn = document.getElementById('rvPrev');
        var nextBtn = document.getElementById('rvNext');
        if (prevBtn && nextBtn) {
          var scrollAmount = function () {
            var first = grid.querySelector('.rv-card');
            return first ? first.offsetWidth + 20 : 300;
          };
          nextBtn.addEventListener('click', function () {
            grid.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
          });
          prevBtn.addEventListener('click', function () {
            grid.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
          });
        }
      })
      .catch(function (e) { console.error('Reviews:', e); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
