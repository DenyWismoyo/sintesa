---
name: clario-agent
description: >
  Panduan penggunaan Clario Cloud AI MCP Server di dalam Antigravity IDE.
  Aktifkan skill ini saat pengguna ingin melakukan code review, reasoning,
  penyusunan teks, atau pembuatan gambar menggunakan model-model Clario
  (GLM-5.3, DeepSeek Reasoning, Qwen, Flux 2 Pro) langsung di Antigravity sidebar.
---

# 🤖 Clario Cloud AI Agent (Antigravity MCP Integration)

MCP Server Clario menghubungkan Antigravity IDE langsung ke ekosistem model Clario Cloud API (`https://clario.apicloud.my.id/docs`).

---

## 🛠️ Daftar Tool MCP yang Tersedia

### 1. `clario_chat`
- **Fungsi:** Menjalankan inferensi percakapan umum, ringkasan teks, konsultasi bisnis, atau Q&A.
- **Model Utama:** `clario/glm-5.3-flash` (default), `clario/qwen3.8-27b`, `clario/glm-5.2`.
- **Parameter:**
  - `prompt` (string, wajib): Pertanyaan atau perintah.
  - `model` (string, opsional): ID model spesifik Clario.
  - `system_prompt` (string, opsional): Instruksi sistem persona AI.

### 2. `clario_code_expert`
- **Fungsi:** Spesialis analisis mendalam, pemecahan bug rumit, perancangan arsitektur, dan refactoring menggunakan nalar **DeepSeek Reasoning**.
- **Model Utama:** `clario/deepseek-v4-flash-0731` / `clario/deepseek-v4-pro-0813`.
- **Parameter:**
  - `task` (string, wajib): Permasalahan kode atau arsitektur yang perlu diselesaikan.
  - `code_context` (string, opsional): Potongan kode sumber atau berkas terkait.
  - `language` (string, opsional): Bahasa pemrograman (misal: `typescript`, `python`).

### 3. `clario_generate_image`
- **Fungsi:** Pembuatan poster, visualisasi mockup, dan ilustrasi digital beresolusi tinggi menggunakan **Flux 2 Pro**.
- **Model Utama:** `clario/flux-2-pro`.
- **Parameter:**
  - `prompt` (string, wajib): Deskripsi visual detail gambar.
  - `size` (string, opsional): `1024x1024`, `1792x1024`, atau `1024x1792`.

---

## 📍 Konfigurasi & Berkas
- **MCP Server Executable:** [`.agents/mcp/clario-server.mjs`](file:///d:/Project/teknopark/.agents/mcp/clario-server.mjs)
- **MCP Config:** [`.agents/mcp_config.json`](file:///d:/Project/teknopark/.agents/mcp_config.json)
- **Base URL:** `http://api-direct.apicloud.my.id:8088/v1` (dengan failover ke `https://clario.apicloud.my.id/v1`)
