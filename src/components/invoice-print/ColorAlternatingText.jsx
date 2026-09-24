const colors = ["text-slate-800", "text-[#4dc2fb]"];

export default function ColorAlternatingText({ text, className = "" }) {
  const words = text.split(/(\s+)/);
  let colorIndex = 0;

  return (
    <span className={className}>
      {words.map((segment, i) => {
        if (/^\s+$/.test(segment)) {
          return <span key={i}>{segment}</span>;
        }
        const el = (
          <span key={i} className={colors[colorIndex % 2]}>
            {segment}
          </span>
        );
        colorIndex++;
        return el;
      })}
    </span>
  );
}
