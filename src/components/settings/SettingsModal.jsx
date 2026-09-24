import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/store/settingsStore";
import { useInvoiceStore } from "@/store/invoiceStore";
import toast from "react-hot-toast";
import SignatureUploader from "@/components/settings/SignatureUploader"

export default function SettingsModal({ onClose }) {
  const byCountry = useSettingsStore((s) => s.byCountry);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const saveSettings = useSettingsStore((s) => s.saveSettings);
  const invoiceCountry = useInvoiceStore((s) => s.invoice.country);
  const applyCountrySettings = useInvoiceStore((s) => s.applyCountrySettings);
  const [saving, setSaving] = useState(false);
  const current = byCountry[invoiceCountry] || {};
  const phoneNo = current.phoneNo || "";
  const website = current.website || "";
  const location = current.location || "";
  const businessNumber = current.businessNumber || "";
  const signatureName = current.signatureName || "";
  const signatureTitle = current.signatureTitle || "";
  const thankYouText = current.thankYouText || "";
  const ph = {
    phone: phoneNo || "+61 421 702 706",
    location: location || "10 Leo Ave, Melbourne, Australia, 3029",
  };

  const handleCountryChange = (value) => {
    applyCountrySettings(value);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleDone = async () => {
    try {
      setSaving(true);
      await saveSettings();
      const invoiceStore = useInvoiceStore.getState();
      if (invoiceStore.editingInvoiceId) {
        invoiceStore.syncCompanyFieldsFromSettings();
      } else {
        invoiceStore.applyCountrySettings(invoiceStore.invoice.country);
      }
      toast.success("Settings saved successfully!");
      onClose();
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-4 flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Contact Info
            </h3>
          <div className="flex gap-5">
           <div className="space-y-2 ">
              <Label>Country</Label>
              <Select
                value={invoiceCountry}
                onValueChange={handleCountryChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Pakistan">Pakistan</SelectItem>
                  <SelectItem value="USA">USA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-1/2">
              <Label>Business Number</Label>
              <Input
                value={businessNumber}
                onChange={(e) =>
                  updateSettings(invoiceCountry, "businessNumber", e.target.value)
                }
                placeholder="60733547866"
              />
            </div>  
          </div> 
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={phoneNo}
                onChange={(e) =>
                  updateSettings(invoiceCountry, "phoneNo", e.target.value)
                }
                placeholder={ph.phone}
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={website}
                onChange={(e) =>
                  updateSettings(invoiceCountry, "website", e.target.value)
                }
                placeholder="www.devvibe.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={location}
                onChange={(e) =>
                  updateSettings(invoiceCountry, "location", e.target.value)
                }
                placeholder={ph.location}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Signature
            </h3>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={signatureName}
                onChange={(e) =>
                  updateSettings(
                    invoiceCountry,
                    "signatureName",
                    e.target.value,
                  )
                }
                placeholder="Ajmal Jillani"
              />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={signatureTitle}
                onChange={(e) =>
                  updateSettings(
                    invoiceCountry,
                    "signatureTitle",
                    e.target.value,
                  )
                }
                placeholder="COO - DevVibe"
              />
            </div>

            <div className="space-y-2">
              <Label>Signature Image</Label>

              <SignatureUploader />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Thank You Text</Label>
            <Input
              value={thankYouText}
              onChange={(e) =>
                updateSettings(invoiceCountry, "thankYouText", e.target.value)
              }
              placeholder="THANK YOU FOR YOUR PAYMENT"
            />
          </div>
        </div>

        <div className="flex justify-end border-t px-6 py-4">
          <Button onClick={handleDone} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Done"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
