import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { retry, catchError, map } from 'rxjs/operators';
import { throwError, zip } from 'rxjs';

import { Product, CreateProductDTO, UpdateProductDTO } from './../models/product.model';
import { environment } from './../../environments/environment';
import { checkTime } from '../interceptors/time.interceptor';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  private apiUrl = `${environment.API_URL}/api/products`;

  constructor(
    private http: HttpClient
  ) { }

  getAll(limit?: number, offset?: number) {
    let params = new HttpParams();
    //Inicio de los cambios
    const temp_limit = limit as number;
    const temp_offset = offset as number;
    
    if(temp_limit?.toString().length > 0 && temp_offset?.toString().length > 0) {
      params = params.set('limit', temp_limit);
      params = params.set('offset', temp_offset);
    }
   //Fin de los cambios
    return this.http.get<Product[]>(this.apiUrl, { params, context: checkTime() })
    .pipe(
      catchError((error: HttpErrorResponse) => {
        return this.msgErrorHtmlCode(error.status);
      }),
      retry(3),
      map(products => products.map(item => {
        return {
          ...item,
          taxes: .19 * item.price
        }
      }))
    );
  }

  /**REaliza varias peticiones en paralelo */
  fetchReadAndUpdate(id: string, dto: UpdateProductDTO) {
    return zip(
      this.getProduct(id),
      this.update(id, dto)
    );
  }

  getProduct(id: string) {
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
       return this.msgErrorHtmlCode(error.status);
      }),
      retry(3),
      map(products =>  {
        return {
          ...products,
          taxes: .19 * products.price
        }
      })
    );
  }

  getProductsByPage(limit: number, offset: number) {
    return this.http.get<Product[]>(`${this.apiUrl}`, {
      params: { limit, offset }
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        return this.msgErrorHtmlCode(error.status);
      }),
      retry(3),
      map(products => products.map(item => {
        return {
          ...item,
          taxes: .19 * item.price
        }
      }))
    );
  }

  create(dto: CreateProductDTO) {
    return this.http.post<Product>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateProductDTO) {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }

  msgErrorHtmlCode(error: HttpStatusCode) {
    if (error === HttpStatusCode.Conflict) {
      return throwError(() => 'Algo esta fallando en el server');
    }
    if (error === HttpStatusCode.NotFound) {
      return throwError(() => 'El producto no existe');
    }
    if (error === HttpStatusCode.Unauthorized) {
      return throwError( () => 'No estas permitido');
    }
    return throwError( () => 'Ups algo salio mal');
  }
}