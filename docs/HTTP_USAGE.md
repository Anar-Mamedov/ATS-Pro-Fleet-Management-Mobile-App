# HTTP Kullanım Kılavuzu - Basitleştirilmiş

Bu dokümantasyon ATS Pro Mobile App'te Axios HTTP kütüphanesinin **basitleştirilmiş** kullanımını açıklar.

## 📁 Dosya Yapısı

```
├── config/
│   └── http.ts              # Tek HTTP konfigürasyon dosyası
└── .env                     # Environment variables
```

## 🎯 **Basitleştirilmiş Yaklaşım**

Gereksiz abstraction katmanları kaldırıldı:

- ❌ `utils/expireToken.ts` - Backend zaten token expire ediyor
- ❌ `services/authService.ts` - HTTP calls doğrudan yapılıyor
- ❌ `services/apiService.ts` - Gereksiz wrapper'lar
- ✅ Sadece `config/http.ts` - Tek dosyada her şey

## 🔧 Konfigürasyon

### Environment Variables (.env)

```bash
EXPO_PUBLIC_BASE_URL=http://localhost:3000/api
EXPO_PUBLIC_ENV=development
```

### HTTP Client (config/http.ts)

```typescript
import http, { setToken, getToken, removeToken } from '../config/http';
```

**Özellikler:**

- ✅ Otomatik token ekleme (Authorization header)
- ✅ 401 hatalarında otomatik token temizleme ve yönlendirme
- ✅ Basit AsyncStorage wrapper'ları
- ✅ Environment-based base URL

## 🔐 Authentication

### Login

```typescript
import http, { setToken } from '../config/http';

const handleLogin = async () => {
  try {
    const response = await http.post('/auth/login', {
      email: 'user@example.com',
      password: 'password123',
    });

    // Token'ı kaydet
    await setToken(response.data.token);

    console.log('Login successful');
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Register

```typescript
const handleRegister = async () => {
  try {
    const response = await http.post('/auth/register', {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    // Token'ı kaydet
    await setToken(response.data.token);

    console.log('Registration successful');
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

### Logout

```typescript
import { removeToken } from '../config/http';

const handleLogout = async () => {
  try {
    await http.post('/auth/logout');
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    // Token'ı her durumda temizle
    await removeToken();
  }
};
```

## 📡 API Çağrıları

### Basit GET İsteği

```typescript
import http from '../config/http';

const fetchJobs = async () => {
  try {
    const response = await http.get('/jobs');
    console.log('Jobs:', response.data);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
  }
};
```

### POST İsteği

```typescript
const createJob = async () => {
  try {
    const response = await http.post('/jobs', {
      title: 'React Native Developer',
      company: 'Tech Corp',
      location: 'Istanbul',
      description: 'We are looking for...',
      requirements: ['React Native', 'TypeScript'],
    });
    console.log('Job created:', response.data);
  } catch (error) {
    console.error('Failed to create job:', error);
  }
};
```

### Query Parameters

```typescript
const fetchJobsWithParams = async () => {
  try {
    const response = await http.get('/jobs', {
      params: {
        page: 1,
        limit: 10,
        search: 'developer',
      },
    });
    console.log('Jobs:', response.data);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
  }
};
```

## 💾 Token Yönetimi

### Token Kaydetme

```typescript
import { setToken } from '../config/http';

await setToken('your-jwt-token');
```

### Token Okuma

```typescript
import { getToken } from '../config/http';

const token = await getToken();
if (token) {
  console.log('Token found:', token);
} else {
  console.log('No token found');
}
```

### Token Silme

```typescript
import { removeToken } from '../config/http';

await removeToken(); // token ve id'yi temizler
```

## 🔄 Otomatik İşlemler

### Request Interceptor

- Her request'e otomatik Authorization header ekler
- Token varsa: `Authorization: Bearer <token>`

### Response Interceptor

- 401 response aldığında:
  - Token'ı otomatik temizler
  - Ana sayfaya yönlendirir
  - User tekrar login yapabilir

## 📱 React Native'de Kullanım

### Component İçinde

```typescript
import { useState, useEffect } from 'react';
import http from '../config/http';

export default function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await http.get('/jobs');
        setJobs(response.data);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) return <Text>Loading...</Text>;

  return (
    // JSX content
  );
}
```

## 🛠️ Hata Yönetimi

### Try-Catch Kullanımı

```typescript
const handleApiCall = async () => {
  try {
    const response = await http.get('/some-endpoint');
    // Success handling
  } catch (error: any) {
    if (error.response?.status === 401) {
      // 401 - Token expired, user otomatik yönlendirilir
      console.log('Token expired, redirecting to login...');
    } else if (error.response?.status === 404) {
      // 404 - Not found
      console.error('Endpoint not found');
    } else {
      // Other errors
      console.error('API Error:', error.message);
    }
  }
};
```

## 🔍 Debug ve Test

### Test Butonları

Ana sayfada test butonları mevcut:

- **"Test API Call"** - `/test` endpoint'ini çağırır
- **"Test Login"** - Login yapıp token kaydeder

### Console Logs

```typescript
// Request/Response'ları görmek için
console.log('API Response:', response.data);
console.error('API Error:', error);
```

## 🚀 Production Ayarları

### Environment Variables

```bash
# Development
EXPO_PUBLIC_BASE_URL=http://localhost:3000/api

# Production
EXPO_PUBLIC_BASE_URL=https://your-production-api.com/api
```

## ✨ Avantajlar

1. **Basitlik** - Tek dosyada her şey
2. **Performans** - Gereksiz abstraction yok
3. **Anlaşılabilirlik** - Direkt HTTP calls
4. **Bakım** - Az dosya, kolay yönetim
5. **Otomatik** - 401 handling built-in
