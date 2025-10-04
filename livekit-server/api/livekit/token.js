import { AccessToken } from "livekit-server-sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { room, identity } = req.body || {};
  if (!room || !identity) {
    return res.status(400).json({ error: "Missing room or identity" });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;

  try {
    const at = new AccessToken(apiKey, apiSecret, { identity, ttl: 3600 });
    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    res.status(200).json({ token, url: livekitUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create token" });
  }
}
