class WeatherService {
  getCurrentWeather() {
    return fetch(
      'https://www.google.com/complete/search' +
        '?cp=7&q=weather&xssi=t&client=mobile-gws-wiz-serp&psi=',
      {
        credentials: 'include',
        mode: 'cors'
      })
      .then(result => {
        return result.text()
      })
      .then(result => {
        return JSON.parse(result.replace(')]}\'', ''))
      })
      .then(result => {
        if (result.length === 0) {
          return null
        }
        const firstResult = result[0][0]
        const weatherResult = firstResult[3].ansa.l[1].il
        const weather = {
          degree: weatherResult.t[0].t,
          icon: weatherResult.i.d
        }
        if (weather.degree && weather.icon) {
          return weather
        }
        return null
      })
      .catch(e => {
        return null
      })
  }
}

const weatherService = new WeatherService()

export default weatherService
