import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users, Plus, Search, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/leads")({
  component: LeadsPage,
});

type Lead = {
  id: string;
  name: string | null;
  instagram_handle: string;
  source: string | null;
  followed: boolean;
  created_at: string;
};

function LeadsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", instagram_handle: "", source: "manual" });

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!user,
  });

  const addMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!form.instagram_handle.trim()) throw new Error("Instagram handle is required");
      const handle = form.instagram_handle.trim().replace(/^@/, "");
      const { error } = await supabase.from("leads").insert({
        user_id: user.id,
        name: form.name.trim() || null,
        instagram_handle: handle,
        source: form.source,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead added");
      qc.invalidateQueries({ queryKey: ["leads"] });
      setOpen(false);
      setForm({ name: "", instagram_handle: "", source: "manual" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = leads.filter((l) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      l.instagram_handle.toLowerCase().includes(s) ||
      (l.name?.toLowerCase().includes(s) ?? false)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every contact captured by your flows and triggers.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-brand text-white shadow-soft hover:opacity-95">
              <Plus className="mr-1.5 h-4 w-4" /> Add lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add lead manually</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
              </div>
              <div className="space-y-1.5">
                <Label>Instagram handle</Label>
                <Input value={form.instagram_handle} onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })} placeholder="@janedoe" />
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="manual" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => addMut.mutate()} disabled={addMut.isPending} className="bg-gradient-brand text-white hover:opacity-95">
                {addMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total leads" value={leads.length} />
        <StatCard label="Followers" value={leads.filter((l) => l.followed).length} />
        <StatCard
          label="This week"
          value={leads.filter((l) => Date.now() - new Date(l.created_at).getTime() < 7 * 86400000).length}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or handle"
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-soft">
              <Users className="h-7 w-7 text-foreground" strokeWidth={1.75} />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">No leads yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Leads from your flows and triggers will appear here.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Follower</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name ?? "—"}</TableCell>
                  <TableCell className="text-primary">@{l.instagram_handle}</TableCell>
                  <TableCell>
                    {l.source ? <Badge variant="secondary">{l.source}</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {l.followed ? (
                      <span className="inline-flex items-center gap-1 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" /> Yes</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Circle className="h-4 w-4" /> No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
