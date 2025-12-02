// confirm-acc.tsx
"use client"; // ← Add this at the very top

import { type User } from "@supabase/supabase-js";
import { createClient } from "../../../utils/supabase/client";
import { useState, useEffect } from "react";

export default function ConfirmAccount({ user }: { user: User | null }) {
    const supabase = createClient()
    const [fullname, setFullname] = useState<string | null>(null)

    useEffect(() => {
        if (!user) return
        // fetch fullname or other user data if needed
    }, [user])

    return (
        <div>
            <p>Hello, {fullname ?? user?.email ?? "User"}!</p>
            <p>Please confirm your account (email verification might not work currently).</p>
        </div>
    )
}
