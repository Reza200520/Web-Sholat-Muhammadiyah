<?php
require_once __DIR__ . '/config/helpers.php';
$kelompok = get_kelompok($pdo);
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tuntunan Tata Cara Sholat | <?= e($kelompok['nama_kelompok']) ?></title>
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<?php include __DIR__ . '/partials/header.php'; ?>

<main class="container">
  <section class="hero">
    <span class="eyebrow">Panduan Sholat Digital</span>
    <h1>Tuntunan Tata Cara Sholat<span>Sesuai Sunnah Rasulullah ﷺ</span></h1>
    <p class="hero-sub">Gerakan dan bacaan disusun mengikuti Himpunan Putusan Tarjih (HPT) Muhammadiyah — lengkap dengan teks Arab, transliterasi Latin, terjemahan, audio, dan opsi video.</p>
  </section>

  <section class="mode-select">
    <h2>Pilih Mode Penyajian</h2>
    <div class="mode-cards">
      <a href="daftar.php?kategori=dewasa" class="mode-card mode-dewasa">
        <span class="mode-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V11a8 8 0 0 1 16 0v10"/><path d="M4 21h16"/><path d="M9 21v-6a3 3 0 0 1 6 0v6"/></svg>
        </span>
        <h3>Mode Dewasa</h3>
        <p>Penyajian lengkap &amp; formal dengan teks penuh dan keterangan sumber.</p>
        <span class="mode-go">Buka daftar gerakan →</span>
      </a>
      <a href="daftar.php?kategori=anak" class="mode-card mode-anak">
        <span class="mode-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3.4"/></svg>
        </span>
        <h3>Mode Anak-anak</h3>
        <p>Bahasa sederhana, visual ramah anak, dan terjemahan ringkas.</p>
        <span class="mode-go">Mulai belajar →</span>
      </a>
    </div>
  </section>

  <section class="info-grid">
    <div class="info-card">
      <h4>📖 4 Lapis Bacaan</h4>
      <p>Teks Arab, transliterasi Latin, terjemahan, dan audio MP3 untuk setiap bacaan.</p>
    </div>
    <div class="info-card">
      <h4>🎬 Opsi Video</h4>
      <p>Tonton video gerakan &amp; bacaan sebagai alternatif media pembelajaran.</p>
    </div>
    <div class="info-card">
      <h4>⏭️ Navigasi &amp; Autoplay</h4>
      <p>Klik gerakan mana pun, berpindah Next/Previous, atau putar otomatis berurutan.</p>
    </div>
  </section>
</main>

<?php include __DIR__ . '/partials/footer.php'; ?>
<script src="assets/js/app.js"></script>
</body>
</html>