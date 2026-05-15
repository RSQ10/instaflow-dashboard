import { useState } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Link2,
  UserCheck, Bot, MessageSquare, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type NodeData = {
  id: string;
  parent_node_id: string | null;
  trigger_keyword: string;
  match_type: "exact" | "contains" | "ai" | "fallback" | "any";
  message: string;
  end_action: "none" | "save_lead" | "send_link" | "handoff" | "all";
  end_action_link: string;
  position_order: number;
  children: NodeData[];
};

const MATCH_LABELS: Record<string, string> = {
  exact: "Exact match",
  contains: "Contains word",
  ai: "AI understands",
  fallback: "Fallback (anything else)",
  any: "Any reply",
};

const ACTION_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  none: { label: "No action", icon: MessageSquare, color: "text-muted-foreground" },
  save_lead: { label: "Save as lead", icon: UserCheck, color: "text-primary" },
  send_link: { label: "Send link", icon: Link2, color: "text-blue-400" },
  handoff: { label: "Handoff to human", icon: Zap, color: "text-amber-400" },
  all: { label: "All actions", icon: Zap, color: "text-primary" },
};

function newNode(parentId: string | null, order: number): NodeData {
  return {
    id: crypto.randomUUID(),
    parent_node_id: parentId,
    trigger_keyword: "",
    match_type: "exact",
    message: "",
    end_action: "none",
    end_action_link: "",
    position_order: order,
    children: [],
  };
}

function NodeCard({
  node,
  depth,
  isRoot,
  onChange,
  onDelete,
}: {
  node: NodeData;
  depth: number;
  isRoot?: boolean;
  onChange: (updated: NodeData) => void;
  onDelete?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(isRoot || false);

  const addChild = () => {
    const child = newNode(node.id, node.children.length);
    onChange({ ...node, children: [...node.children, child] });
  };

  const addFallback = () => {
    const hasFallback = node.children.some((c) => c.match_type === "fallback");
    if (hasFallback) return;
    const fallback = { ...newNode(node.id, node.children.length), match_type: "fallback" as const };
    onChange({ ...node, children: [...node.children, fallback] });
  };

  const updateChild = (index: number, updated: NodeData) => {
    const children = [...node.children];
    children[index] = updated;
    onChange({ ...node, children });
  };

  const deleteChild = (index: number) => {
    const children = node.children.filter((_, i) => i !== index);
    onChange({ ...node, children });
  };

  const indentColor = [
    "border-primary/40",
    "border-blue-400/40",
    "border-amber-400/40",
    "border-pink-400/40",
    "border-green-400/40",
  ][depth % 5];

  const ActionIcon = ACTION_LABELS[node.end_action]?.icon ?? MessageSquare;

  return (
    <div className={`relative ml-${depth > 0 ? "6" : "0"}`}>
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
      )}
      <div className={`relative border ${indentColor} bg-card rounded-2xl shadow-soft mb-3 transition-all`}>
        {/* Node header */}
        <div className="flex items-center gap-2 p-3 cursor-pointer" onClick={() => setCollapsed((v) => !v)}>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {!isRoot && (
            <Badge variant="outline" className="text-xs shrink-0">
              {MATCH_LABELS[node.match_type]}
            </Badge>
          )}
          {isRoot && <Badge className="bg-gradient-brand text-white text-xs shrink-0">Entry</Badge>}

          <span className="flex-1 text-sm truncate text-muted-foreground">
            {node.trigger_keyword
              ? `"${node.trigger_keyword}"`
              : node.match_type === "fallback"
              ? "Anything else…"
              : node.match_type === "any"
              ? "Any reply"
              : "Set keyword…"}
          </span>

          <ActionIcon className={`h-3.5 w-3.5 shrink-0 ${ACTION_LABELS[node.end_action]?.color}`} />

          {!isRoot && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Node body */}
        {!collapsed && (
          <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
            {/* Keyword / match type (not shown for root) */}
            {!isRoot && (
              <div className="flex gap-2">
                <Select
                  value={node.match_type}
                  onValueChange={(v) => onChange({ ...node, match_type: v as NodeData["match_type"] })}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exact">Exact match</SelectItem>
                    <SelectItem value="contains">Contains word</SelectItem>
                    <SelectItem value="ai">AI understands</SelectItem>
                    <SelectItem value="any">Any reply</SelectItem>
                    <SelectItem value="fallback">Fallback</SelectItem>
                  </SelectContent>
                </Select>

                {node.match_type !== "fallback" && node.match_type !== "any" && (
                  <Input
                    className="h-8 text-xs flex-1"
                    placeholder={node.match_type === "ai" ? "Describe intent e.g. asking about price" : "Keyword e.g. PRICING"}
                    value={node.trigger_keyword}
                    onChange={(e) => onChange({ ...node, trigger_keyword: e.target.value })}
                  />
                )}
              </div>
            )}

            {/* Bot message */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {isRoot ? "Opening message" : "Bot reply"}
              </label>
              <Textarea
                rows={2}
                placeholder="Type what the bot says here…"
                value={node.message}
                onChange={(e) => onChange({ ...node, message: e.target.value })}
                className="text-sm"
              />
            </div>

            {/* End action */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground shrink-0">End action:</label>
              <Select
                value={node.end_action}
                onValueChange={(v) => onChange({ ...node, end_action: v as NodeData["end_action"] })}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No action</SelectItem>
                  <SelectItem value="save_lead">💾 Save as lead</SelectItem>
                  <SelectItem value="send_link">🔗 Send link</SelectItem>
                  <SelectItem value="handoff">🙋 Handoff to human</SelectItem>
                  <SelectItem value="all">⚡ All actions</SelectItem>
                </SelectContent>
              </Select>

              {(node.end_action === "send_link" || node.end_action === "all") && (
                <Input
                  className="h-8 text-xs flex-1"
                  placeholder="https://your-link.com"
                  value={node.end_action_link}
                  onChange={(e) => onChange({ ...node, end_action_link: e.target.value })}
                />
              )}
            </div>

            {/* Add reply branches */}
            {node.children.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No branches yet — this is a leaf node. Add a branch if the user can reply further.
              </p>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addChild}>
                <Plus className="h-3 w-3" /> Add reply branch
              </Button>
              {!node.children.some((c) => c.match_type === "fallback") && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-amber-400/40 text-amber-400 hover:bg-amber-400/10" onClick={addFallback}>
                  <Bot className="h-3 w-3" /> Add fallback
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Children */}
      {!collapsed && node.children.map((child, i) => (
        <div key={child.id} className="ml-6 relative">
          <div className="absolute -left-3 top-5 w-3 h-px bg-border" />
          <NodeCard
            node={child}
            depth={depth + 1}
            onChange={(updated) => updateChild(i, updated)}
            onDelete={() => deleteChild(i)}
          />
        </div>
      ))}
    </div>
  );
}

export { NodeCard, newNode };
export type { NodeData as FlowNodeData };
