import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

/**
 * تحسين 1: Animation Variants
 * متغيرات الحركة القابلة لإعادة الاستخدام
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
};

export const slideDown = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
};

export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

/**
 * تحسين 2: Loading Skeleton Component
 * مكون Skeleton محسّن
 */
export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      {...props}
    />
  );
}

/**
 * تحسين 3: Card Skeleton
 */
export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

/**
 * تحسين 4: Table Skeleton
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * تحسين 5: Enhanced Toast Notifications
 * إشعارات محسّنة مع أيقونات
 */
export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      duration: 3000,
    });
  },

  error: (message: string) => {
    toast.error(message, {
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      duration: 4000,
    });
  },

  info: (message: string) => {
    toast.info(message, {
      icon: <Info className="h-5 w-5 text-blue-600" />,
      duration: 3000,
    });
  },

  warning: (message: string) => {
    toast.warning(message, {
      icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
      duration: 3500,
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      icon: <Loader2 className="h-5 w-5 animate-spin text-gray-600" />,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },
};

/**
 * تحسين 6: Animated Page Transition
 * مكون للانتقال بين الصفحات مع حركة
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * تحسين 7: Animated List
 * قائمة مع حركة لكل عنصر
 */
export function AnimatedList({ children }: { children: React.ReactNode[] }) {
  return (
    <AnimatePresence>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={slideUp}
          transition={{ delay: index * 0.1 }}
        >
          {child}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

/**
 * تحسين 8: Empty State Component
 * مكون لحالة فارغة محسّن
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      initial="initial"
      animate="animate"
      variants={scaleIn}
    >
      <div className="rounded-full bg-gray-100 p-6 mb-4">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </motion.div>
  );
}

/**
 * تحسين 9: Error Message Component
 * مكون لعرض الأخطاء بشكل أفضل
 */
export function ErrorMessage({
  title = 'حدث خطأ',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <motion.div
      className="bg-red-50 border border-red-200 rounded-lg p-4"
      initial="initial"
      animate="animate"
      variants={slideDown}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-900 mb-1">{title}</h4>
          <p className="text-sm text-red-700">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-red-600 hover:text-red-700 underline"
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * تحسين 10: Loading Overlay
 * غطاء تحميل شامل
 */
export function LoadingOverlay({ message = 'جاري التحميل...' }: { message?: string }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-lg p-6 shadow-xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-green-600" />
            <p className="text-gray-700 font-medium">{message}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * تحسين 11: Animated Card
 * بطاقة مع حركة hover
 */
export function AnimatedCard({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * تحسين 12: Animated Button
 * زر مع حركة
 */
export function AnimatedButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      className={className}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
