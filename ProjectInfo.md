# 📚 PeerConnect Tutoring Management System

## 🎯 Purpose
PeerConnect is a web-based platform designed to **connect students with peer tutors** based on subject expertise and availability.  
It also provides administrators with tools to manage sessions, verify tutors, and monitor performance.

This system helps:
- **Students** → easily find tutors, book sessions, and learn effectively.  
- **Tutors** → offer their skills as a side job, earn income, and build experience.  
- **Admins** → oversee the tutoring ecosystem, ensuring quality and safety.  

---

## ✨ Features
### 👩‍🎓 Students
- Signup/Login (manual + Google OAuth)  
- Browse tutors by subject/availability  
- Chat with tutors for sessions 
- Request and book tutoring sessions  
- Rate and review tutors  

### 👨‍🏫 Tutors
- Signup/Login (manual + Google OAuth)  
- Create and manage tutor profile  
- Set subjects and availability  
- Accept/reject tutoring requests  
- Track session history and earnings  

### 🛠️ Admins
- Verify tutor applications  
- Manage users (students/tutors)  
- Monitor tutoring sessions  
- Generate reports and analytics  

### 🔑 Authentication
- JWT-based secure login  
- Google OAuth integration  
- Role-based access control (Student/Tutor/Admin)  

---

## 🏗️ Tech Stack
- **Frontend** → [React.js](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/)  
- **Backend** → [PHP](https://www.php.net/) vanilla PHP  
- **Database** → [MySQL](https://www.mysql.com/)  
- **Authentication** → JSON Web Tokens (JWT), Google OAuth  
- **Version Control** → Git + GitHub  

---

## 📂 Project Folder Structure
```bash
peerconnect/
│── frontend/               # React + Tailwind frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/       # API calls to backend
│   │   └── App.js
│   └── package.json
│
│── backend/                # PHP backend
│   ├── config/
│   │   └── db.php          # DB connection
│   ├── controllers/        # Business logic
│   ├── models/             # SQL queries (User, Tutor, Session)
│   ├── routes/             # API endpoints
│   ├── auth/               # JWT, OAuth
│   └── index.php           # Entry point
│
│── database/               # SQL scripts
│   ├── schema.sql
│   ├── seed.sql
│
│── README.md