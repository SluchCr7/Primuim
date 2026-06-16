import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";

export function StatCard({ value, label }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.25,
  });

  const numericValue = parseInt(value.replace(/[^0-9]/g, ""));
  const suffix = value.replace(/[0-9]/g, "");

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4 }}
      className="
        group
        relative
        overflow-hidden
        rounded-3xl
        border
        border-card-border
        bg-card-bg/90
        p-7
        backdrop-blur-xl
      "
    >
      {/* Background Accent */}
      <div
        className="
          absolute
          inset-0
          opacity-0
          transition-opacity
          duration-500
          group-hover:opacity-100
        "
      >
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-foreground/5 blur-3xl" />
      </div>

      {/* Top Line */}
      <div className="relative mb-6 flex items-center justify-between">
        <div className="h-px flex-1 bg-card-border" />

        <div
          className="
            mx-4
            h-2
            w-2
            rounded-full
            bg-foreground/50
            transition-all
            duration-300
            group-hover:scale-150
          "
        />

        <div className="h-px flex-1 bg-card-border" />
      </div>

      {/* Number */}
      <div className="relative">
        <h3
          className="
            text-5xl
            font-serif
            font-bold
            tracking-tight
            text-foreground
          "
        >
          {inView ? (
            <CountUp
              end={numericValue}
              duration={2.5}
              separator=","
              suffix={suffix}
            />
          ) : (
            "0"
          )}
        </h3>

        <div
          className="
            mt-4
            h-px
            w-16
            bg-card-border
            transition-all
            duration-300
            group-hover:w-24
          "
        />
      </div>

      {/* Label */}
      <p
        className="
          mt-5
          text-xs
          uppercase
          tracking-[0.28em]
          text-muted
        "
      >
        {label}
      </p>

      {/* Corner Border */}
      <div
        className="
          absolute
          bottom-4
          right-4
          h-8
          w-8
          border-b
          border-r
          border-card-border
          opacity-40
          transition-all
          duration-300
          group-hover:opacity-100
          group-hover:scale-110
        "
      />
    </motion.div>
  );
}