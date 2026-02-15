// MI-BOX Houston — Reviews Carousel Component
// Fetches reviews from API and renders a carousel on the homepage

(function () {
  'use strict';

  var API_BASE = 'https://mibox-houston-api.cmykprnt.workers.dev/api/public/reviews';
  var AUTOPLAY_INTERVAL = 6000;
  var autoplayTimer = null;
  var currentSlide = 0;
  var reviews = [];
  var slidesPerView = 3;

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function renderStars(rating) {
    var html = '';
    for (var i = 0; i < 5; i++) {
      html += i < rating
        ? '<i class="bi bi-star-fill"></i>'
        : '<i class="bi bi-star"></i>';
    }
    return html;
  }

  function getServiceLabel(serviceType) {
    switch (serviceType) {
      case 'moving': return 'Moving';
      case 'storage': return 'Storage';
      case 'both': return 'Moving & Storage';
      case 'event': return 'Event Storage';
      default: return '';
    }
  }

  function renderReviewCard(review) {
    var displayText = review.review_snippet
      ? escapeHtml(review.review_snippet)
      : escapeHtml(review.review_text.length > 120
          ? review.review_text.substring(0, 120) + '...'
          : review.review_text);

    var fullText = escapeHtml(review.review_text);
    var needsReadMore = review.review_text.length > 120;
    var serviceLabel = getServiceLabel(review.service_type);
    var reviewId = 'review-' + review.id;

    var card = '<div class="review-card">';
    card += '<div class="review-card-stars">' + renderStars(review.rating) + '</div>';
    card += '<blockquote class="review-card-quote">"' + displayText + '"</blockquote>';

    if (needsReadMore) {
      card += '<div class="review-card-full" id="' + reviewId + '" style="display:none;">';
      card += '<p class="review-card-fulltext">"' + fullText + '"</p>';
      card += '</div>';
      card += '<button class="review-card-readmore" data-target="' + reviewId + '">Read full review</button>';
    }

    card += '<div class="review-card-meta">';
    card += '<span class="review-card-name">' + escapeHtml(review.reviewer_name) + '</span>';
    if (serviceLabel) {
      card += '<span class="review-card-service">' + serviceLabel + '</span>';
    }
    card += '</div>';
    card += '<div class="review-card-source">';
    card += '<svg class="google-icon" viewBox="0 0 24 24" width="16" height="16"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>';
    card += ' Google Review';
    card += '</div>';
    card += '</div>';

    return card;
  }

  function updateSlidesPerView() {
    var width = window.innerWidth;
    if (width < 768) {
      slidesPerView = 1;
    } else if (width < 992) {
      slidesPerView = 2;
    } else {
      slidesPerView = 3;
    }
  }

  function getMaxSlide() {
    return Math.max(0, reviews.length - slidesPerView);
  }

  function updateCarousel() {
    var track = document.getElementById('reviewsTrack');
    var dots = document.querySelectorAll('.reviews-dot');
    if (!track) return;

    var cardWidth = 100 / slidesPerView;
    track.style.transform = 'translateX(-' + (currentSlide * cardWidth) + '%)';

    dots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  function goToSlide(index) {
    var maxSlide = getMaxSlide();
    currentSlide = Math.max(0, Math.min(index, maxSlide));
    updateCarousel();
  }

  function nextSlide() {
    var maxSlide = getMaxSlide();
    currentSlide = currentSlide >= maxSlide ? 0 : currentSlide + 1;
    updateCarousel();
  }

  function prevSlide() {
    var maxSlide = getMaxSlide();
    currentSlide = currentSlide <= 0 ? maxSlide : currentSlide - 1;
    updateCarousel();
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(nextSlide, AUTOPLAY_INTERVAL);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function renderDots() {
    var maxSlide = getMaxSlide();
    var html = '';
    for (var i = 0; i <= maxSlide; i++) {
      html += '<button class="reviews-dot' + (i === 0 ? ' active' : '') + '" data-slide="' + i + '" aria-label="Go to slide ' + (i + 1) + '"></button>';
    }
    return html;
  }

  function buildCarousel(container) {
    if (reviews.length === 0) return;

    updateSlidesPerView();

    var html = '';

    // Carousel wrapper
    html += '<div class="reviews-carousel-wrapper">';
    html += '<button class="reviews-nav reviews-nav-prev" aria-label="Previous reviews"><i class="bi bi-chevron-left"></i></button>';
    html += '<div class="reviews-carousel-viewport">';
    html += '<div class="reviews-carousel-track" id="reviewsTrack">';

    for (var i = 0; i < reviews.length; i++) {
      html += '<div class="reviews-carousel-slide" style="min-width:' + (100 / slidesPerView) + '%;padding:0 8px;">';
      html += renderReviewCard(reviews[i]);
      html += '</div>';
    }

    html += '</div>';
    html += '</div>';
    html += '<button class="reviews-nav reviews-nav-next" aria-label="Next reviews"><i class="bi bi-chevron-right"></i></button>';
    html += '</div>';

    // Dots
    html += '<div class="reviews-dots">' + renderDots() + '</div>';

    container.innerHTML = html;

    // Event listeners
    var prevBtn = container.querySelector('.reviews-nav-prev');
    var nextBtn = container.querySelector('.reviews-nav-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { prevSlide(); startAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { nextSlide(); startAutoplay(); });

    container.querySelectorAll('.reviews-dot').forEach(function (dot) {
      dot.addEventListener('click', function () {
        goToSlide(parseInt(this.getAttribute('data-slide')));
        startAutoplay();
      });
    });

    // Read more buttons
    container.querySelectorAll('.review-card-readmore').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.getElementById(this.getAttribute('data-target'));
        var quote = this.previousElementSibling.previousElementSibling;
        if (target && target.style.display === 'none') {
          target.style.display = 'block';
          if (quote) quote.style.display = 'none';
          this.textContent = 'Show less';
        } else if (target) {
          target.style.display = 'none';
          if (quote) quote.style.display = 'block';
          this.textContent = 'Read full review';
        }
      });
    });

    // Pause on hover
    var wrapper = container.querySelector('.reviews-carousel-wrapper');
    if (wrapper) {
      wrapper.addEventListener('mouseenter', stopAutoplay);
      wrapper.addEventListener('mouseleave', startAutoplay);
    }

    // Touch swipe support
    var touchStartX = 0;
    var viewport = container.querySelector('.reviews-carousel-viewport');
    if (viewport) {
      viewport.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
        stopAutoplay();
      }, { passive: true });
      viewport.addEventListener('touchend', function (e) {
        var diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) nextSlide();
          else prevSlide();
        }
        startAutoplay();
      }, { passive: true });
    }

    startAutoplay();
  }

  function loadStats(container) {
    fetch(API_BASE + '/stats')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var statsEl = container.querySelector('.reviews-stats-badge');
        if (statsEl && data.average_rating) {
          statsEl.innerHTML =
            '<span class="reviews-stats-stars">' + renderStars(Math.round(data.average_rating)) + '</span>' +
            '<span class="reviews-stats-text">' + data.average_rating.toFixed(1) + ' from ' + data.total_reviews + ' Google Reviews</span>';
        }
      })
      .catch(function () {});
  }

  function init() {
    var section = document.getElementById('reviews');
    if (!section) return;

    var carouselContainer = document.getElementById('reviewsCarousel');
    if (!carouselContainer) return;

    loadStats(section);

    fetch(API_BASE + '?featured=1&random=1&limit=10')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.reviews && data.reviews.length > 0) {
          reviews = data.reviews;
          buildCarousel(carouselContainer);
        }
      })
      .catch(function (err) {
        console.error('Failed to load reviews:', err);
      });

    // Handle resize
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var oldPerView = slidesPerView;
        updateSlidesPerView();
        if (oldPerView !== slidesPerView) {
          currentSlide = 0;
          buildCarousel(carouselContainer);
        }
      }, 250);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
