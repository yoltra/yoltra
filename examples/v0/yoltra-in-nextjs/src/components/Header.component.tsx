import { Button } from "@yoltra/ds";
import Image from "next/image";

import { useAtomicProp, useEmit } from "@/state/yoltra";

import yoltraLogo from "../assets/logo.png";

export const Header = () => {
  const emit = useEmit();
  const selectedTheme = useAtomicProp("theme", (s) => s.resolved);

  const toggle = () =>
    emit("theme", "set", { theme: selectedTheme === "dark" ? "light" : "dark" });

  return (
    <header className='app-header'>
      <a className='app-header__brand' href='https://yoltra.dev' title='Yoltra'>
        <Image src={yoltraLogo} width={190} height={40} alt='Yoltra' priority />
      </a>

      <Button
        variant='ghost'
        size='sm'
        onClick={toggle}
        aria-label={selectedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={selectedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {selectedTheme === "dark" ? "🌞" : "🌙"}
      </Button>
    </header>
  );
};
