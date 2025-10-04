/**
 * Vercel Serverless Function - LiveKit Token Generation
 * Generates secure access tokens for LiveKit rooms
 */

import { AccessToken } from 'livekit-server-sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomName, participantName, metadata } = req.body;

    // Validate required fields
    if (!roomName || typeof roomName !== 'string') {
      return res.status(400).json({ error: 'roomName is required and must be a string' });
    }

    if (!participantName || typeof participantName !== 'string') {
      return res.status(400).json({ error: 'participantName is required and must be a string' });
    }

    // Get LiveKit credentials from environment
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL || process.env.VITE_LIVEKIT_URL;

    if (!apiKey || !apiSecret) {
      console.error('LiveKit credentials not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      metadata: metadata || '',
    });

    // Grant permissions
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Generate JWT
    const token = await at.toJwt();

    // Return token
    return res.status(200).json({
      token,
      serverUrl,
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate token',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
