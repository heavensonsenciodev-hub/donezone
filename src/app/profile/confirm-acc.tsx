import { type User } from "@supabase/supabase-js";
import { createClient } from "../../../utils/supabase/client";
import { useState } from "react";

export default function  ConfirmAccount( { user }: { user: User | null}) {
    const supabase = createClient()
    const [fullname, setFullname] = useState<string | null>(null)
}