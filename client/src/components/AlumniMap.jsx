import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { MapPin, RefreshCw, Users, GraduationCap, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const INDIA_BOUNDS = [
  [6.5, 68.1],
  [35.8, 97.5]
];

const FitIndiaBounds = () => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(INDIA_BOUNDS, { padding: [24, 24] });
  }, [map]);
  return null;
};

const AlumniMap = ({ markers = [], loading = false, lastUpdated, onRefresh, stats = {} }) => {
  const [selectedRole, setSelectedRole] = useState('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredMarkers = useMemo(() => {
    if (selectedRole === 'alumni') return markers.filter((marker) => marker.role === 'alumni');
    if (selectedRole === 'student') return markers.filter((marker) => marker.role === 'student');
    return markers;
  }, [markers, selectedRole]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="text-purple-600" size={24} />
            India Live Network Map
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time alumni and student presence using live browser geolocation. Data refreshes automatically every 20 seconds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedRole('all')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${selectedRole === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            All ({markers.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('alumni')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${selectedRole === 'alumni' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            Alumni ({stats.alumni || 0})
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('student')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${selectedRole === 'student' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            Students ({stats.students || 0})
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-emerald-600"><GraduationCap size={18} /> Verified Alumni</div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{stats.alumni || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-blue-600"><Users size={18} /> Active Students</div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{stats.students || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-purple-600"><MapPin size={18} /> Live Pins</div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{filteredMarkers.length}</p>
          {lastUpdated && <p className="mt-1 text-xs text-slate-500">Updated {new Date(lastUpdated).toLocaleTimeString()}</p>}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-slate-200 shadow-xl dark:border-white/10"
      >
        <div className="h-[520px] w-full">
          {!mounted ? (
            <div className="flex h-full items-center justify-center bg-slate-100 dark:bg-slate-800">
              <Loader2 className="animate-spin text-purple-600" size={32} />
            </div>
          ) : (
          <MapContainer center={[22.5937, 78.9629]} zoom={5} scrollWheelZoom className="h-full w-full z-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitIndiaBounds />
            {filteredMarkers.length === 0 && (
              <CircleMarker
                center={[22.5937, 78.9629]}
                radius={0}
                pathOptions={{ opacity: 0, fillOpacity: 0 }}
              >
                <Popup>
                  <p className="text-sm text-slate-600">No live pins yet. Enable location sharing to appear on the India network map.</p>
                </Popup>
              </CircleMarker>
            )}
            {filteredMarkers.map((marker) => (
              <CircleMarker
                key={marker.id}
                center={[marker.lat, marker.lng]}
                radius={marker.role === 'alumni' ? 9 : 7}
                pathOptions={{
                  color: marker.role === 'alumni' ? '#059669' : '#2563eb',
                  fillColor: marker.role === 'alumni' ? '#10b981' : '#3b82f6',
                  fillOpacity: 0.85,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="min-w-[220px] space-y-2">
                    <div className="flex items-center gap-3">
                      <img src={marker.picture} alt={marker.name} className="h-12 w-12 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-slate-900">{marker.name}</p>
                        <p className="text-xs text-slate-500">{marker.roleLabel}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{marker.collegeName || 'College not listed'}</p>
                    <p className="text-xs text-emerald-600">Live location</p>
                    {marker.branch && <p className="text-xs text-slate-500">Branch: {marker.branch}</p>}
                    {marker.graduationYear && <p className="text-xs text-slate-500">Class of {marker.graduationYear}</p>}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
          )}
        </div>
      </motion.div>
      {filteredMarkers.length === 0 && mounted && !loading && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          No users on the map yet. Enable live location to appear here in real time.
        </p>
      )}
    </div>
  );
};

export default AlumniMap;
