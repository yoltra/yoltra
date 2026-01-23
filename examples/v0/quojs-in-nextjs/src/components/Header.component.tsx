import Image from "next/image";

import { ThemeName } from "@/state/types";
import { useAtomicProp, useEmit } from "@/state/hooks";

import quojsLogo from "../assets/logo.svg";
import quojsLogoDark from "../assets/logo-dark.svg";

export const Header = () => {
  const emit = useEmit();
  const selectedTheme = useAtomicProp({ reducer: "theme", property: "resolved" });


  const setTheme = (t: ThemeName) => {
    emit("theme", "set", { theme: t })
  };

  return (
    <header>
      <Image src={selectedTheme === "dark" ? quojsLogoDark : quojsLogo} width={120} alt={"Quo.js logo"} />
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