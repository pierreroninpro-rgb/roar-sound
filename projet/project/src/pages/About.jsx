import React from 'react';
import Navbar from '../components/Navbar.jsx';
import { useOrientation } from '../hooks/useOrientation';

const About = () => {
    const isLandscape = useOrientation();
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 820;

    return (
        <div className="w-full h-full scrollbar-hide" style={{ 
            backgroundColor: '#F6F6F6',
            overflow: (isMobile && !isLandscape) ? 'hidden' : 'auto',
            overflowX: 'hidden'
        }}>
            <div className='text-grey-dark'><Navbar /></div>

            <div className='font-HelveticaNeue font-light text-[12px] md:text-[17px] mt-[18px] m-[18px] mt-[0px] text-grey-dark  '>
                {/* Version Mobile */}
                <div className='block md:hidden'>
                    <p className='mb-[18px]'> <span className='font-medium'>ROAR</span> is a Paris-based studio crafting music and sound design for brands, fashion and film. 
                    Past clients include Converse, Ad Council, Giveon, the Kansas City Chiefs and more. </p>
                    <p>Contact: <br></br> Pierre Ronin, Aristide Rosier <br></br> <a href="mailto:hello@roar-sound.com" className="text-grey-dark hover:underline">hello@roar-sound.com</a> <br></br> </p>
                </div>

                {/* Version Desktop */}
                <div className='hidden md:block m-[26px] mt-[0px]'>
                    <p className='mb-[18px]'> <span className='font-medium'>ROAR</span> is a Paris-based studio crafting music and sound design for brands, fashion and film. <br></br>
                    Past clients include Converse, Ad Council, Giveon, the Kansas City Chiefs and more. </p>
                    <p>Contact: <br></br>Pierre Ronin, Aristide Rosier <br></br> <a href="mailto:hello@roar-sound.com" className="text-grey-dark cursor-pointer">hello@roar-sound.com</a> </p>
                </div>
            </div>
        </div>
    );
};

export default About;
