(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const configId = urlParams.get("config");

    if (!configId) {
        document.getElementById("loadingOverlay").classList.add("hidden");
        Swal.fire({
            icon: "error",
            title: "Gagal Terhubung",
            text: "Parameter tidak valid",
            confirmButtonText: "OK",
            allowOutsideClick: !1
        });
        return;
    }

    const ENDPOINT = `https://script.google.com/macros/s/${configId}/exec`;
    const LS_KEY = "ls_v1";
    const IDR = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    });
    const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    const getEl = (id) => document.getElementById(id);
    const getSel = (parent, sel) => parent.querySelector(sel);
    const getAll = (parent, sel) => parent.querySelectorAll(sel);

    // Global State
    const state = {
        curSheet: localStorage.getItem(LS_KEY) || "",
        data: [],
        opt: {
            title: "",
            subtitle: "",
            pin: "",
            photo: "",
            pihak: ["Pihak 1", "Pihak 2"]
        }
    };

    // DOM Elements
    const dom = {
        sel: getEl("sel"),
        ld: getEl("ld"),
        emp: getEl("emp"),
        lst: getEl("lst"),
        s1: getEl("s1"),
        s2: getEl("s2"),
        s3: getEl("s3"),
        f: getEl("f"),
        d: getEl("fd"),
        k: getEl("fk"),
        n: getEl("fn"),
        b: getEl("bs"),
        pihakCont: getEl("pihakContainer"),
        ref: getEl("ref"),
        nav: getEl("nav"),
        pinLock: getEl("pinLock"),
        pinDis: getEl("pinDisplay"),
        pinKey: getEl("pinKeypad"),
        img: getEl("profileImg"),
        ttl: getEl("appTitle"),
        sub: getEl("appSubtitle"),
        loading: getEl("loadingOverlay")
    };

    // Utilities
    const utils = {
        animVal(el, start, end) {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / 1000, 1);
                el.textContent = IDR.format(Math.floor((1 - Math.pow(1 - progress, 4)) * (end - start) + start));
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        },
        fmtDate(dStr) {
            const d = new Date(dStr);
            return isNaN(d) ? dStr : `${DAYS[d.getDay()]}, ${d.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}`;
        },
        // PERBAIKAN: Menggunakan Waktu Lokal agar tidak mundur 1 hari
        toYMD(d) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        toDMY(ymd) {
            const [y, m, d] = ymd.split("-");
            return `${d}/${m}/${y}`;
        },
        parseNum: (v) => parseInt((v || "").replace(/\D/g, "")) || 0,
        toast(msg, icon = "success") {
            Swal.fire({
                toast: !0,
                position: "top",
                icon: icon,
                title: msg,
                timer: 1500,
                showConfirmButton: !1
            });
        },
        async api(data, query = "") {
            try {
                const opts = data ? {
                    method: "POST",
                    mode: "no-cors",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                } : {};
                const req = await fetch(`${ENDPOINT}${query}`, opts);
                return data ? req : req.json();
            } catch (e) {
                dom.loading.classList.add("hidden");
                Swal.fire({
                    icon: "error",
                    title: "Gagal Terhubung",
                    text: "Config tidak valid",
                    confirmButtonText: "OK"
                });
                throw e;
            }
        },
        showLoading(show = true) {
            dom.loading.classList.toggle("hidden", !show);
        }
    };

    // PIN Logic
    const pinSystem = {
        val: "",
        init() {
            dom.pinKey.addEventListener("click", e => {
                const btn = e.target.closest(".pin-key");
                if (!btn || btn.classList.contains("empty")) return;
                const key = btn.dataset.key;
                if (key === "delete") this.val = this.val.slice(0, -1);
                else if (this.val.length < 6) this.val += key;

                this.render();
                if (this.val.length === 6) setTimeout(() => this.check(), 200);
            });
        },
        render() {
            getAll(dom.pinDis, ".pin-dot").forEach((dot, i) => {
                dot.classList.toggle("filled", i < this.val.length);
                dot.classList.remove("shake");
            });
        },
        check() {
            if (this.val === state.opt.pin) {
                dom.pinLock.classList.add("hidden");
                app.init();
            } else {
                getAll(dom.pinDis, ".pin-dot").forEach(d => d.classList.add("shake"));
                setTimeout(() => {
                    this.val = "";
                    this.render();
                }, 400);
            }
        }
    };

    // App Logic
    const app = {
        async start() {
            try {
                utils.showLoading(true);
                const res = await utils.api(null, "?action=getOptions");
                if (res.status !== "success") throw new Error("Gagal memuat pengaturan");

                // Set Options & Pihak Logic
                state.opt = {
                    ...state.opt,
                    ...res.data
                };
                if (!state.opt.pihak || state.opt.pihak.length < 2) state.opt.pihak = ["Pihak 1", "Pihak 2"];

                // Update UI Labels for Saldo
                getSel(dom.s2.parentElement, 'span').textContent = `Cash ${state.opt.pihak[0]}`;
                getSel(dom.s3.parentElement, 'span').textContent = `Cash ${state.opt.pihak[1]}`;

                // Render Input Pihak Buttons Dynamically
                dom.pihakCont.innerHTML = state.opt.pihak.map(p => `<button type="button" class="tg" data-v="${p}">${p}</button>`).join('');

                dom.ttl.textContent = state.opt.title;
                dom.sub.textContent = state.opt.subtitle;
                if (state.opt.photo) dom.img.src = state.opt.photo;

                utils.showLoading(false);

                if (state.opt.pin) {
                    dom.pinLock.classList.remove("hidden");
                    pinSystem.init();
                } else {
                    this.init();
                }
            } catch (e) {
                console.error(e);
            }
        },

        async load() {
            dom.ld.style.display = "block";
            dom.emp.style.display = "none";
            dom.lst.innerHTML = "";

            const res = await utils.api(null, `?action=getData&sheet=${state.curSheet}&t=${Date.now()}`);
            dom.ld.style.display = "none";

            // Map Saldo Logic (Generic names from code.gs)
            const {
                atm = 0, cashPihak1 = 0, cashPihak2 = 0
            } = res.saldo || {};
            utils.animVal(dom.s1, 0, atm);
            utils.animVal(dom.s2, 0, cashPihak1);
            utils.animVal(dom.s3, 0, cashPihak2);

            state.data = res.data || [];
            if (!state.data.length) return dom.emp.style.display = "block";

            const frag = document.createDocumentFragment();
            state.data.forEach((row, idx) => {
                const node = getEl("t-row").content.cloneNode(true);
                const li = getSel(node, "li");
                li.dataset.idx = idx;

                const debit = parseFloat(row.debit) || 0;
                const isDebit = debit > 0;
                const amount = isDebit ? debit : (parseFloat(row.kredit) || 0);

                const dateParts = utils.fmtDate(row.tanggal).split(", ");
                getSel(node, ".day").textContent = dateParts[0] + ", ";
                getSel(node, ".d-txt").textContent = dateParts[1];

                if (row.jam) getSel(node, ".tm").textContent = row.jam;
                else getSel(node, ".tm").remove();

                getSel(node, ".desc").textContent = row.keterangan;

                // Dynamic Tag Class
                const pName = row.pihak;
                const pIndex = state.opt.pihak.indexOf(pName);
                const tagEl = getSel(node, ".tg-p");
                tagEl.textContent = pName;
                tagEl.className = `tg-p tag-p${pIndex + 1}`;
                if (pIndex === -1) tagEl.classList.add('tag-atm');

                const srcEl = getSel(node, ".tg-s");
                srcEl.textContent = row.sumber;
                srcEl.className = `tg-s tag-${row.sumber.toLowerCase()}`;

                const amtEl = getSel(node, ".amt");
                amtEl.textContent = `${isDebit ? "+" : "-"} ${IDR.format(amount)}`;
                amtEl.classList.add(isDebit ? "in" : "out");

                frag.appendChild(node);
            });
            dom.lst.appendChild(frag);

            getAll(dom.lst, ".li").forEach((el, i) => {
                el.style.opacity = 0;
                el.animate([{
                        opacity: 0,
                        transform: "translateY(10px)"
                    },
                    {
                        opacity: 1,
                        transform: "translateY(0)"
                    }
                ], {
                    duration: 400,
                    delay: 40 * i,
                    fill: "forwards",
                    easing: "ease-out"
                });
            });
        },

        async sheets() {
            const res = await utils.api(null, "?action=getSheets");
            if (res.status !== "success") return;

            const list = res.data.filter(s => !s.startsWith("."));
            dom.sel.innerHTML = list.map(s => `<option value="${s}">${s}</option>`).join("");
            dom.sel.disabled = false;

            state.curSheet = (state.curSheet && list.includes(state.curSheet)) ? state.curSheet : list[0];
            dom.sel.value = state.curSheet;
            localStorage.setItem(LS_KEY, state.curSheet);
            this.load();
        },

        async save(payload, isEditDelete = false) {
            Swal.fire({
                title: "Menyimpan...",
                didOpen: Swal.showLoading,
                showConfirmButton: false
            });
            await utils.api(payload);
            utils.toast("Tersimpan");

            if (!isEditDelete) {
                dom.f.reset();
                dom.d.value = utils.toYMD(new Date());
                getAll(document, ".tg").forEach(b => b.classList.remove("active"));
                getAll(dom.nav, ".tab")[0].click();
            }

            this.load();
            dom.b.disabled = false;
            dom.b.textContent = "Simpan Transaksi";
        },

        ui() {
            dom.d.value = utils.toYMD(new Date());

            // Tab Navigation
            dom.nav.addEventListener("click", e => {
                const t = e.target.dataset.t;
                if (!t) return;
                getAll(document, ".tab, .view").forEach(el => el.classList.remove("active"));
                e.target.classList.add("active");
                getEl(t).classList.add("active");
            });

            // Form Toggles
            dom.f.addEventListener("click", e => {
                if (!e.target.classList.contains("tg")) return;
                const grp = e.target.closest(".grp");
                getAll(grp, ".tg").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                getSel(grp, "input[type=hidden]").value = e.target.dataset.v;
            });

            dom.sel.addEventListener("change", e => {
                state.curSheet = e.target.value;
                localStorage.setItem(LS_KEY, state.curSheet);
                this.load();
            });

            dom.ref.addEventListener("click", () => {
                dom.ref.classList.add("spin");
                setTimeout(() => {
                    dom.ref.classList.remove("spin");
                    this.load();
                }, 500);
            });

            // Submit Add Transaction
            dom.f.addEventListener("submit", e => {
                e.preventDefault();
                const fd = new FormData(dom.f);
                if (!fd.get("pihak") || !fd.get("sumber") || !fd.get("jenis")) return utils.toast("Lengkapi Data", "warning");

                dom.b.textContent = "...";
                dom.b.disabled = true;

                this.save({
                    sheetName: state.curSheet,
                    tanggal: utils.toDMY(dom.d.value),
                    keterangan: dom.k.value,
                    nominal: utils.parseNum(dom.n.value),
                    pihak: fd.get("pihak"),
                    sumber: fd.get("sumber"),
                    jenis: fd.get("jenis"),
                    includeTime: dom.d.value === utils.toYMD(new Date())
                });
            });

            // List Actions (Edit/Delete)
            dom.lst.addEventListener("click", async e => {
                const btn = e.target.closest("button");
                if (!btn) return;
                const rowData = state.data[e.target.closest("li").dataset.idx];

                if (btn.dataset.a === "d") {
                    // DELETE
                    const tmpl = getEl("t-del-card").content.cloneNode(true);
                    const debit = parseFloat(rowData.debit) || 0;
                    const amt = debit > 0 ? debit : (parseFloat(rowData.kredit) || 0);

                    getSel(tmpl, ".del-date").textContent = utils.fmtDate(rowData.tanggal);
                    getSel(tmpl, ".del-desc").textContent = rowData.keterangan;
                    getSel(tmpl, ".del-meta").textContent = `${rowData.pihak} • ${rowData.sumber}`;

                    const elAmt = getSel(tmpl, ".del-amount");
                    elAmt.textContent = IDR.format(amt);
                    elAmt.classList.add(debit > 0 ? "in" : "out");

                    const div = document.createElement("div");
                    div.appendChild(tmpl);

                    const res = await Swal.fire({
                        title: "Hapus Transaksi",
                        html: div.innerHTML,
                        showCancelButton: true,
                        confirmButtonColor: "#FF3B30",
                        confirmButtonText: "Hapus",
                        cancelButtonText: "Batal"
                    });

                    if (res.isConfirmed) {
                        this.save({
                            action: "delete",
                            sheetName: state.curSheet,
                            rowNumber: rowData.no
                        }, true);
                    }

                } else {
                    // EDIT
                    const debit = parseFloat(rowData.debit) || 0;
                    const valNominal = debit > 0 ? debit : (parseFloat(rowData.kredit) || 0);
                    const valJenis = debit > 0 ? "debit" : "kredit";
                    const pihakOpts = state.opt.pihak.map(p => `<option value="${p}">${p}</option>`).join('');

                    const {
                        value: formVal
                    } = await Swal.fire({
                        title: "Edit Transaksi",
                        html: `
                              <div style="text-align:left">
                                  <div class="grp"><label class="lbl">Tanggal</label><input id="ex_d" type="date" class="inp"></div>
                                  <div class="grp"><label class="lbl">Keterangan</label><input id="ex_k" class="inp"></div>
                                  <div class="grp"><label class="lbl">Nominal</label><input id="ex_n" class="inp"></div>
                                  <div class="grid-2">
                                      <div class="grp"><label class="lbl">Pihak</label><select id="ex_p" class="inp">${pihakOpts}</select></div>
                                      <div class="grp"><label class="lbl">Sumber</label><select id="ex_s" class="inp"><option>ATM</option><option>CASH</option></select></div>
                                  </div>
                                  <div class="grp"><label class="lbl">Jenis Transaksi</label><select id="ex_j" class="inp"><option value="debit">Masuk (Debit)</option><option value="kredit">Keluar (Kredit)</option></select></div>
                              </div>`,
                        showCancelButton: true,
                        confirmButtonText: "Simpan",
                        cancelButtonText: "Batal",
                        didOpen: () => {
                            // PERBAIKAN DI SINI: Menggunakan utils.toYMD yang sudah diperbaiki (Local Time)
                            const tanggalValue = utils.toYMD(new Date(rowData.tanggal));
                            getEl("ex_d").value = tanggalValue;

                            getEl("ex_k").value = rowData.keterangan;
                            getEl("ex_n").value = valNominal;
                            getEl("ex_s").value = rowData.sumber;
                            getEl("ex_j").value = valJenis;

                            const pihakSelect = getEl("ex_p");
                            const normalizedPihak = String(rowData.pihak).trim();
                            for (let i = 0; i < pihakSelect.options.length; i++) {
                                if (pihakSelect.options[i].value.trim() === normalizedPihak) {
                                    pihakSelect.selectedIndex = i;
                                    break;
                                }
                            }
                        },
                        preConfirm: () => ({
                            t: getEl("ex_d").value,
                            k: getEl("ex_k").value,
                            n: utils.parseNum(getEl("ex_n").value),
                            p: getEl("ex_p").value,
                            s: getEl("ex_s").value,
                            j: getEl("ex_j").value
                        })
                    });

                    if (formVal) {
                        this.save({
                            action: "edit",
                            sheetName: state.curSheet,
                            rowNumber: rowData.no,
                            tanggal: utils.toDMY(formVal.t),
                            keterangan: formVal.k,
                            nominal: formVal.n,
                            pihak: formVal.p,
                            sumber: formVal.s,
                            jenis: formVal.j,
                            // Cek jika tanggal tidak berubah, pertahankan jam asli (jika ada)
                            includeTime: formVal.t === utils.toYMD(new Date(rowData.tanggal))
                        }, true);
                    }
                }
            });

            // Settings Modal
            dom.img.addEventListener("click", async () => {
                const {
                    value: setVal
                } = await Swal.fire({
                    title: "Pengaturan",
                    html: `
                          <div style="text-align:left">
                              <div class="grp"><label class="lbl">Judul</label><input id="set_title" class="inp" placeholder="Catatan Keuangan"></div>
                              <div class="grp"><label class="lbl">Sub Judul</label><input id="set_subtitle" class="inp" placeholder="Keluarga Cemara"></div>
                              <div class="grp"><label class="lbl">URL Foto Profil</label><input id="set_photo" class="inp"></div>
                              <div class="grid-2">
                                   <div class="grp"><label class="lbl">Nama Pihak 1</label><input id="set_p1" class="inp" placeholder="Nama 1"></div>
                                   <div class="grp"><label class="lbl">Nama Pihak 2</label><input id="set_p2" class="inp" placeholder="Nama 2"></div>
                              </div>
                              <div class="grp"><label class="lbl">PIN Baru (6 digit)</label><input id="set_pin" type="tel" maxlength="6" class="inp" placeholder="******"></div>
                          </div>`,
                    showCancelButton: true,
                    confirmButtonText: "Simpan",
                    didOpen: () => {
                        getEl("set_title").value = state.opt.title;
                        getEl("set_subtitle").value = state.opt.subtitle;
                        getEl("set_photo").value = state.opt.photo;
                        getEl("set_p1").value = state.opt.pihak[0] || "";
                        getEl("set_p2").value = state.opt.pihak[1] || "";
                    },
                    preConfirm: () => {
                        const pin = getEl("set_pin").value;
                        if (pin && !/^\d{6}$/.test(pin)) return Swal.showValidationMessage("PIN harus 6 angka");
                        return {
                            title: getEl("set_title").value,
                            subtitle: getEl("set_subtitle").value,
                            photo: getEl("set_photo").value,
                            pin: pin,
                            pihak1: getEl("set_p1").value,
                            pihak2: getEl("set_p2").value
                        }
                    }
                });

                if (setVal) {
                    Swal.fire({
                        title: "Menyimpan...",
                        didOpen: Swal.showLoading,
                        showConfirmButton: false
                    });
                    await utils.api({
                        action: "saveOptions",
                        title: setVal.title,
                        subtitle: setVal.subtitle,
                        photo: setVal.photo,
                        pin: setVal.pin || state.opt.pin,
                        pihak1: setVal.pihak1,
                        pihak2: setVal.pihak2
                    });

                    state.opt.title = setVal.title;
                    state.opt.subtitle = setVal.subtitle;
                    state.opt.photo = setVal.photo;
                    if (setVal.pihak1) state.opt.pihak[0] = setVal.pihak1;
                    if (setVal.pihak2) state.opt.pihak[1] = setVal.pihak2;
                    if (setVal.pin) state.opt.pin = setVal.pin;

                    dom.ttl.textContent = setVal.title;
                    dom.sub.textContent = setVal.subtitle;
                    if (setVal.photo) dom.img.src = setVal.photo;

                    getSel(dom.s2.parentElement, 'span').textContent = `Cash ${state.opt.pihak[0]}`;
                    getSel(dom.s3.parentElement, 'span').textContent = `Cash ${state.opt.pihak[1]}`;
                    dom.pihakCont.innerHTML = state.opt.pihak.map(p => `<button type="button" class="tg" data-v="${p}">${p}</button>`).join('');

                    utils.toast("Pengaturan tersimpan");
                }
            });
        },
        init() {
            this.ui();
            this.sheets();
        }
    };

    app.start();
})();