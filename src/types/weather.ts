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
 