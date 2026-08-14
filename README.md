# 🎓 StudentOS

![StudentOS](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![FramerMotion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

**Your Academic Operating System.**  
StudentOS is a premium, multi-user SaaS platform designed to effortlessly track college attendance, manage weekly routines, and forecast degree grades through a predictive mathematical engine.

Built with an ultra-premium "Apple-tier" glassmorphic UI, featuring animated aurora backgrounds, 3D magnetic hover physics, and a floating navigation dock.

---

## ✨ Core Features

*   **🔒 Secure Multi-User Auth:** Powered by Firebase Authentication (Email/Password & Google Sign-In). Every user gets their own secure, isolated database vault.
*   **📡 "Happening Now" Dashboard:** A real-time engine that tracks your current class based on the day and time, allowing for instant 1-click attendance logging.
*   **📊 Master Analytics:** Visualizes your overall semester health and subject-by-subject attendance using Recharts. Automatically calculates how many classes you can safely skip (or need to attend) to maintain a strict 75% threshold.
*   **🎯 Predictive Grades Engine:** Input your target CGPA and total semesters. The engine mathematically calculates the exact SGPA you need in your remaining semesters to achieve your degree goal.
*   **🗓️ Dynamic Holiday Sync:** Real-time holiday management with a built-in 1-click sync for official regional academic holidays.
*   **💅 Premium UI/UX:** 
    *   Custom CSS Aurora background animations.
    *   Awwwards-style 3D spring-loaded card hover physics.
    *   Frosted glassmorphic floating bottom dock.

---

## 🛠️ Tech Stack

*   **Frontend:** React 18, Next.js (App Router)
*   **Styling:** Tailwind CSS (v4), Custom CSS Keyframes
*   **Animations:** Framer Motion
*   **Backend & Database:** Firebase (Authentication & Firestore)
*   **Data Visualization:** Recharts
*   **Icons:** Lucide React
*   **Date Formatting:** date-fns

---

## 🚀 Getting Started

If you want to run this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone [https://github.com/YOUR_GITHUB_USERNAME/modern-attendance-tracker.git](https://github.com/YOUR_GITHUB_USERNAME/modern-attendance-tracker.git)
cd modern-attendance-tracker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Firebase Configuration
Create a `.env.local` file in the root directory and add your Firebase project keys:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```
*(Ensure Firestore and Authentication are enabled in your Firebase Console).*

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 👨‍💻 Developer
Developed by **Manjil Agamacharyya**  
*Computer Science and Information Technology*

---
> *"Design is not just what it looks like and feels like. Design is how it works."*