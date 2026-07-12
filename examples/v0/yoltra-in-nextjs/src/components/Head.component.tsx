import { default as NextHead } from "next/head";
import { useSearchParams } from "next/navigation";

import { useEffect } from "react";
import { useAtomicProp } from "@/state/yoltra";

export const Head = () => {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") ?? "en";

  const selectedTheme = useAtomicProp("theme", (s) => s.resolved);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.remove("theme-light", "theme-dark");
    document.documentElement.classList.add(`theme-${selectedTheme}`);
    // Drive the Yoltra design-system tokens too — DS switches on `data-theme`.
    document.documentElement.setAttribute("data-theme", selectedTheme);
  }, [selectedTheme]);

    return (
      <NextHead>
        <title>Yoltra in Next.js — Pages Router</title>
        <meta name="description" content="A Next.js App implementing Yoltra as state container" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.svg" />
      </NextHead>
    );
}