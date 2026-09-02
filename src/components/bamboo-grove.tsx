/**
 * Brush-painted bamboo backdrop that reaches into the wave dividers on either
 * side of its section. The parent section must be relative, must NOT clip its
 * overflow (this wrapper clips itself), and needs a z-index — the divider below
 * belongs to the next section and would otherwise paint over the artwork. The
 * section's content needs its own relative wrapper to paint above it.
 */
export function BambooGrove() {
  return (
    <div
      aria-hidden="true"
      className="between-waves pointer-events-none absolute inset-x-0 -top-12 -bottom-10 overflow-clip text-gold sm:-top-20 sm:-bottom-16 lg:-top-30 lg:-bottom-28"
    >
      <svg
        viewBox="0 0 480 1500"
        preserveAspectRatio="xMinYMin slice"
        className="bamboo-sway absolute top-0 left-0 hidden h-full w-36 md:block lg:w-48 xl:w-64 2xl:w-72 opacity-10"
      >
        <defs>
          <path id="bamboo-left-leaf-a" d="M0 1 C40 -8 118 -16 172 -14 C210 -12 236 -6 252 4 C204 16 118 17 58 11 C34 8 12 5 0 1 Z"/>
          <path id="bamboo-left-leaf-b" d="M0 0 C36 -10 96 -12 138 -4 C158 0 172 8 180 18 C144 16 84 12 40 7 C24 5 10 3 0 0 Z"/>
          <path id="bamboo-left-leaf-c" d="M0 2 C30 -12 76 -18 112 -12 C134 -8 148 -2 156 6 C120 18 66 18 28 12 C16 10 6 6 0 2 Z"/>
          <filter id="bamboo-left-brush" x="-6%" y="-2%" width="112%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.004" numOctaves="3" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="9" />
          </filter>
        </defs>
        <g fill="currentColor" filter="url(#bamboo-left-brush)">
          <path d="M-13.3 -39.5L25.3 -40.5C27.6 48.6 30.2 137.2 33 223.9L-6.1 227.7C-9.3 137.2 -11.7 48.6 -13.3 -39.5Z" opacity="0.6"/>
          <path d="M-13.8 231.1 Q13.6 229.1 41 231.1 Q13.6 232.7 -13.8 231.1 Z" opacity="0.3"/>
          <path d="M-6.7 237.4L34.1 235.6C35.1 324.3 35.8 412.2 36.1 499.1L-1.7 501C-2.6 412.2 -4.2 324.3 -6.7 237.4Z" opacity="0.5"/>
          <path d="M-9.3 504.7 Q17.2 502.7 43.7 504.7 Q17.2 506.3 -9.3 504.7 Z" opacity="0.3"/>
          <path d="M-0.7 509.8L35.1 509C37.6 599.7 37.6 690 35.2 780.6L-3.8 779.8C-4.4 690 -3.3 599.7 -0.7 509.8Z" opacity="0.6"/>
          <path d="M-11.7 784.7 Q15.6 782.7 43 784.7 Q15.6 786.3 -11.7 784.7 Z" opacity="0.3"/>
          <path d="M-2.1 791.7L33.3 786.6C34.6 871.7 34.2 954.2 32.1 1037.8L-8 1035.7C-5.7 954.2 -3.7 871.7 -2.1 791.7Z" opacity="0.5"/>
          <path d="M-16 1041.9 Q12 1039.9 40 1041.9 Q12 1043.5 -16 1041.9 Z" opacity="0.3"/>
          <path d="M-6 1048.8L29.9 1045.4C29.1 1143.5 29.3 1239.8 30.6 1336.9L-10.2 1335.6C-8.7 1239.8 -7.2 1143.5 -6 1048.8Z" opacity="0.6"/>
          <path d="M-18.3 1341.2 Q10.2 1339.2 38.7 1341.2 Q10.2 1342.8 -18.3 1341.2 Z" opacity="0.3"/>
          <path d="M-9 1344L29.4 1348.4C30.7 1397.5 31.4 1448.7 31.7 1499.2L-8.3 1500.8C-8.1 1448.7 -8.3 1397.5 -9 1344Z" opacity="0.6"/>
          <path d="M117 -51.1L183 -48.9C190.4 53 195.2 155.9 197.3 259.1L133.2 258.7C126.1 155.9 120.6 53 117 -51.1Z" opacity="0.9"/>
          <path d="M120.5 263.7 Q165.4 261.7 210.3 263.7 Q165.4 265.3 120.5 263.7 Z" opacity="0.5"/>
          <path d="M133.2 267.1L198 270C201.7 364.2 204.5 459.9 206.6 559.3L138.6 551.8C135.4 459.9 133.6 364.2 133.2 267.1Z" opacity="1"/>
          <path d="M140.9 567.2L204.4 567.8C207.4 672.2 207.6 776.8 205.3 885.2L138.1 877.8C138.2 776.8 139.2 672.2 140.9 567.2Z" opacity="1"/>
          <path d="M124.6 886.9 Q171.6 884.9 218.7 886.9 Q171.6 888.5 124.6 886.9 Z" opacity="0.5"/>
          <path d="M139.3 890.6L203.9 894.1C203.6 987.9 202.9 1083.4 202.2 1177.6L136.9 1180.1C136.7 1083.4 137.5 987.9 139.3 890.6Z" opacity="1"/>
          <path d="M123.9 1184.1 Q169.6 1182.1 215.2 1184.1 Q169.6 1185.7 123.9 1184.1 Z" opacity="0.5"/>
          <path d="M134.1 1192.1L205.1 1186.7C206.5 1288.8 208.2 1388.2 210 1486.4L138.4 1489C136.3 1388.2 134.9 1288.8 134.1 1192.1Z" opacity="0.8"/>
          <path d="M124.2 1491.5 Q174.3 1489.5 224.5 1491.5 Q174.3 1493.1 124.2 1491.5 Z" opacity="0.5"/>
          <path d="M139.4 1492.7L209.5 1497.9C207.8 1496.9 206.9 1498.4 206.6 1498.5L142.6 1501.5C139.5 1498.4 138.4 1496.9 139.4 1492.7Z" opacity="0.8"/>
          <path d="M288.4 -31.5L311.6 -28.5C313.9 54.7 315.9 139.4 317.1 224.2L294.5 223.9C290.9 139.4 288.8 54.7 288.4 -31.5Z" opacity="0.7"/>
          <path d="M290 229.9 Q305.9 227.9 321.8 229.9 Q305.9 231.5 290 229.9 Z" opacity="0.4"/>
          <path d="M294.2 236.8L317.7 234.8C318.9 314.4 318.2 393 315.5 470.5L294.4 472.7C293.9 393 293.8 314.4 294.2 236.8Z" opacity="0.6"/>
          <path d="M294.2 479.3L315.3 478.9C315 571.4 311.4 663.8 304.8 756L281.7 756.3C285.6 663.8 289.8 571.4 294.2 479.3Z" opacity="0.7"/>
          <path d="M276.8 760.9 Q293 758.9 309.2 760.9 Q293 762.5 276.8 760.9 Z" opacity="0.4"/>
          <path d="M281.2 766.9L304.2 764.4C299.5 859.1 293.3 952.4 286.1 1044.8L264.4 1046.9C269 952.4 274.7 859.1 281.2 766.9Z" opacity="0.6"/>
          <path d="M262.9 1056.6L286.5 1054C282.5 1139.1 278 1222.9 273.1 1305.5L252.2 1307.9C252.7 1222.9 256.3 1139.1 262.9 1056.6Z" opacity="0.7"/>
          <path d="M251.5 1316.5L273.2 1315.6C272 1377.4 270.7 1438.7 269.4 1500L248.9 1500C249.1 1438.7 249.9 1377.4 251.5 1316.5Z" opacity="0.7"/>
          <g transform="translate(312 150)">
            <path d="M0 -1.6 Q20 3 40 11.2 L40 12.8 Q20 8.4 0 1.6 Z" transform="rotate(14)" opacity="0.8"/>
            <use href="#bamboo-left-leaf-b" transform="translate(36 8) rotate(36) scale(0.9)" opacity="0.8"/>
            <use href="#bamboo-left-leaf-c" transform="translate(38 12) rotate(66) scale(0.85)" opacity="0.6"/>
            <use href="#bamboo-left-leaf-b" transform="translate(30 12) rotate(84) scale(0.75)" opacity="0.5"/>
            <use href="#bamboo-left-leaf-c" transform="translate(16 2) rotate(-14) scale(0.6)" opacity="0.5"/>
          </g>
          <g transform="translate(186 428)">
            <path d="M0 -1.6 Q31 8 62 21.2 L62 22.8 Q31 13.4 0 1.6 Z" transform="rotate(16)" opacity="0.8"/>
            <use href="#bamboo-left-leaf-a" transform="translate(56 18) rotate(10) scale(0.92)" opacity="0.85"/>
            <use href="#bamboo-left-leaf-a" transform="translate(58 22) rotate(34) scale(0.82)" opacity="0.65"/>
            <use href="#bamboo-left-leaf-b" transform="translate(52 24) rotate(62) scale(0.95)" opacity="0.55"/>
            <use href="#bamboo-left-leaf-c" transform="translate(34 10) rotate(-8) scale(0.7)" opacity="0.55"/>
            <use href="#bamboo-left-leaf-b" transform="translate(48 26) rotate(86) scale(0.7)" opacity="0.45"/>
          </g>
          <g transform="translate(124 648) scale(-1 1)">
            <use href="#bamboo-left-leaf-b" transform="translate(0 0) scale(-1 1) rotate(24) scale(0.75)" opacity="0.55"/>
            <use href="#bamboo-left-leaf-c" transform="translate(4 6) scale(-1 1) rotate(56) scale(0.65)" opacity="0.45"/>
          </g>
          <g transform="translate(314 768)">
            <path d="M0 -1.6 Q20 3 40 11.2 L40 12.8 Q20 8.4 0 1.6 Z" transform="rotate(8)" opacity="0.8"/>
            <use href="#bamboo-left-leaf-b" transform="translate(36 8) rotate(12) scale(0.78)" opacity="0.7"/>
            <use href="#bamboo-left-leaf-c" transform="translate(38 12) rotate(54) scale(0.85)" opacity="0.55"/>
            <use href="#bamboo-left-leaf-a" transform="translate(30 12) rotate(34) scale(0.55)" opacity="0.45"/>
          </g>
          <g transform="translate(194 1032)">
            <path d="M0 -1.6 Q26 6 52 17.2 L52 18.8 Q26 11.4 0 1.6 Z" transform="rotate(14)" opacity="0.8"/>
            <use href="#bamboo-left-leaf-a" transform="translate(48 14) rotate(16) scale(0.9)" opacity="0.75"/>
            <use href="#bamboo-left-leaf-b" transform="translate(50 18) rotate(52) scale(0.85)" opacity="0.55"/>
            <use href="#bamboo-left-leaf-c" transform="translate(36 10) rotate(-8) scale(0.6)" opacity="0.5"/>
            <use href="#bamboo-left-leaf-b" transform="translate(44 22) rotate(80) scale(0.6)" opacity="0.4"/>
          </g>
          <use href="#bamboo-left-leaf-b" transform="translate(364 610) rotate(118) scale(0.55)" opacity="0.4"/>
          <use href="#bamboo-left-leaf-c" transform="translate(268 1270) rotate(96) scale(0.5)" opacity="0.35"/>
        </g>
      </svg>
      <svg
        viewBox="0 0 480 1500"
        preserveAspectRatio="xMaxYMin slice"
        className="bamboo-sway bamboo-sway-late absolute top-0 right-0 hidden h-full w-36 md:block lg:w-48 xl:w-64 2xl:w-72 opacity-10"
      >
        <defs>
          <path id="bamboo-right-leaf-a" d="M0 1 C40 -8 118 -16 172 -14 C210 -12 236 -6 252 4 C204 16 118 17 58 11 C34 8 12 5 0 1 Z"/>
          <path id="bamboo-right-leaf-b" d="M0 0 C36 -10 96 -12 138 -4 C158 0 172 8 180 18 C144 16 84 12 40 7 C24 5 10 3 0 0 Z"/>
          <path id="bamboo-right-leaf-c" d="M0 2 C30 -12 76 -18 112 -12 C134 -8 148 -2 156 6 C120 18 66 18 28 12 C16 10 6 6 0 2 Z"/>
          <filter id="bamboo-right-brush" x="-6%" y="-2%" width="112%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.004" numOctaves="3" seed="19" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="9" />
          </filter>
        </defs>
        <g fill="currentColor" filter="url(#bamboo-right-brush)">
          <path d="M413.4 -49.4L510.6 -50.6C514.4 72.7 515.7 195.4 514.1 313.4L414.8 322.8C413.9 195.4 413.4 72.7 413.4 -49.4Z" opacity="0.9"/>
          <path d="M394.9 321.8 Q464.4 319.8 533.9 321.8 Q464.4 323.4 394.9 321.8 Z" opacity="0.5"/>
          <path d="M417.4 331.6L511.5 319.3C511.2 447.6 510 569.8 508 693.2L413.8 690.7C415.8 569.8 417 447.6 417.4 331.6Z" opacity="1"/>
          <path d="M394.8 697.9 Q460.8 695.9 526.8 697.9 Q460.8 699.5 394.8 697.9 Z" opacity="0.5"/>
          <path d="M411.9 702.2L509.5 705.4C506.7 810.9 503.4 918 499.9 1029.8L407.8 1020.4C408.4 918 409.8 810.9 411.9 702.2Z" opacity="0.8"/>
          <path d="M403.7 1037.2L503.5 1037.2C502.6 1138 500.4 1238.8 497.1 1336.2L400.5 1343.1C401.2 1238.8 402.3 1138 403.7 1037.2Z" opacity="0.9"/>
          <path d="M398.3 1346.8L499 1353.2C498.1 1400 497.4 1450 496.8 1494.9L399.1 1505.1C397.1 1450 396.8 1400 398.3 1346.8Z" opacity="0.8"/>
          <path d="M313.8 -29L346.2 -31C351.6 58.6 355.8 147.1 358.6 237.5L327.2 233.9C323.3 147.1 318.7 58.6 313.8 -29Z" opacity="0.6"/>
          <path d="M328.5 243.9L358.1 247.7C361.4 338.2 363.4 430.7 364.1 522.6L334.7 523.8C333 430.7 330.9 338.2 328.5 243.9Z" opacity="0.6"/>
          <path d="M333.3 532.6L365.5 529.7C364.7 616.7 363 702.3 360.8 788.2L332.7 787.5C332.1 702.3 332.3 616.7 333.3 532.6Z" opacity="0.6"/>
          <path d="M331 794L362.1 798C361.1 892.1 358.4 988.2 354.6 1085L324.7 1083.6C324.3 988.2 326.5 892.1 331 794Z" opacity="0.6"/>
          <path d="M318.7 1089.9 Q339.5 1087.9 360.4 1089.9 Q339.5 1091.5 318.7 1089.9 Z" opacity="0.4"/>
          <path d="M322.9 1096.1L355.9 1095.1C354.2 1182.5 353 1269.4 352.6 1354.6L322.5 1357.9C321 1269.4 321.2 1182.5 322.9 1096.1Z" opacity="0.7"/>
          <path d="M316.5 1360.3 Q337.6 1358.3 358.6 1360.3 Q337.6 1361.9 316.5 1360.3 Z" opacity="0.4"/>
          <path d="M323.2 1364L352.1 1364.8C353.4 1409.6 354.3 1454.8 354.7 1500.4L325.4 1499.6C321.8 1454.8 321.1 1409.6 323.2 1364Z" opacity="0.6"/>
          <path d="M203 -40.9L217 -39.1C217.3 31.5 217.4 102.9 217.1 174.6L202.5 174.2C200.8 102.9 200.9 31.5 203 -40.9Z" opacity="0.6"/>
          <path d="M202.8 186.2L216.7 184.5C217.3 253.1 216.5 320.8 214.1 388.5L200.2 388.4C201.1 320.8 201.9 253.1 202.8 186.2Z" opacity="0.6"/>
          <path d="M199.4 395.4L214.6 397.1C213.3 481.8 210.4 567.4 206 652.7L191.7 653.2C195.4 567.4 198 481.8 199.4 395.4Z" opacity="0.6"/>
          <path d="M188.5 659 Q198.6 657 208.6 659 Q198.6 660.6 188.5 659 Z" opacity="0.3"/>
          <path d="M190.8 665.9L205.8 664.2C203.8 744.7 200 824.3 194.5 902.8L179.2 904.9C183.6 824.3 187.5 744.7 190.8 665.9Z" opacity="0.6"/>
          <path d="M175.9 910.1 Q186.6 908.1 197.3 910.1 Q186.6 911.7 175.9 910.1 Z" opacity="0.3"/>
          <path d="M178.2 916.4L194.3 916.3C189.8 998.7 185.8 1081.2 182.5 1163.1L166 1164.1C169.3 1081.2 173.4 998.7 178.2 916.4Z" opacity="0.5"/>
          <path d="M162.5 1168.4 Q174 1166.4 185.5 1168.4 Q174 1170 162.5 1168.4 Z" opacity="0.3"/>
          <path d="M166.1 1173.1L181.5 1173.2C180.8 1243.8 178 1314.5 173.3 1384.2L159.5 1386.2C160.8 1314.5 163 1243.8 166.1 1173.1Z" opacity="0.5"/>
          <path d="M158.3 1396L174 1393.9C174.1 1430 173.2 1465 171.2 1500.5L156.6 1499.5C154.9 1465 155.5 1430 158.3 1396Z" opacity="0.6"/>
          <g transform="translate(318 226) scale(-1 1)">
            <path d="M0 -1.6 Q23 4 46 13.2 L46 14.8 Q23 9.4 0 1.6 Z" transform="rotate(168)" opacity="0.8"/>
            <use href="#bamboo-right-leaf-b" transform="translate(42 10) scale(-1 1) rotate(14) scale(0.88)" opacity="0.75"/>
            <use href="#bamboo-right-leaf-b" transform="translate(44 14) scale(-1 1) rotate(48) scale(0.8)" opacity="0.6"/>
            <use href="#bamboo-right-leaf-c" transform="translate(30 8) scale(-1 1) rotate(-8) scale(0.66)" opacity="0.5"/>
            <use href="#bamboo-right-leaf-c" transform="translate(40 16) scale(-1 1) rotate(76) scale(0.7)" opacity="0.45"/>
          </g>
          <g transform="translate(412 508) scale(-1 1)">
            <path d="M0 -1.6 Q33 9 66 23.2 L66 24.8 Q33 14.4 0 1.6 Z" transform="rotate(170)" opacity="0.8"/>
            <use href="#bamboo-right-leaf-a" transform="translate(60 18) scale(-1 1) rotate(8) scale(1.02)" opacity="0.85"/>
            <use href="#bamboo-right-leaf-a" transform="translate(62 22) scale(-1 1) rotate(32) scale(0.85)" opacity="0.65"/>
            <use href="#bamboo-right-leaf-b" transform="translate(56 26) scale(-1 1) rotate(58) scale(0.95)" opacity="0.55"/>
            <use href="#bamboo-right-leaf-c" transform="translate(36 10) scale(-1 1) rotate(-8) scale(0.72)" opacity="0.55"/>
            <use href="#bamboo-right-leaf-b" transform="translate(52 28) scale(-1 1) rotate(84) scale(0.68)" opacity="0.45"/>
          </g>
          <g transform="translate(330 872) scale(-1 1)">
            <path d="M0 -1.6 Q21 3 42 11.2 L42 12.8 Q21 8.4 0 1.6 Z" transform="rotate(172)" opacity="0.8"/>
            <use href="#bamboo-right-leaf-b" transform="translate(38 8) scale(-1 1) rotate(12) scale(0.78)" opacity="0.65"/>
            <use href="#bamboo-right-leaf-c" transform="translate(40 12) scale(-1 1) rotate(54) scale(0.82)" opacity="0.5"/>
            <use href="#bamboo-right-leaf-a" transform="translate(32 12) scale(-1 1) rotate(32) scale(0.55)" opacity="0.42"/>
          </g>
          <g transform="translate(198 880) scale(-1 1)">
            <use href="#bamboo-right-leaf-b" transform="translate(0 2) scale(-1 1) rotate(10) scale(0.62)" opacity="0.6"/>
            <use href="#bamboo-right-leaf-c" transform="translate(2 6) scale(-1 1) rotate(48) scale(0.58)" opacity="0.48"/>
            <use href="#bamboo-right-leaf-c" transform="translate(-2 0) scale(-1 1) rotate(-16) scale(0.5)" opacity="0.42"/>
          </g>
          <g transform="translate(418 1182) scale(-1 1)">
            <path d="M0 -1.6 Q27 6 54 17.2 L54 18.8 Q27 11.4 0 1.6 Z" transform="rotate(168)" opacity="0.8"/>
            <use href="#bamboo-right-leaf-a" transform="translate(50 16) scale(-1 1) rotate(20) scale(0.88)" opacity="0.7"/>
            <use href="#bamboo-right-leaf-b" transform="translate(52 20) scale(-1 1) rotate(56) scale(0.78)" opacity="0.5"/>
            <use href="#bamboo-right-leaf-c" transform="translate(38 12) scale(-1 1) rotate(-6) scale(0.6)" opacity="0.45"/>
          </g>
          <use href="#bamboo-right-leaf-b" transform="translate(130 706) rotate(64) scale(0.52)" opacity="0.38"/>
        </g>
      </svg>
      <svg viewBox="0 0 260 560" className="bamboo-sway absolute top-0 right-0 w-32 opacity-10 md:hidden">
        <defs>
          <path id="bamboo-corner-leaf-a" d="M0 1 C40 -8 118 -16 172 -14 C210 -12 236 -6 252 4 C204 16 118 17 58 11 C34 8 12 5 0 1 Z"/>
          <path id="bamboo-corner-leaf-b" d="M0 0 C36 -10 96 -12 138 -4 C158 0 172 8 180 18 C144 16 84 12 40 7 C24 5 10 3 0 0 Z"/>
          <path id="bamboo-corner-leaf-c" d="M0 2 C30 -12 76 -18 112 -12 C134 -8 148 -2 156 6 C120 18 66 18 28 12 C16 10 6 6 0 2 Z"/>
          <filter id="bamboo-corner-brush" x="-6%" y="-2%" width="112%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.004" numOctaves="3" seed="19" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="9" />
          </filter>
          <linearGradient id="bamboo-corner-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="white" />
            <stop offset="0.86" stopColor="white" />
            <stop offset="1" stopColor="black" />
          </linearGradient>
          <mask id="bamboo-corner-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="260" height="560">
            <rect width="260" height="560" fill="url(#bamboo-corner-fade)" />
          </mask>
        </defs>
        <g fill="currentColor" filter="url(#bamboo-corner-brush)" mask="url(#bamboo-corner-mask)">
          <path d="M206.9 -30L229.1 -30C231.7 28.5 231.5 87 227.7 146.8L202.7 144.2C203.1 87 204.3 28.5 206.9 -30Z" opacity="0.9"/>
          <path d="M202.6 153.5L227.2 152.2C222.4 221.1 216.3 289.2 209.8 357.7L185.6 357.2C192.9 289.2 198.9 221.1 202.6 153.5Z" opacity="0.8"/>
          <path d="M180.2 362.2 Q197.2 360.2 214.2 362.2 Q197.2 363.8 180.2 362.2 Z" opacity="0.5"/>
          <path d="M185.6 366.1L207.9 367.8C202 431.3 197.3 495.6 194.5 561.2L171.1 558.8C174.5 495.6 179.4 431.3 185.6 366.1Z" opacity="0.7"/>
          <g transform="translate(206 138) scale(-1 1)">
            <path d="M0 -1.6 Q17 2 34 9.2 L34 10.8 Q17 7.4 0 1.6 Z" transform="rotate(170)" opacity="0.8"/>
            <use href="#bamboo-corner-leaf-b" transform="translate(30 6) scale(-1 1) rotate(12) scale(0.6)" opacity="0.8"/>
            <use href="#bamboo-corner-leaf-c" transform="translate(32 10) scale(-1 1) rotate(52) scale(0.62)" opacity="0.6"/>
            <use href="#bamboo-corner-leaf-a" transform="translate(24 8) scale(-1 1) rotate(32) scale(0.42)" opacity="0.5"/>
          </g>
          <g transform="translate(192 352) scale(-1 1)">
            <use href="#bamboo-corner-leaf-c" transform="translate(0 0) scale(-1 1) rotate(24) scale(0.55)" opacity="0.6"/>
            <use href="#bamboo-corner-leaf-b" transform="translate(2 4) scale(-1 1) rotate(60) scale(0.5)" opacity="0.45"/>
          </g>
        </g>
      </svg>
    </div>
  );
}
