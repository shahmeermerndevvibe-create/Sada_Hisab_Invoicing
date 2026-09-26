const colors = ["text-slate-800", "text-[#4dc2fb]"];

export default function ColorAlternatingText({ text, className = "" }) {
  const words = text.split(/(\s+)/);
  let firstWord = true;

  return (
    <span className={className}>
      {words.map((segment, i) => {
        if (/^\s+$/.test(segment)) {
          return <span key={i}>{segment}</span>;
        }

        const el = (
          <span
            key={i}
            className={firstWord ? "text-slate-800" : "text-[#4dc2fb]"}
          >
            {segment}
          </span>
        );

        firstWord = false;
        return el;
      })}
    </span>
  );
}
