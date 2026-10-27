/**
 * @fileoverview Página 404 - Gefin
 * 
 * Página exibida quando o usuário tenta acessar uma rota inexistente.
 * Apresenta o mascote Gefin com mensagem amigável e link de retorno.
 * 
 * @author Gefin Team
 * @since 1.0.0
 */

import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";
import mascot from "@/assets/gefin-mascot.png";

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Página de erro 404 (rota não encontrada).
 * 
 * Exibe o mascote Gefin com mensagem amigável e opções de navegação.
 */
const NotFound = () => {
  const location = useLocation();

  // Registra erro no console para debugging/monitoramento
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="text-center space-y-6 max-w-md animate-fade-in">
        {/* Mascote Gefin */}
        <div className="relative">
          <img 
            src={mascot} 
            alt="Gefin Mascote" 
            className="h-48 w-48 mx-auto object-contain drop-shadow-lg"
          />
          {/* Ícone de busca sobreposto */}
          <div className="absolute -top-2 -right-2 bg-primary rounded-full p-3 shadow-lg">
            <Search className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        
        {/* Código de erro com estilo */}
        <div className="space-y-2">
          <h1 className="text-7xl font-bold bg-gradient-to-r from-primary to-gefin-green bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Página não encontrada
          </h2>
        </div>
        
        {/* Mensagem explicativa */}
        <p className="text-muted-foreground text-lg leading-relaxed">
          Ops! Parece que você se perdeu. A página que você procura não existe ou foi movida.
        </p>
        
        {/* Rota tentada */}
        <div className="bg-muted/50 rounded-lg px-4 py-2 inline-block">
          <code className="text-sm text-muted-foreground">
            {location.pathname}
          </code>
        </div>
        
        {/* Botão para retornar à home */}
        <div className="pt-4">
          <Button asChild size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
            <Link to="/">
              <Home className="h-5 w-5" />
              Voltar ao Início
            </Link>
          </Button>
        </div>
        
        {/* Links auxiliares */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
          <Link to="/app" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <span>•</span>
          <Link to="/login" className="hover:text-primary transition-colors">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
