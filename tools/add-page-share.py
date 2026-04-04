#!/usr/bin/env python3
"""One-off helper to embed page-share blocks (already applied in repo)."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SHARE_CALC = r"""    <section class="page-share-section page-share-section--after-calculator" data-page-share aria-labelledby="page-share-heading">
      <h2 id="page-share-heading" class="page-share-heading">Share this calculator</h2>
      <p class="page-share-desc">Tell others about this free SportyCalc tool.</p>
      <div class="page-share-buttons" role="group" aria-label="Share options">
        <button type="button" class="page-share-btn" id="page-share-copy">
          <span class="page-share-btn-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </span>
          Copy link
        </button>
        <a class="page-share-btn page-share-external" id="page-share-fb" href="#" target="_blank" rel="noopener noreferrer">
          <span class="page-share-btn-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </span>
          Facebook
        </a>
        <a class="page-share-btn page-share-external" id="page-share-x" href="#" target="_blank" rel="noopener noreferrer">
          <span class="page-share-btn-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </span>
          X
        </a>
        <button type="button" class="page-share-btn" id="page-share-instagram" title="Opens share sheet on supported phones (choose Instagram), or copies text to paste in the app">
          <span class="page-share-btn-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </span>
          Instagram
        </button>
        <a class="page-share-btn page-share-external" id="page-share-email" href="#">
          <span class="page-share-btn-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </span>
          Email
        </a>
      </div>
      <p id="page-share-status" class="page-share-status" role="status" aria-live="polite"></p>
    </section>
"""

SHARE_QUIZ = SHARE_CALC.replace("Share this calculator", "Share this quiz").replace(
    "Tell others about this free SportyCalc tool.",
    "Tell friends about this SportyCalc quiz.",
)


def add_script_calc(text):
    if "page-share.js" in text:
        return text
    text = text.replace(
        '<script src="../js/theme.js"></script>',
        '<script src="../js/theme.js"></script>\n  <script src="../js/page-share.js"></script>',
        1,
    )
    return text


def add_script_quiz_root(text):
    if "page-share.js" in text:
        return text
    text = text.replace(
        '<script src="js/theme.js"></script>',
        '<script src="js/theme.js"></script>\n  <script src="js/page-share.js"></script>',
        1,
    )
    return text


def insert_before_main_close(text, block):
    marker = "  </main>"
    idx = text.rfind(marker)
    if idx == -1:
        return text, False
    return text[:idx] + block + "\n" + text[idx:], True


def main():
    # BMI: replace old block + script
    bmi = ROOT / "calculators" / "bmi-calculator.html"
    t = bmi.read_text(encoding="utf-8")
    if "data-page-share" not in t or "bmi-share-copy" in t:
        t = re.sub(
            r"<section class=\"page-share-section[^>]*>.*?</section>\s*",
            SHARE_CALC + "\n",
            t,
            count=1,
            flags=re.DOTALL,
        )
        t = t.replace("bmi-share.js", "page-share.js")
        bmi.write_text(t, encoding="utf-8")
        print("Updated bmi-calculator.html")

    # Other calculators (not index): before related-section
    for path in sorted((ROOT / "calculators").glob("*.html")):
        if path.name in ("index.html", "bmi-calculator.html"):
            continue
        t = path.read_text(encoding="utf-8")
        if "data-page-share" in t:
            continue
        if '<div class="related-section">' not in t:
            print("SKIP no related-section:", path.name)
            continue
        t = t.replace(
            "    <div class=\"related-section\">",
            SHARE_CALC + "\n    <div class=\"related-section\">",
            1,
        )
        t = add_script_calc(t)
        path.write_text(t, encoding="utf-8")
        print("OK", path.name)

    # calculators/index.html
    idx_path = ROOT / "calculators" / "index.html"
    t = idx_path.read_text(encoding="utf-8")
    if "data-page-share" not in t:
        t, ok = insert_before_main_close(t, SHARE_CALC)
        if ok:
            t = add_script_calc(t)
            idx_path.write_text(t, encoding="utf-8")
            print("OK calculators/index.html")
        else:
            print("FAIL calculators/index.html")

    # fitness-quiz.html (root)
    fq = ROOT / "fitness-quiz.html"
    t = fq.read_text(encoding="utf-8")
    if "data-page-share" not in t:
        t, ok = insert_before_main_close(t, SHARE_QUIZ)
        if ok:
            t = add_script_quiz_root(t)
            fq.write_text(t, encoding="utf-8")
            print("OK fitness-quiz.html")
        else:
            print("FAIL fitness-quiz.html")

    # fitness-quiz/*.html
    for path in sorted((ROOT / "fitness-quiz").glob("*.html")):
        t = path.read_text(encoding="utf-8")
        if "data-page-share" in t:
            continue
        t, ok = insert_before_main_close(t, SHARE_QUIZ)
        if not ok:
            print("FAIL", path.name)
            continue
        t = add_script_calc(t)
        path.write_text(t, encoding="utf-8")
        print("OK", path)


if __name__ == "__main__":
    main()
