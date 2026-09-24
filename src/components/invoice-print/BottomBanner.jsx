export default function BottomBanner() {
  return (
    <div className="absolute bottom-0 left-0 w-full h-[250px] m-0 overflow-hidden">

      {/* Long blue line */}
      <div className="absolute bottom-5 left-0 h-[7px] w-[52%] bg-[#173C8C]" />

      <div className="absolute bottom-[129px] right-0 h-[7px] w-[28%] bg-[#3DA9F5]" />

      {/* Dark tilted block */}
      <div
        className="
          absolute
          bottom-5
          left-[53%]
          h-28
          w-20
          bg-[#173C8C]
          -skew-x-[40deg]
          rounded-t-md
        "
      />

      {/* Light tilted block */}
      <div
        className="
          absolute
          bottom-6
          left-[66%]
          h-28
          w-20
          bg-[#3DA9F5]
          -skew-x-[40deg]
          rounded-t-md
        "
      />

      {/* Main SVG */}
      <svg
  className="absolute right-0 bottom-0 has-[20px] w-[72%]"
  viewBox="0 0 500 70"
  preserveAspectRatio="none"
>
  <defs>
    <linearGradient
      id="grad"
      x1="0%"
      y1="0%"
      x2="100%"
      y2="100%"
    >
      <stop offset="0%" stopColor="#173C8C" />
      <stop offset="100%" stopColor="#248DE4" />
    </linearGradient>
  </defs>

  <path
    d="
      M220 150
      L340 15
      L500 15
      L500 150
      Z
    "
    fill="url(#grad)"
  />
</svg>
    </div>
  );
}