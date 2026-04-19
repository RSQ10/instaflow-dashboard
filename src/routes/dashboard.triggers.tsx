import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageCircle, Trash2, Pencil, Loader2 } from "lucide-react";
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
  trigger_keyword: string;
  match_any_word: boolean;
  reply_template: string;
  send_dm: boolean;
  enabled: boolean;
  created_at: string;
};

const emptyForm = {
  name: "",
  post_url: "",
  trigger_keyword: "",
  match_any_word: false,
  reply_template: "",
  send_dm: true,
};

function TriggersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Trigger | null>(null);
  const [form, setForm] = useState(emptyForm);

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
        trigger_keyword: editing.trigger_keyword,
        match_any_word: editing.match_any_word,
        reply_template: editing.reply_template,
        send_dm: editing.send_dm,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing, open]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!form.name.trim() || !form.reply_template.trim()) {
        throw new Error("Name and reply template are required");
      }
      const payload = { ...form, post_url: form.post_url || null };
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit trigger" : "New comment trigger"}</DialogTitle>
              <DialogDescription>
                When someone comments your keyword, we reply publicly and (optionally) DM them.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Trigger name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='e.g. "Reel #42 — Course"' />
              </div>
              <div className="space-y-1.5">
                <Label>Post URL (optional)</Label>
                <Input value={form.post_url} onChange={(e) => setForm({ ...form, post_url: e.target.value })} placeholder="https://instagram.com/p/..." />
                <p className="text-xs text-muted-foreground">Leave empty to apply to all posts.</p>
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
                  <Switch
                    checked={form.match_any_word}
                    onCheckedChange={(v) => setForm({ ...form, match_any_word: v })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Public reply</Label>
                <Textarea
                  rows={3}
                  value={form.reply_template}
                  onChange={(e) => setForm({ ...form, reply_template: e.target.value })}
                  placeholder="Sent you a DM 💌"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-accent/40 p-3">
                <div>
                  <div className="text-sm font-medium">Also send DM</div>
                  <div className="text-xs text-muted-foreground">Slide into their DMs with the linked flow</div>
                </div>
                <Switch checked={form.send_dm} onCheckedChange={(v) => setForm({ ...form, send_dm: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="bg-gradient-brand text-white hover:opacity-95">
                {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create trigger"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
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
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{t.name}</h3>
                      {t.match_any_word ? <Badge variant="secondary">Any comment</Badge> : <Badge variant="secondary">"{t.trigger_keyword || "—"}"</Badge>}
                      {t.send_dm && <Badge className="bg-gradient-brand text-white hover:opacity-95">+ DM</Badge>}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{t.reply_template}</p>
                  </div>
                  <div className="flex items-center gap-2">
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
