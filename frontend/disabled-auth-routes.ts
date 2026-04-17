/*
  Archived auth proxy routes.

  These files originally lived under:
  - app/api/auth/login/route.ts
  - app/api/auth/logout/route.ts
  - app/api/auth/me/route.ts
  - app/api/auth/refresh/route.ts
  - app/api/auth/register/route.ts

  They were removed from `app/api` because `next export` / `output: "export"`
  cannot ship route handlers. Keeping the implementations here makes it easy to
  restore the auth flow later without losing the original code.

  login/route.ts
  ----------------------------------------
  import { NextRequest, NextResponse } from "next/server"

  const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL

  export async function POST(request: NextRequest) {
    if (!AUTH_API_URL) {
      return NextResponse.json(
        { detail: "AUTH_API_URL not configured" },
        { status: 500 }
      )
    }

    try {
      const body = await request.json()

      const response = await fetch(`${AUTH_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      return NextResponse.json(data, { status: response.status })
    } catch (error) {
      console.error("Login proxy error:", error)
      return NextResponse.json(
        { detail: "Failed to connect to authentication service" },
        { status: 503 }
      )
    }
  }

  logout/route.ts
  ----------------------------------------
  import { NextRequest, NextResponse } from "next/server"

  const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL

  export async function POST(request: NextRequest) {
    if (!AUTH_API_URL) {
      return NextResponse.json(
        { detail: "AUTH_API_URL not configured" },
        { status: 500 }
      )
    }

    try {
      const body = await request.json()

      const response = await fetch(`${AUTH_API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      return NextResponse.json(data, { status: response.status })
    } catch (error) {
      console.error("Logout proxy error:", error)
      return NextResponse.json(
        { detail: "Failed to connect to authentication service" },
        { status: 503 }
      )
    }
  }

  me/route.ts
  ----------------------------------------
  import { NextRequest, NextResponse } from "next/server"

  const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL

  export async function GET(request: NextRequest) {
    if (!AUTH_API_URL) {
      return NextResponse.json(
        { detail: "AUTH_API_URL not configured" },
        { status: 500 }
      )
    }

    try {
      const authHeader = request.headers.get("authorization")

      if (!authHeader) {
        return NextResponse.json(
          { detail: "Authorization header required" },
          { status: 401 }
        )
      }

      const response = await fetch(`${AUTH_API_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Authorization": authHeader,
        },
      })

      const data = await response.json()

      return NextResponse.json(data, { status: response.status })
    } catch (error) {
      console.error("Me proxy error:", error)
      return NextResponse.json(
        { detail: "Failed to connect to authentication service" },
        { status: 503 }
      )
    }
  }

  refresh/route.ts
  ----------------------------------------
  import { NextRequest, NextResponse } from "next/server"

  const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL

  export async function POST(request: NextRequest) {
    if (!AUTH_API_URL) {
      return NextResponse.json(
        { detail: "AUTH_API_URL not configured" },
        { status: 500 }
      )
    }

    try {
      const body = await request.json()

      const response = await fetch(`${AUTH_API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      return NextResponse.json(data, { status: response.status })
    } catch (error) {
      console.error("Refresh proxy error:", error)
      return NextResponse.json(
        { detail: "Failed to connect to authentication service" },
        { status: 503 }
      )
    }
  }

  register/route.ts
  ----------------------------------------
  import { NextRequest, NextResponse } from "next/server"

  const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL

  export async function POST(request: NextRequest) {
    if (!AUTH_API_URL) {
      return NextResponse.json(
        { detail: "AUTH_API_URL not configured" },
        { status: 500 }
      )
    }

    try {
      const body = await request.json()

      const response = await fetch(`${AUTH_API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      return NextResponse.json(data, { status: response.status })
    } catch (error) {
      console.error("Register proxy error:", error)
      return NextResponse.json(
        { detail: "Failed to connect to authentication service" },
        { status: 503 }
      )
    }
  }
*/

export {}
