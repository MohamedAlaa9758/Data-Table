import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
// import { FormsModule } from '@angular/material/icon';

@Component({
  selector: 'app-get-api',
  imports: [FormsModule],
  templateUrl: './get-api.html',
  styleUrl: './get-api.css',
})
export class GetApi implements OnInit {
  http = inject(HttpClient);
  allUsers = signal<any[]>([]);
  selectUser = signal<any | null>(null);
  pageSize = signal(5);
  currentPage = signal(0);
  sortField = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');
  filterText = signal<string>('');
  sortBy(field: string) {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  filterName = signal<string>('');

  filterCountry = signal<string>('');
  userListData = computed(() => {
    let data = [...this.allUsers()];

    const field = this.sortField();
    const dir = this.sortDirection();
    const filterNameData = this.filterName().toLowerCase();

    const filterCountryData = this.filterCountry().toLowerCase();

    if (filterNameData) {
      data = data.filter((user) => {
        const name = user.name.common.toLowerCase();
        return name.includes(filterNameData);
      });
    }

    if (filterCountryData) {
      data = data.filter((user) => {
        const countrys = user.continents?.join(', ').toLowerCase() || '';
        return countrys.includes(filterCountryData);
      });
    }
    if (field) {
      data.sort((a, b) => {
        const valA = field === 'name' ? a.name.common : a[field];
        const valB = field === 'name' ? b.name.common : b[field];

        if (valA > valB) return dir === 'asc' ? 1 : -1;
        if (valA < valB) return dir === 'asc' ? -1 : 1;
        return 0;
      });
    }

    return data;
  });

  userList = computed(() => {
    const start = this.currentPage() * this.pageSize();
    const end = start + this.pageSize();
    return this.userListData().slice(start, end);
  });
  ngOnInit(): void {
    this.getUser();
  }
  allOptionCurrency = signal<any>({});
  editIndex = signal<number | null>(null);

  getUser() {
    this.http
      .get<
        any[]
      >(`https://restcountries.com/v3.1/all?fields=name,independent,status,currencies,capital,region,subregion,languages,continents`)
      .subscribe((res) => {
        this.allUsers.set(res);
        const currencies = res
          .flatMap((u) =>
            u.currencies
              ? Object.values(u.currencies).map((c: any) => `${c.name} (${c.symbol})`)
              : [],
          )
          .filter((v, i, self) => self.indexOf(v) === i)
          .sort();

        this.allOptionCurrency.set(currencies);
      });
  }

  onPageSizeChange(event: Event) {
    this.pageSize.set(+(event.target as HTMLSelectElement).value);
    this.currentPage.set(0);
  }

  nextPage() {
    if ((this.currentPage() + 1) * this.pageSize() < this.allUsers().length) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }
  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  getCurrency(item: any): string {
    if (!item.currencies) return '—';

    return Object.values(item.currencies)
      .map((c: any) => `${c.name} (${c.symbol})`)
      .join(', ');
  }
  totalPages() {
    return Math.ceil(this.allUsers().length / this.pageSize());
  }
  detailsUser(user: any) {
    this.selectUser.set(user);
    const index = this.allUsers().findIndex((u) => u.name.common === user.name.common);
    this.editIndex.set(index);

    console.log('Selected user index:', index);
  }
  isModalOpen = signal(false);
  editUser = signal<any | null>(null);

  openUpdateModal(user: any) {
    const index = this.allUsers().findIndex((u) => u.name.common === user.name.common);
    this.editIndex.set(index);

    const userCopy = JSON.parse(JSON.stringify(user));
    const currencyText = this.getCurrency(userCopy);

    this.editUser.set({
      ...userCopy,
      currenciesText: currencyText,
    });

    this.isModalOpen.set(true);
  }
  saveUpdate() {
    const updated = this.editUser();
    const targetIndex = this.editIndex();

    if (!updated || targetIndex === null || targetIndex === -1) return;

    if (updated.currenciesText) {
      const match = updated.currenciesText.match(/(.+) \((.+)\)/);
      if (match) {
        updated.currencies = {
          XXX: { name: match[1], symbol: match[2] },
        };
      }
    }

    this.allUsers.update((users) => {
      users[targetIndex] = { ...updated };
      return [...users];
    });

    this.selectUser.set({ ...updated });

    this.isModalOpen.set(false);
  }
  deleteUser() {
    const targetIndex = this.editIndex();

    if (targetIndex === null || targetIndex === -1) {
      console.error('Target index not found!');
      return;
    }

    this.allUsers.update((users) => {
      return users.filter((_, i) => i !== targetIndex);
    });
    this.editIndex.set(null);

    this.selectUser.set(null);

    this.isModalOpen.set(false);

    if (this.userList().length === 0 && this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }
  confirmDelete() {
    if (confirm('Are you sure you want to delete this country?')) {
      this.deleteUser();
    }
  }
  // getOptionCurrency() {
  //   this.http
  //     .get<
  //       any[]
  //     >('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json')
  //     .subscribe((res) => {
  //       this.allOptionCurrency.set(res);
  //       console.log(this.allOptionCurrency);
  //     });
  // }
}
