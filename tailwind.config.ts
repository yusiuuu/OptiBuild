import type { Config } from "tailwindcss";

<<<<<<< HEAD
const config: Config = {
    darkMode: ["class"],
=======
// Tailwind CSS configuration for OptiBuild application
// Extends default Tailwind with custom design system colors and animations
const config: Config = {
    // Enable dark mode using CSS class strategy
    darkMode: ["class"],
    
    // Content paths for Tailwind to scan and generate CSS
    // Includes all JavaScript, TypeScript, JSX, TSX, and MDX files
>>>>>>> 34d06b5 (Updated the +New Project section)
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
<<<<<<< HEAD
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
=======
  
  // Theme customization and extensions
  theme: {
  	extend: {
  		// Custom color palette using CSS custom properties
  		// Enables dynamic theming and consistent color usage
  		colors: {
  			// Base background and foreground colors
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			
  			// Card component colors
>>>>>>> 34d06b5 (Updated the +New Project section)
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
<<<<<<< HEAD
=======
  			
  			// Popover component colors
>>>>>>> 34d06b5 (Updated the +New Project section)
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
<<<<<<< HEAD
=======
  			
  			// Primary brand colors
>>>>>>> 34d06b5 (Updated the +New Project section)
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
<<<<<<< HEAD
=======
  			
  			// Secondary accent colors
>>>>>>> 34d06b5 (Updated the +New Project section)
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
<<<<<<< HEAD
=======
  			
  			// Muted/subtle colors
>>>>>>> 34d06b5 (Updated the +New Project section)
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
<<<<<<< HEAD
=======
  			
  			// Accent highlight colors
>>>>>>> 34d06b5 (Updated the +New Project section)
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
<<<<<<< HEAD
=======
  			
  			// Destructive/error colors
>>>>>>> 34d06b5 (Updated the +New Project section)
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
<<<<<<< HEAD
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
=======
  			
  			// Border and input colors
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			
  			// Chart color palette for data visualization
>>>>>>> 34d06b5 (Updated the +New Project section)
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
<<<<<<< HEAD
=======
  			
  			// Sidebar-specific colors for navigation
>>>>>>> 34d06b5 (Updated the +New Project section)
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
<<<<<<< HEAD
=======
  		
  		// Custom border radius values using CSS variables
  		// Provides consistent rounded corners across components
>>>>>>> 34d06b5 (Updated the +New Project section)
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
<<<<<<< HEAD
  		keyframes: {
=======
  		
  		// Custom keyframe animations for interactive components
  		keyframes: {
  			// Accordion down animation for expanding content
>>>>>>> 34d06b5 (Updated the +New Project section)
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
<<<<<<< HEAD
=======
  			// Accordion up animation for collapsing content
>>>>>>> 34d06b5 (Updated the +New Project section)
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
<<<<<<< HEAD
=======
  		
  		// Animation utilities using custom keyframes
>>>>>>> 34d06b5 (Updated the +New Project section)
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
<<<<<<< HEAD
  plugins: [require("tailwindcss-animate")],
};
=======
  
  // Tailwind plugins for additional functionality
  plugins: [require("tailwindcss-animate")],
};

>>>>>>> 34d06b5 (Updated the +New Project section)
export default config;
