# Video Call Feature - Integration Guide

## Overview
Person A's video calling feature has been successfully implemented for DuckSpeak. This feature enables real-time video calls with live speech-to-text captions and sign animations.

## 🎯 Features Implemented

### ✅ Milestone 1: Basic Video Call
- **LiveKit integration** via `useLiveKit` hook
- Peer-to-peer video with local and remote streams
- Join/Leave/Mute/Unmute controls
- Clean split-pane UI layout

### ✅ Milestone 2: Real-Time Captions
- **Web Speech API** integration via `useSpeechToText` hook
- Live microphone capture and transcription
- Real-time caption display below local video
- Visual "Listening" indicator

### ✅ Milestone 3: Caption DataChannel
- Captions transmitted to Person B via LiveKit data tracks
- JSON payload format: `{ type: 'caption', text: string, timestamp: number, sender: string }`
- Bi-directional caption reception (ready for Person B integration)

### ✅ Milestone 4: Sign Animation Module
- **SignAnimator component** with emoji-based animations
- 50+ word-to-sign mappings (greetings, emotions, questions, actions, etc.)
- Queued animation system with smooth transitions
- Extensible architecture for 3D avatar replacement

## 📁 Files Created

```
src/
├── hooks/
│   ├── useLiveKit.ts          # LiveKit video call management
│   └── useSpeechToText.ts     # Web Speech API integration
├── components/
│   └── SignAnimator.tsx       # Sign animation display
├── data/
│   └── signMappings.ts        # Word-to-emoji/GIF mappings
└── pages/
    └── VideoCall.tsx          # Main video call page (Person A)
```

## 🚀 How to Use

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Navigate to Video Call Tab
Click the **"Video Call"** button in the navigation header.

### 3. Connect to a LiveKit Room
1. Copy `.env.example` to `.env.local` and fill in the secure values (file stays local and is git-ignored).
   - `VITE_LIVEKIT_URL` → `wss://duckspeak-jk56pxsb.livekit.cloud`
   - `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` → provided via secure channel (never commit).
2. Generate a short-lived access token whenever you start a session:
   ```bash
   npm run generate:token -- [identity] [room]
   ```
   The command reads your local `.env.local`, prints a JWT, and you can paste it into the join screen.
3. Click **"Join Call"** (leave the token field empty to reuse `VITE_LIVEKIT_TOKEN` if you exported one).

### 4. Start Speaking
- Speech recognition starts automatically when you join
- Speak into your microphone
- Live captions appear below your video
- Captions are sent to Person B in real-time
- Sign animations appear in the right panel

### 5. Controls
- **🎤 Mute/Unmute**: Toggle microphone
- **📷 Video On/Off**: Toggle camera
- **🎙️ Start/Stop Speech**: Toggle speech recognition
- **Leave Call**: Exit the room

## 🔧 Architecture

### useLiveKit Hook
```typescript
const livekit = useLiveKit({
  onRemoteCaptionReceived: (caption) => {
    // Handle captions from Person B
  },
});

// Usage (inside a <LiveKitRoom> provider)
livekit.sendCaption(text);
livekit.toggleMute();
livekit.toggleVideo();
livekit.leaveCall();
```

### useSpeechToText Hook
```typescript
const speech = useSpeechToText({
  continuous: true,
  interimResults: true,
  onTranscript: (text, isFinal) => {
    if (isFinal) {
      // Send final transcript as caption
    }
  }
});

// Usage
speech.startListening();
speech.stopListening();
```

### SignAnimator Component
```typescript
<SignAnimator
  caption={currentTranscript}
  isActive={isListening}
/>
```

## 🎨 UI Layout

**Split-Pane Design:**
- **Left Pane**: Video feeds (local + remote)
- **Right Pane**: Captions and sign animations

**Video Features:**
- Mirrored local video for natural appearance
- Live caption overlay on local video
- "Listening" indicator when speech is active
- Remote participant status display

**Caption Display:**
- "Your Captions (Sent)" - shows outgoing captions
- "Person B Captions (Received)" - shows incoming captions
- Auto-scrolling caption lists

## 🔄 Extension Points

### Replace Emoji with 3D Avatar
Update `SignAnimator.tsx`:
```typescript
// Current: emoji display
<div style={styles.emoji}>{currentAnimation.emoji}</div>

// Replace with: 3D avatar component
<AvatarRenderer animation={currentAnimation.word} />
```

### Add Custom Sign Mappings
Edit `src/data/signMappings.ts`:
```typescript
export const SIGN_MAPPINGS: Record<string, SignAnimation> = {
  myword: {
    word: 'myword',
    emoji: '🎯',
    gifUrl: 'https://example.com/sign.gif',
    description: 'Custom sign description'
  },
  // ... add more
};
```

### Switch to OpenAI Whisper API
Replace `useSpeechToText` implementation:
```typescript
// Stream audio to Whisper API instead of Web Speech API
// Update onTranscript callback to handle Whisper responses
```

### Use Plain WebRTC (No LiveKit)
Replace `useLiveKit` implementation with native WebRTC:
```typescript
// Use RTCPeerConnection, RTCDataChannel
// Implement signaling server for peer discovery
```

## 🧪 Testing

### Browser Support
- **Chrome/Edge**: Full support ✅
- **Firefox**: Limited Web Speech API support ⚠️
- **Safari**: Limited support ⚠️

### Permissions Required
- Camera access
- Microphone access
- Internet connection for LiveKit

### Demo Workflow
1. Open app in two browser windows/tabs
2. Join the same LiveKit room/token in both
3. Window 1 = Person A (this implementation)
4. Window 2 = Person B (to be implemented)
5. Speak in Window 1, see captions and animations
6. Captions transmitted to Window 2 via data channel

## 📝 Integration with Existing Pages

The VideoCall feature is already integrated into the main app:
- **src/App.tsx** now includes a "Video Call" tab
- No conflicts with existing Recognize or CollectTrain pages
- Uses same styling theme (dark mode, green accents)

### Potential Synergies
- **Future**: Combine VideoCall with Recognize page
  - Show ASL recognition + video call in same view
  - Person A speaks → captions → signs
  - Person B signs → ASL recognition → captions

## 🐛 Known Limitations

1. **Web Speech API**:
   - Chrome/Edge only for best results
   - Requires internet for cloud processing
   - May have delays on slow connections

2. **LiveKit**:
   - Requires server URL and access token configuration
   - Cloud usage may incur costs beyond free tier
   - Alternative: Self-host LiveKit or implement custom WebRTC stack

3. **Sign Animations**:
   - Currently emoji-based (prototype)
   - Limited to ~50 common words
   - No dynamic gesture sequences

## 🚧 Next Steps for Person B

To complete the full feature, implement Person B's side:
1. Create `PersonBVideoCall.tsx` page
2. Receive captions from Person A
3. Display sign animations from captions
4. Send ASL recognition results back as captions
5. Use existing MediaPipe + KNN from Recognize page

## 🎉 Summary

All 4 milestones completed:
- ✅ Video call with LiveKit
- ✅ Real-time speech-to-text captions
- ✅ Caption transmission via data channel
- ✅ Sign animation prototype (emoji-based, extensible)

The implementation is **hackathon-ready**, production-quality TypeScript, and designed for easy extension to 3D avatars or advanced motion models.
- 🔐 LiveKit credentials are stored locally in `.env.local` and should be distributed through the team's secret manager. Do not commit tokens or secrets to git.
