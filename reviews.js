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

  function badge(type, dateStr) {
    var label = '';
    if (type === 'moving') label = 'Moved';
    else if (type === 'storage') label = 'Stored';
    else if (type === 'both') label = 'Moved & Stored';
    else if (type === 'event') label = 'Event';

    var date = '';
    if (dateStr) {
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var p = dateStr.split('-');
      var m = p[1] ? months[parseInt(p[1], 10) - 1] : '';
      date = m ? m + '. ' + p[0] : p[0];
    }

    if (!label && !date) return '';
    return '<span class="rv-badge">' + (label ? label + ' ' : '') + date + '</span>';
  }

  function sourceIcon(src) {
    if (src === 'yelp') return '<span class="rv-source rv-source-yelp" title="Yelp">Y</span>';
    if (src === 'facebook') return '<span class="rv-source rv-source-fb" title="Facebook">f</span>';
    return '<span class="rv-source rv-source-google" title="Google">G</span>';
  }

  function card(r) {
    var snippet = r.review_snippet ? esc(r.review_snippet) : '';
    var body = esc(r.review_text);

    // Bold the snippet inline within the body text
    var bodyHtml = body;
    if (snippet && body.length > snippet.length) {
      var idx = body.toLowerCase().indexOf(snippet.toLowerCase());
      if (idx !== -1) {
        bodyHtml = body.substring(0, idx) +
          '<strong>' + body.substring(idx, idx + snippet.length) + '</strong>' +
          body.substring(idx + snippet.length);
      }
    }

    var html = '<div class="rv-card">';
    html += '<div class="rv-card-top">';
    html += sourceIcon(r.source);
    html += '<div class="rv-meta">';
    html += '<span class="rv-name">' + esc(r.reviewer_name) + '</span>';
    html += badge(r.service_type, r.review_date);
    html += '</div>';
    html += '</div>';
    html += '<p class="rv-body">' + bodyHtml + '</p>';
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
