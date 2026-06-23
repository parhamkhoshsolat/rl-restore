// ============================================================================
// Client-side download helpers. downloadImage saves the restored PNG; build
// comparison card composites before/after + the metric summary onto a canvas so
// the presenter can share a single image. All client-side (no server round-trip).
// ============================================================================

import type { RestoreResponse } from '../api/types';
import { fmtDelta } from './format';

export function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Save the restored frame as a PNG (re-encodes data URLs, incl. SVG mocks). */
export async function downloadRestored(result: RestoreResponse) {
  const img = await loadImg(result.final_image);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || 1024;
  canvas.height = img.naturalHeight || 640;
  const ctx = canvas.getContext('2d');
  if (!ctx) return triggerDownload(result.final_image, 'restored.png');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  triggerDownload(canvas.toDataURL('image/png'), `rl-restore-${result.method}.png`);
}

/**
 * Build a shareable comparison card: before | after side-by-side with a header
 * (method + metric + gain). Returns a PNG data URL.
 */
export async function buildComparisonCard(
  result: RestoreResponse,
  before: string,
  methodLabel: string,
): Promise<string> {
  const [a, b] = await Promise.all([loadImg(before), loadImg(result.final_image)]);
  const cardW = 1280;
  const headerH = 116;
  const pad = 24;
  const cellW = (cardW - pad * 3) / 2;
  const ar = (a.naturalHeight || 10) / (a.naturalWidth || 16);
  const cellH = Math.round(cellW * ar);
  const cardH = headerH + cellH + pad * 2;

  const canvas = document.createElement('canvas');
  canvas.width = cardW;
  canvas.height = cardH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return result.final_image;

  // bg
  ctx.fillStyle = '#0B0E14';
  ctx.fillRect(0, 0, cardW, cardH);

  // header
  ctx.fillStyle = '#E6EAF2';
  ctx.font = '700 30px Inter, sans-serif';
  ctx.fillText('RL-Restore — step-by-step image restoration', pad, 50);
  ctx.fillStyle = '#9AA4B8';
  ctx.font = '500 18px Inter, sans-serif';
  const sign = result.summary.total_quality_delta >= 0 ? '+' : '';
  const gainTxt = `${methodLabel}  ·  ${result.quality_metric}  ·  ${sign}${result.summary.total_quality_delta.toFixed(
    2,
  )} dB  ·  ${result.summary.n_tool_steps} tool step${result.summary.n_tool_steps === 1 ? '' : 's'}`;
  ctx.fillText(gainTxt, pad, 84);

  // images
  const y = headerH;
  drawCover(ctx, a, pad, y, cellW, cellH);
  drawCover(ctx, b, pad * 2 + cellW, y, cellW, cellH);

  // labels
  roundLabel(ctx, 'BEFORE', pad + 12, y + 12, '#9AA4B8');
  roundLabel(ctx, 'AFTER', pad * 2 + cellW + 12, y + 12, '#C9D4FF');

  // delta chip bottom-right of after
  if (result.summary.total_quality_delta) {
    const txt = `${fmtDelta(result.summary.total_quality_delta)} dB`;
    roundLabel(ctx, txt, pad * 2 + cellW + cellW - 130, y + cellH - 46, '#B7F0D4', 'rgba(61,214,140,0.18)');
  }

  return canvas.toDataURL('image/png');
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, 12);
  ctx.clip();
  const iw = img.naturalWidth || w;
  const ih = img.naturalHeight || h;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
  ctx.strokeStyle = '#252C3B';
  ctx.lineWidth = 1;
  roundRectPath(ctx, x, y, w, h, 12);
  ctx.stroke();
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function roundLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  bg = 'rgba(8,11,18,0.7)',
) {
  ctx.font = '700 15px Inter, sans-serif';
  const w = ctx.measureText(text).width + 24;
  const h = 30;
  ctx.fillStyle = bg;
  roundRectPath(ctx, x, y, w, h, 15);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillText(text, x + 12, y + 20);
}
