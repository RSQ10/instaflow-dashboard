import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code, user_id } = await req.json();

    if (!code || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing code or user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const META_APP_ID = Deno.env.get("META_APP_ID")!;
    const META_APP_SECRET = Deno.env.get("META_APP_SECRET")!;
    const REDIRECT_URI = "https://instaflow-dashboard.vercel.app/auth/instagram/callback";

    // Step 1: Exchange code for short-lived token
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error_type || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return new Response(
        JSON.stringify({ success: false, error: tokenData.error_message || "Token exchange failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shortToken = tokenData.access_token;
    const instagram_user_id = String(tokenData.user_id);

    // Step 2: Exchange for long-lived token (60 days)
    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${META_APP_SECRET}&access_token=${shortToken}`
    );
    const longTokenData = await longTokenRes.json();
    const access_token = longTokenData.access_token || shortToken;

    // Step 3: Get Instagram username
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=username&access_token=${access_token}`
    );
    const profile = await profileRes.json();
    const instagram_handle = profile.username;

    if (!instagram_handle) {
      return new Response(
        JSON.stringify({ success: false, error: "Could not fetch Instagram username" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Save to Supabase (service role to bypass RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: dbError } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id,
          instagram_handle,
          instagram_user_id,
          instagram_access_token: access_token,
          instagram_connected: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (dbError) {
      console.error("DB error:", dbError);
      return new Response(
        JSON.stringify({ success: false, error: dbError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, instagram_handle }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Unhandled error:", e);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
