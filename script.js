// Elemen UI utama dan kontrol interaksi
const studentNamesInput = document.getElementById('studentNames');
const modeSelect = document.getElementById('modeSelect');
const groupValueInput = document.getElementById('groupValue');
const modeLabel = document.getElementById('modeLabel');
const revealBtn = document.getElementById('revealBtn');
const demoBtn = document.getElementById('demoBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const printBtn = document.getElementById('printBtn');
const summaryList = document.getElementById('summaryList');
const overlay = document.getElementById('overlay');
const modal = document.getElementById('modal');
const closeBtn = document.getElementById('closeBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const modalTitle = document.getElementById('modalTitle');
const modalMeta = document.getElementById('modalMeta');
const memberList = document.getElementById('memberList');
const muteBtn = document.getElementById('muteBtn');
const dialogOverlay = document.getElementById('dialogOverlay');
const dialogModal = document.getElementById('dialogModal');
const dialogTitle = document.getElementById('dialogTitle');
const dialogMessage = document.getElementById('dialogMessage');
const dialogInputWrap = document.querySelector('.dialog-input-wrap');
const dialogInput = document.getElementById('dialogInput');
const dialogConfirmBtn = document.getElementById('dialogConfirmBtn');
const dialogCancelBtn = document.getElementById('dialogCancelBtn');

const SOUNDS = {
  drumroll: new Audio('assets/audio/drumroll.mp3'),
  heartbeat: new Audio('assets/audio/heartbeat.mp3'),
  dunDunDun: new Audio('assets/audio/dundundun.mp3'),
  confettiPop: new Audio('assets/audio/confetti-pop.mp3'),
  animeShock: new Audio('assets/audio/animeshock.mp3'),
  btnClick: new Audio('assets/audio/btn-click.mp3'),
  yeayy: new Audio('assets/audio/yeayy.mp3?v=' + new Date().getTime()),
  cymbal: new Audio('assets/audio/cymbal.mp3?v=' + new Date().getTime()),
  fanfare: new Audio('assets/audio/fanfare.mp3'),
  vineBoom: new Audio('assets/audio/vineboom.mp3?v=' + new Date().getTime())
};

const clickSound = new Audio('assets/audio/click.mp3');

let soundEnabled = true;
let groupedResults = [];
let currentGroupIndex = 0;
let drumrollInterval = null;
let audioCtx = null;
const audioSupported = !!(window.AudioContext || window.webkitAudioContext);

// Update label input sesuai mode pemilihan
function updateModeLabel() {
  if (modeSelect.value === 'groupCount') {
    modeLabel.textContent = 'Jumlah Kelompok';
    groupValueInput.value = groupValueInput.value || 4;
  } else {
    modeLabel.textContent = 'Jumlah Anggota per Kelompok';
    groupValueInput.value = groupValueInput.value || 4;
  }
}

// Fisher-Yates shuffle untuk pembagian acak
function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Buat kelompok berdasarkan mode dan nilai input
function buildGroups(names, mode, value) {
  const shuffled = shuffleArray(names);
  const number = Math.max(1, parseInt(value, 10) || 1);

  if (mode === 'groupCount') {
    const groups = Array.from({ length: number }, () => []);
    shuffled.forEach((name, index) => {
      groups[index % number].push(name);
    });
    return groups;
  }

  const groupCount = Math.max(1, Math.ceil(shuffled.length / number));
  const groups = Array.from({ length: groupCount }, () => []);
  shuffled.forEach((name, index) => {
    groups[index % groupCount].push(name);
  });
  return groups;
}

// Parse nama mahasiswa dengan memfilter baris kosong
function parseStudents() {
  return studentNamesInput.value
    .split(/\n+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

// Render ringkasan kelompok di halaman utama setelah selesai
function renderSummary(groups) {
  if (!groups.length) {
    summaryList.innerHTML = '<p class="empty-state">Ringkasan akan muncul di sini setelah semua kelompok di-reveal.</p>';
    return;
  }

  summaryList.innerHTML = groups
    .map(
      (group, index) => `
        <article class="summary-card">
          <h3>Kelompok ${index + 1}</h3>
          <ul>
            ${group.map((name) => `<li>${name}</li>`).join('')}
          </ul>
        </article>
      `
    )
    .join('');
}

// Render konten kelompok saat modal tampil
function renderGroup(index) {
  const group = groupedResults[index];
  modalTitle.textContent = `✨ KELOMPOK ${index + 1} ✨`;
  modalMeta.textContent = `Jumlah mahasiswa: ${group.length}`;
  memberList.innerHTML = '';

  group.forEach((name, idx) => {
    const item = document.createElement('li');
    item.className = 'member-item';
    item.style.setProperty('--delay', idx);
    item.textContent = name;
    memberList.appendChild(item);
    playNameSound(idx * 100);
  });

  const isLast = index === groupedResults.length - 1;
  nextBtn.textContent = isLast ? 'Selesai 🏁' : 'Kelompok Selanjutnya ➡️';
  nextBtn.classList.toggle('done', isLast);
  prevBtn.disabled = index === 0;
  resetMemberScroll();
}

function resetMemberScroll() {
  if (!memberList) return;
  memberList.scrollTop = 0;
}

function fireConfettiCannon() {
  if (typeof confetti !== 'function') return;

  const defaults = {
    colors: ['#588157', '#6B9080', '#A8C3B8', '#DDBEA9', '#CB997E', '#83C5BE', '#FCFAF2']
  };

  // Left Cannon Blast
  confetti({
    ...defaults,
    particleCount: 80,
    angle: 60,
    spread: 75,
    origin: { x: 0.05, y: 0.85 },
    startVelocity: 65,
    scalar: 1.15
  });

  // Right Cannon Blast
  confetti({
    ...defaults,
    particleCount: 80,
    angle: 120,
    spread: 75,
    origin: { x: 0.95, y: 0.85 },
    startVelocity: 65,
    scalar: 1.15
  });

  // Center High-Velocity Explosion Burst
  confetti({
    ...defaults,
    particleCount: 60,
    spread: 100,
    origin: { x: 0.5, y: 0.55 },
    startVelocity: 45,
    decay: 0.92,
    scalar: 1.25,
    shapes: ['star', 'circle', 'square']
  });
}

// Buka modal pop-up dan jalankan confetti cannon blast
function openModal() {
  overlay.classList.add('active');
  modal.classList.add('active');
  renderGroup(currentGroupIndex);
  playRevealSound();
  fireConfettiCannon();
}

// Tutup modal
function closeModal() {
  overlay.classList.remove('active');
  modal.classList.remove('active');
}

// Lanjutkan ke kelompok berikutnya atau tampilkan ringkasan
function handleNextGroup() {
  if (currentGroupIndex < groupedResults.length - 1) {
    closeModal();
    currentGroupIndex += 1;
    openModal();
  } else {
    closeModal();
    renderSummary(groupedResults);
    playFinishSound();
    showToast('🎉 Semua kelompok telah di-reveal!', 'success');
  }
}

function handlePrevGroup() {
  if (currentGroupIndex > 0) {
    currentGroupIndex -= 1;
    renderGroup(currentGroupIndex);
  }
}

// Salin hasil ke clipboard
async function copyResult() {
  if (!groupedResults.length) {
    showToast('Tidak ada hasil untuk disalin. Jalankan reveal kelompok terlebih dahulu.');
    return;
  }

  const text = groupedResults
    .map((group, index) => `Kelompok ${index + 1}: ${group.join(', ')}`)
    .join('\n');

  try {
    await navigator.clipboard.writeText(text);
    showToast('Hasil kelompok berhasil disalin ke clipboard.');
  } catch {
    showToast('Gagal menyalin. Silakan coba manual.');
  }
}

// Cetak hasil kelompok
function printResult() {
  if (!groupedResults.length) {
    showToast('Tidak ada hasil untuk dicetak. Jalankan reveal kelompok terlebih dahulu.');
    return;
  }
  window.print();
}

// Event listeners
revealBtn.addEventListener('click', handleReveal);
modeSelect.addEventListener('change', updateModeLabel);
demoBtn.addEventListener('click', () => {
  studentNamesInput.value = ['Aira', 'Bima', 'Citra', 'Doni', 'Eka', 'Fira', 'Gilang', 'Hana', 'Irfan', 'Jeni', 'Kiki', 'Laras'].join('\n');
});
// Kocok data yang sudah ada di textarea dan perbarui isian
function shuffleInput() {
  const names = parseStudents();
  if (!names.length) {
    showToast('Tidak ada mahasiswa untuk dikocok. Isi daftar terlebih dahulu.');
    return;
  }
  studentNamesInput.classList.add('shake');
  setTimeout(() => studentNamesInput.classList.remove('shake'), 560);

  const shuffled = shuffleArray(names);
  studentNamesInput.value = shuffled.join('\n');
  playShuffleSound();
  showToast('Daftar telah dikocok');
}
shuffleBtn.addEventListener('click', shuffleInput);

function exportCSV() {
  const groups = groupedResults.length ? groupedResults : buildGroups(parseStudents(), modeSelect.value, groupValueInput.value);
  if (!groups.length) {
    showToast('Tidak ada hasil untuk diekspor. Jalankan pembagian terlebih dahulu.');
    return;
  }

  const lines = ['Kelompok,Anggota'];
  groups.forEach((g, i) => {
    g.forEach((member) => {
      // escape quotes
      const safe = `"${String(member).replace(/"/g, '""')}"`;
      lines.push(`${i+1},${safe}`);
    });
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'groupify_result.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('✅ CSV berhasil diunduh', 'success');
}
copyBtn.addEventListener('click', copyResult);
printBtn.addEventListener('click', printResult);
clearBtn.addEventListener('click', () => {
  studentNamesInput.value = '';
  groupedResults = [];
  currentGroupIndex = 0;
  renderSummary([]);
  showToast('Daftar mahasiswa dibersihkan', 'info');
});
nextBtn.addEventListener('click', handleNextGroup);
if (prevBtn) prevBtn.addEventListener('click', handlePrevGroup);
closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => event.stopPropagation());


function initAudioContext() {
  if (!audioSupported) return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
}

function startDrumroll() {
  // Drumroll disabled as requested
}

function stopDrumroll() {
  // Drumroll disabled as requested
}

// ====== AUDIO HELPERS ======
function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

// 🫧 KLIK MENU: Bubble & Soft Pop (0.1s, gentle upward sine bloop)
function playClickSound() {
  if (!soundEnabled) return;
  try {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  } catch (e) {}
  try {
    const ctx = ensureAudioCtx();
    const now = ctx.currentTime;

    // Primary bloop bubble: sine sweep up
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(860, now + 0.055);
    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);

    // Soft pop layer: slightly higher pitched, delayed bubble
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(640, now + 0.025);
    osc2.frequency.exponentialRampToValueAtTime(1100, now + 0.07);
    gain2.gain.setValueAtTime(0.0, now);
    gain2.gain.linearRampToValueAtTime(0.2, now + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.025);
    osc2.stop(now + 0.095);
  } catch (e) {}
}

// 🎮 PROSES LOADING/RANDOMIZE: 8-Bit Chiptune (fast rising arp)
function playChiptuneArp() {
  if (!soundEnabled) return;
  try {
    const ctx = ensureAudioCtx();
    const now = ctx.currentTime;
    // Chiptune uses 'square' wave - classic 8-bit NES style
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.045);
      gain.gain.setValueAtTime(0.25, now + i * 0.045);
      gain.gain.setValueAtTime(0.0, now + i * 0.045 + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.035);
    });
  } catch (e) {}
}

// ✨ MOMEN REVEAL: Sparkle Chime + Kawaii Chibi Anime "Yay!" Vocal (1 second)
function playSparkleChime() {
  if (!soundEnabled) return;
  try {
    const ctx = ensureAudioCtx();
    const now = ctx.currentTime;

    // --- Sparkle Chime: ascending then descending shimmer cascade ---
    const chimeFreqs = [1047, 1319, 1760, 2093, 2637]; // C6→E6→A6→C7→E7 sparkle rise
    chimeFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.28, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.32);
    });

    // --- Kawaii Chibi Anime "Yay!" Vocal Synthesis (1 second, high-pitched, playful) ---
    setTimeout(() => {
      try {
        const ctx2 = ensureAudioCtx();
        const t = ctx2.currentTime;
        const DUR = 1.0;

        // ── Fundamental pitch F0: ~880Hz (A5) — chibi high-pitched anime voice ──
        // Pitch contour: quick rise Y-onset → peak on "A" vowel → gentle fall on trailing "y"
        const fundamentals = [880, 960, 1040]; // harmonics stack for rich timbre

        fundamentals.forEach((baseFreq, idx) => {
          const osc = ctx2.createOscillator();
          const gain = ctx2.createGain();
          const vol = [0.5, 0.3, 0.15][idx]; // fundamental loudest, harmonics softer

          osc.type = 'sine';

          // Yay! pitch shape: shoot up on "Y" attack, sustain "Ah", glide down on trailing "y"
          osc.frequency.setValueAtTime(baseFreq * 0.82, t);           // Y- onset (slightly low)
          osc.frequency.linearRampToValueAtTime(baseFreq * 1.08, t + 0.12); // "Ah" peak (bright)
          osc.frequency.setValueAtTime(baseFreq * 1.05, t + 0.45);   // sustain
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.88, t + DUR - 0.05); // fall

          // Envelope: soft Y attack → open vowel sustain → release
          gain.gain.setValueAtTime(0.0, t);
          gain.gain.linearRampToValueAtTime(vol * 0.6, t + 0.04);    // Y- soft onset
          gain.gain.linearRampToValueAtTime(vol, t + 0.13);           // "Ah" open vowel
          gain.gain.setValueAtTime(vol * 0.85, t + 0.5);             // mid sustain
          gain.gain.linearRampToValueAtTime(vol * 0.5, t + 0.78);    // "y" glide
          gain.gain.exponentialRampToValueAtTime(0.001, t + DUR);     // tail off

          osc.connect(gain);
          gain.connect(ctx2.destination);
          osc.start(t);
          osc.stop(t + DUR + 0.02);
        });

        // ── Vibrato LFO: cute fast wobble, starts slow then speeds up (kawaii style) ──
        const lfo = ctx2.createOscillator();
        const lfoGain = ctx2.createGain();
        lfo.frequency.setValueAtTime(4, t);
        lfo.frequency.linearRampToValueAtTime(8, t + 0.5);  // vibrato speeds up
        lfoGain.gain.setValueAtTime(0, t);
        lfoGain.gain.linearRampToValueAtTime(18, t + 0.15); // delayed vibrato onset
        lfoGain.gain.setValueAtTime(22, t + 0.6);
        lfoGain.gain.linearRampToValueAtTime(8, t + DUR);

        // Apply LFO to a carrier osc as modulator target via gain modulation trick
        const lfoCarrier = ctx2.createOscillator();
        const lfoMix = ctx2.createGain();
        lfoCarrier.type = 'sine';
        lfoCarrier.frequency.setValueAtTime(880, t);
        lfoCarrier.frequency.linearRampToValueAtTime(900, t + 0.6);
        lfoMix.gain.setValueAtTime(0, t);
        lfoMix.gain.linearRampToValueAtTime(0.12, t + 0.18);
        lfoMix.gain.linearRampToValueAtTime(0.06, t + 0.85);
        lfoMix.gain.exponentialRampToValueAtTime(0.001, t + DUR);

        lfo.connect(lfoGain);
        lfoCarrier.connect(lfoMix);
        lfoMix.connect(ctx2.destination);

        lfo.start(t);
        lfo.stop(t + DUR);
        lfoCarrier.start(t);
        lfoCarrier.stop(t + DUR);

        // ── Brightness layer: high sine shimmer on top (adds "sparkle" to voice) ──
        const shimmer = ctx2.createOscillator();
        const shimmerGain = ctx2.createGain();
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(2640, t);        // E7 — airy top shimmer
        shimmer.frequency.linearRampToValueAtTime(2200, t + DUR);
        shimmerGain.gain.setValueAtTime(0, t);
        shimmerGain.gain.linearRampToValueAtTime(0.08, t + 0.08);
        shimmerGain.gain.setValueAtTime(0.07, t + 0.5);
        shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + DUR);
        shimmer.connect(shimmerGain);
        shimmerGain.connect(ctx2.destination);
        shimmer.start(t);
        shimmer.stop(t + DUR);

      } catch (e) {}
    }, 200);
  } catch (e) {}
}

// 🎺 SUARA TEROMPET REVEAL (Synthesized Brass Trumpet Fanfare + MP3 Fanfare)
function playTrumpetFanfareSynth() {
  if (!soundEnabled) return;
  try {
    const ctx = ensureAudioCtx();
    const now = ctx.currentTime;

    // Sequence nada terompet fanfare: G4 -> C5 -> E5 -> G5 (terompet megah dengan harmonik C6)
    const notes = [
      { freq: 392.00, start: 0.00, dur: 0.11 }, // G4
      { freq: 523.25, start: 0.11, dur: 0.11 }, // C5
      { freq: 659.25, start: 0.22, dur: 0.11 }, // E5
      { freq: 783.99, start: 0.33, dur: 0.65 }, // G5 (Nada panjang terompet)
      { freq: 1046.50, start: 0.33, dur: 0.65 } // C6 (Lapisan harmoni tinggi)
    ];

    notes.forEach((note) => {
      const startTime = now + note.start;
      const stopTime = startTime + note.dur;

      // Osilator utama terompet (sawtooth untuk karakter brass/terompet)
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.freq, startTime);

      // Osilator sekunder untuk kedalaman timbre
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(note.freq * 1.002, startTime);

      // Lowpass filter akustik corong terompet
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, startTime);
      filter.frequency.exponentialRampToValueAtTime(3200, startTime + 0.03);
      filter.frequency.exponentialRampToValueAtTime(2000, stopTime);
      filter.Q.value = 2.0;

      // Amplifikasi envelope khas tiupan terompet (attack tegas, sustain kuat)
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.setValueAtTime(0.20, startTime + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, stopTime);

      // Hubungkan node audio
      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      // Vibrato pada nada panjang penutup
      if (note.dur > 0.3) {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(5.5, startTime + 0.15);
        lfoGain.gain.setValueAtTime(6, startTime + 0.15);
        lfo.connect(osc.frequency);
        lfo.start(startTime + 0.15);
        lfo.stop(stopTime);
      }

      osc.start(startTime);
      osc2.start(startTime);
      osc.stop(stopTime);
      osc2.stop(stopTime);
    });
  } catch (e) {}
}

function playRevealSound() {
  if (!soundEnabled) return;
  try {
    SOUNDS.fanfare.currentTime = 0;
    SOUNDS.fanfare.play().catch(() => {});
  } catch (e) {}
  playTrumpetFanfareSynth();
}

function playFinishSound() {
  if (!soundEnabled) return;
  try {
    SOUNDS.fanfare.currentTime = 0;
    SOUNDS.fanfare.play().catch(() => {});
  } catch (e) {}
  playTrumpetFanfareSynth();
}

function playNameSound(delayMs = 0) {
  // Disabled as requested
}

function playShuffleSound() {
  playChiptuneArp();
}

function openDialog({ title, message, type = 'confirm', defaultValue = '', confirmLabel = 'Oke' }) {
  if (!dialogOverlay || !dialogModal || !dialogTitle || !dialogMessage || !dialogInputWrap || !dialogConfirmBtn || !dialogCancelBtn) return;
  closeModal();
  dialogTitle.textContent = title;
  dialogMessage.textContent = message;
  dialogConfirmBtn.textContent = confirmLabel;
  dialogInputWrap.classList.toggle('active', type === 'prompt');
  dialogInput.value = defaultValue;
  dialogOverlay.classList.add('active');
  dialogModal.classList.add('active');
  dialogInput.focus();
}

function closeDialog() {
  if (!dialogOverlay || !dialogModal) return;
  dialogOverlay.classList.remove('active');
  dialogModal.classList.remove('active');
  dialogConfirmBtn.onclick = null;
  dialogCancelBtn.onclick = null;
}

function showConfirmDialog(message, onConfirm, onCancel) {
  openDialog({ title: 'Konfirmasi', message, type: 'confirm', confirmLabel: 'Ya' });
  dialogConfirmBtn.onclick = () => {
    closeDialog();
    onConfirm && onConfirm();
  };
  dialogCancelBtn.onclick = () => {
    closeDialog();
    onCancel && onCancel();
  };
}

function showPromptDialog(message, defaultValue, onSubmit) {
  openDialog({ title: 'Masukkan nilai', message, type: 'prompt', defaultValue, confirmLabel: 'Simpan' });
  dialogConfirmBtn.onclick = () => {
    const value = dialogInput.value.trim();
    closeDialog();
    onSubmit && onSubmit(value);
  };
  dialogCancelBtn.onclick = () => {
    closeDialog();
  };
}

// Toast notification helper (create container if missing to avoid alert fallback)
function showToast(msg, type = 'info', timeout = 3000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  // force reflow
  void t.offsetWidth;
  t.classList.add('show');
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 280);
  }, timeout);
}

// Universal Click Listener via Event Delegation for all interactive elements
const triggerClickIfInteractive = (e) => {
  const target = e.target;
  const selector = 'button, a, .menu-item, input[type="button"], input[type="submit"], input, select, textarea, label, option, .tab-btn, .close-btn, [role="button"], .ghost-btn, .secondary-btn, .primary-btn, .field-card';
  const interactive = target.closest(selector);
  if (interactive && interactive.id !== 'muteBtn') {
    initAudioContext();
    playClickSound();
  }
};

document.addEventListener('pointerdown', triggerClickIfInteractive, { capture: true, passive: true });
document.addEventListener('click', triggerClickIfInteractive, { capture: true, passive: true });
document.addEventListener('change', triggerClickIfInteractive, { capture: true, passive: true });

window.addEventListener('keydown', () => {
  initAudioContext();
}, { once: true });

dialogOverlay.addEventListener('click', closeDialog);
dialogModal.addEventListener('click', (event) => event.stopPropagation());
dialogInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    dialogConfirmBtn.click();
  }
});

// Auto-shuffle confirmation when toggled on
// Handle reveal
function handleReveal() {
  playClickSound();

  let names = parseStudents();

  // If input is empty, auto-populate with demo data so reveal process always works
  if (!names.length) {
    const demoList = ['Aira', 'Bima', 'Citra', 'Doni', 'Eka', 'Fira', 'Gilang', 'Hana', 'Irfan', 'Jeni', 'Kiki', 'Laras'];
    studentNamesInput.value = demoList.join('\n');
    names = demoList;
    showToast('✨ Memuat data demo secara otomatis...', 'info');
  }

  const finalNames = names;
  groupedResults = buildGroups(finalNames, modeSelect.value, groupValueInput.value);
  currentGroupIndex = 0;
  summaryList.innerHTML = '<p class="empty-state">Ringkasan akan muncul setelah semua kelompok selesai di-reveal.</p>';
  openModal();
}

// Import CSV handling: accepts simple CSV or single-column name lists

function updateMuteButton() {
  if (!muteBtn) return;
  muteBtn.textContent = soundEnabled ? '🔊' : '🔇';
  muteBtn.setAttribute('aria-pressed', String(!soundEnabled));
  muteBtn.classList.toggle('active', !soundEnabled);
}

function enableInitialAudioState() {
  try {
    const saved = localStorage.getItem('groupify_sound');
    soundEnabled = saved !== 'off';
  } catch (e) {
    soundEnabled = true;
  }
  updateMuteButton();
}

function initializeMuteControl() {
  if (!muteBtn) return;
  muteBtn.addEventListener('click', () => {
    initAudioContext();
    soundEnabled = !soundEnabled;
    if (!soundEnabled) {
      stopDrumroll();
    }
    localStorage.setItem('groupify_sound', soundEnabled ? 'on' : 'off');
    updateMuteButton();
    showToast(soundEnabled ? 'Suara: Hidup' : 'Suara: Mati');
  });
}

enableInitialAudioState();
initializeMuteControl();

