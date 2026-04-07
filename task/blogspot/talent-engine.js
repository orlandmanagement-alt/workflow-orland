/**
 * ORLAND MANAGEMENT - TALENT ENGINE
 * Script untuk Blogspot Widget & Page
 * Fitur: Load All KV Cache, Filter Client-Side, Pagination, Modal Fetch
 */

const API_BASE = "https://api.orlandmanagement.com/api/v1";

// State Global
let ALL_TALENTS = [];
let FILTERED_TALENTS = [];
let CURRENT_PAGE = 1;
// Konfigurasi Grid Mode (Bisa di set ke 5 untuk widget, 12 untuk page)
let PER_PAGE = 12;

document.addEventListener("DOMContentLoaded", () => {
    // Deteksi apakah ini di widget atau halaman full berdasarkan mode pagination (karena widget tidak punya select paging per-page)
    const viewSelect = document.getElementById("viewPerPage");
    if(!viewSelect) {
        PER_PAGE = 5; // Asumsi Widget jika tidak ada option per page
    }
    
    // Inisialisasi Event Listener Filter
    document.querySelectorAll("input[type='radio'], input[type='checkbox'], select, input[type='text']")
        .forEach(el => {
            el.addEventListener("change", applyFilters);
            el.addEventListener("input", applyFilters);
        });

    fetchTalents();
});

async function fetchTalents() {
    const grid = document.getElementById("talentGrid");
    if (!grid) return;
    
    grid.innerHTML = `<div class="col-span-full py-10 text-center"><div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p class="text-slate-500 font-bold animate-pulse">Memuat Database Talent...</p></div>`;

    try {
        const response = await fetch(`${API_BASE}/public/talents`);
        const result = await response.json();

        if (result.status === 'ok') {
            ALL_TALENTS = result.data;
            FILTERED_TALENTS = [...ALL_TALENTS];
            renderGrid();
        } else {
            grid.innerHTML = `<div class="col-span-full py-10 text-center text-red-500">Gagal memuat data dari server.</div>`;
        }
    } catch (err) {
        console.error(err);
        grid.innerHTML = `<div class="col-span-full py-10 text-center text-red-500">Koneksi Error. Coba refresh halaman.</div>`;
    }
}

function applyFilters() {
    // 1. Text Search
    const searchVal = document.querySelector("input[placeholder*='Type a name'], #filterSearch")?.value.toLowerCase() || "";
    
    // 2. Gender Radio
    let selectedGender = "All";
    document.querySelectorAll("input[name='gender']").forEach(r => {
        if(r.checked) {
            const label = r.nextElementSibling.innerText.trim();
            if(label === 'M') selectedGender = 'Male';
            else if(label === 'F') selectedGender = 'Female';
            else selectedGender = 'All';
        }
    });

    // 2b (Alternatif jika pakai Select Box)
    const selectGender = document.getElementById("filterGender")?.value;
    if(selectGender) selectedGender = selectGender;

    // 3. Category (dari Select Desktop / Sidebar)
    const categorySelect = document.getElementById("filterCategory")?.value || "";

    // Lakukan Filtering Array in Memory
    FILTERED_TALENTS = ALL_TALENTS.filter(t => {
        // Cek Nama
        if (searchVal && !t.name.toLowerCase().includes(searchVal)) return false;
        // Cek Gender
        if (selectedGender !== "All") {
            if (t.gender !== selectedGender && t.gender !== "Other") return false;
        }
        // Cek Category
        if (categorySelect && !t.category?.includes(categorySelect)) return false;
        
        // (Bisa ditambahkan Logika Usia & Height disesuaikan dengan dropdown HTML Blogspot)

        return true;
    });

    CURRENT_PAGE = 1;
    renderGrid();
}

function renderGrid() {
    const grid = document.getElementById("talentGrid");
    if (!grid) return;

    // Terapkan Paging Batasan
    const startIndex = (CURRENT_PAGE - 1) * PER_PAGE;
    const paginated = FILTERED_TALENTS.slice(startIndex, startIndex + PER_PAGE);

    if (paginated.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-10 text-center"><p class="text-slate-500 font-bold text-lg"><i class="fa-regular fa-face-frown mr-2"></i>Tidak ada talent yang cocok dengan filter pencarian.</p></div>`;
        renderPaginationControls();
        document.getElementById("totalCountDisplay") && (document.getElementById("totalCountDisplay").innerText = "0");
        return;
    }

    // Update Counter text jika ada
    const countDisplay = document.querySelector(".text-indigo-600.font-black.text-lg");
    if(countDisplay) { countDisplay.innerText = FILTERED_TALENTS.length; }

    let html = "";
    paginated.forEach(talent => {
        // Tentukan Theme/Color Category (Default indigo, Actor Emerald, Model Amber dll)
        let theme = "indigo";
        let icon = "venus"; // female
        const cat = talent.category || "Talent";
        
        if(cat.toLowerCase().includes('actor')) theme = "emerald";
        else if(cat.toLowerCase().includes('model')) theme = "amber";
        else if(cat.toLowerCase().includes('mc')) theme = "fuchsia";

        if(talent.gender === 'Male') icon = "mars";

        html += `
        <div class="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-${theme}-200 transition-all duration-500 group flex flex-col relative transform hover:-translate-y-1.5 cursor-pointer" onclick="openTalentModal('${talent.id}')">
            
            <div class="w-full aspect-[3/4] relative overflow-hidden bg-slate-200">
                <div class="absolute top-3 left-3 z-10">
                    <span class="text-[9px] font-black uppercase tracking-widest bg-white/95 text-${theme}-600 px-2.5 py-1 rounded shadow-sm border border-white/50">${cat}</span>
                </div>
                
                <div class="absolute top-3 right-3 z-10">
                    <div class="w-7 h-7 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white text-xs">
                        <i class="fa-solid fa-${icon}"></i>
                    </div>
                </div>

                <img src="${talent.headshot || 'https://via.placeholder.com/400x500'}" alt="${talent.name}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center pb-6">
                    <div class="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 text-center mt-10">
                        <i class="fa-solid fa-expand text-white text-xl mb-2"></i>
                        <span class="block text-white text-xs font-bold uppercase tracking-widest">View Profile</span>
                    </div>
                </div>
            </div>
            
            <div class="p-4 sm:p-5 flex flex-col flex-1 bg-white relative z-20">
                <h3 class="font-extrabold text-slate-900 text-base leading-tight truncate group-hover:text-${theme}-600 transition-colors mb-2">${talent.name}</h3>
                
                <div class="flex flex-wrap gap-2 text-[10px] sm:text-xs text-slate-500 mb-4 font-semibold">
                    ${talent.age ? `<span class="bg-slate-50 px-2 py-0.5 rounded border border-slate-100"><i class="fa-regular fa-calendar mr-1"></i>${talent.age} Yrs</span>` : ''}
                    ${talent.height ? `<span class="bg-slate-50 px-2 py-0.5 rounded border border-slate-100"><i class="fa-solid fa-arrows-up-down mr-1"></i>${talent.height} cm</span>` : ''}
                    ${talent.location ? `<span class="bg-slate-50 px-2 py-0.5 rounded border border-slate-100"><i class="fa-solid fa-location-dot mr-1"></i>${talent.location}</span>` : ''}
                </div>
            </div>
        </div>
        `;
    });

    grid.innerHTML = html;
    renderPaginationControls();
}

function renderPaginationControls() {
    const controls = document.getElementById("paginationControls"); // (Biasanya di widget)
    const numberNodes = document.querySelectorAll("button[aria-label^='Halaman']"); // (Biasanya di page)
    
    const totalPages = Math.ceil(FILTERED_TALENTS.length / PER_PAGE);

    // TODO: Untuk script dasar Render Pagination ini kamu butuh elemen spesifik di Blogspot.
    // Kami buat sesederhana mungkin agar berjalan di kedua layout HTML Anda.
    
    if (controls) {
        let btnHtml = "";
        for(let i=1; i<=totalPages; i++) {
             let activeTheme = i === CURRENT_PAGE ? "bg-indigo-600 text-white shadow-lg transform scale-105" : "border text-slate-600 hover:text-indigo-600";
             btnHtml += `<button onclick="goToPage(${i})" class="w-10 h-10 rounded-xl ${activeTheme} font-bold transition-all">${i}</button>`;
        }
        controls.innerHTML = btnHtml;
    }
}

function goToPage(page) {
    CURRENT_PAGE = page;
    renderGrid();
    document.getElementById("talentGrid").scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============== MODAL LOGIC (FULL FETCH) ==============
async function openTalentModal(talentId) {
    const modal = document.getElementById("profileModal");
    if(!modal) return;
    
    // Tampilkan Modal dlu sambil Loading
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    
    document.getElementById("modalName").innerText = "Loading Detail...";
    document.getElementById("modalBio").innerText = "";
    document.getElementById("modalImg").src = "";
    
    try {
        const response = await fetch(`${API_BASE}/public/talents/${talentId}`);
        const result = await response.json();
        
        if (result.status === 'ok') {
            const t = result.data;
            document.getElementById("modalName").innerText = t.full_name || t.fullName;
            document.getElementById("modalCategory").innerText = t.category || "Talent";
            document.getElementById("modalImg").src = t.headshot || t.full_height || "";
            document.getElementById("modalAge").innerText = t.birth_date ? (new Date().getFullYear() - new Date(t.birth_date).getFullYear()) : "-";
            document.getElementById("modalHeight").innerText = t.height || "-";
            document.getElementById("modalWeight").innerText = t.weight || "-";
            document.getElementById("modalBio").innerText = t.bio || (t.experiences && t.experiences.length > 0 ? t.experiences.map(e => e.title + ' at ' + e.company).join(', ') : 'No additional information available.');
            
            // Tombol "Book This Talent" ganti link otomatis jika perlu.
            // Contoh URL: `href="/talent/${t.talent_id}"` atau mengaktifkan WA 
        }
    } catch (err) {
        console.error(err);
        document.getElementById("modalName").innerText = "Gagal memuat";
    }
}

function closeModal() {
    const modal = document.getElementById("profileModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

// BUKA WINDOWS JIKA ADA TOMBOL WA (Meneruskan dari widget)
function triggerWaPopup(tipe, picNama, noHp) {
    const msg = `Halo Orland Management, saya tertarik booking talent tersebut melalui Web Directory.`;
    window.open(`https://wa.me/${noHp}?text=${encodeURIComponent(msg)}`, '_blank');
}
