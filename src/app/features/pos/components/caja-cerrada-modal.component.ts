import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-caja-cerrada-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="apple-font ios-modal">
      <div class="modal-icon">
        <mat-icon class="!text-[32px] !w-[32px] !h-[32px] text-[#FF9500]">lock</mat-icon>
      </div>
      
      <h2 class="modal-h2">Terminal Bloqueada</h2>
      <p class="modal-p">Para empezar a registrar ventas y agregar productos a la orden, primero debes abrir el turno del día.</p>
      
      <div class="modal-actions">
        <button class="sys-btn sys-btn--secondary" (click)="dialogRef.close()">
          Cancelar
        </button>
        <button class="sys-btn sys-btn--primary" (click)="irAApertura()">
          <mat-icon class="!text-[18px]">lock_open</mat-icon> Abrir
        </button>
      </div>
    </div>
  `,
  styles: [`
    .apple-font {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .ios-modal {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      padding: 32px 24px; background: #FFFFFF; border-radius: 20px;
    }
    
    .modal-icon {
      width: 64px; height: 64px; border-radius: 32px; background: #FFF4E5;
      display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
    }
    
    .modal-h2 { margin: 0 0 8px; font-size: 1.4rem; font-weight: 700; color: #000000; letter-spacing: -0.02em; }
    
    .modal-p {
      margin: 0 0 32px; font-size: 0.95rem; color: #8E8E93; line-height: 1.4; max-width: 320px;
    }
    
    .modal-actions { display: flex; width: 100%; gap: 12px; }
    
    .sys-btn {
      flex: 1; height: 48px; border-radius: 14px; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      font-size: 1rem; font-weight: 600; letter-spacing: 0.01em; transition: all 0.2s;
    }
    .sys-btn:active { transform: scale(0.97); opacity: 0.9; }

    .sys-btn--secondary { background: #E5E5EA; color: #1C1C1E; }
    .sys-btn--secondary:hover { background: #D1D1D6; }
    .sys-btn--primary { background: #007AFF; color: #FFFFFF; }
  `]
})
export class CajaCerradaModalComponent {
  dialogRef = inject(MatDialogRef<CajaCerradaModalComponent>);
  private router = inject(Router);

  irAApertura() {
    this.dialogRef.close();
    this.router.navigate(['/caja/apertura']);
  }
}
