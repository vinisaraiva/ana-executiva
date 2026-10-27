/**
 * @fileoverview Hook de Detecção de Dispositivo Mobile - DrGeFin
 * 
 * Este hook detecta se o usuário está acessando a aplicação
 * de um dispositivo mobile (largura < 768px).
 * 
 * Utiliza a API matchMedia para detectar mudanças em tempo real,
 * respondendo automaticamente quando o usuário redimensiona a janela.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import * as React from "react";

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Breakpoint de largura em pixels que define dispositivo mobile.
 * Baseado no breakpoint 'md' do Tailwind CSS (768px).
 */
const MOBILE_BREAKPOINT = 768;

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook para detectar se o dispositivo atual é mobile.
 * 
 * Usa a API window.matchMedia para monitorar mudanças de tamanho
 * da viewport em tempo real, sem necessidade de polling.
 * 
 * @returns boolean - true se a largura da viewport for menor que 768px
 * 
 * @example
 * const isMobile = useIsMobile();
 * 
 * return (
 *   <div>
 *     {isMobile ? (
 *       <MobileMenu />
 *     ) : (
 *       <DesktopMenu />
 *     )}
 *   </div>
 * );
 */
export function useIsMobile() {
  // undefined inicial para evitar flash de conteúdo errado durante SSR/hidratação
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Cria media query para detectar larguras menores que o breakpoint
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    /**
     * Handler chamado quando a media query muda de estado.
     * Atualiza o estado baseado na largura atual da janela.
     */
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Adiciona listener para mudanças futuras
    mql.addEventListener("change", onChange);
    
    // Define valor inicial baseado na largura atual
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    // Cleanup: remove listener quando o componente desmonta
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Retorna false se undefined (durante hidratação) para evitar erros
  return !!isMobile;
}
