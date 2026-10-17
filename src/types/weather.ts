export interface Coordinates {
  latitude: number
  longitude: number
}

export interface LocationPlace {
  id?: number
  name: string
  admin1?: string
  admin2?: string
  admin3?: string
  country?: string
  latitude: number
  longitude: number
}

export interface GeocodingResult {
  id: number
  name: string
  latitude: number
  longitude: number
  elevation?: number
  feature_code?: string
  country_code?: string
  country?: string
  admin1?: string
  admin2?: string
  admin3?: string
  admin4?: string
}

export interface GeocodingApiResponse {
  results?: GeocodingResult[]
  generationtime_ms?: number
}

export interface CurrentWeatherRaw {
  time: string
  interval?: number
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  weather_code: number
  wind_speed_10m: number
  wind_direction_10m?: number
  surface_pressure: number
  precipitation?: number
  is_day?: number
}

export interface HourlyWeatherRaw {
  time: string[]
  temperature_2m: number[]
  weather_code: number[]
  precipitation_probability: (number | null)[]
  precipitation: (number | null)[]
  visibility: (number | null)[]
  uv_index: (number | null)[]
  wind_speed_10m?: (number | null)[]
  wind_direction_10m?: (number | null)[]
  dew_point_2m?: (number | null)[]
}

export interface DailyWeatherRaw {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_probability_max: (number | null)[]
  precipitation_sum?: (number | null)[]
  sunrise: string[]
  sunset: string[]
}

export interface WeatherApiResponse {
  latitude: number
  longitude: number
  generationtime_ms: number
  utc_offset_seconds: number
  timezone: string
  timezone_abbreviation: string
  elevation: number
  current: CurrentWeatherRaw
  hourly: HourlyWeatherRaw
  daily: DailyWeatherRaw
  minutely_15?: {
    time: string[]
    precipitation: (number | null)[]
    weather_code?: (number | null)[]
  }
}

export interface HourlySlot {
  time: string
  timeFormatted: string
  temp: number
  weatherCode: number
  weatherLabel: string
  weatherIcon: 'sunny' | 'partly' | 'cloudy' | 'rainy' | 'storm'
  precipProb: number
  precipMm?: number
  isNow?: boolean
  dayDivider?: string
}

export interface DailySlot {
  date: string
  dayName: string
  dateFormatted: string
  tempMin: number
  tempMax: number
  weatherCode: number
  weatherLabel: string
  weatherIcon: 'sunny' | 'partly' | 'cloudy' | 'rainy' | 'storm'
  precipProbMax: number
  precipSumMm?: number
  sunrise: string
  sunset: string
  isToday?: boolean
}

export interface WeatherCondition {
  label: string
  icon: 'sunny' | 'partly' | 'cloudy' | 'rainy' | 'storm'
}

export interface NowcastData {
  hasRainSoon: boolean
  rainStartsInMinutes?: number
  rainStartTime?: string
  maxIntensityMm: number
  summaryMessage: string
  intervals: Array<{
    time: string
    timeFormatted: string
    precipMm: number
  }>
}

export interface AirQualityData {
  aqi: number
  pm25: number
  pm10: number
  category: 'Baik' | 'Sedang' | 'Tidak Sehat (Sensitif)' | 'Tidak Sehat' | 'Sangat Tidak Sehat' | 'Berbahaya'
  color: string
  advice: string
}

export interface ActivitySuggestion {
  id: string
  title: string
  status: string
  suitable: boolean
  tip: string
  iconName: 'umbrella' | 'bike' | 'shirt' | 'heart' | 'car'
}

export interface BmkgWarning {
  available: boolean
  statusText: string
  warnings: Array<{
    id: string
    title: string
    description: string
    area: string
    time: string
  }>
}

export interface WeatherData {
  place: LocationPlace
