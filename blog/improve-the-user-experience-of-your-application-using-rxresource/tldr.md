:::code-group

```ts:weather-forecast.component.ts [title=weather-forecast.component.ts]
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import type { WeatherForecast } from './weather-forecast';

@Component({...})
export class WeatherForecastComponent {
	private http = inject(HttpClient);
	readonly weatherforecastResource = rxResource({
		loader: () => this.http.get<WeatherForecast[]>(`/api/weatherforecast`),
	});

	protected refresh() {
		this.weatherforecastResource.reload();
	}
}
```

```razor:title=weather-forecast.component.html [title=weather-forecast.component.html]
<button (click)="refresh()">Refresh forecast</button>

<!-- Check on error, and display the error message -->
@if (weatherforecastResource.error()) {
  <div>{{ $any(weatherforecastResource.error()).message }}</div>
  <div><button (click)="refresh()">Retry</button></div>
}
@else {
  <!-- Make it obvious that something is happening in the background -->
  @if(weatherforecastResource.isLoading()) {
    <div>Loading...</div>
  }

  <!-- Display the results -->
  @if(weatherforecastResource.hasValue()) {
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>TemperatureC</th>
          <th>TemperatureF</th>
          <th>Summary</th>
        </tr>
      </thead>
      <tbody>
        @for (forecast of weatherforecastResource.value(); track forecast.date)
        {
          <tr>
            <td>{{ forecast.date | date }}</td>
            <td>{{ forecast.temperatureC }}</td>
            <td>{{ forecast.temperatureF }}</td>
            <td>{{ forecast.summary }}</td>
          </tr>
        }
      </tbody>
    </table>
  }
}
```

:::
