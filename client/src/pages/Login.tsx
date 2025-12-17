import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getGoogleLoginUrl } from "@/const";

export default function Login() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Register form
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    isDirector: false,
    directorCode: "",
  });

  const loginMutation = trpc.auth.loginLocal.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success("Login realizado com sucesso!");
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Redirecionar para dashboard após login bem-sucedido
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      }
    },
    onError: (error: any) => {
      const errorMsg = error?.message || "Erro ao fazer login";
      setError(errorMsg);
      toast.error(errorMsg);
    },
  });

  const registerMutation = trpc.auth.registerLocal.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success("Cadastro realizado com sucesso! Faça login para continuar.");
        setActiveTab("login");
        setRegisterData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          isDirector: false,
          directorCode: "",
        });
        setLoginData({ email: registerData.email, password: registerData.password });
      }
    },
    onError: (error: any) => {
      const errorMsg = error?.message || "Erro ao cadastrar";
      setError(errorMsg);
      toast.error(errorMsg);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!loginData.email || !loginData.password) {
      setError("Preencha todos os campos");
      setLoading(false);
      return;
    }

    loginMutation.mutate({
      email: loginData.email,
      password: loginData.password,
    });
    setLoading(false);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!registerData.name || !registerData.email || !registerData.password) {
      setError("Preencha todos os campos obrigatórios");
      setLoading(false);
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError("As senhas não correspondem");
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (registerData.isDirector && !registerData.directorCode) {
      setError("Código de diretor é obrigatório para registrar como diretor");
      setLoading(false);
      return;
    }

    registerMutation.mutate({
      name: registerData.name,
      email: registerData.email,
      password: registerData.password,
      isDirector: registerData.isDirector,
      directorCode: registerData.directorCode,
    });
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    const googleLoginUrl = getGoogleLoginUrl();
    if (googleLoginUrl) {
      window.location.href = googleLoginUrl;
    } else {
      toast.error("Google OAuth não está configurado");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <span className="text-4xl">🎮</span>
          </div>
          <h1 className="text-3xl font-bold font-ubuntu text-primary mb-2">
            Orc'estra DiCoM
          </h1>
          <p className="text-muted-foreground">
            Gestão Gamificada de Tarefas
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Cadastro</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Bem-vindo de volta</CardTitle>
                <CardDescription>
                  Faça login com sua conta para continuar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      disabled={loginMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      disabled={loginMutation.isPending}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Entrando..." : "Entrar"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-muted-foreground/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Ou continue com
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Não tem uma conta?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="text-primary hover:underline font-medium"
                    >
                      Cadastre-se
                    </button>
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Criar conta</CardTitle>
                <CardDescription>
                  Cadastre-se para começar a usar o Orc'estra DiCoM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nome Completo</Label>
                    <Input
                      id="register-name"
                      placeholder="Seu Nome"
                      value={registerData.name}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, name: e.target.value })
                      }
                      disabled={registerMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, email: e.target.value })
                      }
                      disabled={registerMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, password: e.target.value })
                      }
                      disabled={registerMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••"
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          confirmPassword: e.target.value,
                        })
                      }
                      disabled={registerMutation.isPending}
                    />
                  </div>

                  {/* Director Checkbox */}
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <input
                      type="checkbox"
                      id="is-director"
                      checked={registerData.isDirector}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          isDirector: e.target.checked,
                        })
                      }
                      disabled={registerMutation.isPending}
                      className="w-4 h-4 rounded"
                    />
                    <Label htmlFor="is-director" className="cursor-pointer flex-1 m-0">
                      Sou diretor da DiCoM
                    </Label>
                  </div>

                  {/* Director Code */}
                  {registerData.isDirector && (
                    <div className="space-y-2">
                      <Label htmlFor="director-code">Código de Diretor</Label>
                      <Input
                        id="director-code"
                        type="password"
                        placeholder="Código de acesso"
                        value={registerData.directorCode}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            directorCode: e.target.value,
                          })
                        }
                        disabled={registerMutation.isPending}
                      />
                      <p className="text-xs text-muted-foreground">
                        Solicite o código ao administrador
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-muted-foreground/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Ou continue com
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Já tem uma conta?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="text-primary hover:underline font-medium"
                    >
                      Faça login
                    </button>
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Demo Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900 font-medium mb-2">🧪 Dados de Teste:</p>
          <p className="text-xs text-blue-800">
            <strong>Membro:</strong> membro@test.com / senha123
          </p>
          <p className="text-xs text-blue-800">
            <strong>Diretor:</strong> diretor@test.com / senha123
          </p>
        </div>
      </div>
    </div>
  );
}
