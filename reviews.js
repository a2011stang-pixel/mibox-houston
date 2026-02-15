// MI-BOX Houston — Reviews Carousel (PODS-style cards)
(function () {
  'use strict';

  var API_BASE = 'https://mibox-houston-api.cmykprnt.workers.dev/api/public/reviews';
  var AUTOPLAY_INTERVAL = 8000;
  var autoplayTimer = null;
  var currentIndex = 0;
  var reviews = [];
  var cardsPerView = 3;
  var GAP = 16; // px between cards

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function renderStars(count) {
    var s = '';
    for (var i = 0; i < count; i++) s += '<i class="bi bi-star-fill"></i>';
    return s;
  }

  function getServiceBadge(type) {
    switch (type) {
      case 'moving': return 'Moved';
      case 'storage': return 'Stored';
      case 'both': return 'Moved & Stored';
      case 'event': return 'Event';
      default: return '';
    }
  }

  function getServiceIcon(type) {
    if (type === 'moving' || type === 'both') {
      return '<i class="bi bi-truck"></i>';
    }
    return '<i class="bi bi-box-seam"></i>';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var parts = dateStr.split('-');
    var year = parts[0];
    var month = parts[1] ? months[parseInt(parts[1], 10) - 1] : '';
    return month ? month + '. ' + year : year;
  }

  function renderCard(review) {
    var badge = getServiceBadge(review.service_type);
    var icon = getServiceIcon(review.service_type);
    var date = formatDate(review.review_date);
    var snippet = review.review_snippet ? escapeHtml(review.review_snippet) : '';
    var fullText = escapeHtml(review.review_text);

    // Bold the snippet within the full text if both exist
    var bodyHtml = '';
    if (snippet && fullText.length > snippet.length) {
      var idx = fullText.toLowerCase().indexOf(snippet.toLowerCase());
      if (idx !== -1) {
        bodyHtml = fullText.substring(0, idx) +
          '<strong>' + fullText.substring(idx, idx + snippet.length) + '</strong>' +
          fullText.substring(idx + snippet.length);
      } else {
        bodyHtml = '<strong>' + snippet + '</strong> ' + fullText;
      }
    } else {
      bodyHtml = fullText;
    }

    var html = '<div class="rc-card">';

    // Header: icon + name/date/badge
    html += '<div class="rc-header">';
    html += '<div class="rc-icon">' + icon + '</div>';
    html += '<div class="rc-info">';
    html += '<div class="rc-name">' + escapeHtml(review.reviewer_name) + '</div>';
    html += '<div class="rc-date">';
    if (badge) html += '<span class="rc-badge">' + badge + '</span> ';
    html += date + '</div>';
    html += '</div>';
    html += '</div>';

    // Stars
    html += '<div class="rc-stars">' + renderStars(review.rating) + '</div>';

    // Review body
    html += '<div class="rc-body">' + bodyHtml + '</div>';

    html += '</div>';
    return html;
  }

  function updateCardsPerView() {
    var w = window.innerWidth;
    if (w < 600) cardsPerView = 1;
    else if (w < 900) cardsPerView = 2;
    else cardsPerView = 3;
  }

  function maxIndex() {
    return Math.max(0, reviews.length - cardsPerView);
  }

  function scrollTo(idx) {
    currentIndex = Math.max(0, Math.min(idx, maxIndex()));
    var track = document.getElementById('rcTrack');
    if (!track) return;
    var card = track.children[0];
    if (!card) return;
    var cardW = card.offsetWidth + GAP;
    track.style.transform = 'translateX(-' + (currentIndex * cardW) + 'px)';
    updateArrows();
  }

  function updateArrows() {
    var prev = document.querySelector('.rc-prev');
    var next = document.querySelector('.rc-next');
    if (prev) prev.style.opacity = currentIndex <= 0 ? '0.3' : '1';
    if (next) next.style.opacity = currentIndex >= maxIndex() ? '0.3' : '1';
  }

  function next() {
    if (currentIndex < maxIndex()) scrollTo(currentIndex + 1);
    else scrollTo(0);
  }

  function prev() {
    if (currentIndex > 0) scrollTo(currentIndex - 1);
    else scrollTo(maxIndex());
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(next, AUTOPLAY_INTERVAL);
  }

  function stopAutoplay() {
    if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
  }

  function build(container) {
    if (!reviews.length) return;
    updateCardsPerView();

    var html = '<div class="rc-wrapper">';

    // Left arrow
    html += '<button class="rc-arrow rc-prev" aria-label="Previous"><i class="bi bi-chevron-left"></i></button>';

    // Viewport
    html += '<div class="rc-viewport">';
    html += '<div class="rc-track" id="rcTrack">';
    for (var i = 0; i < reviews.length; i++) {
      html += '<div class="rc-slide">' + renderCard(reviews[i]) + '</div>';
    }
    html += '</div></div>';

    // Right arrow
    html += '<button class="rc-arrow rc-next" aria-label="Next"><i class="bi bi-chevron-right"></i></button>';
    html += '</div>';

    container.innerHTML = html;

    // Size slides based on viewport
    sizeSlides();

    // Arrows
    container.querySelector('.rc-prev').addEventListener('click', function () { prev(); startAutoplay(); });
    container.querySelector('.rc-next').addEventListener('click', function () { next(); startAutoplay(); });

    // Pause on hover
    var wrapper = container.querySelector('.rc-wrapper');
    wrapper.addEventListener('mouseenter', stopAutoplay);
    wrapper.addEventListener('mouseleave', startAutoplay);

    // Touch swipe
    var startX = 0;
    var viewport = container.querySelector('.rc-viewport');
    viewport.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; stopAutoplay(); }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      var diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); }
      startAutoplay();
    }, { passive: true });

    updateArrows();
    startAutoplay();
  }

  function sizeSlides() {
    var viewport = document.querySelector('.rc-viewport');
    if (!viewport) return;
    var vw = viewport.offsetWidth;
    var slideW = (vw - GAP * (cardsPerView - 1)) / cardsPerView;
    var slides = document.querySelectorAll('.rc-slide');
    slides.forEach(function (s) {
      s.style.width = slideW + 'px';
      s.style.marginRight = GAP + 'px';
    });
  }

  function init() {
    var section = document.getElementById('reviews');
    if (!section) return;
    var container = document.getElementById('reviewsCarousel');
    if (!container) return;

    // Load stats
    fetch(API_BASE + '/stats')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var el = section.querySelector('.reviews-stats-badge');
        if (el && d.average_rating) {
          el.innerHTML =
            '<span class="reviews-stats-stars">' + renderStars(Math.round(d.average_rating)) + '</span>' +
            '<span class="reviews-stats-text">' + d.average_rating.toFixed(1) + ' from ' + d.total_reviews + ' Google Reviews</span>';
        }
      }).catch(function () {});

    // Load reviews
    fetch(API_BASE + '?featured=1&random=1&limit=12')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.reviews && d.reviews.length) {
          reviews = d.reviews;
          build(container);
        }
      }).catch(function (e) { console.error('Reviews load failed:', e); });

    // Resize
    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        updateCardsPerView();
        sizeSlides();
        scrollTo(Math.min(currentIndex, maxIndex()));
      }, 200);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
