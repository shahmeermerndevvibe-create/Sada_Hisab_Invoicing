const COLORS = ["text-[#0A4A95]", "text-[#4dc2fb]"];

export default function BillingTableTitle({ text = "" }) {
  const hasDash = text.includes("-");

  // No "-" → alternate colors by word
  if (!hasDash) {
    return (
      <span>
        {text.split(/(\s+)/).map((part, index) => {
          if (/^\s+$/.test(part)) {
            return <span key={index}>{part}</span>;
          }

          const wordIndex = text
            .slice(0, text.indexOf(part, 0))
            .trim()
            .split(/\s+/).filter(Boolean).length;

          return (
            <span key={index} className={COLORS[wordIndex % 2]}>
              {part}
            </span>
          );
        })}
      </span>
    );
  }

  // "-" exists → alternate colors by sections
  const sections = text.split("-");

  return (
    <span>
      {sections.map((section, index) => (
        <span key={index}>
          <span className={COLORS[index % 2]}>{section}</span>

          {index < sections.length - 1 && (
            <span className={COLORS[index % 2]}>-</span>
          )}
        </span>
      ))}
    </span>
  );
}