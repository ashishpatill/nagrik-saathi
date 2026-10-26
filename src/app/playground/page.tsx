import type { Metadata } from "next";
import ToolPlayground from "@/components/ToolPlayground";

export const metadata: Metadata = {
  title: "Tool playground | Nagrik Saathi",
  description:
    "Run Nagrik Saathi's WebMCP and MCP tools locally: notice summaries, portal verification, PII redaction, localized briefs, and print-ready checklists.",
};

export default function PlaygroundPage() {
  return <ToolPlayground />;
}
