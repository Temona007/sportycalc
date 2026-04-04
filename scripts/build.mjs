/**
 * Minify css/styles.css and js/*.js, write *.min.* outputs,
 * then point all *.html at minified assets and add defer to non-GA script tags.
 * Google Analytics (gtag) and AdSense script tags are left unchanged.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify as terserMinify } from 'terser';
import CleanCSS from 'clean-css';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function walkHtml(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (f.name === 'node_modules') continue;
      out.push(...walkHtml(p));
    } else if (f.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function patchHtml(content) {
  let c = content.replace(/\bstyles\.css\b/g, 'styles.min.css');

  const jsDir = path.join(root, 'js');
  const jsFiles = fs
    .readdirSync(jsDir)
    .filter((f) => f.endsWith('.js') && !f.endsWith('.min.js'))
    .sort((a, b) => b.length - a.length);

  for (const jf of jsFiles) {
    const re = new RegExp(`(src=["'])(\\.\\./)?js/${escapeRegex(jf)}(["'])`, 'g');
    c = c.replace(re, `$1$2js/${jf.replace(/\.js$/, '.min.js')}$3`);
  }

  const lines = c.split('\n');
  const patched = lines.map((line) => {
    const t = line.trimStart();
    if (!t.startsWith('<script')) return line;
    if (!t.includes('src=')) return line;
    if (t.includes('googletagmanager') || t.includes('adsbygoogle') || t.includes('pagead2.googlesyndication')) {
      return line;
    }
    if (/\basync\b/.test(t)) return line;
    if (/\bdefer\b/.test(t)) return line;
    return line.replace(/<script\s+/, '<script defer ');
  });

  return patched.join('\n');
}

async function main() {
  const stylesPath = path.join(root, 'css', 'styles.css');
  const stylesSrc = fs.readFileSync(stylesPath, 'utf8');
  const minCss = new CleanCSS({}).minify(stylesSrc).styles;
  fs.writeFileSync(path.join(root, 'css', 'styles.min.css'), minCss);
  console.log('Wrote css/styles.min.css');

  const jsDir = path.join(root, 'js');
  const sources = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js') && !f.endsWith('.min.js'));

  for (const f of sources) {
    const srcPath = path.join(jsDir, f);
    const code = fs.readFileSync(srcPath, 'utf8');
    const result = await terserMinify(code, {
      compress: true,
      mangle: true,
    });
    if (result.error) throw result.error;
    const outName = f.replace(/\.js$/, '.min.js');
    fs.writeFileSync(path.join(jsDir, outName), result.code);
    console.log(`Wrote js/${outName}`);
  }

  const htmlFiles = walkHtml(root);
  let htmlChanged = 0;
  for (const htmlPath of htmlFiles) {
    const raw = fs.readFileSync(htmlPath, 'utf8');
    const next = patchHtml(raw);
    if (next !== raw) {
      fs.writeFileSync(htmlPath, next);
      htmlChanged++;
    }
  }
  if (htmlChanged) console.log(`Updated ${htmlChanged} HTML file(s) (paths + defer).`);
  else console.log('HTML already references minified assets; no HTML changes.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
