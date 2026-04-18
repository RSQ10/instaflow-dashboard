import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageSquareHeart, Trash2, Pencil, Loader2, Sparkles } from "lucide-react";
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

export const Route = createFileRoute("/dashboard/flows")({
  component: FlowsPage,
});

type Flow = {
  id: string;
  name: string;
  trigger_keyword: string;
  match_any_word: boolean;
  require_follow: boolean;
  follow_prompt: string;
  ai_reply_template: string;
  enabled: boolean;
  created_at: string;
};

const emptyForm = {
  name: "",
  trigger_keyword: "",
  match_any_word: false,
  require_follow: true,
  follow_prompt: "Hey! Make sure you follow me first to get the link 💛 Reply 'DONE' once you've followed!",
  ai_reply_template: "",
};

function FlowsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Flow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: flows = [], isLoading } = useQuery({
    queryKey: ["flows", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dm_flows")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Flow[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        trigger_keyword: editing.trigger_keyword,
        match_any_word: editing.match_any_word,
        require_follow: editing.require_follow,
        follow_prompt: editing.follow_prompt,
        ai_reply_template: editing.ai_reply_template,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing, open]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!form.name.trim() || !form.ai_reply_template.trim()) {
        throw new Error("Name and AI reply are required");
      }
      if (editing) {
        const { error } = await supabase.from("dm_flows").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("dm_flows").insert({ ...form, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Flow updated" : "Flow created");
      qc.invalidateQueries({ queryKey: ["flows"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async (f: Flow) => {
      const { error } = await supabase.from("dm_flows").update({ enabled: !f.enabled }).eq("id", f.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flows"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dm_flows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Flow deleted");
      qc.invalidateQueries({ queryKey: ["flows"] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DM Flows</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trigger AI replies when someone DMs a keyword.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-brand text-white shadow-soft hover:opacity-95">
              <Plus className="mr-1.5 h-4 w-4" /> New flow
            </Button>
          </DialogTrigger>
          <FlowDialog
            editing={editing}
            form={form}
            setForm={setForm}
            onSave={() => saveMut.mutate()}
            saving={saveMut.isPending}
          />
        </Dialog>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : flows.length === 0 ? (
          <EmptyState onCreate={() => setOpen(true)} />
        ) : (
          <div className="space-y-3">
            {flows.map((flow) => (
              <div
                key={flow.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{flow.name}</h3>
                      {flow.match_any_word ? (
                        <Badge variant="secondary">Any word</Badge>
                      ) : (
                        <Badge variant="secondary">
                          "{flow.trigger_keyword || "—"}"
                        </Badge>
                      )}
                      {flow.require_follow && (
                        <Badge className="bg-gradient-brand text-white hover:opacity-95">
                          Follow-gated
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {flow.ai_reply_template}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={flow.enabled}
                      onCheckedChange={() => toggleMut.mutate(flow)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(flow);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMut.mutate(flow.id)}
                    >
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-soft">
        <MessageSquareHeart className="h-7 w-7 text-foreground" strokeWidth={1.75} />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">No flows yet</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Create your first DM flow to start auto-replying to followers.
      </p>
      <Button onClick={onCreate} className="mt-5 bg-gradient-brand text-white hover:opacity-95">
        <Plus className="mr-1.5 h-4 w-4" /> Create flow
      </Button>
    </div>
  );
}

function FlowDialog({
  editing,
  form,
  setForm,
  onSave,
  saving,
}: {
  editing: Flow | null;
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {editing ? "Edit flow" : "New DM flow"}
        </DialogTitle>
        <DialogDescription>
          When a DM matches your trigger, we'll check if they follow you first, then send an AI reply.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Flow name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Free guide DM"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="kw">Trigger keyword</Label>
          <Input
            id="kw"
            value={form.trigger_keyword}
            onChange={(e) => setForm({ ...form, trigger_keyword: e.target.value })}
            placeholder='e.g. "GUIDE"'
            disabled={form.match_any_word}
          />
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
            <div>
              <div className="text-sm font-medium">Match any word</div>
              <div className="text-xs text-muted-foreground">Reply to every DM, no keyword needed</div>
            </div>
            <Switch
              checked={form.match_any_word}
              onCheckedChange={(v) => setForm({ ...form, match_any_word: v })}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-accent/40 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Require follow first</div>
              <div className="text-xs text-muted-foreground">Ask non-followers to follow before replying</div>
            </div>
            <Switch
              checked={form.require_follow}
              onCheckedChange={(v) => setForm({ ...form, require_follow: v })}
            />
          </div>
          {form.require_follow && (
            <Textarea
              className="mt-3"
              rows={2}
              value={form.follow_prompt}
              onChange={(e) => setForm({ ...form, follow_prompt: e.target.value })}
              placeholder="Message sent to non-followers"
            />
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ai">AI reply template</Label>
          <Textarea
            id="ai"
            rows={4}
            value={form.ai_reply_template}
            onChange={(e) => setForm({ ...form, ai_reply_template: e.target.value })}
            placeholder="Hey {{name}}! Here's your guide: {link}. Let me know what you think!"
          />
          <p className="text-xs text-muted-foreground">
            Use {"{{name}}"} for personalization. AI will adapt the tone per message.
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onSave} disabled={saving} className="bg-gradient-brand text-white hover:opacity-95">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editing ? "Save changes" : "Create flow"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
