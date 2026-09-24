export default function ProcessingDialog({ processing }) {
  if (!processing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-xl bg-white px-10 py-8 shadow-2xl">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-blue-600" />
        <div className="text-center">
          <p className="text-base font-semibold text-gray-900">{processing.title}</p>
          <p className="mt-1 text-sm text-gray-500">{processing.message}</p>
        </div>
      </div>
    </div>
  );
}
