// GET /player?session=<conversation_id | employee_id>   (rewrite → /api/player)
// GET /api/player?session=<...>
//
// Renderiza un reproductor web premium (dark mode, acento oro) para escuchar
// el MP3 de una sesión VTC. El audio se sirve desde /api/audio (302 o binario),
// así que este endpoint solo necesita: validar la sesión, leer metadatos
// (employee_name, fecha) y devolver el HTML del reproductor.
//
// - Sesión no encontrada → 404 con página HTML estilizada.
// - Sesión sin audio_url → 404 (aún no hay grabación disponible).
// - Sin ?session → 400 HTML.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Escapa texto para insertarlo con seguridad en HTML (previene inyección/XSS).
function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// dd-mm-aaaa HH:mm (hora local del servidor / America para consistencia con reportes)
function formatFecha(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function page({ title, body, status = 200 }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)}</title>
<style>
  :root{
    --bg:#1a1a1c; --panel:#232327; --panel-2:#2b2b30;
    --gold:#D4AF37; --gold-soft:rgba(212,175,55,.14); --gold-line:rgba(212,175,55,.28);
    --txt:#F4F1E9; --muted:#9a968c; --track:#3a3a40; --danger:#e05a5a;
    --font:'Helvetica Neue',Arial,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%}
  body{
    background:radial-gradient(1200px 700px at 50% -10%, #24242a 0%, var(--bg) 60%) fixed;
    color:var(--txt); font-family:var(--font);
    -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
    letter-spacing:.01em;
    display:flex; align-items:center; justify-content:center;
    min-height:100dvh; padding:24px;
  }
  .card{
    width:100%; max-width:560px;
    background:linear-gradient(180deg, var(--panel) 0%, #1e1e22 100%);
    border:1px solid rgba(255,255,255,.06);
    border-radius:22px;
    box-shadow:0 30px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.04);
    padding:30px 30px 26px;
    position:relative; overflow:hidden;
  }
  .card::before{
    content:""; position:absolute; inset:0 0 auto 0; height:3px;
    background:linear-gradient(90deg, transparent, var(--gold), transparent);
    opacity:.85;
  }
  .top{display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:22px}
  .eyebrow{
    font-size:11px; letter-spacing:.32em; text-transform:uppercase;
    color:var(--gold); font-weight:600; margin:0 0 8px;
  }
  h1{font-size:20px; line-height:1.3; margin:0; font-weight:600; letter-spacing:.005em}
  h1 .sep{color:var(--gold); font-weight:400; margin:0 6px}
  .meta{margin-top:8px; font-size:12.5px; color:var(--muted); letter-spacing:.04em}
  .close{
    flex:0 0 auto; text-decoration:none; color:var(--muted);
    border:1px solid rgba(255,255,255,.1); border-radius:999px;
    width:34px; height:34px; display:grid; place-items:center;
    font-size:16px; transition:.2s; background:rgba(255,255,255,.02);
  }
  .close:hover{color:var(--gold); border-color:var(--gold-line); background:var(--gold-soft)}

  .disc{
    display:flex; align-items:center; gap:16px;
    background:var(--panel-2); border:1px solid rgba(255,255,255,.05);
    border-radius:16px; padding:16px 18px; margin-bottom:22px;
  }
  .disc .icon{
    width:52px; height:52px; flex:0 0 auto; border-radius:14px;
    background:radial-gradient(circle at 30% 30%, var(--gold) 0%, #8a6d18 70%, #5c470f 100%);
    display:grid; place-items:center; color:#1a1a1c;
    box-shadow:0 8px 24px rgba(212,175,55,.28);
  }
  .disc .icon svg{width:26px;height:26px}
  .disc .txt{min-width:0}
  .disc .txt strong{display:block;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .disc .txt span{display:block;font-size:12px;color:var(--muted);margin-top:3px}

  /* Progreso */
  .scrub{margin:4px 0 6px}
  input[type=range]{
    -webkit-appearance:none; appearance:none; width:100%; height:6px;
    background:transparent; cursor:pointer; margin:0;
  }
  input[type=range]::-webkit-slider-runnable-track{
    height:6px; border-radius:999px;
    background:linear-gradient(to right, var(--gold) 0%, var(--gold) var(--pct,0%), var(--track) var(--pct,0%), var(--track) 100%);
  }
  input[type=range]::-moz-range-track{height:6px;border-radius:999px;background:var(--track)}
  input[type=range]::-moz-range-progress{height:6px;border-radius:999px;background:var(--gold)}
  input[type=range]::-webkit-slider-thumb{
    -webkit-appearance:none; appearance:none; width:16px; height:16px; margin-top:-5px;
    border-radius:50%; background:#fff; border:3px solid var(--gold);
    box-shadow:0 2px 8px rgba(0,0,0,.4); transition:transform .12s;
  }
  input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.15)}
  input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid var(--gold)}
  .times{display:flex; justify-content:space-between; font-variant-numeric:tabular-nums; font-size:12px; color:var(--muted); margin-top:2px}

  /* Controles */
  .controls{display:flex; align-items:center; gap:18px; margin-top:20px}
  .play{
    flex:0 0 auto; width:60px; height:60px; border-radius:50%;
    border:none; cursor:pointer; color:#1a1a1c;
    background:linear-gradient(180deg, #e6c85a 0%, var(--gold) 60%, #b8942a 100%);
    display:grid; place-items:center;
    box-shadow:0 10px 26px rgba(212,175,55,.35), inset 0 1px 0 rgba(255,255,255,.4);
    transition:transform .12s, box-shadow .2s;
  }
  .play:hover{transform:translateY(-1px); box-shadow:0 14px 32px rgba(212,175,55,.45)}
  .play:active{transform:translateY(0) scale(.97)}
  .play svg{width:24px;height:24px; margin-left:1px}
  .play.playing svg{margin-left:0}

  .vol{display:flex; align-items:center; gap:10px; flex:1; min-width:0}
  .vol .vicon{color:var(--muted); flex:0 0 auto; display:grid; place-items:center}
  .vol .vicon svg{width:20px;height:20px}
  .vol input[type=range]{max-width:170px}
  .vol input[type=range]::-webkit-slider-runnable-track{
    background:linear-gradient(to right, var(--gold) 0%, var(--gold) var(--vpct,80%), var(--track) var(--vpct,80%), var(--track) 100%);
  }

  .foot{margin-top:22px; display:flex; align-items:center; justify-content:space-between; gap:12px}
  .dl{
    text-decoration:none; font-size:12.5px; color:var(--muted);
    display:inline-flex; align-items:center; gap:7px; padding:8px 14px;
    border:1px solid rgba(255,255,255,.1); border-radius:999px; transition:.2s;
  }
  .dl:hover{color:var(--gold); border-color:var(--gold-line); background:var(--gold-soft)}
  .dl svg{width:15px;height:15px}
  .brand{font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:#55524b}

  .err{text-align:center; padding:14px 0}
  .err .badge{font-size:44px; margin-bottom:10px}
  .err h1{font-size:19px; margin-bottom:8px}
  .err p{color:var(--muted); font-size:14px; margin:0 auto; max-width:360px; line-height:1.55}
  .err .back{
    display:inline-block; margin-top:22px; text-decoration:none; color:var(--gold);
    border:1px solid var(--gold-line); border-radius:999px; padding:10px 22px; font-size:13px;
    transition:.2s;
  }
  .err .back:hover{background:var(--gold-soft)}

  @media (max-width:480px){
    .card{padding:24px 20px 22px; border-radius:18px}
    h1{font-size:18px}
    .vol input[type=range]{max-width:120px}
    .controls{gap:12px}
  }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).send(page({
      title: 'Método no permitido',
      status: 405,
      body: `<main class="card"><div class="err"><div class="badge">⚠️</div><h1>Método no permitido</h1><p>Este reproductor solo responde a peticiones GET.</p></div></main>`
    }));
  }

  const session = String(
    req.query.session || req.query.conv || req.query.conversation_id || req.query.id || ''
  ).trim();

  if (!session) {
    return res.status(400).send(page({
      title: 'Sesión requerida',
      status: 400,
      body: `<main class="card"><div class="err"><div class="badge">🔎</div><h1>Falta el identificador de sesión</h1><p>Abre este reproductor con <code>?session=&lt;conversation_id&gt;</code> para escuchar la conversación.</p></div></main>`
    }));
  }

  if (!supabase) {
    return res.status(503).send(page({
      title: 'Servicio no disponible',
      status: 503,
      body: `<main class="card"><div class="err"><div class="badge">🛠️</div><h1>Servicio no configurado</h1><p>La base de datos no está disponible en este momento. Intenta de nuevo más tarde.</p></div></main>`
    }));
  }

  try {
    // Buscar por conversation_id primero, luego por employee_id (más reciente).
    let { data, error } = await supabase
      .from('training_sessions')
      .select('employee_name, employee_id, conversation_id, audio_url, duration_minutes, timestamp, status')
      .eq('conversation_id', session)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if ((!data || !data.audio_url) && !error) {
      const alt = await supabase
        .from('training_sessions')
        .select('employee_name, employee_id, conversation_id, audio_url, duration_minutes, timestamp, status')
        .eq('employee_id', session)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (alt.data) { data = alt.data; error = alt.error; }
    }

    if (error) {
      return res.status(500).send(page({
        title: 'Error',
        status: 500,
        body: `<main class="card"><div class="err"><div class="badge">⚠️</div><h1>No se pudo cargar la sesión</h1><p>${esc(error.message)}</p></div></main>`
      }));
    }

    if (!data) {
      return res.status(404).send(page({
        title: 'Sesión no encontrada',
        status: 404,
        body: `<main class="card"><div class="err"><div class="badge">🔒</div><h1>Sesión no encontrada</h1><p>No existe ninguna conversación con el identificador <strong>${esc(session)}</strong>, o no tienes acceso a ella.</p></div></main>`
      }));
    }

    if (!data.audio_url) {
      const nombre = data.employee_name || 'Colaborador';
      return res.status(404).send(page({
        title: 'Audio no disponible',
        status: 404,
        body: `<main class="card"><div class="err"><div class="badge">🎙️</div><h1>Grabación aún no disponible</h1><p>La sesión de <strong>${esc(nombre)}</strong> existe, pero todavía no tiene audio publicado. Vuelve a intentarlo cuando la conversación haya sido procesada.</p></div></main>`
      }));
    }

    const nombre = data.employee_name || 'Colaborador';
    const fecha = formatFecha(data.timestamp);
    const convId = data.conversation_id || session;
    // El audio SIEMPRE se sirve vía /api/audio (302/binario). No se expone audio_url interno.
    const audioSrc = `/api/audio?session=${encodeURIComponent(convId)}`;
    const dlName = `VTC_${convId}${fecha ? '_' + fecha.replace(/[ :]/g, '-') : ''}.mp3`;

    const body = `
<main class="card" role="dialog" aria-label="Reproductor de conversación VTC">
  <div class="top">
    <div>
      <p class="eyebrow">Conversación VTC</p>
      <h1>${esc(nombre)}${fecha ? `<span class="sep">·</span>${esc(fecha.split(' ')[0])}` : ''}</h1>
      <div class="meta">${fecha ? esc(fecha) + ' hrs' : 'Sesión de capacitación'} · ID ${esc(convId)}</div>
    </div>
    <a class="close" href="javascript:history.length>1?history.back():window.close()" title="Cerrar / Volver" aria-label="Cerrar">✕</a>
  </div>

  <div class="disc">
    <div class="icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="2"/></svg>
    </div>
    <div class="txt">
      <strong>Grabación de la conversación</strong>
      <span id="statusLine">Listo para reproducir</span>
    </div>
  </div>

  <audio id="audio" preload="metadata" src="${esc(audioSrc)}"></audio>

  <div class="scrub">
    <input id="seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Progreso de reproducción">
    <div class="times"><span id="cur">00:00:00</span><span id="dur">00:00:00</span></div>
  </div>

  <div class="controls">
    <button id="play" class="play" aria-label="Reproducir">
      <svg id="playIcon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
    </button>
    <div class="vol">
      <span class="vicon" id="volIcon" role="button" tabindex="0" aria-label="Silenciar">
        <svg viewBox="0 0 24 24" fill="none"><path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8 8 0 0 1 0 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </span>
      <input id="vol" type="range" min="0" max="100" value="100" aria-label="Volumen">
    </div>
  </div>

  <div class="foot">
    <a class="dl" href="${esc(audioSrc)}" download="${esc(dlName)}">
      <svg viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Descargar MP3
    </a>
    <span class="brand">Victor IA</span>
  </div>
</main>

<script>
(function(){
  var audio = document.getElementById('audio');
  var play  = document.getElementById('play');
  var pIcon = document.getElementById('playIcon');
  var seek  = document.getElementById('seek');
  var vol   = document.getElementById('vol');
  var volIcon = document.getElementById('volIcon');
  var curEl = document.getElementById('cur');
  var durEl = document.getElementById('dur');
  var statusLine = document.getElementById('statusLine');

  var PLAY = '<path d="M8 5v14l11-7z"/>';
  var PAUSE = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';
  var seeking = false;

  function fmt(s){
    if(!isFinite(s) || s < 0) s = 0;
    s = Math.floor(s);
    var h = Math.floor(s/3600), m = Math.floor((s%3600)/60), ss = s%60;
    var p = function(n){return String(n).padStart(2,'0');};
    return p(h)+':'+p(m)+':'+p(ss);
  }
  function setSeekFill(pct){ seek.style.setProperty('--pct', pct+'%'); }
  function setVolFill(pct){ vol.style.setProperty('--vpct', pct+'%'); }

  audio.addEventListener('loadedmetadata', function(){
    durEl.textContent = fmt(audio.duration);
    statusLine.textContent = 'Listo para reproducir';
  });
  audio.addEventListener('timeupdate', function(){
    if(seeking) return;
    curEl.textContent = fmt(audio.currentTime);
    var pct = audio.duration ? (audio.currentTime/audio.duration)*1000 : 0;
    seek.value = pct;
    setSeekFill(audio.duration ? (audio.currentTime/audio.duration)*100 : 0);
  });
  audio.addEventListener('play', function(){
    pIcon.innerHTML = PAUSE; play.classList.add('playing');
    play.setAttribute('aria-label','Pausar'); statusLine.textContent = 'Reproduciendo…';
  });
  audio.addEventListener('pause', function(){
    pIcon.innerHTML = PLAY; play.classList.remove('playing');
    play.setAttribute('aria-label','Reproducir'); statusLine.textContent = 'En pausa';
  });
  audio.addEventListener('ended', function(){ statusLine.textContent = 'Reproducción finalizada'; });
  audio.addEventListener('error', function(){
    statusLine.textContent = 'No se pudo cargar el audio';
    play.disabled = true; play.style.opacity = .5; play.style.cursor = 'not-allowed';
  });

  play.addEventListener('click', function(){
    if(audio.paused){ audio.play().catch(function(){ statusLine.textContent='Toca de nuevo para reproducir'; }); }
    else audio.pause();
  });

  // Scrubber
  seek.addEventListener('input', function(){
    seeking = true;
    var t = (seek.value/1000) * (audio.duration||0);
    curEl.textContent = fmt(t);
    setSeekFill(seek.value/10);
  });
  seek.addEventListener('change', function(){
    if(audio.duration){ audio.currentTime = (seek.value/1000)*audio.duration; }
    seeking = false;
  });

  // Volumen
  setVolFill(100);
  vol.addEventListener('input', function(){
    var v = vol.value/100;
    audio.volume = v; audio.muted = v === 0;
    setVolFill(vol.value);
    volIcon.style.color = v === 0 ? 'var(--danger)' : '';
  });
  function toggleMute(){
    audio.muted = !audio.muted;
    if(audio.muted){ vol.dataset.prev = vol.value; vol.value = 0; setVolFill(0); volIcon.style.color='var(--danger)'; }
    else { vol.value = vol.dataset.prev || 100; setVolFill(vol.value); audio.volume = vol.value/100; volIcon.style.color=''; }
  }
  volIcon.addEventListener('click', toggleMute);
  volIcon.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggleMute(); } });

  // Teclado: espacio = play/pause, flechas = seek
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT') return;
    if(e.code === 'Space'){ e.preventDefault(); play.click(); }
    else if(e.code === 'ArrowRight'){ audio.currentTime = Math.min((audio.currentTime||0)+5, audio.duration||0); }
    else if(e.code === 'ArrowLeft'){ audio.currentTime = Math.max((audio.currentTime||0)-5, 0); }
  });
})();
</script>`;

    return res.status(200).send(page({ title: `Conversación VTC — ${nombre}${fecha ? ' — ' + fecha.split(' ')[0] : ''}`, body }));
  } catch (e) {
    return res.status(500).send(page({
      title: 'Error',
      status: 500,
      body: `<main class="card"><div class="err"><div class="badge">⚠️</div><h1>Error inesperado</h1><p>${esc(e.message)}</p></div></main>`
    }));
  }
}