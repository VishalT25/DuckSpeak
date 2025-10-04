# 🚀 Deploy DuckSpeak to Vercel - 5 Minutes

## Step 1: Get LiveKit Credentials (2 min)

1. Go to [cloud.livekit.io](https://cloud.livekit.io)
2. Sign up / Log in
3. Click **"Create Project"** or select existing
4. Navigate to **Settings → Keys**
5. Copy these 3 values:
   ```
   WebSocket URL: wss://yourproject.livekit.cloud
   API Key: APIxxxxxxxxxx
   API Secret: secret-xxxxxxxxxx
   ```

## Step 2: Deploy to Vercel (3 min)

### Option A: Via Dashboard (Easier)

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click **"Import"** next to your GitHub repo
   - Framework: **Vite** (auto-detected)
   - Click **"Deploy"** (don't worry about env vars yet)

3. **Add Environment Variables:**
   - Go to your project → **Settings** → **Environment Variables**
   - Add these 3 variables for **Production, Preview, Development**:

   | Name | Value |
   |------|-------|
   | `VITE_LIVEKIT_URL` | `wss://yourproject.livekit.cloud` |
   | `LIVEKIT_API_KEY` | `APIxxxxxxxxxx` |
   | `LIVEKIT_API_SECRET` | `secret-xxxxxxxxxx` |

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click **⋯** on latest deployment → **Redeploy**

### Option B: Via CLI (For Developers)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Add environment variables
vercel env add VITE_LIVEKIT_URL
# Enter: wss://yourproject.livekit.cloud

vercel env add LIVEKIT_API_KEY
# Enter: APIxxxxxxxxxx

vercel env add LIVEKIT_API_SECRET
# Enter: secret-xxxxxxxxxx

# 5. Deploy to production
vercel --prod
```

## Step 3: Test Your Deployment (1 min)

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Click **"Video Call"** tab
3. Click **"Join Call"**
4. Allow camera/microphone permissions
5. You're live! 🎉

### Test with Person B:

1. Open another browser window/tab
2. Visit same URL
3. Click **"Video Call"** → **"Join Call"**
4. Both participants should see each other
5. Person A: Speak → See captions → Person B receives them

## ✅ Verification Checklist

- [ ] Deployment succeeded
- [ ] No build errors
- [ ] Environment variables set (all 3)
- [ ] Video Call page loads
- [ ] Camera/mic permissions granted
- [ ] Local video displays
- [ ] Can join room
- [ ] Token auto-generated successfully
- [ ] Remote participant appears when second user joins
- [ ] Captions send/receive works
- [ ] Sign animations appear

## 🔧 Troubleshooting

### ❌ "Server configuration error"
**Cause:** Missing environment variables
**Fix:** Add `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` in Vercel dashboard → Redeploy

### ❌ Build fails
**Cause:** Dependencies issue
**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "Fix dependencies"
git push
```

### ❌ Video not showing
**Cause:** Camera permissions or wrong URL
**Fix:**
1. Check browser allows camera access
2. Verify `VITE_LIVEKIT_URL` format: `wss://project.livekit.cloud` (not `https://`)

### ❌ "Failed to fetch token from API"
**Cause:** API route not working
**Fix:** Check Vercel function logs in dashboard → Functions tab

## 📊 What's Deployed

### Frontend (Static)
- React app served from CDN edge
- Lightning fast global delivery
- Optimized bundle (~784KB gzipped ~222KB)

### Backend (Serverless)
- `/api/token` - Token generation endpoint
- Auto-scales globally
- Secure API key storage

### Features
- ✅ Real-time video calling
- ✅ Speech-to-text captions
- ✅ Sign language animations
- ✅ ASL recognition (MediaPipe)
- ✅ Data persistence (IndexedDB)
- ✅ Text-to-speech

## 🌐 Custom Domain (Optional)

1. Go to Vercel Dashboard → **Settings** → **Domains**
2. Add your domain: `duckspeak.com`
3. Configure DNS as instructed
4. SSL certificate auto-provisioned ✓

## 📈 Monitoring

**View Logs:**
```bash
vercel logs <your-url>
```

**Or in Dashboard:**
- Go to **Deployments** → [Latest] → **Logs**
- Check **Functions** tab for API logs

## 🔒 Security Notes

- ✅ API credentials never exposed to client
- ✅ Tokens generated server-side only
- ✅ HTTPS enforced automatically
- ✅ `.env.local` in `.gitignore`
- ✅ Vercel environment variables encrypted

## 🎯 URLs to Share

After deployment, share:

1. **App URL:** `https://your-project.vercel.app`
2. **Video Call Direct:** `https://your-project.vercel.app` → Click "Video Call"
3. **Room Name:** `duckspeak-room` (Person A and B use same room)

## 📚 Next Steps

- [ ] Test with multiple participants
- [ ] Customize room names in code
- [ ] Add user authentication (optional)
- [ ] Monitor LiveKit usage in dashboard
- [ ] Set up analytics (optional)
- [ ] Configure custom domain (optional)

---

## 🆘 Need Help?

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **LiveKit Docs:** [docs.livekit.io](https://docs.livekit.io)
- **Full Guide:** See `VERCEL_DEPLOYMENT.md`
- **Migration Details:** See `MIGRATION_SUMMARY.md`

---

**That's it!** Your DuckSpeak app is now live with full video calling. 🎉

**Total Time:** ~5 minutes
**Cost:** Free (Vercel + LiveKit free tiers)
