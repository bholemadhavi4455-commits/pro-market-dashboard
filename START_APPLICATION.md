# 🚀 Start the PRO Market Dashboard

## ⚠️ Prerequisites Required

Before you can start the application, you need to install Node.js and npm.

### Install Node.js

1. **Download Node.js:**
   - Visit: https://nodejs.org/
   - Download the **LTS (Long Term Support)** version
   - Current recommended: Node.js 20.x or 18.x

2. **Run the Installer:**
   - Execute the downloaded installer
   - Follow the installation wizard
   - ✅ Check "Automatically install necessary tools" if prompted
   - ✅ Add Node.js to PATH (should be enabled by default)

3. **Verify Installation:**
   Open a new terminal/command prompt and run:
   ```bash
   node --version
   # Should show: v20.x.x or v18.x.x
   
   npm --version
   # Should show: 10.x.x or 9.x.x
   ```

---

## 📦 Once Node.js is Installed

### Step 1: Install Backend Dependencies

```bash
# Navigate to backend directory
# Install dependencies
npm install

# This will install:
# - express, cors, body-parser, axios
# - sqlite3 (database)
# - typescript, ts-node, nodemon
# - jest, fast-check (tesnpm.cmd --versionting)
# - And all other dependencies listed in package.json
```

**Expected output:**
```
added 200+ packages in ~30s
```

---

### Step 2: Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd "c:\Users\Admin\Desktop\PRO MARKET DASHBOARD\frontend"

# Install dependencies
npm install

# This will install:
# - react, react-dom
# - axios (API client)
# - vite (build tool)
# - recharts (charts)
# - And all other dependencies
```

**Expected output:**
```
added 300+ packages in ~40s
```

---

### Step 3: Start the Backend Server

```bash
# From backend directory
cd "c:\Users\Admin\Desktop\PRO MARKET DASHBOARD\backend"

# Start development server
npm run dev
```

**Expected output:**
```
[nodemon] starting `ts-node src/server.ts`
🚀 Server running on http://localhost:3000
📊 Database initialized
✅ Mock source adapters loaded
```

**Keep this terminal window open!** The backend server needs to stay running.

---

### Step 4: Start the Frontend (New Terminal)

Open a **NEW** terminal window (keep backend running):

```bash
# From frontend directory
cd "c:\Users\Admin\Desktop\PRO MARKET DASHBOARD\frontend"

# Start development server
npm run dev
```
**Expected output:**
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

### Step 5: Open the Application

1. **Open your browser**
2. **Navigate to:** http://localhost:5173
3. **You should see:** The PRO Market Dashboard homepage with a search bar

---

## 🎯 Using the Application

### Try These Searches:
- "laptop" - See electronics listings
- "headphones" - Compare audio products
- "book" - Browse book listings
- "shoes" - Check clothing items

### Features to Test:
- ✅ Search for products
- ✅ Sort by price, rating, reviews
- ✅ Filter by category
- ✅ Click "View Details" to expand reviews
- ✅ See the "Best Pick" recommendation
- ✅ Click price cards to view history charts
- ✅ Test responsive design (resize window)

---

## 🛑 Stopping the Application

### Stop Backend:
- Go to the backend terminal
- Press `Ctrl+C`

### Stop Frontend:
- Go to the frontend terminal
- Press `Ctrl+C`

---

## 🔧 Troubleshooting

### Problem: "Port 3000 already in use"
**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Problem: "Port 5173 already in use"
**Solution:**
```bash
# Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Problem: "Cannot find module 'express'"
**Solution:**
```bash
cd backend
npm install
```

### Problem: "Cannot find module 'react'"
**Solution:**
```bash
cd frontend
npm install
```

### Problem: Backend errors about database
**Solution:**
```bash
cd backend
# Delete existing database
del data\*.db
# Restart server - it will recreate the database
npm run dev
```

---

## 📝 Quick Reference

### Backend Commands
```bash
npm run dev        # Start development server
npm test           # Run tests
npm run build      # Build for production
```

### Frontend Commands
```bash
npm run dev        # Start development server
npm test           # Run tests
npm run build      # Build for production
npm run preview    # Preview production build
```

---

## 🎉 Success Indicators

✅ Backend running on http://localhost:3000  
✅ Frontend running on http://localhost:5173  
✅ No errors in either terminal  
✅ Can access application in browser  
✅ Search functionality works  
✅ Mock data appears for searches  

---

## 📚 Next Steps

Once the application is running:

1. **Test all features** - Search, filter, sort, view history
2. **Try different devices** - Test responsive design
3. **Check documentation** - Review requirements.md and design.md
4. **Add real APIs** - Replace mock adapters with actual API integrations
5. **Deploy** - Consider deployment to Vercel, AWS, or other platforms

---

## 🆘 Need Help?

If you encounter issues:
1. Check that Node.js is properly installed
2. Verify both terminals are running without errors
3. Check that ports 3000 and 5173 are not in use
4. Review error messages in the terminal
5. Check browser console for frontend errors (F12)

---

**Ready to start? Install Node.js first, then follow the steps above!** 🚀
