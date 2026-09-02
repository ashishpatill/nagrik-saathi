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
    test: /\b(msedcl|mahadiscom|mahavitaran|electricity\s+bill|power\s+bill|वीज\s*बिल|बिजली\s*बिल)\b/i,
    match: {
      documentType: "electricity_bill",
      issuer: "Maharashtra State Electricity Distribution Co. (MSEDCL)",
      departmentKey: "msedcl_power",
      service: "bill_payment",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(merc|electricity\s+regulatory)\b/i,
    match: {
      documentType: "other",
      issuer: "Maharashtra Electricity Regulatory Commission",
      departmentKey: "merc",
      service: "electricity_regulation",
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
    test: /\b(property\s*tax|मालमत्ता\s*कर|pmc|pune\s+municipal)\b/i,
    match: {
      documentType: "property_tax",
      issuer: "Pune Municipal Corporation",
      departmentKey: "pune_municipal",
      service: "property_tax",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(mahatraffic|traffic\s*police|e-?challan|echallan|ट्रॅफिक|ट्रैफिक)\b/i,
    match: {
      documentType: "traffic_challan",
      issuer: "Maharashtra Traffic Police",
      departmentKey: "mahatraffic",
      service: "traffic_challan",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(parivahan|driving\s*licen[cs]e|vehicle\s*registr)\b/i,
    match: {
      documentType: "other",
      issuer: "Parivahan Sewa",
      departmentKey: "parivahan",
      service: "vehicle_services",
      state: "India",
    },
  },
  {
    test: /\b(rto|transport\s+department|परिवहन\s*विभाग)\b/i,
    match: {
      documentType: "other",
      issuer: "Maharashtra Transport Department",
      departmentKey: "maha_rto",
      service: "transport_services",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(msrtc|st\s*bus|state\s+transport)\b/i,
    match: {
      documentType: "other",
      issuer: "Maharashtra State Road Transport",
      departmentKey: "mahatranscom",
      service: "bus_services",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(cyber\s*crime|cybercrime|mahacyber|साइबर)\b/i,
    match: {
      documentType: "other",
      issuer: "National Cyber Crime Reporting Portal",
      departmentKey: "cybercrime",
      service: "cyber_complaint",
      state: "India",
    },
  },
  {
    test: /\b(maha\s*police|महाराष्ट्र\s*पोलीस|police\s+station)\b/i,
    match: {
      documentType: "other",
      issuer: "Maharashtra Police",
      departmentKey: "mahapolice",
      service: "police_information",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(cpgrams|pgportal|central(?:ized)?\s+public\s+grievance)\b/i,
    match: {
      documentType: "grievance_notice",
      issuer: "Centralized Public Grievance Redress",
      departmentKey: "cpgrams",
      service: "grievance",
      state: "India",
    },
  },
  {
    test: /\b(grievance|तक्रार|aaple\s*sarkar\s*grievance|grievances\.maharashtra)\b/i,
    match: {
      documentType: "grievance_notice",
      issuer: "Aaple Sarkar grievance redressal",
      departmentKey: "maha_grievances",
      service: "grievance",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(aaple\s*sarkar|mahaonline|right\s+to\s+services)\b/i,
    match: {
      documentType: "other",
      issuer: "Aaple Sarkar citizen services",
      departmentKey: "aaple_sarkar",
      service: "state_services",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(mahadbt|dbt|benefit\s+scheme)\b/i,
    match: {
      documentType: "other",
      issuer: "MahaDBT benefit services",
      departmentKey: "mahadbt",
      service: "benefits",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(digilocker|डिजी\s*लॉकर)\b/i,
    match: {
      documentType: "other",
      issuer: "DigiLocker",
      departmentKey: "digilocker",
      service: "document_services",
      state: "India",
    },
  },
  {
    test: /\b(income\s*tax|incometax|आयकर|e-?filing)\b/i,
    match: {
      documentType: "other",
      issuer: "Income Tax e-Filing",
      departmentKey: "incometax",
      service: "tax_information",
      state: "India",
    },
  },
  {
    test: /\b(consumer\s*helpline|consumer\s*complaint|उपभोक्ता)\b/i,
    match: {
      documentType: "other",
      issuer: "National Consumer Helpline",
      departmentKey: "consumer_helpline",
      service: "consumer_complaint",
      state: "India",
    },
  },
  {
    test: /\b(jeevan\s*pradhikaran|\bmjp\b|water\s+(?:bill|supply)|पाणी\s*बिल)\b/i,
    match: {
      documentType: "other",
      issuer: "Maharashtra Jeevan Pradhikaran",
      departmentKey: "maha_jal",
      service: "water_services",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(agriculture|कृषि|krishi)\b/i,
    match: {
      documentType: "other",
      issuer: "Maharashtra Agriculture Department",
      departmentKey: "maha_agri",
      service: "agriculture_services",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(school\s+education|शिक्षण|education\s+department)\b/i,
    match: {
      documentType: "other",
      issuer: "Maharashtra School Education Department",
      departmentKey: "maha_education",
      service: "education_information",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(public\s+health|आरोग्य|arogya)\b/i,
    match: {
      documentType: "other",
      issuer: "Maharashtra Public Health Department",
      departmentKey: "maha_health",
      service: "health_information",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(labour|labor|कामगार|mahakamgar)\b/i,
    match: {
      documentType: "other",
      issuer: "Maharashtra Labour Department",
      departmentKey: "maha_labor",
      service: "labour_services",
      state: "Maharashtra",
    },
  },
  {
    test: /\b(revenue\s+department|महसूल|7\/12|saat\s*bara)\b/i,
    match: {
      documentType: "other",
      issuer: "Maharashtra Revenue Department",
      departmentKey: "maha_revenue",
      service: "revenue_information",
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

function isPaidReceipt(text: string): boolean {
  return /\b(thank you for .{0,80}payment|payment\s+receip|online\s+payment\s+facility|transaction\s+reference|transaction\s+id|successfully\s+paid|payment\s+successful|amount\s+paid)\b/i.test(
    text,
  );
}

function toIsoDate(year: string, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const parsed = Date.parse(`${iso}T12:00:00`);
  if (Number.isNaN(parsed)) return null;
  return iso;
}

/** Ambiguous slash dates: prefer M/D/Y when day>12 in second slot (portal receipts), else D/M/Y (India). */
function fromSlashParts(first: string, second: string, year: string): string | null {
  const a = Number(first);
  const b = Number(second);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (b > 12 && a <= 12) return toIsoDate(year, a, b);
  if (a > 12 && b <= 12) return toIsoDate(year, b, a);
  return toIsoDate(year, b, a);
}

function parseNamedDate(text: string): string | null {
  const named = text.match(
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?[,\s]+(20\d{2})\b/i,
  );
  if (!named) return null;
  const month = MONTHS[named[2].toLowerCase()];
  if (!month) return null;
  return toIsoDate(named[3], Number(month), Number(named[1]));
}

function parseAnyDateToken(fragment: string): string | null {
  const iso = fragment.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return toIsoDate(iso[1], Number(iso[2]), Number(iso[3]));

  const slash = fragment.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2})\b/);
  if (slash) return fromSlashParts(slash[1], slash[2], slash[3]);

  return parseNamedDate(fragment);
}

function parseDeadline(text: string): string | null {
  const labeled = text.match(
    /(?:pay\s*by|due\s*(?:date|by|on)?|last\s*date|deadline|अंतिम\s*तारीख|देय\s*तारीख)\s*[:\-]?\s*([^\n.]{6,40})/i,
  );
  if (labeled) {
    const fromLabel = parseAnyDateToken(labeled[1]);
    if (fromLabel) return fromLabel;
  }

  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return toIsoDate(iso[1], Number(iso[2]), Number(iso[3]));

  const named = parseNamedDate(text);
  if (named) return named;

  const slash = text.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2})\b/);
  if (slash) return fromSlashParts(slash[1], slash[2], slash[3]);

  return null;
}

function parseTransactionDate(text: string): string | null {
  const labeled = text.match(
    /(?:transaction\s+date(?:\s*(?:&|and)?\s*times?)?|payment\s+date|paid\s+on)\s*[:\-]?\s*([^\n]{6,40})/i,
  );
  if (labeled) {
    const fromLabel = parseAnyDateToken(labeled[1]);
    if (fromLabel) return fromLabel;
  }
  return null;
}

function parseAmount(text: string): number | null {
  const rupee = text.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i)?.[1];
  if (rupee) return Number(rupee.replaceAll(",", ""));
  const labeled = text.match(
    /(?:amount\s*(?:due|payable|paid)?|कुल\s*राशि|रक्कम)\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)\s*(?:\/\s*-)?/i,
  )?.[1];
  if (labeled) return Number(labeled.replaceAll(",", ""));
  const slashRupee = text.match(/\b([\d,]+(?:\.\d{1,2})?)\s*\/\s*-/);
  if (slashRupee) return Number(slashRupee[1].replaceAll(",", ""));
  return null;
}

function parseReference(text: string, paid: boolean): string {
  const patterns = paid
    ? [
        /(?:transaction\s+reference|transaction\s+id|txn\s*(?:id|ref|no|number)?)\s*(?:no|number|num)?\.?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,})/i,
        /(?:payment\s+receip(?:t)?\s*(?:no|number|num)?|receip(?:t)?\s*(?:no|number|num)?)\.?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,})/i,
        /(?:consumer\s*(?:no|number|num)?)\.?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,})/i,
      ]
    : [
        /(?:consumer\s*(?:no|number|num)?|ग्राहक\s*क्रमांक|खाते\s*क्रमांक)\.?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,})/i,
        /(?:transaction\s+reference|reference|ref)\s*(?:no|number|num)?\.?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,})/i,
        /(?:challan\s*(?:no|number|num)?|चॅलन\s*क्रमांक)\.?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,})/i,
        /(?:bill\s*(?:no|number|num)?|बिल\s*क्रमांक)\.?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,})/i,
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
  paid: boolean;
}): Record<Language, string> {
  const amount =
    input.amountDue == null ? "an unspecified amount" : `₹${input.amountDue.toLocaleString("en-IN")}`;
  const reference =
    input.referenceNumber === "Not found" ? "no clear reference number" : `reference ${input.referenceNumber}`;

  if (input.paid) {
    const paidOn = input.deadlineDate ?? "a date not clearly stated";
    return {
      en: `This appears to be a payment receipt from ${input.issuer} for ${amount}, paid on ${paidOn} (${reference}). Nothing in this text indicates a further amount due. Keep the receipt and transaction ID for queries; do not pay again from this page alone.`,
      hi: `यह ${input.issuer} की भुगतान रसीद लगती है—${amount}, भुगतान तिथि ${paidOn} (${reference})। इस पाठ से कोई और देय राशि नहीं दिखती। रसीद और लेनदेन आईडी सुरक्षित रखें; केवल इसी पृष्ठ से दोबारा भुगतान न करें।`,
      mr: `ही ${input.issuer} ची पेमेंट पावती दिसते—${amount}, भरल्याची तारीख ${paidOn} (${reference}). या मजकुरात आणखी देय रक्कम दिसत नाही. पावती व व्यवहार क्रमांक जपून ठेवा; फक्त या पृष्ठावरून पुन्हा पैसे भरू नका.`,
    };
  }

  const deadline = input.deadlineDate ?? "a date not clearly stated";
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
  const paid = isPaidReceipt(text);
  const amountDue = parseAmount(text);
  const transactionDate = paid ? parseTransactionDate(text) : null;
  const deadlineDate = paid ? transactionDate : parseDeadline(text);
  const referenceNumber = parseReference(text, paid);
  const documentType: DocumentType = paid ? "payment_receipt" : issuer.documentType;
  const scamRiskScore = /\b(otp|upi\s*pin|password|send\s*money|gift\s*card|whatsapp\s*pay)\b/i.test(text)
    ? "suspicious"
    : "safe";

  return {
    id: `case-${Date.now()}`,
    fileName: "pasted-notice.txt",
    documentType,
    issuer: issuer.issuer,
    referenceNumber,
    deadlineDate,
    amountDue,
    urgency: paid ? "low" : urgencyFromDeadline(deadlineDate),
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
      paid,
    }),
    requiredActionItems: paid
      ? [
          "Save this receipt and the transaction / receipt numbers for future queries.",
          "Match the paid amount with your bank or UPI statement.",
          "Do not pay again based on this receipt alone.",
          "Open only a reviewed official portal yourself if you need a duplicate bill or complaint help.",
        ]
      : [
          "Compare the reference number and amount with your own records.",
          "Confirm the deadline before choosing any payment or response.",
          "Open only a reviewed official portal yourself; this app never pays or submits.",
          "Keep a copy of any official receipt or acknowledgement.",
        ],
    requiredDocuments: paid
      ? ["This payment receipt", "Bank or UPI confirmation if available"]
      : ["A previous bill or notice for comparison", "A copy of this notice"],
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
