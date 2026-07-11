import { Html, Head, Main, NextScript } from "next/document";
import { themeCss } from "@yoltra/ds";

export default function Document() {
  return (
    <Html lang="en" className="theme-dark" data-theme="dark">
      <Head>
        {/* Yoltra design-system stylesheet — injected once as critical CSS so the
            --yl-* tokens and primitive styles are present on first paint. */}
        <style data-yoltra-ds dangerouslySetInnerHTML={{ __html: themeCss() }} />
      </Head>
      <body className="yl-root">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
