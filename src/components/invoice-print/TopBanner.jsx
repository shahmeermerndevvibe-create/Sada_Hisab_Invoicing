import { formatDocumentId } from "@/utils/invoiceUtils";

export default function TopBanner({invoice}) {
  const title = (invoice?.documentType || "Invoice").toUpperCase();
  const isInvoice = invoice?.documentType?.toLowerCase() === "invoice";

  return (
    <div
      className="absolute w-[48%]"
      style={{
        top: "29px",
        right: "-4px",
        height: "166px",
        backgroundImage: "url('/HeaderImage.svg')",
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex h-full flex-col items-end justify-center pr-12 text-white">
        <h1
        className={`${
          isInvoice ? "pr-[1rem]" : ""
       } text-white ${isInvoice ? "text-4xl" : "text-3xl"} font-bold tracking-widest`}
      >
         {title}
        </h1>
        <p className={`mt-2 text-sm font-bold tracking-widest pr-22`}>
          # {formatDocumentId(invoice)}
        </p>
      </div>
    </div>
  );
}