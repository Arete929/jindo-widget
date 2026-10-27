/* 파일명: pmmake.js | @version 1.0.0
   품의 도우미(도구상자) — 품의 서류 묶음을 만든다 (메인 프로세스).
     ① 품목내역.xls — 학교 양식(assets/품목내역_틀.xls)의 틀을 그대로 두고 줄만 채운다(xlsfill.js)
     ② 견적서.pdf   — 1쪽: 제목·구입 금액·구입 방법·구입처별 표 / 이어서 붙인 장바구니 캡처 쪽 / 업체 견적서 PDF 를 그대로 이어 붙임
     ③ 전자기안문.txt — 화면에서 만든 본문
   견적서 1쪽은 HTML → printToPDF 로 만든다(맑은 고딕이 그대로 들어가 한글이 깨지지 않는다). */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const { fillTemplate } = require('./xlsfill');

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const won = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
function ko(n) {
  n = Math.round(n); if (n <= 0) return '영';
  const dg = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'], un = ['', '십', '백', '천'], bg = ['', '만', '억', '조'];
  let out = '', gi = 0;
  while (n > 0) { const g = n % 10000; n = Math.floor(n / 10000); if (g) { let t = ''; for (let i = 0; i < 4; i++) { const d = Math.floor(g / Math.pow(10, i)) % 10; if (d) t = dg[d] + un[i] + t; } out = t + bg[gi] + out; } gi++; }
  return out;
}
const money = (v) => { const n = Number(String(v == null ? '' : v).replace(/[,\s원]/g, '')); return isFinite(n) && n > 0 ? Math.round(n) : 0; };

/* 화면에서 받은 묶음 → 정리(빈 줄·0원 줄 덜기, 합계 계산) */
function normalize(m) {
  const groups = (m.groups || []).map((g) => {
    const rows = (g.rows || []).map((r) => ({ n: String(r.n || '').trim(), q: money(r.q) || (money(r.p) && String(r.n || '').trim() ? 1 : 0), p: money(r.p) }))
      .filter((r) => r.n && r.q && r.p).map((r) => Object.assign(r, { amt: r.q * r.p }));
    const kind = ['shop', 'vendor', 'fee', 'reserve'].indexOf(g.kind) >= 0 ? g.kind : 'shop';
    return { kind, name: String(g.name || '').trim(), rows, sub: rows.reduce((a, r) => a + r.amt, 0), attach: Array.isArray(g.attach) ? g.attach : [] };
  }).filter((g) => g.rows.length);
  return { groups, total: groups.reduce((a, g) => a + g.sub, 0) };
}
const gLabel = (g) => g.kind === 'shop' ? ['인터넷쇼핑', g.name ? '(' + g.name + ')' : ''] : g.kind === 'vendor' ? ['업체결제', g.name ? '(' + g.name + ')' : ''] : g.kind === 'fee' ? ['협의회비', ''] : ['예비비', ''];
const gTitle = (g) => gLabel(g).join('');
/* 구입 방법 줄 */
function methodLine(n) {
  const parts = n.groups.map((g) => (g.kind === 'shop' || g.kind === 'vendor' ? gTitle(g) : g.kind === 'reserve' ? (g.rows.length === 1 ? g.rows[0].n : '예비비') : '협의회비') + ' ￦' + won(g.sub));
  return parts.join(' + ') + ' = ￦' + won(n.total);
}

const PALETTE = {
  shop: { bg: '#e9f5ec', fg: '#1b7a3e' },
  v0: { bg: '#fff1e2', fg: '#b45f06' }, v1: { bg: '#e3eafa', fg: '#27479a' }, v2: { bg: '#f3e8fb', fg: '#7a2ea0' }, v3: { bg: '#e0f3f4', fg: '#136b72' }
};
function pageCss() {
  return '@page{size:A4;margin:15mm 14mm}*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:"Malgun Gothic","맑은 고딕",sans-serif;color:#111;font-size:11pt}'
    + '.pg{page-break-after:always}.pg:last-child{page-break-after:auto}h1{font-size:15pt;margin:0 0 9pt;font-weight:800}.l1{font-size:12.5pt;font-weight:800;margin:0 0 9pt}.l2{font-size:10.5pt;font-weight:700;line-height:1.5;margin:0 0 14pt}'
    + 'table{width:100%;border-collapse:collapse;font-size:9.5pt}th{background:#000;color:#fff;font-weight:700;padding:6pt 4pt;border:1px solid #000}td{padding:5pt 6pt;border-bottom:1px solid #d9d9d9;vertical-align:middle}'
    + 'td.c{text-align:center;font-weight:800;border-right:1px solid #d9d9d9;width:17%;font-size:9pt}td.n{text-align:right;white-space:nowrap}.sub td{font-weight:800;border-top:1.5px solid;border-bottom:1.5px solid}.sub td.n{font-size:10.5pt}'
    + '.gr{color:#777;font-size:8pt}.tot td{background:#000;color:#fff;font-weight:800;font-size:11.5pt;text-align:center;padding:9pt}.tot td.n{text-align:right}.fe td.c{background:#f0f0f0;color:#222}'
    + '.cap{text-align:center}.cap img{max-width:100%;max-height:200mm;object-fit:contain;border:1px solid #e3e3e3}';
}
function headHtml(biz, total, method) {
  return '<h1>' + esc(biz) + ' 품의 견적서</h1><div class="l1">- 구입 금액 : 금 ' + won(total) + '원(금' + ko(total) + '원)</div>'
    + '<div class="l2">- 구입 방법 : ' + esc(method) + '</div>';
}
function tableHtml(n) {
  let vi = 0, h = '<table><thead><tr><th>구입처</th><th>품명</th><th style="width:9%">수량</th><th style="width:14%">단가</th><th style="width:15%">금액</th></tr></thead><tbody>';
  const nm = (s) => { const m = String(s).match(/^(배송비|협의회비)\s*(\(.*\))$/); return m ? esc(m[1]) + ' <span class="gr">' + esc(m[2]) + '</span>' : esc(s); };
  n.groups.forEach((g) => {
    const lab = gLabel(g), col = g.kind === 'shop' ? PALETTE.shop : g.kind === 'vendor' ? PALETTE['v' + (vi++ % 4)] : null;
    const span = g.rows.length + (g.kind === 'shop' || g.kind === 'vendor' ? 1 : 0);
    g.rows.forEach((r, i) => {
      h += '<tr' + (g.kind === 'fee' || g.kind === 'reserve' ? ' class="fe"' : '') + '>';
      if (i === 0) h += '<td class="c" rowspan="' + span + '"' + (col ? ' style="background:' + col.bg + ';color:' + col.fg + '"' : '') + '>' + esc(lab[0]) + (lab[1] ? '<br>' + esc(lab[1]) : '') + '</td>';
      h += '<td>' + nm(r.n) + '</td><td class="n" style="text-align:center">' + won(r.q) + '</td><td class="n">' + won(r.p) + '</td><td class="n"' + (g.kind === 'fee' || g.kind === 'reserve' ? ' style="font-weight:800"' : '') + '>' + won(r.amt) + '</td></tr>';
    });
    if (col) h += '<tr class="sub" style="background:' + col.bg + ';color:' + col.fg + ';border-color:' + col.fg + '"><td colspan="3" style="border-color:' + col.fg + '">' + esc(gTitle(g)) + ' 소계</td><td class="n" style="border-color:' + col.fg + '">' + won(g.sub) + '</td></tr>';
  });
  return h + '<tr class="tot"><td colspan="4">합 계</td><td class="n">' + won(n.total) + '</td></tr></tbody></table>';
}

/* 쪽 모으기 — 1쪽 표 + 캡처 쪽들(머리 줄을 그대로 되풀이) */
function buildHtml(biz, n) {
  const method = methodLine(n), head = headHtml(biz, n.total, method);
  let body = '<div class="pg">' + head + tableHtml(n) + '</div>';
  n.groups.forEach((g) => g.attach.filter((a) => a && a.kind === 'img' && /^data:image\//.test(a.dataUrl || '')).forEach((a) => {
    body += '<div class="pg">' + head + '<div class="cap"><img src="' + a.dataUrl + '"></div></div>';
  }));
  return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>' + pageCss() + '</style></head><body>' + body + '</body></html>';
}

async function makePdf(biz, n, deps) {
  const { BrowserWindow, PDFDocument } = deps;
  const tmp = path.join(os.tmpdir(), 'pm-' + Date.now() + '.html'); fs.writeFileSync(tmp, buildHtml(biz, n));
  const win = new BrowserWindow({ show: false, width: 900, height: 1200, webPreferences: { sandbox: true, javascript: false } });
  try {
    await win.loadFile(tmp);
    await new Promise((r) => setTimeout(r, 400));   // 그림이 그려질 틈
    const main = await win.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true });
    const out = await PDFDocument.load(main);
    for (const g of n.groups) for (const a of g.attach) {
      if (!a || a.kind !== 'pdf' || !a.path) continue;
      const src = await PDFDocument.load(fs.readFileSync(a.path), { ignoreEncryption: true });
      (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
    }
    return Buffer.from(await out.save());
  } finally { try { win.destroy(); } catch (e) { /* 이미 닫힘 */ } try { fs.unlinkSync(tmp); } catch (e) { /* 임시 파일 */ } }
}

/* 품목내역 줄 — 협의회비는 품목이 아니라서 뺀다(예비비는 품목내역에 들어간다) */
function xlsItems(n) { const out = []; n.groups.forEach((g) => { if (g.kind === 'fee') return; g.rows.forEach((r) => out.push({ n: r.n, q: r.q, p: r.p })); }); return out; }

async function makeBundle(model, outDir, deps) {
  const n = normalize(model || {});
  if (!n.groups.length) throw new Error('품목을 먼저 넣어 주세요');
  const biz = String(model.biz || '').trim() || '품의';
  const safe = biz.replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 40) || '품의';
  fs.mkdirSync(outDir, { recursive: true });
  const saved = [];
  const xlsP = path.join(outDir, safe + '_품목내역.xls');
  fs.writeFileSync(xlsP, fillTemplate(fs.readFileSync(path.join(__dirname, 'assets', '품목내역_틀.xls')), xlsItems(n))); saved.push(xlsP);
  const pdfP = path.join(outDir, safe + '_견적서.pdf');
  fs.writeFileSync(pdfP, await makePdf(biz, n, deps)); saved.push(pdfP);
  if (String(model.draft || '').trim()) { const tp = path.join(outDir, safe + '_전자기안문.txt'); fs.writeFileSync(tp, '﻿' + String(model.draft).replace(/\n/g, '\r\n'), 'utf8'); saved.push(tp); }
  return { saved, total: n.total, xlsRows: xlsItems(n).length };
}

module.exports = { makeBundle, normalize, buildHtml, methodLine, ko, won };
