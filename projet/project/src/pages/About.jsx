import React from 'react';

import Navbar from '../components/Navbar.jsx';

const About = () => {
    return (
        <div className="w-full h-full overflow-hidden scrollbar-hide" style={{ backgroundColor: '#F6F6F6' }}>
            <div className='text-grey-dark'><Navbar /></div>

            <div className='font-HelveticaNeue font-light text-[12px] md:text-[17px] mt-[18px] m-[18px] mt-[0px] text-grey-dark  '>
                {/* Version Mobile */}
                <div className='block md:hidden'>
                    <p className='mb-[18px]'> <span className='font-medium'>ROAR</span> is a Paris-based studio crafting custom music and sound design for brands, fashion and film.
                        Clients insclude Converse, Chieds, Grand Marnier x Future, AD Council etc.</p>
                    <p>Contact: <br></br> Pierre Ronin, Aristide Rosier <br></br> <a href="mailto:hello@roarmusic.com" className="text-grey-dark hover:underline">hello@roarmusiccom</a> <br></br> <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="text-grey-dark hover:underline">@instagram</a></p>
                </div>

                {/* Version Desktop */}
                <div className='hidden md:block m-[26px] mt-[0px]'>
                    <p className='mb-[18px]'> <span className='font-medium'>ROAR</span> is a Paris-based studio crafting custom music and sound design for brands, fashion and film.<br></br>
                        Clients insclude Converse, Chieds, Grand Marnier x Future, AD Council etc.</p>
                    <p>Contact: <br></br>Pierre Ronin, Aristide Rosier <br></br> <a href="mailto:hello@roarmusic.com" className="text-grey-dark cursor-pointer">hello@roarmusic.com</a> </p>
                </div>
            </div>
        </div>
    );
};

export default About;
