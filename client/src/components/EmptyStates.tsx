/**
 * Professional Empty States Components
 * مكونات حالات الفراغ الاحترافية
 */

import React from 'react';
import { LucideIcon, Tractor, MapPin, Calendar, AlertTriangle, Users, FileText } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Generic Empty State Component
 */
export function EmptyState({ icon: Icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6 rounded-full bg-neutral-100 p-6">
        <Icon className="h-16 w-16 text-neutral-400" />
      </div>
      
      <h3 className="mb-2 text-xl font-semibold text-neutral-900">
        {title}
      </h3>
      
      <p className="mb-6 max-w-md text-sm text-neutral-600">
        {description}
      </p>
      
      {action && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={action.onClick} size="lg">
            {action.label}
          </Button>
          
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline" size="lg">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * No Farms Empty State
 */
export function NoFarmsEmptyState({ onAddFarm }: { onAddFarm: () => void }) {
  return (
    <EmptyState
      icon={Tractor}
      title="لا توجد مزارع بعد"
      description="ابدأ بإضافة مزرعتك الأولى لتتمكن من إدارة الحقول والمعدات وتخطيط العمليات الزراعية."
      action={{
        label: '+ إضافة مزرعة جديدة',
        onClick: onAddFarm,
      }}
    />
  );
}

/**
 * No Fields Empty State
 */
export function NoFieldsEmptyState({ onAddField }: { onAddField: () => void }) {
  return (
    <EmptyState
      icon={MapPin}
      title="لا توجد حقول في هذه المزرعة"
      description="قم بإضافة حقول لهذه المزرعة لتتمكن من تتبع المحاصيل والعمليات الزراعية."
      action={{
        label: '+ إضافة حقل جديد',
        onClick: onAddField,
      }}
    />
  );
}

/**
 * No Equipment Empty State
 */
export function NoEquipmentEmptyState({ onAddEquipment }: { onAddEquipment: () => void }) {
  return (
    <EmptyState
      icon={Tractor}
      title="لا توجد معدات مسجلة"
      description="أضف معداتك الزراعية لتتمكن من تتبع حالتها وجدولة الصيانة والمراقبة المباشرة."
      action={{
        label: '+ إضافة معدة جديدة',
        onClick: onAddEquipment,
      }}
    />
  );
}

/**
 * No Work Plans Empty State
 */
export function NoWorkPlansEmptyState({ onCreatePlan }: { onCreatePlan: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="لا توجد خطط عمل"
      description="أنشئ خطة عمل جديدة لتنظيم العمليات الزراعية وتوزيع المهام على فريق العمل."
      action={{
        label: '+ إنشاء خطة عمل',
        onClick: onCreatePlan,
      }}
    />
  );
}

/**
 * No Alerts Empty State
 */
export function NoAlertsEmptyState() {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="لا توجد تنبيهات"
      description="رائع! جميع عملياتك تسير بسلاسة. سيتم عرض التنبيهات هنا عند حدوث أي مشاكل."
    />
  );
}

/**
 * No Tasks Empty State
 */
export function NoTasksEmptyState({ onAddTask }: { onAddTask: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="لا توجد مهام"
      description="أضف مهام جديدة لتنظيم العمل وتوزيعه على أعضاء الفريق."
      action={{
        label: '+ إضافة مهمة',
        onClick: onAddTask,
      }}
    />
  );
}

/**
 * No Team Members Empty State
 */
export function NoTeamMembersEmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="لا يوجد أعضاء في الفريق"
      description="قم بدعوة أعضاء جدد للانضمام إلى فريقك وإدارة المزرعة معاً."
      action={{
        label: '+ دعوة عضو جديد',
        onClick: onInvite,
      }}
    />
  );
}

/**
 * Search No Results Empty State
 */
export function SearchNoResultsEmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 text-6xl">🔍</div>
      
      <h3 className="mb-2 text-lg font-semibold text-neutral-900">
        لا توجد نتائج
      </h3>
      
      <p className="text-sm text-neutral-600">
        لم نجد أي نتائج لـ "<span className="font-medium">{searchQuery}</span>"
      </p>
      
      <p className="mt-2 text-xs text-neutral-500">
        جرب كلمات بحث مختلفة أو تحقق من الإملاء
      </p>
    </div>
  );
}

/**
 * Loading Empty State
 */
export function LoadingEmptyState({ message = 'جاري التحميل...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-primary-500"></div>
      <p className="text-sm text-neutral-600">{message}</p>
    </div>
  );
}

/**
 * Error Empty State
 */
export function ErrorEmptyState({ 
  title = 'حدث خطأ',
  description = 'عذراً، حدث خطأ أثناء تحميل البيانات.',
  onRetry 
}: { 
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6 text-6xl">⚠️</div>
      
      <h3 className="mb-2 text-xl font-semibold text-neutral-900">
        {title}
      </h3>
      
      <p className="mb-6 max-w-md text-sm text-neutral-600">
        {description}
      </p>
      
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}

export default {
  EmptyState,
  NoFarmsEmptyState,
  NoFieldsEmptyState,
  NoEquipmentEmptyState,
  NoWorkPlansEmptyState,
  NoAlertsEmptyState,
  NoTasksEmptyState,
  NoTeamMembersEmptyState,
  SearchNoResultsEmptyState,
  LoadingEmptyState,
  ErrorEmptyState,
};
