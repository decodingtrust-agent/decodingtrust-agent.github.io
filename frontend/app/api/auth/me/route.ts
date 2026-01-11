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
