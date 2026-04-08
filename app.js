/**
 * Mhitr Wellbeing Check-in · app.js
 * SDQ-aligned 5-scale structure — swap QUESTION_BANK with licensed SDQ questions when ready.
 * Contact youthinmind@gmail.com to license official SDQ questions for digital use.
 */

// ─── QUESTION BANK (SDQ-inspired, swap-ready) ────────────────────────────────
// To upgrade to official SDQ: replace each `questions` array with the licensed SDQ self-report items.
// All scoring, banding, AI report, flags, PDF and radar chart update automatically.

const QUESTION_BANK = [
  {
    scale: 'emotional',
    label: 'Emotional symptoms',
    icon: '💙',
    color: '#1B4B8A',
    light: '#E8F0FA',
    sdqNorms: { closeToNormal: [0, 3], someRisk: [4, 5], highRisk: [6, 10] },
    questions: [
      { text: 'I often have headaches, stomach-aches or feel sick.', reverse: false },
      { text: 'I worry a lot.', reverse: false },
      { text: 'I am often unhappy, down-hearted or tearful.', reverse: false },
      { text: 'I am nervous in new situations — I easily lose confidence.', reverse: false },
      { text: 'I have many fears, I am easily scared.', reverse: false },
    ]
  },
  {
    scale: 'conduct',
    label: 'Conduct & behaviour',
    icon: '⚡',
    color: '#854F0B',
    light: '#FAEEDA',
    sdqNorms: { closeToNormal: [0, 2], someRisk: [3, 4], highRisk: [5, 10] },
    questions: [
      { text: 'I get very angry and often lose my temper.', reverse: false },
      { text: 'I usually do as I am told.', reverse: true },
      { text: 'I fight a lot. I can make other people do what I want.', reverse: false },
      { text: 'I am often accused of lying or cheating.', reverse: false },
      { text: 'I take things that are not mine from home, school or elsewhere.', reverse: false },
    ]
  },
  {
    scale: 'hyperactivity',
    label: 'Hyperactivity & focus',
    icon: '🔆',
    color: '#2D7D5A',
    light: '#E1F5EE',
    sdqNorms: { closeToNormal: [0, 5], someRisk: [6, 7], highRisk: [8, 10] },
    questions: [
      { text: 'I am restless — I cannot stay still for long.', reverse: false },
      { text: 'I am constantly fidgeting or squirming.', reverse: false },
      { text: 'I am easily distracted — I find it hard to concentrate.', reverse: false },
      { text: 'I think before I do things.', reverse: true },
      { text: 'I finish the work I am doing — my attention is good.', reverse: true },
    ]
  },
  {
    scale: 'peer',
    label: 'Peer relationships',
    icon: '🤝',
    color: '#0F6E56',
    light: '#E1F5EE',
    sdqNorms: { closeToNormal: [0, 2], someRisk: [3, 4], highRisk: [5, 10] },
    questions: [
      { text: 'I prefer to be alone rather than with other people my age.', reverse: false },
      { text: 'I have one good friend or more.', reverse: true },
      { text: 'Other people my age generally like me.', reverse: true },
      { text: 'Other children or young people pick on me or bully me.', reverse: false },
      { text: 'I get on better with adults than with people my own age.', reverse: false },
    ]
  },
  {
    scale: 'prosocial',
    label: 'Prosocial behaviour',
    icon: '💚',
    color: '#3B6D11',
    light: '#EAF3DE',
    sdqNorms: { closeToNormal: [6, 10], someRisk: [4, 5], highRisk: [0, 3] },
    reversed: true,
    questions: [
      { text: 'I try to be nice to other people — I care about their feelings.', reverse: false },
      { text: 'I usually share with others (food, games, pens etc.).', reverse: false },
      { text: 'I am helpful if someone is hurt, upset or feeling ill.', reverse: false },
      { text: 'I am kind to younger children.', reverse: false },
      { text: 'I often offer to help others (parents, teachers, other children).', reverse: false },
    ]
  }
];

const OPTS = [
  { label: 'Not true', icon: '○', val: 0 },
  { label: 'Somewhat true', icon: '◑', val: 1 },
  { label: 'Certainly true', icon: '●', val: 2 },
];

// ─── STATE ────────────────────────────────────────────────────────────────────
let userName = '', userAge = '', userGender = '';
let allQ = [], answers = [], currentQ = 0;
let finalScores = {}, finalBands = {};

// ─── INIT ─────────────────────────────────────────────────────────────────────
function startTest() {
  const n = document.getElementById('inp-name').value.trim();
  const a = document.getElementById('inp-age').value;
  if (!n) { alert('Please enter your name.'); return; }
  if (!a) { alert('Please select your age.'); return; }
  userName = n; userAge = a;
  userGender = document.getElementById('inp-gender').value || 'person';

  allQ = [];
  QUESTION_BANK.forEach(s => {
    s.questions.forEach(q => {
      allQ.push({ ...q, scale: s.scale, label: s.label, icon: s.icon, color: s.color, light: s.light });
    });
  });
  answers = new Array(allQ.length).fill(null);
  currentQ = 0;
  renderQ();
  show('s-question');
}

// ─── QUESTION RENDERING ───────────────────────────────────────────────────────
function renderQ() {
  const q = allQ[currentQ];
  const pct = Math.round(currentQ / allQ.length * 100);
  document.getElementById('prog').style.width = pct + '%';
  document.getElementById('q-num').textContent = (currentQ + 1) + ' of ' + allQ.length;

  const chip = document.getElementById('scale-chip');
  chip.textContent = q.icon + ' ' + q.label;
  chip.style.background = q.light;
  chip.style.color = q.color;
  chip.style.border = '1px solid ' + q.color + '44';

  document.getElementById('q-text').textContent = q.text;

  const wrap = document.getElementById('opts-wrap');
  wrap.innerHTML = '';
  OPTS.forEach(o => {
    const d = document.createElement('div');
    d.className = 'opt' + (answers[currentQ] === o.val ? ' sel' : '');
    d.innerHTML = `<span class="opt-icon">${o.icon}</span><span class="opt-lbl">${o.label}</span>`;
    d.onclick = () => pick(o.val);
    wrap.appendChild(d);
  });

  document.getElementById('btn-back').style.visibility = currentQ === 0 ? 'hidden' : 'visible';
  document.getElementById('btn-next').textContent = currentQ === allQ.length - 1 ? 'See my report ✨' : 'Next →';
}

function pick(val) {
  answers[currentQ] = val;
  document.querySelectorAll('.opt').forEach((el, i) => el.classList.toggle('sel', OPTS[i].val === val));
}

function nextQ() {
  if (answers[currentQ] === null) { alert('Please choose an answer.'); return; }
  if (currentQ === allQ.length - 1) { buildReport(); return; }
  currentQ++; renderQ();
}
function prevQ() { if (currentQ > 0) { currentQ--; renderQ(); } }

// ─── SCORING ──────────────────────────────────────────────────────────────────
function calcScores() {
  const raw = {};
  QUESTION_BANK.forEach(s => { raw[s.scale] = 0; });
  allQ.forEach((q, i) => {
    let v = answers[i];
    if (q.reverse) v = 2 - v;
    raw[q.scale] += v;
  });
  return raw;
}

function getBand(scale, score) {
  const def = QUESTION_BANK.find(s => s.scale === scale);
  const n = def.sdqNorms;
  if (score >= n.closeToNormal[0] && score <= n.closeToNormal[1]) return 'close';
  if (score >= n.someRisk[0] && score <= n.someRisk[1]) return 'some';
  return 'high';
}

function bandLabel(b) { return b === 'close' ? 'Close to normal' : b === 'some' ? 'Some risk' : 'High risk'; }
function bandClass(b) { return b === 'close' ? 'band-low' : b === 'some' ? 'band-med' : 'band-high'; }
function barColor(b) { return b === 'close' ? '#3B6D11' : b === 'some' ? '#854F0B' : '#A32D2D'; }

// ─── FLAGS ────────────────────────────────────────────────────────────────────
function checkFlags() {
  const flags = [];
  const concernMap = [
    { qText: 'I am often unhappy, down-hearted or tearful.', val: 2, msg: 'Feeling sad or tearful a lot can be really tough. Please consider speaking to a school counsellor or trusted adult.', urgent: true },
    { qText: 'I worry a lot.', val: 2, msg: 'Worrying a lot can feel exhausting. A counsellor can teach you great techniques to manage anxious thoughts.', urgent: false },
    { qText: 'Other children or young people pick on me or bully me.', val: 2, msg: 'No one deserves to be bullied. Please tell a trusted adult — you have the right to feel safe.', urgent: true },
    { qText: 'I feel like things are too much to handle.', val: 2, msg: 'Feeling overwhelmed is a sign you need more support right now — and that\'s okay to ask for.', urgent: false },
  ];
  allQ.forEach((q, i) => {
    concernMap.forEach(c => {
      if (q.text === c.qText && answers[i] >= c.val) flags.push({ msg: c.msg, urgent: c.urgent });
    });
  });
  return flags;
}

// ─── TIPS ─────────────────────────────────────────────────────────────────────
function getTips(bands) {
  const tips = [];
  if (bands.emotional === 'some' || bands.emotional === 'high') {
    tips.push('Try box breathing: breathe in 4 counts, hold 4, out 4. Repeat 5 times when anxious.');
    tips.push('Write down 3 good things that happened each day — it genuinely shifts your mood over time.');
  }
  if (bands.conduct === 'some' || bands.conduct === 'high')
    tips.push('When you feel angry, try the "traffic light" pause: stop, breathe, then respond.');
  if (bands.hyperactivity === 'some' || bands.hyperactivity === 'high')
    tips.push('Break tasks into 10-minute chunks with short movement breaks in between.');
  if (bands.peer === 'some' || bands.peer === 'high')
    tips.push('Try joining one new activity or club — shared interests are the easiest way to make friends.');
  if (bands.prosocial === 'close')
    tips.push('Keep up your kindness — it makes a bigger difference than you know!');
  if (tips.length < 3) {
    tips.push('Get 8–9 hours of sleep — it has a huge impact on mood and focus.');
    tips.push('Spend at least 20 minutes outside each day, even a short walk helps.');
  }
  return tips.slice(0, 5);
}

// ─── REPORT BUILDER ───────────────────────────────────────────────────────────
async function buildReport() {
  show('s-loading');
  const raw = calcScores();
  finalScores = raw;
  const bands = {};
  QUESTION_BANK.forEach(s => { bands[s.scale] = getBand(s.scale, raw[s.scale]); });
  finalBands = bands;
  const flags = checkFlags();
  const tips = getTips(bands);

  const msgs = ['Calculating scale scores...', 'Applying SDQ band thresholds...', 'Writing personalised insights...', 'Almost ready...'];
  let mi = 0;
  const msgEl = document.getElementById('load-msg');
  const iv = setInterval(() => { mi = (mi + 1) % msgs.length; msgEl.textContent = msgs[mi]; }, 1100);

  let aiText = '';
  try {
    const scoreStr = QUESTION_BANK.map(s => `${s.label}: ${raw[s.scale]}/10 (${bandLabel(bands[s.scale])})`).join('; ');
    const worst = QUESTION_BANK.reduce((a, b) => (bands[b.scale] === 'high' && bands[a.scale] !== 'high') ? b : a);
    const best = QUESTION_BANK.find(s => bands[s.scale] === 'close') || QUESTION_BANK[4];

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 450,
        messages: [{
          role: 'user',
          content: `You are a warm, experienced school counsellor at Mhitr — a self-care companion for young people. Write a brief personalised wellbeing summary for ${userName}, aged ${userAge}, who identifies as ${userGender}. SDQ-aligned scale results: ${scoreStr}. Strongest area: ${best.label}. Area most needing support: ${worst.label}. Write exactly 3 short paragraphs: (1) warmly acknowledge their strongest area with genuine specificity, (2) gently name the area needing support without alarming language, offering one concrete suggestion, (3) a brief hopeful closing. Use warm, friendly, age-appropriate language. No bullet points. No clinical jargon. Under 160 words total.`
        }]
      })
    });
    const data = await resp.json();
    aiText = data?.content?.[0]?.text || '';
  } catch (e) {
    aiText = `Hi ${userName}! Thank you for completing this check-in — it takes courage to reflect honestly on how you're feeling. Your results show both strengths and areas where a little extra support could help. Remember, everyone has things they're working on, and asking for help is always a sign of strength. You've got this! 🌱`;
  }

  clearInterval(iv);
  renderReport(raw, bands, flags, tips, aiText);
  show('s-report');
}

// ─── REPORT RENDERING ─────────────────────────────────────────────────────────
function renderReport(raw, bands, flags, tips, aiText) {
  const highCount = Object.values(bands).filter(b => b === 'high').length;
  const someCount = Object.values(bands).filter(b => b === 'some').length;
  const overallEmoji = highCount >= 2 ? '🫂' : someCount >= 2 ? '🌱' : '🌟';

  document.getElementById('r-icon').textContent = overallEmoji;
  document.getElementById('r-title').textContent = userName + "'s Wellbeing Report";
  document.getElementById('r-sub').textContent = 'SDQ-aligned · Age ' + userAge + ' · ' + new Date().toLocaleDateString('en-IN') + ' · Mhitr';

  // Domain score cards
  const sl = document.getElementById('score-list');
  sl.innerHTML = '';
  QUESTION_BANK.forEach(s => {
    const sc = raw[s.scale], b = bands[s.scale];
    const pct = Math.round(sc / 10 * 100);
    sl.innerHTML += `
      <div class="score-row">
        <span class="score-icon">${s.icon}</span>
        <div class="score-meta">
          <div class="score-name">${s.label}<span class="band-badge ${bandClass(b)}">${bandLabel(b)}</span></div>
          <div class="bar-wrap"><div class="bar-fill" style="width:${pct}%;background:${barColor(b)}"></div></div>
        </div>
        <span class="score-val" style="color:${barColor(b)}">${sc}/10</span>
      </div>`;
  });

  // AI narrative
  const ib = document.getElementById('insight-body');
  const paras = (aiText || '').split('\n\n').filter(p => p.trim());
  const titles = ['Your strengths', 'An area to grow', 'Looking ahead'];
  ib.innerHTML = paras.map((p, i) => `<div class="insight-box"><strong>${titles[i] || 'Insight'}</strong>${p.trim()}</div>`).join('');

  // Flags
  if (flags.length > 0) {
    document.getElementById('flags-card').style.display = 'block';
    document.getElementById('flags-body').innerHTML = flags.map(f =>
      `<div class="flag${f.urgent ? ' urgent' : ''}"><strong>${f.urgent ? '🔴 Please speak to someone' : '🟡 Something to be aware of'}</strong>${f.msg}</div>`
    ).join('');
  }

  // Tips
  document.getElementById('tips-body').innerHTML = tips.map(t =>
    `<div class="tip-row"><div class="tip-dot"></div><span>${t}</span></div>`
  ).join('');

  drawRadar(raw);
}

// ─── RADAR CHART ──────────────────────────────────────────────────────────────
function drawRadar(raw) {
  const canvas = document.getElementById('radar');
  const ctx = canvas.getContext('2d');
  const cx = 120, cy = 120, r = 90, n = 5;
  ctx.clearRect(0, 0, 240, 240);

  // Grid rings
  for (let g = 1; g <= 5; g++) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 2 * i / n - Math.PI / 2;
      const x = cx + r * (g / 5) * Math.cos(a), y = cy + r * (g / 5) * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(27,75,138,0.10)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Spokes
  for (let i = 0; i < n; i++) {
    const a = Math.PI * 2 * i / n - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    ctx.strokeStyle = 'rgba(27,75,138,0.10)'; ctx.lineWidth = 1; ctx.stroke();
  }

  const vals = QUESTION_BANK.map(s => raw[s.scale] / 10);

  // Data polygon
  ctx.beginPath();
  vals.forEach((v, i) => {
    const a = Math.PI * 2 * i / n - Math.PI / 2;
    const x = cx + r * v * Math.cos(a), y = cy + r * v * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(27,75,138,0.12)'; ctx.fill();
  ctx.strokeStyle = '#1B4B8A'; ctx.lineWidth = 2; ctx.stroke();

  // Dots
  vals.forEach((v, i) => {
    const a = Math.PI * 2 * i / n - Math.PI / 2;
    const x = cx + r * v * Math.cos(a), y = cy + r * v * Math.sin(a);
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#1B4B8A'; ctx.fill();
  });

  // Labels
  ctx.font = '14px Segoe UI, system-ui, sans-serif';
  ctx.textAlign = 'center';
  QUESTION_BANK.map(s => s.icon).forEach((l, i) => {
    const a = Math.PI * 2 * i / n - Math.PI / 2;
    const x = cx + (r + 20) * Math.cos(a), y = cy + (r + 20) * Math.sin(a);
    ctx.fillText(l, x, y + 5);
  });
}

// ─── PDF EXPORT ───────────────────────────────────────────────────────────────
function makePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, M = 18; let y = 18;

  // Header bar
  doc.setFillColor(27, 75, 138);
  doc.rect(0, 0, W, 50, 'F');
  doc.setFillColor(45, 125, 90);
  doc.rect(0, 38, W, 12, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
  doc.text(userName + "'s Wellbeing Report", W / 2, 18, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text('Mhitr · Your self-care companion · SDQ-aligned Wellbeing Check-in', W / 2, 27, { align: 'center' });
  doc.text('Age ' + userAge + ' · ' + new Date().toLocaleDateString('en-IN'), W / 2, 43, { align: 'center' });
  y = 62;

  // Scale scores
  doc.setTextColor(26, 37, 64);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text('Your 5 Wellbeing Scales', M, y); y += 8;

  QUESTION_BANK.forEach(s => {
    const sc = finalScores[s.scale] || 0, b = finalBands[s.scale] || 'close';
    const bCol = b === 'close' ? [59, 109, 17] : b === 'some' ? [133, 79, 11] : [163, 45, 45];
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(26, 37, 64);
    doc.text(s.icon + ' ' + s.label, M, y);
    doc.setFillColor(216, 227, 240); doc.rect(M + 65, y - 4, 85, 5, 'F');
    doc.setFillColor(...bCol); doc.rect(M + 65, y - 4, sc / 10 * 85, 5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...bCol);
    doc.text(sc + '/10  ' + bandLabel(b), M + 153, y);
    doc.setTextColor(26, 37, 64);
    y += 10;
  });
  y += 4;

  // AI insights
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(27, 75, 138);
  doc.text('AI Insights · powered by Claude', M, y); y += 8;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(40, 52, 90);
  const aiEl = document.getElementById('insight-body');
  const aiLines = doc.splitTextToSize(aiEl.innerText.replace(/\n+/g, ' '), W - M * 2);
  doc.text(aiLines, M, y); y += aiLines.length * 5 + 8;

  // Flags
  const flagsCard = document.getElementById('flags-card');
  if (flagsCard.style.display !== 'none') {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(163, 45, 45);
    doc.text('Things to Talk About', M, y); y += 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(40, 52, 90);
    document.querySelectorAll('.flag').forEach(f => {
      const lines = doc.splitTextToSize('• ' + f.innerText, W - M * 2);
      doc.text(lines, M, y); y += lines.length * 5 + 4;
    });
  }

  // Tips
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(45, 125, 90);
  doc.text('Tips for You', M, y); y += 8;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(40, 52, 90);
  document.querySelectorAll('.tip-row').forEach(t => {
    const lines = doc.splitTextToSize('• ' + t.innerText, W - M * 2);
    doc.text(lines, M, y); y += lines.length * 5 + 3;
  });
  y += 6;

  // Footer
  doc.setFillColor(27, 75, 138);
  doc.rect(0, y, W, 8, 'F');
  doc.setFillColor(45, 125, 90);
  doc.rect(0, y + 8, W, 18, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
  doc.text('Mhitr · Your self-care companion', W / 2, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
  doc.text('SDQ-inspired structure. For official SDQ, contact youthinmind@gmail.com to obtain a digital licence.', W / 2, y + 13, { align: 'center' });
  doc.text('This report is for wellbeing awareness only. It does not constitute a clinical diagnosis.', W / 2, y + 18, { align: 'center' });
  doc.text('If concerned, please speak to a school counsellor, parent, or trusted adult.', W / 2, y + 23, { align: 'center' });

  doc.save(userName.replace(/\s+/g, '_') + '_Mhitr_Wellbeing_Report.pdf');
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function setFooters() {
  const year = new Date().getFullYear();
  const txt = '© ' + year + ' Vasudhaiva Kutumbakam Software Solutions Private Limited';
  ['footer-year-welcome','footer-year-report'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  });
}
document.addEventListener('DOMContentLoaded', setFooters);
function restart() { currentQ = 0; answers = []; finalScores = {}; finalBands = {}; show('s-welcome'); }
