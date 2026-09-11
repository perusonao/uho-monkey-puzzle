const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let pieces = [];
let score = 0;
let gameOver = false;
const sizes = [24, 32, 42, 54, 68, 84, 102];

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.min(window.innerWidth, 430);
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  canvas.logicalWidth = w;
  canvas.logicalHeight = h;
}
window.addEventListener('resize', resize);
resize();

function addPiece(px) {
  if (gameOver) return;
  const level = Math.random() < 0.75 ? 0 : 1;
  const r = sizes[level];
  pieces.push({x: Math.max(r + 8, Math.min(canvas.logicalWidth - r - 8, px)), y: 95, vx: 0, vy: 0, r, level});
}

canvas.addEventListener('pointerdown', event => {
  const rect = canvas.getBoundingClientRect();
  if (gameOver) {
    pieces = [];
    score = 0;
    gameOver = false;
    return;
  }
  addPiece(event.clientX - rect.left);
});

function update(dt) {
  const floor = canvas.logicalHeight - 48;
  for (const p of pieces) {
    p.vy += 1050 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x - p.r < 8) { p.x = p.r + 8; p.vx = Math.abs(p.vx) * 0.4; }
    if (p.x + p.r > canvas.logicalWidth - 8) { p.x = canvas.logicalWidth - p.r - 8; p.vx = -Math.abs(p.vx) * 0.4; }
    if (p.y + p.r > floor) { p.y = floor - p.r; p.vy = -Math.abs(p.vy) * 0.2; p.vx *= 0.94; }
  }
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      const a = pieces[i], b = pieces[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const min = a.r + b.r;
      if (d >= min) continue;
      if (a.level === b.level && a.level < sizes.length - 1) {
        const level = a.level + 1;
        pieces.splice(j, 1);
        pieces.splice(i, 1, {x:(a.x+b.x)/2, y:(a.y+b.y)/2, vx:0, vy:-90, r:sizes[level], level});
        score += (level + 1) * 10;
        break;
      }
      const nx = dx / d, ny = dy / d, overlap = min - d;
      a.x -= nx * overlap / 2; a.y -= ny * overlap / 2;
      b.x += nx * overlap / 2; b.y += ny * overlap / 2;
    }
  }
  gameOver = pieces.some(p => p.y - p.r < 145 && Math.abs(p.vy) < 25);
}

function drawFace(p) {
  const colors = ['#d58b43','#ca7b38','#bb6c30','#aa5c28','#984c22','#843d1d','#6f3018'];
  ctx.fillStyle = colors[p.level];
  ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#633816'; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle='#efb56c'; ctx.beginPath(); ctx.ellipse(p.x,p.y+p.r*.12,p.r*.72,p.r*.55,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#20140d';
  ctx.beginPath(); ctx.arc(p.x-p.r*.24,p.y-p.r*.13,Math.max(2,p.r*.07),0,Math.PI*2); ctx.arc(p.x+p.r*.24,p.y-p.r*.13,Math.max(2,p.r*.07),0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(p.x,p.y+p.r*.16,p.r*.22,0,Math.PI); ctx.stroke();
}

let previous = performance.now();
function frame(now) {
  const dt = Math.min((now - previous) / 1000, 0.025); previous = now;
  if (!gameOver) update(dt);
  const w=canvas.logicalWidth,h=canvas.logicalHeight;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='rgba(255,255,255,.55)'; ctx.fillRect(10,10,w-20,62);
  ctx.fillStyle='#4b2c16'; ctx.font='700 22px -apple-system'; ctx.fillText('ウホウホパズル',22,38);
  ctx.font='700 18px -apple-system'; ctx.fillText('SCORE '+score,22,62);
  ctx.strokeStyle='#c44'; ctx.setLineDash([8,8]); ctx.beginPath(); ctx.moveTo(8,145); ctx.lineTo(w-8,145); ctx.stroke(); ctx.setLineDash([]);
  pieces.forEach(drawFace);
  ctx.fillStyle='#80501f'; ctx.fillRect(8,h-42,w-16,34);
  ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.font='600 14px -apple-system'; ctx.fillText('タップして落とす　同じ顔で合体！',w/2,h-18); ctx.textAlign='left';
  if(gameOver){ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(0,0,w,h);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='800 34px -apple-system';ctx.fillText('GAME OVER',w/2,h/2-20);ctx.font='18px -apple-system';ctx.fillText('タップでリトライ',w/2,h/2+28);ctx.textAlign='left';}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
