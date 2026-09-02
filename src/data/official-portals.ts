import type { OfficialPortal } from "@/lib/types";

const reviewed = "2026-09-01";

type PortalSeed = readonly [string, string, string, string, string[], string, string[]];

const portalSeeds: readonly PortalSeed[] = [
  ["msedcl_power", "MSEDCL electricity self-service", "Maharashtra", "https://wss.mahadiscom.in/wss/wss", ["wss.mahadiscom.in"], "1912 / 1800-233-3435", ["bill_payment", "service_request"]],
  ["aaple_sarkar", "Aaple Sarkar citizen services", "Maharashtra", "https://aaplesarkar.maharashtra.gov.in/en/", ["aaplesarkar.maharashtra.gov.in"], "1800-120-8040", ["state_services", "service_status"]],
  ["mahaonline_rts", "MahaOnline Right to Services", "Maharashtra", "https://aaplesarkar.mahaonline.gov.in/en", ["aaplesarkar.mahaonline.gov.in"], "1800-120-8040", ["rts_services", "application_status"]],
  ["maha_grievances", "Aaple Sarkar grievance redressal", "Maharashtra", "https://grievances.maharashtra.gov.in/en", ["grievances.maharashtra.gov.in"], "1800-120-8040", ["grievance", "grievance_status"]],
  ["mahadbt", "MahaDBT benefit services", "Maharashtra", "https://mahadbtmahait.gov.in/", ["mahadbtmahait.gov.in"], "1800-120-8040", ["benefits", "application_status"]],
  ["maharashtra_gov", "Government of Maharashtra", "Maharashtra", "https://www.maharashtra.gov.in/", ["www.maharashtra.gov.in", "maharashtra.gov.in"], "022-2202-5353", ["government_information"]],
  ["maha_rto", "Maharashtra Transport Department", "Maharashtra", "https://transport.maharashtra.gov.in/", ["transport.maharashtra.gov.in"], "1800-233-001", ["transport_services", "rto_information"]],
  ["mahatranscom", "Maharashtra State Road Transport", "Maharashtra", "https://msrtc.maharashtra.gov.in/", ["msrtc.maharashtra.gov.in"], "1800-22-1250", ["bus_services", "information"]],
  ["pune_municipal", "Pune Municipal Corporation", "Maharashtra", "https://www.pmc.gov.in/", ["www.pmc.gov.in", "pmc.gov.in"], "1800-103-0222", ["municipal_information", "property_tax"]],
  ["pcmc", "Pimpri Chinchwad Municipal Corporation", "Maharashtra", "https://www.pcmcindia.gov.in/", ["www.pcmcindia.gov.in", "pcmcindia.gov.in"], "020-6733-3333", ["municipal_information", "property_tax"]],
  ["mahavitaran_complaints", "MSEDCL complaints", "Maharashtra", "https://wss.mahadiscom.in/wss/wss?uiActionName=getServiceRequestConsumerDetailsLink", ["wss.mahadiscom.in"], "1912", ["grievance", "service_request"]],
  ["merc", "Maharashtra Electricity Regulatory Commission", "Maharashtra", "https://merc.gov.in/", ["merc.gov.in"], "022-6987-6600", ["electricity_regulation", "complaint_information"]],
  ["maha_cgrf", "MSEDCL Consumer Grievance Redressal", "Maharashtra", "https://www.mahadiscom.in/", ["www.mahadiscom.in", "mahadiscom.in"], "1912", ["grievance_information"]],
  ["mahapolice", "Maharashtra Police", "Maharashtra", "https://www.mahapolice.gov.in/", ["www.mahapolice.gov.in", "mahapolice.gov.in"], "112", ["police_information", "complaint_information"]],
  ["mahatraffic", "Maharashtra Traffic Police", "Maharashtra", "https://mahatrafficechallan.gov.in/", ["mahatrafficechallan.gov.in"], "112", ["traffic_challan"]],
  ["maha_cyber", "Maharashtra Cyber", "Maharashtra", "https://mahacyber.gov.in/", ["mahacyber.gov.in"], "1930", ["cyber_complaint", "safety_information"]],
  ["maha_jal", "Maharashtra Jeevan Pradhikaran", "Maharashtra", "https://mjp.maharashtra.gov.in/", ["mjp.maharashtra.gov.in"], "1800-233-2315", ["water_services", "information"]],
  ["maha_agri", "Maharashtra Agriculture Department", "Maharashtra", "https://krishi.maharashtra.gov.in/", ["krishi.maharashtra.gov.in"], "1800-233-4000", ["agriculture_services", "scheme_information"]],
  ["maha_education", "Maharashtra School Education Department", "Maharashtra", "https://education.maharashtra.gov.in/", ["education.maharashtra.gov.in"], "020-2612-2104", ["education_information"]],
  ["maha_health", "Maharashtra Public Health Department", "Maharashtra", "https://arogya.maharashtra.gov.in/", ["arogya.maharashtra.gov.in"], "104", ["health_information"]],
  ["maha_labor", "Maharashtra Labour Department", "Maharashtra", "https://mahakamgar.maharashtra.gov.in/", ["mahakamgar.maharashtra.gov.in"], "022-2657-3847", ["labour_services", "information"]],
  ["maha_revenue", "Maharashtra Revenue Department", "Maharashtra", "https://www.maharashtra.gov.in/", ["www.maharashtra.gov.in", "maharashtra.gov.in"], "020-2612-2104", ["revenue_information"]],
  ["digilocker", "DigiLocker", "India", "https://www.digilocker.gov.in/", ["www.digilocker.gov.in", "digilocker.gov.in"], "1800-300-1031", ["document_services"]],
  ["parivahan", "Parivahan Sewa", "India", "https://parivahan.gov.in/", ["parivahan.gov.in"], "0120-4925505", ["vehicle_services", "driving_licence"]],
  ["echallan", "National e-Challan", "India", "https://echallan.parivahan.gov.in/", ["echallan.parivahan.gov.in"], "0120-4925505", ["traffic_challan"]],
  ["cpgrams", "Centralized Public Grievance Redress", "India", "https://pgportal.gov.in/", ["pgportal.gov.in"], "1800-110-031", ["grievance", "grievance_status"]],
  ["india_portal", "National Portal of India", "India", "https://www.india.gov.in/", ["www.india.gov.in", "india.gov.in"], "1800-111-555", ["government_information"]],
  ["consumer_helpline", "National Consumer Helpline", "India", "https://consumerhelpline.gov.in/", ["consumerhelpline.gov.in"], "1915", ["consumer_complaint", "complaint_status"]],
  ["cybercrime", "National Cyber Crime Reporting Portal", "India", "https://cybercrime.gov.in/", ["cybercrime.gov.in"], "1930", ["cyber_complaint"]],
  ["incometax", "Income Tax e-Filing", "India", "https://www.incometax.gov.in/", ["www.incometax.gov.in", "incometax.gov.in"], "1800-103-0025", ["tax_information"]],
];

export const VERIFIED_PORTALS: OfficialPortal[] = portalSeeds.map(([key, departmentName, state, portalUrl, allowedHostnames, helpline, allowedServices]) => ({
  key,
  departmentName,
  state,
  verifiedDomain: allowedHostnames[0],
  allowedHostnames,
  portalUrl,
  helpline,
  allowedServices,
  lastReviewed: reviewed,
}));
