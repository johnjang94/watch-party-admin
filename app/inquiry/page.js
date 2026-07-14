"use client";

import { useEffect, useState } from "react";
import { fetchAdminInquiries } from "../../lib/admin-api";
import { InquiryPage as InquiryView } from "../../components/inquiry-page";

export default function InquiryRoute() {
  const [inquiries, setInquiries] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInquiries() {
      const nextInquiries = await fetchAdminInquiries();
      if (!cancelled) {
        setInquiries(nextInquiries);
      }
    }

    void loadInquiries();

    return () => {
      cancelled = true;
    };
  }, []);

  return <InquiryView inquiries={inquiries ?? []} isLoading={inquiries === null} />;
}
