# DuckSpeak - Quick Start & Deployment

## 🚀 One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/duckspeak)

## ⚡ Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your LiveKit credentials:

```env
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

**Get LiveKit credentials:**
1. Sign up at [livekit.io](https://livekit.io)
2. Create a project
3. Copy credentials from Settings → Keys

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Test Video Call

1. Click **"Video Call"** tab
2. Click **"Join Call"** (token auto-generated)
3. Allow camera/microphone permissions
4. Start speaking to see live captions
5. Open another browser tab/window to test with Person B

## 📦 Deploy to Vercel

### Method 1: Vercel Dashboard (Easiest)

1. Push code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variables:
   - `VITE_LIVEKIT_URL`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
5. Click **Deploy**

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables
vercel env add VITE_LIVEKIT_URL
vercel env add LIVEKIT_API_KEY
vercel env add LIVEKIT_API_SECRET

# Deploy to production
vercel --prod
```

## 🎯 Features

- ✅ **Real-time ASL Recognition** - MediaPipe Hands + KNN classifier
- ✅ **Video Calling** - LiveKit WebRTC integration
- ✅ **Live Captions** - Web Speech API speech-to-text
- ✅ **Sign Animations** - Emoji-based sign visualization
- ✅ **Data Persistence** - IndexedDB for offline model storage
- ✅ **Text-to-Speech** - Browser-based TTS
- ✅ **Fingerspelling Mode** - A-Z letter recognition

## 🔧 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Video/Audio**: LiveKit (WebRTC)
- **Speech**: Web Speech API
- **Hand Tracking**: MediaPipe Hands
- **ML**: Custom KNN classifier
- **Storage**: IndexedDB
- **Deployment**: Vercel

## 📁 Project Structure

```
signspeak-web/
├── api/                    # Vercel serverless functions
│   └── token.ts           # LiveKit token generation
├── src/
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   │   ├── useLiveKit.ts  # LiveKit integration
│   │   └── useSpeechToText.ts
│   ├── lib/               # Core libraries
│   │   ├── landmarks.ts   # MediaPipe integration
│   │   ├── classifier.ts  # ML models
│   │   └── storage.ts     # IndexedDB
│   ├── pages/             # Main pages
│   │   ├── Recognize.tsx  # ASL recognition
│   │   ├── CollectTrain.tsx
│   │   └── VideoCall.tsx  # Video calling
│   ├── data/              # Static data
│   └── utils/             # Utilities
├── vercel.json            # Vercel configuration
├── .env.example           # Environment template
└── package.json
```

## 🔐 Environment Variables

| Variable | Description | Required | Exposed to Client |
|----------|-------------|----------|-------------------|
| `VITE_LIVEKIT_URL` | LiveKit WebSocket URL | Yes | Yes |
| `LIVEKIT_API_KEY` | LiveKit API Key | Yes | No (server only) |
| `LIVEKIT_API_SECRET` | LiveKit API Secret | Yes | No (server only) |

## 🧪 Testing

### Local Testing

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing with Multiple Users

1. Open two browser windows/tabs
2. Join same room in both ("duckspeak-room")
3. Person A: Speak to generate captions
4. Person B: Receive captions and see animations

## 📊 API Endpoints

### POST `/api/token`

Generate LiveKit access token

**Request:**
```json
{
  "roomName": "duckspeak-room",
  "participantName": "person-a",
  "metadata": "{\"role\":\"personA\"}"
}
```

**Response:**
```json
{
  "token": "eyJhbGci...",
  "serverUrl": "wss://project.livekit.cloud"
}
```

## 🐛 Troubleshooting

### Build fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Video not working
- Check camera/mic permissions in browser
- Verify `VITE_LIVEKIT_URL` is correct
- Check Vercel environment variables are set

### Token generation fails
- Verify `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`
- Check Vercel function logs
- Ensure variables are set in correct environment (Production/Preview)

### Captions not appearing
- Chrome/Edge required for best Web Speech API support
- Check microphone permissions
- Verify network connection

## 📚 Documentation

- [Full Deployment Guide](./VERCEL_DEPLOYMENT.md)
- [Video Call Integration](./VIDEO_CALL_INTEGRATION.md)
- [LiveKit Docs](https://docs.livekit.io)
- [Vercel Docs](https://vercel.com/docs)

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **LiveKit**: [livekit.io/support](https://livekit.io/support)
- **Vercel**: [vercel.com/support](https://vercel.com/support)

---

**Happy Coding!** 🎉

Your DuckSpeak app is ready to deploy to Vercel with full LiveKit video calling integration.
