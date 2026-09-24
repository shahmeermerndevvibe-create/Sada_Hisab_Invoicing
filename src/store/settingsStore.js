import { create } from "zustand";
import { settingsService } from "@/services/InvoiceService";

const COUNTRY_PLACEHOLDERS = {
  Australia: {
    phoneNo: "+61 421 702 706",
    website: "www.devvibe.com",
    location: "10 Leo Ave, Melbourne, Australia, 3029",
    businessNumber: "60733547866",

    signatureName: "Ajmal Jillani",
    signatureTitle: "COO - DevVibe",

    thankYouText: "THANK YOU FOR YOUR PAYMENT",
  },

  Pakistan: {
    phoneNo: "+92 300 1234567",
    website: "www.devvibe.com",
    location: "5 Main Blvd, Karachi, Pakistan",
    businessNumber: "123456789X",

    signatureName: "Ajmal Jillani",
    signatureTitle: "COO - DevVibe",

    thankYouText: "THANK YOU FOR YOUR PAYMENT",
  },

  USA: {
    phoneNo: "+1 212 555 0198",
    website: "www.devvibe.com",
    location: "123 Broadway, New York, NY 10006",
    businessNumber: "12-3456789",

    signatureName: "Ajmal Jillani",
    signatureTitle: "COO - DevVibe",

    thankYouText: "THANK YOU FOR YOUR PAYMENT",
  },
};

const buildDefaultByCountry = () => {
  const byCountry = {};
  for (const [country, defaults] of Object.entries(COUNTRY_PLACEHOLDERS)) {
    byCountry[country] = { ...defaults };
  }
  return byCountry;
};

export const useSettingsStore = create((set, get) => ({
  byCountry: buildDefaultByCountry(),
  signatureUrl: "",
  signaturePublicId: "",
  loaded: false,

  loadSettings: async () => {
    try {
      const data = await settingsService.getSettings();
      if (data) {
        const { updatedAt, ...settings } = data;
        let signatureUrl = settings.signatureUrl || "";
        let signaturePublicId = settings.signaturePublicId || "";

        if (settings.byCountry) {
          const merged = buildDefaultByCountry();
          for (const [country, values] of Object.entries(settings.byCountry)) {
            const {
              signatureUrl: countrySignatureUrl,
              signaturePublicId: countrySignaturePublicId,
              ...rest
            } = values;
            merged[country] = { ...merged[country], ...rest };

            if (!signatureUrl && countrySignatureUrl) {
              signatureUrl = countrySignatureUrl;
              signaturePublicId = countrySignaturePublicId || "";
            }
          }
          set({
            byCountry: merged,
            signatureUrl,
            signaturePublicId,
            loaded: true,
          });
        } else {
          const { updatedAt: _, ...flat } = data;
          if (flat.phoneNo || flat.website || flat.location) {
            const { signatureUrl: flatSignatureUrl, signaturePublicId: flatSignaturePublicId, ...rest } = flat;
            const merged = buildDefaultByCountry();
            for (const country of Object.keys(merged)) {
              merged[country] = { ...merged[country], ...rest };
            }
            set({
              byCountry: merged,
              signatureUrl: flatSignatureUrl || signatureUrl,
              signaturePublicId: flatSignaturePublicId || signaturePublicId,
              loaded: true,
            });
          } else {
            set({ signatureUrl, signaturePublicId, loaded: true });
          }
        }
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }

    const { useInvoiceStore } = await import("@/store/invoiceStore");
    useInvoiceStore.getState().syncCompanyFieldsFromSettings();
  },

updateSettings: (country, fieldOrObject, value) => {
  set((state) => {
    const current = state.byCountry[country] || {};

    const updates =
      typeof fieldOrObject === "string"
        ? { [fieldOrObject]: value }
        : fieldOrObject;

    return {
      byCountry: {
        ...state.byCountry,
        [country]: {
          ...current,
          ...updates,
        },
      },
    };
  });
},

  updateSignature: ({ signatureUrl, signaturePublicId }) =>
    set({
      signatureUrl: signatureUrl || "",
      signaturePublicId: signaturePublicId || "",
    }),

  saveSettings: async () => {
    const { byCountry, signatureUrl, signaturePublicId } = get();
    await settingsService.saveSettings({ byCountry, signatureUrl, signaturePublicId });
  },

  resetSettings: () =>
    set({
      byCountry: buildDefaultByCountry(),
      signatureUrl: "",
      signaturePublicId: "",
    }),
}));