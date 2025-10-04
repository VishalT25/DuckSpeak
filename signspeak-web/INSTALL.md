# SignSpeak Web — Installation Instructions

## Prerequisites

- **Node.js** 18+ and npm (Download from https://nodejs.org/)
- **Modern browser** (Chrome 90+, Edge 90+, or Firefox 88+)
- **Webcam** for hand detection

## Quick Install (3 steps)

### Step 1: Install Dependencies

```bash
cd signspeak-web
npm install
```

This installs:
- React 18 + TypeScript
- MediaPipe Tasks Vision
- idb-keyval (IndexedDB wrapper)
- Zustand (state management)
- Vite (build tool)

**Installation time**: ~1-2 minutes (depending on internet speed)

### Step 2: Start Development Server

```bash
npm run dev
```

You should see:

```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Step 3: Open in Browser

Open `http://localhost:3000` in Chrome or Edge.

**You're done!** 🎉

## Verification

### Check 1: Camera Permission

When you first open the app, your browser will ask for camera permission. Click **"Allow"**.

### Check 2: Hand Detection

- Go to **"Collect & Train"** tab
- You should see your webcam feed
- Wave your hand — green landmarks should appear on your hand

### Check 3: Data Capture

- Select "hello" from the label list
- Click **"Start Capture"**
- Hold your hand in a static position
- The counter should increase: "Captured: X/100"

If all checks pass, you're ready to use SignSpeak!

## Troubleshooting

### npm install fails

**Error**: `EACCES` or permission errors

**Solution**:
```bash
# Use sudo (macOS/Linux)
sudo npm install

# Or fix npm permissions (recommended)
# Follow: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally
```

**Error**: `Cannot find module` or version conflicts

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### npm run dev fails

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Use different port
npm run dev -- --port 3001
```

**Error**: `Cannot find module 'vite'`

**Solution**:
```bash
# Install vite explicitly
npm install vite --save-dev

# Then retry
npm run dev
```

### Browser shows blank page

**Check**:
1. Open browser console (F12 or Cmd+Option+I)
2. Look for errors in Console tab
3. Check Network tab for failed requests

**Common fixes**:
```bash
# Rebuild
npm run build

# Clear browser cache
Ctrl+Shift+Delete (Chrome)

# Try incognito/private mode
```

### MediaPipe errors

**Error**: `Failed to load MediaPipe model`

**Solution**:
- Check internet connection (MediaPipe loads from CDN)
- Wait a few seconds for model download
- Try refreshing page
- Check browser console for CORS errors

**Error**: `Hand detection not working`

**Solution**:
- Ensure good lighting
- Try moving hand closer/farther from camera
- Check camera is not in use by another app
- Try different browser (Chrome/Edge recommended)

### Camera permission denied

**Fix on Chrome**:
1. Click lock icon (🔒) in address bar
2. Click "Site settings"
3. Set Camera to "Allow"
4. Refresh page

**Fix on Firefox**:
1. Click shield icon in address bar
2. Click "Permissions"
3. Allow camera access
4. Refresh page

## Advanced Setup

### Using a specific Node version

```bash
# Install nvm (Node Version Manager)
# Then use specific version
nvm install 18
nvm use 18
npm install
```

### Enabling HTTPS for local development

```bash
# Install mkcert (one-time setup)
# macOS
brew install mkcert
mkcert -install

# Generate local SSL certificate
mkcert localhost

# Update vite.config.ts to use HTTPS
# Add to server config:
# https: {
#   key: fs.readFileSync('localhost-key.pem'),
#   cert: fs.readFileSync('localhost.pem'),
# }
```

### Production Build

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

Output in `dist/` folder — ready to deploy to static hosting.

## System Requirements

### Minimum

- **CPU**: Intel i3 / AMD equivalent
- **RAM**: 4GB
- **GPU**: Integrated graphics
- **Browser**: Chrome 90+ / Edge 90+ / Firefox 88+
- **Internet**: Required for MediaPipe model download (first load)

### Recommended

- **CPU**: Intel i5 / AMD Ryzen 5 / M1
- **RAM**: 8GB
- **GPU**: Dedicated GPU (for faster MediaPipe)
- **Browser**: Chrome 100+ / Edge 100+
- **Camera**: 720p or higher

## Platform-Specific Notes

### Windows

- Use **Command Prompt** or **PowerShell** (not Git Bash)
- If `npm` not found, add Node to PATH:
  - `C:\Program Files\nodejs\`

### macOS

- Use **Terminal** or **iTerm2**
- May need to allow terminal to access camera in System Preferences

### Linux

- May need to install additional dependencies:
  ```bash
  sudo apt-get update
  sudo apt-get install -y build-essential
  ```

## Next Steps

After successful installation:

1. 📖 Read [QUICKSTART.md](./QUICKSTART.md) for usage guide
2. 📚 Read [README.md](./README.md) for full documentation
3. 🎯 Start collecting data in "Collect & Train" tab
4. 🚀 Build your demo!

## Support

If you encounter issues not covered here:

1. Check browser console (F12) for error messages
2. Verify all files are present (27 files total)
3. Try clearing browser cache and cookies
4. Test in incognito/private mode
5. Try different browser (Chrome recommended)

## Installation Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Repository cloned/downloaded
- [ ] `npm install` completed successfully
- [ ] `npm run dev` starts server
- [ ] Browser opens to `localhost:3000`
- [ ] Camera permission granted
- [ ] Hand landmarks appear when waving hand
- [ ] Can capture samples
- [ ] Can train model

✅ All checked? You're ready to go!

---

**Total installation time**: ~5 minutes

**Ready to start collecting data!**
