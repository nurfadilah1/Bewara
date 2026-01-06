import { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, GeoJSON, Circle } from 'react-leaflet';
import { Cloud, Droplets, Wind, AlertTriangle, MapPin, ArrowRight, Info, RefreshCw, BrainCircuit } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// --- DATA GIS STATIS ---
const hazardZones = [
  { id: 1, name: 'Zona Merah 1', level: 'Tinggi', coordinates: [[-7.1123, 107.5845], [-7.1156, 107.5923], [-7.1223, 107.5890], [-7.1190, 107.5812]], color: '#ef4444' },
  { id: 2, name: 'Zona Kuning 1', level: 'Sedang', coordinates: [[-7.1256, 107.5912], [-7.1289, 107.6001], [-7.1356, 107.5968], [-7.1323, 107.5879]], color: '#f59e0b' },
  { id: 3, name: 'Zona Hijau 1', level: 'Rendah', coordinates: [[-7.1089, 107.6023], [-7.1122, 107.6112], [-7.1189, 107.6079], [-7.1156, 107.5990]], color: '#10b981' },
];

// --- DATA TITIK RAWAN SPESIFIK (TAMBAHAN BARU) ---
const rawanPoints = [
  { 
    name: "Kampung Cimerak (Tegal Panjang)", 
    lat: -6.9380, lon: 107.0120, 
    risk: "Sangat Tinggi", 
    desc: "Riwayat longsor fatal 2015. Area lereng pemukiman." 
  },
  { 
    name: "Desa Bencoy", 
    lat: -6.9580, lon: 107.0320, 
    risk: "Sangat Tinggi", 
    desc: "Lokasi longsor 2023. Rekomendasi relokasi BNPB." 
  },
  { 
    name: "Bukit Rasamala (Kp. Lio)", 
    lat: -6.9480, lon: 107.0180, 
    risk: "Tinggi", 
    desc: "Dekat kantor kecamatan. Potensi timbun jalan desa." 
  },
  { 
    name: "Area SDN Lio", 
    lat: -6.9415034393770805, lon: 107.00656038638542, 
    risk: "Tinggi", 
    desc: "Beberapa bangunan sekolah berada di lereng yang rawan longsor." 
  }
];

// --- DATA GEOJSON DARI GEOJSON.IO ---
const cireunghasGeoData = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "nama": "Area Batas 1" },
      "geometry": {
        "coordinates": [[[106.98607800695726, -6.927193555008131], [106.98607800695726, -6.927194727244014], [106.98607852382747, -6.927194727244014], [106.98607852382747, -6.927193555008131], [106.98607800695726, -6.927193555008131]]],
        "type": "Polygon"
      }
    },
    {
      "type": "Feature",
      "properties": { "nama": "Area Batas 2" },
      "geometry": {
        "coordinates": [[[106.98369889261016, -6.9232937059588835], [106.98369889261016, -6.923293721891881], [106.98369890817435, -6.923293721891881], [106.98369890817435, -6.9232937059588835], [106.98369889261016, -6.9232937059588835]]],
        "type": "Polygon"
      }
    },
    {
      "type": "Feature",
      "properties": { "nama": "Wilayah Utama Cireunghas" },
      "geometry": {
        "coordinates": [[[106.9813571754006, -6.921505385699874], [106.9813571754006, -6.9750868281512055], [107.04898901122448, -6.9750868281512055], [107.04898901122448, -6.921505385699874], [106.9813571754006, -6.921505385699874]]],
        "type": "Polygon"
      }
    }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'beranda' | 'peta' | 'data'>('beranda');
  const [inputRain, setInputRain] = useState<number>(0);
  const [inputHeight, setInputHeight] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const [weatherDetails, setWeatherDetails] = useState({
    temp: 26,
    humidity: 75,
    wind: 12,
    condition: 'Cerah Berawan'
  });

  const fetchRealTimeWeather = async () => {
    setIsLoading(true);
    const API_KEY = '6ebe273935950da1d504c6adeb642934';
    const lat = -6.9485; 
    const lon = 107.0203;
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`
      );
      const data = await response.json();
      
      const rain1h = data.rain ? data.rain['1h'] : 0;
      const estimatedDailyRain = Math.round(rain1h * 24);
      
      setInputRain(estimatedDailyRain);
      setWeatherDetails({
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        wind: Math.round(data.wind.speed * 3.6),
        condition: data.weather[0].description
      });

      alert(`Sinkronisasi Berhasil! Cuaca saat ini: ${data.weather[0].description}`);
    } catch (error) {
      alert("Gagal sinkronisasi. Periksa koneksi atau API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskAnalysis = () => {
    if (inputRain === 0 && inputHeight === 0) 
      return { label: "Menunggu Data", color: "bg-gray-100 text-gray-400 border-gray-200", desc: "Klik Sinkron API untuk mengambil data cuaca asli." };
    
    if (inputRain > 200 && inputHeight > 500) {
      return { label: "RISIKO TINGGI", color: "bg-red-100 text-red-700 border-red-200", desc: "Bahaya! Potensi longsor ekstrem. Segera evakuasi wilayah lereng." };
    } else if (inputRain > 100 || inputHeight > 300) {
      return { label: "RISIKO SEDANG", color: "bg-orange-100 text-orange-700 border-orange-200", desc: "Waspada. Potensi pergerakan tanah meningkat seiring hujan." };
    } else {
      return { label: "RISIKO RENDAH", color: "bg-green-100 text-green-700 border-green-200", desc: "Kondisi saat ini tergolong aman dari potensi longsor." };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl text-blue-900 shadow-md">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">BEWARA</h1>
              <p className="text-blue-200 text-xs font-medium italic">Sistem Monitoring Longsor Cireunghas </p>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white sticky top-0 z-[1000] shadow-md border-b">
        <div className="container mx-auto px-4 flex justify-center md:justify-start">
          {['beranda', 'peta', 'data'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-4 font-bold transition-all border-b-4 ${
                activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-blue-600'
              }`}
            >
              {tab === 'beranda' ? 'Beranda' : tab === 'peta' ? 'Peta Leaflet' : 'Data & Analisis'}
            </button>
          ))}
        </div>
      </nav>

      <main className="container mx-auto px-4 py-10">
        {activeTab === 'beranda' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto animate-in fade-in duration-700">
            <div className="space-y-6">
              <h2 className="text-5xl font-black text-gray-900 leading-tight">
                Mitigasi Bencana <br /><span className="text-blue-600 text-4xl font-extrabold"></span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Platform informasi geografis untuk pemantauan titik rawan longsor di Kecamatan Cireunghas dengan integrasi data satelit cuaca secara langsung.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <button onClick={() => setActiveTab('peta')} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-xl transform hover:-translate-y-1">
                  Buka Peta Leaflet <ArrowRight size={20} />
                </button>
                <button onClick={() => setActiveTab('data')} className="bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-bold hover:border-blue-600 transition shadow-sm transform hover:-translate-y-1">
                  Simulator Risiko
                </button>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white rotate-1">
              <img src="pemandangan.jpg" className="w-full h-96 object-cover" alt="Mitigasi" />
            </div>
          </div>
        )}

        {activeTab === 'peta' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <MapPin className="text-red-600" size={18} /> Sebaran Area Rawan & Prediksi GeoAI
              </h3>
            </div>
            <div className="h-[600px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <MapContainer center={[-6.9450, 107.0150]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                <GeoJSON 
                  data={cireunghasGeoData as any}
                  style={{ color: "#7a898aff", weight: 2, fillOpacity: 0.2 }}
                  onEachFeature={(feature, layer) => {
                    if (feature.properties && feature.properties.nama) {
                      layer.bindPopup(`<b>${feature.properties.nama}</b>`);
                    }
                  }}
                />

                {/* --- TAMBAHAN HEATMAP GeoAI (CIRCLE) --- */}
                <Circle 
                  center={[-6.9485, 107.0203]} 
                  radius={800} 
                  pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.4 }}
                >
                  <Popup><b>Layer GeoAI: Prediksi Risiko</b><br/>Probabilitas Longsor: 85%</Popup>
                </Circle>

                {/* --- TITIK RAWAN SPESIFIK HASIL RISET (BARU) --- */}
                {rawanPoints.map((point, index) => (
                  <Circle 
                    key={index} 
                    center={[point.lat, point.lon]} 
                    radius={120} 
                    pathOptions={{ 
                      color: '#000', 
                      fillColor: point.name.includes("SDN Lio") ? '#facc15' : '#ef4444', 
                      fillOpacity: 0.9, 
                      weight: 1 
                    }}
                  >
                    <Popup>
                      <div className="p-1 font-sans min-w-[150px]">
                        <h4 className="font-bold text-gray-900 uppercase text-xs border-b pb-1 mb-1">{point.name}</h4>
                        <div className="mb-2 px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded shadow-sm inline-block">
                          STATUS: {point.risk}
                        </div>
                        <p className="text-[10px] text-gray-600 leading-tight italic">{point.desc}</p>
                      </div>
                    </Popup>
                  </Circle>
                ))}

                {/* ZONA BAHAYA LAMA */}
                {hazardZones.map((zone) => (
                  <Polygon key={zone.id} positions={zone.coordinates as [number, number][]} pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.4 }}>
                    <Popup><b className="text-lg">{zone.name}</b><br/>Tingkat Risiko: {zone.level}</Popup>
                  </Polygon>
                ))}
              </MapContainer>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-md mt-4 text-sm text-gray-700">
              <h4 className="font-bold text-blue-800 mb-3 uppercase tracking-wider">Analisis Layer GeoAI:</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 list-disc pl-5 uppercase font-medium">
                <li><b>Masalah:</b> Penentuan titik koordinat lereng spesifik yang paling berisiko tinggi.</li>
                <li><b>Data:</b> Curah hujan real-time (API) dan data elevasi (mdpl).</li>
                <li><b>Jenis AI:</b> Prediction Analysis (Klasifikasi berbasis ambang batas).</li>
                <li><b>Makna Layer:</b> Heatmap merah melambangkan area prediksi probabilitas tinggi.</li>
                <li><b>Manfaat:</b> Rekomendasi lokasi prioritas mitigasi bagi penduduk.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">
            <div className="text-center">
              <h2 className="text-3xl font-black text-gray-800">Analisis Risiko Real-Time</h2>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 bg-blue-50/30 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Droplets size={16} className="text-blue-500" /> Curah Hujan (mm)
                    </label>
                    <button 
                      onClick={fetchRealTimeWeather} 
                      disabled={isLoading}
                      className="text-[10px] font-black uppercase bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md"
                    >
                      <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /> Sinkron API
                    </button>
                  </div>
                  <input 
                    type="number" 
                    value={inputRain}
                    className="w-full p-4 rounded-xl border-2 border-gray-200 font-black text-xl text-blue-900" 
                    onChange={(e) => setInputRain(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" /> Ketinggian Lereng (mdpl)
                  </label>
                  <input 
                    type="number" 
                    value={inputHeight}
                    className="w-full p-4 rounded-xl border-2 border-gray-200 font-black text-xl" 
                    onChange={(e) => setInputHeight(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="p-8 flex items-center justify-center bg-white border-l border-dashed border-gray-200">
                <div className={`w-full p-8 rounded-3xl border-2 text-center ${getRiskAnalysis().color}`}>
                  <div className="text-[10px] font-black uppercase mb-2 opacity-50">Output Sistem</div>
                  <div className="text-4xl font-black mb-3 uppercase">{getRiskAnalysis().label}</div>
                  <p className="text-xs font-bold leading-relaxed">{getRiskAnalysis().desc}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-orange-50 rounded-xl"><Cloud className="text-orange-500" size={24}/></div>
                <div><div className="font-black text-lg">{weatherDetails.temp}°C</div><div className="text-[10px] text-gray-400 uppercase font-black">Suhu</div></div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-xl"><Info className="text-purple-500" size={24}/></div>
                <div><div className="font-black text-lg">{weatherDetails.humidity}%</div><div className="text-[10px] text-gray-400 uppercase font-black">Lembab</div></div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-xl"><Wind className="text-green-500" size={24}/></div>
                <div><div className="font-black text-lg">{weatherDetails.wind} km/h</div><div className="text-[10px] text-gray-400 uppercase font-black">Angin</div></div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-xl"><AlertTriangle className="text-red-500" size={24}/></div>
                <div><div className="font-black text-lg">AKTIF</div><div className="text-[10px] text-gray-400 uppercase font-black">Status</div></div>
              </div>
            </div>
            
            <div className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Kondisi Terakhir: {weatherDetails.condition}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-20 border-t-8 border-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-black text-xl mb-2 font-semibold tracking-tighter">SIG-Informasi wilayah rawan longsor © 2025</h3>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Kecamatan Cireunghas, Jawa Barat</p>
        </div>
      </footer>
    </div>
  );
}