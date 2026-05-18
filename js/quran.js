/* ─────────────────────────────────────────────────────────────────────────────
   QURAN MODULE (API DRIVEN)
   ───────────────────────────────────────────────────────────────────────────── */

let allSurahs = [];
let currentSurahPages = {};
let pageKeys = [];
let currentPageIndex = 0;
let currentSurahNumber = 1;

function syncQuran() {
  const container = document.getElementById("quran-surah-list");
  if (!container) return;

  // Only load if it hasn't been loaded yet
  if (allSurahs.length === 0 || container.innerHTML.includes("جاري تحميل")) {
    loadSurahList();
  }
  
  setupSwipe();
}

let swipeRegistered = false;
function setupSwipe() {
  const container = document.getElementById("ayahs-container");
  if (!container || swipeRegistered) return;

  let touchstartX = 0;
  let touchendX = 0;

  container.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
  }, { passive: true });

  container.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    handleGesture();
  }, { passive: true });

  function handleGesture() {
    if (touchendX < touchstartX - 50) {
      // Swiped left -> Next page
      nextQuranPage();
    }
    if (touchendX > touchstartX + 50) {
      // Swiped right -> Previous page
      prevQuranPage();
    }
  }

  swipeRegistered = true;
}

async function loadSurahList() {
  const container = document.getElementById("quran-surah-list");
  if (!container) return;

  try {
    const response = await fetch("https://api.alquran.cloud/v1/surah");
    const data = await response.json();
    
    if (data.code === 200) {
      allSurahs = data.data; // Store for filtering
      renderSurahs(allSurahs);
    } else {
      container.innerHTML = `<div style="color: var(--danger); grid-column: span 2; text-align: center;">فشل تحميل قائمة السور.</div>`;
    }
  } catch (error) {
    console.error("Error fetching surah list:", error);
    container.innerHTML = `<div style="color: var(--danger); grid-column: span 2; text-align: center;">حدث خطأ في الاتصال بالشبكة.</div>`;
  }
}

function renderSurahs(surahs) {
  const container = document.getElementById("quran-surah-list");
  if (!container) return;
  
  if (surahs.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); grid-column: span 2; text-align: center; padding: 20px;">لا توجد نتائج تطابق بحثك.</div>`;
    return;
  }

  container.innerHTML = surahs.map(surah => `
    <div class="card-master" style="padding: 15px; cursor: pointer; text-align: center; border: 1px solid rgba(201, 148, 58, 0.2); background: rgba(14, 14, 26, 0.6); border-radius: 12px; transition: 0.3s;" onclick="loadSurah(${surah.number}, '${surah.name}')">
      <div style="font-family: 'Scheherazade New', serif; font-size: 1.4rem; color: #f5dfa0;">${surah.name}</div>
      <div style="font-size: 0.75rem; color: var(--text-muted);">${ar(surah.numberOfAyahs)} آية | ${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</div>
    </div>
  `).join("");
}

function filterSurahs() {
  const query = document.getElementById("quran-search-input").value.trim();
  if (!query) {
    renderSurahs(allSurahs);
    return;
  }
  
  const filtered = allSurahs.filter(surah => 
    surah.name.includes(query) || 
    surah.englishName.toLowerCase().includes(query.toLowerCase()) ||
    surah.number.toString() === query
  );
  
  renderSurahs(filtered);
}

async function searchAyahs() {
  const query = document.getElementById("quran-search-input").value.trim();
  if (!query) return;
  
  const listContainer = document.getElementById("quran-surah-list");
  const viewerContainer = document.getElementById("quran-ayah-viewer");
  const titleEl = document.getElementById("current-surah-title");
  const ayahsEl = document.getElementById("ayahs-container");
  const paginationEl = document.getElementById("quran-pagination");

  if (!listContainer || !viewerContainer || !titleEl || !ayahsEl) return;

  // Toggle visibility
  listContainer.style.display = "none";
  viewerContainer.style.display = "block";
  if (paginationEl) paginationEl.style.display = "none"; // Hide pagination during search results
  
  titleEl.innerText = `نتائج البحث عن: "${query}"`;
  ayahsEl.innerHTML = "جاري البحث...";

  try {
    const response = await fetch(`https://api.alquran.cloud/v1/search/${query}/all/ar`);
    const data = await response.json();

    if (data.code === 200) {
      const matches = data.data.matches;
      if (matches.length === 0) {
        ayahsEl.innerHTML = `<div style="text-align: center; color: var(--text-muted);">لم يتم العثور على نتائج للكلمة "${query}".</div>`;
        return;
      }
      
      ayahsEl.innerHTML = matches.map(match => `
        <div style="background: rgba(255,255,255,0.02); padding: 15px; border-radius: 10px; margin-bottom: 15px; text-align: right; border-bottom: 1px solid rgba(201,148,58,0.2);">
          <div style="color: #f5dfa0; font-size: 1.4rem; line-height: 2; font-family: 'Scheherazade New', serif;">${match.text}</div>
          <div style="color: #c9943a; font-size: 0.8rem; margin-top: 5px;">${match.surah.name} | آية ${ar(match.numberInSurah)}</div>
        </div>
      `).join("");
    } else {
      ayahsEl.innerHTML = `<div style="text-align: center; color: var(--danger);">فشل البحث. يرجى المحاولة مرة أخرى.</div>`;
    }
  } catch (error) {
    console.error("Error searching ayahs:", error);
    ayahsEl.innerHTML = `<div style="text-align: center; color: var(--danger);">حدث خطأ في الاتصال بالشبكة.</div>`;
  }
}

function showSurahList() {
  const listContainer = document.getElementById("quran-surah-list");
  const viewerContainer = document.getElementById("quran-ayah-viewer");
  const searchInput = document.getElementById("quran-search-input");
  
  if (listContainer && viewerContainer) {
    listContainer.style.display = "grid";
    viewerContainer.style.display = "none";
    
    // Clear search when returning
    if (searchInput) {
      searchInput.value = "";
      renderSurahs(allSurahs); // Reset list
    }
  }
}

async function loadSurah(number, name) {
  const listContainer = document.getElementById("quran-surah-list");
  const viewerContainer = document.getElementById("quran-ayah-viewer");
  const titleEl = document.getElementById("current-surah-title");
  const ayahsEl = document.getElementById("ayahs-container");
  const paginationEl = document.getElementById("quran-pagination");

  if (!listContainer || !viewerContainer || !titleEl || !ayahsEl) return;

  // Toggle visibility
  listContainer.style.display = "none";
  viewerContainer.style.display = "block";
  if (paginationEl) paginationEl.style.display = "flex";
  
  titleEl.innerText = name;
  ayahsEl.innerHTML = `<div style="text-align: center; color: var(--text-muted);">جاري تحميل الآيات...</div>`;
  
  currentSurahNumber = number;

  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}`);
    const data = await response.json();

    if (data.code === 200) {
      const ayahs = data.data.ayahs;
      
      // Group by page
      currentSurahPages = {};
      ayahs.forEach(ayah => {
        const page = ayah.page;
        if (!currentSurahPages[page]) {
          currentSurahPages[page] = [];
        }
        currentSurahPages[page].push(ayah);
      });
      
      pageKeys = Object.keys(currentSurahPages);
      currentPageIndex = 0;
      
      renderCurrentPage();
    } else {
      ayahsEl.innerHTML = `<div style="text-align: center; color: var(--danger);">فشل تحميل الآيات.</div>`;
    }
  } catch (error) {
    console.error("Error fetching surah content:", error);
    ayahsEl.innerHTML = `<div style="text-align: center; color: var(--danger);">حدث خطأ في الاتصال بالشبكة.</div>`;
  }
}

function renderCurrentPage() {
  const ayahsEl = document.getElementById("ayahs-container");
  const pageNumEl = document.getElementById("quran-page-number");
  const prevBtn = document.getElementById("prev-page-btn");
  const nextBtn = document.getElementById("next-page-btn");

  if (!ayahsEl || !pageNumEl) return;

  const currentPage = pageKeys[currentPageIndex];
  const ayahs = currentSurahPages[currentPage];

  if (!ayahs) return;

  pageNumEl.innerText = `صفحة ${ar(currentPage)}`;
  
  // Update button states
  if (prevBtn) prevBtn.style.opacity = currentPageIndex === 0 ? "0.3" : "1";
  if (nextBtn) nextBtn.style.opacity = currentPageIndex === pageKeys.length - 1 ? "0.3" : "1";

  ayahsEl.innerHTML = ""; // Clear

  let fullText = "";
  ayahs.forEach(ayah => {
    let text = ayah.text;
    // Remove Bismillah from first ayah if it's not Fatihah and it starts with it
    if (currentSurahNumber !== 1 && ayah.numberInSurah === 1 && text.startsWith("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ")) {
      text = text.replace("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "");
      ayahsEl.innerHTML += `<div style="font-family: 'Scheherazade New', serif; font-size: 1.8rem; color: #c9943a; margin-bottom: 20px; text-align: center;">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>`;
    }
    
    fullText += `${text} ﴿${ar(ayah.numberInSurah)}﴾ `;
  });

  ayahsEl.innerHTML += `<div style="text-align: justify; text-align-last: center; line-height: 2.5; font-size: 1.6rem; color: #f5dfa0; font-family: 'Scheherazade New', serif;">${fullText}</div>`;
}

function nextQuranPage() {
  if (currentPageIndex < pageKeys.length - 1) {
    currentPageIndex++;
    renderCurrentPage();
  }
}

function prevQuranPage() {
  if (currentPageIndex > 0) {
    currentPageIndex--;
    renderCurrentPage();
  }
}
