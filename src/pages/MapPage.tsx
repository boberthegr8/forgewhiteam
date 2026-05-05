import { useEffect, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { MapPin, Navigation } from 'lucide-react';

const DRIVER_COLORS = ['#f97316', '#22c55e', '#60a5fa', '#e879f9', '#fbbf24', '#34d399', '#f87171', '#a78bfa'];

export function MapPage() {
  const { deliveries } = useAppStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const today = new Date().toISOString().slice(0, 10);
  const todayDeliveries = deliveries.filter(d => d.date === today);
  const activeDeliveries = todayDeliveries.filter(d => d.status !== 'delivered');

  const drivers = [...new Set(todayDeliveries.map((d: any) => d.driver).filter(Boolean))] as string[];
  const driverColorMap: Record<string, string> = {};
  drivers.forEach((driver, i) => { driverColorMap[driver] = DRIVER_COLORS[i % DRIVER_COLORS.length]; });

  const statusColor = (status: string) => {
    if (status === 'delivered') return '#22c55e';
    if (status === 'onroute') return '#f97316';
    if (status === 'issue') return '#ef4444';
    return '#60a5fa';
  };

  useEffect(() => {
    const loadLeaflet = () => {
      if ((window as any).L) { initMap(); return; }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initMap = async () => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = (window as any).L;

    // Default center: Brantford, ON
    const map = L.map(mapRef.current).setView([43.1394, -80.2644], 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    // Geocode each delivery address
    for (const delivery of todayDeliveries) {
      if (!delivery.address) continue;
      try {
        await new Promise(r => setTimeout(r, 300)); // Rate-limit Nominatim (1 req/sec)
        const res = await fetch(
          'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
          encodeURIComponent(delivery.address + ', Ontario, Canada'),
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (!data[0]) continue;
        const { lat, lon } = data[0];
        const color = driverColorMap[delivery.driver] || '#9ca3af';
        const sColor = statusColor(delivery.status);

        const icon = L.divIcon({
          html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:3px solid ${sColor};box-shadow:0 2px 8px rgba(0,0,0,0.6);cursor:pointer"></div>`,
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const slotLabel = delivery.slot?.replace('-', ' ') || '';
        L.marker([parseFloat(lat), parseFloat(lon)], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:180px">
              <div style="font-weight:700;font-size:13px;margin-bottom:4px">${delivery.customer}</div>
              <div style="font-size:11px;color:#666;margin-bottom:6px">${delivery.address}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <span style="background:${color}22;color:${color};padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700">● ${delivery.driver || 'Unassigned'}</span>
                <span style="background:${sColor}22;color:${sColor};padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700">${delivery.status?.toUpperCase()}</span>
                ${slotLabel ? `<span style="background:#33333360;color:#ccc;padding:2px 6px;border-radius:4px;font-size:10px">${slotLabel}</span>` : ''}
              </div>
            </div>
          `);
      } catch {
        console.warn('Geocoding failed for:', delivery.address);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f]">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#22c55e]/15 flex items-center justify-center">
              <MapPin className="w-4.5 h-4.5 text-[#22c55e]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Live Driver Map</h1>
              <p className="text-xs text-[#9ca3af] mt-0.5">
                {activeDeliveries.length} active · {todayDeliveries.length} total today
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap">
            {drivers.length > 0 ? drivers.map(driver => (
              <div key={driver} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full border-2 border-[#1a1a1a]"
                  style={{ background: driverColorMap[driver] }} />
                <span className="text-xs text-[#9ca3af]">{driver}</span>
              </div>
            )) : (
              <span className="text-xs text-[#6b7280]">No drivers assigned today</span>
            )}
            <div className="flex items-center gap-3 ml-2 border-l border-[#2e2e2e] pl-3">
              {[['scheduled','#60a5fa'],['onroute','#f97316'],['delivered','#22c55e'],['issue','#ef4444']].map(([s, c]) => (
                <div key={s} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: c as string }} />
                  <span className="text-[10px] text-[#6b7280] capitalize">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {todayDeliveries.length === 0 && (
          <div className="mt-3 bg-[#1a1a1a] border border-[#2e2e2e] rounded-[8px] px-4 py-3 text-sm text-[#9ca3af] flex items-center gap-2">
            <Navigation className="w-4 h-4 text-[#6b7280]" />
            No deliveries scheduled for today. Add deliveries to see them pinned on the map.
          </div>
        )}
      </div>

      {/* Map container */}
      <div className="flex-1 mx-6 mb-6 rounded-[10px] overflow-hidden border border-[#2e2e2e] min-h-0">
        <div ref={mapRef} style={{ height: '100%', width: '100%', background: '#141414' }} />
      </div>
    </div>
  );
}
