import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const PROTECTED_ROUTES = ['/overview', '/sensors', '/dashboards', '/teams', '/settings', '/admin'];
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('betty_token')?.value;
  const role = request.cookies.get('betty_user_role')?.value;

  // Extract route without locale prefix if present (/es/sensors -> /sensors)
  const segments = pathname.split('/').filter(Boolean);
  const hasLocale = routing.locales.includes(segments[0] as 'es' | 'en');
  const pathWithoutLocale = hasLocale
    ? '/' + segments.slice(1).join('/')
    : pathname;

  const currentLocale = hasLocale ? segments[0] : routing.defaultLocale;

  // Check if target is a protected route (/projects is public gallery, /projects/:id requires login)
  const isProjectDetail = pathWithoutLocale.startsWith('/projects/') && pathWithoutLocale !== '/projects';
  const isProtected =
    isProjectDetail ||
    PROTECTED_ROUTES.some(
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

  // 2. Non-admin user trying to access /admin -> redirect to /overview
  if (pathWithoutLocale.startsWith('/admin') && token && role !== 'admin') {
    return NextResponse.redirect(new URL(`/${currentLocale}/overview`, request.url));
  }

  // 3. Authenticated user trying to access login/register -> redirect to /overview
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL(`/${currentLocale}/overview`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
