/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: '#007AFF', // iOS Blue
                text: '#000000',
                background: '#F2F2F7', // iOS Grouped Background
                card: '#FFFFFF',
                error: '#FF3B30', // iOS Red
                success: '#34C759', // iOS Green
            }
        },
    },
    plugins: [],
}
