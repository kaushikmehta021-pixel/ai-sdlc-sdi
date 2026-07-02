import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { LinksService, Link } from './links.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private svc = inject(LinksService);

  urlInput = '';
  links = signal<Link[]>([]);
  created = signal<Link | null>(null);
  formError = signal('');
  busy = signal(false);

  ngOnInit(): void {
    this.refresh();
  }

  private refresh(): void {
    this.svc.getAll().subscribe({ next: links => this.links.set(links) });
  }

  shorten(): void {
    if (!/^https?:\/\/.+/i.test(this.urlInput)) {
      this.formError.set('URL must start with http:// or https://');
      return;
    }
    this.formError.set('');
    this.created.set(null);
    this.busy.set(true);

    this.svc.create(this.urlInput).subscribe({
      next: link => {
        this.created.set(link);
        this.urlInput = '';
        this.busy.set(false);
        this.refresh();
      },
      error: (err: HttpErrorResponse) => {
        this.formError.set(err.error?.error ?? 'Network error — please try again.');
        this.busy.set(false);
      },
    });
  }
}
