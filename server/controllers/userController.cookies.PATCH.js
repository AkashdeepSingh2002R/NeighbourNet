// IMPORTANT: This is a PATCH SNIPPET for your controller where you set auth cookies.
// Usage: setAuthCookies(res, { at, rt });

function computeCookieOptions(req) {
  const isProd = process.env.NODE_ENV === 'production';
  const xfp = req.headers['x-forwarded-proto'];
  const isHttps = req.secure || xfp === 'https';

  // If we're on HTTPS (Render prod) -> SameSite=None; Secure
  // If we're on localhost http dev -> SameSite=Lax; not Secure
  if (isProd && isHttps) {
    return {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/'
    };
  }

  // Dev local defaults: same-site so cookies work without cross-site rules
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/'
  };
}

function setAuthCookies(res, tokens) {
  const { at, rt } = tokens;
  const base = computeCookieOptions(res.req);
  // Adjust lifetimes to your existing values as needed
  res.cookie('at', at, { ...base, maxAge: 1000 * 60 * 15 });
  res.cookie('rt', rt, { ...base, maxAge: 1000 * 60 * 60 * 24 * 7 });
}

module.exports = { setAuthCookies };
