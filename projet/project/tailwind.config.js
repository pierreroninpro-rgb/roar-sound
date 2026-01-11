/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'HelveticaNeue': ['HelveticaNeue', 'Helvetica', 'Arial', 'sans-serif'],
        'Helvetica_Neue': ['HelveticaNeue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      spacing: {
        // Mobile
        'roar-x-mobile': '17.22px',
        'roar-y-mobile': '18px',
        // Desktop/Tablette (md et plus)
        'roar-x-desktop': '39.91px',
        'roar-y-desktop': '28px',
      },
      colors: {
        'custom-grey': '#D1D1D1',
        'greyh': '#D1D1D1',
        'grey-dark': '#494949',
        'grey-darker': '#272727',
        'roar-blue': '#3137FD',
        'roar-light': '#F8F8F8',
        'backGrey': '#F6F6F6',
        'roar-dark': '#3137FD',
        'roar-accent': '#7C7C7C',
        'roar-bg': '#E0E0E0',
      },
    },
  },
}
