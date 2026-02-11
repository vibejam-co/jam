export const sendJson = (res: any, status: number, body: unknown) => {
  if (res && typeof res.status === 'function' && typeof res.send === 'function') {
    res.status(status).setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(body));
    return;
  }

  if (res && typeof res.setHeader === 'function' && typeof res.end === 'function') {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
    return;
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const methodNotAllowed = (res: any, allowed: string[]) => {
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Allow', allowed.join(', '));
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      Allow: allowed.join(', '),
    },
  });
};

export const getMethod = (req: any): string => {
  if (req && typeof req.method === 'string') {
    return req.method;
  }

  return '';
};

export const parseJsonBody = async (req: any) => {
  if (!req) {
    return {};
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }

  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.json === 'function') {
    try {
      return await req.json();
    } catch {
      return {};
    }
  }

  if (typeof req.on === 'function') {
    return new Promise((resolve, reject) => {
      let raw = '';
      req.on('data', (chunk: Buffer | string) => {
        raw += chunk.toString();
      });
      req.on('end', () => {
        if (!raw) {
          resolve({});
          return;
        }
        try {
          resolve(JSON.parse(raw));
        } catch (error) {
          reject(error);
        }
      });
      req.on('error', reject);
    });
  }

  return {};
};
