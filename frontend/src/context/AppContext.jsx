import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

const AppContext = createContext(null)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}

// ---------------- FAKE WORKER DATABASE ----------------
// 3 workers: 1 passes fraud, 1 fails GPS, 1 suspicious
const FAKE_WORKERS_DB = [
  {
    id: 'WRK-001',
    name: 'Ravi Kumar',
    phone: '9876543210',
    city: 'Delhi',
    platform: 'Swiggy',
    registeredZone: 'Delhi NCR',
    dailyEarnings: 850,
    trustScore: 78,
    gpsActive: true,         // GPS matches registered zone ✅
    loginActive: true,       // Was active on platform that day ✅
    fraudFlag: false,
    riskProfile: { zone: 'HIGH', score: 72, multiplier: 1.3 },
    plan: 'Standard',
    premium: 99,
    maxPayout: 2000,
  },
  {
    id: 'WRK-002',
    name: 'Priya Sharma',
    phone: '9123456780',
    city: 'Mumbai',
    platform: 'Zomato',
    registeredZone: 'Mumbai West',
    dailyEarnings: 720,
    trustScore: 31,
    gpsActive: false,        // GPS does NOT match registered zone ❌
    loginActive: false,      // Was NOT active on platform ❌
    fraudFlag: true,
    fraudReason: 'GPS mismatch + no platform login detected',
    riskProfile: { zone: 'HIGH', score: 85, multiplier: 1.4 },
    plan: 'Basic',
    premium: 49,
    maxPayout: 1000,
  },
  {
    id: 'WRK-003',
    name: 'Arjun Patel',
    phone: '9988776655',
    city: 'Delhi',
    platform: 'Blinkit',
    registeredZone: 'Delhi NCR',
    dailyEarnings: 900,
    trustScore: 45,
    gpsActive: true,         // GPS matches ✅
    loginActive: false,      // NOT active on platform ❌ — suspicious
    fraudFlag: true,
    fraudReason: 'Platform login inactive — possible ghost claim',
    riskProfile: { zone: 'HIGH', score: 68, multiplier: 1.1 },
    plan: 'Premium',
    premium: 149,
    maxPayout: 3000,
  },
]

// ---------------- CITY / WEATHER / PLATFORM MOCK DATA ----------------

const CITY_RISK = {
  Mumbai:    { riskMultiplier: 1.4, zone: 'HIGH',   floodRisk: true  },
  Delhi:     { riskMultiplier: 1.3, zone: 'HIGH',   floodRisk: false },
  Hyderabad: { riskMultiplier: 1.1, zone: 'MEDIUM', floodRisk: false },
  Bengaluru: { riskMultiplier: 1.2, zone: 'MEDIUM', floodRisk: true  },
  Chennai:   { riskMultiplier: 1.3, zone: 'HIGH',   floodRisk: true  },
  Kolkata:   { riskMultiplier: 1.4, zone: 'HIGH',   floodRisk: true  },
  Pune:      { riskMultiplier: 1.1, zone: 'MEDIUM', floodRisk: false },
  Ahmedabad: { riskMultiplier: 1.0, zone: 'LOW',    floodRisk: false },
}

const PLATFORM_STATUS = {
  Swiggy:       { uptime: 99.1, lastOutage: '2026-03-28', outageHours: 2.4, outageActive: false },
  Zomato:       { uptime: 99.4, lastOutage: '2026-03-15', outageHours: 1.8, outageActive: false },
  Zepto:        { uptime: 98.7, lastOutage: '2026-04-01', outageHours: 3.1, outageActive: true  },
  Blinkit:      { uptime: 98.9, lastOutage: '2026-03-22', outageHours: 2.0, outageActive: false },
  'Amazon Flex':{ uptime: 99.6, lastOutage: '2026-02-10', outageHours: 1.2, outageActive: false },
  Flipkart:     { uptime: 99.2, lastOutage: '2026-03-05', outageHours: 1.5, outageActive: false },
}

const WEATHER_MOCK = {
  Mumbai:    { temp: 33, rain: 78,  aqi: 142, description: 'Heavy Rain',    icon: '🌧️' },
  Delhi:     { temp: 44, rain: 0,   aqi: 385, description: 'Severe Haze',   icon: '🌫️' },
  Hyderabad: { temp: 38, rain: 12,  aqi: 95,  description: 'Partly Cloudy', icon: '⛅' },
  Bengaluru: { temp: 29, rain: 45,  aqi: 88,  description: 'Moderate Rain', icon: '🌦️' },
  Chennai:   { temp: 35, rain: 62,  aqi: 110, description: 'Heavy Rain',    icon: '🌧️' },
  Kolkata:   { temp: 32, rain: 55,  aqi: 198, description: 'Rain + Haze',   icon: '🌧️' },
  Pune:      { temp: 36, rain: 20,  aqi: 76,  description: 'Light Rain',    icon: '🌦️' },
  Ahmedabad: { temp: 42, rain: 0,   aqi: 155, description: 'Hot & Hazy',    icon: '☀️' },
}

// ---------------- PROVIDER ----------------

export function AppProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('gs_theme') || 'light'
  })

  // Apply theme to <body> tag — CSS uses body[data-theme='dark']
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('gs_theme', theme)
  }, [theme])

  const setTheme = (t) => {
    setThemeState(t)
    document.body.setAttribute('data-theme', t)
    localStorage.setItem('gs_theme', t)
  }

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gs_user')) || null } catch { return null }
  })

  const [policy, setPolicy] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gs_policy')) || null } catch { return null }
  })

  const [claims, setClaims] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gs_claims')) || [] } catch { return [] }
  })

  const [weatherData, setWeatherData]   = useState(null)
  const [platformData, setPlatformData] = useState(null)
  const [floodData, setFloodData]       = useState(null)
  const [activeTrigger, setActiveTrigger] = useState(null)
  const [autoClaim, setAutoClaim]       = useState(null)

  // ── FRAUD STATS (for Dashboard BCR display) ──
  const [fraudStats, setFraudStats] = useState({
    totalChecked: 0,
    fraudBlocked: 0,
    fraudPassed: 0,
    totalPremiumCollected: 0,
    totalClaimsPaid: 0,
  })

  const policyRef = useRef(policy)
  const userRef   = useRef(user)

  useEffect(() => { policyRef.current = policy }, [policy])
  useEffect(() => { userRef.current   = user   }, [user])

  useEffect(() => { localStorage.setItem('gs_user',   JSON.stringify(user))   }, [user])
  useEffect(() => { localStorage.setItem('gs_policy', JSON.stringify(policy)) }, [policy])
  useEffect(() => { localStorage.setItem('gs_claims', JSON.stringify(claims)) }, [claims])

  // ---------------- FRAUD DETECTION ENGINE ----------------
  // Returns { passed: bool, reason: string, steps: [] }

  const runFraudCheck = (workerOverride = null) => {
    // Use override worker for demo, else use logged-in user
    // For demo: pick a random fake worker OR use the one passed in
    const target = workerOverride || FAKE_WORKERS_DB[0]

    const steps = [
      {
        label: 'GPS Signal Validation',
        note:  'Cross-validating location with registered zone',
        passed: target.gpsActive,
        detail: target.gpsActive
          ? `GPS confirmed in ${target.registeredZone}`
          : `GPS mismatch — worker outside registered zone`,
      },
      {
        label: 'Platform Login Check',
        note:  'Was worker active on platform on trigger day?',
        passed: target.loginActive,
        detail: target.loginActive
          ? `${target.platform} login confirmed — worker was active`
          : `No ${target.platform} login detected on trigger day`,
      },
      {
        label: 'Device Fingerprint Check',
        note:  'One account per device policy',
        passed: !target.fraudFlag || target.gpsActive, // simplify for demo
        detail: 'Device fingerprint matches registered profile',
      },
      {
        label: 'Behavioral Baseline Match',
        note:  'Comparing delivery movement pattern',
        passed: target.trustScore >= 40,
        detail: target.trustScore >= 40
          ? `Trust score ${target.trustScore}/100 — within baseline`
          : `Trust score ${target.trustScore}/100 — below threshold`,
      },
      {
        label: 'Trust Score Evaluation',
        note:  'Final risk gate before payout release',
        passed: !target.fraudFlag,
        detail: target.fraudFlag
          ? `BLOCKED: ${target.fraudReason}`
          : 'All checks passed — payout authorized',
      },
    ]

    const passed = steps.every(s => s.passed)

    // Update fraud stats
    setFraudStats(prev => ({
      ...prev,
      totalChecked: prev.totalChecked + 1,
      fraudBlocked: prev.fraudBlocked + (passed ? 0 : 1),
      fraudPassed:  prev.fraudPassed  + (passed ? 1 : 0),
    }))

    return { passed, steps, worker: target }
  }

  // ---------------- CLAIM ENGINE ----------------
  // Fixed: now accepts (trigger, amount, autoTriggered) — was missing autoTriggered param

  const addClaim = (trigger, amount, autoTriggered = false) => {
    const newClaim = {
      id:            `CLM-${Date.now()}`,
      date:          new Date().toISOString().split('T')[0],
      trigger,
      amount,
      autoTriggered,
      status:        'PROCESSING',
      processedIn:   null,
      channel:       'UPI',   // UPI primary, IMPS fallback
    }

    setClaims(prev => [newClaim, ...prev])

    // Simulate UPI payout in 3 seconds (rollback logic included)
    setTimeout(() => {
      const upiSuccess = Math.random() > 0.1  // 90% UPI success rate

      setClaims(prev =>
        prev.map(c =>
          c.id === newClaim.id
            ? {
                ...c,
                status:      'PAID',
                processedIn: upiSuccess ? '3 min' : '6 min',
                channel:     upiSuccess ? 'UPI' : 'IMPS (fallback)',
              }
            : c
        )
      )

      // Update fraud stats — total claims paid
      setFraudStats(prev => ({
        ...prev,
        totalClaimsPaid: prev.totalClaimsPaid + amount,
      }))

    }, 3000)

    return newClaim
  }

  // ---------------- BLOCKED CLAIM (Fraud) ----------------

  const blockClaim = (trigger, worker) => {
    const blocked = {
      id:           `CLM-${Date.now()}`,
      date:         new Date().toISOString().split('T')[0],
      trigger,
      amount:       0,
      autoTriggered: false,
      status:       'FRAUD BLOCKED',
      processedIn:  'Instant',
      channel:      '—',
      fraudReason:  worker?.fraudReason || 'Fraud detected',
    }
    setClaims(prev => [blocked, ...prev])
    return blocked
  }

  // ---------------- DATA FUNCTIONS ----------------

  const calculateRiskProfile = (city, platform) => {
    const cityData  = CITY_RISK[city] || { riskMultiplier: 1.1, zone: 'MEDIUM' }
    const platformRisk = { Swiggy: 1.0, Zomato: 1.0, Zepto: 1.1, Blinkit: 1.1, 'Amazon Flex': 0.9, Flipkart: 0.9 }
    const pm    = platformRisk[platform] || 1.0
    const score = 60 + (cityData.riskMultiplier - 1) * 80 + (pm - 1) * 20
    return {
      zone:       cityData.zone,
      score:      Math.min(Math.round(score), 95),
      multiplier: cityData.riskMultiplier * pm,
      floodRisk:  cityData.floodRisk,
    }
  }

  const calculatePremium = (plan, city, platform) => {
    const base       = { Basic: 49, Standard: 99, Premium: 149 }[plan] || 99
    const risk       = calculateRiskProfile(city, platform)
    const adjustment = Math.round((risk.multiplier - 1) * 20)
    return Math.max(base - 5, Math.min(base + adjustment, base + 15))
  }

  const fetchWeather = async (city) => {
    const data = WEATHER_MOCK[city] || WEATHER_MOCK.Mumbai
    setWeatherData(data)
    return data
  }

  const fetchPlatformStatus = async () => PLATFORM_STATUS.Swiggy
  const fetchFloodAdvisory = async () => ({ level: 'GREEN', advisory: false, waterlogging: 'No' })

  const refreshAllData = async (city) => {
    const weather  = await fetchWeather(city)
    const flood    = await fetchFloodAdvisory()
    const platform = await fetchPlatformStatus()
    setWeatherData(weather)
    setFloodData(flood)
    setPlatformData(platform)
  }

  // BCR = total claims paid ÷ total premium collected
  const getBCR = () => {
    const totalPremium = policy ? policy.premium * 4 : 396  // 4 weeks mock
    const totalClaims  = claims.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0)
    const bcr          = totalPremium > 0 ? (totalClaims / totalPremium).toFixed(2) : 0
    return { bcr, totalPremium, totalClaims }
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
        // Theme
        theme, setTheme,

        // State
        user, setUser,
        policy, setPolicy,
        claims, setClaims,
        weatherData,
        platformData,
        floodData,
        activeTrigger, setActiveTrigger,
        autoClaim, setAutoClaim,
        fraudStats,

        // Functions
        calculateRiskProfile,
        calculatePremium,
        addClaim,
        blockClaim,
        runFraudCheck,
        getBCR,
        fetchWeather,
        refreshAllData,
        logout,

        // Fake DB (for demo / seeding)
        FAKE_WORKERS_DB,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}