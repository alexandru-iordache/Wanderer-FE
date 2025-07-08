import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { PlatformService } from '../../../services/platform.service';
import { SearchResponseDto } from '../../../interfaces/dtos/response/search-response-dto';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, of, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent implements OnDestroy {
  @Input() placeholder: string = 'Search trips or users';
  @Input() value: string = '';
  @Input() showClearButton: boolean = true;
  @Output() valueChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<string>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();

  searchResults: SearchResponseDto[] = [];
  showDropdown: boolean = false;
  isLoading: boolean = false;
  maxResults: number = 10;
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private platformService: PlatformService, private router: Router) {
    this.setupSearchSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchSubscription(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchText => {
        if (searchText.trim().length < 2) {
          return of([]);
        }
        this.isLoading = true;
        return this.platformService.search(searchText);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results) => {
        this.searchResults = results.slice(0, this.maxResults);
        this.isLoading = false;
        this.showDropdown = results.length > 0;
      },
      error: (error) => {
        console.error('Search error:', error);
        this.isLoading = false;
        this.showDropdown = false;
      }
    });
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.valueChange.emit(this.value);
    
    if (this.value.trim().length >= 2) {
      this.searchSubject.next(this.value);
    } else {
      this.hideDropdown();
    }
  }

  onFocus(): void {
    this.focus.emit();
    if (this.value.trim().length >= 2 && this.searchResults.length > 0) {
      this.showDropdown = true;
    }
  }

  onBlur(): void {
    setTimeout(() => {
      this.hideDropdown();
      this.blur.emit();
    }, 200);
  }

  clearSearch(): void {
    this.value = '';
    this.valueChange.emit(this.value);
    this.search.emit(this.value);
    this.hideDropdown();
  }

  hideDropdown(): void {
    this.showDropdown = false;
  }

  onResultClick(result: SearchResponseDto): void {
    if (result.type === 'trip') {
      this.router.navigate(['/trip', result.id]);
    } else if (result.type === 'user') {
      this.router.navigate(['/profile', result.id]);
    }
    this.hideDropdown();
  }
  getFirstLetterOf(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}
