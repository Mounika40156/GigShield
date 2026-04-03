import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AppContext = createContext();
export const useApp = () => useContext(AppContext);

const CITY_RISK = {
  'Mumbai':    { riskMultiplier: 1.4, zone: 'HIGH',   floodRisk: true  },
  'Delhi':     { riskMultiplier: 1.3, zone: 'HIGH',   floodRisk: false },
  'Hyderabad': { riskMultiplier: 1.1, zone: 'MEDIUM', floodRisk: false },
  'Bengaluru': { riskMultiplier: 1.2, zone: 'MEDIUM', floodRisk: true  },
  'Chennai':   { riskMultiplier: 1.3, zone: 'HIGH',   floodRisk: true  },
  'Kolkata':   { riskMultiplier: 1.4, zone: 'HIGH',   floodRisk: true  },
  'Pune':      { riskMultiplier: 1.1, zone: 'MEDIUM', floodRisk: false },
  'Ahmedabad': { riskMultiplier: 1.0, zone: 'LOW',    floodRisk: false },
};

const PLATFORM_STATUS = {
  Swiggy:        { uptime: 99.1, lastOutage: '2026-03-28', outageHours: 2.4, outageActive: false },
  Zomato:        { uptime: 99.4, lastOutage: '2026-03-15', outageHours: 1.8, outageActive: false },
  Zepto:         { uptime: 98.7, lastOutage: '2026-04-01', outageHours: 3.1, outageActive: true  },
  Blinkit:       { uptime: 98.9, lastOutage: '2026-03-22', outageHours: 2.0, outageActive: false },
  'Amazon Flex': { uptime: 99.6, lastOutage: '2026-02-10', outageHours: 1.2, outageActive: false },
  Flipkart:      { uptime: 99.2, lastOutage: '2026-03-05', outageHours: 1.5, outageActive: false },
};

const FLOOD_ADVISORY = {
  Mumbai:    { level: 'RED',    advisory: true,  waterlogging: 'Severe'   },
  Kolkata:   { level: 'ORANGE', advisory: true,  waterlogging: 'Moderate' },
  Chennai:   { level: 'RED',    advisory: true,  waterlogging: 'Severe'   },
  Bengaluru: { level: 'YELLOW', advisory: false, waterlogging: 'Low'      },
  Delhi:     { level: 'GREEN',  advisory: false, waterlogging: 'None'     },
  Hyderabad: { level: 'GREEN',  advisory: false, waterlogging: 'None'     },
  Pune:      { level: 'YELLOW', advisory: false, waterlogging: 'Low'      },
  Ahmedabad: { level: 'GREEN',  advisory: false, waterlogging: 'None'     },
};

const WEATHER_MOCK = {
  Mumbai:    { temp: 33, rain: 78,  aqi: 142, description: 'Heavy Rain',    icon: '🌧️' },
  Delhi:     { temp: 44, rain: 0,   aqi: 385, description: 'Severe Haze',   icon: '🌫️' },
  Hyderabad: { temp: 38, rain: 12,  aqi: 95,  description: 'Partly Cloudy', icon: '⛅'  },
  Bengaluru: { temp: 29, rain: 45,  aqi: 88,  description: 'Moderate Rain', icon: '🌦️' },
  Chennai:   { temp: 35, rain: 62,  aqi: 110, description: 'Heavy Rain',    icon: '🌧️' },
  Kolkata:   { temp: 32, rain: 55,  aqi: 198, description: 'Rain + Haze',   icon: '🌧️' },
  Pune:      { temp: 36, rain: 20,  aqi: 76,  description: 'Light Rain',    icon: '🌦️' },
  Ahmedabad: { temp: 42, rain: 0,   aqi: 155, description: 'Hot & Hazy',    icon: '☀️'  },
};

const INITIAL_CLAIMS = [
  { id: 'CLM-2024-001', date: '2026-03-18', trigger: 'Heavy Rain (72mm)', amount: 340, status: 'PAID',         processedIn: '4 min', autoTriggered: true  },
  { id: 'CLM-2024-002', date: '2026-03-25', trigger: 'Heatwave (47°C)',   amount: 280, status: 'PAID',         processedIn: '3 min', autoTriggered: true  },
  { id: 'CLM-2024-003', date: '2026-03-31', trigger: 'Severe AQI (412)',  amount: 190, status: 'UNDER REVIEW', processedIn: '-',     autoTriggered: true  },
];

export function AppProvider({ children }) {
  const [user,   setUser]   = useState(() => { try { return JSON.parse(localStorage.getItem('gs_user'))   || null; } catch { return null; } });
  const [policy, setPolicy] = useState(() => { try { return JSON.parse(localStorage.getItem('gs_policy')) || null; } catch { return null; } });
  const [claims, setClaims] = useState(() => { try { return JSON.parse(localStorage.getItem('gs_claims')) || INITIAL_CLAIMS; } catch { return INITIAL_CLAIMS; } });

  const [weatherData,   setWeatherData]   = useState(null);
  const [platformData,  setPlatformData]  = useState(null);
  const [floodData,     setFloodData]     = useState(null);
  const [activeTrigger, setActiveTrigger] = useState(null);
  const [autoClaim,     setAutoClaim]     = useState(null);

  // Use refs so callbacks always see latest values without stale closures
  const policyRef   = useRef(policy);
  const userRef     = useRef(user);
  const autoFiredRef= useRef(false);

  useEffect(() => { policyRef.current = policy; }, [policy]);
  useEffect(() => { userRef.current   = user;   }, [user]);

  useEffect(() => { if (user)   localStorage.setItem('gs_user',   JSON.stringify(user));   }, [user]);
  useEffect(() => { if (policy) localStorage.setItem('gs_policy', JSON.stringify(policy)); }, [policy]);
  useEffect(() => {             localStorage.setItem('gs_claims', JSON.stringify(claims)); }, [claims]);

  // ── Risk & Premium ───────────────────────────────────────────────────────────
  const calculateRiskProfile = (city, platform, dailyEarnings) => {
    const cityData = CITY_RISK[city] || { riskMultiplier: 1.1, zone: 'MEDIUM' };
    const platformRisk = { Swiggy: 1.0, Zomato: 1.0, Zepto: 1.1, Blinkit: 1.1, 'Amazon Flex': 0.9, Flipkart: 0.9 };
    const pm    = platformRisk[platform] || 1.0;
    const score = Math.round(60 + (cityData.riskMultiplier - 1) * 80 + (pm - 1) * 20);
    return { zone: cityData.zone, score: Math.min(score, 95), multiplier: cityData.riskMultiplier * pm, floodRisk: cityData.floodRisk };
  };

  const calculatePremium = (plan, city, platform, dailyEarnings) => {
    const basePremiums = { Basic: 49, Standard: 99, Premium: 149 };
    const risk       = calculateRiskProfile(city, platform, dailyEarnings);
    const base       = basePremiums[plan];
    const adjustment = Math.round((risk.multiplier - 1) * 20);
    return Math.max(base - 5, Math.min(base + adjustment, base + 15));
  };

  // ── Claims ───────────────────────────────────────────────────────────────────
  const addClaim = (trigger, amount, autoTriggered = false) => {
    const newClaim = {
      id: `CLM-2026-${String(Date.now()).slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      trigger, amount,
      status: 'PROCESSING',
      processedIn: '-',
      autoTriggered,
    };
    setClaims(prev => [newClaim, ...prev]);
    setTimeout(() => {
      setClaims(prev => prev.map(c =>
        c.id === newClaim.id
          ? { ...c, status: 'PAID', processedIn: `${Math.floor(Math.random() * 3) + 2} min` }
          : c
      ));
    }, 4000);
    return newClaim;
  };

  // ── Auto zero-touch claim ────────────────────────────────────────────────────
  const fireAutoClaim = (trigger) => {
    const pol = policyRef.current;
    const usr = userRef.current;
    if (autoFiredRef.current || !pol || !usr) return;
    autoFiredRef.current = true;

    const dailyEarnings = parseFloat(usr.dailyEarnings) || 800;
    const severity      = trigger.severity === 'HIGH' ? 0.35 : 0.2;
    const amount        = Math.min(Math.round(dailyEarnings * severity * 1.5), pol.maxPayout);
    const claim         = addClaim(trigger.type + ' — Auto', amount, true);
    setAutoClaim({ ...claim, triggerLabel: trigger.type, triggerValue: trigger.value });

    // Allow re-fire after 60s
    setTimeout(() => { autoFiredRef.current = false; }, 60000);
  };

  // ── Trigger checker ──────────────────────────────────────────────────────────
  const checkTriggers = (weather, plat, flood) => {
    let detected = null;

    if (weather) {
      if      (weather.rain >= 60)  detected = { type: 'Heavy Rain',    value: `${weather.rain}mm`,          threshold: '60mm',       severity: 'HIGH'   };
      else if (weather.temp >= 45)  detected = { type: 'Heatwave',      value: `${weather.temp}°C`,          threshold: '45°C',       severity: 'HIGH'   };
      else if (weather.aqi  >= 400) detected = { type: 'Severe AQI',    value: `AQI ${weather.aqi}`,         threshold: 'AQI 400',    severity: 'HIGH'   };
    }
    if (!detected && flood && flood.advisory)
      detected = { type: 'Flood Alert',     value: `${flood.waterlogging} waterlogging`, threshold: 'NDMA advisory', severity: 'HIGH'   };
    if (!detected && plat && plat.outageActive)
      detected = { type: 'Platform Outage', value: `${plat.outageHours}hr downtime`,     threshold: '2hr downtime',  severity: 'MEDIUM' };

    setActiveTrigger(detected);

    if (detected) {
      fireAutoClaim(detected);
    } else {
      autoFiredRef.current = false;
      setAutoClaim(null);
    }
  };

  // ── Mock APIs ────────────────────────────────────────────────────────────────
  const fetchWeather = async (city) => {
    const data = WEATHER_MOCK[city] || { temp: 35, rain: 10, aqi: 120, description: 'Clear', icon: '☀️' };
    setWeatherData(data);
    return data;
  };

  const fetchPlatformStatus = async (platform) => {
    await new Promise(r => setTimeout(r, 500));
    const base = PLATFORM_STATUS[platform] || { uptime: 99.0, lastOutage: '2026-03-01', outageHours: 1.0, outageActive: false };
    const data = { ...base, platform, checkedAt: new Date().toISOString() };
    setPlatformData(data);
    return data;
  };

  const fetchFloodAdvisory = async (city) => {
    await new Promise(r => setTimeout(r, 400));
    const base   = FLOOD_ADVISORY[city] || { level: 'GREEN', advisory: false, waterlogging: 'None' };
    const result = { ...base, city, checkedAt: new Date().toISOString() };
    setFloodData(result);
    return result;
  };

  // ── Master refresh (calls all 3 APIs then evaluates triggers) ────────────────
  const refreshAllData = async (city, platform) => {
    const [weather, flood, plat] = await Promise.all([
      fetchWeather(city),
      fetchFloodAdvisory(city),
      fetchPlatformStatus(platform),
    ]);
    checkTriggers(weather, plat, flood);
    return { weather, flood, platform: plat };
  };

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    setPolicy(null);
    localStorage.removeItem('gs_user');
    localStorage.removeItem('gs_policy');
    autoFiredRef.current = false;
    setAutoClaim(null);
    setActiveTrigger(null);
  };

  return (
    <AppContext.Provider value={{
      user, setUser,
      policy, setPolicy,
      claims, addClaim,
      weatherData, platformData, floodData,
      activeTrigger, autoClaim,
      fetchWeather, fetchPlatformStatus, fetchFloodAdvisory,
      refreshAllData,
      calculateRiskProfile, calculatePremium,
      logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}