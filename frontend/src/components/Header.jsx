import { Images } from "../assets/";
import { useTheme } from "../helpers/ThemeContext";

const Header = ({ driverObj, isTourActive, setIsTourActive }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className={`sticky top-0 left-0 ${
        isTourActive ? "z-99999999999" : "z-99"
      } w-full`}
    >
      {/* Dark overlay */}
      <div
        className={`${
          isTourActive ? "absolute" : "hidden"
        } inset-0 bg-black/50 pointer-events-none w-full h-full z-50`}
      />

      {/* Header */}
      <div
        className={`flex justify-between items-center w-full px-10 py-5 transition ${
          theme === "dark" ? "bg-black" : "bg-offwhite"
        }`}
      >
        <a href="/">
          <img src={Images.MAIN_LOGO} alt="Logo Ouidoo SA" className="w-60" />
        </a>

        <div className="flex items-center gap-7">
          <svg
            viewBox="0 0 24 24"
            fill={`${theme === "dark" ? "yellow" : "none"}`}
            stroke={`${theme === "dark" ? "yellow" : "black"}`}
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 cursor-pointer hover:scale-110 transition"
            onClick={toggleTheme}
          >
            <g id="SVGRepo_iconCarrier">
              <path
                d="M3.32031 11.6835C3.32031 16.6541 7.34975 20.6835 12.3203 20.6835C16.1075 20.6835 19.3483 18.3443 20.6768 15.032C19.6402 15.4486 18.5059 15.6834 17.3203 15.6834C12.3497 15.6834 8.32031 11.654 8.32031 6.68342C8.32031 5.50338 8.55165 4.36259 8.96453 3.32996C5.65605 4.66028 3.32031 7.89912 3.32031 11.6835Z"
                // stroke="#000000"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </g>
          </svg>

          <svg
            id="infos"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            fill="#e73a84"
            stroke="#e73a84"
            onClick={() => {
              driverObj.drive();
              setIsTourActive(true);
            }}
            className="w-8 h-8 cursor-pointer hover:scale-110 transition"
          >
            <g id="icons_Q2" data-name="icons Q2">
              <path d="M24,2A22,22,0,1,0,46,24,21.9,21.9,0,0,0,24,2Zm0,40A18,18,0,1,1,42,24,18.1,18.1,0,0,1,24,42Z"></path>
              <path d="M24,20a2,2,0,0,0-2,2V34a2,2,0,0,0,4,0V22A2,2,0,0,0,24,20Z"></path>
              <circle cx="24" cy="14" r="2"></circle>
            </g>
          </svg>
        </div>
      </div>
    </header>
  );
};

export default Header;
