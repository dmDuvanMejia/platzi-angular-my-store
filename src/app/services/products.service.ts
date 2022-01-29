import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { retry, catchError, map } from 'rxjs/operators';
import { throwError, zip } from 'rxjs';

import { Product, CreateProductDTO, UpdateProductDTO } from './../models/product.model';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  private apiUrl = `${environment.API_URL}/api/products`;

  constructor(
    private http: HttpClient
  ) { }

  getAllProducts(limit?: number, offset?: number) {
    let params = new HttpParams();
    if (limit && offset) {
      params = params.set('limit', limit);
      params = params.set('offset', limit);
    }
    return this.http.get<Product[]>(this.apiUrl, { params })
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