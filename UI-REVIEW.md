# UI-REVIEW.md — Titan Plumbing Repair LLC

**Audited:** 2026-03-29
**Source:** Code review + Playwright screenshots (desktop 1440x900, tablet 768x1024, mobile 375x812)
**Benchmark:** $10,000 local service business website

---

## Overall Score: 2.7 / 4.0

| Pillar | Score | Verdict |
|--------|-------|---------|
| 1. Copywriting | 3.5 / 4 | PASS |
| 2. Visuals | 2.5 / 4 | FLAG |
| 3. Color | 3.0 / 4 | PASS |
| 4. Typography | 2.5 / 4 | FLAG |
| 5. Spacing | 2.5 / 4 | FLAG |
| 6. Experience Design | 2.0 / 4 | BLOCK |

---

## Pillar 1: Copywriting — 3.5 / 4

**What's working:**
- Hero headline "South Florida's Most Dependable Plumber" is strong and specific — not generic
- Trust badge "4.9 Stars on Google — 158+ Reviews" above the fold is great social proof placement
- "No gimmicks — just honest work and fair pricing" pulls directly from real reviews — authentic voice
- Service descriptions are concrete, not fluffy ("Burst pipe at 2AM? We answer the phone.")
- Testimonials feel real and mention specific names (Scott, Aaron, Andres) — builds trust
- CTA hierarchy is correct: primary = Call, secondary = Schedule Online
- "No Gimmicks. Just Good Old-Fashioned Customer Service." is the brand's actual tagline — smart

**Issues:**
- **CTA "Send Request" on form is weak.** Should be benefit-oriented: "Get My Free Estimate" or "Request Free Quote"
- **"Schedule Online" CTA is vague** — customer doesn't know what happens. "Book a 15-Min Call" is more specific (matches the Calendly link itself)
- **No urgency language on emergency CTA banner.** "Don't wait" is passive. Could be "Pipe burst? We can be there in under an hour."
- **Section label "What We Do" is generic.** Consider "Our Plumbing Services" for SEO value
- **No error state copy on the form** — if validation fails, user sees browser default tooltips
- **No empty state for service selector** — the "Select a service..." placeholder is fine but the dropdown has no "Not sure" option for confused emergency callers
- **Footer "All rights reserved" is legal boilerplate that adds nothing** — could add license number instead for trust

**Grade rationale:** Copy is clearly written by someone who studied the reviews and brand voice. Above average for local service sites. Loses points on CTA specificity and missing error/edge-case copy.

---

## Pillar 2: Visuals — 2.5 / 4

**What's working:**
- Navy + gold palette reads as "premium trade" — appropriate for the business
- Hero background image with gradient overlay is standard but effective
- Service card icons are consistent (Lucide-style SVGs, gold on light gold background)
- Testimonial cards have a clean author section with avatar initials
- Google Maps embed in service area section is a good functional element
- CTA banner with navy background creates visual rhythm break

**Issues:**
- **CRITICAL: No visual focal point beyond the hero.** Every section below the fold is text-on-white-cards or text-on-navy. There are ZERO images below the hero. No photos of the team, trucks, job sites, before/after work. For a $10K plumbing site, this is unacceptable — it looks like a template.
- **Service cards are a flat 3x2 grid with no hierarchy.** All 6 look identical. Emergency Service should be visually promoted (different background, badge, or larger card) since it's the highest-intent service.
- **Testimonials grid is 3x2 = 6 identical cards.** No visual hierarchy. A featured/larger testimonial + smaller supporting ones would create a focal point. 6 same-size cards is a wall.
- **"Why Us" section is 4 identical cards on navy.** The numbers (40+, 24/7, icon, $) create some variety but it still reads flat. Counter animation would help.
- **Hero background image (`photo-1585704032915`) is generic stock** — looks like decorative hardware, not a plumber at work. The alt text says "Professional plumber at work" but the image doesn't match.
- **No favicon defined** — browser tab shows generic icon
- **No visual dividers or decorative elements between sections** — the alternating white/gray-50/navy backgrounds do the work but it's minimal
- **CTA banner section has no padding-top/bottom on the `<section>`** — it's a floating element that feels disconnected from the page flow (the `padding: 0` on `.cta-banner`)
- **Footer logo reuses `.header__logo-icon` and `.header__logo-name` classes** — works visually but semantically sloppy

**Grade rationale:** Clean and professional but generic. Zero imagery below the fold is the single biggest visual gap. A $10K site would have team photos, truck wraps, job completion shots — proof this is a real company with real people.

---

## Pillar 3: Color — 3.0 / 4

**What's working:**
- Design tokens are well-defined in `:root` with logical naming (navy, gold, gray scale)
- Navy `#1a2744` + Gold `#d4a853` is a strong, differentiated palette — not default Bootstrap
- Gold accent is used consistently: badges, icons, section labels, button backgrounds, hover states
- Three-tier background strategy (white → gray-50 → navy) creates clear section boundaries
- Link gold `#d4a853` on white backgrounds provides adequate contrast for large text

**Issues:**
- **Gold `#d4a853` on white fails WCAG AA for body text.** Contrast ratio is ~3.2:1 (needs 4.5:1). Used on `.section-label`, `.text-gold` in headings, contact info links. The section labels are small (0.8rem uppercase) making this worse.
- **White text `rgba(255, 255, 255, 0.75)` on navy in hero subtitle** — contrast ratio ~6.5:1 is fine for large text but the 0.75 opacity makes it feel washed out. Could be 0.85 for better readability without losing hierarchy.
- **Footer text at `rgba(255, 255, 255, 0.35)`** — this is 2.2:1 contrast ratio. The copyright line is nearly invisible. Fails WCAG AA and AAA.
- **Footer links at `rgba(255, 255, 255, 0.5)`** — contrast ratio ~3.5:1. Fails AA for the 0.9rem text size.
- **Gold button `#d4a853` with navy text `#1a2744`** — contrast is ~4.8:1, barely passes AA. The hover state `#e4c07a` (gold-light) drops this further.
- **No dark mode consideration.** Not required but would be a premium touch.
- **`.btn--outline` and `.btn--outline-light` are visually identical** — redundant color definitions

**Grade rationale:** Strong palette choice that avoids generic territory. Loses a full point on contrast failures — the footer is nearly unreadable, and gold-on-white accessibility issues are throughout.

---

## Pillar 4: Typography — 2.5 / 4

**What's working:**
- Inter is a solid, professional choice — appropriate for the industry
- Hero title uses `clamp(2.5rem, 6vw, 4rem)` for fluid sizing — good technique
- Section titles use `clamp(2rem, 4vw, 2.75rem)` — consistent approach
- Font weights span 400–900 with clear hierarchy (900 hero, 800 section titles, 700 card titles, 600 buttons, 500 nav)
- Letter-spacing `-0.02em` on headlines tightens display type appropriately
- Line-height 1.6 on body, 1.1 on hero title, 1.7 on descriptions — varied correctly

**Issues:**
- **Only one font family.** Inter handles everything from hero to body to labels. A $10K site would pair a display font (e.g., Outfit, Plus Jakarta Sans, or even a serif like Playfair) for headlines with Inter for body. Single-font sites read as templates.
- **Section label `.section-label` at 0.8rem uppercase with 2px letter-spacing is too small on mobile.** At 375px it's roughly 11px — below comfortable reading threshold for uppercase text.
- **`.service-card__desc` at 0.925rem and `.testimonial-card__text` at 0.95rem are nearly the same size** — these should be more differentiated or identical, not 0.025rem apart.
- **Footer heading `h4` at 0.875rem uppercase** — same size as form labels. Footer headings should be slightly larger to establish column hierarchy.
- **No `font-display: swap` on the Google Fonts link** — actually it uses `display=swap` in the URL which is correct. But there's no fallback font-size adjustment for the FOUT gap.
- **Hero badge text at 0.875rem is the same size as button text `.btn--sm`** — should be smaller (0.75-0.8rem) to feel like a label, not a button.
- **Mobile hero title drops to 1.875rem at 480px** — this is only ~30px, which is small for a hero headline. Should stay at 2rem minimum.

**Grade rationale:** Technically competent single-font implementation. Loses points for lack of typographic personality (one font = template feel) and several size inconsistencies that blur the hierarchy.

---

## Pillar 5: Spacing — 2.5 / 4

**What's working:**
- Consistent section padding of `100px 0` desktop, `72px 0` mobile — good rhythm
- Container at `max-width: 1200px` with `24px` side padding is standard
- Card padding is consistent: service cards `36px 28px`, testimonial cards `32px`, contact form `40px`
- Grid gaps are uniform `24px` across services, testimonials, why-us sections
- `section-header` with `margin-bottom: 64px` (desktop) / `48px` (mobile) maintains breathing room

**Issues:**
- **CTA banner section has `padding: 0`** — creates a jarring break in the vertical rhythm. The banner floats between service-area (100px padding) and contact (100px padding) with no breathing room above/below. Should have at least `48px 0` to maintain flow.
- **Hero badge `margin-bottom: 24px` → title `margin-bottom: 20px` → subtitle `margin-bottom: 36px` → CTA `margin-bottom: 48px`** — the spacing progression is inconsistent. Should be a clear scale (16, 24, 32, 48) not (24, 20, 36, 48).
- **Service card icon `margin-bottom: 20px` → title `margin-bottom: 8px`** — the 20→8 jump is too dramatic. Icon to title should be 16px, title to description should be 8px.
- **`.form-group` at `margin-bottom: 20px` means the last form group before the button has 20px bottom margin** — this stacks with the button's own spacing, creating uneven rhythm. Last child should have 0 margin.
- **Container padding drops from `24px` to `16px` at 480px** — this is fine but means the CTA banner inner (which has its own `padding: 40px 24px` mobile) has different effective side spacing than the content above/below it.
- **Testimonials grid at mobile is single column** — 6 full-width testimonial cards stacked creates an extremely long scroll. Should cap at 3 with a "Read more reviews" link.
- **Footer columns at mobile go single-column with `gap: 32px`** — adequate but the brand section's `.footer__desc` max-width of 300px looks orphaned at full mobile width.
- **Why-us cards have `padding: 40px 20px`** — the vertical padding is double the horizontal. At mobile (single column), the cards become wide rectangles with cramped sides.

**Grade rationale:** Base spacing system is solid but breaks down at transitions. The CTA banner zero-padding is the most visible issue. Several small inconsistencies add up to a "close but not polished" feel.

---

## Pillar 6: Experience Design — 2.0 / 4

**What's working:**
- Scroll reveal animations with IntersectionObserver are smooth and performant
- `prefers-reduced-motion: reduce` is respected — accessibility win
- Header scroll state (`header--scrolled`) adds shadow on scroll — subtle, professional
- Mobile burger menu toggles correctly with X animation on open
- Smooth scroll with `scroll-padding-top: 80px` accounts for fixed header
- Click-to-call links work on mobile — critical for a plumbing emergency site
- Google Maps embed has lazy loading

**Issues:**
- **CRITICAL: Form submission is fake.** The `contactForm` handler does `e.preventDefault()`, shows "Sent! We'll be in touch." for 3 seconds, then resets. **No data goes anywhere.** This is a business site where leads = revenue. This needs a real backend (Formspree, Netlify Forms, or even a mailto fallback) immediately.
- **CRITICAL: No form validation feedback.** Browser default `required` tooltips only. No inline error messages, no red borders on invalid fields. A user filling out the form on mobile gets a cryptic browser popup if they miss a field.
- **No loading state on form submit** — button instantly changes to "Sent!" with no spinner or transition. Feels broken, not deliberate.
- **No success state for form submission** — the button text changes but the form doesn't show a proper success message. User might not even notice the button text change.
- **Hero background image loads eagerly (`loading="eager"`)** — correct, but the Unsplash URL loads a 1600px wide image on all devices. No `srcset` or responsive image handling. On mobile this is a ~200KB image that could be 50KB.
- **No 404/error page** — if someone hits a bad URL, they get nothing
- **No skip-to-content link** — keyboard/screen reader users can't bypass the header nav
- **Mobile nav doesn't trap focus** — when burger menu is open, tab key can reach elements behind the overlay
- **Calendly links open in new tab (`target="_blank"`)** — correct behavior, and `rel="noopener"` is present (good), but no visual indicator that the link opens externally
- **No scroll-to-top button** — page is very long, especially on mobile where all 6 testimonials stack. User has to scroll all the way back up to call.
- **No sticky mobile CTA** — on a plumbing emergency site, the phone number disappears after scrolling past the hero. A sticky bottom bar with "Call Now" on mobile would dramatically improve conversion.
- **Counter numbers (40+, 24/7) are static** — animated counters on scroll would add life to the "Why Us" section
- **Google Maps iframe has no fallback** — if it fails to load, the right column is just empty space
- **Testimonial section has no link to Google Reviews** — "See all reviews on Google" would add credibility
- **No WhatsApp or text option** — South Florida has a large demographic that prefers texting/WhatsApp over calling

**Grade rationale:** The biggest issue is the fake form — this site cannot generate leads in its current state. Combined with no mobile sticky CTA, no form validation UX, and no error handling, the experience layer is well below a $10K standard. The scroll animations and responsive layout are solid foundations, but the interactive/functional layer is incomplete.

---

## Top 3 Priority Fixes

### 1. CRITICAL — Wire Up the Contact Form (Experience)
The form literally throws away every lead. Connect it to Formspree (`https://formspree.io/f/{id}`), Netlify Forms, or at minimum a `mailto:` action. Add proper validation states (red borders, inline error messages), a loading spinner on submit, and a clear success message that replaces the form. **This is the single highest-ROI fix on the entire site.**

### 2. HIGH — Add Below-the-Fold Imagery (Visuals)
The site has zero images below the hero. Add:
- A photo of the team/owner in the "Why Us" section (owner-operated claim needs a face)
- Before/after job photos in the services section or a gallery strip
- A branded truck or at-work photo near the CTA banner

Without these, the site looks like a template. Real photos = trust = conversions.

### 3. HIGH — Add Sticky Mobile CTA (Experience)
On mobile, the phone number disappears after the hero. Add a fixed bottom bar with "Call (786) 487-9288" that appears after scrolling past the hero. This is standard for every $10K+ local service site. Emergency plumbing searches happen on phones — the call button must always be reachable.

---

## Additional Fixes (Prioritized)

| Priority | Pillar | Fix |
|----------|--------|-----|
| High | Color | Fix gold-on-white contrast failures — darken section labels to `#b8923f` or use navy |
| High | Color | Fix footer text contrast — bump copyright to `rgba(255,255,255,0.5)`, links to `0.7` |
| Medium | Copy | Change "Send Request" → "Get My Free Estimate" on form button |
| Medium | Copy | Change "Schedule Online" → "Book a 15-Min Call" on CTAs |
| Medium | Typography | Add display font for headings (Outfit or Plus Jakarta Sans) alongside Inter body |
| Medium | Spacing | Add `padding: 48px 0` to `.cta-banner` section |
| Medium | Experience | Cap mobile testimonials at 3, add "See all 158+ reviews on Google" link |
| Medium | Experience | Add scroll-to-top button |
| Medium | Visuals | Promote Emergency Service card visually (gold border, larger, badge) |
| Low | Experience | Add animated counters on the "Why Us" numbers |
| Low | Typography | Fix hero badge size (0.75rem not 0.875rem) |
| Low | Experience | Add `srcset` for hero image (800w mobile, 1200w tablet, 1600w desktop) |
| Low | Experience | Add skip-to-content link for accessibility |
| Low | Visuals | Add favicon (gold "T" on navy square) |

---

## Screenshots

- `screenshots/desktop-1440x900.png` — Desktop viewport
- `screenshots/mobile-375x812.png` — Mobile viewport
- `screenshots/tablet-768x1024.png` — Tablet viewport

---

*Audit conducted via code review and Playwright visual capture. Scored against $10,000 local service business website standard.*
