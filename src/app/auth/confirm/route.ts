import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";

/** Reuse the same minimal helper types as signupaction */
type AuthUserLike = {
  id?: string | null;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type AuthResponseLike = {
  data?: { user?: AuthUserLike } | null;
  user?: AuthUserLike | null;
  error?: { message?: string } | null;
};

function extractUserFromAuthResponse(res: unknown): AuthUserLike | null {
  if (!res || typeof res !== "object") return null;
  const r = res as AuthResponseLike;
  return r.data?.user ?? r.user ?? null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = (searchParams.get("type") as EmailOtpType | null) ?? null;
  const next = "/account";

  // Create redirect link without the secret token
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");

  if (token_hash && type) {
    const supabase = await createClient();

    const verifyResult = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if ((verifyResult as AuthResponseLike).error) {
      // verification failed -> show an error page
      redirectTo.pathname = "/error";
      return NextResponse.redirect(redirectTo);
    }

    const user = extractUserFromAuthResponse(verifyResult);
    const userId = user?.id ?? null;
    const userEmail = user?.email ?? null;
    const fullnameFromMeta =
      (user?.user_metadata?.["fullname"] as string | undefined) ??
      (user?.user_metadata?.["full_name"] as string | undefined) ??
      "";

    if (userId) {
      // upsert (insert or update) profile row by id
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          [
            {
              id: userId,
              email: userEmail,
              full_name: fullnameFromMeta ?? "",
              created_at: new Date().toISOString(),
            },
          ],
          { onConflict: "id" }
        );

      if (upsertError) {
        console.error("Failed inserting/upserting profile on confirm:", upsertError);
        // optionally handle or surface error; we still redirect to profile for UX
      }
    } else {
      // No user id available here (email-confirmation flow). DB trigger is recommended.
      console.log("Confirmed but no user id available on verifyOtp result.");
    }

    // successful verification -> redirect to profile or login
    redirectTo.searchParams.delete("next");
    return NextResponse.redirect(redirectTo);
  }

  // Verification parameters missing or invalid
  redirectTo.pathname = "/error";
  return NextResponse.redirect(redirectTo);
}