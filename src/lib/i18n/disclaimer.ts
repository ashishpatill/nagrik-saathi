import type { Language } from "@/lib/languages";

/**
 * Every agent-facing output ends with the same boundary: guidance, not an
 * official decision. Kept in one place so the browser and MCP surfaces cannot
 * drift apart.
 */
export function noticeDisclaimer(language: Language): string {
  switch (language) {
    case "hi":
      return "यह मार्गदर्शन है; आधिकारिक सरकारी निर्णय नहीं।";
    case "mr":
      return "हे मार्गदर्शन आहे; अधिकृत सरकारी निर्णय नाही.";
    case "ta":
      return "இது வழிகாட்டல் மட்டும்; அதிகாரப்பூர்வ அரசு முடிவல்ல.";
    case "kn":
      return "ಇದು ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ; ಅಧಿಕೃತ ಸರ್ಕಾರಿ ನಿರ್ಧಾರವಲ್ಲ.";
    case "gu":
      return "આ માર્ગદર્શન છે; અધિકૃત સરકારી નિર્ણય નથી.";
    case "te":
      return "ఇది మార్గదర్శకం మాత్రమే; అధికారిక ప్రభుత్వ నిర్ణయం కాదు.";
    case "bn":
      return "এটি শুধু নির্দেশনা; সরকারি সিদ্ধান্ত নয়।";
    case "en":
      return "This is guidance, not an official government decision.";
    default: {
      const _exhaustive: never = language;
      return _exhaustive;
    }
  }
}
