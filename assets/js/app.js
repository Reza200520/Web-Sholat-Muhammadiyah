/* ============================================================
   app.js — Logika Front-end Tuntunan Tata Cara Sholat
   F-01 daftar gerakan | F-02 detail | F-03 audio | F-04 video
   F-05 next/prev | F-06 autoplay berfokus audio
   ============================================================ */

const SholatApp = (() => {
  let autoplayTimer = null;
  const AUTOPLAY_DELAY_MS = 6000; // Jeda cadangan jika tidak ada audio pada gerakan

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal memuat data dari server');
    return res.json();
  }

  // ---------- F-01: Daftar Gerakan ----------
  function renderSkeletonList(listEl, count = 5) {
    listEl.innerHTML = Array.from({ length: count }).map(() => `
      <li class="gerakan-item skeleton">
        <span class="gerakan-num skeleton-bar" style="width:36px;border-radius:50%;"></span>
        <span class="gerakan-name skeleton-bar" style="width:${40 + Math.random() * 35}%;"></span>
      </li>
    `).join('');
  }

  async function renderGerakanList(kategori) {
    const listEl = document.getElementById('gerakan-list');
    renderSkeletonList(listEl);
    try {
      const json = await fetchJSON(`api/gerakan.php?kategori=${encodeURIComponent(kategori)}`);
      const data = json.data || [];
      if (!data.length) {
        listEl.innerHTML = '<li class="loading">Belum ada data gerakan.</li>';
        return;
      }
      listEl.innerHTML = data.map((g, i) => `
        <li class="gerakan-item" data-id="${g.id}" style="animation-delay:${i * 45}ms">
          <span class="gerakan-num">${g.urutan}</span>
          <span class="gerakan-name">${escapeHTML(g.nama)}</span>
          <span class="gerakan-arrow">›</span>
        </li>
      `).join('');

      listEl.querySelectorAll('.gerakan-item').forEach(item => {
        item.addEventListener('click', () => {
          window.location.href = `detail.php?id=${item.dataset.id}&kategori=${encodeURIComponent(kategori)}`;
        });
      });
    } catch (err) {
      listEl.innerHTML = `<li class="loading">⚠️ ${err.message}. Pastikan backend &amp; database aktif.</li>`;
    }
  }

  // ---------- F-02/F-03/F-04: Detail Gerakan ----------
  async function renderDetail(id, kategori) {
    const container = document.getElementById('detail-content');
    const bcCurrent = document.getElementById('bc-current');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnAutoplay = document.getElementById('btn-autoplay');

    stopAutoplayTimer();

    container.innerHTML = `
      <div class="skeleton-bar" style="height:200px;border-radius:20px;margin-bottom:22px;"></div>
      <div class="skeleton-bar" style="height:22px;width:60%;margin-bottom:12px;"></div>
      <div class="skeleton-bar" style="height:14px;width:90%;margin-bottom:8px;"></div>
      <div class="skeleton-bar" style="height:14px;width:80%;"></div>
    `;

    try {
      const json = await fetchJSON(`api/detail.php?id=${id}`);
      const g = json.data;
      if (bcCurrent) bcCurrent.textContent = g.nama;
      document.title = `${g.nama} | Tuntunan Tata Cara Sholat`;
      document.body.dataset.id = id;

      const bacaanHTML = (g.bacaan || []).map(b => `
        <div class="bacaan-block">
          ${b.teks_arab ? `<div class="bacaan-arab">${escapeHTML(b.teks_arab)}</div>` : ''}
          ${b.teks_latin ? `<div class="bacaan-latin">${escapeHTML(b.teks_latin)}</div>` : ''}
          ${b.terjemahan ? `<div class="bacaan-terjemahan">"${escapeHTML(b.terjemahan)}"</div>` : ''}
          ${b.audio_url ? `<audio controls src="${escapeAttr(b.audio_url)}">Browser Anda tidak mendukung audio.</audio>` : ''}
          ${b.sumber ? `<div class="bacaan-sumber">Sumber: ${escapeHTML(b.sumber)}</div>` : ''}
        </div>
      `).join('') || '<p class="bacaan-terjemahan">Tidak ada bacaan khusus pada gerakan ini.</p>';

      const videoHTML = g.video_url ? `
        <button class="video-toggle" id="toggle-video">🎬 Tampilkan Video</button>
        <div class="video-wrap" id="video-wrap" style="display:none;">
          <video controls src="${escapeAttr(g.video_url)}"></video>
        </div>
      ` : '';

      container.innerHTML = `
        ${g.gambar_url ? `<img class="detail-image" src="${escapeAttr(g.gambar_url)}" alt="${escapeAttr(g.nama)}" onerror="this.style.display='none'">` : ''}
        <h1 class="detail-title">${g.urutan}. ${escapeHTML(g.nama)}</h1>
        <p class="detail-desc">${escapeHTML(g.deskripsi || '')}</p>
        ${bacaanHTML}
        ${videoHTML}
      `;

      const toggleVideoBtn = document.getElementById('toggle-video');
      if (toggleVideoBtn) {
        toggleVideoBtn.addEventListener('click', () => {
          const wrap = document.getElementById('video-wrap');
          const show = wrap.style.display === 'none';
          wrap.style.display = show ? 'block' : 'none';
          toggleVideoBtn.textContent = show ? '🎬 Sembunyikan Video' : '🎬 Tampilkan Video';
        });
      }

      // ---------- F-05: Navigasi Next/Previous ----------
      btnPrev.disabled = !g.prev_id;
      btnNext.disabled = !g.next_id;
      btnPrev.onclick = () => g.prev_id && goTo(g.prev_id, kategori);
      btnNext.onclick = () => g.next_id && goTo(g.next_id, kategori);

      // ---------- F-06: Autoplay Berfokus Audio ----------
      btnAutoplay.onclick = () => toggleAutoplay(g, kategori, btnAutoplay);

      // Ambil elemen audio pertama dari container (jika ada) — video tidak pernah ikut dipertimbangkan
      const firstAudio = getAutoplayAudio();

      if (sessionStorage.getItem('autoplay') === '1') {
        btnAutoplay.textContent = '⏸ Hentikan Autoplay';
        btnAutoplay.classList.add('playing');

        // Pastikan video (jika ada) tidak ikut berjalan saat autoplay audio aktif
        pauseAnyPlayingVideo();

        if (firstAudio) {
          // Putar audio otomatis
          firstAudio.play().catch(() => {
            // Browser memblokir auto-play tanpa interaksi user -> gunakan fallback timer
            startAutoplayTimer(g, kategori, btnAutoplay);
          });

          // Pindah otomatis saat file audio selesai berbunyi
          firstAudio.addEventListener('ended', () => {
            if (g.next_id) {
              goTo(g.next_id, kategori);
            } else {
              sessionStorage.setItem('autoplay', '0');
              btnAutoplay.textContent = '▶ Putar Otomatis';
              btnAutoplay.classList.remove('playing');
            }
          });
        } else {
          // Jika gerakan tidak memiliki audio, gunakan timer sebagai cadangan
          startAutoplayTimer(g, kategori, btnAutoplay);
        }
      }

    } catch (err) {
      container.innerHTML = `<p class="loading">⚠️ ${err.message}. Pastikan backend &amp; database aktif.</p>`;
    }
  }

  function goTo(id, kategori) {
    window.location.href = `detail.php?id=${id}&kategori=${encodeURIComponent(kategori)}`;
  }

  // Fitur autoplay HANYA berpatokan pada elemen <audio> di dalam #detail-content.
  // Elemen <video> sengaja diabaikan (video hanya diputar manual lewat tombol toggle).
  function getAutoplayAudio() {
    const container = document.getElementById('detail-content');
    return container ? container.querySelector('audio') : null;
  }

  // Menghentikan video jika sedang diputar, agar tidak "bentrok" dengan audio autoplay
  function pauseAnyPlayingVideo() {
    const container = document.getElementById('detail-content');
    const video = container ? container.querySelector('video') : null;
    if (video && !video.paused) video.pause();
  }

  function toggleAutoplay(g, kategori, btn) {
    const active = sessionStorage.getItem('autoplay') === '1';
    if (active) {
      sessionStorage.setItem('autoplay', '0');
      stopAutoplayTimer();
      
      // Hentikan audio yang sedang menyala jika autoplay dimatikan manual
      const activeAudio = getAutoplayAudio();
      if (activeAudio) activeAudio.pause();

      btn.textContent = '▶ Putar Otomatis';
      btn.classList.remove('playing');
    } else {
      sessionStorage.setItem('autoplay', '1');
      btn.textContent = '⏸ Hentikan Autoplay';
      btn.classList.add('playing');

      // Autoplay hanya menyalakan audio; video (jika sedang diputar manual) dihentikan
      pauseAnyPlayingVideo();

      const firstAudio = getAutoplayAudio();
      if (firstAudio) {
        firstAudio.play().catch(() => {});
        firstAudio.addEventListener('ended', () => {
          if (g.next_id) goTo(g.next_id, kategori);
        });
      } else {
        startAutoplayTimer(g, kategori, btn);
      }
    }
  }

  function startAutoplayTimer(g, kategori, btn) {
    stopAutoplayTimer();
    btn.textContent = '⏸ Hentikan Autoplay';
    btn.classList.add('playing');
    autoplayTimer = setTimeout(() => {
      if (g.next_id) {
        goTo(g.next_id, kategori);
      } else {
        sessionStorage.setItem('autoplay', '0');
        btn.textContent = '▶ Putar Otomatis';
        btn.classList.remove('playing');
      }
    }, AUTOPLAY_DELAY_MS);
  }

  function stopAutoplayTimer() {
    if (autoplayTimer) clearTimeout(autoplayTimer);
    autoplayTimer = null;
  }

  function escapeHTML(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
  function escapeAttr(str) {
    return (str || '').replace(/"/g, '&quot;');
  }

  return { renderGerakanList, renderDetail };
})();