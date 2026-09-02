import type { DocumentAnalysis } from "@/lib/types";

export const SAMPLE_CASE: DocumentAnalysis = {
  id: "sample-msedcl-2026",
  fileName: "sample-msedcl-notice.txt",
  documentType: "electricity_bill",
  issuer: "Maharashtra State Electricity Distribution Co. (MSEDCL)",
  referenceNumber: "SAMPLE-BU-411038-9921",
  deadlineDate: "2026-09-02",
  amountDue: 2430,
  urgency: "high",
  scamRiskScore: "safe",
  riskReason: "The sample notice points to a reviewed MSEDCL domain and does not ask for credentials or a personal payment link.",
  summary: {
    en: "This sample electricity notice says ₹2,430 is due for the Pune Urban division by 2 September 2026. Verify the consumer number against a previous bill, then use only the reviewed MSEDCL website.",
    hi: "यह नमूना बिजली सूचना बताती है कि पुणे शहरी विभाग के लिए ₹2,430 का भुगतान 2 सितंबर 2026 तक करना है। उपभोक्ता संख्या पुराने बिल से मिलाएँ और केवल सत्यापित MSEDCL वेबसाइट का उपयोग करें।",
    mr: "या नमुना वीज सूचनेनुसार पुणे शहर विभागासाठी २ सप्टेंबर २०२६ पर्यंत ₹२,४३० भरणे आवश्यक आहे. ग्राहक क्रमांक जुन्या बिलाशी तपासा आणि फक्त सत्यापित MSEDCL संकेतस्थळ वापरा.",
  },
  requiredActionItems: [
    "Verify the consumer number against your last physical bill.",
    "Review the amount and deadline before choosing any payment action.",
    "Open the verified MSEDCL portal yourself; this app never makes payments.",
    "Save the official receipt if you complete payment there.",
  ],
  requiredDocuments: ["Previous electricity bill or consumer record", "A copy of this notice for reference"],
  officialDepartmentKey: "msedcl_power",
  sourceText:
    "SAMPLE NOTICE — MSEDCL Pune Urban. Consumer number SAMPLE-BU-411038-9921. Amount due ₹2,430. Please respond by 02 September 2026. This sample is for demonstration only.",
};
