import React, { useEffect } from 'react';

interface GoogleAdsenseProps {
  adSlot?: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const GoogleAdsense: React.FC<GoogleAdsenseProps> = ({
  adSlot = "1407977019",
  adFormat = "auto",
  fullWidthResponsive = true,
  style = { display: 'block' },
  className = "adsbygoogle"
}) => {
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  useEffect(() => {
    // Load AdSense script if not already loaded
    if (typeof window !== "undefined" && !document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1957085805829290";
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
  }, []);

  return (
    <ins
      className={className}
      style={style}
      data-ad-client="ca-pub-1957085805829290"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive}
    />
  );
};

export default GoogleAdsense;
