import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const EnterButton = ({ show }) => {
  const enterButtonRef = useRef(null);

  useEffect(() => {
    if (show && enterButtonRef.current) {
      // S'assurer que le bouton est initialement invisible
      gsap.set(enterButtonRef.current, { opacity: 0, y: 20 });
      // Animer avec le délai
      gsap.to(enterButtonRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 1.3,
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
          transform: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'none';
        }}
        onClick={() => (window.location.href = '/Projects')}
      >
        Enter
      </button>
    </div>
  );
};

export default EnterButton;
