import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NodeCard, newNode } from "./FlowNode";
import type { FlowNodeData } from "./FlowNode";
import { Bot, RefreshCw } from "lucide-react";

export type FlowConfig = {
  name: string;
  trigger_keyword: string;
  match_any_word: boolean;
  require_follow: boolean;
  follow_prompt: string;
  use_ai_fallback: boolean;
  fallback_message: string;
  flow_type: "dm" | "comment";
  platform: "instagram" | "threads" | "both";
  rootNode: FlowNodeData;
};

export function createEmptyFlow(flow_type: "dm" | "comment" = "dm"): FlowConfig {
  return {
    name: "",
    trigger_keyword: "",
    match_any_word: false,
    require_follow: false,
    follow_prompt: "Follow us first! 💛 Then reply here again.",
    use_ai_fallback: false,
    fallback_message: "Sorry, I didn't understand that. Can you rephrase?",
    flow_type,
    platform: "instagram",
    rootNode: newNode(null, 0),
  };
}

export function FlowBuilder({
  value,
  onChange,
}: {
  value: FlowConfig;
  onChange: (v: FlowConfig) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Basic settings */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Flow name</Label>
          <Input
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="e.g. Pricing conversation"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Entry keyword</Label>
          <Input
            value={value.trigger_keyword}
            onChange={(e) => onChange({ ...value, trigger_keyword: e.target.value })}
            placeholder='e.g. "GUIDE"'
            disabled={value.match_any_word}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Platform</Label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={value.platform}
            onChange={(e) => onChange({ ...value, platform: e.target.value as FlowConfig["platform"] })}>
            <option value="instagram">Instagram</option>
            <option value="threads">Threads</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
          <div>
            <div className="text-sm font-medium">Match any word</div>
            <div className="text-xs text-muted-foreground">Trigger on any DM, no keyword needed</div>
          </div>
          <Switch
            checked={value.match_any_word}
            onCheckedChange={(v) => onChange({ ...value, match_any_word: v })}
          />
        </div>

        <div className="rounded-lg border border-border bg-accent/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Require follow first</div>
              <div className="text-xs text-muted-foreground">Non-followers get a prompt + retry button</div>
            </div>
            <Switch
              checked={value.require_follow}
              onCheckedChange={(v) => onChange({ ...value, require_follow: v })}
            />
          </div>
          {value.require_follow && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Textarea
                rows={2}
                value={value.follow_prompt}
                onChange={(e) => onChange({ ...value, follow_prompt: e.target.value })}
                placeholder="Follow us first! 💛 Then tap 'I followed, try again'."
              />
              <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2">
                <RefreshCw className="h-3.5 w-3.5 text-primary shrink-0" />
                <p className="text-xs text-primary">
                  "I followed, try again" button added automatically
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium flex items-center gap-1.5">
                <Bot className="h-4 w-4 text-primary" /> AI fallback
              </div>
              <div className="text-xs text-muted-foreground">
                When no branch matches, AI picks the closest or sends default message
              </div>
            </div>
            <Switch
              checked={value.use_ai_fallback}
              onCheckedChange={(v) => onChange({ ...value, use_ai_fallback: v })}
            />
          </div>
          {!value.use_ai_fallback && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <Label className="text-xs text-muted-foreground">Default fallback message</Label>
              <Textarea
                rows={2}
                value={value.fallback_message}
                onChange={(e) => onChange({ ...value, fallback_message: e.target.value })}
                placeholder="Sorry, I didn't understand that. Can you rephrase?"
              />
            </div>
          )}
        </div>
      </div>

      {/* Visual tree */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Label>Conversation tree</Label>
          <Badge variant="outline" className="text-xs">
            {countNodes(value.rootNode)} nodes
          </Badge>
        </div>
        <div className="rounded-2xl border border-border bg-background/50 p-4 overflow-x-auto">
          <NodeCard
            node={value.rootNode}
            depth={0}
            isRoot
            onChange={(updated) => onChange({ ...value, rootNode: updated })}
          />
        </div>
      </div>
    </div>
  );
}

function countNodes(node: FlowNodeData): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
}
