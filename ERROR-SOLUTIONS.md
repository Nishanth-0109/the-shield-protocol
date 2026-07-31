# Common Errors & Solutions

## Quick Fix - Try This First!

Double-click: **`fix-errors.bat`**

This will:
- Clean all dependencies
- Reinstall everything fresh
- Fix most common issues

---

## Specific Error Solutions

### 1. "Cannot find module" or "Module not found"

**Cause:** Dependencies not installed

**Solution:**
```powershell
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

---

### 2. "EADDRINUSE: address already in use :::5000"

**Cause:** Port 5000 is already being used

**Solution A - Change Port:**
Edit `backend\.env`:
```
PORT=5001
```
Edit `frontend\.env`:
```
VITE_API_URL=http://localhost:5001/api
```

**Solution B - Kill Process:**
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill it (replace PID with actual number)
taskkill /PID [PID] /F
```

---

### 3. "sharp: Installation failed"

**Cause:** Native module build issue

**Solution:**
```powershell
cd backend
npm install --ignore-scripts
npm install sharp --verbose
```

**Alternative:**
```powershell
npm install --platform=win32 --arch=x64 sharp
```

---

### 4. TypeScript Errors During Build

**Cause:** Type checking too strict

**Solution:**
Edit `backend\tsconfig.json` or `frontend\tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": false,
    "skipLibCheck": true
  }
}
```

---

### 5. "nodemon: command not found"

**Cause:** Dev dependency not installed globally

**Solution:**
```powershell
cd backend
npm install
```

Or install globally:
```powershell
npm install -g nodemon ts-node
```

---

### 6. CORS Error in Browser Console

**Cause:** Frontend can't reach backend

**Fix:** Make sure backend is running on port 5000

Check `backend\.env`:
```
FRONTEND_URL=http://localhost:5173
```

---

### 7. "npm is not recognized"

**Cause:** Node.js not installed or not in PATH

**Solution:**
1. Install Node.js from https://nodejs.org
2. Restart computer
3. Open new terminal and try again

---

### 8. Email Not Sending / SMTP Error

**Causes & Solutions:**

❌ **"Invalid login"**
- Check `GMAIL_APP_PASSWORD` is correct (16 chars)
- Make sure you're using App Password, not regular password

❌ **"Connection timeout"**
- Check internet connection
- Check firewall isn't blocking port 587

❌ **"Authentication failed"**
- Ensure 2-Step Verification is enabled on Gmail
- Generate new App Password

---

### 9. React Hot Toast Not Working

**Solution:**
Make sure `<Toaster />` is in `App.tsx`:
```tsx
import { Toaster } from 'react-hot-toast';

// Inside component:
<Toaster position="top-right" />
```

---

### 10. Vite Build Errors

**Solution:**
```powershell
cd frontend
npm run build -- --mode development
```

Or add to `vite.config.ts`:
```ts
build: {
  sourcemap: false,
  minify: false
}
```

---

### 11. "Cannot read properties of undefined"

**Cause:** API response format mismatch

**Check:**
1. Backend is running
2. `.env` files are configured
3. No CORS errors in browser console

**Debug:**
```tsx
console.log('Response:', response.data);
```

---

### 12. Database Errors

**Cause:** `data/db.json` corrupted

**Solution:**
```powershell
cd backend
del data\db.json
# Restart backend - it will create fresh DB
```

---

### 13. QR Code Not Generating

**Cause:** Missing logo or Sharp installation issue

**Solution A - Use Placeholder:**
- Delete `backend\assets\shield-logo.png`
- Restart backend - it will auto-generate placeholder

**Solution B - Fix Sharp:**
```powershell
cd backend
npm uninstall sharp
npm install sharp --verbose
```

---

### 14. CSV Upload Parsing Errors

**Check CSV Format:**
- Must have header row
- Column names: Student ID, Email, Name (case-insensitive)
- Student ID format: SP26-0001

**Fix:**
Use the provided `sample-students.csv` as template

---

### 15. Frontend White Screen

**Cause:** React error not showing

**Solution:**
Open browser Console (F12) and check for errors

Common fixes:
```powershell
cd frontend
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev
```

---

## Still Having Issues?

1. **Run diagnostics:**
   ```
   Double-click: diagnose.bat
   ```

2. **Check logs:**
   - Backend terminal shows API errors
   - Frontend terminal shows build errors  
   - Browser Console (F12) shows runtime errors

3. **Fresh install:**
   ```
   Double-click: fix-errors.bat
   ```

4. **Share the error:**
   - Copy the exact error message
   - Note which terminal it appears in
   - Share screenshot if needed
