import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const PROTECTED_ROUTES = ['/overview', '/sensors', '/dashboards', '/teams', '/settings', '/admin', '/projects', '/digital-twin'];
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('botuto_token')?.value || request.cookies.get('betty_token')?.value;
  const role = request.cookies.get('botuto_user_role')?.value || request.cookies.get('betty_user_role')?.value;
  const termsAccepted =
    request.cookies.get('betty_terms_accepted')?.value === 'true' ||
    request.cookies.get('botuto_terms_accepted')?.value === 'true';

  // Extract route without locale prefix if present (/es/sensors -> /sensors)
  const segments = pathname.split('/').filter(Boolean);
  const hasLocale = routing.locales.includes(segments[0] as 'es' | 'en');
  const pathWithoutLocale = hasLocale
    ? '/' + segments.slice(1).join('/')
    : pathname;

  const currentLocale = hasLocale ? segments[0] : routing.defaultLocale;

  // Check if target is a protected route (e.g. overview, sensors, settings, admin)
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathWithoutLocale === route || pathWithoutLocale.startsWith(route + '/')
  );

  // Check if target is an auth page (login/register)
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathWithoutLocale === route || pathWithoutLocale.startsWith(route + '/')
  );

  // 1. Unauthenticated user trying to access protected route -> redirect to /login
  if (isProtected && !token) {
    const loginUrl = new URL(`/${currentLocale}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user who has NOT accepted terms trying to access protected route -> redirect to /terms
  if (isProtected && token && !termsAccepted) {
    return NextResponse.redirect(new URL(`/${currentLocale}/terms`, request.url));
  }

  // 3. Non-admin user trying to access /admin -> redirect to /overview
  if (pathWithoutLocale.startsWith('/admin') && token && role !== 'admin') {
    return NextResponse.redirect(new URL(`/${currentLocale}/overview`, request.url));
  }

  // 4. Authenticated user trying to access login/register -> redirect to /overview (or /terms if pending)
  if (isAuthRoute && token) {
    const destination = termsAccepted ? `/${currentLocale}/overview` : `/${currentLocale}/terms`;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
