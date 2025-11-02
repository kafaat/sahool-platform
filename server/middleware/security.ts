import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';

/**
 * تحسين 1: Rate Limiting Middleware
 * حماية من هجمات DDoS والطلبات المفرطة
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // حد أقصى 100 طلب لكل IP
  message: 'تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * تحسين 2: Rate Limiting للمصادقة
 * حماية أقوى لنقاط المصادقة
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // حد أقصى 5 محاولات تسجيل دخول
  message: 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول، يرجى المحاولة بعد 15 دقيقة',
  skipSuccessfulRequests: true,
});

/**
 * تحسين 3: Input Sanitization
 * تنظيف المدخلات من الأحرف الخطرة
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // إزالة HTML tags
    .replace(/javascript:/gi, '') // إزالة javascript: protocol
    .replace(/on\w+=/gi, '') // إزالة event handlers
    .slice(0, 1000); // حد أقصى 1000 حرف
}

/**
 * تحسين 4: Sanitization Middleware
 * تطبيق التنظيف على جميع المدخلات
 */
export function sanitizationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // تنظيف query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeInput(req.query[key] as string);
      }
    });
  }

  // تنظيف body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }

  next();
}

/**
 * تحسين 5: Security Headers
 * إضافة headers أمنية باستخدام helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.manus.im'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * تحسين 6: CORS Configuration
 * تكوين CORS آمن
 */
export const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // استبدل بدومينك
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};

/**
 * تحسين 7: Input Validation Schemas
 * Schemas للتحقق من صحة المدخلات
 */
export const validationSchemas = {
  // Schema للمزرعة
  farm: z.object({
    name: z.string().min(2).max(100),
    location: z.string().min(2).max(200),
    area: z.number().positive().max(1000000),
    cropType: z.string().min(2).max(50),
  }),

  // Schema للمعدة
  equipment: z.object({
    name: z.string().min(2).max(100),
    type: z.string().min(2).max(50),
    status: z.enum(['active', 'maintenance', 'inactive']),
    farmId: z.number().positive(),
  }),

  // Schema للتنبيه
  alert: z.object({
    title: z.string().min(2).max(100),
    message: z.string().min(2).max(500),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    farmId: z.number().positive(),
  }),

  // Schema للمهمة
  task: z.object({
    title: z.string().min(2).max(100),
    description: z.string().min(2).max(500),
    dueDate: z.string().datetime(),
    priority: z.enum(['low', 'medium', 'high']),
    status: z.enum(['pending', 'in_progress', 'completed']),
    farmId: z.number().positive(),
  }),
};

/**
 * تحسين 8: Validation Middleware Factory
 * إنشاء middleware للتحقق من صحة المدخلات
 */
export function validateInput(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'بيانات غير صالحة',
          details: error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        res.status(500).json({ error: 'خطأ في التحقق من البيانات' });
      }
    }
  };
}

/**
 * تحسين 9: SQL Injection Protection
 * التحقق من وجود محاولات SQL injection
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|;|\/\*|\*\/)/g,
    /(\bOR\b.*=.*)/gi,
    /(\bAND\b.*=.*)/gi,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * تحسين 10: SQL Injection Middleware
 * حماية من هجمات SQL injection
 */
export function sqlInjectionProtection(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const checkObject = (obj: any): boolean => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && detectSQLInjection(obj[key])) {
        return true;
      }
      if (typeof obj[key] === 'object' && checkObject(obj[key])) {
        return true;
      }
    }
    return false;
  };

  if (checkObject(req.query) || checkObject(req.body)) {
    return res.status(400).json({
      error: 'تم اكتشاف محاولة هجوم، تم رفض الطلب',
    });
  }

  next();
}

/**
 * تحسين 11: XSS Protection
 * حماية من هجمات Cross-Site Scripting
 */
export function xssProtection(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
  ];

  const checkForXSS = (value: any): boolean => {
    if (typeof value === 'string') {
      return xssPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkForXSS);
    }
    return false;
  };

  if (checkForXSS(req.body) || checkForXSS(req.query)) {
    return res.status(400).json({
      error: 'تم اكتشاف محاولة هجوم XSS، تم رفض الطلب',
    });
  }

  next();
}

/**
 * تحسين 12: تطبيق جميع الحمايات
 * دالة مساعدة لتطبيق جميع middleware الأمنية
 */
export function applySecurityMiddleware(app: any) {
  // 1. Security Headers
  app.use(securityHeaders);

  // 2. Rate Limiting
  app.use('/api/', apiLimiter);
  app.use('/api/auth/', authLimiter);

  // 3. Input Sanitization
  app.use(sanitizationMiddleware);

  // 4. SQL Injection Protection
  app.use(sqlInjectionProtection);

  // 5. XSS Protection
  app.use(xssProtection);
}
