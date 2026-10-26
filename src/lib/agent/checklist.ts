import { actionsForCase } from "@/lib/extract";
import { noticeDisclaimer } from "@/lib/i18n/disclaimer";
import { requiredDocumentsForCase } from "@/lib/i18n/notice";
import type { DocumentAnalysis, Language } from "@/lib/types";

type ChecklistCopy = {
  title: string;
  subtitle: string;
  noticeDetails: string;
  issuer: string;
  reference: string;
  deadline: string;
  amount: string;
  nextSteps: string;
  documents: string;
  safety: string;
  safetyBody: string;
  generated: string;
  printHint: string;
  notFound: string;
};

const COPY: Record<Language, ChecklistCopy> = {
  en: {
    title: "Nagrik Saathi checklist",
    subtitle: "A review copy for your records",
    noticeDetails: "Notice details",
    issuer: "Issuer",
    reference: "Reference",
    deadline: "Deadline",
    amount: "Amount due",
    nextSteps: "Next steps",
    documents: "Keep these documents nearby",
    safety: "Safety boundary",
    safetyBody:
      "This is guidance, not an official government decision. Nagrik Saathi does not make payments, submit forms, or contact officials. Complete any payment or submission yourself on the official portal.",
    generated: "Generated",
    printHint: "Print this page or save it as PDF.",
    notFound: "Not found",
  },
  hi: {
    title: "नागरिक साथी चेकलिस्ट",
    subtitle: "आपके रिकॉर्ड के लिए समीक्षा प्रति",
    noticeDetails: "नोटिस का विवरण",
    issuer: "जारीकर्ता",
    reference: "संदर्भ संख्या",
    deadline: "अंतिम तिथि",
    amount: "देय राशि",
    nextSteps: "अगले कदम",
    documents: "ये दस्तावेज़ पास रखें",
    safety: "सुरक्षा सीमा",
    safetyBody:
      "यह मार्गदर्शन है, आधिकारिक सरकारी निर्णय नहीं। नागरिक साथी भुगतान, फॉर्म जमा या अधिकारियों से संपर्क नहीं करता। भुगतान या जमा आधिकारिक पोर्टल पर स्वयं पूरा करें।",
    generated: "बनाया गया",
    printHint: "इस पृष्ठ को प्रिंट करें या PDF के रूप में सहेजें।",
    notFound: "नहीं मिला",
  },
  mr: {
    title: "नागरिक साथी चेकलिस्ट",
    subtitle: "तुमच्या नोंदींसाठी तपासणी प्रत",
    noticeDetails: "नोटिसचा तपशील",
    issuer: "जारीकर्ता",
    reference: "संदर्भ क्रमांक",
    deadline: "अंतिम तारीख",
    amount: "देय रक्कम",
    nextSteps: "पुढील पायऱ्या",
    documents: "ही कागदपत्रे जवळ ठेवा",
    safety: "सुरक्षा मर्यादा",
    safetyBody:
      "हे मार्गदर्शन आहे, अधिकृत सरकारी निर्णय नाही. नागरिक साथी पैसे भरणे, अर्ज सादर करणे किंवा अधिकाऱ्यांशी संपर्क करत नाही. पैसे भरणे किंवा अर्ज सादर करणे अधिकृत पोर्टलवर स्वतः पूर्ण करा.",
    generated: "तयार केले",
    printHint: "हे पान प्रिंट करा किंवा PDF म्हणून जतन करा.",
    notFound: "आढळले नाही",
  },
  ta: {
    title: "நாகரிக் சாதி சரிபார்ப்பு பட்டியல்",
    subtitle: "உங்கள் பதிவுகளுக்கான மதிப்பாய்வு நகல்",
    noticeDetails: "அறிவிப்பு விவரங்கள்",
    issuer: "வழங்கியவர்",
    reference: "குறிப்பு எண்",
    deadline: "கடைசி தேதி",
    amount: "செலுத்த வேண்டிய தொகை",
    nextSteps: "அடுத்த படிகள்",
    documents: "இந்த ஆவணங்களை அருகில் வைத்திருங்கள்",
    safety: "பாதுகாப்பு எல்லை",
    safetyBody:
      "இது வழிகாட்டல் மட்டுமே; அதிகாரப்பூர்வ அரசு முடிவல்ல. நாகரிக் சாதி பணம் செலுத்துவதில்லை, படிவங்களை சமர்ப்பிப்பதில்லை, அதிகாரிகளைத் தொடர்பு கொள்வதில்லை. பணம் செலுத்துதல் அல்லது சமர்ப்பித்தலை அதிகாரப்பூர்வ இணையதளத்தில் நீங்களே முடிக்கவும்.",
    generated: "உருவாக்கப்பட்டது",
    printHint: "இந்தப் பக்கத்தை அச்சிடவும் அல்லது PDF ஆகச் சேமிக்கவும்.",
    notFound: "கிடைக்கவில்லை",
  },
  kn: {
    title: "ನಾಗರಿಕ್ ಸಾಥಿ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ",
    subtitle: "ನಿಮ್ಮ ದಾಖಲೆಗಳಿಗಾಗಿ ಪರಿಶೀಲನಾ ಪ್ರತಿ",
    noticeDetails: "ಅಧಿಸೂಚನೆ ವಿವರಗಳು",
    issuer: "ನೀಡಿದವರು",
    reference: "ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ",
    deadline: "ಕೊನೆಯ ದಿನಾಂಕ",
    amount: "ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ",
    nextSteps: "ಮುಂದಿನ ಹಂತಗಳು",
    documents: "ಈ ದಾಖಲೆಗಳನ್ನು ಹತ್ತಿರ ಇಟ್ಟುಕೊಳ್ಳಿ",
    safety: "ಸುರಕ್ಷತಾ ಮಿತಿ",
    safetyBody:
      "ಇದು ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ; ಅಧಿಕೃತ ಸರ್ಕಾರಿ ನಿರ್ಧಾರವಲ್ಲ. ನಾಗರಿಕ್ ಸಾಥಿ ಪಾವತಿ ಮಾಡುವುದಿಲ್ಲ, ಫಾರ್ಮ್ ಸಲ್ಲಿಸುವುದಿಲ್ಲ, ಅಧಿಕಾರಿಗಳನ್ನು ಸಂಪರ್ಕಿಸುವುದಿಲ್ಲ. ಪಾವತಿ ಅಥವಾ ಸಲ್ಲಿಕೆಯನ್ನು ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೀವೇ ಪೂರ್ಣಗೊಳಿಸಿ.",
    generated: "ರಚಿಸಲಾಗಿದೆ",
    printHint: "ಈ ಪುಟವನ್ನು ಮುದ್ರಿಸಿ ಅಥವಾ PDF ಆಗಿ ಉಳಿಸಿ.",
    notFound: "ಕಂಡುಬಂದಿಲ್ಲ",
  },
  gu: {
    title: "નાગરિક સાથી ચેકલિસ્ટ",
    subtitle: "તમારા રેકોર્ડ માટે સમીક્ષા નકલ",
    noticeDetails: "નોટિસની વિગતો",
    issuer: "જારી કરનાર",
    reference: "સંદર્ભ નંબર",
    deadline: "અંતિમ તારીખ",
    amount: "ચૂકવવાની રકમ",
    nextSteps: "આગળના પગલાં",
    documents: "આ દસ્તાવેજો નજીક રાખો",
    safety: "સુરક્ષા મર્યાદા",
    safetyBody:
      "આ માર્ગદર્શન છે, અધિકૃત સરકારી નિર્ણય નથી. નાગરિક સાથી ચુકવણી કરતું નથી, ફોર્મ સબમિટ કરતું નથી કે અધિકારીઓનો સંપર્ક કરતું નથી. ચુકવણી અથવા સબમિશન અધિકૃત પોર્ટલ પર જાતે પૂર્ણ કરો.",
    generated: "બનાવ્યું",
    printHint: "આ પૃષ્ઠને પ્રિન્ટ કરો અથવા PDF તરીકે સાચવો.",
    notFound: "મળ્યું નથી",
  },
  te: {
    title: "నాగరిక్ సాథి చెక్‌లిస్ట్",
    subtitle: "మీ రికార్డుల కోసం సమీక్ష ప్రతి",
    noticeDetails: "నోటీసు వివరాలు",
    issuer: "జారీ చేసినవారు",
    reference: "సూచన సంఖ్య",
    deadline: "చివరి తేదీ",
    amount: "చెల్లించాల్సిన మొత్తం",
    nextSteps: "తదుపరి చర్యలు",
    documents: "ఈ పత్రాలను దగ్గర ఉంచుకోండి",
    safety: "భద్రతా పరిమితి",
    safetyBody:
      "ఇది మార్గదర్శకం మాత్రమే; అధికారిక ప్రభుత్వ నిర్ణయం కాదు. నాగరిక్ సాథి చెల్లింపులు చేయదు, ఫారమ్‌లు సమర్పించదు, అధికారులను సంప్రదించదు. చెల్లింపు లేదా సమర్పణను అధికారిక పోర్టల్‌లో మీరే పూర్తి చేయండి.",
    generated: "సృష్టించబడింది",
    printHint: "ఈ పేజీని ప్రింట్ చేయండి లేదా PDFగా సేవ్ చేయండి.",
    notFound: "కనుగొనబడలేదు",
  },
  bn: {
    title: "নাগরিক সাথী চেকলিস্ট",
    subtitle: "আপনার রেকর্ডের জন্য পর্যালোচনা কপি",
    noticeDetails: "নোটিশের বিবরণ",
    issuer: "প্রেরক",
    reference: "রেফারেন্স নম্বর",
    deadline: "শেষ তারিখ",
    amount: "পরিশোধযোগ্য পরিমাণ",
    nextSteps: "পরবর্তী পদক্ষেপ",
    documents: "এই নথিগুলো কাছে রাখুন",
    safety: "নিরাপত্তা সীমা",
    safetyBody:
      "এটি শুধু নির্দেশনা; সরকারি সিদ্ধান্ত নয়। নাগরিক সাথী পেমেন্ট করে না, ফর্ম জমা দেয় না, কর্মকর্তাদের সঙ্গে যোগাযোগ করে না। পেমেন্ট বা জমা দেওয়ার কাজ অফিসিয়াল পোর্টালে নিজে সম্পন্ন করুন।",
    generated: "তৈরি হয়েছে",
    printHint: "এই পৃষ্ঠাটি প্রিন্ট করুন বা PDF হিসেবে সংরক্ষণ করুন।",
    notFound: "পাওয়া যায়নি",
  },
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

/**
 * Build a self-contained, print-ready HTML document. The user opens it locally
 * and uses the browser's print dialog to make a PDF. This avoids embedding
 * Devanagari/Tamil fonts in a generated PDF and avoids a PDF dependency.
 *
 * Every interpolated value is escaped, and the CSP meta tag blocks scripts and
 * network requests even if an escape is ever missed.
 */
export function buildChecklistHtml(doc: DocumentAnalysis, language: Language): string {
  const copy = COPY[language];
  const actions = actionsForCase(doc, language);
  const documents = requiredDocumentsForCase(doc.documentType, language);
  const amount =
    doc.amountDue == null ? copy.notFound : `₹${doc.amountDue.toLocaleString("en-IN")}`;
  const facts: Array<[string, string]> = [
    [copy.issuer, doc.issuer || copy.notFound],
    [copy.reference, doc.referenceNumber || copy.notFound],
    [copy.deadline, doc.deadlineDate || copy.notFound],
    [copy.amount, amount],
  ];
  const generatedOn = new Date().toISOString().slice(0, 10);

  return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">
<title>${escapeHtml(copy.title)} — ${escapeHtml(doc.issuer || copy.notFound)}</title>
<style>
  :root { color-scheme: light; --ink: #171c26; --muted: #5b6678; --line: #d2d8e2; --accent: #25406a; --signal: #1b5f52; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; color: var(--ink); font: 15px/1.55 "Segoe UI", "Noto Sans", Arial, sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 36px 28px 48px; }
  header { border-bottom: 2px solid var(--ink); padding-bottom: 16px; }
  h1 { margin: 0; font-size: 26px; line-height: 1.2; letter-spacing: -0.01em; }
  .subtitle { margin: 6px 0 0; color: var(--muted); font-size: 13px; }
  h2 { margin: 28px 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 18px; margin: 0; }
  dt { color: var(--muted); font-size: 13px; }
  dd { margin: 0; font-weight: 600; overflow-wrap: anywhere; }
  ul { margin: 0; padding-left: 20px; }
  li { margin: 7px 0; }
  .safety { margin-top: 30px; border: 1px solid var(--line); border-left: 4px solid var(--signal); padding: 14px 16px; background: #f7faf9; }
  .safety p { margin: 6px 0 0; color: var(--muted); font-size: 13px; }
  footer { margin-top: 32px; border-top: 1px solid var(--line); padding-top: 12px; color: var(--muted); font-size: 12px; }
  @media print { main { max-width: none; padding: 0; } a { color: inherit; text-decoration: none; } }
  @page { margin: 18mm; }
</style>
</head>
<body>
<main>
  <header>
    <h1>${escapeHtml(copy.title)}</h1>
    <p class="subtitle">${escapeHtml(copy.subtitle)}</p>
  </header>

  <h2>${escapeHtml(copy.noticeDetails)}</h2>
  <dl>
    ${facts.map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join("\n    ")}
  </dl>

  <h2>${escapeHtml(copy.nextSteps)}</h2>
  <ul>
    ${actions.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n    ")}
  </ul>

  <h2>${escapeHtml(copy.documents)}</h2>
  <ul>
    ${documents.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n    ")}
  </ul>

  <section class="safety">
    <strong>${escapeHtml(copy.safety)}</strong>
    <p>${escapeHtml(copy.safetyBody)} ${escapeHtml(noticeDisclaimer(language))}</p>
  </section>

  <footer>
    ${escapeHtml(copy.generated)} ${generatedOn} · ${escapeHtml(copy.printHint)}
  </footer>
</main>
</body>
</html>`;
}
