import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth Callback Route Handler
 *
 * After a user signs in with Google or Facebook, Supabase redirects them
 * back to /auth/callback?code=<auth-code>. This route handler exchanges
 * the code for a session, then redirects to the home page.
 *
 * This is a server-side Route Handler — the service role key is never used.
 * The Supabase SSR client reads/writes session cookies automatically.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  // If the redirect carries a `next` param, redirect there; otherwise go home.
  const next = searchParams.get('next') ?? '/';

  if (errorParam) {
    console.error('[Auth Callback Error]', errorParam, errorDesc);
    const redirectUrl = new URL(next, origin);
    redirectUrl.searchParams.set('auth_error', errorDesc || errorParam);
    return NextResponse.redirect(redirectUrl.toString());
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[Auth Callback Code Exchange Error]', error.message);
      const redirectUrl = new URL(next, origin);
      redirectUrl.searchParams.set('auth_error', error.message);
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Sync profile status if account was upgraded from guest
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && !user.is_anonymous) {
        const meta = user.user_metadata || {};
        const displayName = meta.full_name || meta.name || meta.display_name;
        const avatarUrl = meta.avatar_url || meta.picture;

        await (supabase.from('profiles') as any)
          .update({
            is_guest: false,
            ...(displayName ? { display_name: displayName } : {}),
            ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }
    } catch (syncErr) {
      console.error('[Auth Callback Profile Sync Error]', syncErr);
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/`);
}
