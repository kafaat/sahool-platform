import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tractor, BarChart3, Bell, MapPin, ArrowRight } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // إذا كان المستخدم مسجل دخول، انتقل للوحة التحكم
  if (isAuthenticated && user) {
    setLocation("/dashboard");
    return null;
  }

  const features = [
    {
      icon: Tractor,
      title: "إدارة المعدات",
      description: "تتبع ومراقبة جميع معداتك الزراعية في الوقت الفعلي",
    },
    {
      icon: MapPin,
      title: "خرائط الدقة",
      description: "تحليل دقيق للحقول وتوصيات مخصصة لكل منطقة",
    },
    {
      icon: BarChart3,
      title: "تحليلات متقدمة",
      description: "رؤى شاملة وتقارير تفصيلية لتحسين الإنتاجية",
    },
    {
      icon: Bell,
      title: "تنبيهات ذكية",
      description: "إشعارات فورية للحالات الحرجة والصيانة الدورية",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-8 w-8" />}
            <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>تسجيل الدخول</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-5xl font-bold mb-6 text-green-900">
            زراعة ذكية، مستقبل مستدام
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            منصة سَهول توفر لك أدوات متقدمة لإدارة مزرعتك بكفاءة وذكاء، من خلال
            تقنيات الذكاء الاصطناعي والتحليلات المتقدمة
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild className="bg-green-600 hover:bg-green-700">
              <a href={getLoginUrl()}>
                ابدأ الآن
                <ArrowRight className="mr-2 h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline">
              تعرف على المزيد
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">الميزات الرئيسية</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-lg border hover:shadow-lg transition-shadow"
              >
                <feature.icon className="h-12 w-12 text-green-600 mb-4" />
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">جاهز للبدء؟</h3>
          <p className="text-xl mb-8 opacity-90">
            انضم إلى آلاف المزارعين الذين يستخدمون سَهول لتحسين إنتاجيتهم
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href={getLoginUrl()}>
              ابدأ مجاناً
              <ArrowRight className="mr-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 {APP_TITLE}. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
