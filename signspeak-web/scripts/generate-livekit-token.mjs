#!/usr/bin/env node
import { createHmac, randomUUID } from 'node:crypto';

const {
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  LIVEKIT_URL,
  LIVEKIT_TOKEN_TTL,
} = process.env;

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET environment variables.');
  process.exit(1);
}

const argv = process.argv.slice(2);
const identity = argv[0] || `duck-dev-${randomUUID().slice(0, 8)}`;
const room = argv[1] || 'duck-dev-room';
const ttlSeconds = Number.isFinite(Number(LIVEKIT_TOKEN_TTL)) ? Number(LIVEKIT_TOKEN_TTL) : 60 * 60;
const now = Math.floor(Date.now() / 1000);

const header = { alg: 'HS256', typ: 'JWT' };
const grant = {
  video: {
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  },
};

const payload = {
  jti: randomUUID(),
  iss: LIVEKIT_API_KEY,
  sub: identity,
  aud: 'livekit',
  exp: now + ttlSeconds,
  iat: now,
  nbf: now - 10,
  ...grant,
};

const base64Url = (input) =>
  Buffer.from(typeof input === 'string' ? input : JSON.stringify(input))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const encodedHeader = base64Url(header);
const encodedPayload = base64Url(payload);
const dataToSign = `${encodedHeader}.${encodedPayload}`;

const signature = createHmac('sha256', LIVEKIT_API_SECRET)
  .update(dataToSign)
  .digest('base64')
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');

const token = `${dataToSign}.${signature}`;

console.log('\nLiveKit token generated successfully!');
console.log('-----------------------------------');
console.log(`Server URL : ${LIVEKIT_URL || 'set LIVEKIT_URL for convenience'}`);
console.log(`Identity   : ${identity}`);
console.log(`Room       : ${room}`);
console.log(`TTL (sec)  : ${ttlSeconds}`);
console.log('\nToken:\n');
console.log(token);
console.log('\nUsage tip: copy this value into the join screen or export as VITE_LIVEKIT_TOKEN for automation.');
