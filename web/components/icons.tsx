import type { SVGProps } from "react";

/* Jeu d'icônes du site : tracé simple, épaisseur réglée par le CSS. */

type P = SVGProps<SVGSVGElement>;

const Svg = (props: P & { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props} />
);

export const IconMoon = (p: P) => (
  <Svg {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
  </Svg>
);

export const IconSun = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
  </Svg>
);

export const IconGlobe = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3.5 9h17M3.5 15h17M12 3a16 16 0 0 0 0 18M12 3a16 16 0 0 1 0 18" />
  </Svg>
);

export const IconMenu = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconClose = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const IconList = (p: P) => (
  <Svg {...p}>
    <path d="M4 6.5h16M4 12h16M4 17.5h10" />
  </Svg>
);

export const IconMail = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 7.5h17v11h-17z" />
    <path d="M3.5 8l8.5 6 8.5-6" />
  </Svg>
);

export const IconPhone = (p: P) => (
  <Svg {...p}>
    <path d="M5 4h4l1.6 4-2.2 1.6a11.5 11.5 0 0 0 6 6L16 13.4 20 15v4a1 1 0 0 1-1.1 1A15.5 15.5 0 0 1 4 5.1A1 1 0 0 1 5 4z" />
  </Svg>
);

export const IconWhatsapp = (p: P) => (
  <Svg {...p}>
    <path d="M20 11.8a8 8 0 0 1-11.9 7L4 20l1.2-4a8 8 0 1 1 14.8-4.2z" />
    <path d="M8.8 9.2c0 3 2.2 5.2 5.2 5.2" />
  </Svg>
);

export const IconPin = (p: P) => (
  <Svg {...p}>
    <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.4" />
  </Svg>
);

export const IconCap = (p: P) => (
  <Svg {...p}>
    <path d="M3 8.5 12 4l9 4.5-9 4.5z" />
    <path d="M7 11v4.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V11" />
  </Svg>
);

export const IconCase = (p: P) => (
  <Svg {...p}>
    <path d="M4 7.5h16v12H4z" />
    <path d="M9 7.5V6a3 3 0 0 1 6 0v1.5M4 12.5h16" />
  </Svg>
);

export const IconClock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const IconBox = (p: P) => (
  <Svg {...p}>
    <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" />
    <path d="M4 7.5 12 12l8-4.5M12 12v9" />
  </Svg>
);

export const IconDownload = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" />
    <path d="M4.5 17.5v2a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-2" />
  </Svg>
);

export const IconExternal = (p: P) => (
  <Svg {...p}>
    <path d="M14 4h6v6M20 4l-8.5 8.5" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Svg>
);

export const IconChevron = (p: P) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

export const IconCheck = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.3 12.2l2.5 2.5 4.9-5.2" />
  </Svg>
);

export const IconWarn = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.8v4.6M12 15.9v.3" />
  </Svg>
);

export const IconSend = (p: P) => (
  <Svg {...p}>
    <path d="M20.5 3.5 10.8 13.2M20.5 3.5l-6.4 17-3.3-7.3-7.3-3.3z" />
  </Svg>
);
