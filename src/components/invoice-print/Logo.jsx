const businessLabel = {
  Pakistan: "SECP",
  Australia: "ABN",
  USA: "Business #",
};

export default function Logo({ invoice }) {
  const country = invoice?.country || "Pakistan";
  const label = businessLabel[country] || "SECP";
  const number = invoice?.businessNumber || "";

  return (
    <div className="flex flex-col -ml-3">
      <img
        src="/devvibe.png"
        alt="Logo"
        className="w-36 h-auto"
      />

      <p className="mt-1 text-sm font-bold tracking-wide text-black">
        {label}: <span className="font-medium text-slate-600">{number}</span>
      </p>
    </div>
  );
}
