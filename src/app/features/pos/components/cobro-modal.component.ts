import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-cobro-modal',
  standalone: true,
  imports: [CommonModule, DecimalPipe, ReactiveFormsModule,
    MatDialogModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule],
  template: `
    <div class="apple-font ios-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">Procesar Pago</h2>
        <button class="close-btn" mat-dialog-close [disabled]="loading()">
          <mat-icon class="!text-[20px]">close</mat-icon>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        
        <!-- Total amount -->
        <div class="total-display">
          <span class="total-label">TOTAL A PAGAR</span>
          <span class="total-value">Bs. {{ data.total | number:'1.2-2' }}</span>
        </div>

        <!-- Form fields -->
        <div class="ios-form">
          <div class="form-group">
            <label class="ios-label">NOMBRE DEL CLIENTE (Opcional)</label>
            <div class="input-wrapper">
              <input type="text" [formControl]="clienteCtrl" placeholder="Ej. Juan Pérez" class="ios-input">
            </div>
          </div>

          <div class="form-group">
            <label class="ios-label">TIPO DE PEDIDO</label>
            <div class="ios-segmented">
              <button class="seg-btn" [class.seg-btn--active]="tipoPedido() === 'mesa'" (click)="tipoPedido.set('mesa')">
                <mat-icon class="!text-[18px]">restaurant</mat-icon> Mesa
              </button>
              <button class="seg-btn" [class.seg-btn--active]="tipoPedido() === 'llevar'" (click)="tipoPedido.set('llevar')">
                <mat-icon class="!text-[18px]">takeout_dining</mat-icon> Para Llevar
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="ios-label">MÉTODO DE PAGO</label>
            <div class="methods-grid">
              @for (m of metodos; track m.key) {
                <button class="method-card" 
                        [class.method-card--active]="metodo() === m.key"
                        (click)="metodo.set(m.key); monto.reset()">
                  <div class="method-icon" [style.background]="m.bg" [style.color]="m.fg">
                    <mat-icon class="!text-[22px]">{{ m.icon }}</mat-icon>
                  </div>
                  <span class="method-name">{{ m.label }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Efectivo -->
          @if (metodo() === 'efectivo') {
            <div class="cash-section">
              <div class="form-group">
                <label class="ios-label">EFECTIVO ENTREGADO</label>
                <div class="input-wrapper">
                  <span class="currency-prefix">Bs.</span>
                  <input type="number" [formControl]="monto" min="0" placeholder="0.00" 
                         (focus)="$any($event.target).select()"
                         class="ios-input ios-input--large"
                         [class.input-error]="monto.invalid && monto.touched">
                </div>
              </div>

              <div class="quick-amounts">
                @for (q of quicks(); track q) {
                  <button class="quick-btn" (click)="monto.setValue(q)">+ {{ q }}</button>
                }
              </div>

              <!-- Cambio -->
              <div class="cambio-box" [class.cambio-box--warn]="cambio() < 0">
                <span class="cambio-label">{{ cambio() >= 0 ? 'CAMBIO A DEVOLVER' : 'FALTA PAGAR' }}</span>
                <span class="cambio-val">Bs. {{ (cambio() < 0 ? -cambio() : cambio()) | number:'1.2-2' }}</span>
              </div>
            </div>
          }

          <!-- Non-cash info -->
          @if (metodo() !== 'efectivo') {
            <div class="info-banner text-blue-600 bg-blue-50">
              <mat-icon class="!text-[18px]">info</mat-icon>
              <span>Verifica la transacción en tu banco antes de confirmar.</span>
            </div>
          }

          @if (errMsg()) {
            <div class="info-banner text-red-600 bg-red-50">
              <mat-icon class="!text-[18px]">error</mat-icon>
              <span>{{ errMsg() }}</span>
            </div>
          }
        </div>

      </div>

      <!-- Actions -->
      <div class="modal-footer">
        <button class="sys-btn sys-btn--secondary" mat-dialog-close [disabled]="loading()">Cancelar</button>
        <button class="sys-btn sys-btn--primary" [disabled]="!valido() || loading()" (click)="confirm()">
          @if (loading()) { <mat-spinner diameter="18"></mat-spinner> }
          @else { <span>Confirmar Cobro</span> }
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
      display: flex; flex-direction: column; width: 100%; min-width: 320px; max-width: 500px;
      background: #FFFFFF; max-height: 90vh;
      @media (max-width: 420px) { min-width: unset; }
    }

    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 24px 16px; border-bottom: 0.5px solid rgba(0,0,0,0.08);
      flex-shrink: 0;
      @media (max-width: 420px) { padding: 16px 16px 12px; }
    }
    .modal-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #000000; letter-spacing: -0.01em; @media (max-width: 420px) { font-size: 1.1rem; } }
    .close-btn {
      width: 32px; height: 32px; border-radius: 16px; background: #F2F2F7; color: #8E8E93;
      display: flex; align-items: center; justify-content: center; border: none; cursor: pointer;
    }

    .modal-body { padding: 20px 24px; flex: 1; overflow-y: auto; @media (max-width: 420px) { padding: 16px; } }
    .modal-body::-webkit-scrollbar { width: 4px; }
    .modal-body::-webkit-scrollbar-thumb { background: #E5E5EA; border-radius: 4px; }

    /* Total Hero */
    .total-display {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 0 0 24px;
    }
    .total-label { font-size: 0.75rem; font-weight: 700; color: #8E8E93; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .total-value { font-size: 3rem; font-weight: 800; color: #000000; letter-spacing: -0.04em; line-height: 1; @media (max-width: 420px) { font-size: 2.2rem; } }

    /* Forms */
    .ios-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .ios-label { font-size: 0.75rem; font-weight: 600; color: #8E8E93; letter-spacing: 0.04em; margin-left: 8px; }
    
    .input-wrapper { position: relative; }
    .ios-input {
      width: 100%; padding: 14px 16px; background: #F2F2F7; border: 1.5px solid transparent;
      border-radius: 12px; font-size: 1.05rem; color: #1C1C1E; font-family: inherit; outline: none;
      transition: all 0.2s;
    }
    .ios-input:focus { background: #FFFFFF; border-color: #007AFF; box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1); }
    
    /* Segmented Control */
    .ios-segmented {
      display: flex; background: #F2F2F7; border-radius: 10px; padding: 3px; gap: 2px;
    }
    .seg-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px 0; border: none; border-radius: 8px; background: transparent;
      font-size: 0.95rem; font-weight: 600; color: #8E8E93; cursor: pointer; transition: all 0.2s;
    }
    .seg-btn--active { background: #FFFFFF; color: #000000; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

    /* Methods */
    .methods-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; @media (max-width: 420px) { gap: 8px; } }
    .method-card {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
      padding: 16px 8px; background: #FFFFFF; border: 1.5px solid #E5E5EA; border-radius: 14px;
      cursor: pointer; transition: all 0.15s;
      @media (max-width: 420px) { padding: 12px 6px; gap: 6px; border-radius: 12px; }
    }
    .method-card:hover { border-color: #C7C7CC; }
    .method-card--active { border-color: #007AFF; background: #F0F8FF; box-shadow: 0 4px 12px rgba(0,122,255,0.1); }
    
    .method-icon { width: 44px; height: 44px; border-radius: 22px; display: flex; align-items: center; justify-content: center; @media (max-width: 420px) { width: 36px; height: 36px; } }
    .method-name { font-size: 0.85rem; font-weight: 600; color: #1C1C1E; }

    /* Cash specific */
    .cash-section { display: flex; flex-direction: column; gap: 16px; padding-top: 8px;}
    .currency-prefix { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 1.4rem; font-weight: 600; color: #8E8E93; }
    .ios-input--large { padding-left: 56px; font-size: 1.5rem; font-weight: 700; height: 56px; }
    .input-error { border-color: #FF3B30 !important; }
    
    .quick-amounts { display: flex; gap: 8px; flex-wrap: wrap; }
    .quick-btn {
      padding: 8px 16px; border-radius: 10px; border: none; background: #F2F2F7;
      font-size: 0.95rem; font-weight: 600; color: #007AFF; cursor: pointer; transition: background 0.15s;
    }
    .quick-btn:active { background: #E5E5EA; transform: scale(0.96); }

    .cambio-box {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 16px; border-radius: 14px; background: #F2F2F7; margin-top: 8px;
    }
    .cambio-label { font-size: 0.75rem; font-weight: 700; color: #8E8E93; letter-spacing: 0.05em; margin-bottom: 2px;}
    .cambio-val { font-size: 1.5rem; font-weight: 800; color: #34C759; letter-spacing: -0.02em;}
    
    .cambio-box--warn { background: #FFE5E5; }
    .cambio-box--warn .cambio-val { color: #FF3B30; }

    /* Banners */
    .info-banner {
      display: flex; align-items: center; gap: 10px; padding: 12px 16px; 
      border-radius: 12px; font-size: 0.9rem; font-weight: 600; margin-top: 10px;
    }

    /* Actions */
    .modal-footer {
      display: flex; gap: 12px; padding: 16px 24px 24px;
      border-top: 0.5px solid rgba(0,0,0,0.08); flex-shrink: 0;
      @media (max-width: 420px) { padding: 12px 16px 16px; gap: 8px; }
    }
    .sys-btn {
      flex: 1; height: 50px; border-radius: 14px; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      font-size: 1.05rem; font-weight: 600; letter-spacing: 0.01em; transition: all 0.2s;
      @media (max-width: 420px) { height: 44px; font-size: 0.9rem; }
    }
    .sys-btn:active { transform: scale(0.97); opacity: 0.9; }

    .sys-btn--secondary { background: #E5E5EA; color: #1C1C1E; }
    .sys-btn--primary { background: #007AFF; color: #FFFFFF; flex: 1.5; }
    .sys-btn--primary:disabled { background: #E5E5EA; color: #8E8E93; cursor: not-allowed; transform: none; }
  `]
})
export class CobroModalComponent {
  dialogRef = inject(MatDialogRef<CobroModalComponent>);
  data      = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  metodo  = signal<'efectivo'|'qr'|'tarjeta'>('efectivo');
  tipoPedido = signal<'mesa'|'llevar'>('mesa');
  loading = signal(false);
  errMsg  = signal('');

  metodos = [
    { key: 'efectivo' as const, label: 'Efectivo',   icon: 'payments',   bg: '#E5F4EA', fg: '#34C759' },
    { key: 'qr'       as const, label: 'QR / Trans.', icon: 'qr_code_2', bg: '#FFF4E5', fg: '#FF9500' },
  ]

  clienteCtrl = this.fb.control<string>('');
  monto   = this.fb.control<number|null>(null, [Validators.required, Validators.min(this.data.total)]);

  /** Signal sincronizada con el form control para que los computed se actualicen reactivamente */
  private montoSignal = signal<number | null>(null);

  cambio  = computed(() => Math.round(((this.montoSignal()??0) - this.data.total)*100)/100);
  valido  = computed(() => {
    if (this.metodo()==='efectivo') { const v = this.montoSignal(); return v !== null && v >= this.data.total; }
    return true;
  });
  quicks  = computed(() => {
    const t = this.data.total as number;
    const amounts = [Math.ceil(t/5)*5, Math.ceil(t/10)*10, Math.ceil(t/20)*20, Math.ceil(t/50)*50, Math.ceil(t/100)*100];
    return [...new Set(amounts)].filter(c=>c>=t).slice(0,3);
  });

  constructor() {
    this.monto.valueChanges.subscribe(v => this.montoSignal.set(v));
  }

  async confirm() {
    if (!this.valido()) return;
    this.loading.set(true); this.errMsg.set('');
    try {
      await new Promise(r => setTimeout(r, 900));
      this.dialogRef.close({ 
        exito: true, 
        metodo: this.metodo(),
        cliente: this.clienteCtrl.value?.trim() || 'Cliente General',
        tipoPedido: this.tipoPedido(),
        montoEntregado: this.metodo() === 'efectivo' ? this.monto.value : undefined,
        cambio: this.metodo() === 'efectivo' ? this.cambio() : undefined
      });
    } catch { this.errMsg.set('Error al registrar la venta.'); }
    finally { this.loading.set(false); }
  }
}
