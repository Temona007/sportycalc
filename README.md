# SportyCalc

SEO-optimized fitness calculator website for sportycalc.com.

## Structure,

```
/
├── index.html              # Home
├── about.html
├── sitemap.xml
├── robots.txt
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── calculators/
│   ├── index.html
│   ├── bmi-calculator.html
│   ├── bmr-calculator.html
│   ├── tdee-calculator.html
│   ├── calorie-calculator.html
│   ├── macro-calculator.html
│   ├── body-fat-calculator.html
│   ├── heart-rate-zones.html
│   ├── 1rm-calculator.html
│   ├── protein-intake.html
│   ├── water-intake.html
│   └── calories-burned.html
├── guides/
│   ├── index.html
│   ├── how-to-calculate-tdee.html
│   ├── macro-nutrition-guide.html
│   └── fitness-metrics-explained.html
└── blog/
    ├── index.html
    ├── weight-loss-calculation-tips.html
    ├── best-fitness-calculators-2026.html
    └── nutrition-vs-metabolism.html
```

## Tech Stack

- **HTML5, CSS3, Vanilla JS** — no build step
- **Chart.js** — add via CDN for charts (placeholder divs are in each calculator)
- **Mobile-first responsive** — dark theme, animations

## Running Locally

Serve the folder with any static server:

```bash
npx serve .
# or
python -m http.server 8000
```

Open `http://localhost:3000` (or 8000).

## Contact Form

The contact page uses [Formspree](https://formspree.io) for form submissions. To enable it:

1. Sign up at formspree.io
2. Create a new form
3. Replace `YOUR_FORMSPREE_ID` in `contact.html` with your form ID

## 404 Page

`404.html` is in the root. Most static hosts (Netlify, Vercel, GitHub Pages) serve it automatically for unknown URLs.

## Next Steps

1. **Add calculator logic** — Each calculator has a form + results panel; wire up JS for calculations.
2. **Add Chart.js** — Include `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>` and render charts in the `.chart-container` divs.
3. **Optional: localStorage** — Save results for progress tracking.
4. **Deploy** — Netlify, Vercel, or GitHub Pages. Configure sportycalc.com as custom domain.

## SEO

- Unique title + meta description per page
- Canonical URLs
- Schema.org WebApplication on calculator pages
- sitemap.xml + robots.txt included
- Cross-links between calculators, guides, and blog
