import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

const AppContext = createContext(null)

// ✅ SAFE HOOK (prevents white screen crashes)
export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used inside AppProvider')
  }
  return context
}

// ---------------- MOCK DATA ----------------

const CITY_RISK = {
  Mumbai: { riskMultiplier: 1.4, zone: 'HIGH', floodRisk: true },
  Delhi: { riskMultiplier: 1.3, zone: 'HIGH', floodRisk: false },
  Hyderabad: { riskMultiplier: 1.1, zone: 'MEDIUM', floodRisk: false },
  Bengaluru: { riskMultiplier: 1.2, zone: 'MEDIUM', floodRisk: true },
  Chennai: { riskMultiplier: 1.3, zone: 'HIGH', floodRisk: true },
  Kolkata: { riskMultiplier: 1.4, zone: 'HIGH', floodRisk: true },
  Pune: { riskMultiplier: 1.1, zone: 'MEDIUM', floodRisk: false },
  Ahmedabad: { riskMultiplier: 1.0, zone: 'LOW', floodRisk: false },
}

const PLATFORM_STATUS = {
  Swiggy: { uptime: 99.1, lastOutage: '2026-03-28', outageHours: 2.4, outageActive: false },
  Zomato: { uptime: 99.4, lastOutage: '2026-03-15', outageHours: 1.8, outageActive: false },
  Zepto: { uptime: 98.7, lastOutage: '2026-04-01', outageHours: 3.1, outageActive: true },
  Blinkit: { uptime: 98.9, lastOutage: '2026-03-22', outageHours: 2.0, outageActive: false },
  'Amazon Flex': { uptime: 99.6, lastOutage: '2026-02-10', outageHours: 1.2, outageActive: false },
  Flipkart: { uptime: 99.2, lastOutage: '2026-03-05', outageHours: 1.5, outageActive: false },
}

const WEATHER_MOCK = {
  Mumbai: { temp: 33, rain: 78, aqi: 142, description: 'Heavy Rain', icon: '🌧️' },
  Delhi: { temp: 44, rain: 0, aqi: 385, description: 'Severe Haze', icon: '🌫️' },
  Hyderabad: { temp: 38, rain: 12, aqi: 95, description: 'Partly Cloudy', icon: '⛅' },
  Bengaluru: { temp: 29, rain: 45, aqi: 88, description: 'Moderate Rain', icon: '🌦️' },
  Chennai: { temp: 35, rain: 62, aqi: 110, description: 'Heavy Rain', icon: '🌧️' },
  Kolkata: { temp: 32, rain: 55, aqi: 198, description: 'Rain + Haze', icon: '🌧️' },
  Pune: { temp: 36, rain: 20, aqi: 76, description: 'Light Rain', icon: '🌦️' },
  Ahmedabad: { temp: 42, rain: 0, aqi: 155, description: 'Hot & Hazy', icon: '☀️' },
}

// ---------------- PROVIDER ----------------

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gs_user')) || null
    } catch {
      return null
    }
  })

  const [policy, setPolicy] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gs_policy')) || null
    } catch {
      return null
    }
  })

  const [claims, setClaims] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gs_claims')) || []
    } catch {
      return []
    }
  })
  const [theme, setTheme] = useState(() => {
  return localStorage.getItem('gs_theme') || 'light';
});

  const [weatherData, setWeatherData] = useState(null)
  const [platformData, setPlatformData] = useState(null)
  const [floodData, setFloodData] = useState(null)
  const [activeTrigger, setActiveTrigger] = useState(null)
  const [autoClaim, setAutoClaim] = useState(null)

  const policyRef = useRef(policy)
  const userRef = useRef(user)
  const autoFiredRef = useRef(false)

  useEffect(() => {
    policyRef.current = policy
  }, [policy])

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    localStorage.setItem('gs_user', JSON.stringify(user))
  }, [user])

  useEffect(() => {
    localStorage.setItem('gs_policy', JSON.stringify(policy))
  }, [policy])

  useEffect(() => {
    localStorage.setItem('gs_claims', JSON.stringify(claims))
  }, [claims])
  useEffect(() => {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('gs_theme', theme);
}, [theme]);

  // ---------------- LOGIC FUNCTIONS ----------------

  const calculateRiskProfile = (city, platform) => {
    const cityData = CITY_RISK[city] || { riskMultiplier: 1.1, zone: 'MEDIUM' }
    const platformRisk = {
      Swiggy: 1.0,
      Zomato: 1.0,
      Zepto: 1.1,
      Blinkit: 1.1,
      'Amazon Flex': 0.9,
      Flipkart: 0.9,
    }

    const pm = platformRisk[platform] || 1.0
    const score = 60 + (cityData.riskMultiplier - 1) * 80 + (pm - 1) * 20

    return {
      zone: cityData.zone,
      score: Math.min(Math.round(score), 95),
      multiplier: cityData.riskMultiplier * pm,
      floodRisk: cityData.floodRisk,
    }
  }

  const calculatePremium = (plan, city, platform) => {
    const base = { Basic: 49, Standard: 99, Premium: 149 }[plan] || 99
    const risk = calculateRiskProfile(city, platform)

    const adjustment = Math.round((risk.multiplier - 1) * 20)
    return Math.max(base - 5, Math.min(base + adjustment, base + 15))
  }

  const addClaim = (trigger, amount) => {
    const newClaim = {
      id: `CLM-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      trigger,
      amount,
      status: 'PROCESSING',
    }

    setClaims(prev => [newClaim, ...prev])

    setTimeout(() => {
      setClaims(prev =>
        prev.map(c =>
          c.id === newClaim.id
            ? { ...c, status: 'PAID', processedIn: '3 min' }
            : c
        )
      )
    }, 3000)

    return newClaim
  }

  const fetchWeather = async (city) => {
    const data = WEATHER_MOCK[city] || WEATHER_MOCK.Mumbai
    setWeatherData(data)
    return data
  }

  const fetchPlatformStatus = async () => {
    return PLATFORM_STATUS.Swiggy
  }

  const fetchFloodAdvisory = async () => {
    return { level: 'GREEN', advisory: false }
  }

  const refreshAllData = async (city) => {
    const weather = await fetchWeather(city)
    const flood = await fetchFloodAdvisory()
    const platform = await fetchPlatformStatus()

    setWeatherData(weather)
    setFloodData(flood)
    setPlatformData(platform)
  }

  const logout = () => {
    setUser(null)
    setPolicy(null)
    localStorage.clear()
  }

  // ---------------- PROVIDER VALUE ----------------

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        policy,
        setPolicy,
        claims,
        setClaims,
        weatherData,
        platformData,
        floodData,
        activeTrigger,
        autoClaim,
        calculateRiskProfile,
        calculatePremium,
        addClaim,
        fetchWeather,
        refreshAllData,
        logout,
        theme,
  setTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}