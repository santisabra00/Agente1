const API_URL = 'https://agente1-production.up.railway.app/chat';
const BASE_URL = 'https://agente1-production.up.railway.app';

const chatContainer = document.getElementById('chatContainer');
const inputMensaje  = document.getElementById('inputMensaje');
const btnEnviar     = document.getElementById('btnEnviar');

// ─── ENTER para enviar ───────────────────────
inputMensaje.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    enviarMensaje();
  }
});

// ─── RENDERIZADO DE TEXTO ────────────────────
function renderTexto(texto) {
  // Detectar si es una tarjeta técnica
  if (texto.includes('[TECNICO]')) {
    const partes = texto.split('[TECNICO]');
    let html = '';

    for (const parte of partes) {
      if (!parte.trim()) continue;
      // Intentar parsear como JSON (datos técnicos)
      try {
        const datos = JSON.parse(parte.trim());
        html += renderTarjetaTecnica(datos);
      } catch {
        // Es texto normal antes/después de la tarjeta
        html += renderTextoPlano(parte);
      }
    }
    return html;
  }

  return renderTextoPlano(texto);
}

function formatInline(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/(\+[\d.,]+%?)/g, '<span class="tag-green">$1</span>')
    .replace(/(−[\d.,]+%?|-[\d.,]+%)/g, '<span class="tag-red">$1</span>');
}

function renderTextoPlano(texto) {
  const lines = texto.split('\n');
  let html = '';
  let listBuf = [];
  let listType = null;
  let tableBuf = [];
  let inTable = false;

  function flushList() {
    if (listBuf.length) {
      const tag = listType === 'ol' ? 'ol' : 'ul';
      html += `<${tag}>` + listBuf.map(l => `<li>${l}</li>`).join('') + `</${tag}>`;
      listBuf = []; listType = null;
    }
  }
  function flushTable() {
    if (tableBuf.length) {
      let th = tableBuf[0];
      let rows = tableBuf.slice(2); // skip separator row
      html += '<table><thead><tr>' + th.map(c => `<th>${formatInline(c)}</th>`).join('') + '</tr></thead>';
      if (rows.length) html += '<tbody>' + rows.map(r => '<tr>' + r.map(c => `<td>${formatInline(c)}</td>`).join('') + '</tr>').join('') + '</tbody>';
      html += '</table>';
      tableBuf = []; inTable = false;
    }
  }

  for (const line of lines) {
    const t = line.trim();

    // Tabla
    if (t.startsWith('|')) {
      inTable = true;
      const cells = t.split('|').slice(1, -1).map(c => c.trim());
      tableBuf.push(cells);
      continue;
    } else if (inTable) { flushTable(); }

    // Títulos
    if (/^### (.+)/.test(t)) { flushList(); html += `<h3>${formatInline(t.replace(/^### /, ''))}</h3>`; continue; }
    if (/^## (.+)/.test(t))  { flushList(); html += `<h2>${formatInline(t.replace(/^## /, ''))}</h2>`; continue; }
    if (/^# (.+)/.test(t))   { flushList(); html += `<h1>${formatInline(t.replace(/^# /, ''))}</h1>`; continue; }

    // HR
    if (/^---+$/.test(t)) { flushList(); html += '<hr>'; continue; }

    // Lista desordenada
    if (/^[-*] (.+)/.test(t)) {
      if (listType !== 'ul') { flushList(); listType = 'ul'; }
      listBuf.push(formatInline(t.replace(/^[-*] /, '')));
      continue;
    }
    // Lista ordenada
    if (/^\d+\. (.+)/.test(t)) {
      if (listType !== 'ol') { flushList(); listType = 'ol'; }
      listBuf.push(formatInline(t.replace(/^\d+\. /, '')));
      continue;
    }

    flushList();
    if (!t) { html += '<br>'; continue; }
    html += `<p>${formatInline(line)}</p>`;
  }

  flushList();
  flushTable();
  return html;
}

function renderTarjetaTecnica(d) {
  // RSI color y señal
  const rsiColor = d.rsi >= 70 ? 'var(--red)' : d.rsi <= 30 ? 'var(--green)' : 'var(--text-muted)';
  const rsiLabel = d.rsi >= 70 ? 'Sobrecomprado' : d.rsi <= 30 ? 'Sobrevendido' : 'Neutral';
  const rsiLabelClass = d.rsi >= 70 ? 'signal-red' : d.rsi <= 30 ? 'signal-green' : 'signal-neutral';
  const rsiFill = Math.round(d.rsi);

  // SMA señales
  const sma20Class = d.sma20_signal === 'arriba' ? 'signal-green' : 'signal-red';
  const sma20Text = d.sma20_signal === 'arriba' ? '↑ Precio sobre SMA' : '↓ Precio bajo SMA';

  const sma50Html = d.sma50 ? `
    <div class="tech-indicator">
      <span class="tech-label">SMA 50</span>
      <span class="tech-value">$${d.sma50}</span>
      <span class="signal-tag ${d.sma50_signal === 'arriba' ? 'signal-green' : 'signal-red'}">
        ${d.sma50_signal === 'arriba' ? '↑ Alcista' : '↓ Bajista'}
      </span>
    </div>` : '';

  return `
    <div class="tech-card">
      <div class="tech-header">
        <div>
          <span class="tech-ticker">${d.ticker}</span>
          <span class="tech-nombre">${d.nombre}</span>
        </div>
        <div class="tech-precio">$${d.precio} <span class="tech-moneda">${d.moneda}</span></div>
      </div>

      <div class="tech-grid">
        <div class="tech-indicator rsi-block">
          <span class="tech-label">RSI (14)</span>
          <span class="tech-value" style="color:${rsiColor}">${d.rsi}</span>
          <div class="rsi-bar-track">
            <div class="rsi-bar-fill" style="width:${rsiFill}%; background:${rsiColor}"></div>
            <div class="rsi-zones">
              <span style="left:30%"></span>
              <span style="left:70%"></span>
            </div>
          </div>
          <span class="signal-tag ${rsiLabelClass}">${rsiLabel}</span>
        </div>

        <div class="tech-indicator">
          <span class="tech-label">SMA 20</span>
          <span class="tech-value">$${d.sma20}</span>
          <span class="signal-tag ${sma20Class}">${sma20Text}</span>
        </div>

        ${sma50Html}
      </div>
    </div>
  `;
}

// ─── AGREGAR MENSAJE ─────────────────────────
function agregarMensaje(texto, tipo) {
  const group = document.createElement('div');
  group.className = `msg-group ${tipo}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = tipo === 'bot' ? 'F' : 'S';

  const content = document.createElement('div');
  content.className = 'msg-content';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  if (tipo === 'bot') {
    bubble.innerHTML = renderTexto(texto);
  } else {
    bubble.textContent = texto;
  }

  content.appendChild(bubble);
  group.appendChild(avatar);
  group.appendChild(content);
  chatContainer.appendChild(group);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  return group;
}

// ─── TYPING INDICATOR ────────────────────────
function mostrarTyping() {
  const group = document.createElement('div');
  group.className = 'msg-group bot';
  group.id = 'typing';

  group.innerHTML = `
    <div class="msg-avatar">F</div>
    <div class="msg-content">
      <div class="typing-bubble">
        <div class="dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;

  chatContainer.appendChild(group);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function quitarTyping() {
  const el = document.getElementById('typing');
  if (el) el.remove();
}

// ─── ENVIAR MENSAJE ──────────────────────────
async function enviarMensaje() {
  const texto = inputMensaje.value.trim();
  if (!texto) return;

  inputMensaje.value = '';
  btnEnviar.disabled = true;

  agregarMensaje(texto, 'user');
  mostrarTyping();

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto })
    });

    const data = await res.json();
    quitarTyping();
    agregarMensaje(data.respuesta, 'bot');

  } catch (err) {
    quitarTyping();
    agregarMensaje('No se pudo conectar con el servidor. Verificá que el backend esté corriendo.', 'bot');
  } finally {
    btnEnviar.disabled = false;
    inputMensaje.focus();
  }
}

function enviarSugerencia(texto) {
  inputMensaje.value = texto;
  enviarMensaje();
}

// ─── RESET CHAT ───────────────────────────────
async function resetearChat() {
  try {
    await fetch(`${BASE_URL}/reset`, { method: 'POST' });
  } catch (err) {
    // Si falla el reset en backend, igual limpiamos el frontend
  }

  // Limpiar el chat visual y mostrar el saludo inicial
  chatContainer.innerHTML = `
    <div class="msg-group bot">
      <div class="msg-avatar">F</div>
      <div class="msg-content">
        <div class="msg-bubble">
          <p>Hola 👋 Soy <strong>FinBot</strong>, tu asistente financiero personal.</p>
          <p>Puedo ayudarte con precios en tiempo real, análisis de empresas y comparaciones entre activos.</p>
        </div>
        <div class="quick-actions">
          <button class="qa-btn" onclick="enviarSugerencia('¿Cuál es el precio de Apple?')">🍎 Apple</button>
          <button class="qa-btn" onclick="enviarSugerencia('¿Cómo está Bitcoin hoy?')">₿ Bitcoin</button>
          <button class="qa-btn" onclick="enviarSugerencia('Compará SPY vs QQQ')">⚔️ SPY vs QQQ</button>
          <button class="qa-btn" onclick="enviarSugerencia('Info de Tesla')">🚗 Tesla</button>
          <button class="qa-btn" onclick="enviarSugerencia('Agregá AAPL a mi watchlist')">+ Watchlist</button>
        </div>
      </div>
    </div>
  `;
}

// ─── NAVEGACIÓN ──────────────────────────────
function mostrarPantalla(nombre) {
  ['chat', 'mercados', 'portfolio'].forEach(p => {
    const pantalla = document.getElementById(`pantalla-${p}`);
    const nav = document.getElementById(`nav-${p}`);
    if (p === nombre) {
      pantalla.style.display = 'flex';
      pantalla.style.flexDirection = 'column';
      pantalla.style.height = '100%';
      nav.classList.add('active');
    } else {
      pantalla.style.display = 'none';
      nav.classList.remove('active');
    }
  });

  if (nombre === 'mercados') cargarWatchlist();
}

// ─── WATCHLIST ───────────────────────────────
async function cargarWatchlist() {
  const container = document.getElementById('watchlistContainer');
  container.innerHTML = '<div class="wl-loading">Cargando...</div>';

  try {
    const res = await fetch(`${BASE_URL}/watchlist`);
    const data = await res.json();

    if (data.items.length === 0) {
      container.innerHTML = `
        <div class="wl-empty">
          <div class="wl-empty-icon">📋</div>
          <p>Tu watchlist está vacía.</p>
          <p class="wl-empty-sub">Agregá un ticker abajo o decile al agente<br>"Agregá Apple a mi watchlist"</p>
        </div>`;
      return;
    }

    container.innerHTML = data.items.map(item => {
      const varClass = item.variacion >= 0 ? 'var-green' : 'var-red';
      const varSign = item.variacion >= 0 ? '+' : '';
      return `
        <div class="wl-card">
          <div class="wl-card-left">
            <span class="wl-ticker">${item.ticker}</span>
            <span class="wl-nombre">${item.nombre}</span>
          </div>
          <div class="wl-card-right">
            <span class="wl-precio">$${item.precio} <span class="wl-moneda">${item.moneda}</span></span>
            <span class="wl-variacion ${varClass}">${varSign}${item.variacion}%</span>
          </div>
          <button class="wl-remove" onclick="eliminarTicker('${item.ticker}')" title="Eliminar">✕</button>
        </div>`;
    }).join('');

  } catch (err) {
    container.innerHTML = '<div class="wl-loading">❌ Error al conectar con el servidor.</div>';
  }
}

async function agregarDesdeInput() {
  const input = document.getElementById('inputTicker');
  const ticker = input.value.trim().toUpperCase();
  if (!ticker) return;

  input.value = '';
  await fetch(`${BASE_URL}/watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker })
  });

  cargarWatchlist();
}

async function eliminarTicker(ticker) {
  await fetch(`${BASE_URL}/watchlist/${ticker}`, { method: 'DELETE' });
  cargarWatchlist();
}

// Enter en el input de watchlist
document.addEventListener('DOMContentLoaded', () => {
  const inputTicker = document.getElementById('inputTicker');
  if (inputTicker) {
    inputTicker.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') agregarDesdeInput();
    });
  }
});
