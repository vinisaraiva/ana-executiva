/**
 * @fileoverview Seção de FAQ (Perguntas Frequentes) - DrGeFin
 * 
 * Exibe as perguntas mais comuns sobre o produto em formato
 * de acordeão (accordion) expansível.
 * 
 * Usa o componente Accordion do shadcn/ui.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Interface para um item de FAQ.
 */
interface FAQItem {
  /** Pergunta a ser exibida */
  question: string;
  /** Resposta para a pergunta */
  answer: string;
}

/**
 * Props do componente FAQSection.
 */
interface FAQSectionProps {
  /** Lista de perguntas e respostas (usa padrão se não fornecido) */
  faqs?: FAQItem[];
}

// ============================================================================
// DADOS PADRÃO
// ============================================================================

/**
 * FAQs padrão exibidos quando nenhum é fornecido via props.
 */
const defaultFaqs: FAQItem[] = [
  {
    question: 'Preciso de conhecimento técnico?',
    answer: 'Não! O DrGeFin foi feito para ser simples. Basta fazer upload do seu arquivo e começar a conversar com a IA.'
  },
  {
    question: 'Meus dados estão seguros?',
    answer: 'Sim. Usamos criptografia e isolamento de dados por empresa (RLS). Seus dados nunca são compartilhados.'
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim, você pode cancelar sua assinatura quando quiser, sem taxas adicionais.'
  },
  {
    question: 'Quais formatos de arquivo são suportados?',
    answer: 'Suportamos Excel (.xlsx, .xls) e CSV. O sistema detecta automaticamente as colunas.'
  }
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Seção de FAQ com acordeão expansível.
 * 
 * Permite apenas um item aberto por vez (collapsible + type="single").
 * 
 * @param faqs - Lista de perguntas e respostas (usa padrão se não fornecido)
 * 
 * @example
 * // Com FAQs customizados
 * <FAQSection faqs={[
 *   { question: 'Pergunta?', answer: 'Resposta.' }
 * ]} />
 * 
 * // Com FAQs padrão
 * <FAQSection />
 */
export function FAQSection({ faqs = defaultFaqs }: FAQSectionProps) {
  return (
    <section id="faq" className="py-20 px-4">
      <div className="container mx-auto max-w-3xl">
        
        {/* ================================================================ */}
        {/* CABEÇALHO */}
        {/* ================================================================ */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas sobre o DrGeFin
          </p>
        </div>
        
        {/* ================================================================ */}
        {/* ACORDEÃO */}
        {/* ================================================================ */}
        {/* type="single": apenas um item aberto por vez */}
        {/* collapsible: permite fechar todos os itens */}
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              {/* Pergunta (trigger para abrir/fechar) */}
              <AccordionTrigger className="text-left text-foreground hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              {/* Resposta (conteúdo expansível) */}
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
