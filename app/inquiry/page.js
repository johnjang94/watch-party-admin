import { fetchAdminInquiries } from "../../lib/admin-api";
import { InquiryPage as InquiryView } from "../../components/inquiry-page";

export default async function InquiryRoute() {
  const inquiries = await fetchAdminInquiries();
  return <InquiryView inquiries={inquiries} />;
}
