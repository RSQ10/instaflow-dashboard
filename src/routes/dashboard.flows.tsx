import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, MessageSquareHeart, Trash2, Pencil, Loader2,
  Sparkles, Lock, ChevronRight, GitBranch,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { FlowBuilder, createEmptyFlow } from "@/components/flow-builder/FlowBuilder";
import type { FlowConfig } from "@/components/flow-builder/FlowBuilder";
import type { FlowNodeData } from "@/components/flow-builder/FlowNode";

export const Route = createFileRoute("/dashboard/flows")({
  component: FlowsPage,
});

type VisualFlow = {
  id: string;
  name: string;
  trigger_keyword: string;
  match_any_word: boolean;
  require_follow: boolean;
  use_ai_fallback: boolean;
  flow_type: string;
  platform: string;
  enabled: boolean;
  created_at: string;
};

// Flatten tree to array for Supabase insert
function flattenNodes(
  node: FlowNodeData,
  flowId: string,
  userId: string,
  parentId: string | null = null
): any[] {
  const row = {
    id: node.id,
    flow_id: flowId,
    user_id: userId,
    parent_node_id: parentId,
    trigger_keyword: node.trigger_keyword,
    match_type: node.match_type,
    message: node.message,
    end_action: node.end_action,
    end_action_link: node.end_action_link || null,
    position_order: node.position_order,
  };
  return [row, ...node.children.flatMap((c) => flattenNodes(c, flowId, userId, node.id))];
}

// Rebuild tree from flat array
function buildTree(nodes: any[], parentId: string | null = null): FlowNodeData[] {
  return nodes
    .filter((n) => n.parent_node_id === parentId)
    .sort((a, b) => a.position_order - b.position_order)
    .map((n) => ({
      ...n,
      end_action_link: n.end_action_link ?? "",
      children: buildTree(nodes, n.id),
    }));
}

function FlowsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [flowConfig, setFlowConfig] = useState<FlowConfig>(createEmptyFlow("dm"));
  const [tab, setTab] = useState<"simple" | "visual">("visual");

  // Get user plan
  const { data: settings } = useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_settings")
        .select("subscription_plan")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isPaid = ["pro", "scale"].includes(settings?.subscription_plan ?? "free");

  const { data: flows = [], isLoading } = useQuery({
    queryKey: ["visual_flows", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visual_flows")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as VisualFlow[];
    },
    enabled: !!user,
  });

  const openNew = () => {
    setEditingId(null);
    setFlowConfig(createEmptyFlow("dm"));
    setOpen(true);
  };

  const openEdit = async (flow: VisualFlow) => {
    // Load nodes for this flow
    const { data: nodes } = await supabase
      .from("flow_nodes")
      .select("*")
      .eq("flow_id", flow.id);

    const tree = buildTree(nodes ?? []);
    const rootNode = tree[0] ?? {
      id: crypto.randomUUID(),
      parent_node_id: null,
      trigger_keyword: "",
      match_type: "any" as const,
      message: "",
      end_action: "none" as const,
      end_action_link: "",
      position_order: 0,
      children: [],
    };

    setFlowConfig({
      name: flow.name,
      trigger_keyword: flow.trigger_keyword,
      match_any_word: flow.match_any_word,
      require_follow: flow.require_follow,
      follow_prompt: "",
      use_ai_fallback: flow.use_ai_fallback,
      fallback_message: "",
      flow_type: flow.flow_type as "dm" | "comment",
      platform: flow.platform as "instagram" | "threads" | "both",
      rootNode,
    });
    setEditingId(flow.id);
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!flowConfig.name.trim()) throw new Error("Flow name is required");
      if (!flowConfig.rootNode.message.trim()) throw new Error("Opening message is required");

      const flowId = editingId ?? crypto.randomUUID();

      // Save/update flow record
      const flowRow = {
        id: flowId,
        user_id: user.id,
        name: flowConfig.name,
        trigger_keyword: flowConfig.trigger_keyword,
        match_any_word: flowConfig.match_any_word,
        require_follow: flowConfig.require_follow,
        follow_prompt: flowConfig.follow_prompt,
        use_ai_fallback: flowConfig.use_ai_fallback,
        fallback_message: flowConfig.fallback_message,
        flow_type: flowConfig.flow_type,
        platform: flowConfig.platform,
      };

      const { error: flowErr } = await supabase
        .from("visual_flows")
        .upsert(flowRow, { onConflict: "id" });
      if (flowErr) throw flowErr;

      // Delete old nodes and reinsert
      await supabase.from("flow_nodes").delete().eq("flow_id", flowId);
      const nodes = flattenNodes(flowConfig.rootNode, flowId, user.id);
      const { error: nodesErr } = await supabase.from("flow_nodes").insert(nodes);
      if (nodesErr) throw nodesErr;
    },
    onSuccess: () => {
      toast.success(editingId ? "Flow updated" : "Flow created");
      qc.invalidateQueries({ queryKey: ["visual_flows"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async (f: VisualFlow) => {
      const { error } = await supabase
        .from("visual_flows")
        .update({ enabled: !f.enabled })
        .eq("id", f.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visual_flows"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("flow_nodes").delete().eq("flow_id", id);
      const { error } = await supabase.from("visual_flows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Flow deleted");
      qc.invalidateQueries({ queryKey: ["visual_flows"] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DM Flows</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build branching conversation flows triggered by DM keywords.
          </p>
        </div>
        {isPaid ? (
          <Button className="bg-gradient-brand text-white shadow-soft hover:opacity-95" onClick={openNew}>
            <Plus className="mr-1.5 h-4 w-4" /> New flow
          </Button>
        ) : (
          <Button variant="outline" className="gap-2 border-primary/40 text-primary" onClick={() => toast.info("Upgrade to Pro to create flows")}>
            <Lock className="h-4 w-4" /> Upgrade to create flows
          </Button>
        )}
      </div>

      {/* Paywall banner */}
      {!isPaid && (
        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand mb-3">
            <GitBranch className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-display text-lg font-semibold">Visual Flow Builder</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            Build multi-step branching DM conversations. Available on Pro (₹399/mo) and Scale (₹999/mo).
          </p>
          <Button className="mt-4 bg-gradient-brand text-white hover:opacity-95" onClick={() => window.location.href = "/dashboard/settings"}>
            Upgrade now <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Flow list */}
      {isPaid && (
        <div className="mt-8">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : flows.length === 0 ? (
            <div className="glass rounded-2xl border border-dashed border-border p-16 text-center animate-fade-in-up">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-soft">
                <MessageSquareHeart className="h-7 w-7 text-foreground" strokeWidth={1.75} />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">No flows yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Create your first branching DM flow.
              </p>
              <Button onClick={openNew} className="mt-5 bg-gradient-brand text-white hover:opacity-95">
                <Plus className="mr-1.5 h-4 w-4" /> Create flow
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {flows.map((flow) => (
                <div key={flow.id} className="lift-on-hover glass rounded-2xl border border-border p-5 shadow-soft animate-fade-in-up">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{flow.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {flow.match_any_word ? "Any word" : `"${flow.trigger_keyword}"`}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">{flow.platform}</Badge>
                        {flow.require_follow && (
                          <Badge className="bg-gradient-brand text-white text-xs">Follow-gated</Badge>
                        )}
                        {flow.use_ai_fallback && (
                          <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                            <Sparkles className="mr-1 h-3 w-3" /> AI fallback
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch checked={flow.enabled} onCheckedChange={() => toggleMut.mutate(flow)} />
                      <Button size="icon" variant="ghost" onClick={() => openEdit(flow)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(flow.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Flow builder dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              {editingId ? "Edit flow" : "New DM flow"}
            </DialogTitle>
          </DialogHeader>
          <FlowBuilder value={flowConfig} onChange={setFlowConfig} />
          <DialogFooter>
            <Button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="bg-gradient-brand text-white hover:opacity-95">
              {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Save changes" : "Create flow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
