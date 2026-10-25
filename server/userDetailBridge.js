import http from 'node:http';
import https from 'node:https';

// An allowlisted bridge, not an open proxy. The browser sends a POST; Node
// forwards its JSON body using the backend endpoint's required GET method.
export function userDetailBridge(target) {
  const allowedEndpoints = new Set([
    '/backend-api/getUserById',
    '/backend-api/getDepartmentById',
    '/backend-api/getPositionById',
    '/backend-api/my-employee-detail',
    '/backend-api/getUserSalaryHistory',
    '/backend-api/getLeaveRequestById',
  ]);

  return (req, res, next) => {
    const requestUrl = new URL(req.url ?? '/', 'http://localhost');
    if (!allowedEndpoints.has(requestUrl.pathname)) return next();

    if (req.method !== 'POST') {
      res.writeHead(405, { Allow: 'POST', 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: 'Method not allowed.' }));
    }

    const endpoint = requestUrl.pathname.slice('/backend-api'.length);
    const upstreamUrl = new URL(`${target.replace(/\/$/, '')}${endpoint}`);
    upstreamUrl.search = requestUrl.search;

    const headers = { 'content-type': 'application/json', accept: 'application/json' };
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    if (req.headers['content-length']) headers['content-length'] = req.headers['content-length'];
    else headers['transfer-encoding'] = 'chunked';

    const transport = upstreamUrl.protocol === 'https:' ? https : http;
    const upstream = transport.request(upstreamUrl, { method: 'GET', headers }, (response) => {
      res.writeHead(response.statusCode ?? 502, {
        'Content-Type': response.headers['content-type'] ?? 'application/json',
        'Cache-Control': 'no-store',
      });
      response.pipe(res);
    });

    upstream.setTimeout(15000, () => upstream.destroy(new Error('Backend timeout')));
    upstream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Unable to load details from the backend.' }));
      } else res.destroy();
    });
    req.on('aborted', () => upstream.destroy());
    req.pipe(upstream);
  };
}
