import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
]

export async function middleware(req: NextRequest) {
    const token    = req.cookies.get('access_token')?.value
    const pathname = req.nextUrl.pathname
    let user       = null

    if (token) {
        try {
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        get(name) {
                            return req.cookies.get(name)?.value
                        }
                    }
                }
            )
            const { data, error } = await supabase.auth.getUser(token)
            if (!error && data.user) {
                user = data.user
            }
        } catch {
            user = null
        }
    }

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

    if (user === null && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    if (user !== null && isPublicRoute) {
        return NextResponse.redirect(new URL('/profile/companies', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next|api|favicon.ico).*)'],
}