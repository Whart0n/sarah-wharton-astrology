import { supabase } from "@/lib/supabase";
import { createClient } from "@updatedev/js";

export function createUpdateClient() {
  return createClient(process.env.NEXT_PUBLIC_UPDATE_PUBLISHABLE_KEY!, {
    getSessionToken: async () => {
      // This must be replaced with your own logic to get your session token
      // For example, with Supabase:
      const { data } = await supabase.auth.getSession();
      if (data.session == null) return;
      return data.session.access_token;
    },
    environment: process.env.NODE_ENV === "production" ? "live" : "test",
  });
}
