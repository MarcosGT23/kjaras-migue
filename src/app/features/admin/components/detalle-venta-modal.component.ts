import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-detalle-venta-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <div class="modal-dark">

      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="ticket-badge">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <div>
            <h2 class="modal-title">Ticket #{{ data.id }}</h2>
            <span class="modal-subtitle">{{ data.hora }} · {{ data.sucursal }}</span>
          </div>
        </div>
        <button class="close-btn" (click)="cerrar()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">

        <!-- Método y Estado -->
        <div class="info-row">
          <div class="info-item">
            <span class="info-label">Método de Pago</span>
            <div class="metodo-chip" [class]="'metodo-' + data.metodo">
              <mat-icon class="chip-icon">{{ getMetodoIcon(data.metodo) }}</mat-icon>
              {{ getMetodoLabel(data.metodo) }}
            </div>
          </div>
          <div class="info-item">
            <span class="info-label">Estado</span>
            <div class="estado-chip">
              <mat-icon class="chip-icon">check_circle</mat-icon>
              Completado
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Info de Sucursal -->
        <div class="info-section">
          <div class="section-title">
            <mat-icon>store</mat-icon>
            Información de Sucursal
          </div>
          <div class="info-grid">
            <div class="info-detail">
              <span class="detail-label">Sucursal</span>
              <span class="detail-value">{{ data.sucursal }}</span>
            </div>
            <div class="info-detail">
              <span class="detail-label">Hora de registro</span>
              <span class="detail-value">{{ data.hora }}</span>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Total -->
        <div class="total-section">
          <div class="total-row">
            <span class="total-label">Subtotal</span>
            <span class="total-value">Bs. {{ data.total.toFixed(2) }}</span>
          </div>
          <div class="total-row">
            <span class="total-label">Descuento</span>
            <span class="total-value discount">- Bs. 0.00</span>
          </div>
          <div class="divider"></div>
          <div class="total-row final">
            <span class="total-label-big">Total</span>
            <span class="total-value-big">Bs. {{ data.total.toFixed(2) }}</span>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-ghost" (click)="cerrar()">
          <mat-icon class="btn-icon">close</mat-icon> Cerrar
        </button>
        <button class="btn-primary">
          <mat-icon class="btn-icon">print</mat-icon> Reimprimir Ticket
        </button>
      </div>

    </div>
  `,
  styles: [`
    .modal-dark {
      background: #1C1C24;
      width: 480px;
      max-width: 90vw;
      overflow: hidden;
      border-radius: 20px;
    }

    /* Header */
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 22px 24px;
      background: #13131A;
      border-bottom: 1px solid #2D2D3D;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }

    .ticket-badge {
      width: 48px; height: 48px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      color: white;
      box-shadow: 0 4px 16px rgba(79,70,229,.35);
    }

    .modal-title { margin: 0; font-size: 1.15rem; font-weight: 700; color: #f1f5f9; }
    .modal-subtitle { font-size: .78rem; color: #64748b; font-weight: 500; }

    .close-btn {
      width: 36px; height: 36px; border-radius: 10px; border: none;
      background: transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #475569; transition: background .15s, color .15s;
    }
    .close-btn:hover { background: rgba(255,255,255,.06); color: #e2e8f0; }

    /* Body */
    .modal-body {
      padding: 22px 24px;
      display: flex; flex-direction: column; gap: 20px;
    }

    .divider { border: none; border-top: 1px solid #2D2D3D; margin: 0; }

    .info-row { display: flex; gap: 16px; }
    .info-item { flex: 1; display: flex; flex-direction: column; gap: 8px; }

    .info-label {
      font-size: .68rem; font-weight: 700; color: #475569;
      text-transform: uppercase; letter-spacing: .08em;
    }

    .metodo-chip, .estado-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 10px;
      font-size: .82rem; font-weight: 700; width: fit-content;
    }
    .chip-icon { font-size: 16px; width: 16px; height: 16px; }

    .metodo-efectivo     { background: rgba(245,158,11,.12); color: #fbbf24; border: 1px solid rgba(245,158,11,.25); }
    .metodo-qr           { background: rgba(99,102,241,.12); color: #818cf8; border: 1px solid rgba(99,102,241,.25); }
    .metodo-tarjeta      { background: rgba(139,92,246,.12); color: #a78bfa; border: 1px solid rgba(139,92,246,.25); }
    .metodo-transferencia{ background: rgba(16,185,129,.12); color: #34d399; border: 1px solid rgba(16,185,129,.25); }

    .estado-chip { background: rgba(16,185,129,.12); color: #34d399; border: 1px solid rgba(16,185,129,.25); }

    /* Info section */
    .info-section { display: flex; flex-direction: column; gap: 12px; }
    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: .88rem; font-weight: 700; color: #94a3b8;
    }
    .section-title mat-icon { font-size: 18px; width: 18px; height: 18px; color: #475569; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-detail { display: flex; flex-direction: column; gap: 4px; }
    .detail-label { font-size: .72rem; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
    .detail-value { font-size: .9rem; font-weight: 600; color: #e2e8f0; }

    /* Total section */
    .total-section {
      background: #13131A;
      border: 1px solid #2D2D3D;
      border-radius: 14px;
      padding: 16px 18px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .total-row { display: flex; justify-content: space-between; align-items: center; }
    .total-label { font-size: .83rem; color: #64748b; font-weight: 500; }
    .total-value { font-size: .83rem; color: #94a3b8; font-weight: 600; }
    .total-value.discount { color: #34d399; }

    .total-row.final { padding-top: 2px; }
    .total-label-big { font-size: .95rem; font-weight: 800; color: #e2e8f0; }
    .total-value-big { font-size: 1.35rem; font-weight: 800; color: #818cf8; }

    /* Footer */
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 24px;
      background: #13131A;
      border-top: 1px solid #2D2D3D;
    }

    .btn-ghost {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 8px 16px; border-radius: 10px;
      background: transparent; border: 1px solid #2D2D3D;
      color: #64748b; font-size: .82rem; font-weight: 600; cursor: pointer;
      transition: border-color .15s, color .15s;
    }
    .btn-ghost:hover { border-color: #475569; color: #94a3b8; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 8px 18px; border-radius: 10px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; font-size: .82rem; font-weight: 700;
      box-shadow: 0 4px 14px rgba(99,102,241,.25); transition: opacity .15s;
    }
    .btn-primary:hover { opacity: .9; }

    .btn-icon { font-size: 16px; width: 16px; height: 16px; }
  `]
})
export class DetalleVentaModalComponent {
  data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<DetalleVentaModalComponent>);

  cerrar() { this.dialogRef.close(); }

  getMetodoIcon(metodo: string): string {
    const iconos: Record<string, string> = {
      'efectivo': 'payments',
      'qr': 'qr_code_2',
      'tarjeta': 'credit_card',
      'transferencia': 'account_balance'
    };
    return iconos[metodo] || 'payments';
  }

  getMetodoLabel(metodo: string): string {
    const labels: Record<string, string> = {
      'efectivo': 'Efectivo',
      'qr': 'Código QR',
      'tarjeta': 'Tarjeta',
      'transferencia': 'Transferencia'
    };
    return labels[metodo] || metodo;
  }
}
