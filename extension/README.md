# 🤖 CampusMind Auto-Apply Extension (Concept)

## 📌 Overview
This Chrome Extension automates the job application process for students. It reads their CampusMind profile (Resume, Skills, XP) and autofills application forms on platforms like LinkedIn, Indeed, and WeWorkRemotely.

## 🚀 Features
1.  **One-Click Fill**: Detects form fields (Name, Email, Resume Upload) and fills them instantly.
2.  **AI Cover Letter Gen**: Generates a tailored cover letter for the specific job description on screen.
3.  **Application Tracker**: Automatically logs applied jobs to the CampusMind Dashboard.

## 🛠️ Tech Stack
*   **Manifest V3**: Modern extension architecture.
*   **React + Vite**: For the popup UI.
*   **Content Scripts**: JavaScript to interact with DOM elements on job sites.
*   **CampusMind API**: Fetches user data securely via token.

## 📂 Structure
- `manifest.json`: Configuration.
- `src/popup`: The UI when clicking the extension icon.
- `src/content`: The script that runs on job pages.
- `src/background`: Background service worker.

## 📝 Roadmap
1.  Initialize project with `npm create vite@latest extension -- --template react`.
2.  Add `manifest.json`.
3.  Implement OAuth authentication with CampusMind.
4.  Build field detection logic (e.g., `document.querySelector('input[name="email"]')`).
5.  Publish to Chrome Web Store.
