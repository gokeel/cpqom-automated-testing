# Dokumentasi Test Spec — B2B CPQ Automation

Dokumen ini menjelaskan tujuan, alur, dan ekspektasi dari masing-masing spec file pengujian otomatis.
Semua spec berjalan secara berurutan dan saling terhubung melalui `runtime_state` di database.

---

## Urutan Eksekusi

```
01-account-mgmt-api  →  02-lead-mgmt  →  03-oppty-mgmt-sales
    →  04-oppty-mgmt-es  →  05-quote-mgmt-es  →  06-contract-mgmt-sales
```

Data penting (seperti `opportunityId`, `quoteId`) disimpan di tabel `runtime_state` dan dibaca oleh spec berikutnya.

---

## 01 — Account Management (API)

**File:** `tests/non-ida/01-account-mgmt-api.spec.js`
**Login User:** `sysadmin` (via OAuth client credentials, tanpa UI browser)

### Tujuan

Membuat data master akun pelanggan di Salesforce secara otomatis melalui REST API, tanpa melewati antarmuka UI.

### Alur Pengujian

| Test                             | Langkah                                                                                     | Ekspektasi                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **API Connection Test**          | Login OAuth dengan client credentials                                                       | `access_token` dan `instance_url` berhasil didapat                                                                     |
| **TC004 — Buat CCA**             | Cari RecordType `Brand`, buat Account bertipe Corporate                                     | Account berhasil dibuat, ID disimpan ke `runtime_state.corporateAccountId`                                             |
| **Buat Billing Contact**         | Cari RecordType `SFA_Billing_Contact`, buat Contact yang terhubung ke Brand Account         | Contact berhasil dibuat, ID disimpan ke `runtime_state.billingContactId`                                               |
| **TC005 — Buat CA di bawah CCA** | Cari RecordType `Business`, buat Account bertipe Corporate sebagai child dari Brand Account | Account berhasil dibuat; `tc002.accountName` di `test_parameters` diperbarui agar spec `lead_mgmt` bisa menggunakannya |

### Data yang Dihasilkan

- `brandAccountId` (Customer Corporate Account)
- `billingContactId`
- `customerAccountId` (Customer Account)

### Catatan

Spec ini tidak membuka browser. Semua operasi dilakukan via Salesforce REST API v65.0.

---

## 02 — Lead Management

**File:** `tests/non-ida/02-lead-mgmt.spec.js`
**Login User:** `salesOperation` (atau `sysadmin` jika `TEST_USER_ADMIN=true`)

### Tujuan

Menguji siklus hidup Lead dari pembuatan hingga konversi menjadi Opportunity melalui antarmuka UI Salesforce.

### Alur Pengujian

| Test                           | Langkah                                                                                                                  | Ekspektasi                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **API Connection Test**        | Login OAuth untuk mendapatkan token API                                                                                  | Token berhasil didapat                                                                                  |
| **TC001 — Lihat Semua Lead**   | Navigasi ke halaman list Lead                                                                                            | List view Lead tampil dengan benar                                                                      |
| **TC002 — Buat Lead Baru**     | Klik New, isi semua field wajib (Account Name, RFS Date, Project Name, Lead Source, dsb.), klik Save                     | Lead berhasil dibuat, notifikasi sukses tampil, Lead ID tercatat                                        |
| **TC008 — Update Status Lead** | Update status tiga kali secara berurutan: New → Working → Qualified → Converted (isi `Name_of_incumbent` = "Kompetitor") | Setiap perubahan status terkonfirmasi via API; tidak ada pesan error "Something went wrong"             |
| **TC009 — Konversi Lead**      | Klik tombol Convert                                                                                                      | Halaman berpindah ke Opportunity; Opportunity ID tercatat dan disimpan ke `runtime_state.opportunityId` |

### Data yang Dihasilkan

- `leadId`
- `opportunityId` → disimpan ke `runtime_state`

### Catatan

Spec ini menggunakan browser persisten (`.sf-profile`) agar sesi login tidak perlu diulang antar test dalam file yang sama.

---

## 03 — Opportunity Management (Sales)

**File:** `tests/non-ida/03-oppty-mgmt-sales.spec.js`
**Login User:** `salesOperation` (atau `sysadmin` jika `TEST_USER_ADMIN=true`)
**Pre-requisite:** `opportunityId` harus ada di `runtime_state` (diisi oleh spec 02)

### Tujuan

Menguji pengelolaan Opportunity oleh tim Sales: menambah produk, mengatur Sales Scenario, Credit Scoring, Score Card, dan anggota tim.

### Alur Pengujian

| Test                                       | Langkah                                                                                                                                                                                                  | Ekspektasi                                                                                                            |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **API Connection Test**                    | Login OAuth; jika `opportunityId` belum ada di state, query Opportunity terbaru milik user dengan stage Scoping; set `NumberOfContractedMonths` = 24 via API; hapus semua `OpportunityLineItem` yang ada | Opportunity siap digunakan, tidak ada line item sebelumnya                                                            |
| **TC010 — Tambah Produk**                  | Buka Opportunity, klik Add Products, pilih produk dari `tc010.productName`, isi MRC dan OTC                                                                                                              | Nilai OTC, MRC, Total, dan Annual Revenue sesuai dengan yang diinputkan                                               |
| **TC012 — Update Sales Scenario**          | Ubah Sales Scenario ke `Non-BAU/Tender`, centang Statement Letter, Financial Document, Deed of Company                                                                                                   | Tombol "Tender Information" muncul setelah Sales Scenario diubah                                                      |
| **TC013 — Tambah Opportunity Team Member** | Tambahkan user `at.enterprise.solution@b2b.uat` sebagai anggota tim dengan role `Sales Solution` via API                                                                                                 | Anggota tim berhasil ditambahkan                                                                                      |
| **TC015 — Update Credit Scoring**          | Isi semua field Credit Scoring (Financial Condition, Office Condition, Business Form, dsb.)                                                                                                              | Hasil credit scoring menampilkan "Low Risk" dengan nilai 1.50                                                         |
| **TC017/TC018 — Update Score Card**        | Buka tab Score Card, verifikasi tombol edit yang bisa diakses Sales team, isi field Score Card                                                                                                           | Indikator "Red Warning Triangle" tampil setelah disimpan; tombol edit ES team tidak terlihat jika login sebagai Sales |

### Data yang Dihasilkan

- Tidak ada data baru yang disimpan ke `runtime_state`; `opportunityId` dari spec 02 digunakan langsung

---

## 04 — Opportunity Management (Enterprise Solution)

**File:** `tests/non-ida/04-oppty-mgmt-es.spec.js`
**Login User:** `enterpriseSolution` (atau `sysadmin` jika `TEST_USER_ADMIN=true`)
**Pre-requisite:** `opportunityId` harus ada di `runtime_state`

### Tujuan

Menguji pengelolaan Score Card Opportunity dari perspektif tim Enterprise Solution (ES), memastikan field yang bisa dan tidak bisa diedit sesuai hak akses masing-masing peran.

### Alur Pengujian

| Test                                    | Langkah                                                                                      | Ekspektasi                                                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **API Connection Test**                 | Login OAuth; set `StageName = Quoting` dan isi semua field Score Card ES via API (CPQ*ES*\*) | Opportunity berhasil dipatch ke stage Quoting dengan semua Score Card ES terisi                                |
| **TC021/TC022 — Lihat Score Card (ES)** | Buka tab Score Card; verifikasi tombol edit yang tidak boleh terlihat untuk Sales user       | Jika login sebagai non-admin: tombol edit milik Sales team (Has Incumbent, RFP Influence, dsb.) tidak terlihat |

### Catatan

Pengisian Score Card oleh ES team saat ini dilakukan via API (bukan UI) karena kendala teknis pada antarmuka — komentar `// diganti pakai API saja` di kode mencatat alasannya.

---

## 05 — Quote Management (Enterprise Solution)

**File:** `tests/non-ida/05-quote-mgmt-es.spec.js`
**Login User:** `enterpriseSolution` (atau `sysadmin` jika `TEST_USER_ADMIN=true`)
**Pre-requisite:** `opportunityId` harus ada di `runtime_state`

### Tujuan

Menguji alur pembuatan Enterprise Quote secara penuh menggunakan CPQ API Vlocity, mulai dari membuat cart hingga menutup quote dengan status Closed/Win.

### Alur Pengujian

| Test                                  | Langkah                                                                                                                                                                                                                                                                                                                                                  | Ekspektasi                                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **API Connection Test**               | Login OAuth; ambil `sysAdminUserId`; patch field Score Card yang belum terisi (`CPQ_Partnership_Tier__c`, `CPQ_Deal_Registered__c`)                                                                                                                                                                                                                      | Opportunity siap untuk quoting                                                               |
| **TC023 — CPQ Enterprise Quote Flow** | (1) Cari RecordType `EnterpriseQuote` dan PriceList `B2B Pricelist`; (2) Buat cart/quote baru; (3) Fetch produk dari catalog, pilih berdasarkan `product_code`; (4) Tambahkan produk ke cart; (5) Opsional: randomize atribut dan override harga pada child line items; (6) Recalculate harga; (7) Buka halaman Quote di UI, verifikasi Quote Line Items | Quote berhasil dibuat dengan minimal 1 Quote Line Item; `cartId` disimpan ke `runtime_state` |
| **TC028 — Upload Dokumen MLD**        | Ubah status Quote ke "Solution Design" → "Solution Document"; klik Upload Document; pilih tipe MLD; upload file `file-upload-1.doc`                                                                                                                                                                                                                      | Tidak ada error notification; section Links tampil di tab Related                            |
| **TC029 — Generate Business Case**    | Ubah Sub Status ke "Business Case"; klik BC Template                                                                                                                                                                                                                                                                                                     | Template terbuka tanpa error "Error loading Quote Line Items"                                |
| **TC035 — Penutupan Quote**           | Patch approver; Submit for Approval; approve melalui notifikasi; Close dengan Sub Status "Closed/Win" dan upload dokumen PDF                                                                                                                                                                                                                             | Notifikasi sukses tampil setelah upload dan setelah Done                                     |

### Data yang Dihasilkan

- `cartId` / `quoteId` → disimpan ke `runtime_state`

### Catatan

`product_code` bisa diinjeksi lewat environment variable `PRODUCT_CODE` (dari `run-server.js`) untuk meng-override nilai dari database.

---

## 06 — Contract & Order Management (Sales)

**File:** `tests/non-ida/06-contract-mgmt-sales.spec.js`
**Login User:** `salesOperation` (atau `sysadmin` jika `TEST_USER_ADMIN=true`)
**Pre-requisite:** `opportunityId` dan `quoteId` harus ada di `runtime_state`

### Tujuan

Menguji proses pembuatan kontrak dari Quote yang sudah disetujui, aktivasi kontrak, pembuatan Order, dan penyelesaian Orchestration Plan.

### Alur Pengujian

| Test                              | Langkah                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Ekspektasi                                                                                                                                                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API Connection Test**           | Login OAuth; ambil `sysAdminUserId`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Token dan user ID berhasil didapat                                                                                                                                                                                                             |
| **TC023 — Contract & Order Flow** | (1) Buka Quote, klik "Create Contract" → Contract terbuat; (2) Buat `ContractVersion` dengan template dokumen "IOH FAB Document" via API; (3) Patch Contract (StartDate besok, ContractTerm=12); (4) Execute Transition: Draft → Negotiating; (5) Upload dokumen FAB; (6) Execute Transition ke status berikutnya via API (patch `Status = Signed`); (7) Patch Account: `CPQ_Collection_Status = CLEARED`; (8) Check Eligibility → Activate Contract; (9) Create Order; (10) Cek tipe Order (MasterOrder/SubOrder): jika MasterOrder, iterasi semua sub-order, submit masing-masing, kumpulkan ID Orchestration Plan, lalu selesaikan semua Orchestration Item | Contract berhasil dibuat dan diaktivasi; Order berhasil disubmit; Orchestration Items "Completed FSL Work Order", "Billing Order Activation", "Billing Activated", "Assetize Order", "End Order (Asset Created)" diselesaikan secara berurutan |

### Data yang Dihasilkan

- `contractId`
- `createdOrderId`
- `moduleOrchestrationPlanIDs[]`
- `moduleAssetIDs[]`

### Catatan

Orchestration Item diselesaikan langsung via API (`vlocity_cmt__State__c = Completed`) karena proses aktivasi FSL dan billing tidak dapat disimulasikan sepenuhnya di environment SIT/UAT.

---

## Ringkasan Dependensi Antar Spec

```
spec-01  ──────────────────────────────────────────►  test_parameters.lead_mgmt.tc002.accountName
                                                        runtime_state.corporateAccountId
                                                        runtime_state.billingContactId
                                                        runtime_state.customerAccountId
                                                              │
spec-02  ◄────────── (baca accountName dari tc002)            │
         ─────────────────────────────────────────────────►  runtime_state.opportunityId
                                                              │
spec-03  ◄────────── (baca opportunityId)                     │
spec-04  ◄────────── (baca opportunityId)                     │
spec-05  ◄────────── (baca opportunityId)                     │
         ──────────────────────────────────────────────────►  runtime_state.cartId / quoteId
                                                              │
spec-06  ◄────────── (baca opportunityId + quoteId)           │
```

## Environment Variables

| Variable          | Digunakan Oleh | Keterangan                                         |
| ----------------- | -------------- | -------------------------------------------------- |
| `USER_ID`         | Semua spec     | ID user di database untuk filter `test_parameters` |
| `TEST_RUN_ID`     | Semua spec     | ID run di `product_test_runs` untuk update status  |
| `TEST_USER_ADMIN` | Semua spec     | `true` = login sebagai sysadmin                    |
| `PRODUCT_CODE`    | spec-05        | Override kode produk yang dipilih di catalog CPQ   |
| `HEADLESS`        | Semua spec     | `true` = browser berjalan tanpa tampilan UI        |
