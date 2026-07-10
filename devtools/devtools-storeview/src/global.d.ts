/** Image assets */
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.svg' {
  const src: string;
  export default src;
}

/**
 * Plain CSS/Sass side-effect imports: `import './file.css'` */
declare module '*.css';
declare module '*.scss';
declare module '*.sass';

/**
 * CSS Modules: `import styles from './file.module.css'` */
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module '*.module.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare global {
  interface Window {
    kernel: Kernel<tAppEM, typeof rootReducer>;
  }
}