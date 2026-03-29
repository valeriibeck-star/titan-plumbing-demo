/* Titan Plumbing Repair LLC — Scripts */

(function () {
  'use strict';

  // Scroll reveal with IntersectionObserver
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('revealed'); });
  }

  // Header scroll state
  var header = document.getElementById('header');
  var mobileCta = document.getElementById('mobileCta');
  var scrollTop = document.getElementById('scrollTop');
  var ticking = false;

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        var y = window.scrollY;
        header.classList.toggle('header--scrolled', y > 50);

        // Show mobile CTA after scrolling past hero
        if (mobileCta) {
          mobileCta.classList.toggle('visible', y > 600);
        }

        // Show scroll-to-top after 800px
        if (scrollTop) {
          scrollTop.classList.toggle('visible', y > 800);
        }

        ticking = false;
      });
      ticking = true;
    }
  });

  // Scroll to top button
  if (scrollTop) {
    scrollTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Mobile menu toggle
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  burger.addEventListener('click', function () {
    burger.classList.toggle('open');
    nav.classList.toggle('open');
  });

  // Close mobile menu on link click
  nav.querySelectorAll('.header__link').forEach(function (link) {
    link.addEventListener('click', function () {
      burger.classList.remove('open');
      nav.classList.remove('open');
    });
  });

  // Contact form — submit to Formspree with fetch, fallback to native submit
  var form = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');
  var submitBtn = document.getElementById('formSubmitBtn');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Show loading state
    var btnText = submitBtn.querySelector('.btn__text');
    var btnSpinner = submitBtn.querySelector('.btn__spinner');
    btnText.textContent = 'Sending...';
    btnSpinner.style.display = 'inline-flex';
    submitBtn.disabled = true;

    var formData = new FormData(form);

    fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    })
    .then(function (response) {
      if (response.ok) {
        // Show success message
        form.style.display = 'none';
        formSuccess.style.display = 'block';
      } else {
        throw new Error('Form submission failed');
      }
    })
    .catch(function () {
      // Reset button and show inline error
      btnText.textContent = 'Get My Free Estimate';
      btnSpinner.style.display = 'none';
      submitBtn.disabled = false;

      // Remove any existing error
      var existing = form.querySelector('.contact__error');
      if (existing) existing.remove();

      var errorDiv = document.createElement('div');
      errorDiv.className = 'contact__error';
      errorDiv.innerHTML = '<p>Something went wrong. Please call us directly at <a href="tel:7864879288">(786) 487-9288</a>.</p>';
      form.appendChild(errorDiv);
    });
  });

  // Animated counters on Why Us section
  var counterObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var text = el.textContent.trim();
          var match = text.match(/^(\d+)/);
          if (match) {
            var target = parseInt(match[1], 10);
            var suffix = text.replace(match[1], '');
            var duration = 1500;
            var start = performance.now();

            function animate(now) {
              var progress = Math.min((now - start) / duration, 1);
              var eased = 1 - Math.pow(1 - progress, 3);
              el.textContent = Math.floor(target * eased) + suffix;
              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                el.textContent = target + suffix;
              }
            }
            requestAnimationFrame(animate);
          }
          counterObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll('.why-us__number').forEach(function (el) {
    // Only animate elements that contain numbers
    if (/^\d/.test(el.textContent.trim())) {
      counterObserver.observe(el);
    }
  });

})();
