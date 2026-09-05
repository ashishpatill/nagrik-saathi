import type { Language } from "@/lib/languages";
import { LANGUAGES } from "@/lib/languages";

const AMOUNT_MISSING: Record<Language, string> = {
  en: "an unspecified amount",
  hi: "अस्पष्ट राशि",
  mr: "अस्पष्ट रक्कम",
  ta: "தெளிவற்ற தொகை",
  kn: "ಸ್ಪಷ್ಟವಲ್ಲದ ಮೊತ್ತ",
  gu: "અસ્પષ્ટ રકમ",
  te: "స్పష్టంగా లేని మొత్తం",
  bn: "অনির্দিষ্ট পরিমাণ",
};

const AMOUNT_LABEL: Record<Language, string> = {
  en: "",
  hi: "राशि",
  mr: "रक्कम",
  ta: "தொகை",
  kn: "ಮೊತ್ತ",
  gu: "રકમ",
  te: "మొత్తం",
  bn: "পরিমাণ",
};

const REF_MISSING: Record<Language, string> = {
  en: "no clear reference number",
  hi: "कोई स्पष्ट संदर्भ संख्या नहीं",
  mr: "स्पष्ट संदर्भ क्रमांक नाही",
  ta: "தெளிவான குறிப்பு எண் இல்லை",
  kn: "ಸ್ಪಷ್ಟ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ಇಲ್ಲ",
  gu: "સ્પષ્ટ સંદર્ભ નંબર નથી",
  te: "స్పష్టమైన సూచన సంఖ్య లేదు",
  bn: "স্পষ্ট রেফারেন্স নম্বর নেই",
};

const REF_LABEL: Record<Language, string> = {
  en: "reference",
  hi: "संदर्भ",
  mr: "संदर्भ",
  ta: "குறிப்பு",
  kn: "ಉಲ್ಲೇಖ",
  gu: "સંદર્ભ",
  te: "సూచన",
  bn: "রেফারেন্স",
};

const DATE_MISSING: Record<Language, string> = {
  en: "a date not clearly stated",
  hi: "तारीख स्पष्ट नहीं",
  mr: "तारीख स्पष्ट नाही",
  ta: "தேதி தெளிவாக இல்லை",
  kn: "ದಿನಾಂಕ ಸ್ಪಷ್ಟವಿಲ್ಲ",
  gu: "તારીખ સ્પષ્ટ નથી",
  te: "తేదీ స్పష్టంగా లేదు",
  bn: "তারিখ স্পষ্ট নয়",
};

export function amountPhrase(amountDue: number | null, language: Language): string {
  if (amountDue == null) return AMOUNT_MISSING[language];
  const formatted = `₹${amountDue.toLocaleString("en-IN")}`;
  const label = AMOUNT_LABEL[language];
  return label ? `${label} ${formatted}` : formatted;
}

export function referencePhrase(referenceNumber: string, language: Language): string {
  if (referenceNumber === "Not found") return REF_MISSING[language];
  return `${REF_LABEL[language]} ${referenceNumber}`;
}

export function datePhrase(date: string | null, language: Language, missingFallbackEn?: string): string {
  if (date) return date;
  if (language === "en" && missingFallbackEn) return missingFallbackEn;
  return DATE_MISSING[language];
}

export function buildSummaries(input: {
  issuer: string;
  amountDue: number | null;
  deadlineDate: string | null;
  referenceNumber: string;
  paid: boolean;
}): Record<Language, string> {
  const summaries = {} as Record<Language, string>;
  for (const language of LANGUAGES) {
    const amount = amountPhrase(input.amountDue, language);
    const reference = referencePhrase(input.referenceNumber, language);
    const when = datePhrase(input.deadlineDate, language, "a date not clearly stated");
    if (input.paid) {
      summaries[language] = paidSummary(language, input.issuer, amount, when, reference);
    } else {
      summaries[language] = unpaidSummary(language, input.issuer, amount, when, reference);
    }
  }
  return summaries;
}

function paidSummary(
  language: Language,
  issuer: string,
  amount: string,
  when: string,
  reference: string,
): string {
  switch (language) {
    case "en":
      return `This appears to be a payment receipt from ${issuer} for ${amount}, paid on ${when} (${reference}). Nothing in this text indicates a further amount due. Keep the receipt and transaction ID for queries; do not pay again from this page alone.`;
    case "hi":
      return `यह ${issuer} की भुगतान रसीद लगती है—${amount}, भुगतान तिथि ${when} (${reference})। इस पाठ से कोई और देय राशि नहीं दिखती। रसीद सुरक्षित रखें; केवल इसी पृष्ठ से दोबारा भुगतान न करें।`;
    case "mr":
      return `ही ${issuer} ची पेमेंट पावती आहे. ${amount}, भरलेली तारीख ${when} (${reference}). या पावतीनुसार आणखी काही देय दिसत नाही—इथे फारसे करण्यासारखे नाही. पावती व व्यवहार क्रमांक जपून ठेवा; पुन्हा पैसे भरू नका.`;
    case "ta":
      return `இது ${issuer} இன் கட்டண ரசீதாகத் தெரிகிறது—${amount}, செலுத்திய தேதி ${when} (${reference}). மேலும் செலுத்த வேண்டிய தொகை இதில் இல்லை. ரசீதை வைத்திருங்கள்; இந்தப் பக்கத்திலிருந்து மீண்டும் பணம் செலுத்த வேண்டாம்.`;
    case "kn":
      return `ಇದು ${issuer} ನ ಪಾವತಿ ರಸೀದಿಯಂತೆ ಕಾಣುತ್ತದೆ—${amount}, ಪಾವತಿ ದಿನಾಂಕ ${when} (${reference}). ಇನ್ನಷ್ಟು ಬಾಕಿ ಕಾಣುವುದಿಲ್ಲ. ರಸೀದಿ ಉಳಿಸಿಕೊಳ್ಳಿ; ಈ ಪುಟದಿಂದ ಮತ್ತೆ ಪಾವತಿ ಮಾಡಬೇಡಿ.`;
    case "gu":
      return `આ ${issuer} ની ચુકવણી રસીદ લાગે છે—${amount}, ચુકવણી તારીખ ${when} (${reference}). વધુ બાકી દેખાતું નથી. રસીદ સાચવો; આ પેજથી ફરી ચુકવણી ન કરો.`;
    case "te":
      return `ఇది ${issuer} చెల్లింపు రసీదులా కనిపిస్తోంది—${amount}, చెల్లించిన తేదీ ${when} (${reference}). మరిన్ని బాకీలు కనిపించవు. రసీదు భద్రపరచుకోండి; ఈ పేజీ నుంచి మళ్లీ చెల్లించవద్దు.`;
    case "bn":
      return `এটি ${issuer}-এর পেমেন্ট রসিদ বলে মনে হচ্ছে—${amount}, পরিশোধের তারিখ ${when} (${reference})। আর কোনো বকেয়া দেখা যাচ্ছে না। রসিদ রাখুন; শুধু এই পাতা থেকে আবার টাকা দেবেন না।`;
    default: {
      const _exhaustive: never = language;
      return _exhaustive;
    }
  }
}

function unpaidSummary(
  language: Language,
  issuer: string,
  amount: string,
  when: string,
  reference: string,
): string {
  switch (language) {
    case "en":
      return `This notice appears to be from ${issuer}. It mentions ${amount}, deadline ${when}, and ${reference}. Verify details against your own records, then open only a reviewed official channel yourself.`;
    case "hi":
      return `यह सूचना संभवतः ${issuer} से संबंधित है। इसमें ${amount}, अंतिम तिथि ${when}, और ${reference} का उल्लेख है। अपनी पुरानी रिकॉर्ड से जाँच करें और केवल सत्यापित आधिकारिक चैनल स्वयं खोलें।`;
    case "mr":
      return `ही सूचना संभाव्यतः ${issuer} ची आहे. त्यात ${amount}, अंतिम तारीख ${when}, आणि ${reference} नमूद आहे. स्वतःच्या जुन्या नोंदींशी तपासा आणि फक्त सत्यापित अधिकृत मार्ग स्वतः उघडा.`;
    case "ta":
      return `இந்த அறிவிப்பு ${issuer} இலிருந்து வந்ததாகத் தெரிகிறது. இதில் ${amount}, கடைசி தேதி ${when}, மற்றும் ${reference} உள்ளன. உங்கள் பதிவுகளுடன் சரிபார்த்து, சரிபார்க்கப்பட்ட அதிகாரப்பூர்வ தளத்தையே நீங்களே திறக்கவும்.`;
    case "kn":
      return `ಈ ಸೂಚನೆ ${issuer} ಯಿಂದ ಬಂದಂತೆ ಕಾಣುತ್ತದೆ. ಇದರಲ್ಲಿ ${amount}, ಕೊನೆಯ ದಿನಾಂಕ ${when}, ಮತ್ತು ${reference} ಉಲ್ಲೇಖವಿದೆ. ನಿಮ್ಮ ದಾಖಲೆಗಳೊಂದಿಗೆ ಹೋಲಿಸಿ, ಪರಿಶೀಲಿಸಿದ ಅಧಿಕೃತ ಚಾನೆಲ್ ಅನ್ನು ನೀವೇ ತೆರೆಯಿರಿ.`;
    case "gu":
      return `આ સૂચના સંભવતઃ ${issuer} ની છે. તેમાં ${amount}, અંતિમ તારીખ ${when}, અને ${reference} છે. તમારા રેકોર્ડ સાથે ચકાસો અને માત્ર ચકાસેલ અધિકૃત ચેનલ પોતે ખોલો.`;
    case "te":
      return `ఈ నోటీసు ${issuer} నుంచి వచ్చినట్లు కనిపిస్తోంది. ఇందులో ${amount}, గడువు ${when}, మరియు ${reference} ఉన్నాయి. మీ రికార్డులతో సరిచూసి, సమీక్షించిన అధికారిక ఛానెల్‌ను మీరే తెరవండి.`;
    case "bn":
      return `এই নোটিশ সম্ভবত ${issuer} থেকে এসেছে। এতে ${amount}, শেষ তারিখ ${when}, এবং ${reference} উল্লেখ আছে। নিজের রেকর্ডের সঙ্গে মিলিয়ে দেখুন, শুধু যাচাই করা সরকারি চ্যানেল নিজে খুলুন।`;
    default: {
      const _exhaustive: never = language;
      return _exhaustive;
    }
  }
}

export const PAID_ACTIONS: Record<Language, string[]> = {
  en: [
    "Save this receipt and the transaction / receipt numbers for future queries.",
    "Match the paid amount with your bank or UPI statement.",
    "Do not pay again based on this receipt alone.",
    "Open only a reviewed official portal yourself if you need a duplicate bill or complaint help.",
  ],
  hi: [
    "भविष्य की पूछताछ के लिए यह रसीद और लेनदेन/रसीद संख्या सुरक्षित रखें।",
    "भुगतान राशि को अपने बैंक या UPI स्टेटमेंट से मिलाएँ।",
    "केवल इस रसीद के आधार पर दोबारा भुगतान न करें।",
    "डुप्लिकेट बिल या शिकायत के लिए ही सत्यापित आधिकारिक पोर्टल स्वयं खोलें।",
  ],
  mr: [
    "भविष्यातील चौकशीसाठी ही पावती व व्यवहार/पावती क्रमांक जपून ठेवा.",
    "भरलेली रक्कम बँक किंवा UPI स्टेटमेंटशी जुळवा.",
    "फक्त या पावतीवरून पुन्हा पैसे भरू नका.",
    "डुप्लिकेट बिल किंवा तक्रारीसाठीच सत्यापित अधिकृत पोर्टल स्वतः उघडा.",
  ],
  ta: [
    "எதிர்கால விசாரணைக்கு இந்த ரசீதையும் பரிவர்த்தனை எண்களையும் வைத்திருங்கள்.",
    "செலுத்திய தொகையை வங்கி அல்லது UPI அறிக்கையுடன் பொருத்துங்கள்.",
    "இந்த ரசீதின் அடிப்படையில் மட்டும் மீண்டும் பணம் செலுத்த வேண்டாம்.",
    "நகல் பில் அல்லது புகாருக்கு மட்டும் சரிபார்க்கப்பட்ட அதிகாரப்பூர்வ தளத்தை நீங்களே திறக்கவும்.",
  ],
  kn: [
    "ಭವಿಷ್ಯದ ವಿಚಾರಣೆಗೆ ಈ ರಸೀದಿ ಮತ್ತು ವಹಿವಾಟು ಸಂಖ್ಯೆಗಳನ್ನು ಉಳಿಸಿ.",
    "ಪಾವತಿಸಿದ ಮೊತ್ತವನ್ನು ಬ್ಯಾಂಕ್ ಅಥವಾ UPI ಹೇಳಿಕೆಯೊಂದಿಗೆ ಹೊಂದಿಸಿ.",
    "ಈ ರಸೀದಿ ಆಧಾರದ ಮೇಲೆ ಮಾತ್ರ ಮತ್ತೆ ಪಾವತಿ ಮಾಡಬೇಡಿ.",
    "ನಕಲು ಬಿಲ್ ಅಥವಾ ದೂರಿಗೆ ಮಾತ್ರ ಪರಿಶೀಲಿಸಿದ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ಅನ್ನು ನೀವೇ ತೆರೆಯಿರಿ.",
  ],
  gu: [
    "ભવિષ્યની પૂછપરછ માટે આ રસીદ અને વ્યવહાર નંબર સાચવો.",
    "ચૂકવેલી રકમ બેંક અથવા UPI સ્ટેટમેન્ટ સાથે મેળવો.",
    "ફક્ત આ રસીદના આધારે ફરી ચુકવણી ન કરો.",
    "ડુપ્લિકેટ બિલ કે ફરિયાદ માટે જ ચકાસેલ અધિકૃત પોર્ટલ પોતે ખોલો.",
  ],
  te: [
    "భవిష్యత్ విచారణకు ఈ రసీదు మరియు లావాదేవీ నంబర్లు భద్రపరచుకోండి.",
    "చెల్లించిన మొత్తాన్ని బ్యాంక్ లేదా UPI స్టేట్‌మెంట్‌తో సరిచూడండి.",
    "ఈ రసీదు ఆధారంగా మాత్రమే మళ్లీ చెల్లించవద్దు.",
    "డూప్లికేట్ బిల్ లేదా ఫిర్యాదుకు మాత్రమే సమీక్షించిన అధికారిక పోర్టల్‌ను మీరే తెరవండి.",
  ],
  bn: [
    "ভবিষ্যতের জিজ্ঞাসার জন্য এই রসিদ ও লেনদেন নম্বর রাখুন।",
    "পরিশোধিত পরিমাণ ব্যাংক বা UPI স্টেটমেন্টের সঙ্গে মিলিয়ে দেখুন।",
    "শুধু এই রসিদের ভিত্তিতে আবার টাকা দেবেন না।",
    "ডুপ্লিকেট বিল বা অভিযোগের জন্যই যাচাই করা সরকারি পোর্টাল নিজে খুলুন।",
  ],
};

export const UNPAID_ACTIONS: Record<Language, string[]> = {
  en: [
    "Compare the reference number and amount with your own records.",
    "Confirm the deadline before choosing any payment or response.",
    "Open only a reviewed official portal yourself; this app never pays or submits.",
    "Keep a copy of any official receipt or acknowledgement.",
  ],
  hi: [
    "संदर्भ संख्या और राशि को अपने रिकॉर्ड से मिलाएँ।",
    "कोई भुगतान या जवाब देने से पहले अंतिम तिथि की पुष्टि करें।",
    "केवल सत्यापित आधिकारिक पोर्टल स्वयं खोलें; यह ऐप भुगतान या जमा नहीं करता।",
    "किसी भी आधिकारिक रसीद की प्रति रखें।",
  ],
  mr: [
    "संदर्भ क्रमांक व रक्कम स्वतःच्या नोंदींशी जुळवा.",
    "पेमेंट किंवा उत्तर देण्यापूर्वी अंतिम तारीख खात्री करा.",
    "फक्त सत्यापित अधिकृत पोर्टल स्वतः उघडा; हे अॅप पेमेंट किंवा सबमिट करत नाही.",
    "अधिकृत पावतीची प्रत जपून ठेवा.",
  ],
  ta: [
    "குறிப்பு எண் மற்றும் தொகையை உங்கள் பதிவுகளுடன் ஒப்பிடுங்கள்.",
    "பணம் செலுத்தும் அல்லது பதிலளிக்கும் முன் கடைசி தேதியை உறுதிப்படுத்துங்கள்.",
    "சரிபார்க்கப்பட்ட அதிகாரப்பூர்வ தளத்தையே நீங்களே திறக்கவும்; இந்த செயலி பணம் செலுத்தாது.",
    "அதிகாரப்பூர்வ ரசீதின் நகலை வைத்திருங்கள்.",
  ],
  kn: [
    "ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ಮತ್ತು ಮೊತ್ತವನ್ನು ನಿಮ್ಮ ದಾಖಲೆಗಳೊಂದಿಗೆ ಹೋಲಿಸಿ.",
    "ಪಾವತಿ ಅಥವಾ ಪ್ರತಿಕ್ರಿಯೆಗೂ ಮೊದಲು ಕೊನೆಯ ದಿನಾಂಕವನ್ನು ದೃಢಪಡಿಸಿ.",
    "ಪರಿಶೀಲಿಸಿದ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ಅನ್ನು ನೀವೇ ತೆರೆಯಿರಿ; ಈ ಅಪ್ಲಿಕೇಶನ್ ಪಾವತಿ ಮಾಡುವುದಿಲ್ಲ.",
    "ಅಧಿಕೃತ ರಸೀದಿಯ ನಕಲನ್ನು ಇರಿಸಿ.",
  ],
  gu: [
    "સંદર્ભ નંબર અને રકમ તમારા રેકોર્ડ સાથે મેળવો.",
    "ચુકવણી કે જવાબ આપતા પહેલાં અંતિમ તારીખની પુષ્ટિ કરો.",
    "માત્ર ચકાસેલ અધિકૃત પોર્ટલ પોતે ખોલો; આ એપ ચુકવણી કરતું નથી.",
    "કોઈપણ અધિકૃત રસીદની નકલ રાખો.",
  ],
  te: [
    "సూచన సంఖ్య మరియు మొత్తాన్ని మీ రికార్డులతో సరిచూడండి.",
    "చెల్లింపు లేదా స్పందనకు ముందు గడువును నిర్ధారించండి.",
    "సమీక్షించిన అధికారిక పోర్టల్‌ను మీరే తెరవండి; ఈ యాప్ చెల్లింపు చేయదు.",
    "అధికారిక రసీదు కాపీని ఉంచుకోండి.",
  ],
  bn: [
    "রেফারেন্স নম্বর ও পরিমাণ নিজের রেকর্ডের সঙ্গে মিলিয়ে দেখুন।",
    "কোনো পেমেন্ট বা জবাবের আগে শেষ তারিখ নিশ্চিত করুন।",
    "শুধু যাচাই করা সরকারি পোর্টাল নিজে খুলুন; এই অ্যাপ পেমেন্ট করে না।",
    "কোনো সরকারি রসিদের কপি রাখুন।",
  ],
};
