/**
 * @fileoverview Página Index/Fallback - DrGeFin
 * 
 * Página de fallback que é exibida quando a rota "/" é acessada
 * sem redirecionamento para a landing page.
 * 
 * Em produção, esta página raramente é vista pois o roteador
 * redireciona "/" para a LandingPage.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Página de fallback/placeholder.
 * 
 * Exibe mensagem de boas-vindas genérica.
 * Normalmente não é exibida em produção.
 */
const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
      </div>
    </div>
  );
};

export default Index;
