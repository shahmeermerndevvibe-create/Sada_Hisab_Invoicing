const businessLabel = {
  Australia: "ABN",
  Pakistan: "SECP",
  USA: "Business #",
};

export default function Logo({ invoice }) {
  const country = invoice?.country || "Australia";
  const label = businessLabel[country] || "ABN";
  const number = invoice?.businessNumber || "";

  return (
    <div className="flex flex-col">
      {/* <svg
        className="w-36 h-auto"
        viewBox="0 0 160 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 10H48C72 10 86 23 86 40C86 57 72 70 48 70H12V10Z"
          fill="url(#logoGradient)"
        />

        <path
          d="M30 26V54H46C57 54 64 48 64 40C64 32 57 26 46 26H30Z"
          fill="white"
        />

        <path
          d="M82 10H103L119 55L136 10H158L128 72H108L82 10Z"
          fill="url(#logoGradient)"
        />

        <defs>
          <linearGradient
            id="logoGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop stopColor="#27B3F6" />
            <stop offset="1" stopColor="#0A4A95" />
          </linearGradient>
        </defs>
      </svg> */}

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