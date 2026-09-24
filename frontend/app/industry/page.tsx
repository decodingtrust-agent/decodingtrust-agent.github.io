import { redirect } from "next/navigation"

/** /industry is no longer a top-level section — it lives under Community. */
export default function IndustryRedirect() {
  redirect("/community/industry")
}
