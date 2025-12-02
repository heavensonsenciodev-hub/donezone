import { type User } from "@supabase/supabase-js";
import { createClient } from "../../../utils/supabase/client";
import { useState } from "react";

export default function ConfirmAccount({ user }: { user: User | null }) {
  const supabase = createClient();
  const [fullname, setFullname] = useState<string | null>(null);

  // If you don't want to show anything yet
  return null;

  // Or return actual JSX
  // return (
  //   <div>
  //     <p>Welcome, {user?.email}</p>
  //   </div>
  // );
}
