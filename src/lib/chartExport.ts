// Download a chart as SVG or PNG. Styles come from CSS classes, so the computed colours are
// copied inline first; otherwise the file would open blank in other apps.
const PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'font-size', 'font-family', 'font-weight'];

function inlineStyles(source: SVGSVGElement): SVGSVGElement {
  const clone = source.cloneNode(true) as SVGSVGElement;
  const src = [source, ...source.querySelectorAll('*')];
  const dst = [clone, ...clone.querySelectorAll('*')];
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const style = PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';');
    (dst[i] as SVGElement).setAttribute('style', style);
  });
  const bg = getComputedStyle(document.body).backgroundColor;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.style.background = bg;
  return clone;
}

function download(url: string, name: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFileName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'chart';
}

export async function exportChart(svg: SVGSVGElement, name: string, format: 'svg' | 'png') {
  const clone = inlineStyles(svg);
  const text = new XMLSerializer().serializeToString(clone);
  const svgUrl = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
  if (format === 'svg') return download(svgUrl, `${safeFileName(name)}.svg`);
  const vb = svg.viewBox.baseVal;
  const scale = 2;
  const img = new Image();
  img.src = svgUrl;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = vb.width * scale;
  canvas.height = vb.height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(svgUrl);
  canvas.toBlob((b) => b && download(URL.createObjectURL(b), `${safeFileName(name)}.png`), 'image/png');
}
