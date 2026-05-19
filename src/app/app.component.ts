import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import jsPDF from 'jspdf';

type PdfOrientation = 'portrait' | 'landscape';
type PdfPageFormat = 'a4' | 'image';
type PdfImageFormat = 'JPEG' | 'PNG';
type MessageType = 'success' | 'error' | 'info';

interface ImportedImage {
  id: string;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  previewUrl: string;
  pdfDataUrl: string;
  pdfFormat: PdfImageFormat;
}

interface StatusMessage {
  type: MessageType;
  text: string;
}

interface PageConfig {
  width: number;
  height: number;
  margin: number;
  orientation: PdfOrientation;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const A4_PORTRAIT = {
  width: 595.28,
  height: 841.89,
};
const IMAGE_POINT_RATIO = 0.75;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  readonly acceptedFileTypes = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

  images: ImportedImage[] = [];
  orientation: PdfOrientation = 'portrait';
  pageFormat: PdfPageFormat = 'a4';
  isDraggingOver = false;
  isGenerating = false;
  statusMessage: StatusMessage | null = null;

  get hasImages(): boolean {
    return this.images.length > 0;
  }

  get imageCountLabel(): string {
    if (this.images.length === 0) {
      return 'Aucune image';
    }

    return this.images.length === 1 ? '1 image' : `${this.images.length} images`;
  }

  async onFileSelection(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    await this.addFiles(input.files);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = false;
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDraggingOver = false;
    await this.addFiles(event.dataTransfer?.files ?? null);
  }

  reorderImages(event: CdkDragDrop<ImportedImage[]>): void {
    moveItemInArray(this.images, event.previousIndex, event.currentIndex);
    this.setStatus('info', 'Ordre des images mis à jour.');
  }

  moveImage(index: number, direction: -1 | 1): void {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= this.images.length) {
      return;
    }

    moveItemInArray(this.images, index, nextIndex);
    this.setStatus('info', 'Ordre des images mis à jour.');
  }

  removeImage(imageId: string): void {
    this.images = this.images.filter((image) => image.id !== imageId);
    this.setStatus('info', 'Image supprimée.');
  }

  clearImages(): void {
    this.images = [];
    this.setStatus('info', 'Toutes les images ont été supprimées.');
  }

  trackByImageId(_: number, image: ImportedImage): string {
    return image.id;
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} o`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} Ko`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  }

  async generatePdf(): Promise<void> {
    if (!this.hasImages || this.isGenerating) {
      return;
    }

    this.isGenerating = true;
    this.setStatus('info', 'Génération du PDF en cours...');

    try {
      const firstPage = this.getPageConfig(this.images[0]);
      const pdf = new jsPDF({
        orientation: firstPage.orientation,
        unit: 'pt',
        format: [firstPage.width, firstPage.height],
        compress: true,
      });

      this.images.forEach((image, index) => {
        const page = this.getPageConfig(image);

        if (index > 0) {
          pdf.addPage([page.width, page.height], page.orientation);
        }

        this.addImageToPage(pdf, image, page);
      });

      pdf.save('imagenpdf.pdf');
      this.setStatus('success', 'PDF généré et téléchargé avec succès.');
    } catch (error) {
      console.error(error);
      this.setStatus('error', 'Impossible de générer le PDF. Vérifiez les images puis réessayez.');
    } finally {
      this.isGenerating = false;
    }
  }

  private async addFiles(fileList: FileList | null): Promise<void> {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList);
    const acceptedFiles = files.filter((file) => this.isSupportedImage(file));
    const refusedCount = files.length - acceptedFiles.length;

    if (acceptedFiles.length === 0) {
      this.setStatus('error', 'Aucun fichier compatible. Formats acceptés : JPG, JPEG, PNG et WEBP.');
      return;
    }

    try {
      const importedImages = await Promise.all(
        acceptedFiles.map((file) => this.createImportedImage(file)),
      );

      this.images = [...this.images, ...importedImages];

      if (refusedCount > 0) {
        this.setStatus(
          'error',
          `${refusedCount} fichier${refusedCount > 1 ? 's' : ''} ignoré${refusedCount > 1 ? 's' : ''}. Formats acceptés : JPG, JPEG, PNG et WEBP.`,
        );
        return;
      }

      this.setStatus('success', `${importedImages.length} image${importedImages.length > 1 ? 's' : ''} ajoutée${importedImages.length > 1 ? 's' : ''}.`);
    } catch (error) {
      console.error(error);
      this.setStatus('error', "Une image n'a pas pu être lue. Essayez avec un autre fichier.");
    }
  }

  private isSupportedImage(file: File): boolean {
    if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return true;
    }

    return /\.(jpe?g|png|webp)$/i.test(file.name);
  }

  private async createImportedImage(file: File): Promise<ImportedImage> {
    const previewUrl = await this.readFileAsDataUrl(file);
    const dimensions = await this.getImageDimensions(previewUrl);
    const pdfImage = await this.prepareImageForPdf(file, previewUrl, dimensions.width, dimensions.height);

    return {
      id: `${Date.now()}-${this.createRandomId()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      width: dimensions.width,
      height: dimensions.height,
      previewUrl,
      pdfDataUrl: pdfImage.dataUrl,
      pdfFormat: pdfImage.format,
    };
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Image illisible'));
      image.src = dataUrl;
    });
  }

  private async prepareImageForPdf(
    file: File,
    dataUrl: string,
    width: number,
    height: number,
  ): Promise<{ dataUrl: string; format: PdfImageFormat }> {
    if (file.type === 'image/png' || /\.png$/i.test(file.name)) {
      return { dataUrl, format: 'PNG' };
    }

    if (file.type === 'image/webp' || /\.webp$/i.test(file.name)) {
      return {
        dataUrl: await this.convertToJpegDataUrl(dataUrl, width, height),
        format: 'JPEG',
      };
    }

    return { dataUrl, format: 'JPEG' };
  }

  private convertToJpegDataUrl(dataUrl: string, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Canvas non disponible'));
          return;
        }

        canvas.width = width;
        canvas.height = height;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      image.onerror = () => reject(new Error('Conversion impossible'));
      image.src = dataUrl;
    });
  }

  private getPageConfig(image: ImportedImage): PageConfig {
    if (this.pageFormat === 'a4') {
      const isLandscape = this.orientation === 'landscape';
      const width = isLandscape ? A4_PORTRAIT.height : A4_PORTRAIT.width;
      const height = isLandscape ? A4_PORTRAIT.width : A4_PORTRAIT.height;

      return {
        width,
        height,
        margin: 28,
        orientation: this.orientation,
      };
    }

    const width = Math.max(image.width * IMAGE_POINT_RATIO, 1);
    const height = Math.max(image.height * IMAGE_POINT_RATIO, 1);

    return {
      width,
      height,
      margin: 0,
      orientation: width >= height ? 'landscape' : 'portrait',
    };
  }

  private addImageToPage(pdf: jsPDF, image: ImportedImage, page: PageConfig): void {
    const availableWidth = page.width - page.margin * 2;
    const availableHeight = page.height - page.margin * 2;
    const ratio = Math.min(availableWidth / image.width, availableHeight / image.height);
    const renderedWidth = image.width * ratio;
    const renderedHeight = image.height * ratio;
    const x = (page.width - renderedWidth) / 2;
    const y = (page.height - renderedHeight) / 2;

    pdf.addImage(image.pdfDataUrl, image.pdfFormat, x, y, renderedWidth, renderedHeight);
  }

  private createRandomId(): string {
    if ('randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return Math.random().toString(36).slice(2);
  }

  private setStatus(type: MessageType, text: string): void {
    this.statusMessage = { type, text };
  }
}
