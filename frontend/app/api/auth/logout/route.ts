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
