import { useTheme } from "../helpers/ThemeContext";

const Title = () => {
  const { theme } = useTheme();

  return (
    <h1
      className={`font-semibold text-6xl text-pink/90 rounded-lg shadow-xl border-2 border-pink/70 p-7 mb-10 transition ${
        theme === "dark" ? "bg-black/25" : "bg-offwhite/80"
      }`}
    >
      Revue de factures
    </h1>
  );
};

export default Title;
