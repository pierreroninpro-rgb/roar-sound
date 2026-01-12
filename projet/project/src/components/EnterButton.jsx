import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const EnterButton = ({ show }) => {
  const enterButtonRef = useRef(null);

  useEffect(() => {
    if (show && enterButtonRef.current) {
      // S'assurer que le bouton est initialement invisible
      gsap.set(enterButtonRef.current, { opacity: 0, y: 0 });
      // Animer immédiatement sans délai pour éviter la page blanche
      gsap.to(enterButtonRef.current, {
        opacity: 1,
        y: 0,
        duration: 0,
        delay: 0,
      });
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-[100] pointer-events-auto">
      <button
        ref={enterButtonRef}
        className="font-HelveticaNeue font-[400] text-[16px] md:text-[30px] text-custom-grey cursor-pointer"
        style={{
          fontFamily: "'HelveticaNeue', 'Helvetica', 'Arial', sans-serif",
          transition: 'none',
          transform: 'none',
          pointerEvents: 'auto'
        }}
        onClick={() => (window.location.href = '/Projects')}
      >
        Enter
      </button>
    </div>
  );
};

export default EnterButton;
