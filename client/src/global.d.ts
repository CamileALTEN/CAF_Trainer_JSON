declare module '*.json';



// Toujours utile : autoriser l’import de highlight.js/lib/languages/*
declare module 'highlight.js/lib/languages/*';

// Support for <marquee>
declare namespace JSX {
  interface IntrinsicElements {
    marquee: React.DetailedHTMLProps<React.HTMLAttributes<HTMLMarqueeElement>, HTMLMarqueeElement>;
  }
}

