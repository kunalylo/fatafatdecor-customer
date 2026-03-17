import './globals.css'

export const metadata = {
  title: 'FatafatDecor - Instant Decoration Delivery',
  description: 'AI-powered decoration suggestions delivered to your doorstep. Book a decorator instantly for birthdays, anniversaries & special occasions.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FatafatDecor',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    title: 'FatafatDecor - Instant Decoration Delivery',
    description: 'AI-powered decoration delivered to your doorstep',
    siteName: 'FatafatDecor',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#EC4899',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FatafatDecor" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="FatafatDecor" />

        {/* App Icons */}
        <link rel="icon" href="/icons/icon-512.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/icons/icon-512.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-512.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-512.png" />

        {/* Splash screens for iOS */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

        {/* External Scripts */}
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCHwz7UFa-hJVdU1XfvejIZm6RxvOjH3m0" async></script>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
        <script src="https://accounts.google.com/gsi/client" async defer></script>

        {/* Error suppression */}
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />

        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(reg) { console.log('SW registered:', reg.scope); })
                .catch(function(err) { console.log('SW registration failed:', err); });
            });
          }
        `}} />
      </head>
      <body className="font-sans bg-white">
        {children}
      </body>
    </html>
  )
}
