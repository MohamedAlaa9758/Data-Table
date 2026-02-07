import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { GetApi } from './components/get-api/get-api';
import { BarChart } from './components/bar-chart/bar-chart';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'get-data', component: GetApi },
  { path: 'bar-chart', component: BarChart },
];
