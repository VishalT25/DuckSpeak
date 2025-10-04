# DuckSpeak - Vercel Deployment Guide

Complete guide to deploying DuckSpeak to Vercel with full LiveKit video calling integration.

## 🚀 Quick Deploy

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **LiveKit Account**: Sign up at [livekit.io](https://livekit.io) or [cloud.livekit.io](https://cloud.livekit.io)
3. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket

### Step 1: Get LiveKit Credentials

1. Go to [LiveKit Cloud Dashboard](https://cloud.livekit.io)
2. Create a new project or select existing one
3. Navigate to **Settings** → **Keys**
4. Copy your credentials:
   - **WebSocket URL**: `wss://your-project.livekit.cloud`
   - **API Key**: `APIxxxxxxxxxx`
   - **API Secret**: `secret-key-xxxxxxxxxx`

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Add Environment Variables:
   ```
   VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=APIxxxxxxxxxx
   LIVEKIT_API_SECRET=secret-key-xxxxxxxxxx
   ```

5. Click **Deploy**

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to project directory
cd signspeak-web

# Login to Vercel
vercel login

# Deploy
vercel

# Add environment variables
vercel env add VITE_LIVEKIT_URL
vercel env add LIVEKIT_API_KEY
vercel env add LIVEKIT_API_SECRET

# Redeploy with environment variables
vercel --prod
```

### Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_LIVEKIT_URL` | `wss://your-project.livekit.cloud` | Production, Preview, Development |
| `LIVEKIT_API_KEY` | Your LiveKit API Key | Production, Preview |
| `LIVEKIT_API_SECRET` | Your LiveKit API Secret | Production, Preview |

**Important Security Notes:**
- ✅ `VITE_LIVEKIT_URL` - Safe to expose (client-side)
- ⛔ `LIVEKIT_API_KEY` - Keep secret (server-side only)
- ⛔ `LIVEKIT_API_SECRET` - Keep secret (server-side only)

### Step 4: Verify Deployment

1. Visit your deployed URL (e.g., `https://duckspeak.vercel.app`)
2. Navigate to **Video Call** tab
3. Click **Join Call** (token will be auto-generated)
4. Grant camera/microphone permissions
5. Verify video and audio are working

## 🏗️ Architecture

### Build Configuration

The project uses Vite with React + TypeScript:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### API Routes

Vercel Serverless Functions handle token generation:

- **`/api/token`** - POST endpoint for LiveKit token generation
  - Input: `{ roomName, participantName, metadata }`
  - Output: `{ token, serverUrl }`

### Token Flow

1. **Client**: Calls `/api/token` with room details
2. **Server**: Generates JWT using LiveKit SDK
3. **Client**: Receives token and connects to LiveKit room

```typescript
// Client-side (VideoCall.tsx)
const response = await fetch('/api/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roomName: 'duckspeak-room',
    participantName: 'person-a',
  }),
});

const { token } = await response.json();
```

## 🔧 Local Development

### Setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd signspeak-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

4. Edit `.env.local` with your LiveKit credentials:
   ```env
   VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=APIxxxxxxxxxx
   LIVEKIT_API_SECRET=secret-key-xxxxxxxxxx
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Testing API Routes Locally

Vercel CLI can run serverless functions locally:

```bash
# Install Vercel CLI
npm install -g vercel

# Run dev server with serverless functions
vercel dev
```

## 🎯 Features

### Person A (Video + Speech)

- ✅ WebRTC video calling via LiveKit
- ✅ Real-time speech-to-text captions (Web Speech API)
- ✅ Live caption transmission via LiveKit data tracks
- ✅ Sign animation visualization (emoji-based, extensible to 3D)
- ✅ Mute/unmute microphone
- ✅ Enable/disable camera
- ✅ Auto-generated access tokens

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Video/Audio**: LiveKit (WebRTC)
- **Speech Recognition**: Web Speech API
- **Hand Tracking**: MediaPipe Hands (ASL Recognition)
- **ML**: Custom KNN classifier
- **Storage**: IndexedDB (idb-keyval)
- **Deployment**: Vercel (Static + Serverless)

## 🔐 Security Best Practices

### Environment Variables

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Use Vercel Environment Variables** for production secrets
3. **Separate client/server variables**:
   - Client: Prefix with `VITE_` (exposed to browser)
   - Server: No prefix (only available in serverless functions)

### Token Security

- Tokens are generated server-side with short TTL (1 hour default)
- API Key and Secret never exposed to client
- Tokens scoped to specific rooms and permissions

### CORS & API Protection

The `/api/token` endpoint:
- Only accepts POST requests
- Validates required fields
- Returns appropriate error codes
- Logs errors server-side (not to client)

## 📊 Monitoring & Debugging

### Vercel Logs

View real-time logs:
```bash
vercel logs <deployment-url>
```

Or in Dashboard: Your Project → Deployments → [Latest] → Logs

### LiveKit Debugging

1. Enable verbose logging in browser console
2. Check LiveKit Dashboard for room activity
3. Monitor WebRTC stats in browser DevTools

### Common Issues

#### ❌ "Server configuration error"
- **Cause**: Missing `LIVEKIT_API_KEY` or `LIVEKIT_API_SECRET`
- **Fix**: Add env vars in Vercel dashboard, redeploy

#### ❌ "WebSocket connection failed"
- **Cause**: Invalid `VITE_LIVEKIT_URL`
- **Fix**: Verify URL format `wss://project.livekit.cloud`

#### ❌ "Token generation failed"
- **Cause**: Invalid API credentials
- **Fix**: Regenerate keys in LiveKit dashboard

#### ❌ Video not showing
- **Cause**: Camera permissions denied
- **Fix**: Allow camera access in browser settings

## 🚢 CI/CD

### Automatic Deployments

Vercel automatically deploys:
- **Production**: On push to `main` branch
- **Preview**: On pull requests
- **Development**: On push to other branches

### Custom Domains

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `duckspeak.com`)
3. Configure DNS records as shown
4. SSL certificates are automatically provisioned

## 📈 Scaling

### Performance

- **Static Assets**: Cached at CDN edge (1 year TTL)
- **Serverless Functions**: Auto-scale globally
- **LiveKit**: Handles 100+ participants per room

### Cost Optimization

- **Vercel**: Generous free tier for hobby projects
- **LiveKit**: Free tier includes 50GB/month egress
- **Serverless**: Pay per execution (free tier: 100k/month)

## 🔄 Updates

Deploy new changes:

```bash
# Commit changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel auto-deploys
```

Or manually trigger:

```bash
vercel --prod
```

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [LiveKit Documentation](https://docs.livekit.io)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)

## 🆘 Support

- **Vercel Issues**: [vercel.com/support](https://vercel.com/support)
- **LiveKit Issues**: [livekit.io/support](https://livekit.io/support)
- **Project Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

**Ready to deploy!** 🎉

Your DuckSpeak app will be live at `https://your-project.vercel.app` with full video calling capabilities.
