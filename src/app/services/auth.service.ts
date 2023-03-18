import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthData } from '../interfaces/auth-data';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = false
  private token = ''
  private tokenTimer: any
  private authStatusListener = new Subject<boolean>()
  constructor(private http: HttpClient, private router: Router) { }

  getToken() {
    return this.token
  }

  getIsAuth() {
    return this.isAuthenticated
  }

  getAuthStatusListener() {
    return this.authStatusListener.asObservable()
  }

  createUser(email: string, password: string) {
    const authData: AuthData = { email, password }
    this.http.post('http://localhost:3000/api/users/signup', authData).subscribe((res) => {

    })
  }

  loginUser(email: string, password: string) {
    const authData: AuthData = { email, password }
    this.http.post<{ token: string, expiresIn: number }>('http://localhost:3000/api/users/login', authData).subscribe((res) => {
      const token = res.token
      this.token = token
      if (token) {
        const expiresInDuration = res.expiresIn
        this.setAuthTimer(expiresInDuration)
        this.isAuthenticated = true
        this.authStatusListener.next(true)
        const now = new Date()
        const expirationDate = new Date(now.getTime() + expiresInDuration * 1000)
        this.saveAuthData(token, expirationDate)
        this.router.navigate(['/'])
      }
    })
  }

  autoAuthUser() {
    const authInformation = this.getAuthData()
    if (!authInformation) return
    const now = new Date()
    const expiresIn = authInformation.expirationDate.getTime() - now.getTime()
    if (expiresIn < 0) {
      this.token = authInformation.token
      this.isAuthenticated = true
      this.setAuthTimer(expiresIn / 1000)
      this.authStatusListener.next(true)
    }
  }

  private setAuthTimer(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logOut()
    }, duration * 1000)
  }

  logOut() {
    this.token = null
    this.isAuthenticated = false
    this.authStatusListener.next(false)
    clearTimeout(this.tokenTimer)
    this.clearAuthData()
    this.router.navigate(['/'])
  }

  private saveAuthData(token: string, expirationDate: Date) {
    localStorage.setItem('token', token)
    localStorage.setItem('expiration', expirationDate.toISOString())
  }

  private clearAuthData() {
    localStorage.removeItem('token')
    localStorage.removeItem('expiration')
  }

  private getAuthData() {
    const token = localStorage.getItem('token')
    const expirationDate = localStorage.getItem('expiration')
    if (!token || !expirationDate) return ''
    return {
      token,
      expirationDate: new Date(expirationDate)
    }
  }
}