import { useState, useEffect } from 'react';

const CACHE_KEY = 'ip_locations_cache_v4';

interface IpLocationData {
  cityName?: string;
  regionName?: string;
  countryName?: string;
  countryCode?: string;
}

export const useIpLocation = (ip?: string) => {
  const [location, setLocation] = useState<string | null>(null);

  useEffect(() => {
    if (!ip) return;

    // Clean IP (remove IPv4-mapped IPv6 prefix and whitespace)
    const cleanIp = ip.replace(/^::ffff:/, '').trim();

    if (cleanIp === 'unknown' || cleanIp === '::1' || cleanIp === '127.0.0.1' || cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.')) {
      if (cleanIp === '::1' || cleanIp === '127.0.0.1') {
        setLocation('Localhost');
      }
      return;
    }

    const fetchLocation = async () => {
      try {
        // Check cache first
        const cachedStr = localStorage.getItem(CACHE_KEY);
        const cache = cachedStr ? JSON.parse(cachedStr) : {};
        if (cache[cleanIp]) {
          setLocation(cache[cleanIp]);
          return;
        }

        console.log(`[useIpLocation] Fetching for IP: ${cleanIp}`);

        // Thay YOUR_API_KEY_HERE bằng API Key của bạn hoặc cấu hình biến môi trường VITE_IPSTACK_API_KEY
        const apiKey = import.meta.env.VITE_IPSTACK_API_KEY || 'YOUR_API_KEY_HERE';
        const response = await fetch(`http://api.ipstack.com/${cleanIp}?access_key=${apiKey}`);

        if (!response.ok) {
          console.error(`[useIpLocation] API Error: ${response.status} ${response.statusText}`);
          return;
        }

        const data = await response.json();
        console.log(`[useIpLocation] API Response:`, data);

        if (data.success === false) {
          console.error(`[useIpLocation] IPStack Error:`, data.error?.info);
          return;
        }

        // Format location using region_name and country_name from IPstack
        const city = data.city
        const region = data.region_name;
        const country = data.country_name;

        let formattedLocation = '';
        if (city && region && country) {
          formattedLocation = `${city}, ${region} - ${country}`;
        } else if (country) {
          formattedLocation = country;
        } else if (region) {
          formattedLocation = region;
        } else if (city) {
          formattedLocation = city;
        }

        if (formattedLocation) {
          console.log(`[useIpLocation] Setting location to: ${formattedLocation}`);
          setLocation(formattedLocation);
          // Save to cache
          cache[cleanIp] = formattedLocation;
          localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } else {
          console.warn(`[useIpLocation] No location found in response`);
        }
      } catch (error) {
        console.error('[useIpLocation] Failed to fetch IP location:', error);
      }
    };

    fetchLocation();
  }, [ip]);

  return location;
};
