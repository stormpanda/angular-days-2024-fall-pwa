import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { PaintService } from './paint.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  private readonly paintService = inject(PaintService);

  // LAB #1
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  // LAB #2.1
  context!: CanvasRenderingContext2D;
  // LAB #5
  previousPoint?: { x: number; y: number };
  // LAB #11
  readonly fileOptions: FilePickerOptions = {
    types: [
      {
        description: 'PNG files',
        accept: {
          'image/png': ['.png'],
        },
      },
    ],
  };

  // LAB #17
  readonly supported = {
    open: 'showOpenFilePicker' in window,
    save: 'showSaveFilePicker' in window,
    copy: 'clipboard' in navigator && 'write' in navigator.clipboard,
    paste: 'clipboard' in navigator && 'read' in navigator.clipboard,
    share: 'share' in navigator,
  };

  ngAfterViewInit(): void {
    // LAB #2.2, 2.3 and 3
    const canvas = this.canvas().nativeElement;
    const ctx = canvas.getContext('2d', {
      desynchronized: true,
    })!;
    this.context = ctx;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    // LAB #16
  }

  onPointerDown(event: PointerEvent) {
    // LAB #5
    this.previousPoint = { x: event.offsetX, y: event.offsetY };
  }

  onPointerMove(event: PointerEvent) {
    // LAB #5
    if (this.previousPoint) {
      const currentPoint = { x: event.offsetX, y: event.offsetY };
      for (const point of this.paintService.bresenhamLine(
        this.previousPoint,
        currentPoint
      )) {
        this.context.fillRect(point.x, point.y, 2, 2);
      }
      this.previousPoint = currentPoint;
    }
  }

  onPointerUp() {
    // LAB #5
    this.previousPoint = undefined;
  }

  onColorChange(color: HTMLInputElement) {
    // LAB #6
    this.context.fillStyle = color.value;
  }

  async open() {
    // LAB #12
    const [handle] = await window.showOpenFilePicker();
    const file = await handle.getFile();
    const image = await this.paintService.getImage(file);
    this.context.drawImage(image, 0, 0);
  }

  async save() {
    // LAB #11
    const blob = await this.paintService.toBlob(this.canvas().nativeElement);
    const handle = await window.showSaveFilePicker(this.fileOptions);
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  async copy() {
    // LAB #13
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': (await this.paintService.toBlob(
          this.canvas().nativeElement
        )) as Blob,
      }),
    ]);
  }

  async paste() {
    // LAB #14
    const clipboardItems = await navigator.clipboard.read();
    for (const item of clipboardItems) {
      for (const type of item.types) {
        if (type === 'image/png') {
          const blob = await item.getType(type);
          const image = await this.paintService.getImage(blob);
          this.context.drawImage(image, 0, 0);
        }
      }
    }
  }

  async share() {
    // LAB #15
    const blob = await this.paintService.toBlob(this.canvas().nativeElement);
    const file = new File([blob], 'image.png', { type: blob.type });
    const item = { files: [file] };
    if (navigator.canShare(item)) {
      await navigator.share(item);
    }
  }
}
