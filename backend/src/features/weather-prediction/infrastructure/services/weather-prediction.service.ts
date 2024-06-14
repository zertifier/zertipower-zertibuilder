import { Injectable } from '@nestjs/common';
import axios from "axios";

export interface PredictionResponse {
  list: {
    dt: number,
    main: {
      temp: number,
      feels_like: number,
      temp_min: number,
      temp_max: number,
      pressure: number,
      sea_level: number,
      grnd_level: number,
      humidity: number,
      temp_kf: number
    },
    weather: {
      id: number,
      main: string,
      description: string,
      icon: string
    }[],
    clouds: {
      all: number
    },
    wind: {
      speed: number,
      deg: number,
      gust: number
    },
    visibility: number,
    pop: number,
    rain: {
      "3h": number
    },
    sys: {
      pod: string
    },
    dt_txt: string
  }[],
  city: {
    id: number,
    name: string,
    coord: {
      lat: number,
      lon: number
    },
    country: string,
    population: number,
    timezone: number,
    sunrise: number,
    sunset: number
  },
}

@Injectable()
export class WeatherPredictionService {
  public async getPrediction(): Promise<PredictionResponse> {
    const response = await axios.get<PredictionResponse>(`https://api.openweathermap.org/data/2.5/forecast?units=metric&lat=42.1822177&lon=2.4890211&lang=ca&appid=6beb296f5450ed47e686b56bac297900`)
    return response.data;
  }
}
