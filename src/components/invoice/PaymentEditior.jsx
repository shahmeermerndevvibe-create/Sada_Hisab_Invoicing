import {
  Editor,
  EditorProvider,
  Toolbar,
  BtnBold,
  BtnLink,
} from "react-simple-wysiwyg";
import { useInvoiceStore } from "@/store/invoiceStore";

export default function PaymentEditior() {
  const payment = useInvoiceStore((state) => state.invoice.payment);
  const updateInvoice = useInvoiceStore((state) => state.updateInvoice);

  return (
    <div className="note-editor w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow focus-within:shadow-md focus-within:border-slate-300">
      <EditorProvider>
        <Editor
          value={payment}
          onChange={(e) => updateInvoice("payment", e.target.value)}
        >
          <Toolbar className="flex flex-wrap items-center gap-0.5 border-b border-slate-300 bg-white px-3 py-2">
            <BtnBold />
            <BtnLink />
          </Toolbar>
        </Editor>
      </EditorProvider>
    </div>
  );
}
