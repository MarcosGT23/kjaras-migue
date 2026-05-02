import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// Interface para los datos del ticket
export interface TicketData {
  fecha: string;
  hora: string;
  mesa: string;
  pedidoId: number;
  usuario?: string;
  items: TicketItem[];
  total: number;
  metodoPago: 'efectivo' | 'qr' | 'tarjeta';
  tipoOrden?: 'para_llevar' | 'mesa';
  montoEntregado?: number;
  cambio?: number;
}

export interface TicketItem {
  cantidad: number;
  nombre: string;
  precioUnitario: number;
  subtotal: number;
  notas?: string;
}

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket.html',
  styleUrls: ['./ticket.css']
})
export class TicketComponent {
  @Input() ticketData: TicketData = {
    fecha: '',
    hora: '',
    mesa: '',
    pedidoId: 0,
    usuario: '',
    items: [],
    total: 0,
    metodoPago: 'efectivo'
  };

  imprimir() {
    // Pequeño delay para que Angular renderice los datos antes de imprimir
    setTimeout(() => {
      window.print();
    }, 200);
  }
}
