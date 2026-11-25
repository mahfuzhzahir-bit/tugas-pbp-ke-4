// ===== STATE =====
let todos = JSON.parse(localStorage.getItem("todos")) || [];
let filterAktif = "semua";
let kataKunci = "";
let editId = null;

// ===== DOM ELEMENTS =====
const form = document.querySelector("#form-todo");
const input = document.querySelector("#input-todo");
const inputPrioritas = document.querySelector("#input-prioritas");
const inputTenggat = document.querySelector("#input-tenggat");
const inputCari = document.querySelector("#input-cari");
const filterGroup = document.querySelector("#filter-group");
const list = document.querySelector("#list-todo");
const stats = document.querySelector("#stats");
const persenSelesai = document.querySelector("#persen-selesai");
const progressFill = document.querySelector("#progress-fill");
const btnHapusSelesai = document.querySelector("#btn-hapus-selesai");

// ===== FUNCTIONS =====
function simpan() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function cekTerlambat(tanggalStr, selesai) {
  if (!tanggalStr || selesai) return false;
  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);
  const tenggat = new Date(tanggalStr + "T00:00:00");
  return tenggat < hariIni;
}

function formatTanggal(tanggalStr) {
  if (!tanggalStr) return "";
  const [tahun, bulan, hari] = tanggalStr.split("-");
  return `${hari}/${bulan}/${tahun}`;
}

function updateStatistik() {
  const total = todos.length;
  const selesaiCount = todos.filter((t) => t.selesai).length;
  const belumCount = total - selesaiCount;
  const persen = total === 0 ? 0 : Math.round((selesaiCount / total) * 100);

  stats.textContent = `${belumCount} tugas belum selesai`;
  persenSelesai.textContent = `${persen}% selesai`;
  progressFill.style.width = `${persen}%`;

  btnHapusSelesai.hidden = selesaiCount === 0;
}

function getFilteredTodos() {
  return todos.filter((todo) => {
    const cocokFilter =
      filterAktif === "semua" ||
      (filterAktif === "belum" && !todo.selesai) ||
      (filterAktif === "selesai" && todo.selesai);

    const cocokCari = todo.teks.toLowerCase().includes(kataKunci.toLowerCase());
    return cocokFilter && cocokCari;
  });
}

function render() {
  list.innerHTML = "";
  updateStatistik();

  if (todos.length === 0) {
    list.innerHTML = `
      <li class="kosong-state">
        <span class="teks">Belum ada tugas. Tambahkan tugas pertamamu di atas!</span>
        <button type="button" class="btn-contoh" id="btn-muat-contoh">Muat Contoh Tugas</button>
      </li>
    `;
    return;
  }

  const hasilFilter = getFilteredTodos();

  if (hasilFilter.length === 0) {
    list.innerHTML = `
      <li class="kosong-state">
        <span class="teks">Tidak ada tugas yang cocok dengan filter/pencarian.</span>
      </li>
    `;
    return;
  }

  hasilFilter.forEach((todo) => {
    const li = document.createElement("li");
    if (todo.selesai) li.classList.add("selesai");

    // Mode Edit Inline
    if (editId === todo.id) {
      li.innerHTML = `
        <div class="form-edit-inline">
          <input type="text" class="edit-teks" value="${escapeHTML(todo.teks)}" required>
          <select class="edit-prioritas">
            <option value="tinggi" ${todo.prioritas === "tinggi" ? "selected" : ""}>Tinggi</option>
            <option value="sedang" ${todo.prioritas === "sedang" ? "selected" : ""}>Sedang</option>
            <option value="rendah" ${todo.prioritas === "rendah" ? "selected" : ""}>Rendah</option>
          </select>
          <input type="date" class="edit-tenggat" value="${todo.tenggat || ""}">
        </div>
        <div class="aksi-item">
          <button type="button" class="simpan-edit" data-id="${todo.id}">Simpan</button>
          <button type="button" class="batal-edit">Batal</button>
        </div>
      `;
      list.appendChild(li);
      return;
    }

    // Mode Tampilan Normal
    const prioritas = todo.prioritas || "sedang";
    const terlambat = cekTerlambat(todo.tenggat, todo.selesai);
    const infoTenggat = todo.tenggat
      ? `<span class="tenggat ${terlambat ? "terlambat" : ""}">📅 ${formatTanggal(todo.tenggat)}${terlambat ? " (Terlambat)" : ""}</span>`
      : "";

    li.innerHTML = `
      <input type="checkbox" ${todo.selesai ? "checked" : ""} data-id="${todo.id}">
      <div class="konten-tugas">
        <span class="teks" data-id="${todo.id}" title="Klik dua kali untuk mengedit">${escapeHTML(todo.teks)}</span>
        <div class="meta-tugas">
          <span class="badge prioritas-${prioritas}">${prioritas}</span>
          ${infoTenggat}
        </div>
      </div>
      <div class="aksi-item">
        <button type="button" class="edit" data-id="${todo.id}">Edit</button>
        <button type="button" class="hapus" data-id="${todo.id}">Hapus</button>
      </div>
    `;
    list.appendChild(li);
  });
}

function tambahTodo(teks, prioritas, tenggat) {
  todos.unshift({
    id: Date.now(),
    teks: teks.trim(),
    prioritas: prioritas || "sedang",
    tenggat: tenggat || "",
    selesai: false,
  });
  simpan();
  render();
}

function hapusTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  if (editId === id) editId = null;
  simpan();
  render();
}

function toggleSelesai(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.selesai = !todo.selesai;
    simpan();
    render();
  }
}

function simpanPerubahan(id, liElement) {
  const teksBaru = liElement.querySelector(".edit-teks").value.trim();
  const prioritasBaru = liElement.querySelector(".edit-prioritas").value;
  const tenggatBaru = liElement.querySelector(".edit-tenggat").value;

  if (!teksBaru) return;

  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.teks = teksBaru;
    todo.prioritas = prioritasBaru;
    todo.tenggat = tenggatBaru;
    editId = null;
    simpan();
    render();
  }
}

function muatContohTugas() {
  const besok = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  todos = [
    {
      id: Date.now() + 1,
      teks: "Pelajari manipulasi DOM (querySelector & event delegation)",
      prioritas: "tinggi",
      tenggat: besok,
      selesai: true,
    },
    {
      id: Date.now() + 2,
      teks: "Uji penyimpanan data menggunakan localStorage",
      prioritas: "sedang",
      tenggat: besok,
      selesai: false,
    },
    {
      id: Date.now() + 3,
      teks: "Screenshot hasil akhir praktikum lpk-3a",
      prioritas: "rendah",
      tenggat: "",
      selesai: false,
    },
  ];
  simpan();
  render();
}

// ===== EVENTS =====
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value.trim()) {
    tambahTodo(input.value, inputPrioritas.value, inputTenggat.value);
    input.value = "";
    inputPrioritas.value = "sedang";
    inputTenggat.value = "";
  }
});

inputCari.addEventListener("input", (e) => {
  kataKunci = e.target.value;
  render();
});

filterGroup.addEventListener("click", (e) => {
  if (e.target.classList.contains("filter-btn")) {
    document
      .querySelectorAll(".filter-btn")
      .forEach((btn) => btn.classList.remove("active"));
    e.target.classList.add("active");
    filterAktif = e.target.dataset.filter;
    render();
  }
});

list.addEventListener("change", (e) => {
  if (e.target.type === "checkbox") {
    toggleSelesai(Number(e.target.dataset.id));
  }
});

list.addEventListener("click", (e) => {
  const target = e.target;

  if (target.classList.contains("hapus")) {
    hapusTodo(Number(target.dataset.id));
  } else if (target.classList.contains("edit")) {
    editId = Number(target.dataset.id);
    render();
  } else if (target.classList.contains("simpan-edit")) {
    simpanPerubahan(Number(target.dataset.id), target.closest("li"));
  } else if (target.classList.contains("batal-edit")) {
    editId = null;
    render();
  } else if (target.id === "btn-muat-contoh") {
    muatContohTugas();
  }
});

list.addEventListener("dblclick", (e) => {
  if (e.target.classList.contains("teks") && e.target.dataset.id) {
    editId = Number(e.target.dataset.id);
    render();
  }
});

btnHapusSelesai.addEventListener("click", () => {
  todos = todos.filter((t) => !t.selesai);
  simpan();
  render();
});

// ===== INIT =====
render();