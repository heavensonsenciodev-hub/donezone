import { createClient } from "../../../utils/supabase/server";
import ConfirmAccount from "./confirm-acc";


export default async function Profile() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    return <ConfirmAccount user={user} />
}