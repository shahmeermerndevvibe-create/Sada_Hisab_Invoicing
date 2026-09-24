import { invoiceItemModel } from "@/models/invoiceItemModel";

export const DEFAULT_INVOICE = {
  paymentNotes: `<p><b>Bank Name:</b> Standard Chartered Bank</p>
<p><b>Account Name:</b> DEV VIBE (PRIVATE) LIMITED</p>
<p><b>Account No:</b> 01702858901PKR</p>
<p><b>IBAN:</b> PK60SCBL0000001702858901</p>`,

  items: [
    {
      ...invoiceItemModel,
      product: "One-time Setup Fee - FBR POS Digital Invoicing",
    },
    {
      ...invoiceItemModel,
      product: "Starter-Plan - Plan Monthly Subscription - FBR POS",
    },
  ],
};
