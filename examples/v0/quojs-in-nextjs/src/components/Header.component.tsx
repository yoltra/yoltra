import Image from "next/image";

import { ThemeName } from "@/state/types";
import { useAtomicProp, useDispatch } from "@/state/hooks";

import quojsLogo from "../assets/logo.svg";

export const Header = () => {
  const dispatch = useDispatch();
  const selectedTheme = useAtomicProp({ reducer: "theme", property: "resolved" });


  const setTheme = (t: ThemeName) => {
    dispatch("theme", "set", { theme: t })
  };

  return (
    <header>
      <Image src={quojsLogo} alt={"quojs logo"} width={120} />
      <nav>
        {
          selectedTheme === "light" ?
          <span
            onClick={() => setTheme("dark")}
            title={"Switch to Dark mode"}
          >🌙</span>: <span
            onClick={() => setTheme("light")}
            title={"Switch to Light mode"}
          >🌞</span>
        }
      </nav>
    </header>
  );
}