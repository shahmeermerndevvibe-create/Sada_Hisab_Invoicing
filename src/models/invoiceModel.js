import { getTodayDateString } from "@/utils/dateUtils";

export const invoiceModel = {
  documentNumber: "1001",
  documentCounter: 1001,
  documentType: "Invoice",
  documentYear: new Date().getFullYear().toString().slice(-2),
  documentSuffix: "",

  customer: "",
  customerEmail: "",
  contactPersonPhone: "",
  billingAddress: "",

  businessName: "",
  businessEmail: "",
  businessAddress: "",

  invoiceDate: getTodayDateString(),
  dueDate: "",

  currency: {
    code: "PKR",
    symbol: "Rs",
  },

  country: "Australia",
  businessNumber: "",

  subtotal: 0,
  discount: 0,
  discountType: "fixed",
  offerDiscount: 0,
  offerDiscountType: "fixed",
  offers: [],
  itemDiscountLabel: "Item Discounts",
  offerDiscountLabel: "Offer Discount",
  invoiceDiscountLabel: "Discount",
  total: 0,
  balanceDue: 0,
  notes: "",
  phoneNo: "",
  companyPhone: "",
  companyWebsite: "",
  companyLocation: "",
  signatureName: "",
  signatureUrl: "",
  signaturePublicId: "",
  signatureTitle: "",
  thankYouText: "",
  createdAt: new Date().toISOString(),
  payment: "",
  contractType: "Fixed",
  isDraft: false,
  draftType: null,
};
