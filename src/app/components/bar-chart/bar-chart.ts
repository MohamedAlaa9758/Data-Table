import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.css',
})
export class BarChart implements OnInit {
  // ✅ تأكد إن الاسم هنا BarChart
  http = inject(HttpClient);
  allCountries = signal<any[]>([]);

  // ✅ هنا الـ continentData
  continentData = computed(() => {
    const countries = this.allCountries();
    const continentCount: { [key: string]: number } = {};

    countries.forEach((country) => {
      if (country.continents && Array.isArray(country.continents)) {
        country.continents.forEach((continent: string) => {
          continentCount[continent] = (continentCount[continent] || 0) + 1;
        });
      }
    });

    return Object.entries(continentCount)
      .map(([name, count]) => ({
        continent: name,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count);
  });

  maxCount = computed(() => {
    const data = this.continentData();
    return data.length > 0 ? Math.max(...data.map((d) => d.count)) : 1;
  });

  ngOnInit(): void {
    this.getCountries();
  }

  getCountries() {
    this.http
      .get<any[]>('https://restcountries.com/v3.1/all?fields=name,continents')
      .subscribe((res) => {
        this.allCountries.set(res);
      });
  }

  getBarHeight(count: number): number {
    return (count / this.maxCount()) * 100;
  }

  getBarColor(index: number): string {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'];
    return colors[index % colors.length];
  }
}
