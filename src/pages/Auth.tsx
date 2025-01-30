import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Auth = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const email = `${username}@example.com`;
      console.log("Attempting login with:", { email, password });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        
        // Show a more helpful error message
        let errorMessage = "Credenciais inválidas. Use 'lucas' como usuário e 'abcd1234' como senha.";
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Usuário ou senha incorretos. Tente novamente.";
        }
        
        toast({
          variant: "destructive",
          title: "Erro ao fazer login",
          description: errorMessage,
        });
        return;
      }

      console.log("Login successful:", data);

      if (password === "abcd1234") {
        setIsFirstLogin(true);
      } else {
        navigate("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message,
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Senha alterada com sucesso",
        description: "Por favor, faça login novamente com sua nova senha.",
      });

      await supabase.auth.signOut();
      setIsFirstLogin(false);
      setNewPassword("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao alterar senha",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isFirstLogin ? "Alterar Senha" : "Login"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isFirstLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="lucas"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="abcd1234"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Alterar Senha
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;