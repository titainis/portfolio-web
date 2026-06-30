import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface RotatingTextProps {
  words: string[];
  interval?: number;
  className?: string;
}

function RotatingText({ words, interval = 2500, className }: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIndex((prev) => (prev === words.length - 1 ? 0 : prev + 1));
    }, interval);
    return () => clearTimeout(timeoutId);
  }, [index, words.length, interval]);

  return (
    <span
      className={`relative inline-flex overflow-hidden pb-1 ${className ?? ""}`}
    >
      {/* Invisible sizer: the longest word holds the inline box open so the
          absolutely-positioned animated words have a width/height to occupy.
          Without an in-flow child, `inline-flex` collapses to 0 and the
          `overflow-hidden` would clip every word out of existence. */}
      <span className="invisible whitespace-nowrap" aria-hidden>
        {words.reduce((a, b) => (b.length > a.length ? b : a), "")}
      </span>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="absolute left-0 top-0 whitespace-nowrap"
          initial={{ opacity: 0, y: "-100%" }}
          transition={{ type: "spring", stiffness: 50 }}
          animate={
            index === i
              ? { y: 0, opacity: 1 }
              : { y: index > i ? "-150%" : "150%", opacity: 0 }
          }
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export { RotatingText };
