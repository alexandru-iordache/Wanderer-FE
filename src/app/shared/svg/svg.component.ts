import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-svg',
  template: '<svg [innerHTML]="svgContent" [style.width.px]="width" [style.height.px]="height" *ngIf="svgContent"></svg>',
})
export class SvgComponent implements OnInit {
  @Input() filePath: string = "";
  @Input() width: number = 0;
  @Input() height: number = 0;
  svgContent: string = "";
  
  constructor(private httpClient: HttpClient) { }

  ngOnInit(): void {
    this.loadSvg();
  }

  loadSvg() {
    this.httpClient.get(this.filePath, { responseType: 'text' })
      .subscribe(svgContent => this.svgContent = svgContent);
  }

}
