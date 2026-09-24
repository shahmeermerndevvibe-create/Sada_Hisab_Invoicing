import { useRef, useState } from "react";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/services/cloudinary/ uploadImage"
import { useSettingsStore } from "@/store/settingsStore";
import toast from "react-hot-toast";

export default function SignatureUploader() {
  const inputRef = useRef(null);

  const updateSignature = useSettingsStore((s) => s.updateSignature);

  const signatureUrl = useSettingsStore((s) => s.signatureUrl);

  const [uploading, setUploading] = useState(false);

  const handleSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      const image = await uploadImage(file, {
        folder: "opticpro/signatures",
      });

      updateSignature({
        signatureUrl: image.url,
        signaturePublicId: image.publicId,
      });

      toast.success("Signature uploaded");
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    updateSignature({ signatureUrl: "", signaturePublicId: "" });
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={handleSelect}
      />

      {signatureUrl ? (
        <div className="relative rounded-lg border bg-slate-50 p-4">
          <img
            src={signatureUrl}
            alt="Signature"
            className="mx-auto h-24 object-contain"
          />

          <Button
            size="icon"
            variant="destructive"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={removeImage}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 transition hover:border-blue-500 hover:bg-slate-50"
        >
          {uploading ? (
            <>
              <Loader2 className="mb-2 h-6 w-6 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mb-2 h-6 w-6 text-slate-500" />
              <span className="text-sm font-medium">
                Upload Signature
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}