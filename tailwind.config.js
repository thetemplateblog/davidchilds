/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './resources/**/*.antlers.html',
        './resources/**/*.antlers.php',
        './resources/**/*.blade.php',
        './resources/**/*.vue',
        './content/**/*.md',
    ],

    theme: {
        extend: {
            colors: {
                'background': '#f7f7f7', // Light-grey background for the whole site
                'title-dark': '#333333',  // Darker black used for titles on Blog and other pages
                'border-light': '#dddddd', // Light grey border for card components on pages
                'red-500': '#ff0000',  // Red color for active elements (like Home link and buttons)
            },
            backgroundImage: {
                'tile-pattern': "url('/assets/img/bg.png')", // Path to your background tile image
            },
            backgroundSize: {
                'custom-size': '16px 16px', // Custom size for tiled patterns
            },
        },
    },

    plugins: [
        require('@tailwindcss/typography'), // Plugin for advanced typography styling
    ],
};

