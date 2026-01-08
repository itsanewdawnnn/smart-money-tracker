# 💎 Cashly — Simple Money Tracking

**Cashly** is a refined, full‑stack personal finance management system engineered for reliability, clarity, and visual elegance. It combines a **modern Glassmorphism interface** with a **serverless Google Apps Script backend**, using Google Sheets as a secure, cloud‑native data store.

Designed for users who value precision and aesthetics, FinEase delivers a minimalist experience without compromising robustness.

---

## 🏛 System Architecture

FinEase is built on a clean, two‑layer architecture that separates presentation from logic, ensuring scalability and maintainability.

### 1. Core Backend — Google Apps Script

Acts as a lightweight JSON API that connects the frontend with Google Sheets.

**Key Capabilities**

* **Atomic Transactions** — Ensures consistency and integrity across all CRUD operations
* **Automated Balance Calculation** — Real‑time balance updates using `MAP` and `LAMBDA`‑based logic
* **Dynamic Validation** — Strict validation for transaction types, fund sources, and secure PIN authentication
* **Serverless Deployment** — No infrastructure maintenance, fully managed by Google

---

### 2. Frontend Interface — HTML5, CSS3, Vanilla JavaScript

A performance‑oriented interface built without heavy frameworks, prioritizing speed and clarity.

**Interface Highlights**

* **Glassmorphism Design System** — Subtle transparency and backdrop blur for a premium, modern appearance
* **Vanilla JavaScript Engine** — Lightweight, predictable, and fast execution
* **SweetAlert2 Feedback Layer** — Polished, interactive notifications replacing standard browser alerts

---

## 🎨 Design Philosophy

* **Clarity Above All** — Financial data is presented with optimal contrast and spacing
* **Minimalist by Design** — Only essential elements are displayed to maintain focus
* **Soft Interactions** — Smooth hover states and transitions for a professional, composed feel

---

## 🧩 Functional Overview

| Layer         | Responsibility                   | Technology                              |
| ------------- | -------------------------------- | --------------------------------------- |
| Logic         | Data processing & API routing    | Google Apps Script                      |
| Interface     | Visualization & user interaction | HTML5, CSS3 (Glassmorphism), Vanilla JS |
| Storage       | Persistent cloud database        | Google Sheets                           |
| Notifications | User feedback & alerts           | SweetAlert2                             |

---

## 🚀 Deployment

### Backend Setup

1. Copy the provided `Code.gs` into the **Google Apps Script** editor linked to your Google Sheet
2. Deploy the project as a **Web App**

   * Access: **Anyone**
3. Save the generated **Web App URL**

---

### Frontend Setup

1. Place `index.html`, `style.css`, and `script.js` in the same directory
2. Update the `API_URL` constant in `script.js` with your backend Web App URL
3. Host the frontend on a static hosting service such as **GitHub Pages**, **Vercel**, or **Netlify**

---

## 📄 License

This project is released as open‑source software.
Built with precision. Designed with restraint.
