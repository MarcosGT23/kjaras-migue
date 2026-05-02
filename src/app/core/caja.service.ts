import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CajaService {
  cajaAbierta = signal<boolean>(false);

  abrirCaja() {
    this.cajaAbierta.set(true);
  }

  cerrarCaja() {
    this.cajaAbierta.set(false);
  }
}
