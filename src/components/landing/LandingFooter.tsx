/**
 * @fileoverview Rodapé da Landing Page - DrGeFin
 * 
 * Rodapé completo com:
 * - Logo e descrição da marca
 * - Links do produto
 * - Links de conta
 * - Links legais (privacidade, termos)
 * - Copyright
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Link } from 'react-router-dom';
import gefeinMascotBust from '@/assets/gefin-mascot-bust.png';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Rodapé da landing page com links e informações da marca.
 * 
 * Layout em grid responsivo:
 * - Mobile: 1 coluna
 * - Desktop: 5 colunas (2 para marca, 3 para links)
 * 
 * @example
 * <LandingFooter />
 */
export function LandingFooter() {
  // Ano atual para o copyright
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative bg-gradient-to-b from-muted/50 to-muted py-12 px-4 overflow-hidden">
      
      {/* ================================================================== */}
      {/* DECORAÇÕES */}
      {/* ================================================================== */}
      {/* Linha de gradiente no topo */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      {/* Blur decorativo centralizado */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto relative z-10">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          
          {/* ============================================================== */}
          {/* MARCA E DESCRIÇÃO (2 colunas) */}
          {/* ============================================================== */}
          <div className="md:col-span-2">
            {/* Logo com hover */}
            <div className="flex items-center gap-3 mb-4 group">
              <div className="relative">
                <div className="absolute inset-0 bg-success/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <img 
                  src={gefeinMascotBust} 
                  alt="Dr. GeFin" 
                  className="relative h-12 w-12 object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="font-bold text-2xl text-foreground group-hover:text-primary transition-colors">DrGeFin</span>
            </div>
            
            {/* Descrição da marca */}
            <p className="text-muted-foreground max-w-md leading-relaxed">
              Seu assistente financeiro com IA. Transforme seus dados de vendas em insights 
              acionáveis para aumentar sua margem de lucro.
            </p>
          </div>
          
          {/* ============================================================== */}
          {/* LINKS DO PRODUTO */}
          {/* ============================================================== */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Produto</h4>
            <ul className="space-y-3">
              {[
                { href: '#features', label: 'Recursos' },
                { href: '#pricing', label: 'Planos' },
                { href: '#faq', label: 'FAQ' },
              ].map((link) => (
                <li key={link.href}>
                  <a 
                    href={link.href} 
                    className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
                  >
                    {/* Linha animada que aparece no hover */}
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* ============================================================== */}
          {/* LINKS DE CONTA */}
          {/* ============================================================== */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Conta</h4>
            <ul className="space-y-3">
              {[
                { to: '/login', label: 'Entrar' },
                { to: '/login', label: 'Criar conta' },
              ].map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.to} 
                    className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ============================================================== */}
          {/* LINKS LEGAIS */}
          {/* ============================================================== */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-3">
              {[
                { to: '/privacidade', label: 'Política de Privacidade' },
                { to: '/termos', label: 'Termos de Uso' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* ================================================================ */}
        {/* COPYRIGHT */}
        {/* ================================================================ */}
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© {currentYear} DrGeFin. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
