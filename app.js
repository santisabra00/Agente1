const MEME_API = 'https://meme-api.com/gimme';

let currentMeme = null;
let savedMemes = JSON.parse(localStorage.getItem('savedMemes')) || [];

async function fetchMeme() {
  const img = document.getElementById('memeImg');
  const loader = document.getElementById('loader');
  const title = document.getElementById('memeTitle');
  const author = document.getElementById('memeAuthor');
  const ups = document.getElementById('memeUps');
  const btnNext = document.getElementById('btnNext');

  // Reset
  img.style.display = 'none';
  loader.style.display = 'block';
  btnNext.disabled = true;
  btnNext.textContent = '⏳ Cargando...';

  try {
    const res = await fetch(MEME_API);
    const data = await res.json();

    // Evitar GIFs que no cargan bien
    if (data.url.endsWith('.gif') || !data.url.includes('http')) {
      return fetchMeme();
    }

    currentMeme = data;

    img.src = data.url;
    img.onload = () => {
      loader.style.display = 'none';
      img.style.display = 'block';
    };

    title.textContent = data.title || 'Sin título';
    author.textContent = `👤 u/${data.author}`;
    ups.textContent = `⬆️ ${data.ups.toLocaleString()} upvotes`;

  } catch (err) {
    loader.textContent = '❌ Error al cargar. Intenta de nuevo.';
  } finally {
    btnNext.disabled = false;
    btnNext.textContent = '🎲 Otro meme';
  }
}

function saveMeme() {
  if (!currentMeme) return;

  const alreadySaved = savedMemes.find(m => m.url === currentMeme.url);
  if (alreadySaved) {
    showToast('¡Ya guardaste este meme! 😅');
    return;
  }

  savedMemes.push({
    url: currentMeme.url,
    title: currentMeme.title
  });

  localStorage.setItem('savedMemes', JSON.stringify(savedMemes));
  renderSaved();
  showToast('¡Meme guardado! ❤️');
}

function renderSaved() {
  const grid = document.getElementById('savedGrid');
  const section = document.getElementById('savedSection');

  if (savedMemes.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  grid.innerHTML = '';

  savedMemes.forEach(meme => {
    const img = document.createElement('img');
    img.src = meme.url;
    img.alt = meme.title;
    img.title = meme.title;
    img.onclick = () => window.open(meme.url, '_blank');
    grid.appendChild(img);
  });
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: #ff6b6b;
    color: white;
    padding: 12px 24px;
    border-radius: 50px;
    font-weight: bold;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// Arrancar
renderSaved();
fetchMeme();
