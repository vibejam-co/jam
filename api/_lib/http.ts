export const sendJson = (res: any, status: number, body: unknown) => {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(body));
};

export const methodNotAllowed = (res: any, allowed: string[]) => {
  res.setHeader('Allow', allowed.join(', '));
  return sendJson(res, 405, { error: 'Method Not Allowed' });
};

export const parseJsonBody = (req: any) => {
  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }

  return req.body ?? {};
};
