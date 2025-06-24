import { Heart, ArrowRight, Pill, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useTheme } from "@/components/ui/theme-provider";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const teamMembers = [
    { name: "Apeksha Sharma" },
    { name: "Vaishnavi Singh" },
    { name: "Gunjal Mandawkar" },
    { name: "Vidhita Bais" },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="wellness-gradient min-h-screen">
          {/* Navigation */}
          <nav className="relative z-10 flex items-center justify-between p-6 md:px-12">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Heart className="text-primary text-xl" />
              </div>
              <span className="text-white font-bold text-xl">Swaasth Buddy</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/login")}
                className="text-white hover:text-accent"
              >
                Login
              </Button>
              <Button variant="ghost" onClick={toggleTheme} className="text-white hover:text-accent">
                <i className="fas fa-moon"></i>
              </Button>
            </div>
          </nav>

          {/* Hero Section */}
          <div className="relative z-10 flex items-center justify-center min-h-[80vh] px-6">
            <div className="text-center text-white max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
                Your Digital<br />
                <span className="text-accent">Wellness Companion</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90 animate-slide-up">
                A comprehensive health platform designed specifically for elderly care with intuitive
                reminders, health tracking, and family connectivity.
              </p>
              <Button
                onClick={() => setLocation("/login")}
                className="bg-white text-primary px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 animate-bounce-in shadow-2xl"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800 dark:text-gray-100">
            Comprehensive Health Management
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Pill className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">Medicine Reminders</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Never miss a dose with intelligent medication scheduling and low stock alerts.
              </p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">Health Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Upload reports and get personalized insights with exercise recommendations.
              </p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">Smart Scheduling</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Organize daily activities with intelligent time management and reminders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800 dark:text-gray-100">
            Meet Our Team
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => {
              const colors = ["bg-primary", "bg-secondary", "bg-accent", "bg-primary"];
              return (
                <div key={member.name} className="text-center">
                  <div
                    className={`w-24 h-24 ${colors[index]} rounded-full flex items-center justify-center mx-auto mb-4`}
                  >
                    <i className="fas fa-user text-white text-2xl"></i>
                  </div>
                  <h3 className="font-semibold text-lg dark:text-gray-100">{member.name}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
