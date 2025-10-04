/**
 * Netlify Serverless Function - LiveKit Token Generation
 * Generates secure access tokens for LiveKit rooms
 */

const { AccessToken } = require('livekit-server-sdk');

exports.handler = async function(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { roomName, participantName, metadata } = body;

    // Validate required fields
    if (!roomName || typeof roomName !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'roomName is required and must be a string' })
      };
    }

    if (!participantName || typeof participantName !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'participantName is required and must be a string' })
      };
    }

    // Get LiveKit credentials from environment
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.VITE_LIVEKIT_URL || process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret) {
      console.error('LiveKit credentials not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
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
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        token,
        serverUrl: livekitUrl
      })
    };
  } catch (error) {
    console.error('Token generation error:', error);
    console.error('Error stack:', error.stack);
    console.error('Environment check:', {
      hasApiKey: !!process.env.LIVEKIT_API_KEY,
      hasApiSecret: !!process.env.LIVEKIT_API_SECRET,
      hasUrl: !!(process.env.VITE_LIVEKIT_URL || process.env.LIVEKIT_URL)
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to generate token',
        message: error.message,
        stack: error.stack
      })
    };
  }
};
