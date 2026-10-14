# 🚀 SIMPLE START GUIDE - PRO Market Dashboard

## ✅ Prerequisites Check

**Before starting, verify Node.js is installed:**

```bash
node --version
npm --version
```

If these commands show version numbers, you're ready! If not, install Node.js from: https://nodejs.org/

---

## 📦 ONE-TIME SETUP (Run Once)

### Step 1: Install Backend Dependencies

```bash
cd "c:\Users\Admin\Desktop\PRO MARKET DASHBOARD\backend"
npm install
```

**Expected:** `added 200+ packages` (takes 30-60 seconds)

---

### Step 2: Install Frontend Dependencies

```bash
cd "c:\Users\Admin\Desktop\PRO MARKET DASHBOARD\frontend"
npm install
```

**Expected:** `added 300+ packages` (takes 30-60 seconds)

---

## 🏃 RUNNING THE APPLICATION (Every Time)

### Terminal #1 - Start Backend

```bash
cd "c:\Users\Admin\Desktop\PRO MARKET DASHBOARD\backend"
npm run dev
```

**Expected Output:**
```
Server is running on port 3000
```

✅ **Keep this terminal open!**

---

### Terminal #2 - Start Frontend (New Window)

Open a **NEW** terminal window:

```bash
cd "c:\Users\Admin\Desktop\PRO MARKET DASHBOARD\frontend"
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
```

✅ **Keep this terminal open too!**

---

### Step 3: Open Browser

Navigate to: **http://localhost:5173**

---

## 🛑 STOPPING THE APPLICATION

In each terminal, press: **Ctrl + C**

---

## 🔧 COMMON ERRORS & FIXES

### Error: "npm is not recognized"
**Fix:** Node.js is not installed. Install from https://nodejs.org/

### Error: "Port 3000 already in use"
**Fix:** Kill the process on port 3000
```bash
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### Error: "Cannot find module 'express'"
**Fix:** Backend dependencies not installed
```bash
cd backend
npm install
```

### Error: "Cannot find module 'react'"
**Fix:** Frontend dependencies not installed
```bash
cd frontend
npm install
```

### Error: Backend crashes with database error
**Fix:** Initialize database
```bash
cd backend
npm run db:init
npm run dev
```

---

## ✨ QUICK TEST

Once both servers are running:

1. Open http://localhost:5173 in your browser
2. Try searching for: "laptop" or "headphones"
3. You should see mock product listings appear!

---

## 📋 CHECKLIST

- [ ] Node.js installed (`node --version` works)
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] Backend running (Terminal #1: `npm run dev`)
- [ ] Frontend running (Terminal #2: `npm run dev`)
- [ ] Browser open to http://localhost:5173
- [ ] Can search for products

---

## 🆘 STILL HAVING ISSUES?

1. Close all terminals
2. Restart your computer
3. Follow the steps again from the beginning
4. Check that:
   - Node.js version is 18.x or 20.x
   - No antivirus blocking the servers
   - Ports 3000 and 5173 are not used by other apps

---

**Need Help?** All servers and code are properly configured. The issue is likely:
- Node.js not installed
- Dependencies not installed (`npm install` not run)
- Port conflicts
