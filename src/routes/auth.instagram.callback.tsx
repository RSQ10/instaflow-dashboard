import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/instagram/callback")({
  component: InstagramCallbackPage,
});

function InstagramCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connecting your Instagram account...");

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state"); // this is the user_id
      const error = params.get("error");

      if (error) {
        setStatus("error");
        setMessage("Instagram authorization was cancelled or failed.");
        setTimeout(() => navigate({ to: "/dashboard/settings" }), 3000);
        return;
      }

      if (!code || !state) {
        setStatus("error");
        setMessage("Missing authorization code. Please try again.");
        setTimeout(() => navigate({ to: "/dashboard/settings" }), 3000);
        return;
      }

      try {
        // Call our instagram-oauth Edge Function
        const { data, error: fnError } = await supabase.functions.invoke("instagram-oauth", {
          body: { code, user_id: state },
        });

        if (fnError || !data?.success) {
          throw new Error(fnError?.message || data?.error || "Failed to connect Instagram");
        }

        setStatus("success");
        setMessage(`Successfully connected @${data.instagram_handle}!`);

        // Redirect to settings with success param
        setTimeout(() => {
          navigate({
            to: "/dashboard/settings",
            search: {
              instagram_connected: "true",
              handle: data.instagram_handle,
            } as any,
          });
        }, 2000);
      } catch (e: any) {
        console.error("Instagram OAuth error:", e);
        setStatus("error");
        setMessage(e.message || "Something went wrong. Please try again.");
        setTimeout(() => navigate({ to: "/dashboard/settings" }), 3000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-semibold">{message}</h2>
            <p className="text-sm text-muted-foreground">Please wait...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-green-600">{message}</h2>
            <p className="text-sm text-muted-foreground">Redirecting to settings...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-red-600">Connection Failed</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
            <p className="text-xs text-muted-foreground">Redirecting back to settings...</p>
          </>
        )}
      </div>
    </div>
  );
}
