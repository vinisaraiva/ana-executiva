/**
 * @fileoverview Header da Landing Page - DrGeFin
 * 
 * Componente de cabeçalho fixo da página inicial (landing page).
 * Inclui logo, navegação desktop, menu hambúrguer mobile e botões de ação.
 * 
 * Características:
 * - Fixo no topo com efeito de blur no fundo
 * - Navegação responsiva (desktop/mobile)
 * - Menu lateral (Sheet) para dispositivos móveis
 * - Links de âncora para seções da página
 * - Animação sutil ao passar o mouse nos links
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import gefeinMascotBust from '@/assets/gefin-mascot-bust.png';

// ============================================================================
// CONFIGURAÇÃO DE NAVEGAÇÃO
// ============================================================================

/**
 * Links de navegação da landing page.
 * Cada link aponta para uma seção da página (âncora).
 */
const navLinks = [
  { href: '#features', label: 'Recursos' },
  { href: '#how-it-works', label: 'Como Funciona' },
  { href: '#calculadora', label: 'Calculadora' },
  { href: '#pricing', label: 'Planos' },
  { href: '#faq', label: 'FAQ' },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Header fixo da landing page com navegação responsiva.
 * 
 * Funcionalidades:
 * - Logo com link para home
 * - Navegação desktop com hover animado
 * - Menu hambúrguer mobile usando Sheet (painel lateral)
 * - Botões de "Entrar" e "Começar Grátis"
 * 
 * @example
 * <LandingHeader />
 */
export function LandingHeader() {
  // Estado para controlar abertura/fechamento do menu mobile
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Fecha o menu mobile quando um link é clicado.
   * Necessário porque os links de âncora não causam navegação de página.
   */
  const handleLinkClick = () => setIsOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 animate-fade-in">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* ================================================================ */}
        {/* LOGO E MARCA */}
        {/* ================================================================ */}
        <Link to="/" className="flex items-center gap-3 group">
          {/* Container da imagem com efeito de glow no hover */}
          <div className="relative">
            <div className="absolute inset-0 bg-success/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <img 
              src={gefeinMascotBust} 
              alt="Dr. GeFin" 
              className="relative h-10 w-10 object-contain group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <span className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">DrGeFin</span>
        </Link>
        
        {/* ================================================================ */}
        {/* NAVEGAÇÃO DESKTOP */}
        {/* ================================================================ */}
        {/* Visível apenas em telas médias ou maiores (md:) */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.href}
              href={link.href} 
              className="relative text-muted-foreground hover:text-foreground transition-colors group"
            >
              {link.label}
              {/* Barra animada que aparece no hover */}
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </a>
          ))}
        </nav>
        
        {/* ================================================================ */}
        {/* BOTÕES DESKTOP */}
        {/* ================================================================ */}
        {/* Visível apenas em telas médias ou maiores (md:) */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" className="hover:bg-primary/5" asChild>
            <Link to="/login">Entrar</Link>
          </Button>
          <Button className="bg-gradient-to-r from-primary to-success hover:opacity-90 shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all" asChild>
            <Link to="/login">Começar Grátis</Link>
          </Button>
        </div>

        {/* ================================================================ */}
        {/* MENU MOBILE */}
        {/* ================================================================ */}
        {/* Visível apenas em telas pequenas (escondido em md:) */}
        <div className="flex md:hidden items-center gap-2">
          {/* Botão CTA compacto para mobile */}
          <Button 
            className="bg-gradient-to-r from-primary to-success hover:opacity-90 shadow-md text-sm px-3" 
            size="sm"
            asChild
          >
            <Link to="/login">Começar</Link>
          </Button>
          
          {/* Menu hambúrguer usando Sheet (painel lateral) */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/5">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            
            {/* Conteúdo do painel lateral */}
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              {/* Cabeçalho do painel com logo */}
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-3">
                  <img 
                    src={gefeinMascotBust} 
                    alt="Dr. GeFin" 
                    className="h-8 w-8 object-contain"
                  />
                  <span className="font-bold text-lg">DrGeFin</span>
                </SheetTitle>
              </SheetHeader>
              
              {/* Links de navegação */}
              <nav className="flex flex-col gap-1 mt-8">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={handleLinkClick} // Fecha o menu ao clicar
                    className="flex items-center px-3 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              
              {/* Botões de ação no rodapé do painel */}
              <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-border">
                <Button variant="outline" className="w-full justify-center" asChild>
                  <Link to="/login" onClick={handleLinkClick}>Entrar</Link>
                </Button>
                <Button 
                  className="w-full justify-center bg-gradient-to-r from-primary to-success hover:opacity-90" 
                  asChild
                >
                  <Link to="/login" onClick={handleLinkClick}>Começar Grátis</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
