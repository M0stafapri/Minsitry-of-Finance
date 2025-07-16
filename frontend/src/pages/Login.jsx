import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Alert, AlertDescription } from "@/components/ui/alert.jsx";
import { useToast } from "@/components/ui/use-toast.js";
import { userAPI } from "../api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // التحقق من المدخلات
    if (!username || !password) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      setIsLoading(false);
      return;
    }

    try {
      console.log("محاولة تسجيل الدخول باستخدام:", { username, password: "***" });
      
      // استخدام API للخلفية بدلاً من localStorage
      const response = await userAPI.login({ username, password });
      
      if (response.status === "success") {
        const { token, employee } = response.data;
        
        console.log("تم تسجيل الدخول بنجاح", employee);

        // حفظ بيانات المستخدم والتوكن في localStorage
        const userData = {
          id: employee._id,
          name: employee.name,
          username: employee.username,
          role: employee.role,
          position: employee.position,
          permissions: employee.permissions
        };
        
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('authToken', token);
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${userData.name}!`,
          duration: 3000
        });

        // توجيه المستخدم إلى الصفحة الرئيسية
        console.log(`توجيه المستخدم إلى الصفحة الرئيسية. الدور: ${userData.role}`);
        navigate('/');
      } else {
        setError('فشل في تسجيل الدخول');
      }
    } catch (error) {
      console.error("خطأ في تسجيل الدخول:", error);
      
      // التعامل مع أخطاء API
      let errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
      
      if (error.status === 401) {
        errorMessage = 'اسم المستخدم أو كلمة المرور غير صحيحة';
      } else if (error.status === 403) {
        errorMessage = 'حساب الموظف غير نشط. يرجى التواصل مع الإدارة.';
      } else if (error.status === 0) {
        errorMessage = 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: errorMessage,
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4">
      <img 
        src="/assets/img/logo.png" 
        alt="Ministry of Finance Logo" 
        className="h-32 w-32 mb-8 rounded-full border-4 border-primary bg-white shadow-2xl drop-shadow-xl transition-transform duration-300 hover:scale-105" 
        style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)' }}
      />
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-bold text-primary">مرحباً بكم</CardTitle>
          <CardDescription className="text-lg">
          وزارة المالية سلطة التصديق الالكتروني
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">كلمة المرور</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            تسجيل الدخول للوصول إلى حسابك
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
