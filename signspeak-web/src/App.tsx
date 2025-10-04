/**
 * App.tsx - Main application component
 */

import { useState } from 'react';
import { Recognize } from './pages/Recognize';
import { CollectTrain } from './pages/CollectTrain';
import { VideoCall } from './pages/VideoCall';

type Tab = 'recognize' | 'collect' | 'videocall';

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('recognize');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: '#1a1a1a',
          borderBottom: '2px solid #333',
          padding: '15px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, color: '#00ff00', fontSize: '24px' }}>
            SignSpeak
            <span style={{ fontSize: '14px', color: '#666', marginLeft: '10px' }}>
              Real-Time ASL Recognition
            </span>
          </h1>

          <nav style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setActiveTab('recognize')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'recognize' ? '#00ff00' : '#333',
                color: activeTab === 'recognize' ? '#000' : '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: activeTab === 'recognize' ? 'bold' : 'normal',
                fontSize: '16px',
              }}
            >
              Recognize
            </button>
            <button
              onClick={() => setActiveTab('collect')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'collect' ? '#00ff00' : '#333',
                color: activeTab === 'collect' ? '#000' : '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: activeTab === 'collect' ? 'bold' : 'normal',
                fontSize: '16px',
              }}
            >
              Collect & Train
            </button>
            <button
              onClick={() => setActiveTab('videocall')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'videocall' ? '#00ff00' : '#333',
                color: activeTab === 'videocall' ? '#000' : '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: activeTab === 'videocall' ? 'bold' : 'normal',
                fontSize: '16px',
              }}
            >
              Video Call
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main>
        {activeTab === 'recognize' && <Recognize />}
        {activeTab === 'collect' && <CollectTrain />}
        {activeTab === 'videocall' && <VideoCall />}
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '20px',
          color: '#666',
          fontSize: '12px',
          borderTop: '1px solid #333',
          marginTop: '40px',
        }}
      >
        SignSpeak MVP — Built with MediaPipe, React, and TypeScript
        <br />
        On-device processing • No server required
      </footer>
    </div>
  );
}
