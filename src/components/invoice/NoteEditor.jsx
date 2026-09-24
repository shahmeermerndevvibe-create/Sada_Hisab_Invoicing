import {
  Editor,
  EditorProvider,
  Toolbar,
  BtnBold,
  BtnItalic,
  BtnUnderline,
  BtnStrikeThrough,
  BtnBulletList,
  BtnNumberedList,
  BtnLink,
  BtnUndo,
  BtnRedo,
  BtnClearFormatting,
} from "react-simple-wysiwyg";
import { useInvoiceStore } from "@/store/invoiceStore";

export default function NoteEditor() {
  const notes = useInvoiceStore((state) => state.invoice.notes);
  const updateInvoice = useInvoiceStore((state) => state.updateInvoice);

  return (
    <div className="note-editor w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow focus-within:shadow-md focus-within:border-slate-300">
      <EditorProvider>
        <Editor
          value={notes}
          onChange={(e) => updateInvoice("notes", e.target.value)}
        >
          <Toolbar className="flex flex-wrap items-center gap-0.5 border-b border-slate-300 bg-white px-3 py-2">
            <BtnUndo />
            <BtnRedo />

            <span className="mx-1 h-5 w-px bg-slate-200" />

            <BtnBold />
            <BtnItalic />
            <BtnUnderline />
            <BtnStrikeThrough />

            <span className="mx-1 h-5 w-px bg-slate-200" />

            <BtnBulletList />
            <BtnNumberedList />

            <span className="mx-1 h-5 w-px bg-slate-200" />

            <BtnLink />

            <span className="mx-1 h-5 w-px bg-slate-200" />

            <BtnClearFormatting />
          </Toolbar>
        </Editor>
      </EditorProvider>
    </div>
  );
}
