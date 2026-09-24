import { Globe, MapPin, Phone } from "lucide-react";

export default function BillingFooter({ isLastPage = true, invoice = {} }) {
  const phoneNo = invoice.companyPhone || "";
  const website = invoice.companyWebsite || "";
  const location = invoice.companyLocation || "";
  const signatureName = invoice.signatureName || "";
  const signatureTitle = invoice.signatureTitle || "";
  const signatureUrl = invoice.signatureUrl || "";

  return (
    <footer className="print-footer relative">
      <div
        className="relative z-10 px-8 pb-11 pt-3 md:px-14"
        style={{ bottom: "40px" }}
      >
        {/* Contact + Signature — same row */}
        <div
          className={`mb-5 flex items-center ${
            isLastPage ? "justify-between gap-6" : "justify-center"
          }`}
        >
          {/* Contact Information */}
          <div className={`flex min-w-0 flex-1 items-center gap-4 ${!isLastPage ? "justify-center" : ""}`}>
            {/* Phone */}
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="shrink-0 rounded-full bg-[#173C8C] p-1 text-white">
                <Phone size={11} />
              </div>

              <span className="whitespace-nowrap text-[10px] font-semibold">
                {phoneNo}
              </span>
            </div>

            {/* Website */}
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="shrink-0 rounded-full bg-[#3DA9F5] p-1 text-white">
                <Globe size={11} />
              </div>

              <span className="whitespace-nowrap text-[10px] font-semibold">
                {website}
              </span>
            </div>

            {/* Location */}
            <div className="flex min-w-0 max-w-[260px] items-center gap-1.5">
              <div className="shrink-0 rounded-full bg-[#173C8C] p-1 text-white">
                <MapPin size={11} />
              </div>

              <span className="min-w-0 break-words text-[10px] font-semibold leading-4">
                {location}
              </span>
            </div>
          </div>

          {/* Signature */}
          {isLastPage && (
            <div className="w-44 shrink-0 self-center text-center">
              {/* Signature Image */}
              <div className="flex h-16 items-center justify-center">
                {signatureUrl ? (
                  <img
                    src={signatureUrl}
                    alt="Signature"
                    className="h-14 w-40 object-contain"
                  />
                ) : (
                  <div className="h-14" />
                )}
              </div>

              {/* Divider */}
              <div className="border-t-[1.5px] border-slate-300 pt-1.5">
                <h3 className="text-[12px] font-bold text-slate-900">
                  {signatureName}
                </h3>

                <p className="text-[9px] font-semibold text-slate-600">
                  {signatureTitle}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Branding — last page only */}
        {isLastPage && (
          <div className="absolute bottom-0 left-5 z-20 flex flex-col items-start">
            <h2 className="text-xl font-black uppercase whitespace-nowrap">
              <span className="text-slate-900">
                THANKS FOR{" "}
                <span className="text-[#43c3f3]">PARTNERING</span> WITH US
              </span>
            </h2>

            <div className="mt-1.5 flex items-center gap-2">
              <img
                src="/sada_hisab2.png"
                alt="Sada Hisab"
                className="h-5 w-auto"
              />

              <span className="text-[10px] font-medium text-slate-500">
                A Product of DevVibe
              </span>
            </div>
          </div>
        )}
      </div>

      <img
        src="/InvoiceFooter.svg"
        alt=""
        className="absolute bottom-0 left-1 h-auto max-h-[110px] w-full object-contain"
      />
    </footer>
  );
}
