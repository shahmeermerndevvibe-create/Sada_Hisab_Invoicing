import { create } from "zustand";
import { persist } from "zustand/middleware";

import { invoiceModel } from "@/models/invoiceModel";
import { invoiceItemModel } from "@/models/invoiceItemModel";
import { useSettingsStore } from "@/store/settingsStore";
import { DEFAULT_INVOICE } from "@/constants/invoiceDefaults";

const defaultCountry = "Pakistan";

const countryFieldsFromSettings = (country) => {
  const cs = useSettingsStore.getState().byCountry[country] || {};
  return {
    companyPhone: cs.phoneNo || "",
    companyWebsite: cs.website || "",
    companyLocation: cs.location || "",
    businessNumber: cs.businessNumber || "",
    signatureName: cs.signatureName || "",
    signatureTitle: cs.signatureTitle || "",
    thankYouText: cs.thankYouText || "",
  };
};

const companyFieldsFromSettings = (country) => {
  const settings = useSettingsStore.getState();
  return {
    ...countryFieldsFromSettings(country),
    signatureUrl: settings.signatureUrl || "",
    signaturePublicId: settings.signaturePublicId || "",
  };
};

export const useInvoiceStore = create(
  persist(
    (set) => ({
      invoice: {
        ...invoiceModel,
        ...companyFieldsFromSettings(defaultCountry),
        payment: DEFAULT_INVOICE.paymentNotes,
      },

      items: DEFAULT_INVOICE.items.map((item) => ({ ...item })),

      errors: {},

      payment: "",

      isInvoiceHistoryOpen: false,

      editingInvoiceId: null,

      processing: null,

      setInvoice: (invoice) => set({ invoice }),

      loadInvoiceForEdit: (invoice) => {
        set({ invoice });
        useInvoiceStore.getState().syncCompanyFieldsFromSettings();
      },

      setItems: (items) => set({ items }),

      setEditingInvoiceId: (id) => set({ editingInvoiceId: id }),

      setProcessing: (processing) => set({ processing }),

      openInvoiceHistory: () => set({ isInvoiceHistoryOpen: true }),

      closeInvoiceHistory: () => set({ isInvoiceHistoryOpen: false }),

      toggleInvoiceHistory: () =>
        set((state) => ({ isInvoiceHistoryOpen: !state.isInvoiceHistoryOpen })),

      // Invoice actions
      updateInvoice(field, value) {
        set((state) => {
          return {
            invoice: {
              ...state.invoice,
              [field]: value,
            },
          };
        });
      },

      setErrors(errors) {
        set({
          errors,
        });
      },

      clearItemError(index, field) {
        set((state) => {
          const itemErrors = [...(state.errors.itemErrors || [])];

          if (itemErrors[index]) {
            delete itemErrors[index][field];

            if (Object.keys(itemErrors[index]).length === 0) {
              itemErrors[index] = {};
            }
          }

          return {
            errors: {
              ...state.errors,
              itemErrors,
            },
          };
        });
      },

      clearInvoiceSectionError(field) {
        set((state) => {
          const newErrors = { ...state.errors };
          delete newErrors[field];

          return {
            errors: newErrors,
          };
        });
      },

      resetInvoice() {
        set((state) => {
          const country = state.invoice.country || defaultCountry;
          return {
            invoice: {
              ...invoiceModel,
              ...companyFieldsFromSettings(country),
              payment: DEFAULT_INVOICE.paymentNotes,
              documentCounter: state.invoice.documentCounter,
              documentNumber: state.invoice.documentNumber,
              documentType: state.invoice.documentType,
            },
            items: DEFAULT_INVOICE.items.map((item) => ({ ...item })),
            editingInvoiceId: null,
          };
        });
      },

      syncCompanyFieldsFromSettings() {
        const { invoice } = useInvoiceStore.getState();
        const country = invoice.country || defaultCountry;
        set({
          invoice: {
            ...invoice,
            ...companyFieldsFromSettings(country),
          },
        });
      },

      applyCountrySettings(country) {
        set((state) => ({
          invoice: {
            ...state.invoice,
            country,
            ...countryFieldsFromSettings(country),
          },
        }));
      },

      // Item actions
      addItem() {
        set((state) => ({
          items: [
            ...state.items,
            {
              ...invoiceItemModel,
            },
          ],
        }));
      },

      deleteItem(index) {
        set((state) => ({
          items: state.items.filter((_, i) => i !== index),
        }));
      },

      updateItem(index, field, value) {
        set((state) => {
          return {
            items: state.items.map((item, i) =>
              i === index
                ? {
                    ...item,
                    [field]: value,
                  }
                : item,
            ),
          };
        });
      },


      reorderItems(fromIndex, toIndex) {
        set((state) => {
          const items = [...state.items];
          const [moved] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, moved);
          return { items };
        });
      },

      clearItems() {
        set({
          items: [
            {
              ...invoiceItemModel,
            },
          ],
        });
      },
    }),
    {
      name: "invoice-storage",
      version: 4,
      partialize: (state) => ({
        invoice: state.invoice,
        items: state.items,
      }),
      migrate: (persisted, version) => {
        const invoice = persisted.invoice || {};
        const items = persisted.items || [];
        let updated = { ...persisted };

        if (version < 3) {
          updated = {
            ...updated,
            invoice: {
              ...invoice,
              payment: invoice.payment || DEFAULT_INVOICE.paymentNotes,
            },
            items: items.some((i) => i.product) ? items : DEFAULT_INVOICE.items.map((i) => ({ ...i })),
          };
        }

        if (version < 4) {
          const inv = updated.invoice || {};
          const payment = inv.payment || "";
          if (payment && !payment.includes("<p>")) {
            updated = {
              ...updated,
              invoice: { ...inv, payment: DEFAULT_INVOICE.paymentNotes },
            };
          }
        }

        return updated;
      },
      merge: (persisted, current) => {
        const old = persisted.invoice || {};

        return {
          ...current,
          invoice: {
            ...current.invoice,
            ...old,
            payment: old.payment || current.invoice.payment,
            companyPhone: old.companyPhone ?? current.invoice.companyPhone,
            companyWebsite: old.companyWebsite ?? current.invoice.companyWebsite,
            companyLocation: old.companyLocation ?? current.invoice.companyLocation,
            businessNumber: old.businessNumber ?? current.invoice.businessNumber,
            signatureName: old.signatureName ?? current.invoice.signatureName,
            signatureTitle: old.signatureTitle ?? current.invoice.signatureTitle,
            signatureUrl: old.signatureUrl ?? current.invoice.signatureUrl,
            signaturePublicId: old.signaturePublicId ?? current.invoice.signaturePublicId,
            thankYouText: old.thankYouText ?? current.invoice.thankYouText,
            documentCounter: old.documentCounter ?? old.invoiceCounter ?? current.invoice.documentCounter,
            documentNumber: old.documentNumber ?? (String(old.invoiceNumber ?? "") || current.invoice.documentNumber),
          },
          items: persisted.items?.some((i) => i.product) ? persisted.items : current.items,
        };
      },
    },
  ),
);
