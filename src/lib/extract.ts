import type { DocumentAnalysis, DocumentType, Language, Urgency } from "@/lib/types";

export const EMPTY_CASE: DocumentAnalysis = {
  id: "empty",
  fileName: "",
  documentType: "other",
  issuer: "",
  referenceNumber: "",
  deadlineDate: null,
  amountDue: null,
  urgency: "low",
  scamRiskScore: "safe",
  riskReason: "",
  summary: { en: "", hi: "", mr: "" },
  requiredActionItems: [],
  requiredDocuments: [],
  officialDepartmentKey: "",
  sourceText: "",
};

export function hasAnalyzedNotice(doc: DocumentAnalysis): boolean {
  return doc.id !== "empty" && doc.sourceText.trim().length > 0;
}

type IssuerMatch = {
  documentType: DocumentType;
  issuer: string;
  departmentKey: string;
  service: string;
  state: string;
};

const ISSUER_RULES: Array<{ test: RegExp; match: IssuerMatch }> = [
  {
    test: /\b(msedcl|mahadiscom|mahavitaran|electricity|वीज|बिजली)\b/i,
    match: {
      documentType: "electricity_bill",
      issuer: "Maharashtra State Electricity Distribution Co. (MSEDCL)",
      departmentKey: "msedcl_power",
      service: "bill_payment",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(property\s*tax|मालमत्ता कर|pmc|pune municipal)\b/i,
    match: {
      documentType: "property_tax",
      issuer: "Pune Municipal Corporation",
      departmentKey: "pune_municipal",
      service: "property_tax",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(pcmc|pimpri\s*chinchwad)\b/i,
    match: {
      documentType: "property_tax",
      issuer: "Pimpri Chinchwad Municipal Corporation",
      departmentKey: "pcmc",
      service: "property_tax",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(traffic|challan|echallan|परिवहन|ट्रॅफिक)\b/i,
    match: {
      documentType: "traffic_challan",
      issuer: "Maharashtra Traffic Police",
      departmentKey: "mahatraffic",
      service: "traffic_challan",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(grievance|तक्रार|cpgrams|aaple\s*sarkar)\b/i,
    match: {
      documentType: "grievance_notice",
      issuer: "Aaple Sarkar grievance redressal",
      departmentKey: "maha_grievances",
      service: "grievance",
      state: "Maharashtra",
    },
  },
];

const MONTHS: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

function parseDeadline(text: string): string | null {
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = text.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2})\b/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }

  const named = text.match(
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?[,\s]+(20\d{2})\b/i,
  );
  if (named) {
    const month = MONTHS[named[2].toLowerCase()];
    if (month) return `${named[3]}-${month}-${named[1].padStart(2, "0")}`;
  }

  return null;
}

function parseAmount(text: string): number | null {
  const rupee = text.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i)?.[1];
  if (rupee) return Number(rupee.replaceAll(",", ""));
  const due = text.match(/(?:amount\s*(?:due|payable)|कुल\s*राशि|रक्कम)\s*[:\-]?\s*([\d,]+)/i)?.[1];
  if (due) return Number(due.replaceAll(",", ""));
  return null;
}

function parseReference(text: string): string {
  const patterns = [
    /(?:consumer\s*(?:no|number)|ग्राहक\s*क्रमांक|खाते\s*क्रमांक)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,})/i,
    /(?:reference|ref(?:erence)?\s*(?:no|number)|चॅलन\s*क्रमांक|challan\s*(?:no|number))\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,})/i,
    /(?:bill\s*(?:no|number)|बिल\s*क्रमांक)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern)?.[1];
    if (match) return match.toUpperCase();
  }
  return "Not found";
}

function detectIssuer(text: string): IssuerMatch {
  for (const rule of ISSUER_RULES) {
    if (rule.test.test(text)) return rule.match;
  }
  return {
    documentType: "other",
    issuer: "Unrecognized issuer",
    departmentKey: "",
    service: "government_information",
    state: "Maharashtra",
  };
}

function urgencyFromDeadline(deadlineDate: string | null): Urgency {
  if (!deadlineDate) return "medium";
  const due = Date.parse(`${deadlineDate}T23:59:59`);
  if (Number.isNaN(due)) return "medium";
  const days = (due - Date.now()) / (1000 * 60 * 60 * 24);
  if (days < 0) return "critical";
  if (days <= 3) return "high";
  if (days <= 14) return "medium";
  return "low";
}

function buildSummaries(input: {
  issuer: string;
  amountDue: number | null;
  deadlineDate: string | null;
  referenceNumber: string;
}): Record<Language, string> {
  const amount =
    input.amountDue == null ? "an unspecified amount" : `₹${input.amountDue.toLocaleString("en-IN")}`;
  const deadline = input.deadlineDate ?? "a date not clearly stated";
  const reference =
    input.referenceNumber === "Not found" ? "no clear reference number" : `reference ${input.referenceNumber}`;

  return {
    en: `This notice appears to be from ${input.issuer}. It mentions ${amount}, deadline ${deadline}, and ${reference}. Verify details against your own records, then open only a reviewed official channel yourself.`,
    hi: `यह सूचना संभवतः ${input.issuer} से संबंधित है। इसमें ${amount}, अंतिम तिथि ${deadline}, और ${reference} का उल्लेख है। अपनी पुरानी रिकॉर्ड से जाँच करें और केवल सत्यापित आधिकारिक चैनल स्वयं खोलें।`,
    mr: `ही सूचना संभाव्यतः ${input.issuer} ची आहे. त्यात ${amount}, अंतिम तारीख ${deadline}, आणि ${reference} नमूद आहे. स्वतःच्या जुन्या नोंदींशी तपासा आणि फक्त सत्यापित अधिकृत मार्ग स्वतः उघडा.`,
  };
}

export function analyzeText(sourceText: string, language: Language = "en"): DocumentAnalysis {
  void language;
  const text = sourceText.trim();
  if (!text) {
    return { ...EMPTY_CASE };
  }

  const issuer = detectIssuer(text);
  const amountDue = parseAmount(text);
  const deadlineDate = parseDeadline(text);
  const referenceNumber = parseReference(text);
  const scamRiskScore = /\b(otp|upi\s*pin|password|send\s*money|gift\s*card|whatsapp\s*pay)\b/i.test(text)
    ? "suspicious"
    : "safe";

  return {
    id: `case-${Date.now()}`,
    fileName: "pasted-notice.txt",
    documentType: issuer.documentType,
    issuer: issuer.issuer,
    referenceNumber,
    deadlineDate,
    amountDue,
    urgency: urgencyFromDeadline(deadlineDate),
    scamRiskScore,
    riskReason:
      scamRiskScore === "suspicious"
        ? "Possible pressure or credential/payment cues were found. Do not share OTP, PIN, or passwords. Confirm through a printed source or official helpline."
        : "Heuristic review only. Confirm the issuer and destination using a printed bill or official helpline before you act.",
    summary: buildSummaries({
      issuer: issuer.issuer,
      amountDue,
      deadlineDate,
      referenceNumber,
    }),
    requiredActionItems: [
      "Compare the reference number and amount with your own records.",
      "Confirm the deadline before choosing any payment or response.",
      "Open only a reviewed official portal yourself; this app never pays or submits.",
      "Keep a copy of any official receipt or acknowledgement.",
    ],
    requiredDocuments: ["A previous bill or notice for comparison", "A copy of this notice"],
    officialDepartmentKey: issuer.departmentKey,
    sourceText: text,
  };
}

export function portalHintsForCase(doc: DocumentAnalysis): {
  department: string;
  service: string;
  state: string;
} {
  const match = ISSUER_RULES.find((rule) => rule.match.departmentKey === doc.officialDepartmentKey)?.match;
  if (match) {
    return {
      department: match.departmentKey.includes("msedcl") ? "MSEDCL" : match.issuer,
      service: match.service,
      state: match.state,
    };
  }
  return { department: doc.issuer || "Maharashtra", service: "government_information", state: "Maharashtra" };
}
