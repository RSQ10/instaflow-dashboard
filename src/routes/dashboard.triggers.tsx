import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageCircle, Trash2, Pencil, Loader2, Film, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/triggers")({
  component: TriggersPage,
});

type Trigger = {
  id: string;
  name: string;
  post_url: string | null;
  reel_id: string | null;
  reel_thumbnail: string | null;
  trigger_keyword: string;
  match_any_word: boolean;
  reply_template: string;
  send_dm: boolean;
  require_follow: boolean;
  follow_prompt: string;
  enabled: boolean;
  created_at: string;
};

type Reel = {
  id: string;
  thumbnail_url: string;
  media_url: string;
  permalink: string;
  caption?: string;
};

const emptyForm = {
  name: "",
  post_url: "",
  reel_id: "",
  reel_thumbnail: "",
  trigger_keyword: "",
  match_any_word: false,
  reply_template: "",
  send_dm: true,
  require_follow: false,
  follow_prompt: "Follow us first to get the details! 💛 Then reply here again.",
};

function TriggersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Trigger | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: settings } = useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_settings")
        .select("instagram_user_id, instagram_access_token, instagram_handle, instagram_connected")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: triggers = [], isLoading } = useQuery({
    queryKey: ["triggers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comment_triggers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Trigger[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        post_url: editing.post_url ?? "",
        reel_id: editing.reel_id ?? "",
        reel_thumbnail: editing.reel_thumbnail ?? "",
        trigger_keyword: editing.trigger_keyword,
        match_any_word: editing.match_any_word,
        reply_template: editing.reply_template,
        send_dm: editing.send_dm,
        require_follow: editing.require_follow ?? false,
        follow_prompt: editing.follow_prompt ?? "Follow us first! 💛 Then reply here again.",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing, open]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!form.name.trim() || !form.reply_template.trim())
        throw new Error("Name and reply template are required");
      const payload = {
        name: form.name,
        post_url: form.post_url || null,
        reel_id: form.reel_id || null,
        reel_thumbnail: form.reel_thumbnail || null,
        trigger_keyword: form.trigger_keyword,
        match_any_word: form.match_any_word,
        reply_template: form.reply_template,
        send_dm: form.send_dm,
        require_follow: form.require_follow,
        follow_prompt: form.follow_prompt,
      };
      if (editing) {
        const { error } = await supabase.from("comment_triggers").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("comment_triggers").insert({ ...payload, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Trigger updated" : "Trigger created");
      qc.invalidateQueries({ queryKey: ["triggers"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async (t: Trigger) => {
      const { error } = await supabase.from("comment_triggers").update({ enabled: !t.enabled }).eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["triggers"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comment_triggers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trigger deleted");
      qc.invalidateQueries({ queryKey: ["triggers"] });
    },
  });

  const isConnected = settings?.instagram_connected && settings?.instagram_access_token;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comment Triggers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reply to comments and slide into DMs automatically.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-brand text-white shadow-soft hover:opacity-95">
              <Plus className="mr-1.5 h-4 w-4" /> New trigger
            </Button>
          </DialogTrigger>
          <TriggerDialog
            editing={editing}
            form={form}
            setForm={setForm}
            onSave={() => saveMut.mutate()}
            saving={saveMut.isPending}
            igUserId={settings?.instagram_user_id ?? null}
            igToken={settings?.instagram_access_token ?? null}
            isConnected={!!isConnected}
          />
        </Dialog>
      </div>

      {!isConnected && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          ⚠️ No Instagram account connected.{" "}
          <a href="/dashboard/settings" className="underline font-medium">Go to Settings</a> to connect before creating triggers.
        </div>
      )}

      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : triggers.length === 0 ? (
          <div className="glass rounded-2xl border border-dashed border-border p-16 text-center animate-fade-in-up">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-soft">
              <MessageCircle className="h-7 w-7 text-foreground" strokeWidth={1.75} />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">No triggers yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Set up your first comment trigger to convert reels into leads.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {triggers.map((t) => (
              <div key={t.id} className="lift-on-hover glass rounded-2xl border border-border p-5 shadow-soft animate-fade-in-up">
                <div className="flex items-start gap-4">
                  {t.reel_thumbnail && (
                    <img
                      src={t.reel_thumbnail}
                      alt="Reel"
                      className="h-14 w-14 rounded-lg object-cover shrink-0 border border-border"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{t.name}</h3>
                      {t.match_any_word
                        ? <Badge variant="secondary">Any comment</Badge>
                        : <Badge variant="secondary">"{t.trigger_keyword || "—"}"</Badge>}
                      {t.send_dm && <Badge className="bg-gradient-brand text-white hover:opacity-95">+ DM</Badge>}
                      {t.require_follow && <Badge variant="outline" className="border-primary/40 text-primary">Follow-gated</Badge>}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{t.reply_template}</p>
                    {t.require_follow && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <RefreshCw className="h-3 w-3 text-primary" />
                        Non-followers prompted to follow first, then retry
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={t.enabled} onCheckedChange={() => toggleMut.mutate(t)} />
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TriggerDialog({ editing, form, setForm, onSave, saving, igUserId, igToken, isConnected }: {
  editing: Trigger | null;
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm) => void;
  onSave: () => void;
  saving: boolean;
  igUserId: string | null;
  igToken: string | null;
  isConnected: boolean;
}) {
  const [reels, setReels] = useState<Reel[]>([]);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadReels = async () => {
    if (!igUserId || !igToken) return;
    setReelsLoading(true);
    try {
      const res = await fetch(
        `https://graph.instagram.com/${igUserId}/media` +
        `?fields=id,media_type,thumbnail_url,media_url,permalink,caption` +
        `&access_token=${igToken}`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const videoReels = (data.data ?? []).filter(
        (m: any) => m.media_type === "VIDEO" || m.media_type === "REEL"
      );
      setReels(videoReels);
      setPickerOpen(true);
    } catch (e: any) {
      toast.error("Failed to load reels: " + e.message);
    } finally {
      setReelsLoading(false);
    }
  };

  const selectReel = (reel: Reel) => {
    setForm({
      ...form,
      reel_id: reel.id,
      reel_thumbnail: reel.thumbnail_url ?? reel.media_url,
      post_url: reel.permalink,
      name: form.name || (reel.caption?.slice(0, 40) ?? `Reel ${reel.id.slice(-6)}`),
    });
    setPickerOpen(false);
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editing ? "Edit trigger" : "New comment trigger"}</DialogTitle>
        <DialogDescription>
          When someone comments your keyword, reply publicly and optionally DM them.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">

        {/* Reel picker */}
        <div className="space-y-2">
          <Label>Target reel <span className="text-muted-foreground font-normal text-xs">(optional — leave empty for all posts)</span></Label>

          {form.reel_thumbnail ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
              <img src={form.reel_thumbnail} alt="Reel" className="h-16 w-16 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{form.name || "Selected reel"}</p>
                <p className="text-xs text-muted-foreground truncate">{form.post_url}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, reel_id: "", reel_thumbnail: "", post_url: "" })}>
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {isConnected ? (
                <Button type="button" variant="outline" className="w-full gap-2" onClick={loadReels} disabled={reelsLoading}>
                  {reelsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
                  {reelsLoading ? "Loading reels…" : "Pick a reel from your account"}
                </Button>
              ) : (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                  Connect Instagram in Settings to pick a reel. You can also paste a URL below.
                </div>
              )}

              {pickerOpen && reels.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground mb-2">Select a reel:</p>
                  <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                    {reels.map((reel) => (
                      <button key={reel.id} onClick={() => selectReel(reel)}
                        className="relative group rounded-lg overflow-hidden border border-border hover:border-primary/60 transition-all aspect-square">
                        <img src={reel.thumbnail_url ?? reel.media_url} alt="Reel" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-medium">Select</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {reels.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No reels found on this account.</p>
                  )}
                </div>
              )}

              <Input
                value={form.post_url}
                onChange={(e) => setForm({ ...form, post_url: e.target.value })}
                placeholder="Or paste reel URL manually (optional)"
                className="text-sm"
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Trigger name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='e.g. "Course launch reel"' />
        </div>

        <div className="space-y-1.5">
          <Label>Trigger keyword</Label>
          <Input
            value={form.trigger_keyword}
            onChange={(e) => setForm({ ...form, trigger_keyword: e.target.value })}
            placeholder='e.g. "INFO"'
            disabled={form.match_any_word}
          />
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
            <div className="text-sm font-medium">Match any comment</div>
            <Switch checked={form.match_any_word} onCheckedChange={(v) => setForm({ ...form, match_any_word: v })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Public reply</Label>
          <Textarea rows={2} value={form.reply_template} onChange={(e) => setForm({ ...form, reply_template: e.target.value })} placeholder="Sent you a DM 💌" />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-accent/40 p-3">
          <div>
            <div className="text-sm font-medium">Also send DM</div>
            <div className="text-xs text-muted-foreground">Slide into their DMs with the linked flow</div>
          </div>
          <Switch checked={form.send_dm} onCheckedChange={(v) => setForm({ ...form, send_dm: v })} />
        </div>

        {/* Follow gate */}
        <div className="rounded-lg border border-border bg-accent/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Require follow first</div>
              <div className="text-xs text-muted-foreground">Non-followers get a prompt + retry. Followers get the reply immediately.</div>
            </div>
            <Switch checked={form.require_follow} onCheckedChange={(v) => setForm({ ...form, require_follow: v })} />
          </div>
          {form.require_follow && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs text-muted-foreground">Message shown to non-followers</Label>
              <Textarea rows={2} value={form.follow_prompt} onChange={(e) => setForm({ ...form, follow_prompt: e.target.value })} />
              <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2">
                <RefreshCw className="h-3.5 w-3.5 text-primary shrink-0" />
                <p className="text-xs text-primary">An <strong>"I followed, try again"</strong> button is added automatically after your message.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onSave} disabled={saving} className="bg-gradient-brand text-white hover:opacity-95">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editing ? "Save changes" : "Create trigger"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
