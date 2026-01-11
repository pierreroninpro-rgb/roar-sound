import { useEffect, useState, useRef } from "react";

// Dimensions de référence (mêmes que VideoList)
const BASE_WIDTH_MOBILE = 390;
const BASE_WIDTH_DESKTOP = 1440;

const REFERENCE_VALUES = {
  mobile: {
    horizontalMargin: 15
  },
  desktop: {
    horizontalMargin: 46
  }
};

export default function Navbar() {
  const containerRef = useRef(null);
  const [horizontalMargin, setHorizontalMargin] = useState(15);

  // Calcul des marges fixes (ne changent pas avec la taille de l'écran)
  useEffect(() => {
    const calculateMargin = () => {
      const screenWidth = document.documentElement.clientWidth || window.innerWidth;
      const isMobile = screenWidth <= 820;

      const refValues = isMobile ? REFERENCE_VALUES.mobile : REFERENCE_VALUES.desktop;

      // Marges fixes - ne changent pas proportionnellement
      setHorizontalMargin(refValues.horizontalMargin);
    };

    calculateMargin();

    const handleResize = () => {
      calculateMargin();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-row justify-between mt-[18px] md:mt-[12px] items-center"
      style={{
        paddingLeft: `${horizontalMargin}px`,
        paddingRight: `${horizontalMargin}px`,
        boxSizing: 'border-box'
      }}
    >
      {/* Titre principal */}
      <h1
        onClick={() => window.location.href = "/Projects"}
        className="font-HelveticaNeue font-[500] text-[16px] md:text-[32px] cursor-pointer"
        style={{ fontFamily: "'HelveticaNeue', 'Helvetica', 'Arial', sans-serif" }}
      >
        {/* ✅ ROAR en Medium */}
        <span className="text-[30px] md:text-[50px] font-medium">ROAR </span>
        <span className="text-[16px] md:text-[32px] font-[400]">music </span>
        <span className="text-[12px] md:text-[24px] font-[400]">& </span>
        <span className="text-[16px] md:text-[32px] font-[400]">sound</span>

      </h1>

      {/* ✅ Info en Medium (pas de font-[950]) */}
      <h2
        onClick={() => window.location.href = "/About"}
        className="font-HelveticaNeue font-medium text-[30px] md:text-[50px] cursor-pointer"
        style={{ fontFamily: "'HelveticaNeue', 'Helvetica', 'Arial', sans-serif" }}
      >
        Info
      </h2>
    </div>
  );
}