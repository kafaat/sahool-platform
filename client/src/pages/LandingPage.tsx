import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Leaf, 
  Satellite, 
  TrendingUp, 
  Shield, 
  Zap, 
  Users,
  CheckCircle2,
  ArrowRight,
  Play
} from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("agriculture");
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const tabs = [
    { id: "agriculture", label: "الزراعة الذكية", color: "bg-emerald-500" },
    { id: "monitoring", label: "المراقبة الحية", color: "bg-blue-500" },
    { id: "analytics", label: "التحليلات", color: "bg-purple-500" },
    { id: "equipment", label: "إدارة المعدات", color: "bg-orange-500" },
    { id: "planning", label: "تخطيط العمل", color: "bg-cyan-500" },
  ];

  const features = [
    {
      icon: <Satellite className="w-8 h-8" />,
      title: "مراقبة بالأقمار الصناعية",
      description: "تتبع صحة المحاصيل ورطوبة التربة في الوقت الفعلي"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "تحليلات متقدمة",
      description: "توقعات دقيقة للإنتاجية والعائد الاستثماري"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "إدارة الآفات",
      description: "كشف مبكر وخطط علاجية ذكية"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "توفير 30%",
      description: "في استخدام الموارد والمدخلات الزراعية"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "دعم عربي كامل",
      description: "الوحيدة في السوق بدعم لغوي شامل"
    },
    {
      icon: <Leaf className="w-8 h-8" />,
      title: "زراعة مستدامة",
      description: "حلول صديقة للبيئة ومربحة"
    }
  ];

  const stats = [
    { value: "+2M", label: "هكتار تحت المراقبة" },
    { value: "+10K", label: "مزارع مستفيد" },
    { value: "15+", label: "دولة عربية" },
    { value: "30%", label: "توفير في التكاليف" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-10 w-10" />}
              <span className="text-2xl font-bold text-emerald-800">{APP_TITLE}</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-emerald-600 transition-colors">الميزات</a>
              <a href="#solutions" className="text-gray-700 hover:text-emerald-600 transition-colors">الحلول</a>
              <a href="#pricing" className="text-gray-700 hover:text-emerald-600 transition-colors">الأسعار</a>
              <a href="#contact" className="text-gray-700 hover:text-emerald-600 transition-colors">تواصل معنا</a>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700">
                تسجيل الدخول
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                ابدأ مجاناً
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="text-center max-w-5xl mx-auto mb-12">
            <h1 
              className="text-6xl md:text-7xl font-black mb-6"
              style={{
                transform: `translateY(${scrollY * 0.1}px)`,
                transition: "transform 0.1s ease-out"
              }}
            >
              <span className="text-gray-900">زراعة ذكية بقوة </span>
              <span className="text-emerald-500">الأقمار الصناعية</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              رؤى دقيقة من الفضاء لتحسين الإنتاجية وتوفير الموارد في مزرعتك
            </p>

            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    activeTab === tab.id
                      ? `${tab.color} text-white shadow-lg scale-105`
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                ابدأ تجربتك المجانية
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-lg px-8 py-6 rounded-xl"
              >
                <Play className="ml-2 h-5 w-5" />
                شاهد العرض التوضيحي
              </Button>
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div className="relative max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-3xl p-8 shadow-2xl">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div 
                    key={i}
                    className="aspect-video bg-white rounded-xl shadow-md flex items-center justify-center"
                    style={{
                      animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`
                    }}
                  >
                    <Satellite className="w-12 h-12 text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-emerald-600">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-black text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-emerald-100 text-lg">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-5xl font-black text-gray-900 mb-6">
              ميزات <span className="text-emerald-500">متقدمة</span>
            </h2>
            <p className="text-xl text-gray-600">
              كل ما تحتاجه لإدارة مزرعة ذكية ومربحة في منصة واحدة
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border-t-4 border-emerald-500"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-50 to-cyan-50 px-6">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-black text-gray-900 mb-12">
              موثوق من قبل <span className="text-emerald-500">آلاف المزارعين</span>
            </h2>
            
            <div className="bg-white p-10 rounded-3xl shadow-xl">
              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-8 h-8 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              
              <p className="text-2xl text-gray-700 mb-6 leading-relaxed">
                "منصة سَهول غيرت طريقة إدارتي للمزرعة. وفرت 30% من تكاليف الري وزادت إنتاجيتي بنسبة 35%. الدعم العربي الكامل ميزة رائعة!"
              </p>
              
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">أحمد المزروعي</div>
                  <div className="text-gray-600">مزارع - الإمارات العربية المتحدة</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-3xl p-12 md:p-16 text-center shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              ابدأ رحلتك نحو الزراعة الذكية اليوم
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              تجربة مجانية لمدة 30 يوماً • بدون بطاقة ائتمان • إلغاء في أي وقت
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-10 py-6 rounded-xl shadow-lg"
              >
                ابدأ الآن مجاناً
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-emerald-800 text-lg px-10 py-6 rounded-xl"
              >
                تحدث مع خبير
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-8 text-emerald-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>إعداد في 5 دقائق</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>دعم فني 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>تحديثات مجانية</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">منصة سَهول</h3>
              <p className="text-gray-400">
                زراعة ذكية، مستقبل مستدام
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">الحلول</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400">الزراعة الذكية</a></li>
                <li><a href="#" className="hover:text-emerald-400">المراقبة الحية</a></li>
                <li><a href="#" className="hover:text-emerald-400">التحليلات</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">الشركة</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400">من نحن</a></li>
                <li><a href="#" className="hover:text-emerald-400">المدونة</a></li>
                <li><a href="#" className="hover:text-emerald-400">الوظائف</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">تواصل معنا</h4>
              <ul className="space-y-2 text-gray-400">
                <li>info@sahool.com</li>
                <li>+971 50 123 4567</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 منصة سَهول. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
