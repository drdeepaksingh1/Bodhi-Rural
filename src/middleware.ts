import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const protectedRoutes = [
    '/dashboard',
    '/db-test',
    '/bodhifarm',
    '/bodhimart/seller/dashboard',
    '/bodhimart/seller/products',
    '/bodhimart/seller/inventory',
    '/bodhimart/seller/orders',
    '/bodhimart/admin/sellers',
  ];

  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && user) {
    const requestedRedirect = request.nextUrl.searchParams.get('redirect');
    let destination = new URL('/dashboard', request.url);

    // Accept only same-origin, root-relative paths to prevent open redirects.
    if (
      requestedRedirect &&
      requestedRedirect.startsWith('/') &&
      !requestedRedirect.startsWith('//')
    ) {
      try {
        const parsedRedirect = new URL(requestedRedirect, request.url);

        if (
          parsedRedirect.origin === request.nextUrl.origin &&
          parsedRedirect.pathname !== '/login'
        ) {
          destination = parsedRedirect;
        }
      } catch {
        // Fall back to the dashboard when the redirect is malformed.
      }
    }

    return NextResponse.redirect(destination);
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/db-test/:path*',
    '/bodhifarm/:path*',
    '/bodhimart/seller/dashboard/:path*',
    '/bodhimart/seller/products/:path*',
    '/bodhimart/seller/inventory/:path*',
    '/bodhimart/seller/orders/:path*',
    '/bodhimart/admin/sellers/:path*',
    '/login',
  ],
};
