import { json } from '@sveltejs/kit';
import os from 'os';

/** @type {import('./$types').RequestHandler} */
export function GET() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const name of Object.keys(interfaces)) {
    const list = interfaces[name] || [];
    for (const iface of list) {
      // Check for IPv4 and non-internal
      const isIpv4 = iface.family === 'IPv4' || iface.family === 4;
      if (isIpv4 && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }

  // Prioritize typical LAN addresses: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
  const lanIp = ips.find((ip) => ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) || ips[0] || null;

  return json({
    ip: lanIp,
    allIps: ips,
  });
}
