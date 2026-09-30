import type { AppProps } from "next/app";

// The design system's own stylesheets, one per component this application renders. `themeCss()` in
// `_document.tsx` emits the custom properties and nothing else, so without these `Button`, `Badge`,
// `Callout` and `CodeBlock` render as bare elements carrying class names nothing defines.
//
// `base-no-root` rather than `base`: this application sets its own 10px root in
// `styles/base/_reset.scss`, and that is the case the no-root variant exists for. It still brings
// `.yl-root` and `.yl-container`, both of which the layout uses.
import "@yoltra/ds/styles/base-no-root.css";
import "@yoltra/ds/styles/button.css";
import "@yoltra/ds/styles/badge.css";
import "@yoltra/ds/styles/callout.css";
import "@yoltra/ds/styles/codeblock.css";
import "@yoltra/ds/styles/typography.css";

import "../styles/main.scss";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
