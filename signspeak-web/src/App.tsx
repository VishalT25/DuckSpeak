/**
 * App.tsx - Main application component
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import { Recognize } from './pages/Recognize';
import { CollectTrain } from './pages/CollectTrain';
import { VideoCall } from './pages/VideoCall';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/recognize" element={<Recognize />} />
        <Route path="/collect-train" element={<CollectTrain />} />
        <Route path="/video-call" element={<VideoCall />} />
      </Routes>
    </BrowserRouter>
  );
}
