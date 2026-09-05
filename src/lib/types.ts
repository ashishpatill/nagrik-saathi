import type { Language } from "@/lib/languages";

export type { Language } from "@/lib/languages";

export type DocumentType =
  | "electricity_bill"
  | "payment_receipt"
  | "property_tax"
  | "traffic_challan"
  | "grievance_notice"
  | "other";
export type Urgency = "low" | "medium" | "high" | "critical";
export type ScamRisk = "safe" | "suspicious" | "fraud_alert";

export interface DocumentAnalysis {
  id: string;
  fileName: string;
  documentType: DocumentType;
  issuer: string;
  referenceNumber: string;
  deadlineDate: string | null;
  amountDue: number | null;
  urgency: Urgency;
  scamRiskScore: ScamRisk;
  riskReason: string;
  summary: Record<Language, string>;
  requiredActionItems: string[];
  requiredDocuments: string[];
  officialDepartmentKey: string;
  sourceText: string;
}

export interface OfficialPortal {
  key: string;
  departmentName: string;
  state: string;
  verifiedDomain: string;
  allowedHostnames: string[];
  portalUrl: string;
  helpline: string;
  allowedServices: string[];
  lastReviewed: string;
}

export interface ToolLog {
  id: string;
  name: string;
  args: unknown;
  result: unknown;
  timestamp: string;
  status: "success" | "error" | "cancelled";
}
