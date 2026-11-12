import "./style.css";
import "./responsive.css";
import {
  auth, configured, googleProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, onAuthStateChanged
} from "./firebase.js";

const $ = (s, el=document) => el.querySelector(s);
const app = $("#app");
const dhikrChoices = [
  ["سُبْحَانَ اللَّهِ", "Subhanallah"],
  ["الْحَمْدُ لِلَّهِ", "Alhamdulillah"],
  ["اللَّهُ أَكْبَرُ", "Allahu Akbar"],
  ["أَسْتَغْفِرُ اللَّهَ", "Astaghfirullah"]
];
const offlineQuizQuestions = [
  { number: 1, englishName: "Al-Fatihah", englishNameTranslation: "The Opening", name: "الفَاتِحَة", ayahNumber: 2, arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", translation: "Segala puji bagi Allah, Tuhan seluruh alam." },
  { number: 93, englishName: "Ad-Duha", englishNameTranslation: "The Morning Hours", name: "الضُّحَىٰ", ayahNumber: 1, arabic: "وَالضُّحَىٰ", translation: "Demi waktu duha (ketika matahari naik sepenggalah)." },
  { number: 94, englishName: "Ash-Sharh", englishNameTranslation: "The Relief", name: "الشَّرْح", ayahNumber: 5, arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", translation: "Maka sesungguhnya beserta kesulitan ada kemudahan." },
  { number: 97, englishName: "Al-Qadr", englishNameTranslation: "The Power", name: "الْقَدْر", ayahNumber: 1, arabic: "إِنَّا أَنْزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ", translation: "Sesungguhnya Kami telah menurunkannya (Al-Qur’an) pada malam qadar." },
  { number: 103, englishName: "Al-Asr", englishNameTranslation: "The Declining Day", name: "الْعَصْر", ayahNumber: 1, arabic: "وَالْعَصْرِ", translation: "Demi masa." },
  { number: 105, englishName: "Al-Fil", englishNameTranslation: "The Elephant", name: "الْفِيل", ayahNumber: 1, arabic: "أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ", translation: "Tidakkah engkau (Muhammad) memperhatikan bagaimana Tuhanmu telah bertindak terhadap pasukan bergajah?" },
  { number: 107, englishName: "Al-Ma'un", englishNameTranslation: "Small Kindnesses", name: "الْمَاعُون", ayahNumber: 1, arabic: "أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ", translation: "Tahukah kamu (orang) yang mendustakan agama?" },
  { number: 108, englishName: "Al-Kawthar", englishNameTranslation: "The Abundance", name: "الْكَوْثَر", ayahNumber: 1, arabic: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ", translation: "Sungguh, Kami telah memberimu (Muhammad) nikmat yang banyak." },
  { number: 109, englishName: "Al-Kafirun", englishNameTranslation: "The Disbelievers", name: "الْكَافِرُون", ayahNumber: 1, arabic: "قُلْ يَا أَيُّهَا الْكَافِرُونَ", translation: "Katakanlah (Muhammad), “Wahai orang-orang kafir!" },
  { number: 112, englishName: "Al-Ikhlas", englishNameTranslation: "The Sincerity", name: "الْإِخْلَاص", ayahNumber: 1, arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ", translation: "Katakanlah (Muhammad), “Dialah Allah, Yang Maha Esa.”" },
  { number: 113, englishName: "Al-Falaq", englishNameTranslation: "The Daybreak", name: "الْفَلَق", ayahNumber: 1, arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ", translation: "Katakanlah, “Aku berlindung kepada Tuhan yang menguasai subuh (fajar)." },
  { number: 114, englishName: "An-Nas", englishNameTranslation: "Mankind", name: "النَّاس", ayahNumber: 1, arabic: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ", translation: "Katakanlah, “Aku berlindung kepada Tuhannya manusia." }
].map(({ number, englishName, englishNameTranslation, name, ...ayah }) => ({
  ...ayah,
  surah: { number, englishName, englishNameTranslation, name }
}));
const quizBestKey = "nq-quiz-best";
const state = {
  user: null, surahs: [], currentSurah: null, currentAudio: null, audio: new Audio(),
  prayer: null, locationName: "Lokasi belum dipilih", coords: null,
  tasbih: Number(localStorage.getItem("nq-tasbih") || 0),
  target: Number(localStorage.getItem("nq-target") || 33),
  dhikr: localStorage.getItem("nq-dhikr") || "Subhanallah",
  bookmarks: JSON.parse(localStorage.getItem("nq-bookmarks") || "[]"),
  history: JSON.parse(localStorage.getItem("nq-history") || "[]"),
  settings: JSON.parse(localStorage.getItem("nq-settings") || '{"translation":true,"arabicSize":32}'),
  quiz: {
    question: null,
    choices: [],
    score: 0,
    best: Number(localStorage.getItem(quizBestKey) || 0),
    answered: false,
    selected: null,
    loading: false,
    error: ""
  },
  recording: {
    recorder: null,
    stream: null,
    chunks: [],
    url: null,
    urlMime: "",
    seconds: 0,
    timer: null,
    status: "Rekaman hanya disimpan sementara di perangkat ini."
  },
  surahsLoading: null,
  activeTab: "home"
};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtDate = d => new Intl.DateTimeFormat("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(d);
const fmtTime = t => t ? t.slice(0,5) : "--:--";

function shell() {
  app.innerHTML = `
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#" data-tab="home"><span class="brand-mark">ن</span><span><b>NurQuran</b><small>Teman ibadah harian</small></span></a>
      <div class="side-label">MENU UTAMA</div>
      <nav>
        <button data-tab="home" class="nav-item active"><i>⌂</i> Beranda</button>
        <button data-tab="quran" class="nav-item"><i>۞</i> Al-Qur'an</button>
        <button data-tab="prayer" class="nav-item"><i>◷</i> Jadwal Salat</button>
        <button data-tab="tasbih" class="nav-item"><i>◎</i> Tasbih Digital</button>
        <button data-tab="practice" class="nav-item"><i>♫</i> Latihan & Rekam</button>
        <button data-tab="bookmark" class="nav-item"><i>♡</i> Ayat Tersimpan</button>
        <button data-tab="qibla" class="nav-item"><i>⌖</i> Arah Kiblat</button>
      </nav>
      <div class="sidebar-bottom">
        <div class="mini-quote">“Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.”<small>QS. Ar-Ra'd: 28</small></div>
        <button class="profile-button" id="profileBtn"><span class="avatar">${state.user ? esc((state.user.displayName||state.user.email||"U")[0].toUpperCase()) : "?"}</span><span><b>${state.user ? esc(state.user.displayName || state.user.email) : "Masuk akun"}</b><small>${state.user ? "Akun tersinkron" : "Login / daftar"}</small></span><span class="more">•••</span></button>
      </div>
    </aside>
    <main class="main">
      <header class="topbar"><div><div class="eyebrow" id="dateText">${fmtDate(new Date())}</div><h1 id="pageTitle">Assalamu’alaikum</h1></div><div class="top-actions"><span class="location-chip" id="locationChip">⌖ ${esc(state.locationName)}</span><button class="icon-btn" id="installBtn" title="Pasang aplikasi" hidden>＋</button><button class="icon-btn" id="accountTop" title="Akun">♙</button></div></header>
      <section id="view"></section>
      <footer>NurQuran <span>•</span> Semoga setiap ayat menjadi cahaya dalam langkahmu.</footer>
    </main>
    <nav class="mobile-nav">
      <button data-tab="home" class="active">⌂<small>Home</small></button><button data-tab="quran">۞<small>Qur'an</small></button><button data-tab="prayer">◷<small>Salat</small></button><button data-tab="tasbih">◎<small>Tasbih</small></button><button data-tab="practice">♫<small>Latihan</small></button><button data-tab="bookmark">♡<small>Simpan</small></button><button data-tab="qibla">⌖<small>Kiblat</small></button>
    </nav>
  </div>`;
  $$("[data-tab]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); navigate(b.dataset.tab); }));
  $("#profileBtn").onclick = $("#accountTop").onclick = openAuth;
  $("#installBtn").onclick = installPwa;
  renderView();
}
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
function navigate(tab) {
  if(state.recording.recorder?.state==="recording"&&tab!=="practice")stopRecording("Rekaman dihentikan saat berpindah menu.");
  state.activeTab=tab;
  $$(".nav-item, .mobile-nav button").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab));
  renderView();
  $("#pageTitle").textContent = ({home:"Assalamu’alaikum",quran:"Al-Qur’an",prayer:"Jadwal Salat",tasbih:"Tasbih Digital",practice:"Latihan & Rekam",bookmark:"Ayat Tersimpan",qibla:"Arah Kiblat"})[tab];
}
function renderView() {
  const v=$("#view"); if(!v) return;
  if(state.activeTab==="home") v.innerHTML=homeView();
  if(state.activeTab==="quran") v.innerHTML=quranView();
  if(state.activeTab==="prayer") v.innerHTML=prayerView();
  if(state.activeTab==="tasbih") v.innerHTML=tasbihView();
  if(state.activeTab==="practice") v.innerHTML=practiceView();
  if(state.activeTab==="bookmark") v.innerHTML=bookmarkView();
  if(state.activeTab==="qibla") v.innerHTML=qiblaView();
  bindView();
}
function homeView() {
  const p=state.prayer;
  const last=state.history[0];
  return `<div class="welcome-row"><div><p class="muted">Selamat datang di ruang ibadahmu</p><h2>Tenangkan hati,<br><em>dekatkan diri pada-Nya.</em></h2><p class="muted">Mulai hari dengan membaca ayat suci Al-Qur’an.</p><button class="primary-btn" data-go="quran">Baca Al-Qur’an <span>→</span></button></div><div class="hero-art"><div class="moon"></div><div class="mosque">☾</div><span>نور</span></div></div>
  <div class="section-head"><div><span class="eyebrow">WAKTU IBADAH</span><h3>Jadwal salat hari ini</h3></div><button class="text-btn" data-go="prayer">Lihat semua →</button></div>
  <div class="prayer-strip">${prayerMini("Subuh",p?.Fajr)}${prayerMini("Zuhur",p?.Dhuhr)}${prayerMini("Asar",p?.Asr)}${prayerMini("Magrib",p?.Maghrib)}${prayerMini("Isya",p?.Isha)}</div>
  <div class="grid-two"><div class="panel continue"><span class="eyebrow">LANJUTKAN BACAAN</span><h3>${last ? esc(last.surahName) : "Mulai tilawah hari ini"}</h3><p class="muted">${last ? `Terakhir dibaca ayat ${last.ayah}` : "Temukan ketenangan melalui ayat-ayat Al-Qur’an."}</p><button class="outline-btn" data-go="quran">${last?"Lanjutkan":"Jelajahi surah"} →</button></div><div class="panel daily"><span class="eyebrow">DZIKIR HARIAN</span><div class="daily-count">${state.tasbih}</div><p class="muted">Hitungan tasbih tersimpan</p><button class="outline-btn" data-go="tasbih">Buka tasbih →</button></div></div>
  <div class="section-head"><div><span class="eyebrow">MULAI DARI SINI</span><h3>Fitur NurQuran</h3></div></div>
  <div class="feature-grid"><button class="feature-card" data-go="quran"><span>۞</span><b>Al-Qur’an 30 Juz</b><small>114 surah dan terjemahan</small></button><button class="feature-card" data-go="prayer"><span>◷</span><b>Jadwal Salat</b><small>Menyesuaikan lokasi</small></button><button class="feature-card" data-go="tasbih"><span>◎</span><b>Tasbih Digital</b><small>Hitung dzikir harian</small></button><button class="feature-card" data-go="practice"><span>♫</span><b>Latihan & Rekam</b><small>Tebak ayat, rekam murajaah</small></button><button class="feature-card" data-go="qibla"><span>⌖</span><b>Arah Kiblat</b><small>Kompas berbasis lokasi</small></button></div>`;
}
function prayerMini(name,time){return `<div class="prayer-mini"><small>${name}</small><b>${fmtTime(time)}</b></div>`}
function quranView() {
 return `<div class="quran-tools"><label class="search-box">⌕ <input id="surahSearch" placeholder="Cari nama atau nomor surah..." /></label><span class="muted" id="surahCount">Memuat daftar surah…</span></div><div id="surahList" class="surah-list"><div class="loading">Memuat 114 surah…</div></div><div id="reader"></div>`;
}
function prayerView(){
 const p=state.prayer;
 return `<div class="prayer-banner"><div><span class="eyebrow">JADWAL HARI INI</span><h2>${esc(state.locationName)}</h2><p>${fmtDate(new Date())}</p><button class="primary-btn" id="refreshLocation">Perbarui lokasi ⌖</button></div><div class="next-box"><small>WAKTU SALAT BERIKUTNYA</small><strong>${nextPrayer().name}</strong><b>${fmtTime(nextPrayer().time)}</b></div></div><div class="prayer-table">${[["Imsak",p?.Imsak],["Subuh",p?.Fajr],["Terbit",p?.Sunrise],["Zuhur",p?.Dhuhr],["Asar",p?.Asr],["Magrib",p?.Maghrib],["Isya",p?.Isha]].map(([n,t])=>`<div class="prayer-line"><span>${n}</span><b>${fmtTime(t)}</b></div>`).join("")}</div><p class="note">Jadwal dihitung berdasarkan koordinat perangkat melalui layanan Aladhan. Waktu dapat berbeda beberapa menit dari jadwal masjid setempat; sesuaikan metode/perhitungan jika diperlukan.</p>`;
}
function tasbihView(){
 const selected=dhikrChoices.find(([,name])=>name===state.dhikr)||dhikrChoices[0];
 return `<div class="tasbih-layout"><div class="panel tasbih-panel"><span class="eyebrow">HITUNGAN DZIKIR</span><div class="tasbih-count" id="tasbihCount" aria-live="polite">${state.tasbih}</div><div class="progress-track" role="progressbar" aria-label="Progres target dzikir" aria-valuemin="0" aria-valuemax="${state.target}" aria-valuenow="${Math.min(state.target,state.tasbih)}"><div id="tasbihProgress" style="width:${Math.min(100,state.tasbih/state.target*100)}%"></div></div><p class="muted">Target: ${state.target} hitungan</p><button class="tasbih-button" id="countBtn" aria-label="Tambah hitungan dzikir">${selected[0]}<br><small>${selected[1].toUpperCase()} • KETUK UNTUK BERDZIKIR</small></button><div class="tasbih-actions"><button class="outline-btn" id="resetTasbih">↺ Reset</button><button class="outline-btn" id="targetBtn">Target: ${state.target}</button></div></div><div class="panel dhikr-list"><span class="eyebrow">PILIHAN DZIKIR</span><h3>Dzikir sederhana</h3>${dhikrChoices.map(([a,b])=>`<button class="dhikr-choice${state.dhikr===b?" chosen":""}" data-dhikr="${b}" aria-pressed="${state.dhikr===b}"><b>${a}</b><small>${b}</small></button>`).join("")}<p class="note">Hitungan dan pilihan dzikir tersimpan otomatis di perangkat ini.</p></div></div>`;
}
function practiceView(){
 const quiz=state.quiz, recording=state.recording;
 const question=quiz.question;
 const feedback=quiz.answered
  ? `<div class="quiz-feedback ${quiz.selected===question.surah.number?"correct":"incorrect"}" role="status">${quiz.selected===question.surah.number?"Benar, alhamdulillah!":"Belum tepat."} Jawabannya: ${esc(question.surah.englishName)} (${esc(question.surah.name)}), ayat ${question.ayahNumber}.</div><p class="arabic quiz-verse" lang="ar" dir="rtl">${esc(question.arabic)}</p><p class="translation">${esc(question.translation)}</p>`
  : question ? `<div class="quiz-clue"><span class="eyebrow">PETUNJUK AYAT</span><p>${esc(question.translation)}</p></div>` : "";
 const choices=question
  ? `<div class="quiz-choices">${quiz.choices.map(surah=>`<button class="quiz-choice${quiz.answered&&surah.number===question.surah.number?" correct":""}${quiz.answered&&surah.number===quiz.selected&&surah.number!==question.surah.number?" incorrect":""}" data-quiz-answer="${surah.number}" ${quiz.answered?"disabled":""}><span>${esc(surah.englishNameTranslation)}</span><b>${esc(surah.englishName)}</b><small>${esc(surah.name)}</small></button>`).join("")}</div>`
  : "";
 const recordingExtension=recording.urlMime.includes("mp4")?"mp4":recording.urlMime.includes("ogg")?"ogg":"webm";
 return `<div class="section-head practice-heading"><div><span class="eyebrow">BELAJAR SAMBIL MURAJAAH</span><h3>Latihan Al-Qur’an</h3></div></div><div class="practice-grid"><section class="panel quiz-panel"><div class="practice-card-heading"><div><span class="eyebrow">TEBAK NAMA SURAH</span><h3>Ayat ini dari surah apa?</h3></div><span class="practice-icon">۞</span></div><p class="muted">Baca terjemahannya, lalu pilih nama surah yang tepat. Kuis bisa dimainkan tanpa internet.</p><div class="quiz-score"><span>Skor sesi <b>${quiz.score}</b></span><span>Skor terbaik <b>${quiz.best}</b></span></div>${question?`${feedback}${choices}<button class="primary-btn" id="nextQuiz">${quiz.answered?"Ayat berikutnya →":"Lewati ayat →"}</button>`:`<button class="primary-btn" id="nextQuiz">Mulai tebak ayat →</button>`}</section><section class="panel recorder-panel"><div class="practice-card-heading"><div><span class="eyebrow">MURAJAAH MANDIRI</span><h3>Rekam bacaanmu</h3></div><span class="practice-icon">◉</span></div><p class="muted">Latih bacaan, dengarkan kembali, lalu simpan rekaman jika ingin.</p><div class="recording-clock" id="recordingTime">${formatRecordingTime(recording.seconds)}</div><p class="recording-status" id="recordingStatus" role="status">${esc(recording.status)}</p><div class="recording-controls">${recording.recorder?.state==="recording"?`<button class="record-btn is-recording" id="stopRecording"><span>■</span> Hentikan rekaman</button>`:`<button class="record-btn" id="startRecording"><span>●</span> Mulai rekam</button>`}</div>${recording.url?`<div class="recording-playback"><audio controls preload="metadata" src="${recording.url}">Browser tidak mendukung pemutar audio.</audio><a class="outline-btn" href="${recording.url}" download="murajaah-${new Date().toISOString().slice(0,10)}.${recordingExtension}">Unduh rekaman</a></div>`:""}<p class="note">Mikrofon hanya aktif setelah Anda menekan tombol rekam dan menyetujui izin browser. Audio tidak dikirim atau diunggah; rekaman hanya tersedia selama halaman ini terbuka.</p></section></div>`;
}
function formatRecordingTime(seconds){
 return `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
}
function bookmarkView(){
 if(!state.bookmarks.length)return `<div class="empty-state"><span>♡</span><h3>Belum ada ayat tersimpan</h3><p>Simpan ayat saat membaca Al-Qur’an untuk menemukannya kembali di sini.</p><button class="primary-btn" data-go="quran">Jelajahi Al-Qur’an</button></div>`;
 return `<div class="section-head"><div><span class="eyebrow">KOLEKSI PRIBADI</span><h3>Ayat favoritmu</h3></div></div><div class="ayah-list">${state.bookmarks.map(a=>ayahCard(a,true)).join("")}</div>`;
}
function qiblaView(){
 return `<div class="panel qibla-panel"><span class="eyebrow">ARAH KIBLAT</span><h2>Temukan arah Ka’bah</h2><p class="muted">Izinkan akses lokasi untuk menghitung arah kiblat dari posisimu.</p><div class="compass" id="compass"><div class="compass-n">U</div><div class="compass-needle">◆</div><div class="compass-center">☾</div></div><h3 id="qiblaDegree">—° dari utara</h3><p class="muted" id="qiblaInfo">Lokasi belum tersedia.</p><button class="primary-btn" id="qiblaLocate">Gunakan lokasi saya</button><p class="note">Kompas digital memerlukan sensor arah perangkat yang didukung. Gunakan angka azimut sebagai panduan dan cocokkan dengan arah kiblat masjid.</p></div>`;
}
function ayahCard(a, saved=false){
 return `<article class="ayah-card"><div class="ayah-meta"><span>${esc(a.surahName)} • ${a.surahNumber}:${a.numberInSurah}</span><button class="save-btn" data-save="${a.key}">${saved?"♥":"♡"}</button></div><p class="arabic">${a.text}</p>${a.translation?`<p class="translation">${esc(a.translation)}</p>`:""}<div class="ayah-actions"><button data-play="${a.audio||""}">▶ Dengarkan</button><button data-copy="${encodeURIComponent(a.text+"\\n"+(a.translation||""))}">Salin</button></div></article>`;
}
function bindView(){
 $$("[data-go]").forEach(b=>b.onclick=()=>navigate(b.dataset.go));
 if(state.activeTab==="quran"){loadSurahs();$("#surahSearch").oninput=e=>renderSurahList(e.target.value);}
 if(state.activeTab==="prayer")$("#refreshLocation").onclick=()=>loadLocation(true);
 if(state.activeTab==="tasbih"){
  $("#countBtn").onclick=()=>{state.tasbih++;localStorage.setItem("nq-tasbih",state.tasbih);$("#tasbihCount").textContent=state.tasbih;$("#tasbihProgress").style.width=Math.min(100,state.tasbih/state.target*100)+"%";$(".progress-track").setAttribute("aria-valuenow",Math.min(state.target,state.tasbih));};
  $("#resetTasbih").onclick=()=>{state.tasbih=0;localStorage.setItem("nq-tasbih",0);renderView();};
  $("#targetBtn").onclick=()=>{const n=Number(prompt("Masukkan target dzikir:",state.target));if(Number.isSafeInteger(n)&&n>0){state.target=n;localStorage.setItem("nq-target",state.target);renderView();}};
  $$("[data-dhikr]").forEach(b=>b.onclick=()=>{state.dhikr=b.dataset.dhikr;localStorage.setItem("nq-dhikr",state.dhikr);renderView();});
 }
 if(state.activeTab==="practice"){
  $("#nextQuiz").onclick=()=>loadQuizQuestion();
  $$("[data-quiz-answer]").forEach(b=>b.onclick=()=>answerQuiz(Number(b.dataset.quizAnswer)));
  $("#startRecording")?.addEventListener("click",startRecording);
  $("#stopRecording")?.addEventListener("click",()=>stopRecording("Rekaman selesai."));
 }
 if(state.activeTab==="qibla")$("#qiblaLocate").onclick=loadQibla;
 $$("[data-save]").forEach(b=>b.onclick=()=>toggleBookmark(b.dataset.save));
 $$("[data-play]").forEach(b=>b.onclick=()=>playAudio(decodeURIComponent(b.dataset.play)));
 $$("[data-copy]").forEach(b=>b.onclick=()=>navigator.clipboard?.writeText(decodeURIComponent(b.dataset.copy)));
}
function loadQuizQuestion(){
 const quiz=state.quiz;
 const previousQuestion=quiz.question;
 const candidates=offlineQuizQuestions.filter(item=>item.surah.number!==previousQuestion?.surah.number||item.ayahNumber!==previousQuestion?.ayahNumber);
 const question=candidates[Math.floor(Math.random()*candidates.length)];
 const distractors=offlineQuizQuestions
  .filter(item=>item.surah.number!==question.surah.number)
  .map(item=>item.surah)
  .sort(()=>Math.random()-.5)
  .slice(0,3);
 quiz.question=question;
 quiz.choices=[question.surah,...distractors].sort(()=>Math.random()-.5);
 quiz.answered=false;
 quiz.selected=null;
 quiz.error="";
 if(state.activeTab==="practice")renderView();
}
function answerQuiz(surahNumber){
 const quiz=state.quiz;
 if(!quiz.question||quiz.answered)return;
 quiz.answered=true;quiz.selected=surahNumber;
 if(surahNumber===quiz.question.surah.number){
  quiz.score++;
  if(quiz.score>quiz.best){
   quiz.best=quiz.score;
   localStorage.setItem(quizBestKey,String(quiz.best));
  }
 }
 renderView();
}
async function startRecording(){
 const recording=state.recording;
 if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined"){
  recording.status="Perekaman tidak didukung browser ini. Coba browser modern dengan HTTPS atau localhost.";
  renderView();return;
 }
 if(!window.isSecureContext){
  recording.status="Untuk memakai mikrofon, buka aplikasi melalui HTTPS atau localhost.";
  renderView();return;
 }
 recording.status="Meminta izin mikrofon…";
 renderView();
 let stream;
 try{
  stream=await navigator.mediaDevices.getUserMedia({audio:true});
  if(state.activeTab!=="practice"){
   stream.getTracks().forEach(track=>track.stop());
   return;
  }
  const mimeType=typeof MediaRecorder.isTypeSupported==="function"
   ?["audio/webm;codecs=opus","audio/webm","audio/mp4"].find(type=>MediaRecorder.isTypeSupported(type))
   :undefined;
  const recorder=mimeType?new MediaRecorder(stream,{mimeType}):new MediaRecorder(stream);
  if(recording.url)URL.revokeObjectURL(recording.url);
  recording.url=null;recording.urlMime="";recording.seconds=0;recording.chunks=[];recording.stream=stream;recording.recorder=recorder;
  recorder.ondataavailable=event=>{if(event.data.size)recording.chunks.push(event.data);};
  recorder.onerror=()=>{recording.status="Terjadi masalah saat merekam. Coba lagi.";stopRecording(recording.status);};
  recorder.onstop=()=>{
   clearInterval(recording.timer);recording.timer=null;
   const blob=new Blob(recording.chunks,{type:recorder.mimeType||recording.chunks[0]?.type||"audio/webm"});
   if(blob.size){
    recording.url=URL.createObjectURL(blob);recording.urlMime=blob.type;
   }else{
    recording.status="Rekaman kosong. Pastikan mikrofon berfungsi lalu coba lagi.";
   }
   recording.stream?.getTracks().forEach(track=>track.stop());
   recording.stream=null;recording.recorder=null;recording.chunks=[];
   if(state.activeTab==="practice")renderView();
  };
  recorder.start();
  recording.status="Sedang merekam. Maksimal 2 menit; rekaman berhenti saat berpindah menu.";
  recording.timer=setInterval(()=>{
   recording.seconds++;
   const clock=$("#recordingTime");
   if(clock)clock.textContent=formatRecordingTime(recording.seconds);
   if(recording.seconds>=120)stopRecording("Batas rekaman 2 menit tercapai.");
  },1000);
  renderView();
 }catch(error){
  stream?.getTracks().forEach(track=>track.stop());
  console.error("Gagal memulai rekaman:",error);
  recording.recorder=null;recording.stream=null;
  recording.status=error.name==="NotAllowedError"
   ?"Izin mikrofon ditolak. Izinkan mikrofon di pengaturan browser lalu coba lagi."
   :error.name==="NotFoundError"
    ?"Mikrofon tidak ditemukan. Sambungkan mikrofon lalu coba lagi."
    :"Mikrofon gagal diakses. Periksa izin browser dan coba lagi.";
  if(state.activeTab==="practice")renderView();
 }
}
function stopRecording(status){
 const recording=state.recording;
 if(!recording.recorder||recording.recorder.state!=="recording")return;
 recording.status=status;
 clearInterval(recording.timer);recording.timer=null;
 recording.recorder.stop();
}
async function loadSurahs(){
 if(state.surahs.length){renderSurahList($("#surahSearch")?.value||"");return;}
 try{const r=await fetch("https://api.alquran.cloud/v1/surah");if(!r.ok)throw Error("Gagal mengambil daftar surah");state.surahs=(await r.json()).data;renderSurahList();}
 catch(e){$("#surahList").innerHTML=`<div class="empty-state">Tidak dapat memuat surah. Periksa koneksi internet lalu muat ulang.</div>`;}
}
function renderSurahList(query=""){
 const list=state.surahs.filter(s=>`${s.number} ${s.name} ${s.englishName} ${s.englishNameTranslation}`.toLowerCase().includes(query.toLowerCase()));
 $("#surahCount").textContent=`${list.length} dari 114 surah`;
 $("#surahList").innerHTML=list.map(s=>`<button class="surah-item" data-surah="${s.number}"><span class="surah-number">${s.number}</span><span class="surah-name"><b>${esc(s.englishName)}</b><small>${esc(s.englishNameTranslation)} • ${s.numberOfAyahs} ayat</small></span><span class="surah-arabic">${esc(s.name)}</span></button>`).join("");
 $$("[data-surah]").forEach(b=>b.onclick=()=>openSurah(Number(b.dataset.surah)));
}
async function openSurah(n){
 $("#reader").innerHTML=`<div class="loading">Memuat ayat surah…</div>`;
 try{
  const [ar,id]=await Promise.all([fetch(`https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`),fetch(`https://api.alquran.cloud/v1/surah/${n}/id.indonesian`)]);
  if(!ar.ok||!id.ok)throw Error("Gagal memuat ayat");
  const aa=(await ar.json()).data, ii=(await id.json()).data;
  const audioData=await fetch(`https://api.alquran.cloud/v1/surah/${n}/ar.alafasy`).then(r=>r.json()).catch(()=>null);
  const audioAyahs=audioData?.data?.ayahs||[];
  state.currentSurah=aa;
  const ayahs=aa.ayahs.map((a,i)=>({key:`${n}:${a.numberInSurah}`,surahName:aa.englishName,surahNumber:n,numberInSurah:a.numberInSurah,text:a.text,translation:ii.ayahs[i]?.text,audio:audioAyahs[i]?.audio||""}));
  $("#reader").innerHTML=`<div class="reader-head"><div><span class="eyebrow">SURAH ${n}</span><h2>${esc(aa.englishName)}</h2><p class="muted">${esc(aa.englishNameTranslation)} • ${aa.revelationType==="Meccan"?"Makkiyah":"Madaniyah"} • ${aa.numberOfAyahs} ayat</p></div><div class="surah-arabic large">${esc(aa.name)}</div></div><div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div><div class="ayah-list">${ayahs.map(ayahCard).join("")}</div>`;
  state.history.unshift({surahName:aa.englishName,ayah:1});state.history=state.history.slice(0,1);localStorage.setItem("nq-history",JSON.stringify(state.history));
  bindView();
  $("#reader").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(e){$("#reader").innerHTML=`<div class="empty-state">Ayat belum bisa dimuat. Coba lagi saat koneksi tersedia.</div>`;}
}
function toggleBookmark(key){
 const el=$(`[data-save="${CSS.escape(key)}"]`); if(state.bookmarks.some(a=>a.key===key)){state.bookmarks=state.bookmarks.filter(a=>a.key!==key);}
 else {const card=el?.closest(".ayah-card");if(!card)return;const surah=card.querySelector(".ayah-meta span").textContent;const [sn,an]=surah.split(" • ");const text=card.querySelector(".arabic").textContent;const translation=card.querySelector(".translation")?.textContent||"";state.bookmarks.push({key,surahName:sn,surahNumber:Number(key.split(":")[0]),numberInSurah:Number(an.split(":")[1]),text,translation,audio:""});}
 localStorage.setItem("nq-bookmarks",JSON.stringify(state.bookmarks));renderView();
}
function playAudio(url){if(!url)return; if(state.currentAudio===url&&!state.audio.paused){state.audio.pause();return;}state.audio.src=url;state.currentAudio=url;state.audio.play().catch(()=>alert("Audio tidak dapat diputar saat ini."));}
function nextPrayer(){
 const p=state.prayer||{};const now=new Date();const names=[["Subuh",p.Fajr],["Zuhur",p.Dhuhr],["Asar",p.Asr],["Magrib",p.Maghrib],["Isya",p.Isha]];
 for(const [name,t] of names){if(t){const [h,m]=t.split(":").map(Number);const d=new Date();d.setHours(h,m,0,0);if(d>now)return{name,time:t};}}
 return {name:"Subuh",time:p.Fajr};
}
async function loadLocation(showError=false){
 if(!navigator.geolocation){$("#locationChip").textContent="⌖ Lokasi tidak didukung";if(showError)alert("Browser tidak mendukung lokasi.");return;}
 $("#locationChip").textContent="⌖ Mengambil lokasi…";
 navigator.geolocation.getCurrentPosition(async pos=>{
  state.coords={lat:pos.coords.latitude,lon:pos.coords.longitude};
  try{
   const now=new Date(),date=`${String(now.getDate()).padStart(2,"0")}-${String(now.getMonth()+1).padStart(2,"0")}-${now.getFullYear()}`;
   const [r,geo]=await Promise.all([fetch(`https://api.aladhan.com/v1/timings/${date}?latitude=${state.coords.lat}&longitude=${state.coords.lon}&method=20`),fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${state.coords.lat}&lon=${state.coords.lon}`).catch(()=>null)]);
   if(!r.ok)throw Error(`Prayer-time service returned ${r.status}`);
   const j=await r.json();if(j.code!==200||!j.data?.timings)throw Error("Prayer-time service returned invalid data");
   state.prayer=j.data.timings;
   if(geo?.ok){const g=await geo.json();state.locationName=[g.address?.city||g.address?.town||g.address?.village,g.address?.state].filter(Boolean).join(", ")||"Lokasi saya";}
   else state.locationName="Lokasi saya";
   $("#locationChip").textContent="⌖ "+state.locationName;renderView();
  }catch(e){console.error("Gagal memuat jadwal salat:",e);$("#locationChip").textContent="⌖ Gagal memuat jadwal";if(showError)alert("Jadwal salat gagal dimuat. Periksa koneksi internet.");}
 },err=>{$("#locationChip").textContent="⌖ Izin lokasi diperlukan";if(showError)alert("Izinkan akses lokasi di browser agar jadwal salat sesuai tempatmu.");},{enableHighAccuracy:true,timeout:15000});
}
function qiblaBearing(lat,lon){
 const kLat=21.422487*Math.PI/180,kLon=39.826206*Math.PI/180, pLat=lat*Math.PI/180,pLon=lon*Math.PI/180;
 const y=Math.sin(kLon-pLon),x=Math.cos(pLat)*Math.tan(kLat)-Math.sin(pLat)*Math.cos(kLon-pLon);
 return (Math.atan2(y,x)*180/Math.PI+360)%360;
}
function loadQibla(){
 if(!navigator.geolocation)return;
 navigator.geolocation.getCurrentPosition(pos=>{
  const deg=qiblaBearing(pos.coords.latitude,pos.coords.longitude);
  $("#qiblaDegree").textContent=`${deg.toFixed(1)}° dari utara`;
  $("#qiblaInfo").textContent="Arah kiblat dihitung dari koordinat lokasi perangkat.";
  $("#compass").style.setProperty("--bearing",`${deg}deg`);
 },()=>alert("Aktifkan izin lokasi untuk menghitung arah kiblat."));
}
let installPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;const b=$("#installBtn");if(b)b.hidden=false;});
async function installPwa(){if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("#installBtn").hidden=true;}
function openAuth(){
 const modal=document.createElement("div");modal.className="modal-backdrop";modal.innerHTML=`<div class="modal"><button class="modal-close" id="closeModal">×</button><span class="eyebrow">AKUN NURQURAN</span><h2>${state.user?"Akun kamu":"Selamat datang kembali"}</h2><p class="muted">${state.user?esc(state.user.email||""): "Masuk untuk menghubungkan pengalaman ibadahmu."}</p>${state.user?`<button class="primary-btn full" id="logoutBtn">Keluar dari akun</button>`:`<div class="auth-tabs"><button class="auth-tab active" data-mode="login">Masuk</button><button class="auth-tab" data-mode="register">Daftar</button></div><form id="authForm"><label>Email<input type="email" name="email" required placeholder="nama@email.com"></label><label>Password<input type="password" name="password" minlength="6" required placeholder="Minimal 6 karakter"></label><button class="primary-btn full" type="submit" id="authSubmit">Masuk</button></form><button class="google-btn" id="googleLogin">Lanjutkan dengan Google</button><p class="note" id="authNote">${configured?"":"Konfigurasi Firebase belum diisi. Lengkapi src/firebase.js dan aktifkan Email/Password serta Google di Firebase Authentication."}</p>`}</div>`;
 document.body.append(modal);let mode="login";
 $("#closeModal",modal).onclick=()=>modal.remove();
 $$("[data-mode]",modal).forEach(b=>b.onclick=()=>{mode=b.dataset.mode;$$("[data-mode]",modal).forEach(x=>x.classList.toggle("active",x===b));$("#authSubmit",modal).textContent=mode==="login"?"Masuk":"Buat akun";});
 if(state.user)$("#logoutBtn",modal).onclick=async()=>{if(auth)await signOut(auth);modal.remove();};
 else{
  $("#authForm",modal).onsubmit=async e=>{e.preventDefault();if(!configured){alert("Isi konfigurasi Firebase terlebih dahulu.");return;}const fd=new FormData(e.target);try{if(mode==="login")await signInWithEmailAndPassword(auth,fd.get("email"),fd.get("password"));else await createUserWithEmailAndPassword(auth,fd.get("email"),fd.get("password"));modal.remove();}catch(err){$("#authNote",modal).textContent=err.message;}};
  $("#googleLogin",modal).onclick=async()=>{if(!configured){alert("Isi konfigurasi Firebase terlebih dahulu.");return;}try{await signInWithPopup(auth,googleProvider);modal.remove();}catch(e){$("#authNote",modal).textContent=e.message;}};
 }
}
if(configured)onAuthStateChanged(auth,user=>{state.user=user;if($("#profileBtn")){const old=state.activeTab;shell();navigate(old);}});
function init(){
 shell();loadLocation();
 if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(console.warn));
}
init();