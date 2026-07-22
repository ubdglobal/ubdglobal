// UBD Global scripts

(function () {
	var REVEAL_SELECTOR = '.founder-title, h2, h3, p, .placeholder-box';
	var STAGGER_MS = 140;

	var sections = document.querySelectorAll('section:not(#header):not(#hero)');

	sections.forEach(function (section) {
		var targets = section.querySelectorAll(REVEAL_SELECTOR);

		targets.forEach(function (el, index) {
			el.classList.add('reveal');
			el.style.transitionDelay = (index * STAGGER_MS) + 'ms';
		});
	});

	var observer = new IntersectionObserver(function (entries, obs) {
		entries.forEach(function (entry) {
			if (entry.isIntersecting) {
				entry.target.classList.add('in-view');
				obs.unobserve(entry.target);
			}
		});
	}, {
		threshold: 0.15,
		rootMargin: '0px 0px -10% 0px'
	});

	sections.forEach(function (section) {
		observer.observe(section);
	});

	var dividers = document.querySelectorAll('.section-divider');

	var dividerObserver = new IntersectionObserver(function (entries, obs) {
		entries.forEach(function (entry) {
			if (entry.isIntersecting) {
				entry.target.classList.add('in-view');
				obs.unobserve(entry.target);
			}
		});
	}, {
		threshold: 0.5
	});

	dividers.forEach(function (divider) {
		dividerObserver.observe(divider);
	});

	var heroMenu = document.querySelector('.hero-nav');
	var stickyNav = document.querySelector('.sticky-nav');

	if (heroMenu && stickyNav) {
		var heroObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				stickyNav.classList.toggle('is-visible', !entry.isIntersecting);
			});
		}, {
			threshold: 0
		});

		heroObserver.observe(heroMenu);
	}

	// Grayscale-to-color hover for Founder/About Us/Our Team photos: driven by
	// an explicit class instead of relying purely on CSS :hover, since Safari
	// on Mac trackpads can leave :hover "stuck" active after a tap/click, or
	// fail to engage it consistently.
	var colorHoverTargets = document.querySelectorAll('.founder-photo, .about-photo, .team-photo-full, #team .team-member');

	colorHoverTargets.forEach(function (el) {
		el.addEventListener('mouseenter', function () {
			el.classList.add('is-color');
		});
		el.addEventListener('mouseleave', function () {
			el.classList.remove('is-color');
		});
	});

	var wrap = document.querySelector('#team .team-track-wrap');
	var track = document.querySelector('#team .team-grid');
	var prevBtn = document.querySelector('#team .team-arrow-prev');
	var nextBtn = document.querySelector('#team .team-arrow-next');

	if (wrap && track && prevBtn && nextBtn) {
		var members = track.children;
		var currentIndex = 0;

		var itemStep = function () {
			if (!members.length) return 0;
			var itemWidth = members[0].getBoundingClientRect().width;
			var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0);
			return itemWidth + gap;
		};

		var maxIndex = function () {
			var step = itemStep();
			if (!step) return 0;
			var visibleCount = Math.floor(wrap.clientWidth / step);
			return Math.max(members.length - visibleCount, 0);
		};

		var update = function () {
			var max = maxIndex();
			if (currentIndex > max) currentIndex = max;
			var step = itemStep();
			track.style.transform = 'translateX(-' + (currentIndex * step) + 'px)';
			prevBtn.disabled = currentIndex <= 0;
			nextBtn.disabled = currentIndex >= max;
		};

		prevBtn.addEventListener('click', function () {
			currentIndex = Math.max(currentIndex - 1, 0);
			update();
		});

		nextBtn.addEventListener('click', function () {
			currentIndex = Math.min(currentIndex + 1, maxIndex());
			update();
		});

		window.addEventListener('resize', update);

		update();
	}

	var setupMarquee = function (marquee, track, secondsPerLoop, reverse) {
		if (!marquee || !track) return;

		var setWidth = 0;
		var x = 0;
		var isDragging = false;
		var dragPointerId = null;
		var dragStartClientX = 0;
		var dragStartX = 0;
		var lastTime = null;
		var speedPxPerSec;

		// x must always stay within (-setWidth, 0], regardless of direction:
		// the track's left edge then never sits right of the marquee's own
		// left edge (which would expose blank space), and the track (two
		// back-to-back copies, 2 * setWidth wide) always still overhangs the
		// right edge. Shifting x by a full setWidth is visually seamless
		// either way since both copies are identical - only the sign of the
		// per-frame delta below controls which direction it visually scrolls.
		var wrapX = function (value) {
			if (!setWidth) return 0;
			value = value % setWidth;
			if (value > 0) value -= setWidth;
			return value;
		};

		var measure = function () {
			setWidth = track.scrollWidth / 2;
			speedPxPerSec = setWidth / secondsPerLoop;
			x = wrapX(x);
		};

		var render = function () {
			track.style.transform = 'translateX(' + x + 'px)';
		};

		var step = function (timestamp) {
			if (lastTime === null) lastTime = timestamp;
			var dt = timestamp - lastTime;
			lastTime = timestamp;

			if (!isDragging) {
				var delta = (speedPxPerSec * dt) / 1000;
				x = wrapX(x + (reverse ? delta : -delta));
				render();
			}

			window.requestAnimationFrame(step);
		};

		track.addEventListener('pointerdown', function (e) {
			isDragging = true;
			dragPointerId = e.pointerId;
			dragStartClientX = e.clientX;
			dragStartX = x;
			track.classList.add('is-dragging');
			track.setPointerCapture(e.pointerId);
		});

		track.addEventListener('pointermove', function (e) {
			if (!isDragging || e.pointerId !== dragPointerId) return;
			x = wrapX(dragStartX + (e.clientX - dragStartClientX));
			render();
		});

		var endDrag = function (e) {
			if (!isDragging || e.pointerId !== dragPointerId) return;
			isDragging = false;
			dragPointerId = null;
			track.classList.remove('is-dragging');
		};

		track.addEventListener('pointerup', endDrag);
		track.addEventListener('pointercancel', endDrag);

		track.addEventListener('dragstart', function (e) {
			e.preventDefault();
		});

		window.addEventListener('resize', measure);
		window.addEventListener('load', measure);

		measure();
		render();
		window.requestAnimationFrame(step);
	};

	setupMarquee(document.querySelector('.clients-marquee'), document.querySelector('.clients-track'), 50);
	setupMarquee(document.querySelector('.awards-marquee'), document.querySelector('.awards-track'), 50, true);

	// Founder quote slideshow: cycles through quote 1 (3s) -> photos 1 (5s) ->
	// quote 3 (3s) -> photos 3 (5s) -> quote 4 (3s) -> photos 4 (5s) -> loop,
	// crossfading between each state. A quick tap/click jumps to the next
	// slide right away instead of waiting out the timer. Pressing and HOLDING
	// pauses the slideshow on the current slide - the auto-advance timer is
	// cleared on press-down and only resumes (without skipping ahead) once
	// released, so a held press never counts as a "next slide" click.
	var quoteSlideDurations = [3000, 5000, 3000, 5000, 3000, 5000];
	var QUOTE_HOLD_THRESHOLD_MS = 250;

	document.querySelectorAll('.quote-slideshow').forEach(function (slideshow) {
		var quoteSlides = slideshow.querySelectorAll('.quote-slide');

		if (quoteSlides.length > 1) {
			var quoteSlideIndex = 0;
			var quoteSlideTimer = null;
			var pressStartTime = null;

			var clearQuoteTimer = function () {
				if (quoteSlideTimer) {
					clearTimeout(quoteSlideTimer);
					quoteSlideTimer = null;
				}
			};

			var scheduleNext = function () {
				clearQuoteTimer();
				quoteSlideTimer = setTimeout(advanceQuoteSlide, quoteSlideDurations[quoteSlideIndex % quoteSlideDurations.length]);
			};

			var advanceQuoteSlide = function () {
				quoteSlides[quoteSlideIndex].classList.remove('is-active');
				quoteSlideIndex = (quoteSlideIndex + 1) % quoteSlides.length;
				quoteSlides[quoteSlideIndex].classList.add('is-active');
				scheduleNext();
			};

			slideshow.classList.add('is-clickable');
			slideshow.setAttribute('role', 'button');
			slideshow.setAttribute('tabindex', '0');
			slideshow.setAttribute('aria-label', 'Show next');

			slideshow.addEventListener('pointerdown', function () {
				pressStartTime = Date.now();
				clearQuoteTimer();
			});

			slideshow.addEventListener('pointerup', function () {
				if (pressStartTime === null) return;
				var heldFor = Date.now() - pressStartTime;
				pressStartTime = null;

				if (heldFor < QUOTE_HOLD_THRESHOLD_MS) {
					advanceQuoteSlide();
				} else {
					scheduleNext();
				}
			});

			var cancelPress = function () {
				if (pressStartTime === null) return;
				pressStartTime = null;
				scheduleNext();
			};

			slideshow.addEventListener('pointercancel', cancelPress);
			slideshow.addEventListener('pointerleave', cancelPress);

			slideshow.addEventListener('keydown', function (e) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					advanceQuoteSlide();
				}
			});

			scheduleNext();
		}
	});
})();
